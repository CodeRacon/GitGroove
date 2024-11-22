<script lang="ts">
export default {
  name: 'BracketSelector',
}
</script>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

/**
 * Defines the props for the BracketSelector component.
 *
 * @param {number} totalWeeks - The total number of weeks to display.
 * @param {number} selectedBars - The number of bars to display.
 * @param {number} gridWidth - The width of the grid.
 */
const props = defineProps({
  totalWeeks: { type: Number, required: true },
  selectedBars: { type: Number, required: true },
  gridWidth: { type: Number, required: true },
})

/**
 * Reactive references used for managing the state of the bracket selector:
 * - `startBar`: The index of the first bar to display in the bracket selector.
 * - `isDragging`: A flag indicating whether the user is currently dragging the bracket.
 * - `dragStartX`: The initial X coordinate of the mouse pointer when the user starts dragging.
 * - `initialStart`: The initial value of `startBar` when the user starts dragging.
 */
const startBar = ref(0)
const isDragging = ref(false)
const dragStartX = ref(0)
const initialStart = ref(0)

/**
 * Constants defining the width and gap between bars in the sequencer UI.
 *
 * @constant {number} BAR_WIDTH - The width of each bar in the sequencer UI.
 * @constant {number} BAR_GAP - The gap between each bar in the sequencer UI.
 */
const BAR_WIDTH = 12
const BAR_GAP = 4

/**
 * Computes the number of pixels per bar in the sequencer UI, based on the defined bar width and gap.
 *
 * @returns {number} The number of pixels per bar.
 */
const pixelsPerBar = computed(() => BAR_WIDTH + BAR_GAP)

/**
 * Computes the width of the bracket selector based on the number of selected bars and the defined bar width and gap.
 *
 * @returns {number} The width of the bracket selector in pixels.
 */
const bracketWidth = computed(
  () => props.selectedBars * BAR_WIDTH + (props.selectedBars - 1) * BAR_GAP,
)

/**
 * Emits events to notify other components about changes to the range or position of the bracket selector.
 *
 * @event update:range - Emitted when the start or number of selected bars changes.
 * @event positionChange - Emitted when the position of the bracket selector changes.
 */
const emit = defineEmits(['update:range', 'positionChange'])

/**
 * Watches for changes to the `selectedBars` prop and updates the `startBar` value accordingly.
 *
 * When the `selectedBars` prop changes, this watcher ensures that the `startBar` value is updated to
 * be within the valid range (between 0 and `totalWeeks - selectedBars`). It then emits an `update:range`
 * event with the updated `start` and `bars` values.
 */
watch(
  () => props.selectedBars,
  () => {
    const maxStart = props.totalWeeks - props.selectedBars
    startBar.value = Math.min(startBar.value, maxStart)
    emit('update:range', { start: startBar.value, bars: props.selectedBars })
  },
)

/**
 * Handles the start of a drag operation on the bracket selector.
 *
 * This function is called when the user starts dragging the bracket selector. It sets the `isDragging` flag to `true`,
 * stores the initial mouse position and the initial `startBar` value, and adds event listeners for `mousemove` and
 * `mouseup` events to handle the drag operation.
 *
 * @param {MouseEvent} e - The mouse down event object.
 */
const startDrag = (e: MouseEvent) => {
  isDragging.value = true
  dragStartX.value = e.clientX
  initialStart.value = startBar.value

  /**
   * Handles the mouse move event during a drag operation on the bracket selector.
   *
   * This function is called when the user drags the bracket selector. It calculates the new
   * start bar position based on the mouse movement and updates the `startBar` value
   * accordingly. It then emits an `update:range` event to notify other components of the
   * updated range.
   *
   * @param {MouseEvent} e - The mouse move event object.
   */
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return

    const delta = Math.round((e.clientX - dragStartX.value) / pixelsPerBar.value)
    startBar.value = Math.max(
      0,
      Math.min(props.totalWeeks - props.selectedBars, initialStart.value + delta),
    )

    emit('update:range', { start: startBar.value, bars: props.selectedBars })
  }

  /**
   * Handles the mouse up event during a drag operation on the bracket selector.
   *
   * This function is called when the user releases the mouse after dragging the bracket selector.
   * It sets the `isDragging` flag to `false` and removes the event listeners for `mousemove` and
   * `mouseup` events, which were added during the drag operation.
   */
  const handleMouseUp = () => {
    isDragging.value = false
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  }

  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
}

/**
 * Computes the position and width of the bracket element based on the `startBar` value and the `bracketWidth`.
 *
 * The `left` property is calculated by multiplying the `startBar` value by the `pixelsPerBar` value, which represents the
 * number of pixels per bar in the UI. The `width` property is set to the `bracketWidth` value.
 *
 * This computed property is used to position and size the bracket element in the UI, which represents the selected range
 * of bars in the sequencer.
 */
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
  background: #4caf50;
  display: flex;
  align-items: center;
  justify-content: center;
}

.handle-grip {
  width: 2px;
  height: 12px;
  background: #cad9cb;
}

.bracket-body {
  border-top: 2px solid #4caf50;
  border-bottom: 2px solid #4caf50;
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
  background-color: #4caf5080;
}
</style>
