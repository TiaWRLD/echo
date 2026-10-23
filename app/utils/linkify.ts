export interface TextPart {
    text: string
    href?: string
}

// Only matches http(s) links and findahelpline.com. Nothing else becomes a link.
const LINK_RE = /(https?:\/\/[^\s]+|\bfindahelpline\.com[^\s]*)/gi

export function linkify(text: string): TextPart[] {
    const parts: TextPart[] = []
    let last = 0

    for (const match of text.matchAll(LINK_RE)) {
        const start = match.index ?? 0
        // Trailing punctuation belongs to the sentence, not to the link.
        const url = match[0].replace(/[.,;:!?)]+$/, '')

        if (start > last) parts.push({ text: text.slice(last, start) })
        parts.push({ text: url, href: /^https?:\/\//i.test(url) ? url : `https://${url}` })
        last = start + url.length
    }

    if (last < text.length) parts.push({ text: text.slice(last) })
    return parts
}