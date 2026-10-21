import { FilesetResolver, LlmInference } from '@mediapipe/tasks-genai'
import type { ChatMessage, GenerateOptions } from '../protocol'
import type { Engine } from './types'

// Nessun default: il repo litert-community è gated, serve un URL che hai ospitato tu
const MODEL_URL = import.meta.env.VITE_MEDIAPIPE_MODEL_URL as string | undefined
// I file wasm li copiamo noi in public/ (niente CDN di terzi a runtime)
const WASM_BASE = `${import.meta.env.BASE_URL}mediapipe-wasm`
const CACHE_NAME = 'echo-model-v1'

// Gemma non ha un ruolo "system": il template lo fonde nel primo turno utente
function toGemmaPrompt(messages: ChatMessage[]): string {
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n')
  let prompt = ''
  let firstUser = true
  for (const m of messages) {
    if (m.role === 'system') continue
    const role = m.role === 'assistant' ? 'model' : 'user'
    let text = m.content
    if (role === 'user' && firstUser && system) {
      text = `${system}\n\n${text}`
      firstUser = false
    }
    prompt += `<start_of_turn>${role}\n${text}<end_of_turn>\n`
  }
  return prompt + '<start_of_turn>model\n'
}

// Scarica (una sola volta) il file nella Cache API contando i byte, poi lo restituisce
async function fetchModelCached(url: string, onProgress: (loaded: number, total: number) => void) {
  const cache = await caches.open(CACHE_NAME)
  const hit = await cache.match(url)
  if (hit) {
    const size = Number(hit.headers.get('content-length')) || 1
    onProgress(size, size)
    return hit
  }
  const res = await fetch(url)
  if (!res.ok || !res.body) throw new Error(`MODEL_DOWNLOAD_FAILED_${res.status}`)
  const total = Number(res.headers.get('content-length')) || 0
  let loaded = 0
  const counted = res.body.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          loaded += chunk.byteLength
          onProgress(loaded, total)
          controller.enqueue(chunk)
        },
      }),
  )
  // put() consuma lo stream: il download avviene qui, il file finisce in cache
  await cache.put(url, new Response(counted, { headers: res.headers }))
  return (await cache.match(url))!
}

export function createMediaPipeEngine(): Engine {
  let llm: LlmInference | null = null

  return {
    async load(onProgress) {
      if (!MODEL_URL) throw new Error('MODEL_URL_MISSING')
      const adapter = await (navigator as any).gpu?.requestAdapter()
      if (!adapter) throw new Error('WEBGPU_UNAVAILABLE')

      const res = await fetchModelCached(MODEL_URL, (loaded, total) => onProgress(loaded, total))
      // true = loader wasm come ES module (nel worker 'es' non esiste importScripts)
      const fileset = await FilesetResolver.forGenAiTasks(WASM_BASE, true)

      llm = await LlmInference.createFromOptions(fileset, {
        baseOptions: { modelAssetBuffer: res.body!.getReader() },
        maxTokens: 1024, // attenzione: è la finestra TOTALE (prompt + risposta)
        topK: 40,
        temperature: 0.65,
        randomSeed: 1,
      })
    },

    async generate(messages: ChatMessage[], options: GenerateOptions, onToken, signal): Promise<string> {
      if (!llm) throw new Error('ENGINE_NOT_LOADED')
      // I parametri di sampling si cambiano con setOptions, non per singola chiamata
      await llm.setOptions({ temperature: options.temperature, topK: 40 })

      const maxOut = options.maxTokens
      let full = ''
      let steps = 0
      let firstTokenAt = 0
      const t0 = performance.now()
      const onAbort = () => llm!.cancelProcessing()
      signal.addEventListener('abort', onAbort, { once: true })

      try {
        await llm.generateResponse(toGemmaPrompt(messages), (partial) => {
          if (!firstTokenAt) firstTokenAt = performance.now()
          steps++
          full += partial
          onToken(partial)
          // MediaPipe non ha un limite "solo output": lo imponiamo noi
          if (steps >= maxOut) llm!.cancelProcessing()
        })
      } finally {
        signal.removeEventListener('abort', onAbort)
        if (import.meta.env.DEV && steps > 0) {
          const end = performance.now()
          console.info('[bench mediapipe]', {
            ttftMs: Math.round(firstTokenAt - t0),
            steps,
            tokPerSec: +(steps / ((end - firstTokenAt) / 1000)).toFixed(1),
          })
        }
      }
      return full
    },
  }
}