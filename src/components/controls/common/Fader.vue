<script setup lang="ts">
import { computed } from 'vue'

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
  align-items: center;
  width: 100%;
  padding-bottom: 8px;
}

.range {
  appearance: none;
  width: 100%;
  height: 20px;
  margin: 0;
  background: linear-gradient(#4caf50, #4caf50) left center / var(--position) 6px no-repeat,
    linear-gradient(#1a1a1a, #1a1a1a) center / 100% 6px no-repeat;
  cursor: pointer;
}

.range::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 20px;
  border: 0;
  border-radius: 4px;
  background: linear-gradient(145deg, #2a2a2a, #323232);
  box-shadow: 2px 2px 4px #1a1a1a;
}

.range::-moz-range-thumb {
  width: 12px;
  height: 20px;
  border: 0;
  border-radius: 4px;
  background: linear-gradient(145deg, #2a2a2a, #323232);
  box-shadow: 2px 2px 4px #1a1a1a;
}

.range:focus-visible {
  outline: 2px solid #4caf50;
  outline-offset: 3px;
}

.label {
  font-size: 12px;
  color: #888;
  margin-bottom: 0.75rem;
}

.value {
  font-size: 10px;
  color: #4caf50;
}
</style>
