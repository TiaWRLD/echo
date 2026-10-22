<script setup lang="ts">
defineProps<{ active?: boolean }>()
</script>

<template>
  <div class="orb" :class="{ 'orb--active': active }" aria-hidden="true" />
</template>

<style scoped>
.orb {
  width: 72px;
  height: 72px;
  border-radius: 9999px;
  background: radial-gradient(circle at 35% 30%, #b7a9ff, #8b7bff 55%, #4b3fbf);
  box-shadow: 0 0 36px 6px rgba(139, 123, 255, 0.28);
  animation: breathe 6s ease-in-out infinite;
  transition: box-shadow 1.2s ease;
}

.orb--active {
  box-shadow: 0 0 64px 16px rgba(139, 123, 255, 0.55);
}

@keyframes breathe {
  0%, 100% { transform: scale(0.92); opacity: 0.8; }
  50% { transform: scale(1.08); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .orb { animation: none; }
}
</style>