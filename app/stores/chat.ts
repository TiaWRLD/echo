import type { ChatMessage } from '~/workers/protocol'
import { detectCrisis, CRISIS_MESSAGE } from '~/utils/crisis'
import { trimToSentences } from '~/utils/text'
import { buildMessages } from '~/utils/prompt'
import { VENT_SYSTEM, VENT_SHOTS } from '~/prompts/vent'
import {
    REFLECT_QUESTIONS, REFLECT_INTRO, REFLECT_CLOSING, REFLECT_THANKS,
    ACK_SYSTEM, ACK_SHOTS, HYPOTHESIS_SYSTEM, HYPOTHESIS_SHOTS,
} from '~/prompts/reflect'
import {
    UNBLOCK_QUESTIONS, UNBLOCK_INTRO, UNBLOCK_STEP_INTRO, UNBLOCK_STOP_NOTE,
    UNBLOCK_SMALLER_INTRO, UNBLOCK_LIMIT_NOTE, UNBLOCK_FALLBACK, UNBLOCK_SMALLER_FALLBACK,
    STEP_SYSTEM, STEP_SHOTS, SMALLER_SYSTEM, SMALLER_SHOTS,
} from '~/prompts/unblock'

export type Mode = 'vent' | 'reflect' | 'unblock'

export interface UiMessage {
    id: number
    role: 'user' | 'assistant'
    content: string
    kind: 'normal' | 'crisis'
}

// Each mode keeps its own conversation.
interface Session {
    messages: UiMessage[]  // what the UI shows
    turns: ChatMessage[]   // Vent: what the model sees (completed turns only)
    step: number           // Reflect / Unblock: index of the question being answered
    answers: string[]      // Reflect / Unblock: answers collected so far
    microStep: string      // Unblock: the current micro-step
    shrinks: number        // Unblock: how many times "make it smaller" was used
}

const newSession = (): Session => ({
    messages: [], turns: [], step: 0, answers: [], microStep: '', shrinks: 0,
})

const VENT_FOLLOW_UP = 'Want to add anything?'
const MAX_HISTORY_MESSAGES = 12 // ~6 turns: a 1B model has little context
const MAX_SHRINKS = 3

const stripVentQuestion = (t: string) => t.replace(/\s*want to add anything\s*\?\s*$/i, '')
const isCompleteStatement = (t: string) => /[.!]$/.test(t)

// Shown the first time a flow mode is opened (and after "start over").
const INTROS: Partial<Record<Mode, string>> = {
    reflect: `${REFLECT_INTRO}\n\n${REFLECT_QUESTIONS[0] ?? ''}`,
    unblock: `${UNBLOCK_INTRO}\n\n${UNBLOCK_QUESTIONS[0] ?? ''}`,
}

