const PATTERNS: RegExp[] = [
    /\bsuicid(e|al)\b/,
    /\bkill(ing)? myself\b/,
    /\b(end|off|unalive) myself\b/,
    /\bkms\b/,
    /\bend(ing)? (my life|it all)\b/,
    /\btak(e|ing) my (own )?life\b/,
    /\b(want|wanna|wish|need)(ing)? to die\b/,
    /\bwish i (was|were) dead\b/,
    /\b(i'?d|i would) rather (be dead|die)\b/,
    /\bbetter off dead\b/,
    /\bbetter off without me\b/,
    /\bwish i (had never been|was never|were never) born\b/,
    /\b(don'?t|do not) (want to|wanna) (be alive|live|be here|exist)\b/,
    /\b(don'?t|do not) (want to|wanna) wake up\b/,
    /\bwish i (just )?(wouldn'?t|would not|didn'?t|did not|could (just )?not) wake up\b/,
    /\bnothing to live for\b/,
    /\bno (reason|point) (to|in) (live|living|go on|going on)\b/,
    /\b(want to|wanna|wish i could) disappear\b/,
    /\bself[- ]?harm/,
    /\b(hurt|harm|cut|cutting) myself\b/,
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