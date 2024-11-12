<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useGitHubStore } from '../stores/github.store'
import { useSequencer } from '../composables/useSequencer'
import BarSelector from '../components/sequencer/BarSelector.vue'
import BracketSelector from '../components/sequencer/BracketSelector.vue'
import PlayPauseButton from '../components/controls/PlayPauseButton.vue'
import Playhead from '../components/sequencer/Playhead.vue'
import BPMControl from '../components/controls/BPMControl.vue'

const githubStore = useGitHubStore()
const username = ref('')
const selectedBars = ref(4)
const startBar = ref(0)
const gridWidth = ref(0)
const gridRef = ref<HTMLElement | null>(null)

const sequencer = useSequencer(selectedBars)

const updateGridWidth = () => {
  if (gridRef.value) {
    gridWidth.value = gridRef.value.offsetWidth
  }
}

onMounted(() => {
  updateGridWidth()
})

const loadContributions = async () => {
  if (username.value) {
    await githubStore.fetchContributions(username.value)
    nextTick(() => {
      updateGridWidth()
    })
  }
}

const updateBars = (bars: number) => {
  selectedBars.value = bars
  sequencer.setStartPosition(startBar.value)
  sequencer.stop()
}

const handleRangeUpdate = ({ start, bars }: { start: number; bars: number }) => {
  startBar.value = start
  sequencer.stop()
  sequencer.setStartPosition(start)
}

const handlePlayback = (isPlaying: boolean) => {
  if (isPlaying) {
    sequencer.play()
  } else {
    sequencer.pause()
  }
}

const handleBPMChange = (newBPM: number) => {
  sequencer.setBPM(newBPM)
}
</script>

<template>
  <main class="grid-view">
    <div class="input-section">
      <input
        v-model="username"
        type="text"
        placeholder="GitHub Username eingeben"
        @keyup.enter="loadContributions"
      />
      <button @click="loadContributions">🎵 Load</button>
    </div>

    <div v-if="githubStore.contributions" class="sequencer-controls">
      <BarSelector :bars="selectedBars" @update:bars="updateBars" />
      <BracketSelector
        v-if="gridWidth"
        :total-weeks="52"
        :selected-bars="selectedBars"
        :grid-width="gridWidth"
        @update:range="handleRangeUpdate"
      />
    </div>

    <div v-if="githubStore.loading" class="status">Loading... 🎼</div>
    <div v-else-if="githubStore.error" class="status error">{{ githubStore.error }} 😕</div>
    <div v-if="githubStore.contributions" ref="gridRef" class="contribution-grid">
      <Playhead
        v-if="sequencer.isPlaying"
        :position="sequencer.currentBar.value"
        :progress="sequencer.progress.value"
        :start-position="startBar.value"
        :total-bars="selectedBars"
        :is-looping="sequencer.isLooping.value"
      />

      <div
        v-for="(week, weekIndex) in githubStore.contributions.weeks"
        :key="weekIndex"
        class="week"
      >
        <div
          v-for="(day, dayIndex) in week.days"
          :key="dayIndex"
          class="day"
          :class="`level-${day.level}`"
        ></div>
      </div>
    </div>

    <div v-if="githubStore.contributions" class="playback-controls">
      <PlayPauseButton
        @play="handlePlayback(true)"
        @pause="handlePlayback(false)"
        @stop="sequencer.stop()"
      />

      <BPMControl :bpm="sequencer.bpm.value" @update:bpm="handleBPMChange" />
    </div>
  </main>
</template>

<style scoped>
.grid-view {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  width: fit-content;
}

.input-section {
  display: flex;
  gap: 1rem;
}

input {
  padding: 0.5rem;
  border: 2px solid #42b883;
  border-radius: 4px;
  font-size: 1rem;
}

button {
  padding: 0.5rem 1rem;
  background: #42b883;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
}

.status {
  font-size: 1.2rem;
}

.error {
  color: #ff4444;
}

.sequencer-controls {
  width: calc(100% + 2rem);

  font-weight: bold;
}

.contribution-grid {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 4px;
}

.week {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.day {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background-color: #1a1b1a;
  border: 1px solid #212221;
}

.level-4 {
  background-color: #35cf43;
  border: 1px solid #40db4e;
}
.level-3 {
  background-color: #249a32;
  border: 1px solid #2ea73d;
}
.level-2 {
  background-color: #0d5d27;
  border: 1px solid #146731;
}
.level-1 {
  background-color: #0f361f;
  border: 1px solid #184229;
}

.playback-controls {
  margin-top: 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;
  justify-content: center;
}
</style>
