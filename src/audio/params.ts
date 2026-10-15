export const BASS_WAVEFORMS = ['square8', 'sine', 'triangle', 'sawtooth'] as const
export type BassWaveform = (typeof BASS_WAVEFORMS)[number]

export type BassSynthParams = {
  waveform: BassWaveform
  cutoff: number
  resonance: number
  attack: number
  decay: number
  sustain: number
  release: number
  volume: number
}
export type PadSynthParams = {
  cutoff: number
  reverbMix: number
  attack: number
  decay: number
  sustain: number
  release: number
  volume: number
  chorus: boolean
  modAttack: number
  modDecay: number
  modSustain: number
  modRelease: number
}
export type LeadSynthParams = {
  cutoff: number
  delayTime: number
  delayFeedback: number
  reverbMix: number
  attack: number
  decay: number
  sustain: number
  release: number
  volume: number
  distortion: boolean
}
export type SynthParams = { bass: BassSynthParams; pad: PadSynthParams; lead: LeadSynthParams }

export function defaultSynthParams(): SynthParams {
  return {
    bass: {
      waveform: 'square8',
      cutoff: 240,
      resonance: 2,
      attack: 0.2,
      decay: 0.6,
      sustain: 0.8,
      release: 1.6,
      volume: -8,
    },
    pad: {
      cutoff: 1250,
      reverbMix: 0.85,
      attack: 0.8,
      decay: 1.8,
      sustain: 0.9,
      release: 3,
      volume: 4,
      chorus: true,
      modAttack: 0.4,
      modDecay: 0.6,
      modSustain: 0.7,
      modRelease: 2.2,
    },
    lead: {
      cutoff: 800,
      delayTime: 0.25,
      delayFeedback: 0.35,
      reverbMix: 0.3,
      attack: 0.1,
      decay: 0.3,
      sustain: 0.6,
      release: 0.8,
      volume: -16,
      distortion: false,
    },
  }
}

// Shared by controls and snapshot validation. Values are never trusted from a shared link.
export const SYNTH_RANGES = {
  bass: {
    volume: [-60, 40],
    cutoff: [20, 4000],
    resonance: [0.1, 5],
    attack: [0.1, 1],
    decay: [0.1, 1],
    sustain: [0.1, 1],
    release: [0.01, 5],
  },
  pad: {
    volume: [-60, 40],
    cutoff: [20, 2000],
    reverbMix: [0, 1],
    attack: [0.1, 1],
    decay: [0.1, 3],
    sustain: [0, 1],
    release: [0.1, 5],
    modAttack: [0.1, 1],
    modDecay: [0.1, 3],
    modSustain: [0, 1],
    modRelease: [0.1, 5],
  },
  lead: {
    volume: [-60, 40],
    cutoff: [20, 2000],
    delayTime: [0.1, 1],
    delayFeedback: [0, 1],
    reverbMix: [0, 1],
    attack: [0.1, 1],
    decay: [0.1, 1],
    sustain: [0.1, 1],
    release: [0.1, 5],
  },
} as const
