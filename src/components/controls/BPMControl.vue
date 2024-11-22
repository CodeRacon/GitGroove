<script lang="ts">
export default {
  name: 'BPMControl',
}
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { useOrchestrator } from '../../composables/audio/useOrchestrator'
import Fader from './common/Fader.vue'

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

const handleBPMChange = (value: number) => {
  emit('update:bpm', value)
}
</script>

<template>
  <div class="bpm-control">
    <Fader
      :model-value="bpm"
      :min="30"
      :max="300"
      :step="1"
      :decimals="0"
      label="Tempo"
      unit="BPM"
      @update:model-value="handleBPMChange"
    />
  </div>
</template>

<style scoped>
.bpm-control {
  width: 12rem;
}
</style>
