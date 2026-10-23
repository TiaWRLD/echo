<script setup lang="ts">
const onboarding = useOnboardingStore()
const dialog = ref<HTMLDialogElement | null>(null)

onMounted(() => {
  if (onboarding.open) dialog.value?.showModal()
})

function accept() {
  onboarding.accept()
  dialog.value?.close()
}

// Safety net: if something closes the dialog without "I understand" (for example Esc),
// open it again.
function onClose() {
  if (onboarding.open) dialog.value?.showModal()
}
</script>

<template>
  <dialog
      ref="dialog"
      class="onboarding-dialog"
      aria-labelledby="onboarding-title"
      @cancel.prevent
      @close="onClose"
  >
    <div class="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-[#14122a] p-7 text-sm leading-relaxed text-white/85">
      <div>
        <h2 id="onboarding-title" class="text-xl font-medium text-white">Welcome to Echo</h2>
        <p class="text-white/60">A quiet place to think.</p>
      </div>

      <p>
        Echo helps you put your thoughts in order. You can vent, look at a situation one step at a
        time, or find one very small thing to do next.
      </p>

      <p>
        <strong class="font-medium text-white">It is a space for reflection, not therapy.</strong>
        It does not give medical advice and it cannot diagnose anything.
      </p>

      <p>
        Echo uses a small AI model. It can be wrong or say something odd. Treat anything it
        suggests as one possibility, not as the truth about you.
      </p>

      <p>
        <strong class="font-medium text-white">Echo cannot help in an emergency.</strong>
        If you are in danger, or thinking about harming yourself, please contact your local
        emergency number or a helpline.
        <a
            href="https://findahelpline.com"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[#b7a9ff] underline underline-offset-2"
        >findahelpline.com</a>
        lists them by country.
      </p>

      <p>
        What you write stays on your device. The badge at the top of the page explains how, and how
        to check it yourself.
      </p>

      <button
          type="button"
          class="self-end rounded-full bg-[#8b7bff] px-6 py-2 font-medium text-[#0b0a14]"
          @click="accept"
      >
        I understand
      </button>
    </div>
  </dialog>
</template>

<style scoped>
.onboarding-dialog {
  margin: auto;
  padding: 0;
  border: 0;
  background: transparent;
  max-width: min(34rem, calc(100vw - 2rem));
}
.onboarding-dialog::backdrop {
  background: rgba(11, 10, 20, 0.85);
  backdrop-filter: blur(8px);
}
</style>