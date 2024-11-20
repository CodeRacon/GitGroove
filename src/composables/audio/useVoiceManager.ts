import { ref, readonly } from 'vue'
import * as Tone from 'tone'

/**
 * The maximum number of active voices that can be played simultaneously.
 */
const MAX_VOICES = 4

/**
 * Tracks the status of active, pending, and last cleanup time for the audio voices.
 */
const voiceStatus = ref({
  active: 0,
  pending: 0,
  lastCleanup: 0,
})

export function useVoiceManager(padSynth: Tone.PolySynth) {
  /**
   * Updates the voice status by incrementing the active voice count.
   * @param delta - The number of voices to add to the active voice count.
   */
  const updateVoiceStatus = (delta: number) => {
    voiceStatus.value.active = Math.max(0, voiceStatus.value.active + delta)
  }

  /**
   * Manages the active voices for the audio playback.
   * This function checks if the current time since the last voice cleanup is greater than 1 second, and if so, it calls the `cleanupVoices` function to release any inactive voices. It then returns a boolean indicating whether the number of active voices is less than the `MAX_VOICES` constant.
   * @returns {boolean} `true` if the number of active voices is less than the `MAX_VOICES` constant, `false` otherwise.
   */
  const manageVoices = async () => {
    const now = Tone.now()
    if (now - voiceStatus.value.lastCleanup > 1) {
      await cleanupVoices()
      voiceStatus.value.lastCleanup = now
    }
    return voiceStatus.value.active < MAX_VOICES
  }

  /**
   * Cleans up the active voices by releasing all notes on the pad synth and resetting the voice status.
   * This function is used to free up voice resources when the maximum number of active voices has been reached.
   * @returns {Promise<void>} A promise that resolves after a 100ms delay.
   */
  const cleanupVoices = async () => {
    padSynth.releaseAll()
    voiceStatus.value.active = 0
    voiceStatus.value.pending = 0
    return new Promise((resolve) => setTimeout(resolve, 100))
  }

  return {
    voiceStatus: readonly(voiceStatus),
    updateVoiceStatus,
    manageVoices,
    cleanupVoices,
    MAX_VOICES,
  }
}
