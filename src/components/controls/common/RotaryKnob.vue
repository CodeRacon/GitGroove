<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  modelValue: number
  min?: number
  max?: number
  step?: number
  label?: string
  unit?: string
  scaleSteps?: number
}
const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 1,
  label: '',
  unit: '',
  scaleSteps: 16,
})
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()
const rotation = computed(
  () =>
    Math.max(0, Math.min(1, (props.modelValue - props.min) / (props.max - props.min))) * 270 - 135,
)
const scaleIndicators = computed(() =>
  Array.from({ length: props.scaleSteps }, (_, i) => ({
    angle: -225 + (270 * i) / (props.scaleSteps - 1),
    isActive:
      i / (props.scaleSteps - 1) <= (props.modelValue - props.min) / (props.max - props.min),
  })),
)
const dragStartY = ref<number | null>(null)
let startValue = 0
const decimals = computed(() => Math.max(0, props.step.toString().split('.')[1]?.length ?? 0))
const formattedValue = computed(() => props.modelValue.toFixed(decimals.value))
function update(value: number) {
  const rounded = Math.round(value / props.step) * props.step
  emit('update:modelValue', Number(Math.max(props.min, Math.min(props.max, rounded)).toFixed(6)))
}
function startDrag(event: PointerEvent) {
  if (event.button !== 0) return
  const target = event.currentTarget as HTMLElement
  target.focus({ preventScroll: true })
  target.setPointerCapture(event.pointerId)
  dragStartY.value = event.clientY
  startValue = props.modelValue
}
function drag(event: PointerEvent) {
  if (dragStartY.value === null) return
  update(startValue + ((dragStartY.value - event.clientY) / 150) * (props.max - props.min))
}
function endDrag() {
  dragStartY.value = null
}
function onKeydown(event: KeyboardEvent) {
  const values: Record<string, number> = {
    ArrowUp: props.modelValue + props.step,
    ArrowRight: props.modelValue + props.step,
    ArrowDown: props.modelValue - props.step,
    ArrowLeft: props.modelValue - props.step,
    PageUp: props.modelValue + props.step * 10,
    PageDown: props.modelValue - props.step * 10,
    Home: props.min,
    End: props.max,
  }
  if (!(event.key in values)) return
  event.preventDefault()
  if (event.key === 'Home' || event.key === 'End') emit('update:modelValue', values[event.key])
  else update(values[event.key])
}
</script>

<template>
  <div class="rotary-knob">
    <div class="knob-container">
      <div class="scale-indicators" aria-hidden="true">
        <i
          v-for="(indicator, index) in scaleIndicators"
          :key="index"
          class="scale-dot"
          :class="{ active: indicator.isActive }"
          :style="{ transform: `rotate(${indicator.angle}deg) translateX(27px)` }"
        ></i>
      </div>
      <div
        class="knob"
        role="slider"
        tabindex="0"
        :aria-label="label"
        aria-orientation="vertical"
        :aria-valuemin="min"
        :aria-valuemax="max"
        :aria-valuenow="modelValue"
        :aria-valuetext="`${formattedValue} ${unit}`.trim()"
        :title="`${label}: ${formattedValue} ${unit}. Drag up or down, or use arrow keys.`"
        @pointerdown="startDrag"
        @pointermove="drag"
        @pointerup="endDrag"
        @pointercancel="endDrag"
        @lostpointercapture="endDrag"
        @keydown="onKeydown"
      >
        <span class="indicator" :style="{ transform: `rotate(${rotation}deg)` }"></span>
      </div>
    </div>
    <span class="label">{{ label }}</span>
    <span class="value"
      >{{ formattedValue }}<span v-if="unit"> {{ unit }}</span></span
    >
  </div>
</template>

<style scoped>
.rotary-knob {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  user-select: none;
}
.knob-container {
  position: relative;
  width: 64px;
  height: 64px;
}
.scale-indicators {
  position: absolute;
  width: 100%;
  height: 100%;
}
.scale-dot {
  position: absolute;
  width: 3px;
  height: 3px;
  background: #405247;
  border-radius: 50%;
  left: 50%;
  top: 50%;
  transform-origin: 0 0;
}
.scale-dot.active {
  background: var(--color-accent);
}
.knob {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--color-surface-raised);
  border: 1px solid #516858;
  cursor: ns-resize;
  touch-action: none;
}
.knob:hover {
  background: #2a3930;
  border-color: var(--color-accent);
}
.indicator {
  position: absolute;
  top: 5px;
  left: calc(50% - 1px);
  width: 2px;
  height: 16px;
  background: var(--color-accent);
  transform-origin: bottom;
  border-radius: 1px;
}
.label {
  font-size: 0.7rem;
  color: var(--color-muted);
  text-align: center;
}
.value {
  font-size: 0.7rem;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
  margin-top: 2px;
}
</style>
