export type BassSynthParams = {
  cutoff: number; resonance: number; attack: number; decay: number; sustain: number; release: number; volume: number
}
export type PadSynthParams = {
  cutoff: number; reverbMix: number; attack: number; decay: number; sustain: number; release: number; volume: number
  chorus: boolean; modAttack: number; modDecay: number; modSustain: number; modRelease: number
}
export type LeadSynthParams = {
  cutoff: number; delayTime: number; delayFeedback: number; reverbMix: number; attack: number; decay: number
  sustain: number; release: number; volume: number; distortion: boolean
}
export type SynthParams = { bass: BassSynthParams; pad: PadSynthParams; lead: LeadSynthParams }

export function defaultSynthParams(): SynthParams {
  return {
    bass: { cutoff: 240, resonance: 2, attack: 0.2, decay: 0.6, sustain: 0.8, release: 1.6, volume: -8 },
    pad: {
      cutoff: 1250, reverbMix: 0.85, attack: 0.8, decay: 1.8, sustain: 0.9, release: 3,
      volume: 4, chorus: true, modAttack: 0.4, modDecay: 0.6, modSustain: 0.7, modRelease: 2.2,
    },
    lead: {
      cutoff: 800, delayTime: 0.25, delayFeedback: 0.35, reverbMix: 0.3, attack: 0.1,
      decay: 0.3, sustain: 0.6, release: 0.8, volume: -16, distortion: false,
    },
  }
}
