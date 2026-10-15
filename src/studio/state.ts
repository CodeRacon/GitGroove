import { defaultSynthParams, type SynthParams } from '@/audio/params'
import type { Voice } from '@/music/score'

export const ROOT_KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const
export type RootKey = (typeof ROOT_KEYS)[number]
export type Octave = -1 | 0 | 1

export interface SoundSettings {
  key: RootKey
  octaves: Record<Voice, Octave>
  leadFocus: number
}

export interface StudioConfig {
  selection: { startWeek: number; weekCount: number }
  sound: SoundSettings
  synth: SynthParams
  view: { padEnvelope: 'amplitude' | 'modulation' }
}

export function defaultStudioConfig(): StudioConfig {
  return {
    selection: { startWeek: 0, weekCount: 8 },
    sound: { key: 'C', octaves: { bass: 0, pad: 0, lead: 0 }, leadFocus: 0 },
    synth: defaultSynthParams(),
    view: { padEnvelope: 'amplitude' },
  }
}
