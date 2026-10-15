import { reactive, watch } from 'vue'
import { SynthMix } from './mix'
import type { SynthParams } from './params'
import { ToneAudioAdapter } from '@/playback/tone-adapter'
import { PlaybackSession } from '@/playback/session'
import type { Voice } from '@/music/score'
import type { ContributionResponse } from '@/contributions/calendar'
import { defaultStudioConfig } from '@/studio/state'
import { applySynthParams, captureSnapshot, type StudioSnapshot } from '@/studio/snapshot'

type Params = SynthParams
const state = reactive(defaultStudioConfig())
const params = state.synth
const mix = reactive(new SynthMix()) as SynthMix
mix.setGate(false)
const adapter = new ToneAudioAdapter(mix, params, state.sound)
const session = new PlaybackSession(adapter)
const stopFocusWatch = watch(
  () => state.sound.leadFocus,
  () => {
    adapter.updateParams()
    adapter.updateMix()
  },
)
const stopStatusWatch = watch(
  session.status,
  (status) => {
    mix.setGate(status === 'playing')
    adapter.updateMix()
  },
  { flush: 'sync' },
)

function updateSynthParam<T extends Voice, K extends keyof Params[T]>(
  voice: T,
  param: K,
  value: Params[T][K],
): void {
  params[voice][param] = value
  if (param === 'volume' && typeof value === 'number') mix.setLevel(voice, value)
  adapter.updateParams()
  adapter.updateMix()
}

function snapshot(profile: string, calendar: ContributionResponse): StudioSnapshot {
  return captureSnapshot(state, profile, calendar, session.bpm.value, mix.snapshot())
}

function restore(snapshot: StudioSnapshot): void {
  session.stop()
  applySynthParams(params, snapshot.synth)
  Object.assign(state.selection, snapshot.selection)
  Object.assign(state.sound, snapshot.sound, { octaves: { ...snapshot.sound.octaves } })
  Object.assign(state.view, snapshot.view)
  session.setBpm(snapshot.bpm)
  mix.restore(snapshot.mix)
  for (const voice of ['bass', 'pad', 'lead'] as const) mix.setLevel(voice, params[voice].volume)
  adapter.updateParams()
  adapter.updateMix()
}

function resetSound(): void {
  session.stop()
  const defaults = defaultStudioConfig()
  applySynthParams(params, defaults.synth)
  Object.assign(state.sound, defaults.sound)
  Object.assign(state.view, defaults.view)
  mix.restore({ muted: { bass: false, pad: false, lead: false }, solo: null })
  for (const voice of ['bass', 'pad', 'lead'] as const) mix.setLevel(voice, params[voice].volume)
  session.setBpm(90)
  adapter.updateParams()
  adapter.updateMix()
}

function toggleMute(voice: Voice): void {
  mix.toggleMute(voice)
  adapter.updateMix()
}

function toggleSolo(voice: Voice): void {
  mix.toggleSolo(voice)
  adapter.updateMix()
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    stopFocusWatch()
    stopStatusWatch()
    session.dispose()
  })
}

export function useStudio() {
  return {
    state,
    params,
    mix,
    session,
    updateSynthParam,
    toggleMute,
    toggleSolo,
    snapshot,
    restore,
    resetSound,
  }
}
