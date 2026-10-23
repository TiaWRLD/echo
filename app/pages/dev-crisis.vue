<script setup lang="ts">
import { detectCrisis } from '~/utils/crisis'
import { trimToSentences } from '~/utils/text'

const mustMatch = [
  "I'd rather be dead", 'i would rather die', "I don't want to wake up", 'I wish I could just not wake up',
  'I do not want to live anymore', "I don't wanna live", "I keep thinking about taking my life",
  'I wish I had never been born', 'I wish I was never born', 'I wanna disappear', 'I wish I could disappear',
  "I'm thinking about suicide", 'I want to die', 'wanting to die', 'there is nothing to live for',
  'no point in living', "they'd be better off dead", 'I don’t want to wake up',
]
const mustNotMatch = [
  'I am so tired of this meeting', 'I could die of embarrassment', 'The baby will wake up soon',
  'I love my life', 'He asked me to end the call', 'I want to understand what happened',
  'I wish you were dead', // design choice: not flagged, see README note
]
const crisisRows = [
  ...mustMatch.map((t) => ({ t, expected: true, got: detectCrisis(t) })),
  ...mustNotMatch.map((t) => ({ t, expected: false, got: detectCrisis(t) })),
]

const sentenceRows = [
  { t: 'I said "stop." Then I left. And more.', max: 2 },
  { t: 'Hello there. I am', max: 3 },
  { t: 'First line.\n\nSecond line.', max: 3 },
].map((r) => ({ ...r, out: trimToSentences(r.t, r.max) }))
</script>

<template>
  <main class="p-6 font-mono text-sm text-white/90">
    <h1 class="mb-2 text-base">detectCrisis</h1>
    <p v-for="r in crisisRows" :key="r.t" :class="r.got === r.expected ? 'text-green-300' : 'text-red-300'">
      {{ r.got === r.expected ? 'OK ' : 'FAIL' }} expected {{ r.expected }}, got {{ r.got }}: {{ r.t }}
    </p>
    <h1 class="mb-2 mt-6 text-base">trimToSentences</h1>
    <pre v-for="r in sentenceRows" :key="r.t" class="mb-2 whitespace-pre-wrap">in : {{ r.t }}
out: {{ r.out }}</pre>
  </main>
</template>