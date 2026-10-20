import type { Engine } from './types'
import { mockEngine } from './mock'

export function createEngine(): Engine {
    // Later: switch on import.meta.env.VITE_ENGINE ('mediapipe' | 'transformers')
    return mockEngine
}