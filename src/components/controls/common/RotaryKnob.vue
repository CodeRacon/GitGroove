<script lang="ts">
export default {
  name: 'RotaryKnob',
}
</script>

<script setup lang="ts">
import { ref, computed } from 'vue'

defineOptions({
  name: 'RotaryKnob',
})

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

const emit = defineEmits(['update:modelValue'])

const rotation = computed(() => {
  const range = props.max - props.min
  const percentage = ((props.modelValue - props.min) / range) * 100
  return (percentage * 270) / 100 - 135
})
const scaleIndicators = computed(() => {
  const indicators = []
  const range = props.max - props.min
  const currentPercentage = ((props.modelValue - props.min) / range) * 100

  for (let i = 0; i < props.scaleSteps; i++) {
    const angle = -225 + (270 * i) / (props.scaleSteps - 1)
    const percentage = (i / (props.scaleSteps - 1)) * 100
    const isActive = percentage <= currentPercentage
    indicators.push({ angle, isActive })
  }
  return indicators
})

const isDragging = ref(false)
const startY = ref(0)
const startValue = ref(0)

const startDrag = (event: MouseEvent) => {
  isDragging.value = true
  startY.value = event.clientY
  startValue.value = props.modelValue
  window.addEventListener('mousemove', drag)
  window.addEventListener('mouseup', stopDrag)
}

const drag = (event: MouseEvent) => {
  if (!isDragging.value) return

  const deltaY = startY.value - event.clientY
  const range = props.max - props.min
  const deltaValue = (deltaY / 100) * range

  let newValue = startValue.value + deltaValue
  newValue = Math.round(newValue / props.step) * props.step
  newValue = Math.max(props.min, Math.min(props.max, newValue))

  emit('update:modelValue', newValue)
}

const stopDrag = () => {
  isDragging.value = false
  window.removeEventListener('mousemove', drag)
  window.removeEventListener('mouseup', stopDrag)
}

const formattedValue = computed(() => {
  return typeof props.modelValue === 'number' ? props.modelValue.toFixed(1) : '0.0'
})
</script>

<template>
  <div class="rotary-knob">
    <div class="knob-container">
      <div class="scale-indicators">
        <div
          v-for="(indicator, index) in scaleIndicators"
          :key="index"
          class="scale-dot"
          :class="{ active: indicator.isActive }"
          :style="{ transform: `rotate(${indicator.angle}deg) translateX(24px)` }"
        ></div>
      </div>
      <div class="knob" @mousedown="startDrag">
        <div class="indicator" :style="{ transform: `rotate(${rotation}deg)` }"></div>
      </div>
    </div>
    <div class="label">{{ label }}</div>
    <div class="value">{{ formattedValue }}{{ unit }}</div>
  </div>
</template>

<style scoped>
.rotary-knob {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 70px;
  user-select: none;
}

.knob-container {
  position: relative;
  width: 60px;
  height: 60px;
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
  background: #333;
  border-radius: 50%;
  left: 50%;
  top: 50%;
  transform-origin: 0 0;
  transition: background 0.2s ease;
}

.scale-dot.active {
  background: #4caf50;
  box-shadow: 0 0 4px #4caf50;
}

.knob {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(145deg, #2a2a2a, #323232);
  box-shadow:
    3px 3px 5px #1a1a1a,
    -1px -1px 1px #363636;
  cursor: pointer;
}

.indicator {
  position: absolute;
  top: 5px;
  left: 50%;
  width: 2px;
  height: 15px;
  background-color: #4caf50;
  transform-origin: bottom;
  transition: transform 0.2s ease;
}

.label {
  font-size: 10px;
  color: #888;
  cursor: default;
}

.value {
  font-size: 10px;
  color: #4caf50;
  margin-top: 2px;
}
</style>
