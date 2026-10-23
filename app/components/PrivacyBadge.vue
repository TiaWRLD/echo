<script setup lang="ts">
// Native <dialog>: showModal() gives us focus trapping, Esc to close and a backdrop.
const dialog = ref<HTMLDialogElement | null>(null)
const open = () => dialog.value?.showModal()
const close = () => dialog.value?.close()
</script>

<template>
  <button
      type="button"
      aria-haspopup="dialog"
      class="glass flex items-center gap-2 rounded-full px-4 py-1.5 text-xs text-white/70 transition-colors hover:text-white/90"
      @click="open"
  >
    <span class="inline-block size-1.5 rounded-full bg-[#b7a9ff]" aria-hidden="true" />
    Nothing you write is uploaded
  </button>

  <dialog ref="dialog" class="privacy-dialog" aria-labelledby="privacy-title" @click.self="close">
    <div class="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-[#14122a] p-7 text-sm leading-relaxed text-white/85">
      <h2 id="privacy-title" class="text-lg font-medium text-white">Your words stay on this device</h2>

      <p>
        Echo runs a small language model directly in your browser. What you write is processed on
        your device. It is not sent to a server, and there is no account.
      </p>

      <p>
        <strong class="font-medium text-white">The model downloads once, then everything runs offline.</strong>
        The first time, it is fetched from Hugging Face (huggingface.co), the only outside site Echo
        contacts. After that it is stored in your browser, and Echo works without a connection.
      </p>

      <p>
        <strong class="font-medium text-white">Check it yourself.</strong>
        Open your browser's developer tools and go to the Network tab. Send a message: no new request
        should appear. Once the model is downloaded, you can even turn off your internet and keep
        using Echo.
      </p>

      <div class="flex flex-col gap-2 border-t border-white/10 pt-4">
        <DeleteAllData />
        <p class="text-xs text-white/50">
          This removes your conversations. The downloaded model stays, so you will
          not need to download it again.
        </p>
      </div>

      <button
          type="button"
          class="self-end rounded-full border border-white/20 px-5 py-2"
          @click="close"
      >
        Close
      </button>
    </div>
  </dialog>
</template>

<style scoped>
.privacy-dialog {
  margin: auto;
  padding: 0;
  border: 0;
  background: transparent;
  max-width: min(34rem, calc(100vw - 2rem));
}
.privacy-dialog::backdrop {
  background: rgba(11, 10, 20, 0.7);
  backdrop-filter: blur(6px);
}
</style>