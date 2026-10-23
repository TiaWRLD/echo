import type { ChatMessage } from '~/workers/protocol'

export const MAX_LETTER_CHARS = 1200

export const LETTER_INTRO =
    'Write the message you would never send, exactly as it comes, as angry or as hurt as it is. ' +
    'Nothing you write here is sent anywhere. Echo will turn it into a calmer version, only for you.'

export const LETTER_RESULT_INTRO = 'Here is a calmer version of what you wrote:'
export const LETTER_NOTE = 'It stays here. It is not sent anywhere, and you do not have to do anything with it.'

// Used when the model returns something unusable.
export const LETTER_FALLBACK =
    'I could not turn this into a calm version this time. What you wrote is still yours. You can try again, or let it go.'

export const LETTER_SYSTEM = `You are Echo. The person wrote an angry or hurt message that they will never send.
Rewrite it as a calm letter in the first person, addressed to the same person.
- Keep the feelings and the facts the person gave. Remove insults, threats and blame.
- Write ONLY the letter, 3 to 6 short sentences. No title, no introduction, no comment after it.
- Do not add facts, excuses or forgiveness the person did not express.
- Never suggest sending, sharing or delivering it. Never give advice or opinions.
- If the text mentions wanting to disappear or die, do not repeat it and do not agree with it.
- Plain language. No lists, no emojis.`

export const LETTER_SHOTS: ChatMessage[] = [
    {
        role: 'user',
        content: "I can't believe you forgot my birthday again. You never care about anything but yourself. I'm done covering for you.",
    },
    {
        role: 'assistant',
        content:
            'I felt hurt when my birthday passed and you did not remember it. It is not the first time, and I have been feeling that my effort goes unseen. I am tired, and I need things to be different.',
    },
    {
        role: 'user',
        content: 'My manager took credit for my report in front of everyone. I worked all weekend and he said "my analysis". I hate him.',
    },
    {
        role: 'assistant',
        content:
            'I worked all weekend on that report, and I felt invisible when it was presented as yours. I am angry and disappointed. I wanted my work to be recognised.',
    },
]