<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  position: {
    type: Number,
    required: true,
  },
  progress: {
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
})

const playheadPosition = computed(() => ({
  left: `${(props.position + props.progress) * (props.barWidth + props.barGap)}px`,
}))
</script>

<template>
  <div class="playhead-container">
    <div class="playhead" :style="playheadPosition">
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
  height: calc(100% + 8px);
  transition: left 0.1s linear;
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
