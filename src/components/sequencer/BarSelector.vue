<script setup lang="ts">
defineProps({
  bars: {
    type: Number,
    default: 4,
  },
})

const barOptions = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52]
const emit = defineEmits(['update:bars'])

const updateBars = (bars: number) => {
  emit('update:bars', bars)
}
</script>

<template>
  <div class="bar-selector">
    <h3>Quick-Select Bars 🎵</h3>
    <div class="bar-buttons">
      <button
        v-for="bars in barOptions"
        :key="bars"
        :class="{ active: selectedBars === bars }"
        @click="updateBars(bars)"
      >
        <b>{{ bars }}</b>
      </button>
    </div>
  </div>
</template>

<style scoped>
.bar-selector {
  padding: 0 1rem;
  width: 100%;
}

.bar-buttons {
  display: flex;
  justify-content: space-between;
  gap: 0.25rem;
  font-size: 1.25rem;
  font-weight: bold;
  width: 100%;
}

button {
  width: 3.25rem;
  padding: 0.5rem 1rem;
  border: 2px solid #42b883;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  transition: all 0.3s;
  color: white;
}

button:hover {
  background: #42b88360;
}

button:active {
  background: #42b883;
}
</style>
