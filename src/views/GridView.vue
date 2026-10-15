<script setup lang="ts">
import { ref, computed, watch, toRefs, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGitHubStore } from '@/stores/github.store'
import { createScore } from '@/music/score'
import { useStudio } from '@/audio/studio'
import KeyControl from '@/components/controls/KeyControl.vue'
import StudioActions from '@/components/controls/StudioActions.vue'
import Fader from '@/components/controls/common/Fader.vue'
import { decodeSnapshot } from '@/studio/share'
import YearSelector from '@/components/sequencer/YearSelector.vue'
import BarSelector from '@/components/sequencer/BarSelector.vue'
import BracketSelector from '@/components/sequencer/BracketSelector.vue'
import PlayPauseButton from '@/components/controls/PlayPauseButton.vue'
import MiniTransport from '@/components/controls/MiniTransport.vue'
import { usePlaybackShortcut } from '@/composables/usePlaybackShortcut'
import { useTransportVisibility } from '@/composables/useTransportVisibility'
import Playhead from '@/components/sequencer/Playhead.vue'
import BPMControl from '@/components/controls/BPMControl.vue'
import BassSynthPanel from '@/components/controls/synth/BassSynthPanel.vue'
import PadSynthPanel from '@/components/controls/synth/PadSynthPanel.vue'
import LeadSynthPanel from '@/components/controls/synth/LeadSynthPanel.vue'
import Glossary from './Glossary.vue'
import Imprint from './Imprint.vue'

const route = useRoute()
const router = useRouter()
const githubStore = useGitHubStore()
const studio = useStudio()
const { session, state, resetSound } = studio
const { status, bpm, week: currentWeek, day: currentDay, progress } = session
const username = ref('')
const playbackError = ref('')
const audioStarting = ref(false)
const transportControls = ref<HTMLElement | null>(null)
const transportVisible = useTransportVisibility(transportControls)
const { weekCount: selectedBars, startWeek: startBar } = toRefs(state.selection)
const snapshotLoaded = ref(false)
const snapshotError = ref('')
const snapshotLoading = ref(false)
const calendar = computed(() => githubStore.contributions)
const periodTarget = ref<number | null>(null)
let periodRevision = 0
const hasWeeks = computed(() => !!calendar.value?.weeks.length)
const playbackDisabled = computed(
  () =>
    !hasWeeks.value ||
    audioStarting.value ||
    githubStore.loading ||
    githubStore.periodLoading ||
    snapshotLoading.value,
)
usePlaybackShortcut(
  () => !playbackDisabled.value,
  () => {
    void handlePlayback(status.value !== 'playing')
  },
)
const captureSound = () =>
  studio.snapshot(githubStore.username, calendar.value!, githubStore.sourceYear)
const loopSeconds = computed(() => (selectedBars.value * 4 * 60) / bpm.value)
const timelineWidth = computed(() => (calendar.value?.weeks.length ?? 0) * 16 - 4)
const selectedDays = computed(
  () =>
    calendar.value?.weeks
      .slice(startBar.value, startBar.value + selectedBars.value)
      .flatMap((week) => week.days)
      .filter((day) => !day.outsideRange) ?? [],
)
const selectedContributions = computed(() =>
  selectedDays.value.reduce((sum, day) => sum + day.count, 0),
)
const dateFormat = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})
const selectionDates = computed(() => {
  const days = selectedDays.value
  return days.length
    ? `${formatDate(days[0].date)} – ${formatDate(days[days.length - 1].date)}`
    : ''
})
const monthLabels = computed(
  () =>
    calendar.value?.weeks.map((week, index, weeks) => {
      const date = week.days.find((day) => !day.outsideRange)?.date ?? week.firstDay
      const previous =
        index > 0
          ? (
              weeks[index - 1].days.find((day) => !day.outsideRange)?.date ??
              weeks[index - 1].firstDay
            ).slice(0, 7)
          : ''
      return date.slice(0, 7) !== previous
        ? new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(new Date(date))
        : ''
    }) ?? [],
)
const numberFormat = new Intl.NumberFormat('en')
const previewLevels = Array.from({ length: 168 }, (_, i) => (i * 7 + Math.floor(i / 7) * 3) % 5)
function formatDate(date: string) {
  return dateFormat.format(new Date(date))
}

