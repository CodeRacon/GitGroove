<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ bars: number; totalWeeks: number; disabled?: boolean }>()
const emit = defineEmits<{ 'update:bars': [bars: number] }>()
const barOptions = computed(() => {
  const options = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52].filter(
    (bars) => bars <= props.totalWeeks,
  )
  if (!options.includes(props.totalWeeks)) options.push(props.totalWeeks)
  return options
})
</script>

<template>
  <div class="bar-selector">
    <label for="sequence-length">Section length <span>1 week = 1 bar</span></label>
    <select
      id="sequence-length"
      :value="bars"
      :disabled="disabled"
      @change="emit('update:bars', Number(($event.target as HTMLSelectElement).value))"
    >
      <option v-for="option in barOptions" :key="option" :value="option">
        {{ option }} {{ option === 1 ? 'week' : 'weeks'
        }}{{ option === totalWeeks ? ' · full calendar' : '' }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.bar-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}
label {
  display: flex;
  flex-direction: column;
  font-size: 0.8rem;
  font-weight: 600;
}
label span {
  color: var(--color-muted);
  font-size: 0.7rem;
  font-weight: 400;
}
select {
  min-height: 44px;
  max-width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text);
  padding: 8px 30px 8px 12px;
  font-size: 0.8rem;
}
@media (max-width: 400px) {
  .bar-selector {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
