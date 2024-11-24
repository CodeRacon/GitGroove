import type { SynthType } from './useSynthState'
import { useOrchestrator } from './useOrchestrator'

export function useSynthControls() {
  const { synthState, updateSynthParam } = useOrchestrator()

  /**
   * Toggles the solo state for the specified synth type.
   * - If the synth type is currently in solo mode, it will be set to 'none' and all other synths will have their previous volumes restored.
   * - If the synth type is not in solo mode, it will be set to solo and all other synths will be muted.
   * - If the synth type is currently muted, the mute state will be cleared before toggling the solo state.
   *
   * @param synthType - The synth type to toggle the solo state for.
   */
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

  /**
   * Toggles the mute state for the specified synth type.
   * - If the synth type is currently muted, it will be unmuted and its previous volume will be restored.
   * - If the synth type is not muted, it will be muted and its volume will be set to -60 dB.
   * - If the synth type is currently in solo mode, the solo state will be cleared before toggling the mute state.
   *
   * @param synthType - The synth type to toggle the mute state for.
   */
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
