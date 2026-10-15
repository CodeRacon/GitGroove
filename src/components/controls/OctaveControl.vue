<script setup lang="ts">
import type { Octave } from '@/studio/state'
import type { Voice } from '@/music/score'
defineProps<{ voice: Voice; modelValue: Octave }>()
const emit = defineEmits<{ 'update:modelValue': [octave: Octave] }>()
</script>

<template>
  <label class="tone-field"
    ><span class="field-label">Octave</span>
    <select
      class="studio-select"
      :aria-label="`${voice} octave`"
      :value="modelValue"
      @change="
        emit('update:modelValue', Number(($event.target as HTMLSelectElement).value) as Octave)
      "
    >
      <option :value="-1">−1 · lower</option>
      <option :value="0">0 · original</option>
      <option :value="1">+1 · higher</option>
    </select>
  </label>
</template>
