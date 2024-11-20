import type { SynthType } from './useSynthState'
import { useOrchestrator } from './useOrchestrator'

export function useSynthControls() {
  const { synthState, updateSynthParam } = useOrchestrator()

  const toggleSolo = (synthType: SynthType) => {
    if (synthState.value.muteState.has(synthType)) {
      synthState.value.muteState.delete(synthType)
    }

    if (synthState.value.soloState === synthType) {
      synthState.value.soloState = 'none'
      Object.entries(synthState.value.previousVolumes).forEach(([type, volume]) => {
        updateSynthParam(type as SynthType, 'volume', volume)
      })
    } else {
      if (synthState.value.soloState !== 'none') {
        Object.entries(synthState.value.previousVolumes).forEach(([type, volume]) => {
          updateSynthParam(type as SynthType, 'volume', volume)
        })
      }

      Object.keys(synthState.value.previousVolumes).forEach((type) => {
        if (type !== synthType) {
          synthState.value.previousVolumes[type as SynthType] =
            synthState.value.synthParams[type as SynthType].volume
        }
      })

      Object.keys(synthState.value.previousVolumes).forEach((type) => {
        if (type !== synthType) {
          updateSynthParam(type as SynthType, 'volume', -60)
        }
      })

      synthState.value.soloState = synthType
    }
  }

  const toggleMute = (synthType: SynthType) => {
    if (synthState.value.soloState === synthType) {
      synthState.value.soloState = 'none'
    }

    if (synthState.value.muteState.has(synthType)) {
      synthState.value.muteState.delete(synthType)
      updateSynthParam(synthType, 'volume', synthState.value.previousVolumes[synthType])
    } else {
      synthState.value.muteState.add(synthType)
      synthState.value.previousVolumes[synthType] = synthState.value.synthParams[synthType].volume
      updateSynthParam(synthType, 'volume', -60)
    }
  }

  return {
    toggleSolo,
    toggleMute,
  }
}
