<script setup lang="ts">
const chat = useChatStore()
const { status, progress, error: llmError } = useLLM()

const modes = [
  { id: 'vent', label: 'Vent' },
  { id: 'reflect', label: 'Reflect' },
  { id: 'unblock', label: 'Unblock' },
] as const

const input = ref('')
const bottom = ref<HTMLElement | null>(null)

// Hide the empty placeholder bubble; the orb shows that Echo is working.
const visibleMessages = computed(() => chat.messages.filter((m) => m.content))
const errorText = computed(() => chat.error || llmError.value)
const placeholders = { vent: "What's on your mind?", reflect: 'Your answer', unblock: 'Write it here' }
const placeholder = computed(() => placeholders[chat.mode])
function submit() {
  const text = input.value.trim()
  if (!text || chat.isSending) return
  input.value = ''
  chat.send(text)
}

function onEnter(e: KeyboardEvent) {
  if (e.isComposing) return
  e.preventDefault()
  submit()
}

// Keep the latest text in view while it streams.
watch(
    [() => chat.messages.length, () => chat.messages.at(-1)?.content],
    async () => {
      await nextTick()
      bottom.value?.scrollIntoView({ block: 'end' })
    },
)
</script>

<template>
  <div class="echo-bg h-dvh flex flex-col text-white/90">
    <header class="shrink-0 flex flex-col items-center gap-4 pt-8 pb-4">
      <EchoOrb :active="chat.isSending" />
      <nav class="glass flex gap-1 rounded-full p-1" aria-label="Mode">
        <button
            v-for="m in modes"
            :key="m.id"
            type="button"
            :disabled="chat.isSending"
            :aria-pressed="chat.mode === m.id"
            class="rounded-full px-5 py-1.5 text-sm transition-colors disabled:opacity-50"
            :class="chat.mode === m.id ? 'bg-[#8b7bff] font-medium text-[#0b0a14]' : 'text-white/70'"
            @click="chat.setMode(m.id)"
        >
          {{ m.label }}
        </button>
      </nav>
      <PrivacyBadge />
    </header>

    <main class="flex-1 overflow-y-auto" aria-live="polite">
      <div class="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-2">
        <p
            v-if="chat.mode === 'vent' && !visibleMessages.length && !chat.isSending"
            class="py-10 text-center text-white/50"
        >
          Write whatever is on your mind. There is no need to organise it.
        </p>

        <div
            v-for="m in visibleMessages"
            :key="m.id"
            class="max-w-[85%] whitespace-pre-wrap rounded-3xl px-5 py-3 leading-relaxed"
            :class="[
                        m.role === 'user'
                            ? 'self-end border border-[#b7a9ff]/30 bg-[#8b7bff]/25'
                            : 'glass self-start',
                        m.kind === 'crisis' && m.role === 'assistant' ? 'border-[#b7a9ff]/60' : '',
                    ]"
        >
          {{ m.content }}
        </div>

        <div
            v-if="chat.canOfferReflect && !chat.isSending"
            class="glass flex flex-col items-start gap-3 self-start rounded-3xl px-5 py-4 text-sm"
        >
          <p>If you would like to look at this more closely, Reflect goes through it one step at a time.</p>
          <button
              type="button"
              class="rounded-full border border-[#b7a9ff]/40 px-4 py-1.5"
              @click="chat.setMode('reflect')"
          >
            Try Reflect
          </button>
        </div>

        <div v-if="status === 'loading'" class="glass self-start rounded-3xl px-5 py-4 text-sm">
          <p>Preparing the model. The first time takes a while; it happens only once.</p>
          <div class="mt-3 h-1.5 w-64 overflow-hidden rounded-full bg-white/10">
            <div
                class="h-full rounded-full bg-[#8b7bff] transition-all duration-500"
                :style="{ width: Math.round(progress * 100) + '%' }"
            />
          </div>
        </div>

        <p v-if="errorText" class="self-start rounded-3xl border border-red-300/30 px-5 py-3 text-sm text-red-200">
          {{ errorText }}
        </p>

        <div ref="bottom" />
      </div>
    </main>

    <footer class="shrink-0 px-4 pb-5 pt-2">
      <div class="mx-auto max-w-2xl">
        <div v-if="chat.reflectDone" class="flex flex-wrap justify-center gap-3 py-2">
          <button
              type="button"
              class="rounded-full bg-[#8b7bff] px-5 py-2 text-sm font-medium text-[#0b0a14]"
              @click="chat.clear()"
          >
            Start a new reflection
          </button>
          <button
              type="button"
              class="rounded-full border border-white/20 px-5 py-2 text-sm"
              @click="chat.setMode('vent')"
          >
            Back to Vent
          </button>
        </div>

        <div v-else-if="chat.unblockReady" class="flex flex-wrap justify-center gap-3 py-2">
          <button
              v-if="chat.canShrink"
              type="button"
              :disabled="chat.isSending"
              class="rounded-full bg-[#8b7bff] px-5 py-2 text-sm font-medium text-[#0b0a14] transition-opacity disabled:opacity-40"
              @click="chat.makeSmaller()"
          >
            Make it even smaller
          </button>
          <button
              v-if="chat.isSending"
              type="button"
              class="rounded-full border border-white/20 px-5 py-2 text-sm"
              @click="chat.stop()"
          >
            Stop
          </button>
          <template v-else>
            <button type="button" class="rounded-full border border-white/20 px-5 py-2 text-sm" @click="chat.clear()">
              Start over
            </button>
            <button type="button" class="rounded-full border border-white/20 px-5 py-2 text-sm" @click="chat.setMode('vent')">
              Back to Vent
            </button>
          </template>
        </div>

        <div v-else class="glass flex items-end gap-2 rounded-3xl p-2">
                    <textarea
                        v-model="input"
                        rows="1"
                        aria-label="Your message"
                        :placeholder="placeholder"
                        class="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 outline-none placeholder:text-white/40"
                        @keydown.enter.exact="onEnter"
                    />
          <button
              v-if="chat.isSending"
              type="button"
              class="rounded-full border border-white/20 px-5 py-2 text-sm"
              @click="chat.stop()"
          >
            Stop
          </button>
          <button
              v-else
              type="button"
              :disabled="!input.trim()"
              class="rounded-full bg-[#8b7bff] px-5 py-2 text-sm font-medium text-[#0b0a14] transition-opacity disabled:opacity-40"
              @click="submit"
          >
            Send
          </button>
        </div>

        <div class="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-2 text-xs text-white/40">
          <span>Echo is a space for reflection, not therapy.</span>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
            <button type="button" class="underline-offset-2 hover:underline" @click="chat.clear()">
              Clear conversation
            </button>
            <DeleteAllData />
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.echo-bg {
  background:
      radial-gradient(ellipse at 20% 0%, rgba(139, 123, 255, 0.18), transparent 55%),
      radial-gradient(ellipse at 90% 100%, rgba(60, 80, 200, 0.16), transparent 50%),
      #0b0a14;
}
</style>