watch(
  () => [
    state.sound.patterns.bass,
    state.sound.patterns.lead,
    state.sound.key,
    state.sound.octaves.bass,
    state.sound.octaves.pad,
    state.sound.octaves.lead,
  ],
  () => {
    loadScore(true)
  },
)
let snapshotRequest = 0
watch(
  () => route.hash,
  async (hash) => {
    const request = ++snapshotRequest
    if (!hash.startsWith('#sound=')) {
      snapshotLoading.value = false
      return
    }
    periodRevision++
    githubStore.cancelPeriod()
    snapshotError.value = ''
    snapshotLoading.value = true
    session.pause()
    try {
      const saved = await decodeSnapshot(hash.slice(7))
      if (request !== snapshotRequest) return
      studio.restore(saved)
      githubStore.restoreCalendar(saved.calendar, saved.profile, saved.sourceYear)
      username.value = saved.profile
      snapshotLoaded.value = true
      loadScore()
    } catch (error) {
      if (request === snapshotRequest)
        snapshotError.value =
          error instanceof Error ? error.message : 'This shared sound could not be opened.'
    } finally {
      if (request === snapshotRequest) snapshotLoading.value = false
    }
  },
  { immediate: true },
)

function loadScore(retune = false) {
  const data = calendar.value
  if (!data?.weeks.length) return
  selectedBars.value = Math.min(selectedBars.value, data.weeks.length)
  startBar.value = Math.max(0, Math.min(startBar.value, data.weeks.length - selectedBars.value))
  const score = createScore(
    data,
    githubStore.username,
    startBar.value,
    selectedBars.value,
    state.sound,
  )
  if (retune) session.retune(score)
  else session.load(score)
}

async function loadContributions() {
  if (!username.value.trim() || githubStore.loading || audioStarting.value) return
  snapshotRequest++
  periodRevision++
  if (route.hash.startsWith('#sound=')) void router.replace({ hash: '' })
  snapshotLoading.value = false
  snapshotLoaded.value = false
  snapshotError.value = ''
  session.clear()
  playbackError.value = ''
  await githubStore.fetchContributions(username.value)
  startBar.value = 0
  loadScore()
}

async function loadPeriod(year: number | null) {
  if (audioStarting.value || githubStore.loading || snapshotLoading.value) return
  const revision = ++periodRevision
  periodTarget.value = year
  if (year === githubStore.sourceYear && !githubStore.frozen) {
    githubStore.cancelPeriod()
    return
  }
  session.stop()
  playbackError.value = ''
  const result = await githubStore.preparePeriod(year)
  if (revision !== periodRevision || !result) return
  githubStore.commitPeriod(result, year)
  snapshotLoaded.value = false
  if (route.hash.startsWith('#sound=')) void router.replace({ hash: '' })
  if (result.calendar.weeks.length) loadScore()
  else session.clear()
}

function loadExample() {
  username.value = 'CodeRacon'
  void loadContributions()
}

function updateBars(bars: number) {
  if (!hasWeeks.value) return
  selectedBars.value = Math.max(1, Math.min(bars, calendar.value!.weeks.length))
  loadScore()
}

function handleRangeUpdate({ start, bars }: { start: number; bars: number }) {
  startBar.value = start
  selectedBars.value = bars
  loadScore()
}

async function handlePlayback(playing: boolean) {
  if (!playing) {
    session.pause()
    return
  }
  if (playbackDisabled.value) return
  playbackError.value = ''
  audioStarting.value = true
  try {
    await session.play()
  } catch {
    playbackError.value = 'Audio could not be started. Press Play to try again.'
  } finally {
    audioStarting.value = false
  }
}
async function showStudio() {
  await router.push({ path: '/', hash: route.hash })
  await nextTick()
  // Let the router finish its view-change scroll before revealing the transport.
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  transportControls.value?.scrollIntoView({ block: 'center' })
  transportControls.value
    ?.querySelector<HTMLButtonElement>('button')
    ?.focus({ preventScroll: true })
}
</script>

