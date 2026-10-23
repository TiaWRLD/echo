<script setup lang="ts">
const journal = useJournalStore()
onMounted(() => journal.load())
</script>

<template>
  <div style="padding:24px;color:white">
    <button @click="journal.add('summary', 'Test entry ' + Date.now(), 'vent')">Add</button>
    <button @click="journal.wipe()">Wipe</button>
    <p v-if="journal.error">{{ journal.error }}</p>
    <ul>
      <li v-for="e in journal.entries" :key="e.id">
        {{ e.text }}
        <button @click="journal.edit(e.id, e.text + '!')">Edit</button>
        <button @click="journal.remove(e.id)">Delete</button>
      </li>
    </ul>
  </div>
</template>