<script setup lang="ts">
withDefaults(defineProps<{ modelValue: boolean; label?: string }>(), { label: '' })
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

<template>
  <button
    class="toggle-switch"
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="label"
    @click="emit('update:modelValue', !modelValue)"
  >
    <span class="switch" :class="{ active: modelValue }" aria-hidden="true"
      ><span class="handle"></span
    ></span>
    <span class="label">{{ label }}</span>
  </button>
</template>

<style scoped>
.toggle-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-muted);
  font-size: 0.75rem;
}
.switch {
  width: 36px;
  height: 20px;
  background: #33473a;
  border: 1px solid #597361;
  border-radius: 12px;
  position: relative;
  flex-shrink: 0;
}
.switch.active {
  background: var(--color-accent-soft);
  border-color: var(--color-accent);
}
.handle {
  width: 12px;
  height: 12px;
  background: #a6b7ac;
  border-radius: 50%;
  position: absolute;
  top: 3px;
  left: 3px;
  transition: transform 0.15s;
}
.switch.active .handle {
  transform: translateX(16px);
  background: var(--color-accent);
}
.toggle-switch:hover {
  color: var(--color-text);
}
</style>
