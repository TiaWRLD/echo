<script setup lang="ts">
import { linkify } from '~/utils/linkify'
import { MAX_LETTER_CHARS } from '~/prompts/letter'
const chat = useChatStore()
const { status, progress, error: llmError, load } = useLLM()
const gpu = useWebGPU()
const modes = [
  { id: 'vent', label: 'Vent' },
  { id: 'reflect', label: 'Reflect' },
  { id: 'unblock', label: 'Unblock' },
  {id: 'letter', label: 'Letter' },
] as const

const input = ref('')
const bottom = ref<HTMLElement | null>(null)

// Hide the empty placeholder bubble; the orb shows that Echo is working.
const visibleMessages = computed(() => chat.messages.filter((m) => m.content))
// WebGPU missing: either the upfront check failed, or the engine reported it.
const noGpu = computed(
    () =>
        gpu.supported.value === false ||
        /WEBGPU_UNAVAILABLE/.test(`${llmError.value ?? ''} ${chat.error ?? ''}`),
)
// When the model failed to load, the friendly box below replaces the raw message.
const errorText = computed(() => (status.value === 'error' ? null : chat.error || llmError.value))

onMounted(() => { gpu.check() })

function retryLoad() {
  chat.error = null
  load().catch(() => {}) // a new failure shows up again in the box
}const placeholders = { vent: "What's on your mind?", reflect: 'Your answer', unblock: 'Write it here', letter: 'Write it as it is' }
const placeholder = computed(() => placeholders[chat.mode])

const copyState = ref<'idle' | 'done' | 'failed'>('idle')
async function copyLetter() {
  try {
    await navigator.clipboard.writeText(chat.letter) // must run straight from the click
    copyState.value = 'done'
  } catch {
    copyState.value = 'failed'
  }
  setTimeout(() => { copyState.value = 'idle' }, 2500)
}
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
    <WebGPUUnsupported v-if="noGpu" />
    <template v-else>
    <header class="shrink-0 flex flex-col items-center gap-4 pt-8 pb-4">
      <EchoOrb :active="chat.isSending" />
      <nav class="glass flex max-w-full gap-1 overflow-x-auto rounded-full p-1" aria-label="Mode">        <button
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
        </button >
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
          <template v-if="m.kind === 'crisis' && m.role === 'assistant'">
            <template v-for="(part, i) in linkify(m.content)" :key="i">
              <a
                  v-if="part.href"
                  :href="part.href"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-[#b7a9ff] underline underline-offset-2"
              >{{ part.text }}</a>
              <template v-else>{{ part.text }}</template>
            </template>
          </template>
          <template v-else>{{ m.content }}</template>        </div>

        <div
            v-if="chat.canOfferReflect && !chat.isSending"
            class="glass flex flex-col items-start gap-3 self-start rounded-3xl px-5 py-4 text-sm"
        >
          <p>If you would like to look at this more closely, Reflect goes through it one step at a time.</p>
          <button
              type="button"
              class="whitespace-nowrap rounded-full px-5 py-1.5 text-sm transition-colors disabled:opacity-50"              @click="chat.setMode('reflect')"
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

        <div v-if="status === 'error'" class="glass self-start rounded-3xl px-5 py-4 text-sm">
          <p>
            Echo could not prepare the model. This can happen if the connection dropped during the
            first download. Nothing you wrote has been sent anywhere.
          </p>
          <button
              type="button"
              class="mt-3 rounded-full bg-[#8b7bff] px-5 py-2 text-sm font-medium text-[#0b0a14]"
              @click="retryLoad"
          >
            Try again
          </button>
          <details class="mt-3 text-xs text-white/50">
            <summary class="cursor-pointer">Technical details</summary>
            <p class="mt-1 break-words">{{ llmError }}</p>
          </details>
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

        <div v-else-if="chat.letterStarted" class="flex flex-wrap justify-center gap-3 py-2">
          <button v-if="chat.isSending" type="button" class="rounded-full border border-white/20 px-5 py-2 text-sm" @click="chat.stop()">
            Stop
          </button>
          <template v-else-if="chat.letterReady">
            <button type="button" class="rounded-full bg-[#8b7bff] px-5 py-2 text-sm font-medium text-[#0b0a14]" @click="copyLetter">
              {{ copyState === 'done' ? 'Copied' : 'Copy' }}
            </button>
            <button type="button" class="rounded-full border border-white/20 px-5 py-2 text-sm" @click="chat.clear()">Discard</button>
          </template>
          <template v-else>
            <button type="button" class="rounded-full bg-[#8b7bff] px-5 py-2 text-sm font-medium text-[#0b0a14]" @click="chat.retryLetter()">
              Try again
            </button>
            <button type="button" class="rounded-full border border-white/20 px-5 py-2 text-sm" @click="chat.clear()">Discard</button>
          </template>
          <p v-if="copyState === 'failed'" class="w-full text-center text-xs text-white/60">
            Could not copy automatically. You can select the text and copy it by hand.
          </p>
        </div>

        <div v-else class="glass flex items-end gap-2 rounded-3xl p-2">
                    <textarea
                        v-model="input"
                        rows="1"
                        aria-label="Your message"
                        :placeholder="placeholder"
                        class="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 outline-none placeholder:text-white/40"
                        @keydown.enter.exact="onEnter"
                        :maxlength="chat.mode === 'letter' ? MAX_LETTER_CHARS : undefined"
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
    </template>
    <OnboardingDialog />
    <UpdateNotice />
  </div>
</template>
