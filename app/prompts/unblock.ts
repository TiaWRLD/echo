import type { ChatMessage } from '~/workers/protocol'

export const UNBLOCK_QUESTIONS = [
    'What is the thing you need to do?',
    'What gets in the way when you think about starting?',
]

export const UNBLOCK_INTRO = "Let's find one very small way in. There is no need to solve the whole thing."
export const UNBLOCK_STEP_INTRO = 'Here is one small step, 2 to 5 minutes at most:'
export const UNBLOCK_STOP_NOTE = 'You are allowed to stop after this one step.'
export const UNBLOCK_SMALLER_INTRO = 'Smaller, then:'
export const UNBLOCK_LIMIT_NOTE = 'This is about as small as it gets. Starting is the whole job.'

// Used when the model returns something unusable.
export const UNBLOCK_FALLBACK = 'Open what you need for this task and look at it for two minutes. Nothing more.'
export const UNBLOCK_SMALLER_FALLBACK = 'Open what you need and look at it for one minute. Nothing more.'

export const STEP_SYSTEM = `You are Echo, a calm guide helping someone start something they are avoiding.
The person told you the task and what is in the way.
- Reply with ONE sentence describing a single tiny physical action that takes 2 to 5 minutes.
- Start with a verb. Make it concrete and easy to begin, like opening a file, writing one rough line, or putting one thing in place.
- Do not explain. Do not give several steps. Do not give advice or opinions.
- Do not ask a question.
- Plain language. No lists, no emojis.`

export const STEP_SHOTS: ChatMessage[] = [
    { role: 'user', content: "Task: Write my thesis introduction.\nIn the way: I don't know where to start and it feels huge." },
    { role: 'assistant', content: 'Open the document and write one rough sentence about why the topic matters to you.' },
    { role: 'user', content: "Task: Clean the kitchen.\nIn the way: It is such a mess that I get tired just looking at it." },
    { role: 'assistant', content: 'Put the dirty cups from the counter into the sink.' },
]

export const SMALLER_SYSTEM = `You are Echo, a calm guide. The person finds a small step still too big.
- Reply with ONE sentence describing a much smaller version of the same step, about 2 minutes or less.
- Start with a verb. Keep the same direction, only shrink it.
- Do not explain. Do not give several steps. Do not give advice or opinions.
- Do not ask a question.
- Plain language. No lists, no emojis.`

export const SMALLER_SHOTS: ChatMessage[] = [
    {
        role: 'user',
        content:
            "Task: Write my thesis introduction.\nIn the way: I don't know where to start and it feels huge.\n" +
            'Current step: Open the document and write one rough sentence about why the topic matters to you.',
    },
    { role: 'assistant', content: 'Open the document and read the title, nothing more.' },
    {
        role: 'user',
        content:
            'Task: Clean the kitchen.\nIn the way: It is such a mess that I get tired just looking at it.\n' +
            'Current step: Put the dirty cups from the counter into the sink.',
    },
    { role: 'assistant', content: 'Pick up one cup and put it in the sink.' },
]