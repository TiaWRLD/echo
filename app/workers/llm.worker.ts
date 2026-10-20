import type { WorkerRequest, WorkerResponse } from './protocol'
import { createEngine } from './engines'

const engine = createEngine()
const controllers = new Map<number, AbortController>()
let loadPromise: Promise<void> | null = null

const post = (msg: WorkerResponse) => self.postMessage(msg)

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
    const msg = e.data

    switch (msg.type) {
        case 'load': {
            // Idempotent: calling load twice must not download twice
            loadPromise ??= engine.load((loaded, total) =>
                post({ type: 'progress', loaded, total }),
            )
            try {
                await loadPromise
                post({ type: 'ready' })
            } catch (err) {
                loadPromise = null // allow retry
                post({ type: 'error', message: String(err) })
            }
            break
        }

        case 'generate': {
            const controller = new AbortController()
            controllers.set(msg.id, controller)
            try {
                await loadPromise
                const text = await engine.generate(
                    msg.messages,
                    msg.options,
                    (t) => post({ type: 'token', id: msg.id, text: t }),
                    controller.signal,
                )
                post({ type: 'done', id: msg.id, text })
            } catch (err) {
                post({ type: 'error', id: msg.id, message: String(err) })
            } finally {
                controllers.delete(msg.id)
            }
            break
        }

        case 'abort':
            controllers.get(msg.id)?.abort()
            break
    }
}