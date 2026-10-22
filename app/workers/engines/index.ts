import type { Engine } from './types'

export async function createEngine(): Promise<Engine> {
  switch (import.meta.env.VITE_ENGINE) {
    case 'mock':
      return (await import('./mock')).mockEngine
    case 'mediapipe':
      return (await import('./mediapipe')).createMediaPipeEngine()
    case 'transformers':
    default:
      return (await import('./transformers')).createTransformersEngine()
  }
}

