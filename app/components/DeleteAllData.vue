<script setup lang="ts">
const chat = useChatStore()
const journal = useJournalStore()
const onboarding = useOnboardingStore()

const confirming = ref(false)
const busy = ref(false)
const done = ref(false)
const failed = ref(false)

async function erase() {
  busy.value = true
  chat.resetAll()          // in-memory conversations
  await journal.wipe()     // diary in IndexedDB
  onboarding.forget()     //onboarding seen data
  failed.value = Boolean(journal.error)
  done.value = !failed.value
  confirming.value = false
  busy.value = false
  if (done.value) setTimeout(() => { done.value = false }, 4000)
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
    <template v-if="confirming">
      <span class="text-white/70">Delete all conversations and diary entries?</span>
      <button
          type="button"
          :disabled="busy"
          class="rounded-full bg-[#8b7bff] px-3 py-1 font-medium text-[#0b0a14] disabled:opacity-50"
          @click="erase"
      >
        Yes, delete
      </button>
      <button type="button" class="rounded-full border border-white/20 px-3 py-1" @click="confirming = false">
        Cancel
      </button>
    </template>

    <template v-else>
      <button type="button" class="underline-offset-2 hover:underline" @click="confirming = true">
        Delete all data
      </button>
      <span v-if="done" role="status" class="text-[#b7a9ff]">Everything was deleted.</span>
      <span v-if="failed" role="alert" class="text-red-200">
        The diary could not be deleted. You can clear this site's data in your browser settings.
      </span>
    </template>
  </div>
</template>