<template>
  <main id="main-content" class="grid-view" :class="{ 'has-calendar': hasWeeks }" tabindex="-1">
    <template v-if="!route.query.view">
      <p v-if="snapshotLoading" class="snapshot-notice" role="status">Opening shared sound…</p>
      <p v-if="snapshotError" class="error snapshot-notice" role="alert">
        {{ snapshotError }} You can load a profile below.
      </p>
      <p v-if="snapshotLoaded" class="snapshot-notice" role="status">
        Shared sound restored · this calendar is a frozen snapshot. Press Play to listen, or load a
        profile for current activity.
      </p>
      <section v-if="!hasWeeks" class="intro" aria-labelledby="studio-title">
        <div>
          <p class="eyebrow">GitHub activity × music studio</p>
          <h1 id="studio-title">Hear your code<span>.</span></h1>
          <p class="intro-copy">
            Turn a year of GitHub activity into music. Pick a few weeks, press play, and make the
            sound your own.
          </p>
        </div>
        <ol class="flow-hints" aria-label="How to use GitGroove">
          <li><span>01</span> Load a profile</li>
          <li><span>02</span> Choose a section</li>
          <li><span>03</span> Play & shape the sound</li>
        </ol>
      </section>

      <section class="profile-panel" aria-labelledby="profile-label">
        <form class="profile-form" @submit.prevent="loadContributions">
          <div class="profile-field">
            <label id="profile-label" for="github-username">GitHub profile</label>
            <div class="username-field">
              <span aria-hidden="true">@</span
              ><input
                id="github-username"
                v-model="username"
                type="text"
                placeholder="GitHub Username"
                autocomplete="off"
                autocapitalize="none"
                spellcheck="false"
                :disabled="githubStore.loading || audioStarting"
                :aria-invalid="!!githubStore.error"
                aria-describedby="profile-hint profile-feedback"
              />
            </div>
          </div>
          <button
            class="primary-button"
            type="submit"
            :disabled="!username.trim() || githubStore.loading || audioStarting"
          >
            {{ githubStore.loading ? 'Loading…' : 'Load profile' }}
            <span aria-hidden="true">↗</span>
          </button>
          <span class="form-or">or</span>
          <button
            class="secondary-button"
            type="button"
            :disabled="githubStore.loading || audioStarting"
            @click="loadExample"
          >
            Try CodeRacon <span aria-hidden="true">→</span>
          </button>
        </form>
        <p id="profile-hint" class="hint" :class="{ 'sr-only': hasWeeks }">
          No GitHub account needed. Try the creator’s profile, or enter any public GitHub username.
        </p>
        <div id="profile-feedback" class="profile-feedback" aria-live="polite" aria-atomic="true">
          <p v-if="githubStore.loading" class="status">Loading contribution calendar…</p>
          <p v-else-if="githubStore.error" class="error">
            {{ githubStore.error }} Try another profile or load the example above.
          </p>
          <p v-else-if="calendar" class="sr-only">
            Loaded {{ githubStore.username }}: {{ calendar.weeks.length }} weeks,
            {{ calendar.totalContributions }} contributions.
          </p>
        </div>
      </section>

      <section
        v-if="hasWeeks && calendar"
        class="sequencer-panel"
        aria-labelledby="calendar-heading"
      >
        <div class="section-heading">
          <div>
            <p class="eyebrow">01 / Your source material</p>
            <h1 id="calendar-heading" class="calendar-heading">Contribution calendar</h1>
          </div>
          <div class="profile-summary">
            <span class="status">@{{ githubStore.username }}</span
            ><span
              >{{ numberFormat.format(calendar.totalContributions) }} contributions ·
              {{ calendar.weeks.length }} weeks</span
            >
          </div>
        </div>
        <p class="hint calendar-hint">
          Each square is a day of coding activity. Brighter squares create richer music. One week
          becomes one musical bar.
        </p>

        <div class="selection-controls">
          <BarSelector
            :bars="selectedBars"
            :total-weeks="calendar.weeks.length"
            :disabled="audioStarting"
            @update:bars="updateBars"
          />
          <div class="selection-summary">
            <span>Weeks {{ startBar + 1 }}–{{ startBar + selectedBars }}</span
            ><span>{{ selectionDates }}</span>
          </div>
        </div>

        <div
          class="timeline-scroller"
          tabindex="0"
          role="region"
          aria-label="Contribution calendar and selection. Scroll horizontally to see more weeks."
        >
          <div class="calendar-canvas" :style="{ width: `${timelineWidth + 32}px` }">
            <div class="weekday-labels" aria-hidden="true">
              <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span
              ><span>Fri</span><span>Sat</span>
            </div>
            <div class="timeline" :style="{ width: `${timelineWidth}px` }">
              <div class="month-labels" aria-hidden="true">
                <span v-for="(month, index) in monthLabels" :key="index">{{ month }}</span>
              </div>
              <BracketSelector
                :total-weeks="calendar.weeks.length"
                :selected-bars="selectedBars"
                :start="startBar"
                :disabled="audioStarting"
                @update:range="handleRangeUpdate"
              />
              <div class="contribution-grid">
                <Playhead
                  v-if="status !== 'stopped'"
                  :position="currentWeek"
                  :progress="progress"
                  :start-position="startBar"
                  :total-bars="selectedBars"
                  :is-looping="false"
                />
                <div
                  v-for="(week, weekIndex) in calendar.weeks"
                  :key="week.firstDay"
                  class="week"
                  :class="{
                    inactive: weekIndex < startBar || weekIndex >= startBar + selectedBars,
                  }"
                  role="group"
                  :aria-label="`Week of ${formatDate(week.firstDay)}`"
                >
                  <div
                    v-for="(day, dayIndex) in week.days"
                    :key="day.date"
                    class="day"
                    :class="[
                      `level-${day.level}`,
                      {
                        outside: day.outsideRange,
                        triggered:
                          status === 'playing' &&
                          currentWeek === weekIndex &&
                          currentDay === dayIndex &&
                          day.level >= 1,
                      },
                    ]"
                    role="img"
                    :title="
                      day.outsideRange
                        ? 'Outside the contribution period'
                        : `${formatDate(day.date)}: ${day.count} contributions`
                    "
                    :aria-label="
                      day.outsideRange
                        ? 'Outside the contribution period'
                        : `${formatDate(day.date)}: ${day.count} contributions`
                    "
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="grid-caption">
          <span>Drag the selection above the grid, or focus it and use ← / →.</span
          ><span class="legend"
            >Less
            <i
              v-for="level in 5"
              :key="level"
              class="day"
              :class="`level-${level - 1}`"
              aria-hidden="true"
            ></i>
            More</span
          >
        </div>

        <YearSelector
          v-if="githubStore.years.length || githubStore.frozen"
          :years="githubStore.years"
          :selected="githubStore.sourceYear"
          :frozen="githubStore.frozen"
          :busy="githubStore.periodLoading"
          :target="periodTarget"
          :error="githubStore.periodError"
          :disabled="audioStarting || githubStore.loading"
          @select="loadPeriod"
        />

        <div class="transport">
          <div ref="transportControls" class="primary-transport-controls">
            <PlayPauseButton
              :is-playing="status === 'playing'"
              :disabled="playbackDisabled"
              @play="handlePlayback(true)"
              @pause="handlePlayback(false)"
              @stop="session.stop()"
            />
          </div>
          <div class="playback-state-stack">
            <div class="playback-state" role="status">
              <span class="state-dot" :class="{ playing: status === 'playing' }"></span
              >{{
                githubStore.periodLoading
                  ? 'Loading calendar…'
                  : audioStarting
                    ? 'Starting audio…'
                    : status === 'playing'
                      ? 'Playing'
                      : status === 'paused'
                        ? 'Paused'
                        : 'Ready to play'
              }}
            </div>
            <p class="shortcut-hint"><kbd>Space</kbd> Play/Pause</p>
          </div>
          <BPMControl :bpm="bpm" @update:bpm="(value) => session.setBpm(value)" />
        </div>
        <StudioActions :capture="captureSound" :loop-seconds="loopSeconds" />
        <p v-if="selectedContributions === 0" class="selection-feedback" role="status">
          This section has no contributions, so it plays silence. Move the selection to brighter
          squares or try another profile.
        </p>
        <p v-if="playbackError" class="error" role="alert">{{ playbackError }}</p>
      </section>

      <section
        v-else
        class="empty-state"
        :aria-busy="githubStore.loading"
        aria-labelledby="empty-heading"
      >
        <div class="preview-grid" aria-hidden="true">
          <i v-for="(level, i) in previewLevels" :key="i" :class="`level-${level}`"></i>
        </div>
        <p class="eyebrow">Activity becomes a melody</p>
        <h2 id="empty-heading">
          {{
            githubStore.loading
              ? 'Finding the rhythm…'
              : calendar
                ? 'No contribution calendar yet'
                : 'Every day has a rhythm.'
          }}
        </h2>
        <p>
          {{
            calendar
              ? 'This profile has no calendar data to play. Load another profile or try CodeRacon above.'
              : 'GitHub records coding activity in a grid of daily squares. GitGroove turns those patterns into bass, chords and melody.'
          }}
        </p>
        <span class="empty-caption">Illustrative grid · load a profile to hear real activity</span>
      </section>

      <section v-if="hasWeeks" class="voices-section" aria-labelledby="voices-heading">
        <div class="section-heading">
          <div>
            <p class="eyebrow">02 / Make it yours</p>
            <h2 id="voices-heading">Shape the sound</h2>
          </div>
          <button class="secondary-button" type="button" @click="resetSound">Reset sound</button>
        </div>
        <p class="hint voice-hint">
          Adjust volume and drag a knob up or down to change its value. Use arrow keys when focused.
          Mute silences a voice; Solo lets you hear it on its own.
        </p>
        <div class="sound-tools">
          <KeyControl v-model="state.sound.key" />
          <div class="focus-control">
            <Fader
              v-model="state.sound.leadFocus"
              :min="0"
              :max="100"
              :step="1"
              :decimals="0"
              label="Lead focus"
              unit="%"
            />
            <p class="hint">
              Make room for lead note attacks by briefly lowering the pad. At 0%, your mix stays
              unchanged. Muted and soloed voices are respected.
            </p>
          </div>
        </div>
        <div class="synth-panels"><BassSynthPanel /><PadSynthPanel /><LeadSynthPanel /></div>
      </section>
    </template>
    <Glossary v-else-if="route.query.view === 'glossary'" />
    <Imprint v-else-if="route.query.view === 'imprint'" />
    <p v-else class="hint">
      This view is unavailable. <RouterLink to="/">Return to the studio</RouterLink>.
    </p>
    <MiniTransport
      v-if="hasWeeks"
      :visible="!transportVisible"
      :profile="githubStore.username"
      :bars="selectedBars"
      :status="status"
      :disabled="playbackDisabled"
      :starting="audioStarting"
      :loading="githubStore.periodLoading"
      :error="playbackError"
      @play="handlePlayback(true)"
      @pause="handlePlayback(false)"
      @studio="showStudio"
    />
  </main>
