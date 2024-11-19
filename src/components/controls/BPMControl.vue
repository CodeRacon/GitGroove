<script lang="ts">
export default {
  name: 'BPMControl',
}
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { useOrchestrator } from '../../composables/audio/useOrchestrator'

/**
 * Defines the props for the `BPMControl` component.
 *
 * @prop {number} bpm - The current BPM (beats per minute) value. Defaults to 120.
 */
const props = defineProps({
  bpm: {
    type: Number,
    default: 120,
  },
})

/**
 * Emits an event to update the BPM (beats per minute) value.
 *
 * @event update:bpm - Emits the new BPM value.
 */
const emit = defineEmits(['update:bpm'])

/**
 * Updates the BPM (beats per minute) value and emits an event to notify listeners.
 *
 * @param {Event} event - The input event from the BPM range slider.
 * @emits {update:bpm} - Emits the new BPM value.
 */
const updateBPM = (event: Event) => {
  const value = parseInt((event.target as HTMLInputElement).value)
  emit('update:bpm', value)
}
</script>

<template>
  <div class="bpm-control">
    <label>BPM</label>
    <div class="control-group">
      <input type="range" :value="bpm" min="30" max="300" @input="updateBPM" />
      <span class="bpm-display">{{ bpm }}</span>
    </div>
  </div>
</template>

<style scoped>
.bpm-control {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: white;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

input[type='range'] {
  -webkit-appearance: none;
  width: 200px;
  height: 4px;
  background: #42b883;
  border-radius: 2px;
  cursor: pointer;
}

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
}

.bpm-display {
  min-width: 3ch;
  font-weight: bold;
  font-family: monospace;
}
</style>
