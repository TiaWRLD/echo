import type {
    ChatMessage, GenerateOptions, WorkerRequest, WorkerResponse,
} from '~/workers/protocol'

type Status = 'idle' | 'loading' | 'ready' | 'generating' | 'error'

interface Pending {
    onToken?: (t: string) => void
    resolve: (text: string) => void
    reject: (e: Error) => void
}

// Module scope = singleton shared by every component that calls useLLM()
let worker: Worker | null = null
let nextId = 1
let loadPromise: Promise<void> | null = null
let loadSettle: { resolve: () => void; reject: (e: Error) => void } | null = null
const pending = new Map<number, Pending>()

const status = ref<Status>('idle')
const progress = ref(0)            // 0..1
const error = ref<string | null>(null)
const streamingText = ref('')      // text of the reply being generated

function send(msg: WorkerRequest) {
    worker!.postMessage(msg)
}

function getWorker(): Worker {
    if (worker) return worker

    worker = new Worker(new URL('../workers/llm.worker.ts', import.meta.url), {
        type: 'module',
    })

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const msg = e.data
        switch (msg.type) {
            case 'progress':
                progress.value = msg.total ? msg.loaded / msg.total : 0
                break
            case 'ready':
                status.value = 'ready'
                loadSettle?.resolve()
                break
            case 'token': {
                streamingText.value += msg.text
                pending.get(msg.id)?.onToken?.(msg.text)
                break
            }
            case 'done': {
                pending.get(msg.id)?.resolve(msg.text)
                pending.delete(msg.id)
                status.value = 'ready'
                break
            }
            case 'error': {
                if (msg.id === undefined) {
                    // load error
                    status.value = 'error'
                    error.value = msg.message
                    loadPromise = null
                    loadSettle?.reject(new Error(msg.message))
                } else {
                    pending.get(msg.id)?.reject(new Error(msg.message))
                    pending.delete(msg.id)
                    status.value = 'ready'
                }
                break
            }
        }
    }

    return worker
}

export function useLLM() {
    function load(): Promise<void> {
        if (loadPromise) return loadPromise
        getWorker()
        status.value = 'loading'
        error.value = null
        loadPromise = new Promise<void>((resolve, reject) => {
            loadSettle = { resolve, reject }
        })
        send({ type: 'load' })
        return loadPromise
    }

    async function generate(
        messages: ChatMessage[],
        opts: Partial<GenerateOptions> & {
            onToken?: (t: string) => void
            signal?: AbortSignal
        } = {},
    ): Promise<string> {
        await load()
        opts.signal?.throwIfAborted()
        if (status.value === 'generating') {
            throw new Error('A generation is already running')
        }

        const id = nextId++
        status.value = 'generating'
        streamingText.value = ''

        opts.signal?.addEventListener('abort', () => send({ type: 'abort', id }))

        return new Promise<string>((resolve, reject) => {
            pending.set(id, { onToken: opts.onToken, resolve, reject })
            send({
                type: 'generate',
                id,
                messages,
                options: {
                    maxTokens: opts.maxTokens ?? 160,
                    temperature: opts.temperature ?? 0.65,
                },
            })
        })
    }

    return { status, progress, error, streamingText, load, generate }
}