import type { Engine } from './types'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export const mockEngine: Engine = {
    async load(onProgress) {
        // Simulates a 550 MB download in 20 steps
        const total = 550_000_000
        for (let i = 1; i <= 20; i++) {
            await sleep(100)
            onProgress((total / 20) * i, total)
        }
    },

    async generate(_messages, options, onToken, signal) {
        const reply =
            'That sounds like a lot to carry. It seems the urgency hit first. Do you want to add anything?'
        const words = reply.split(' ').slice(0, options.maxTokens)
        let out = ''
        for (const w of words) {
            if (signal.aborted) break
            await sleep(60)
            const chunk = (out ? ' ' : '') + w
            out += chunk
            onToken(chunk)
        }
        return out
    },
}