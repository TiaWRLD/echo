import type { WorkerRequest, WorkerResponse } from './protocol'
import { createEngine } from './engines'
import type { Engine } from './engines/types'

// Il motore si crea una volta sola (createEngine è async)
let enginePromise: Promise<Engine> | null = null
const getEngine = () => (enginePromise ??= createEngine())
let loadPromise: Promise<void> | null = null
const controllers = new Map<number, AbortController>()

const post = (msg: WorkerResponse) => self.postMessage(msg)

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
    const msg = e.data

    switch (msg.type) {
        case 'load': {
            try {
                const engine = await getEngine()
                loadPromise ??= engine.load((loaded, total) =>
                    post({ type: 'progress', loaded, total }),
                )
                await loadPromise
                post({ type: 'ready' })
            } catch (err) {
                loadPromise = null // permette di riprovare
                enginePromise = null
                post({ type: 'error', message: String(err) })
            }
            break
        }

        case 'generate': {
            const controller = new AbortController()
            controllers.set(msg.id, controller)
            try {
                // `engine` va preso anche qui: la costante nel case 'load' non esiste in questo blocco
                const engine = await getEngine()
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