</template>

<style scoped>
.grid-view {
  padding: 40px 0;
  min-width: 0;
}
.intro {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 32px;
  margin-bottom: 28px;
}
h1 {
  font-size: clamp(2.2rem, 5vw, 3.4rem);
  line-height: 1.16;
  letter-spacing: -0.055em;
  margin: 8px 0 12px;
  font-weight: 750;
}
h1 span {
  color: var(--color-accent);
}
.grid-view.has-calendar {
  padding-top: 16px;
}
.has-calendar .profile-panel {
  padding: 14px 24px;
  margin-bottom: 20px;
}
.calendar-heading {
  font-size: 1.35rem;
  letter-spacing: -0.025em;
  font-weight: 650;
  margin: 4px 0 0;
  line-height: 1.6;
}
.intro-copy {
  color: var(--color-muted);
  max-width: 520px;
  font-size: 0.95rem;
}
.flow-hints {
  flex-shrink: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--color-muted);
  font-size: 0.8rem;
}
.flow-hints span {
  display: inline-block;
  font-variant-numeric: tabular-nums;
  margin-right: 10px;
  color: var(--color-accent);
  font-size: 0.7rem;
}
.profile-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 24px;
}
.profile-form {
  display: flex;
  align-items: end;
  gap: 12px;
  flex-wrap: wrap;
}
.profile-field {
  flex: 1;
  min-width: 160px;
}
.profile-field label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.75rem;
  font-weight: 650;
}
.username-field {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  min-height: 46px;
}
.username-field span {
  color: var(--color-muted);
}
.username-field:focus-within {
  border-color: var(--color-accent);
}
.username-field input:focus {
  /* The containing field supplies the focus indicator without a second inner frame. */
  outline: none;
}
input {
  min-width: 0;
  width: 100%;
  padding: 10px 0;
  border: none;
  color: var(--color-text);
  background: transparent;
}
input::placeholder {
  color: var(--color-muted);
}
.form-or {
  align-self: center;
  padding-top: 24px;
  font-size: 0.75rem;
  color: var(--color-muted);
}
.hint {
  color: var(--color-muted);
  font-size: 0.8rem;
  line-height: 1.65;
}
#profile-hint {
  margin-top: 10px;
}
.status {
  color: var(--color-accent);
}
.profile-feedback:has(p:not(.sr-only)) {
  margin-top: 10px;
  font-size: 0.85rem;
}
.error {
  color: var(--color-danger);
  font-size: 0.85rem;
}
.sequencer-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px;
}
.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
h2 {
  font-size: 1.35rem;
  letter-spacing: -0.025em;
  font-weight: 650;
  margin-top: 4px;
}
.profile-summary {
  display: flex;
  flex-direction: column;
  align-items: end;
  font-size: 0.8rem;
  color: var(--color-muted);
}
.profile-summary .status {
  color: var(--color-text);
  font-weight: 600;
}
.calendar-hint {
  margin-top: 10px;
}
.selection-controls {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
  margin: 16px 0 8px;
}
.selection-summary {
  display: flex;
  flex-direction: column;
  text-align: right;
  font-size: 0.72rem;
  color: var(--color-muted);
}
.selection-summary span:first-child {
  color: var(--color-text);
  font-weight: 600;
}
.timeline-scroller {
  max-width: 100%;
  overflow-x: auto;
  padding: 14px 0;
}
.calendar-canvas {
  position: relative;
  padding-left: 32px;
}
.timeline {
  position: relative;
}
.month-labels {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 16px;
  height: 24px;
  color: var(--color-muted);
  font-size: 0.65rem;
}
.weekday-labels {
  position: absolute;
  left: 0;
  top: 68px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--color-muted);
  font-size: 8px;
  line-height: 12px;
}
.contribution-grid {
  position: relative;
  display: flex;
  gap: 4px;
}
.week {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-radius: 2px;
}
.week.inactive {
  opacity: 0.42;
}
.day {
  display: block;
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: #26322a;
  border: 1px solid #3b4b40;
}
.day.outside {
  background: transparent;
  border-color: transparent;
}
.level-1 {
  background: #315d3b;
  border-color: #477652;
}
.level-2 {
  background: #488b4c;
  border-color: #619e65;
}
.level-3 {
  background: #76bb59;
  border-color: #8dcc70;
}
.level-4 {
  background: #ade783;
  border-color: #c1f69b;
}
.day.triggered {
  outline: 2px solid #fff;
  outline-offset: 1px;
}
.grid-caption {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  margin-top: 4px;
  color: var(--color-muted);
  font-size: 0.7rem;
}
.legend {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}
.transport {
  border-top: 1px solid var(--color-border);
  margin-top: 20px;
  padding-top: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}