export const useChatStore = defineStore('chat', () => {
    const llm = useLLM()

    const mode = ref<Mode>('vent')
    const sessions = ref<Record<Mode, Session>>({
        vent: newSession(),
        reflect: newSession(),
        unblock: newSession(),
    })
    const isSending = ref(false)
    const error = ref<string | null>(null)

    let controller: AbortController | null = null
    let nextId = 1

    const session = computed(() => sessions.value[mode.value])
    const messages = computed(() => session.value.messages)
    const reflectDone = computed(
        () => mode.value === 'reflect' && session.value.step >= REFLECT_QUESTIONS.length,
    )
    const unblockReady = computed(
        () => mode.value === 'unblock' && session.value.step >= UNBLOCK_QUESTIONS.length,
    )
    const canShrink = computed(() => unblockReady.value && session.value.shrinks < MAX_SHRINKS)
    // After ~3 exchanges in Vent, the UI offers to move to Reflect.
    const canOfferReflect = computed(() => mode.value === 'vent' && session.value.turns.length >= 6)

    function add(s: Session, role: UiMessage['role'], content: string, kind: UiMessage['kind'] = 'normal'): UiMessage {
        s.messages.push({ id: nextId++, role, content, kind })
        return s.messages[s.messages.length - 1]!
    }

    function remove(s: Session, msg: UiMessage) {
        s.messages = s.messages.filter((m) => m.id !== msg.id)
    }

    function startIfEmpty(m: Mode) {
        const intro = INTROS[m]
        const s = sessions.value[m]
        if (!intro || s.messages.length) return
        add(s, 'assistant', intro)
    }

    // ---- Vent: open listening, max 3 sentences + fixed question ----
    async function ventTurn(s: Session, userText: string, reply: UiMessage, signal: AbortSignal): Promise<string | null> {
        const history: ChatMessage[] = [
            ...s.turns.slice(-MAX_HISTORY_MESSAGES),
            { role: 'user', content: userText },
        ]
        // buildMessages copies every message into a plain object. That matters:
        // postMessage cannot clone Vue's reactive proxies.
        const raw = await llm.generate(buildMessages(VENT_SYSTEM, VENT_SHOTS, history), {
            signal,
            onToken: (t) => { reply.content += t },
        })

        const body = trimToSentences(stripVentQuestion(raw), 3)
        if (signal.aborted && !body) return null

        const finalText = signal.aborted ? body : `${body || "I'm listening."} ${VENT_FOLLOW_UP}`
        s.turns.push(
            { role: 'user', content: userText },
            { role: 'assistant', content: finalText },
        )
        return finalText
    }

    // ---- Reflect: the code decides the step, the model only mirrors / hypothesises ----
    async function reflectTurn(s: Session, userText: string, reply: UiMessage, signal: AbortSignal): Promise<string> {
        const question = REFLECT_QUESTIONS[s.step] ?? ''
        const answers = [...s.answers, userText]
        const onToken = (t: string) => { reply.content += t }

        // Steps 1-3: one-sentence acknowledgement, then the next fixed question.
        if (s.step < REFLECT_QUESTIONS.length - 1) {
            const prompt = buildMessages(ACK_SYSTEM, ACK_SHOTS, [
                { role: 'user', content: `Question: ${question}\nAnswer: ${userText}` },
            ])
            const raw = await llm.generate(prompt, { signal, onToken, maxTokens: 60 })

            // Keep only one complete sentence that is not a question.
            const first = trimToSentences(raw, 1)
            const ack = isCompleteStatement(first) ? first : ''

            s.answers = answers
            s.step++
            return [ack, REFLECT_QUESTIONS[s.step] ?? ''].filter(Boolean).join('\n\n')
        }

        // Step 4: tentative reading of impulse vs underlying feeling.
        const summary =
            `What happened: ${answers[0]}\n` +
            `First reaction: ${answers[1]}\n` +
            `What I want to do now: ${answers[2]}\n` +
            `After ten minutes: ${answers[3]}`
        const raw = await llm.generate(
            buildMessages(HYPOTHESIS_SYSTEM, HYPOTHESIS_SHOTS, [{ role: 'user', content: summary }]),
            { signal, onToken, maxTokens: 140 },
        )
        const body = trimToSentences(raw, 3)

        s.answers = answers
        s.step++
        return /[.!?]$/.test(body) ? `${body} ${REFLECT_CLOSING}` : REFLECT_THANKS
    }

    // ---- Unblock: task -> blocker -> ONE micro-step ----
    async function unblockTurn(s: Session, userText: string, reply: UiMessage, signal: AbortSignal): Promise<string | null> {
        // Question 1: no model call. We warm up the model while the person types.
        if (s.step === 0) {
            llm.load().catch(() => {}) // a load error will show up on the next generate
            s.answers = [userText]
            s.step = 1
            return UNBLOCK_QUESTIONS[1] ?? ''
        }

        // Question 2: now we can ask the model for the micro-step.
        const task = s.answers[0] ?? ''
        const raw = await llm.generate(
            buildMessages(STEP_SYSTEM, STEP_SHOTS, [
                { role: 'user', content: `Task: ${task}\nIn the way: ${userText}` },
            ]),
            { signal, onToken: (t) => { reply.content += t }, maxTokens: 60 },
        )

        const first = trimToSentences(raw, 1)
        // Stopped before a full sentence: do not advance, the person can answer again.
        if (signal.aborted && !isCompleteStatement(first)) return null

        const step = isCompleteStatement(first) ? first : UNBLOCK_FALLBACK
        s.answers = [task, userText]
        s.microStep = step
        s.step = UNBLOCK_QUESTIONS.length
        return `${UNBLOCK_STEP_INTRO}\n\n${step}\n\n${UNBLOCK_STOP_NOTE}`
    }

    async function smallerTurn(s: Session, reply: UiMessage, signal: AbortSignal): Promise<string | null> {
        const [task = '', blocker = ''] = s.answers
        const raw = await llm.generate(
            buildMessages(SMALLER_SYSTEM, SMALLER_SHOTS, [
                { role: 'user', content: `Task: ${task}\nIn the way: ${blocker}\nCurrent step: ${s.microStep}` },
            ]),
            { signal, onToken: (t) => { reply.content += t }, maxTokens: 60 },
        )

        const first = trimToSentences(raw, 1)
        if (signal.aborted && !isCompleteStatement(first)) return null

        const step = isCompleteStatement(first) ? first : UNBLOCK_SMALLER_FALLBACK
        s.microStep = step
        s.shrinks++
        const note = s.shrinks >= MAX_SHRINKS ? `\n\n${UNBLOCK_LIMIT_NOTE}` : ''
        return `${UNBLOCK_SMALLER_INTRO}\n\n${step}${note}`
    }

    // Shared by send() and makeSmaller(): bubbles, abort controller, errors.
    async function run(
        s: Session,
        userText: string,
        turn: (reply: UiMessage, signal: AbortSignal) => Promise<string | null>,
    ) {
        error.value = null
        isSending.value = true

        try {
            add(s, 'user', userText)
            const reply = add(s, 'assistant', '')
            controller = new AbortController()
            const { signal } = controller

            try {
                const result = await turn(reply, signal)
                if (result === null) remove(s, reply)
                else reply.content = result
            } catch (e) {
                remove(s, reply)
                if ((e as Error).name !== 'AbortError') {
                    error.value = e instanceof Error ? e.message : String(e)
                }
            }
        } finally {
            controller = null
            isSending.value = false
        }
    }

    async function send(text: string) {
        const userText = text.trim()
        if (!userText || isSending.value || reflectDone.value || unblockReady.value) return

        const s = session.value

        // Crisis check runs BEFORE any model call, in every mode.
        // In Reflect and Unblock the step does not advance.
        if (detectCrisis(userText)) {
            error.value = null
            add(s, 'user', userText, 'crisis')
            add(s, 'assistant', CRISIS_MESSAGE, 'crisis')
            return
        }

        const m = mode.value
        await run(s, userText, (reply, signal) => {
            if (m === 'vent') return ventTurn(s, userText, reply, signal)
            if (m === 'reflect') return reflectTurn(s, userText, reply, signal)
            return unblockTurn(s, userText, reply, signal)
        })
    }

    // "Make it even smaller" button. It has no free text, so there is nothing to check for crisis.
    async function makeSmaller() {
        if (!canShrink.value || isSending.value) return
        const s = session.value
        await run(s, 'Make it even smaller', (reply, signal) => smallerTurn(s, reply, signal))
    }

    function stop() {
        controller?.abort()
    }

    // Clears only the current mode's conversation.
    function clear() {
        controller?.abort()
        sessions.value[mode.value] = newSession()
        error.value = null
        startIfEmpty(mode.value)
    }

    function resetAll() {
        controller?.abort()
        sessions.value = { vent: newSession(), reflect: newSession(), unblock: newSession() }
        mode.value = 'vent'
        error.value = null
    }

    function setMode(m: Mode) {
        if (isSending.value || m === mode.value) return
        mode.value = m
        startIfEmpty(m)
    }

    return {
        mode, messages, isSending, error,
        reflectDone, unblockReady, canShrink, canOfferReflect,
        send, makeSmaller, stop, clear, resetAll, setMode,
    }
})