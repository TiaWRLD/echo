export function trimToSentences(text: string, max = 3): string {
    const clean = text.trim()
    const sentences = clean.match(/[^.!?]+[.!?]+(\s|$)/g)
    if (!sentences) return clean
    return sentences.slice(0, max).join('').trim()
}