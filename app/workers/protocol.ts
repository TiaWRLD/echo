export type ChatMessage = {
    role: 'system' | 'user' | 'assistant'
    content: string
}

export interface GenerateOptions {
    maxTokens: number
    temperature: number
}

// UI -> Worker
export type WorkerRequest =
    | { type: 'load' }
    | { type: 'generate'; id: number; messages: ChatMessage[]; options: GenerateOptions }
    | { type: 'abort'; id: number }

// Worker -> UI
export type WorkerResponse =
    | { type: 'ready' }
    | { type: 'progress'; loaded: number; total: number }
    | { type: 'token'; id: number; text: string }
    | { type: 'done'; id: number; text: string }
    | { type: 'error'; id?: number; message: string }