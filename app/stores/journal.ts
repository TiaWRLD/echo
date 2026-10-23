import { dbLoadAll, dbSave, dbPatch, dbRemove, dbWipe, type JournalEntry } from '~/utils/journalDb'

export const useJournalStore = defineStore('journal', () => {
    const entries = ref<JournalEntry[]>([])
    const loaded = ref(false)
    const error = ref<string | null>(null)

    async function guard<T>(fn: () => Promise<T>): Promise<T | undefined> {
        try {
            error.value = null
            return await fn()
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Could not access local storage.'
        }
    }

    async function load() {
        const rows = await guard(dbLoadAll)
        if (rows) { entries.value = rows; loaded.value = true }
    }

    async function add(kind: JournalEntry['kind'], text: string, mode?: string) {
        const now = Date.now()
        const entry: JournalEntry = {
            id: crypto.randomUUID(), kind, text: text.trim(), mode, createdAt: now, updatedAt: now,
        }
        if (!entry.text) return
        await guard(() => dbSave(entry))
        if (!error.value) entries.value = [entry, ...entries.value]

    }

    async function edit(id: string, text: string) {
        const current = entries.value.find((e) => e.id === id)
        if (!current || !text.trim()) return
        const changes = { text: text.trim(), updatedAt: Date.now() }
        await guard(() => dbPatch(id, changes))
        if (!error.value) Object.assign(current, changes)
    }

    async function remove(id: string) {
        await guard(() => dbRemove(id))
        if (!error.value) entries.value = entries.value.filter((e) => e.id !== id)
    }

    async function wipe() {
        await guard(dbWipe)
        if (!error.value) entries.value = []
    }

    return { entries, loaded, error, load, add, edit, remove, wipe }
})