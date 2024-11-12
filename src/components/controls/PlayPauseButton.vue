<script setup lang="ts">
import { ref } from 'vue'

const isPlaying = ref(false)
const emit = defineEmits(['play', 'pause', 'stop'])

const togglePlay = () => {
  isPlaying.value = !isPlaying.value
  emit(isPlaying.value ? 'play' : 'pause')
}

const playIcon = /*html*/ `
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M8 17.175V6.825q0-.425.3-.713t.7-.287q.125 0 .263.037t.262.113l8.15 5.175q.225.15.338.375t.112.475t-.112.475t-.338.375l-8.15 5.175q-.125.075-.262.113T9 18.175q-.4 0-.7-.288t-.3-.712"/></svg>
`
const pauseIcon = /*html*/ `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M16 19q-.825 0-1.412-.587T14 17V7q0-.825.588-1.412T16 5t1.413.588T18 7v10q0 .825-.587 1.413T16 19m-8 0q-.825 0-1.412-.587T6 17V7q0-.825.588-1.412T8 5t1.413.588T10 7v10q0 .825-.587 1.413T8 19"/></svg>
`

const stopIcon = /*html*/ `
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M6 16V8q0-.825.588-1.412T8 6h8q.825 0 1.413.588T18 8v8q0 .825-.587 1.413T16 18H8q-.825 0-1.412-.587T6 16"/></svg>
`

const handleStop = () => {
  isPlaying.value = false
  emit('stop')
}
</script>

<template>
  <div class="playback-controls">
    <button class="play-pause-button" :class="{ playing: isPlaying }" @click="togglePlay">
      <div class="button-content" v-html="isPlaying ? pauseIcon : playIcon"></div>
    </button>
    <button class="stop-button" @click="handleStop">
      <div class="button-content" v-html="stopIcon"></div>
    </button>
  </div>
</template>

<style scoped>
.play-pause-button {
  background: #42b883;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-pause-button:hover {
  transform: scale(1.05);
  background: #3aa876;
}

.stop-button {
  background: #a83e3a;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stop-button:hover {
  transform: scale(1.05);
  background: #903633;
}

.play-pause-button.playing {
  background: #3aa876;
}

.button-content {
  display: flex;
}

.playback-controls {
  display: flex;
  gap: 1rem;
}
</style>
