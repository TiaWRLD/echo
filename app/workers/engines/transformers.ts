import {
  pipeline,
  env,
  TextStreamer,
  InterruptableStoppingCriteria,
  type TextGenerationPipeline,
} from '@huggingface/transformers'
import type { ChatMessage, GenerateOptions } from '../protocol'
import type { Engine } from './types'

// Configurabili da .env senza toccare il codice
const MODEL_ID = import.meta.env.VITE_MODEL_ID ?? 'onnx-community/gemma-3-1b-it-ONNX'
// q4 = ~859 MB, q4f16 = ~763 MB ma richiede la feature WebGPU "shader-f16"
const DTYPE = (import.meta.env.VITE_DTYPE ?? 'q4') as 'q4' | 'q4f16'
// Fallback: host alternativo (Vercel/R2) che replica la struttura dei file del repo HF
const MODEL_HOST = import.meta.env.VITE_MODEL_HOST as string | undefined

export function createTransformersEngine(): Engine {
  let generator: TextGenerationPipeline | null = null

  return {
    async load(onProgress) {
      // Nel worker WebGPU c'è su navigator.gpu: se manca, errore chiaro (UI nel giorno 5)
      const adapter = await (navigator as any).gpu?.requestAdapter()
      if (!adapter) throw new Error('WEBGPU_UNAVAILABLE')

      if (MODEL_HOST) env.remoteHost = MODEL_HOST
      // useBrowserCache è già true di default: i file vanno in Cache API ("transformers-cache")

      generator = (await pipeline('text-generation', MODEL_ID, {
        dtype: DTYPE,
        device: 'webgpu',
        progress_callback: (info) => {
          // v4 emette anche un evento già aggregato su tutti i file
          if (info.status === 'progress_total') {
            onProgress(info.loaded, info.total)
          }
        },
      })) as TextGenerationPipeline
    },

    async generate(messages: ChatMessage[], options: GenerateOptions, onToken, signal): Promise<string> {
      if (signal.aborted) return ''
      if (!generator) throw new Error('ENGINE_NOT_LOADED')

      const stopping = new InterruptableStoppingCriteria()
      const onAbort = () => stopping.interrupt()
      signal.addEventListener('abort', onAbort, { once: true })

      let full = '' // testo completo: il worker lo rimanda alla UI nel messaggio 'done'
      let tokens = 0
      const t0 = performance.now()
      let firstTokenAt = 0

      const streamer = new TextStreamer(generator.tokenizer, {
        skip_prompt: true,
        skip_special_tokens: true,
        callback_function: (text: string) => {
          full += text
          onToken(text)
        },
        token_callback_function: () => {
          if (!firstTokenAt) firstTokenAt = performance.now()
          tokens++
        },
      })

      try {
        if (import.meta.env.DEV) {
          const formatted = generator.tokenizer.apply_chat_template(messages, {
            tokenize: false,
            add_generation_prompt: true,
          })
          console.info('[prompt]', formatted)
        }
        await generator(messages, {
          max_new_tokens: options.maxTokens,
          do_sample: true,
          temperature: options.temperature,
          top_k: 40,
          streamer,
          stopping_criteria: stopping,
        })
      } finally {
        signal.removeEventListener('abort', onAbort)
        if (import.meta.env.DEV && tokens > 0) {
          const end = performance.now()
          console.info('[bench transformers]', {
            ttftMs: Math.round(firstTokenAt - t0),
            tokens,
            tokPerSec: +(tokens / ((end - firstTokenAt) / 1000)).toFixed(1),
          })
        }
      }
      return full
    },
  }
}