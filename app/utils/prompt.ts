import type { ChatMessage } from '~/workers/protocol'

// Gemma instruct has no 'system' role, so we merge the instructions
// into the first user message. The model only ever sees user/assistant.
export function buildMessages(
    system: string,
    shots: ChatMessage[],
    history: ChatMessage[],
): ChatMessage[] {
    const messages = [...shots, ...history].map((m) => ({ ...m }))

    const first = messages[0]
    if (first && first.role === 'user') {
        first.content = `${system}\n\n${first.content}`
    } else {
        messages.unshift({ role: 'user', content: system })
    }

    return messages
}