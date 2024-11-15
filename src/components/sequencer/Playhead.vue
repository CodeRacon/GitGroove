<script setup lang="ts">
import { computed } from 'vue'

/**
 * Defines the props for the Playhead component.
 *
 * @param {number} position - The current position of the playhead.
 * @param {number} [progress=0] - The current progress of the playhead.
 * @param {number} [startPosition=0] - The starting position of the playhead.
 * @param {number} totalBars - The total number of bars in the sequence.
 * @param {number} [barWidth=12] - The width of each bar in the sequence.
 * @param {number} [barGap=4] - The gap between each bar in the sequence.
 * @param {boolean} [isLooping=false] - Whether the sequence is looping.
 */
const props = defineProps({
  position: {
    type: Number,
    required: true,
  },
  progress: {
    type: Number,
    default: 0,
  },
  startPosition: {
    type: Number,
    default: 0,
  },
  totalBars: {
    type: Number,
    required: true,
  },
  barWidth: {
    type: Number,
    default: 12,
  },
  barGap: {
    type: Number,
    default: 4,
  },
  isLooping: {
    type: Boolean,
    default: false,
  },
})

/**
 * Computes the position of the playhead based on the current position, progress, and other configuration options.
 *
 * @param {number} props.position - The current position of the playhead.
 * @param {number} props.progress - The current progress of the playhead.
 * @param {number} props.startPosition - The starting position of the playhead.
 * @param {number} props.totalBars - The total number of bars in the sequence.
 * @param {number} props.barWidth - The width of each bar in the sequence.
 * @param {number} props.barGap - The gap between each bar in the sequence.
 * @param {boolean} props.isLooping - Whether the sequence is looping.
 * @returns {Object} - The computed position of the playhead.
 */
const playheadPosition = computed(() => {
  const weekWidth = props.barWidth + props.barGap
  const basePosition = props.position * weekWidth
  const progressOffset = props.progress * weekWidth

  return {
    left: `${basePosition + progressOffset}px`,
  }
})
</script>

<template>
  <div class="playhead-container">
    <div class="playhead" :class="{ 'no-transition': isLooping }" :style="playheadPosition">
      <div class="playhead-line"></div>
      <div class="playhead-marker"></div>
    </div>
  </div>
</template>

<style scoped>
.playhead-container {
  position: absolute;
  top: -8px;
  left: 0;
  width: 100%;
  height: 108%;
  pointer-events: none;
}

.playhead {
  position: absolute;
  z-index: 5;
  height: calc(100% + 8px);
}

.no-transition {
  transition: none;
}

.playhead-line {
  position: absolute;
  width: 2px;
  height: 100%;
  background: #42b883;
  left: 50%;
  transform: translateX(-50%);
}

.playhead-marker {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #42b883;
  border-radius: 50%;
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
}
</style>
