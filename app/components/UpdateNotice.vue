<template>
  <div
      v-if="$pwa?.needRefresh"
      role="status"
      class="glass animate-rise fixed inset-x-4 top-4 z-40 mx-auto flex max-w-md items-center justify-between gap-4 px-5 py-3 text-sm"
  >
    <span>A new version of Echo is ready. Reloading clears the current conversation.</span>
    <div class="flex shrink-0 gap-2">
      <button type="button" class="rounded-full bg-accent px-4 py-1.5 font-medium text-ink" @click="$pwa.updateServiceWorker()">
        Reload
      </button>
      <button type="button" class="rounded-full px-3 py-1.5 text-white/70" @click="$pwa.cancelPrompt()">
        Later
      </button>
    </div>
  </div>
</template>