<template>
  <main class="flex flex-1 flex-col items-center justify-center px-6 text-center">
    <EchoOrb :active="false" />
    <h1 class="mt-8 text-xl font-medium">Echo can't run in this browser</h1>
    <p class="mt-4 max-w-md leading-relaxed text-white/70">
      Echo runs a small language model on your own device, and that needs a feature called WebGPU.
      This browser or device doesn't offer it right now.
    </p>
    <p class="mt-3 max-w-md leading-relaxed text-white/70">
      A recent version of Chrome or Edge on a computer is the most likely to work. Support depends on
      both the browser and the device, so it may not be available everywhere.
    </p>
    <p class="mt-3 max-w-md text-sm text-white/50">Nothing has been uploaded.</p>

    <p class="mt-10 max-w-md text-xs leading-relaxed text-white/40">
      Echo is a space for reflection, not therapy. If you are struggling right now, you can find
      helplines in your country at
      <a
          href="https://findahelpline.com"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[#b7a9ff] underline underline-offset-2"
      >findahelpline.com</a>.
    </p>
  </main>
</template>