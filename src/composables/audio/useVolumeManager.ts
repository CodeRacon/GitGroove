import { ref } from 'vue'
import * as Tone from 'tone'
import type { Volume } from 'tone'

export function useVolumeManager() {
  /**
   * An object containing the initial volume levels for different audio channels.
   * The keys in this object correspond to the names of the audio channels, and the
   * values represent the initial volume levels for those channels, expressed in
   * decibels (dB).
   */
  const volumes = ref({
    bass: -8,
    pad: 4,
    lead: -16,
  })

  const transitionTime = 0.1

  /**
   * Sets the volume of a specific audio channel.
   *
   * @param synth - The name of the audio channel to set the volume for.
   * @param volume - The new volume level for the audio channel, expressed in decibels (dB).
   * @param effect - The Tone.js `Volume` object associated with the audio channel.
   */
  const setVolume = (synth: string, volume: number, effect: Volume) => {
    volumes.value[synth as keyof typeof volumes.value] = volume
    effect.volume.value = volume
  }

  /**
   * Fades out the volume of an audio effect.
   *
   * @param effect - The Tone.js `Volume` object associated with the audio effect to fade out.
   */
  const fadeOut = (effect: Volume) => {
    effect.volume.rampTo(-Infinity, transitionTime)
  }

  /**
   * Fades in the volume of an audio effect.
   *
   * @param synth - The name of the audio channel to fade in.
   * @param effect - The Tone.js `Volume` object associated with the audio effect to fade in.
   */
  const fadeIn = (synth: string, effect: Volume) => {
    const targetVolume = volumes.value[synth as keyof typeof volumes.value]
    effect.volume.rampTo(targetVolume, transitionTime)
  }

  return {
    volumes,
    setVolume,
    fadeOut,
    fadeIn,
  }
}
