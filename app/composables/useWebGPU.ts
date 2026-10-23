type GpuNavigator = Navigator & { gpu?: { requestAdapter(): Promise<unknown | null> } }

// null = not checked yet. Module scope = shared state, like useLLM.
const supported = ref<boolean | null>(null)
let checking: Promise<void> | null = null

export function useWebGPU() {
    function check(): Promise<void> {
        if (checking) return checking
        checking = (async () => {
            const gpu = (navigator as GpuNavigator).gpu
            // undefined: no WebGPU in this browser (or the page is not a secure context)
            if (!gpu) {
                supported.value = false
                return
            }
            try {
                // Resolves to null (it does not reject) when no suitable adapter exists
                supported.value = (await gpu.requestAdapter()) !== null
            } catch {
                supported.value = false
            }
        })()
        return checking
    }

    return { supported, check }
}