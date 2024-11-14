<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue' // watch hinzugefügt
import { useGitHubStore } from '../stores/github.store'
import { useSequencer } from '../composables/useSequencer'
import { useOrchestrator } from '../composables/audio/useOrchestrator'
import BarSelector from '../components/sequencer/BarSelector.vue'
import BracketSelector from '../components/sequencer/BracketSelector.vue'
import PlayPauseButton from '../components/controls/PlayPauseButton.vue'
import Playhead from '../components/sequencer/Playhead.vue'
import BPMControl from '../components/controls/BPMControl.vue'
import * as Tone from 'tone'

const githubStore = useGitHubStore()
const username = ref('')
const selectedBars = ref(4)
const startBar = ref(0)
const gridWidth = ref(0)
const gridRef = ref<HTMLElement | null>(null)

const sequencer = useSequencer(selectedBars)
const orchestrator = useOrchestrator()

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
  const maxStart = Math.max(0, 52 - bars)
  startBar.value = Math.min(startBar.value, maxStart)
  sequencer.setStartPosition(startBar.value)
  sequencer.stop()
}

const handleRangeUpdate = ({ start, bars }: { start: number; bars: number }) => {
  startBar.value = start
  sequencer.stop()
  sequencer.setStartPosition(start)
}

const handlePlayback = async (isPlaying: boolean) => {
  if (isPlaying) {
    // Erst Tone.js starten
    await Tone.start()

    sequencer.play()
    if (githubStore.contributions) {
      const currentWeek = githubStore.contributions.weeks[startBar.value]
      const avgLevel = currentWeek.days.reduce((sum, day) => sum + day.level, 0) / 7
      orchestrator.updateHarmony(avgLevel, new Date().getDay())
    }
  } else {
    sequencer.pause()
  }
}

const handleBPMChange = (newBPM: number) => {
  sequencer.setBPM(newBPM)
}

watch(sequencer.currentBar, (weekIndex) => {
  if (!githubStore.contributions || !sequencer.isPlaying.value) return

  const week = githubStore.contributions.weeks[weekIndex]
  const dayIndex = Math.floor(sequencer.progress.value * 7)
  const day = week.days[dayIndex]

  // Hole die harmonische Basis mit allen Noten
  const harmony = orchestrator.updateHarmony(day.level, dayIndex)

  // Bass-Pattern mit Grundton
  orchestrator.playPattern('bass', day.level, [harmony.bass])

  // Akkord-Pattern
  orchestrator.playPattern('chords', day.level, harmony.chord)

  // Arpeggio-Pattern für höhere Aktivitätslevel
  if (day.level > 2) {
    orchestrator.playPattern('arpeggio', day.level, harmony.extensions)
  }
})
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
        :class="{
          inactive: weekIndex < startBar || weekIndex >= startBar + selectedBars,
        }"
      >
        <div
          v-for="(day, dayIndex) in week.days"
          :key="dayIndex"
          class="day"
          :class="[
            `level-${day.level}`,
            {
              triggered:
                sequencer.isTriggered && weekIndex === sequencer.currentBar.value && day.level >= 1,
            },
          ]"
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

.week.inactive {
  filter: saturate(0.5) blur(1px);
  opacity: 0.35;
  transition: all 0.3s ease-out;
}

.day {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background-color: #1a1b1a;
  border: 1px solid #212221;
}

.day.triggered {
  filter: brightness(2.5);
  box-shadow: 0 0 8px rgba(128, 251, 196, 0.4);
  transition: all 0.125s ease-in-out;
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

.level-1,
.level-2,
.level-3,
.level-4 {
  transition: all 0.1s ease-out;
}

.playback-controls {
  margin-top: 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;
  justify-content: center;
}
</style>
