<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { useGitHubStore } from '../stores/github.store'
import { useSequencer } from '../composables/useSequencer'
import { useOrchestrator } from '../composables/audio/useOrchestrator'

import BarSelector from '../components/sequencer/BarSelector.vue'
import BracketSelector from '../components/sequencer/BracketSelector.vue'
import PlayPauseButton from '../components/controls/PlayPauseButton.vue'
import Playhead from '../components/sequencer/Playhead.vue'
import BPMControl from '../components/controls/BPMControl.vue'
import BassSynthPanel from '../components/controls/synth/BassSynthPanel.vue'
import PadSynthPanel from '../components/controls/synth/PadSynthPanel.vue'
import LeadSynthPanel from '../components/controls/synth/LeadSynthPanel.vue'
import * as Tone from 'tone'

/**
 * Provides access to the GitHub store, which is used to fetch user contributions data.
 */
const githubStore = useGitHubStore()
const username = ref('')

/**
 * Reactive references for managing the grid view:
 * - `selectedBars`: the number of bars currently selected
 * - `startBar`: the index of the first bar currently displayed
 * - `gridWidth`: the current width of the grid element
 * - `gridRef`: a ref to the grid element itself
 */
const selectedBars = ref(8)
const startBar = ref(0)
const gridWidth = ref(0)
const gridRef = ref<HTMLElement | null>(null)

/**
 * Initializes the sequencer and orchestrator instances used in the GridView component.
 * - `sequencer`: a reactive instance of the useSequencer composable, which manages the sequencing and playback of the grid view.
 * - `orchestrator`: a reactive instance of the useOrchestrator composable, which manages the audio synthesis and harmony generation for the grid view.
 */
const sequencer = useSequencer(selectedBars)
const orchestrator = useOrchestrator()

/**
 * Updates the width of the grid element to match the current width of the container.
 * This is necessary to ensure the grid is sized correctly within its parent container.
 */
const updateGridWidth = () => {
  if (gridRef.value) {
    gridWidth.value = gridRef.value.offsetWidth
  }
}

/**
 * Updates the width of the grid element to match the current width of the container.
 * This is necessary to ensure the grid is sized correctly within its parent container.
 */
onMounted(() => {
  updateGridWidth()
})

/**
 * Fetches the user's GitHub contributions data and updates the grid width after the data is loaded.
 * This function is typically called when the username is changed or when the component is first mounted.
 */
const loadContributions = async () => {
  if (username.value) {
    await githubStore.fetchContributions(username.value)
    nextTick(() => {
      updateGridWidth()
    })
  }
}

/**
 * Updates the number of bars displayed in the grid view and adjusts the starting bar index accordingly.
 *
 * @param bars - The new number of bars to display in the grid.
 */
const updateBars = (bars: number) => {
  selectedBars.value = bars
  const maxStart = Math.max(0, 52 - bars)
  startBar.value = Math.min(startBar.value, maxStart)
  sequencer.setStartPosition(startBar.value)
  sequencer.stop()
}

/**
 * Updates the starting bar index and the number of bars displayed in the grid view, and stops the sequencer.
 *
 * @param start - The new starting bar index.
 * @param bars - The new number of bars to display in the grid.
 */
const handleRangeUpdate = ({ start, bars }: { start: number; bars: number }) => {
  startBar.value = start
  sequencer.stop()
  sequencer.setStartPosition(start)
}

/**
 * Handles the playback of the sequencer and updates the harmony based on the current week's contribution data.
 *
 * @param isPlaying - A boolean indicating whether the sequencer should start or stop playing.
 * @returns A Promise that resolves when the sequencer has started or stopped.
 */
const handlePlayback = async (isPlaying: boolean) => {
  if (isPlaying) {
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

/**
 * Updates the tempo (beats per minute) of the sequencer.
 *
 * @param newBPM - The new tempo in beats per minute.
 */
const handleBPMChange = (newBPM: number) => {
  sequencer.setBPM(newBPM)
}

/**
 * Watches the current bar index of the sequencer and updates the harmony and playback patterns based on the contribution data for the current week and day.
 *
 * This function is called whenever the `sequencer.currentBar` value changes, which happens during playback. It retrieves the current week and day from the `githubStore.contributions` data, and then updates the harmony and plays the corresponding bass, chords, and arpeggio patterns using the `orchestrator` module.
 *
 * If the sequencer is not playing or the contribution data is not available, the function will return without making any updates.
 */
watch(sequencer.currentBar, (weekIndex) => {
  if (!githubStore.contributions || !sequencer.isPlaying.value) return
  const week = githubStore.contributions.weeks[weekIndex]
  const dayIndex = Math.floor(sequencer.progress.value * 7)
  const day = week.days[dayIndex]
  const harmony = orchestrator.updateHarmony(day.level, dayIndex)
  orchestrator.playPattern('bass', day.level, [harmony.bass])
  orchestrator.playPattern('chords', day.level, harmony.chord)
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
        placeholder="GitHub Username"
        @keyup.enter="loadContributions"
      />
      <button @click="loadContributions">Load Data</button>
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

    <div v-if="githubStore.loading" class="status">Collecting Data...</div>
    <div v-else-if="githubStore.error" class="status error">{{ githubStore.error }} 😕</div>
    <div v-if="githubStore.contributions" ref="gridRef" class="contribution-grid">
      <Playhead
        v-if="sequencer.isPlaying"
        :position="sequencer.currentBar.value"
        :progress="sequencer.progress.value"
        :start-position="startBar"
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

    <div v-if="githubStore.contributions" class="playback-controls-container">
      <PlayPauseButton
        @play="handlePlayback(true)"
        @pause="handlePlayback(false)"
        @stop="sequencer.stop()"
      />
      <div class="divider"></div>

      <BPMControl :bpm="sequencer.bpm.value" @update:bpm="handleBPMChange" />
    </div>
    <div v-if="githubStore.contributions" class="synth-panels">
      <BassSynthPanel />
      <PadSynthPanel />
      <LeadSynthPanel />
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
  background-color: #cad9cb;
  padding: 0.5rem 0.75rem;
  border: 2px solid #4caf50;
  border-radius: 4px;
  font-size: 1rem;
  outline: 0px solid #4caf50;
  transition: outline-width 0.125s ease-in-out;
}

input:focus-within {
  outline-width: 2px;
}

button {
  padding: 0.625rem 0.875rem;

  background: #4caf50;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  outline: 0px solid #4caf50;

  transition: all 0.2s ease-in-out;
}

button:hover {
  outline-width: 2px;
}

button:active {
  color: #181818;
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

.playback-controls-container {
  margin-top: 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;
  justify-content: center;

  background: #242424;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.divider {
  height: 3rem;
  border-right: 1px solid #333;
}

.synth-panels {
  bottom: 2rem;
  display: flex;
  gap: 24px;
  width: 100%;
  padding: 24px;
  justify-content: center;
  flex-wrap: wrap;
}
</style>
