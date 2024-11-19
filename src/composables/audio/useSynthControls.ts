import { useOrchestrator } from './useOrchestrator'
import * as Tone from 'tone'

type ValidatorFn = (value: number) => boolean

const isValidParam = (value: number): boolean => {
  return value !== null && !isNaN(value) && isFinite(value)
}

const safeUpdateParam = <T extends number>(
  updateFn: (value: T) => void,
  value: T,
  validator: (value: T) => boolean = isValidParam,
): void => {
  if (validator(value)) {
    updateFn(value)
  }
}

export let lastVolumeValue: number | null = null
export let lastCutoffValue: number | null = null

export function useSynthControls() {
  const { updateSynthParam } = useOrchestrator()

  const updateBassParams = {
    cutoff: (value: number) => {
      updateSynthParam('bass', 'cutoff', value)
    },
    resonance: (value: number) => {
      updateSynthParam('bass', 'resonance', value)
    },
    attack: (value: number) => {
      updateSynthParam('bass', 'attack', value)
    },
    decay: (value: number) => {
      updateSynthParam('bass', 'decay', value)
    },
    sustain: (value: number) => {
      updateSynthParam('bass', 'sustain', value)
    },
    release: (value: number) => {
      updateSynthParam('bass', 'release', value)
    },
    volume: (value: number) => {
      updateSynthParam('bass', 'volume', value)
    },
  }

  const updatePadParams = {
    cutoff: (value: number) => {
      updateSynthParam('pad', 'cutoff', value)
    },
    reverbMix: (value: number) => {
      updateSynthParam('pad', 'reverbMix', value)
    },
    attack: (value: number) => {
      updateSynthParam('pad', 'attack', value)
    },
    decay: (value: number) => {
      updateSynthParam('pad', 'decay', value)
    },
    sustain: (value: number) => {
      updateSynthParam('pad', 'sustain', value)
    },
    release: (value: number) => {
      updateSynthParam('pad', 'release', value)
    },
    modAttack: (value: number) => {
      updateSynthParam('pad', 'modAttack', value)
    },
    modDecay: (value: number) => {
      updateSynthParam('pad', 'modDecay', value)
    },
    modSustain: (value: number) => {
      updateSynthParam('pad', 'modSustain', value)
    },
    modRelease: (value: number) => {
      updateSynthParam('pad', 'modRelease', value)
    },
    chorus: (value: boolean) => {
      updateSynthParam('pad', 'chorus', value)
    },
    volume: (value: number) => {
      updateSynthParam('pad', 'volume', value)
    },
  }

  const updateLeadParams = {
    cutoff: (value: number) => {
      updateSynthParam('lead', 'cutoff', value)
    },
    delayTime: (value: number) => {
      updateSynthParam('lead', 'delayTime', value)
    },
    delayFeedback: (value: number) => {
      updateSynthParam('lead', 'delayFeedback', value)
    },
    reverbMix: (value: number) => {
      updateSynthParam('lead', 'reverbMix', value)
    },
    attack: (value: number) => {
      updateSynthParam('lead', 'attack', value)
    },
    decay: (value: number) => {
      updateSynthParam('lead', 'decay', value)
    },
    sustain: (value: number) => {
      updateSynthParam('lead', 'sustain', value)
    },
    release: (value: number) => {
      updateSynthParam('lead', 'release', value)
    },
    distortion: (value: boolean) => {
      updateSynthParam('lead', 'distortion', value)
    },
    volume: (value: number) => {
      updateSynthParam('lead', 'volume', value)
    },
  }

  return {
    updateBassParams,
    updatePadParams,
    updateLeadParams,
  }
}
