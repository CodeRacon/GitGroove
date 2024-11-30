<script setup lang="ts">
interface Props {
  modelValue: boolean
  label?: string
}

/**
 * Defines the props for the ToggleSwitch component.
 *
 * @property {boolean} modelValue - The current value of the toggle switch.
 * @property {string} [label] - An optional label for the toggle switch.
 */
const props = withDefaults(defineProps<Props>(), {
  label: '',
})

/**
 * Emits an event to update the `modelValue` prop.
 */
const emit = defineEmits(['update:modelValue'])

/**
 * Toggles the value of the `modelValue` prop and emits an event to update it.
 */
const toggle = () => {
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <div class="toggle-switch">
    <div class="label">{{ label }}</div>
    <div class="switch" :class="{ active: modelValue }" @click="toggle">
      <div class="handle"></div>
    </div>
  </div>
</template>

<style scoped>
.toggle-switch {
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  gap: 8px;
}

.switch {
  width: 40px;
  height: 20px;
  background: #1a1a1a;
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s;
}

.switch.active {
  background: #4caf50;
}

.handle {
  width: 16px;
  height: 16px;
  background: linear-gradient(145deg, #2a2a2a, #323232);
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.2s;
}

.switch.active .handle {
  transform: translateX(20px);
}

.label {
  font-size: 12px;
  color: #888;
  cursor: default;
}
</style>
