import { reactive, watch } from 'vue'
import { SynthMix } from './mix'
import { defaultSynthParams, type SynthParams } from './params'
import { ToneAudioAdapter } from '@/playback/tone-adapter'
import { PlaybackSession } from '@/playback/session'
import type { Voice } from '@/music/score'

type Params = SynthParams
const params = reactive(defaultSynthParams())
const mix = reactive(new SynthMix()) as SynthMix
mix.setGate(false)
const adapter = new ToneAudioAdapter(mix, params)
const session = new PlaybackSession(adapter)
watch(session.status, (status) => {
  mix.setGate(status === 'playing')
  adapter.updateMix()
}, { flush: 'sync' })

function updateSynthParam<T extends Voice>(voice: T, param: keyof Params[T], value: number | boolean): void {
  const voiceParams = params[voice] as unknown as Record<string, number | boolean>
  voiceParams[String(param)] = value
  if (param === 'volume' && typeof value === 'number') mix.setLevel(voice, value)
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

export function useStudio() {
  return { params, mix, session, updateSynthParam, toggleMute, toggleSolo }
}
