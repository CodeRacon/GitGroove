<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ bars: number; totalWeeks: number; disabled?: boolean }>()
const emit = defineEmits<{ 'update:bars': [bars: number] }>()
const presets = [4, 8, 12, 16]
const quickOptions = computed(() => presets.filter((bars) => bars <= props.totalWeeks))
const moreOptions = computed(() => {
  const options = [1, 2, 3, 20, 24, 28, 32, 36, 40, 44, 48, 52].filter(
    (bars) => bars <= props.totalWeeks && !quickOptions.value.includes(bars),
  )
  // Always expose the full calendar, even when it is also a quick choice.
  if (!options.includes(props.totalWeeks)) options.push(props.totalWeeks)
  if (
    props.bars >= 1 &&
    props.bars <= props.totalWeeks &&
    !presets.includes(props.bars) &&
    !options.includes(props.bars)
  )
    options.push(props.bars)
  return options.sort((a, b) => a - b)
})
const moreValue = computed(() =>
  quickOptions.value.includes(props.bars) ? '' : String(props.bars),
)
function choose(bars: number) {
  if (!props.disabled && bars !== props.bars) emit('update:bars', bars)
}
function chooseMore(event: Event) {
  const select = event.target as HTMLSelectElement
  choose(Number(select.value))
  // Keep More… neutral when the full calendar also matches the active quick choice.
  select.value = moreValue.value
}
</script>

<template>
  <div class="bar-selector" role="group" aria-labelledby="section-length-label">
    <div id="section-length-label" class="length-label">
      Section length <span>1 week = 1 bar</span>
    </div>
    <div class="length-options">
      <div
        v-if="quickOptions.length"
        class="length-presets"
        role="group"
        aria-label="Common section lengths"
      >
        <button
          v-for="option in quickOptions"
          :key="option"
          type="button"
          class="length-preset"
          :aria-label="`${option} weeks`"
          :aria-pressed="bars === option"
          :disabled="disabled"
          @click="choose(option)"
        >
          {{ option }}
        </button>
      </div>
      <select
        id="sequence-length"
        :value="moreValue"
        :disabled="disabled"
        aria-label="More section lengths"
        :class="{ selected: moreValue !== '' }"
        @change="chooseMore"
      >
        <option value="" disabled>More…</option>
        <option v-for="option in moreOptions" :key="option" :value="option">
          {{ option }} {{ option === 1 ? 'week' : 'weeks'
          }}{{ option === totalWeeks ? ' · full calendar' : '' }}
        </option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.bar-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.length-label {
  display: flex;
  flex-direction: column;
  font-size: 0.8rem;
  font-weight: 600;
  flex-shrink: 0;
}
.length-label span {
  color: var(--color-muted);
  font-size: 0.7rem;
  font-weight: 400;
}
.length-options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.length-presets {
  display: flex;
  gap: 4px;
}
.length-preset,
select {
  min-height: 44px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.8rem;
}
.length-preset {
  min-width: 44px;
  padding: 8px;
  font-weight: 650;
}
.length-preset:hover:not(:disabled) {
  border-color: #6a8270;
}
.length-preset[aria-pressed='true'],
select.selected {
  color: var(--color-accent);
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
}
select {
  max-width: 100%;
  padding: 8px 24px 8px 10px;
}
@media (max-width: 800px) {
  .bar-selector {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
