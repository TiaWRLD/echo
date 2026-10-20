<script setup lang="ts">
const { status, progress, error, streamingText, generate } = useLLM()
const ctrl = ref<AbortController | null>(null)

async function run() {
  ctrl.value = new AbortController()
  await generate(
      [{ role: 'user', content: 'I feel overwhelmed.' }],
      { signal: ctrl.value.signal },
  ).catch(() => {})
}
</script>

<template>
  <main class="mx-auto max-w-xl p-6 space-y-4">
    <p>Status: {{ status }} · Load: {{ Math.round(progress * 100) }}%</p>
    <p v-if="error" class="text-red-400">{{ error }}</p>
    <div class="glass p-4 min-h-24">{{ streamingText }}</div>
    <button class="glass px-4 py-2" @click="run">Generate</button>
    <button class="glass px-4 py-2" @click="ctrl?.abort()">Stop</button>
  </main>
</template>