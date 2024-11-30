<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  modelValue: number
  min?: number
  max?: number
  step?: number
  label?: string
  unit?: string
  decimals?: number
}

/**
 * Initializes the orchestrator, which is responsible for managing the audio playback and harmony updates based on the user's GitHub contributions.
 */
const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 1,
  label: '',
  unit: '',
  decimals: 1,
})

/**
 * Emits an event to update the `modelValue` prop.
 */
const emit = defineEmits(['update:modelValue'])

/**
 * Computes the percentage value of the fader based on the `modelValue` prop.
 * The percentage is calculated as the ratio of the `modelValue` to the range between the `min` and `max` props, multiplied by 100.
 */
const percentage = computed(() => {
  const range = props.max - props.min
  return ((props.modelValue - props.min) / range) * 100
})

const isDragging = ref(false)
const startY = ref(0)
const startValue = ref(0)

/**
 * Starts the drag event for the fader handle.
 * Sets the `isDragging` flag to true, stores the initial mouse position and the current `modelValue`,
 * and adds event listeners for `mousemove` and `mouseup` events to handle the drag and drop functionality.
 * @param event - The `MouseEvent` object representing the mouse down event.
 */
const startDrag = (event: MouseEvent) => {
  isDragging.value = true
  startY.value = event.clientY
  startValue.value = props.modelValue
  window.addEventListener('mousemove', drag)
  window.addEventListener('mouseup', stopDrag)
}

/**
 * Handles the drag event for the fader handle.
 * Calculates the new value of the fader based on the relative position of the mouse within the track,
 * and emits an event to update the `modelValue` prop.
 * @param event - The `MouseEvent` object representing the mouse move event.
 */
const drag = (event: MouseEvent) => {
  if (!isDragging.value) return

  const rect = (event.target as HTMLElement).closest('.track')?.getBoundingClientRect()
  if (!rect) return

  const relativePosition = (event.clientX - rect.left) / rect.width

  let newValue = props.min + (props.max - props.min) * relativePosition
  newValue = Math.round(newValue / props.step) * props.step
  newValue = Math.max(props.min, Math.min(props.max, newValue))

  emit('update:modelValue', newValue)
}

/**
 * Stops the drag event for the fader handle.
 * Sets the `isDragging` flag to false and removes the event listeners for `mousemove` and `mouseup` events.
 */
const stopDrag = () => {
  isDragging.value = false
  window.removeEventListener('mousemove', drag)
  window.removeEventListener('mouseup', stopDrag)
}

/**
 * Computes the formatted value of the `modelValue` prop, rounding it to the specified number of decimal places.
 * This computed property is used to display the current value of the fader in the UI.
 */
const formattedValue = computed(() => {
  return props.modelValue.toFixed(props.decimals)
})
</script>

<template>
  <div class="fader">
    <div class="label">
      {{ label }} <span class="value">{{ formattedValue }} {{ unit }}</span>
    </div>
    <div class="track">
      <div class="handle" :style="{ left: `${percentage}%` }" @mousedown="startDrag"></div>
    </div>
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

.track {
  width: 100%;
  height: 6px;
  background: #1a1a1a;
  border-radius: 3px;
  position: relative;
}

.handle {
  width: 12px;
  height: 20px;
  background: linear-gradient(145deg, #2a2a2a, #323232);
  box-shadow: 2px 2px 4px #1a1a1a;
  border-radius: 4px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  cursor: grab;
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

.handle:active {
  box-shadow: 1px 1px 3px #1a1a1a;
}
</style>
