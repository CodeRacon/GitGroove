<script setup lang="ts">
// Hier kommen Audio und GitHub Settings
</script>

<template>
  <div class="settings-view">
    <section class="github-settings">
      <h2>GitHub Settings</h2>
      <!-- GitHub Username Input etc. -->
    </section>

    <section class="audio-settings">
      <h2>Audio Settings</h2>
      <!-- Sound Selection, Effects etc. -->
    </section>
  </div>
</template>

<style scoped>
.settings-view {
  display: grid;
  gap: 2rem;
}

section {
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

h2 {
  margin-bottom: 1rem;
  color: var(--color-heading);
}
</style>
