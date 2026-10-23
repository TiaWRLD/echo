const KEY = 'echo:onboarding-seen'

// localStorage can throw (blocked storage, some private modes): treat that as "not seen".
function read(): boolean {
    try { return localStorage.getItem(KEY) === '1' } catch { return false }
}

export const useOnboardingStore = defineStore('onboarding', () => {
    // Read once, when the store is created. The app is a SPA, so localStorage exists here.
    const open = ref(!read())

    function accept() {
        try { localStorage.setItem(KEY, '1') } catch { /* nothing to do */ }
        open.value = false
    }

    // Used by "Delete all data". Does not reopen the dialog during this visit.
    function forget() {
        try { localStorage.removeItem(KEY) } catch { /* nothing to do */ }
    }

    return { open, accept, forget }
})