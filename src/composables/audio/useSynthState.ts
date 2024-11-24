import { ref } from 'vue'

export type SynthType = 'bass' | 'pad' | 'lead'

export type BassSynthParams = {
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

export interface SynthState {
  isPlaying: boolean
  synthParams: {
    bass: BassSynthParams
    pad: PadSynthParams
    lead: LeadSynthParams
  }
  soloState: 'none' | 'bass' | 'pad' | 'lead'
  muteState: Set<'bass' | 'pad' | 'lead'>
  previousVolumes: {
    bass: number
    pad: number
    lead: number
  }
}

/** The `synthState` variable is a reactive state object that holds the current state
 * of the audio synthesizer.
 * It includes information about whether the synthesizer is currently playing,
 * as well as the specific parameter values for the bass, pad, and lead synth voices.
 * This state is used throughout the application to control the audio output and update
 * the user interface.
 */
const synthState = ref<SynthState>({
  isPlaying: false,
  synthParams: {
    bass: {
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
      release: 3.0,
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
  },
  soloState: 'none',
  muteState: new Set(),
  previousVolumes: {
    bass: -12,
    pad: -8,
    lead: -16,
  },
})

/**
 * Checks if the given parameter is a valid bass synth parameter.
 * @param param - The parameter to check.
 * @returns `true` if the parameter is a valid bass synth parameter, `false` otherwise.
 */
function isBassParam(param: string): param is keyof BassSynthParams {
  return ['cutoff', 'resonance', 'attack', 'decay', 'sustain', 'release', 'volume'].includes(param)
}

/**
 * Checks if the given parameter is a valid pad synth parameter.
 * @param param - The parameter to check.
 * @returns `true` if the parameter is a valid pad synth parameter, `false` otherwise.
 */
function isPadParam(param: string): param is keyof PadSynthParams {
  return [
    'cutoff',
    'reverbMix',
    'attack',
    'decay',
    'sustain',
    'release',
    'volume',
    'chorus',
    'modAttack',
    'modDecay',
    'modSustain',
    'modRelease',
  ].includes(param)
}

/**
 * Checks if the given parameter is a valid lead synth parameter.
 * @param param - The parameter to check.
 * @returns `true` if the parameter is a valid lead synth parameter, `false` otherwise.
 */
function isLeadParam(param: string): param is keyof LeadSynthParams {
  return [
    'cutoff',
    'delayTime',
    'delayFeedback',
    'reverbMix',
    'attack',
    'decay',
    'sustain',
    'release',
    'volume',
    'distortion',
  ].includes(param)
}

/**
 * Provides access to the synth state and helper functions for checking synth parameter types.
 * @returns An object containing the `synthState` and functions `isBassParam`, `isPadParam`, and `isLeadParam`.
 */
export function useSynthState() {
  return {
    synthState,
    isBassParam,
    isPadParam,
    isLeadParam,
  }
}
