<script lang="ts">
export default {
  name: 'PlayPauseButton',
}
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

/**
 * Defines the props for the `PlayPauseButton` component.
 * @prop {boolean} isPlaying - Indicates whether the audio is currently playing.
 */
const props = defineProps({
  isPlaying: {
    type: Boolean,
    required: true,
  },
})

/**
 * Defines the events that can be emitted by the `PlayPauseButton` component.
 * @event play - Emitted when the user requests to play the audio.
 * @event pause - Emitted when the user requests to pause the audio.
 * @event stop - Emitted when the user requests to stop the audio.
 */
const emit = defineEmits(['play', 'pause', 'stop'])

/**
 * Toggles the play/pause state of the audio and emits the appropriate event.
 * If the audio is currently playing, it emits the 'pause' event. Otherwise, it emits the 'play' event.
 */
const togglePlay = () => {
  emit(props.isPlaying ? 'pause' : 'play')
}

/**
 * Emits the 'stop' event to indicate that the user has requested to stop the audio.
 */
const handleStop = () => {
  emit('stop')
}

/**
 * Computes the appropriate button icon based on the current play/pause state.
 * If the audio is currently playing, the 'pauseIcon' is returned. Otherwise, the 'playIcon' is returned.
 */
const buttonIcon = computed(() => (props.isPlaying ? pauseIcon : playIcon))

const playIcon = /*html*/ `
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M8 17.175V6.825q0-.425.3-.713t.7-.287q.125 0 .263.037t.262.113l8.15 5.175q.225.15.338.375t.112.475t-.112.475t-.338.375l-8.15 5.175q-.125.075-.262.113T9 18.175q-.4 0-.7-.288t-.3-.712"/></svg>
`
const pauseIcon = /*html*/ `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M16 19q-.825 0-1.412-.587T14 17V7q0-.825.588-1.412T16 5t1.413.588T18 7v10q0 .825-.587 1.413T16 19m-8 0q-.825 0-1.412-.587T6 17V7q0-.825.588-1.412T8 5t1.413.588T10 7v10q0 .825-.587 1.413T8 19"/></svg>
`
const stopIcon = /*html*/ `
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M6 16V8q0-.825.588-1.412T8 6h8q.825 0 1.413.588T18 8v8q0 .825-.587 1.413T16 18H8q-.825 0-1.412-.587T6 16"/></svg>
`
</script>

<template>
  <div class="playback-controls">
    <button class="play-pause-button" :class="{ playing: isPlaying }" @click="togglePlay">
      <div class="button-content" v-html="buttonIcon"></div>
    </button>
    <button class="stop-button" @click="handleStop">
      <div class="button-content" v-html="stopIcon"></div>
    </button>
  </div>
</template>

<style scoped>
.play-pause-button {
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #2d692f, #3b893e);
  box-shadow:
    3px 3px 5px #1a1a1a,
    -1px -1px 1px #55b758;
  transition: all 0.1s ease-in;
}

.play-button:active,
.play-pause-button.playing {
  background: linear-gradient(145deg, #3a863c, #47a34a);
  box-shadow:
    inset 0.5px 0.5px 3px #1a1a1a,
    inset -1px -1px 1px #55b758;
}

.stop-button {
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #88322f, #a83e3a);
  box-shadow:
    3px 3px 5px #1a1a1a,
    -1px -1px 1px #d75c58;
  transition: all 0.1s ease-in;
}

.stop-button:active {
  background: linear-gradient(145deg, #aa3f3b, #c9403b);
  box-shadow:
    inset 0.5px 0.5px 3px #1a1a1a,
    inset -1px -1px 1px #d75c58;
}

.button-content {
  display: flex;
}

.playback-controls {
  display: flex;
  gap: 1rem;
}
</style>
