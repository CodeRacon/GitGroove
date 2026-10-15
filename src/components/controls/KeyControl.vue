<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { ROOT_KEYS, type RootKey } from '@/studio/state'
const props = defineProps<{ modelValue: RootKey }>()
const emit = defineEmits<{ 'update:modelValue': [key: RootKey] }>()
const keyboard = ref<HTMLElement | null>(null)
const white = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const black = ['C#', 'Eb', 'F#', 'Ab', 'Bb']
const positions = [1, 2, 4, 5, 6]
function position(key: RootKey) {
  const index = white.indexOf(key)
  return index >= 0
    ? { left: `${(index * 100) / 7}%`, width: `${100 / 7}%` }
    : {
        left: `${((positions[black.indexOf(key)] - 0.3) * 100) / 7}%`,
        width: `${(0.6 * 100) / 7}%`,
      }
}
function label(key: string) {
  return key.replace('#', '♯').replace('b', '♭')
}
async function navigate(event: KeyboardEvent) {
  const index = ROOT_KEYS.indexOf(props.modelValue)
  const keys: Record<string, number> = {
    ArrowRight: (index + 1) % 12,
    ArrowUp: (index + 1) % 12,
    ArrowLeft: (index + 11) % 12,
    ArrowDown: (index + 11) % 12,
    Home: 0,
    End: 11,
  }
  if (!(event.key in keys)) return
  event.preventDefault()
  emit('update:modelValue', ROOT_KEYS[keys[event.key]])
  await nextTick()
  keyboard.value?.querySelectorAll<HTMLButtonElement>('button')[keys[event.key]]?.focus()
}
</script>

<template>
  <div class="key-control">
    <div class="key-label">
      <span>Root key</span><strong>{{ label(modelValue) }} major</strong>
    </div>
    <div
      ref="keyboard"
      class="keyboard"
      role="radiogroup"
      aria-label="Root key"
      @keydown="navigate"
    >
      <button
        v-for="key in ROOT_KEYS"
        :key="key"
        class="piano-key"
        :class="{ black: black.includes(key), selected: modelValue === key }"
        :style="position(key)"
        type="button"
        role="radio"
        :aria-label="`${key} major`"
        :aria-checked="modelValue === key"
        :tabindex="modelValue === key ? 0 : -1"
        @click="emit('update:modelValue', key)"
      >
        {{ label(key) }}
      </button>
    </div>
    <p class="hint">
      Transpose all three voices while the loop keeps playing. New notes follow your choice;
      existing notes and effects can ring out.
    </p>
  </div>
</template>

<style scoped>
.key-control {
  margin: 0 0 20px;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
}
.key-label {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.8rem;
  max-width: 420px;
  margin-bottom: 10px;
  color: var(--color-muted);
}
.key-label strong {
  color: var(--color-accent);
  font-weight: 600;
}
.keyboard {
  height: 72px;
  position: relative;
  width: 100%;
  max-width: 420px;
}
.piano-key {
  position: absolute;
  height: 72px;
  padding: 0 0 8px;
  display: flex;
  align-items: end;
  justify-content: center;
  background: #e5eee3;
  color: #172019;
  border: 1px solid #101512;
  border-radius: 0 0 4px 4px;
  font-size: 0.75rem;
}
.piano-key.black {
  height: 44px;
  z-index: 1;
  background: #202c24;
  color: #edf3ee;
  font-size: 0.65rem;
}
.piano-key.selected {
  background: var(--color-accent);
  color: #101512;
}
.piano-key:focus-visible {
  z-index: 2;
  outline-color: #fff;
  outline-offset: -3px;
}
.hint {
  margin-top: 12px;
}
</style>
