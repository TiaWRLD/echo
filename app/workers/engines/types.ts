import type { ChatMessage, GenerateOptions } from '../protocol'

export interface Engine {
    load(onProgress: (loaded: number, total: number) => void): Promise<void>
    generate(
        messages: ChatMessage[],
        options: GenerateOptions,
        onToken: (text: string) => void,
        signal: AbortSignal,
    ): Promise<string>
}