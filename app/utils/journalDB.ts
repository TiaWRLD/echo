import { createStore, entries, set, update, del, clear, type UseStore } from 'idb-keyval'

export interface JournalEntry {
    id: string
    kind: 'summary' | 'letter'
    text: string
    mode?: string
    createdAt: number
    updatedAt: number
}

// Creato alla prima chiamata, non all'import
let db: UseStore | undefined
const store = () => (db ??= createStore('echo', 'journal'))

// Copia "semplice": toglie eventuali proxy reattivi di Vue
const plain = <T>(v: T): T => JSON.parse(JSON.stringify(v))

export async function dbLoadAll(): Promise<JournalEntry[]> {
    const rows = await entries<string, JournalEntry>(store())
    return rows.map(([, value]) => value).sort((a, b) => b.createdAt - a.createdAt)
}

export const dbSave = (e: JournalEntry) => set(e.id, plain(e), store())

// Atomico. Da chiamare solo per id che esistono già (vedi store)
export const dbPatch = (id: string, changes: Partial<JournalEntry>) =>
    update<JournalEntry>(id, (old) => (old ? { ...old, ...changes } : old), store())

export const dbRemove = (id: string) => del(id, store())
export const dbWipe = () => clear(store())