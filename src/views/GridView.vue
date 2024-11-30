<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'

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
import { onBeforeRouteLeave } from 'vue-router'
import Glossary from './Glossary.vue'
import Imprint from './Imprint.vue'

const currentView = ref('grid')

const route = useRoute()

/** Watches the `route.query.view` property and updates the `currentView` reactive
 * variable with the new view value. If the new view value is `undefined`,
 * it defaults to `'grid'`. This ensures that the `currentView` variable is
 * always up-to-date with the current view being displayed.
 */
watch(
  () => route.query.view,
  (newView) => {
    currentView.value = newView?.toString() || 'grid'
  },
  { immediate: true },
)

const githubStore = useGitHubStore()
const username = ref('')
const selectedBars = ref(8)
const startBar = ref(0)
const gridWidth = ref(0)
const gridRef = ref<HTMLElement | null>(null)

/**
 * Initializes the sequencer with the specified number of bars and event handlers for handling sequencer ticks, bar changes, and loop completion.
 * The sequencer is responsible for driving the audio playback and updating the harmony based on the user's GitHub contributions.
 * @param selectedBars - The number of bars to include in the sequencer.
 * @param {object} options - The event handlers for the sequencer.
 * @param {function} options.onTick - Called on each tick of the sequencer, passing the current bar and progress.
 * @param {function} options.onBarChange - Called when the sequencer moves to a new bar, passing the new bar index.
 * @param {function} options.onLoopComplete - Called when the sequencer completes a full loop.
 * @returns {object} The initialized sequencer.
 */
const sequencer = useSequencer(selectedBars, {
  onTick: (currentBar, progress) => {
    orchestrator.handleSequencerTick(currentBar, progress)
  },
  onBarChange: (bar) => {
    if (githubStore.contributions) {
      const currentWeek = githubStore.contributions.weeks[bar]
      orchestrator.updateHarmony(currentWeek.days[0].level, 0)
    }
  },
  onLoopComplete: () => {
    orchestrator.handleLoopComplete()
  },
})

/**
 * Initializes the orchestrator, which is responsible for managing the audio playback and harmony updates based on the user's GitHub contributions.
 */
const orchestrator = useOrchestrator()

/**
 * Stops the playback of the sequencer and orchestrator when the user navigates away from the current route.
 * This ensures that the audio playback is properly stopped when the user leaves the current view.
 */
onBeforeRouteLeave(() => {
  orchestrator.stopPlayback()
  sequencer.stop()
})

/**
 * Updates the grid width based on the width of the grid element.
 * This ensures the grid is sized correctly when the component is first rendered.
 */
const updateGridWidth = () => {
  if (gridRef.value) {
    gridWidth.value = gridRef.value.offsetWidth
  }
}

/**
 * Updates the grid width when the component is mounted.
 * This ensures the grid is sized correctly when the component is first rendered.
 */
onMounted(() => {
  updateGridWidth()
})

/**
 * Fetches the user's GitHub contributions and updates the grid width and orchestrator.
 * This function is called when the user's GitHub username is provided.
 */
const loadContributions = async () => {
  if (username.value) {
    orchestrator.stopPlayback()
    sequencer.stop()
    await githubStore.fetchContributions(username.value)
    nextTick(() => {
      updateGridWidth()
      if (githubStore.contributions) {
        orchestrator.setContributions(githubStore.contributions)
      }
    })
  }
}

/**
 * Updates the number of bars to display and the start position for the sequencer and orchestrator, and stops their playback.
 * @param bars - The new number of bars to display.
 */
const updateBars = (bars: number) => {
  selectedBars.value = bars
  const maxStart = Math.max(0, 52 - bars)
  startBar.value = Math.min(startBar.value, maxStart)
  sequencer.setStartPosition(startBar.value)
  orchestrator.stopPlayback()
  sequencer.stop()
}

/**
 * Updates the start position and number of bars for the sequencer and orchestrator, and stops their playback.
 * @param start - The new start position for the sequencer and orchestrator.
 * @param bars - The new number of bars to display.
 */
const handleRangeUpdate = ({ start, bars }: { start: number; bars: number }) => {
  startBar.value = start
  orchestrator.setStartPosition(start)
  sequencer.setStartPosition(start)
  orchestrator.stopPlayback()
  sequencer.stop()
}

/**
 * Handles the playback of the sequencer and orchestrator.
 * @param isPlaying - A boolean indicating whether playback should start or pause.
 * @returns {Promise<void>} - A promise that resolves when the playback operation is complete.
 */
const handlePlayback = async (isPlaying: boolean) => {
  console.group('🎮 Playback Event')
  console.log('Action:', isPlaying ? 'Play' : 'Pause')
  console.log('Sequencer State:', {
    isPlaying: sequencer.isPlaying.value,
    progress: sequencer.progress.value,
    currentBar: sequencer.currentBar.value,
  })

  if (isPlaying) {
    await Tone.start()
    console.log('Tone.js Started:', Tone.getContext().state)

    if (sequencer.isPlaying.value) {
      orchestrator.resumePlayback()
      sequencer.resume()
    } else {
      const startPosition =
        sequencer.progress.value > 0 ? sequencer.currentBar.value : startBar.value
      orchestrator.startPlayback(startPosition)
      sequencer.play()
    }
  } else {
    orchestrator.pausePlayback()
    sequencer.pause()
  }
  console.groupEnd()
}

/**
 * Stops the playback of the sequencer and orchestrator, and sets the start position of the sequencer to the current start bar value.
 */
const handleStop = () => {
  sequencer.stop()
  orchestrator.stopPlayback()
  sequencer.setStartPosition(startBar.value)
}

/**
 * Updates the BPM (beats per minute) of the sequencer and orchestrator.
 * @param newBPM - The new BPM value to set.
 */
const handleBPMChange = (newBPM: number) => {
  sequencer.setBPM(newBPM)
  orchestrator.updateBPM(newBPM)
}
</script>

<template>
  <main class="grid-view">
    <template v-if="currentView === 'grid'">
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
                triggered: orchestrator.isCurrentDay(weekIndex, dayIndex) && day.level >= 1,
              },
            ]"
          ></div>
        </div>
      </div>

      <div v-if="githubStore.contributions" class="playback-controls-container">
        <PlayPauseButton
          :is-playing="sequencer.isPlaying.value"
          @play="handlePlayback(true)"
          @pause="handlePlayback(false)"
          @stop="handleStop"
        />

        <div class="divider"></div>
        <BPMControl :bpm="sequencer.bpm.value" @update:bpm="handleBPMChange" />
      </div>

      <div v-if="githubStore.contributions" class="synth-panels">
        <BassSynthPanel />
        <PadSynthPanel />
        <LeadSynthPanel />
      </div>
    </template>

    <Glossary v-else-if="currentView === 'glossary'" />
    <Imprint v-else-if="currentView === 'imprint'" />
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
