<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRoute, onBeforeRouteLeave } from 'vue-router'
import { useGitHubStore } from '@/stores/github.store'
import { createScore } from '@/music/score'
import { useStudio } from '@/audio/studio'
import BarSelector from '@/components/sequencer/BarSelector.vue'
import BracketSelector from '@/components/sequencer/BracketSelector.vue'
import PlayPauseButton from '@/components/controls/PlayPauseButton.vue'
import Playhead from '@/components/sequencer/Playhead.vue'
import BPMControl from '@/components/controls/BPMControl.vue'
import BassSynthPanel from '@/components/controls/synth/BassSynthPanel.vue'
import PadSynthPanel from '@/components/controls/synth/PadSynthPanel.vue'
import LeadSynthPanel from '@/components/controls/synth/LeadSynthPanel.vue'
import Glossary from './Glossary.vue'
import Imprint from './Imprint.vue'

const route = useRoute()
const currentView = ref('grid')
const githubStore = useGitHubStore()
const { session } = useStudio()
const { status, bpm, week: currentWeek, day: currentDay, progress } = session
const username = ref('')
const playbackError = ref('')
const selectedBars = ref(8)
const startBar = ref(0)
const gridWidth = ref(0)
const gridRef = ref<HTMLElement | null>(null)

watch(() => route.query.view, (view) => {
  currentView.value = view?.toString() || 'grid'
  if (currentView.value !== 'grid') session.pause()
}, { immediate: true })
onBeforeRouteLeave(() => session.pause())

const updateGridWidth = () => { gridWidth.value = gridRef.value?.offsetWidth ?? 0 }
onMounted(updateGridWidth)

function loadScore() {
  const calendar = githubStore.contributions
  if (!calendar || calendar.weeks.length === 0) return
  selectedBars.value = Math.min(selectedBars.value, calendar.weeks.length)
  startBar.value = Math.min(startBar.value, calendar.weeks.length - selectedBars.value)
  session.load(createScore(calendar, githubStore.username, startBar.value, selectedBars.value))
}

async function loadContributions() {
  if (!username.value.trim()) return
  session.clear()
  playbackError.value = ''
  await githubStore.fetchContributions(username.value)
  startBar.value = 0
  loadScore()
  await nextTick()
  updateGridWidth()
}

function updateBars(bars: number) {
  if (!githubStore.contributions) return
  selectedBars.value = Math.max(1, Math.min(bars, githubStore.contributions.weeks.length))
  loadScore()
}

function handleRangeUpdate({ start, bars }: { start: number; bars: number }) {
  startBar.value = start
  selectedBars.value = bars
  loadScore()
}

function updateBpm(value: number) {
  session.setBpm(value)
}

async function handlePlayback(playing: boolean) {
  if (!playing) { session.pause(); return }
  playbackError.value = ''
  try { await session.play() }
  catch { playbackError.value = 'Audio could not be started.' }
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
        <BarSelector :bars="selectedBars" :total-weeks="githubStore.contributions.weeks.length" @update:bars="updateBars" />
        <BracketSelector
          v-if="gridWidth"
          :total-weeks="githubStore.contributions.weeks.length"
          :selected-bars="selectedBars"
          :start="startBar"
          :grid-width="gridWidth"
          @update:range="handleRangeUpdate"
        />
      </div>

      <div v-if="githubStore.loading" class="status">Collecting Data...</div>
      <div v-else-if="githubStore.error" class="status error">{{ githubStore.error }}</div>
      <div v-if="playbackError" class="status error">{{ playbackError }}</div>
      <div v-if="githubStore.contributions" class="status">{{ githubStore.username }}</div>
      <div v-if="githubStore.contributions" ref="gridRef" class="contribution-grid">
        <Playhead
          v-if="status !== 'stopped'"
          :position="currentWeek"
          :progress="progress"
          :start-position="startBar"
          :total-bars="selectedBars"
          :is-looping="false"
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
                triggered: status !== 'stopped' && currentWeek === weekIndex && currentDay === dayIndex && day.level >= 1,
              },
            ]"
          ></div>
        </div>
      </div>

      <div v-if="githubStore.contributions" class="playback-controls-container">
        <PlayPauseButton
          :is-playing="status === 'playing'"
          @play="handlePlayback(true)"
          @pause="handlePlayback(false)"
          @stop="session.stop()"
        />

        <div class="divider"></div>
        <BPMControl :bpm="bpm" @update:bpm="updateBpm" />
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