.primary-transport-controls {
  display: flex;
}
.shortcut-hint {
  color: var(--color-muted);
  font-size: 0.68rem;
  margin-top: 3px;
}
.shortcut-hint kbd {
  font: inherit;
  border: 1px solid var(--color-border);
  border-radius: 3px;
  padding: 0 4px;
  margin-right: 3px;
}
.playback-state {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--color-muted);
  font-size: 0.75rem;
}
.state-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #78897c;
}
.state-dot.playing {
  background: var(--color-accent);
}
.transport :deep(.bpm-control) {
  margin-left: auto;
}
.selection-feedback {
  color: var(--color-muted);
  font-size: 0.8rem;
  padding: 14px 0 0;
}
.transport + .error,
.selection-feedback + .error {
  margin-top: 12px;
}
.voices-section {
  margin-top: 32px;
}
.voice-hint {
  margin: 10px 0 20px;
  max-width: 800px;
}
.sound-tools {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(220px, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.sound-tools :deep(.key-control) {
  margin-bottom: 0;
}
.focus-control {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
  background: var(--color-surface);
}
.synth-panels {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.empty-state {
  padding: 44px 24px;
  text-align: center;
  border: 1px dashed var(--color-border);
  border-radius: 12px;
}
.empty-state h2 {
  font-size: 1.7rem;
  margin: 6px 0 12px;
}
.empty-state p:not(.eyebrow) {
  color: var(--color-muted);
  max-width: 470px;
  margin: 0 auto;
  font-size: 0.9rem;
}
.preview-grid {
  display: grid;
  grid-template-rows: repeat(7, 8px);
  grid-auto-flow: column;
  grid-auto-columns: 8px;
  gap: 3px;
  width: fit-content;
  margin: 0 auto 28px;
  opacity: 0.65;
}
.preview-grid i {
  border-radius: 1px;
  background: #26322a;
}
.preview-grid .level-1 {
  background: #315d3b;
}
.preview-grid .level-2 {
  background: #488b4c;
}
.preview-grid .level-3 {
  background: #76bb59;
}
.preview-grid .level-4 {
  background: #ade783;
}
.empty-caption {
  display: block;
  margin-top: 24px;
  font-size: 0.7rem;
  color: var(--color-muted);
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
@media (max-width: 960px) {
  .synth-panels {
    grid-template-columns: 1fr;
  }
  .synth-panels :deep(.controls-grid) {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .synth-panels :deep(.volume-section) {
    grid-column: 1 / -1;
  }
  .synth-panels :deep(.knob-section.effects),
  .synth-panels :deep(.knob-section.filter) {
    border-bottom: 0;
  }
}
@media (max-width: 600px) {
  .sound-tools {
    grid-template-columns: 1fr;
  }
  .grid-view {
    padding: 28px 0;
  }
  .intro {
    flex-direction: column;
    align-items: start;
    gap: 20px;
  }
  .flow-hints {
    font-size: 0.72rem;
    gap: 6px;
  }
  .profile-panel,
  .sequencer-panel {
    padding: 16px;
  }
  .profile-field {
    flex-basis: 100%;
  }
  .form-or {
    padding: 0;
  }
  .profile-form {
    gap: 8px;
  }
  .profile-form button {
    flex: 1;
    padding: 10px;
    font-size: 0.8rem;
    white-space: nowrap;
  }
  .section-heading {
    align-items: start;
    flex-wrap: wrap;
  }
  .profile-summary {
    align-items: start;
  }
  .selection-controls {
    align-items: start;
    flex-direction: column;
    gap: 12px;
  }
  .selection-summary {
    text-align: left;
  }
  .transport {
    gap: 16px;
  }
  .transport :deep(.bpm-control) {
    width: 100%;
    margin: 0;
  }
  .synth-panels :deep(.controls-grid) {
    display: flex;
  }
  .synth-panels :deep(.knob-section.effects),
  .synth-panels :deep(.knob-section.filter) {
    border-bottom: 1px solid var(--color-border);
  }
}
</style>
