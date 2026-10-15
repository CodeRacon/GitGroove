<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  totalWeeks: number
  selectedBars: number
  start: number
  disabled?: boolean
}>()
const emit = defineEmits<{ 'update:range': [range: { start: number; bars: number }] }>()
const dragStartX = ref<number | null>(null)
const bracketRef = ref<HTMLElement | null>(null)
watch(
  () => props.start,
  () => {
    if (document.activeElement === bracketRef.value)
      bracketRef.value?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  },
  { flush: 'post' },
)
let initialStart = 0
const maxStart = computed(() => Math.max(0, props.totalWeeks - props.selectedBars))
const bracketPosition = computed(() => ({
  left: `${props.start * 16}px`,
  width: `${props.selectedBars * 16 - 4}px`,
}))
function updateStart(start: number) {
  const next = Math.max(0, Math.min(maxStart.value, start))
  if (next !== props.start) emit('update:range', { start: next, bars: props.selectedBars })
}
function startDrag(event: PointerEvent) {
  if (props.disabled || event.button !== 0) return
  const target = event.currentTarget as HTMLElement
  target.focus({ preventScroll: true })
  target.setPointerCapture(event.pointerId)
  dragStartX.value = event.clientX
  initialStart = props.start
}
function drag(event: PointerEvent) {
  if (dragStartX.value === null || props.disabled) return
  updateStart(initialStart + Math.round((event.clientX - dragStartX.value) / 16))
}
function endDrag() {
  dragStartX.value = null
}
function onKeydown(event: KeyboardEvent) {
  if (props.disabled) return
  const values: Record<string, number> = {
    ArrowLeft: props.start - 1,
    ArrowDown: props.start - 1,
    ArrowRight: props.start + 1,
    ArrowUp: props.start + 1,
    Home: 0,
    End: maxStart.value,
    PageUp: props.start + 4,
    PageDown: props.start - 4,
  }
  if (!(event.key in values)) return
  event.preventDefault()
  updateStart(values[event.key])
}
</script>

<template>
  <div class="bracket-container">
    <div
      ref="bracketRef"
      class="bracket"
      role="slider"
      :tabindex="disabled ? -1 : 0"
      aria-label="Selection start week"
      aria-orientation="horizontal"
      :aria-disabled="!!disabled"
      :aria-valuemin="1"
      :aria-valuemax="maxStart + 1"
      :aria-valuenow="start + 1"
      :aria-valuetext="`Weeks ${start + 1} through ${start + selectedBars}`"
      :style="bracketPosition"
      :class="{ dragging: dragStartX !== null }"
      @pointerdown="startDrag"
      @pointermove="drag"
      @pointerup="endDrag"
      @pointercancel="endDrag"
      @lostpointercapture="endDrag"
      @keydown="onKeydown"
    >
      <span class="handle" aria-hidden="true"></span
      ><span class="bracket-body" aria-hidden="true">⋮⋮</span
      ><span class="handle" aria-hidden="true"></span>
    </div>
  </div>
</template>

<style scoped>
.bracket-container {
  position: relative;
  width: 100%;
  height: 44px;
}
.bracket {
  position: absolute;
  top: 4px;
  height: 32px;
  display: flex;
  align-items: stretch;
  color: var(--color-accent);
  cursor: grab;
  touch-action: none;
  user-select: none;
  border: 1px solid var(--color-accent);
  border-radius: 3px;
  background: var(--color-accent-soft);
}
.bracket::before {
  content: '';
  position: absolute;
  top: -6px;
  bottom: -6px;
  left: 0;
  right: 0;
}
.bracket.dragging {
  cursor: grabbing;
}
.bracket-body {
  flex: 1;
  text-align: center;
  line-height: 28px;
  overflow: hidden;
}
.handle {
  width: 3px;
  background: var(--color-accent);
}
.bracket[aria-disabled='true'] {
  cursor: wait;
  opacity: 0.55;
}
</style>
