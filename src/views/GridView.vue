<script setup lang="ts">
// Hier kommen später GitHub Service und Audio Controller
</script>

<template>
  <div class="grid-view">
    <section class="contribution-grid">
      <!-- Hier kommt unser Sequencer Grid -->
    </section>

    <section class="controls">
      <!-- Hier kommen Play/Pause und Audio Controls -->
    </section>
  </div>
</template>

<style scoped>
.grid-view {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.contribution-grid {
  min-height: 400px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 1rem;
}
</style>
