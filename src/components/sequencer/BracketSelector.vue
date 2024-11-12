<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps({
  totalWeeks: { type: Number, required: true },
  selectedBars: { type: Number, required: true },
  gridWidth: { type: Number, required: true },
})

const startBar = ref(0)
const isDragging = ref(false)
const dragStartX = ref(0)
const initialStart = ref(0)

const BAR_WIDTH = 12
const BAR_GAP = 4

const pixelsPerBar = computed(() => BAR_WIDTH + BAR_GAP)
const bracketWidth = computed(
  () => props.selectedBars * BAR_WIDTH + (props.selectedBars - 1) * BAR_GAP,
)

const emit = defineEmits(['update:range', 'positionChange'])

watch(startBar, (newValue) => {
  emit('positionChange', newValue)
})

const startDrag = (e: MouseEvent) => {
  isDragging.value = true
  dragStartX.value = e.clientX
  initialStart.value = startBar.value

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return

    const delta = Math.round((e.clientX - dragStartX.value) / pixelsPerBar.value)
    startBar.value = Math.max(
      0,
      Math.min(props.totalWeeks - props.selectedBars, initialStart.value + delta),
    )

    emit('update:range', { start: startBar.value, bars: props.selectedBars })
  }

  const handleMouseUp = () => {
    isDragging.value = false
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  }

  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
}

const bracketPosition = computed(() => ({
  left: `${startBar.value * pixelsPerBar.value}px`,
  width: `${bracketWidth.value}px`,
}))
</script>

<template>
  <div class="bracket-container">
    <div class="bracket" :style="bracketPosition">
      <div class="handle left">
        <div class="handle-grip"></div>
      </div>
      <div class="bracket-body" @mousedown="startDrag">
        <div class="bar-markers">
          <div
            v-for="n in selectedBars"
            :key="n"
            class="bar-marker"
            :style="{
              width: `${BAR_WIDTH}px`,
              marginRight: n !== selectedBars ? `${BAR_GAP}px` : '0',
            }"
          ></div>
        </div>
      </div>
      <div class="handle right">
        <div class="handle-grip"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bracket-container {
  position: relative;
  width: 100%;
  height: 24px;
  margin: 1rem 0;
}

.bracket {
  position: absolute;
  height: 100%;
  display: flex;
  align-items: stretch;
}

.handle {
  width: 0.875rem;
  min-width: 14px;
  background: #42b883;
  display: flex;
  align-items: center;
  justify-content: center;
}

.handle-grip {
  width: 2px;
  height: 12px;
  background: white;
}

.bracket-body {
  border-top: 2px solid #42b883;
  border-bottom: 2px solid #42b883;
  cursor: grab;
}

.bracket-body:active {
  cursor: grabbing;
}

.bar-markers {
  display: flex;
  height: 100%;
}

.bar-marker {
  background-color: #42b88380;
}
</style>
