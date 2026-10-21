import type { Engine } from './types'

// Import dinamici: Vite crea un chunk per motore e il worker scarica
// solo quello scelto con VITE_ENGINE (mock | transformers | mediapipe).
// ASSUNZIONE: il tuo mock esporta createMockEngine — adatta il nome se diverso.
export async function createEngine(): Promise<Engine> {
  switch (import.meta.env.VITE_ENGINE) {
    case 'transformers':
      return (await import('./transformers')).createTransformersEngine()
    case 'mediapipe':
      return (await import('./mediapipe')).createMediaPipeEngine()
    default:
      return (await import('./mock')).createMockEngine()
  }
}
