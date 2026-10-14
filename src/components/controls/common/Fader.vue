<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ name: 'StudioFader' })

interface Props {
  modelValue: number
  min?: number
  max?: number
  step?: number
  label?: string
  unit?: string
  decimals?: number
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 1,
  label: '',
  unit: '',
  decimals: 1,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const percentage = computed(() => ((props.modelValue - props.min) / (props.max - props.min)) * 100)
const formattedValue = computed(() => props.modelValue.toFixed(props.decimals))

function handleInput(event: Event) {
  emit('update:modelValue', Number((event.target as HTMLInputElement).value))
}
</script>

<template>
  <div class="fader">
    <div class="label">
      {{ label }} <span class="value">{{ formattedValue }} {{ unit }}</span>
    </div>
    <input
      class="range"
      type="range"
      :aria-label="label"
      :aria-valuetext="`${formattedValue} ${unit}`.trim()"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      :style="{ '--position': `${percentage}%` }"
      @input="handleInput"
    />
  </div>
</template>

<style scoped>
.fader {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.range {
  appearance: none;
  width: 100%;
  height: 44px;
  margin: 0;
  background:
    linear-gradient(var(--color-accent), var(--color-accent)) left center / var(--position) 4px
      no-repeat,
    linear-gradient(#405247, #405247) center / 100% 4px no-repeat;
  cursor: pointer;
}

.range::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border: 0;
  border-radius: 50%;
  background: var(--color-accent);
}

.range::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border: 0;
  border-radius: 50%;
  background: var(--color-accent);
}

.range:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 3px;
}

.label {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.75rem;
  color: var(--color-muted);
}

.value {
  font-size: 0.75rem;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}
</style>
