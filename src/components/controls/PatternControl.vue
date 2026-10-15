<script setup lang="ts">
import type { ArpeggioPattern } from '@/studio/state'
defineProps<{ voice: 'bass' | 'lead'; modelValue: ArpeggioPattern }>()
const emit = defineEmits<{ 'update:modelValue': [pattern: ArpeggioPattern] }>()
</script>

<template>
  <label class="tone-field pattern-field">
    <span class="field-label">Arpeggio Pattern</span>
    <select
      class="studio-select"
      :aria-label="`${voice} arpeggio pattern`"
      :aria-describedby="`${voice}-pattern-hint`"
      :value="modelValue"
      @change="
        emit('update:modelValue', ($event.target as HTMLSelectElement).value as ArpeggioPattern)
      "
    >
      <option value="original">Original</option>
      <option value="up">Up ↑</option>
      <option value="down">Down ↓</option>
      <option value="up-down">Up / Down ↕</option>
    </select>
    <span :id="`${voice}-pattern-hint`" class="pattern-hint">
      {{
        voice === 'bass'
          ? 'Note order across active days. Original plays the root.'
          : 'Note order within each week. Activity sets the rhythm.'
      }}
    </span>
  </label>
</template>

<style scoped>
.pattern-field {
  grid-column: 1 / -1;
}
.pattern-hint {
  display: block;
  margin-top: 6px;
  color: var(--color-muted);
  font-size: 0.7rem;
  line-height: 1.5;
}
</style>
