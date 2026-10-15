<script setup lang="ts">
const props = defineProps<{ isPlaying: boolean; disabled?: boolean }>()
const emit = defineEmits<{ play: []; pause: []; stop: [] }>()
function togglePlay() {
  if (props.isPlaying) emit('pause')
  else emit('play')
}
</script>

<template>
  <div class="playback-controls" role="group" aria-label="Playback">
    <button
      class="play-pause-button primary-button"
      :class="{ playing: isPlaying }"
      :disabled="disabled"
      :aria-label="isPlaying ? 'Pause sequence' : 'Play sequence'"
      @click="togglePlay"
    >
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path v-if="isPlaying" d="M6 5h4v14H6zm8 0h4v14h-4z" />
        <path v-else d="M7 4v16l13-8z" />
      </svg>
      {{ isPlaying ? 'Pause' : 'Play' }}
    </button>
    <button
      class="stop-button secondary-button"
      :disabled="disabled"
      aria-label="Stop and return to section start"
      title="Stop and return to section start"
      @click="emit('stop')"
    >
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <rect x="5" y="5" width="14" height="14" rx="2" /></svg
      ><span>Stop</span>
    </button>
  </div>
</template>

<style scoped>
.playback-controls {
  display: flex;
  gap: 8px;
}
button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.85rem;
}
.play-pause-button {
  min-width: 100px;
}
</style>
