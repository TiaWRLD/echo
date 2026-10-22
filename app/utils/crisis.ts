const PATTERNS: RegExp[] = [
    /\bsuicid(e|al)\b/,
    /\bkill(ing)? myself\b/,
    /\bend(ing)? (my life|it all)\b/,
    /\btake my (own )?life\b/,
    /\b(want|wanna|wish|need) to die\b/,
    /\bwish i (was|were) dead\b/,
    /\bdon'?t want to (be alive|live|be here)\b/,
    /\bself[- ]?harm/,
    /\b(hurt|harm|cut|cutting) myself\b/,
    /\bbetter off without me\b/,
    /\bno reason to (live|go on)\b/,
    /\bwant to disappear\b/,
]

function normalize(text: string): string {
    return text.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ')
}

export function detectCrisis(text: string): boolean {
    const t = normalize(text)
    return PATTERNS.some((p) => p.test(t))
}

export const CRISIS_MESSAGE =
    "What you've written sounds serious, and I want you to have real support. " +
    "Echo is a tool for reflection, not a crisis service, so it can't be what you need right now. " +
    'If you might act on these thoughts or you are in immediate danger, please contact your local emergency number. ' +
    'You can find helplines in your country at findahelpline.com, and reaching out to someone you trust can help too.'