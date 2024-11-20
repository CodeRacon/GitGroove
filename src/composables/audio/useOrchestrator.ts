import * as Tone from 'tone'
import { ref, onUnmounted } from 'vue'
import { HarmonyManager } from './HarmonyManager'
import { useSynthState } from './useSynthState'
import type { SynthState } from './useSynthState'
import { useSynthDefinitions } from './useSynthDefinitions'
import { usePatternHandler } from './usePatternHandler'

export interface Pattern {
  pattern: number[]
  notes: string[]
}

export function useOrchestrator() {
  const { synthState, isBassParam, isPadParam, isLeadParam } = useSynthState()
  const { bassEffects, bassSynth, leadEffects, leadSynth, padEffects, padSynth } =
    useSynthDefinitions()

  let isAudioContextInitialized = false
  let animationFrameId: number | null = null
  const isPlaying = ref(false)
  const currentBPM = ref(120)
  const currentKey = ref('C')
  const currentScale = ref('major')

  /**
   * Initializes the audio context and starts the Tone.js library.
   * This function is called to ensure the audio context is properly set up
   * before any audio playback can occur.
   */
  const initAudioContext = async () => {
    if (!isAudioContextInitialized) {
      await Tone.start()
      await Tone.getContext().resume()
      padSynth.triggerAttackRelease(['C1'], '32n', undefined, 0)
      isAudioContextInitialized = true
    }
  }

  /**
   * Provides functions to handle musical patterns, including playing patterns and managing active synthesizers.
   *
   * The `playPattern` function is used to play a musical pattern, while the `activeSynths` object tracks which synthesizers are currently active.
   */
  const { playPattern, activeSynths } = usePatternHandler(initAudioContext)

  /**
   * Animates the audio playback by updating the progression chord and scheduling the next animation frame.
   * This function is called recursively using `requestAnimationFrame` to create a continuous animation loop.
   * It checks if the audio is currently playing before proceeding, and exits the function if it is not.
   */
  const animate = () => {
    if (!isPlaying.value) return
    const now = Tone.now()
    updateProgressionChord(now)
    animationFrameId = requestAnimationFrame(animate)
  }

  const harmonyManager = new HarmonyManager()

  /**
   * Starts the audio playback by initializing the audio context, setting the playing state, and starting the animation loop.
   */
  const startPlayback = async () => {
    await initAudioContext()
    isPlaying.value = true
    synthState.value.isPlaying = true
    animate()
  }

  /**
   * Stops the audio playback by setting the playing state to false, deactivating the synthesizers,
   * canceling the animation frame, and triggering the release of the active synthesizers.
   */
  const stopPlayback = () => {
    isPlaying.value = false
    synthState.value.isPlaying = false
    activeSynths.value = {
      bass: false,
      pad: false,
      lead: false,
    }
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
    bassSynth.triggerRelease()
    padSynth.releaseAll()
    leadSynth.triggerRelease()
  }

  /**
   * Cleans up the audio playback by canceling the animation frame and releasing all active synthesizers.
   */
  const cleanup = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      padSynth.releaseAll()
    }
  }

  /**
   * Updates the parameters of the specified synthesizer type.
   *
   * This function allows you to update the parameters of the bass, pad, or lead synthesizers.
   * It checks if the audio context is running and if the specified synthesizer is active before
   * applying the parameter changes.
   *
   * @param synthType - The type of synthesizer to update ('bass', 'pad', or 'lead').
   * @param param - The parameter to update (e.g., 'cutoff', 'volume', 'envelope').
   * @param value - The new value for the specified parameter.
   */
  const updateSynthParam = <T extends keyof SynthState['synthParams']>(
    synthType: T,
    param: keyof SynthState['synthParams'][T],
    value: SynthState['synthParams'][T][keyof SynthState['synthParams'][T]],
  ) => {
    synthState.value.synthParams[synthType][param] = value

    if (Tone.getContext().state === 'running' && activeSynths.value[synthType]) {
      switch (synthType) {
        case 'bass':
          if (typeof param === 'string' && isBassParam(param)) {
            switch (param) {
              case 'cutoff':
                bassEffects.filter.frequency.rampTo(value as number, 0.1)
                break
              case 'resonance':
                bassEffects.filter.Q.rampTo(value as number, 0.1)
                break
              case 'volume':
                bassEffects.volume.volume.rampTo(value as number, 0.1)
                break
              default:
                bassSynth.set({
                  envelope: { [param]: value },
                })
            }
          }
          break

        case 'pad':
          if (typeof param === 'string' && isPadParam(param)) {
            switch (param) {
              case 'cutoff':
                padEffects.filter.frequency.rampTo(value as number, 0.1)
                break
              case 'reverbMix':
                padEffects.reverb.wet.rampTo(value as number, 0.1)
                break
              case 'volume':
                padEffects.volume.volume.rampTo(value as number, 0.1)
                break
              case 'chorus':
                padEffects.chorus.wet.value = (value as boolean) ? 0.3 : 0
                break
              default:
                if (typeof param === 'string' && param.startsWith('mod')) {
                  padSynth.set({
                    modulationEnvelope: { [param.slice(3).toLowerCase()]: value },
                  })
                } else {
                  padSynth.set({
                    envelope: { [param]: value },
                  })
                }
            }
          }
          break

        case 'lead':
          if (typeof param === 'string' && isLeadParam(param)) {
            switch (param) {
              case 'cutoff':
                leadEffects.filter.frequency.rampTo(value as number, 0.1)
                break
              case 'delayTime':
                leadEffects.delay.delayTime.rampTo(value as number, 0.1)
                break
              case 'delayFeedback':
                leadEffects.delay.feedback.rampTo(value as number, 0.1)
                break
              case 'reverbMix':
                leadEffects.reverb.wet.rampTo(value as number, 0.1)
                break
              case 'volume':
                leadEffects.volume.volume.rampTo(value as number, 0.1)
                break
              case 'distortion':
                leadEffects.distortion.wet.value = (value as boolean) ? 0.6 : 0
                break
              default:
                leadSynth.set({
                  envelope: { [param]: value },
                })
            }
          }
          break
      }
    }
  }

  /**
   * Updates the harmony based on the provided contribution level and day of the week.
   *
   * @param contributionLevel - The user's contribution level.
   * @param dayOfWeek - The current day of the week.
   * @returns An object containing the updated bass, chord, and extensions for the harmony.
   */
  const updateHarmony = (contributionLevel: number, dayOfWeek: number) => {
    const harmony = harmonyManager.determineHarmony(contributionLevel, dayOfWeek)
    currentKey.value = harmony.key
    currentScale.value = harmony.scale

    const extendedHarmony = harmonyManager.getExtendedHarmony(contributionLevel)
    return {
      bass: extendedHarmony.bass,
      chord: extendedHarmony.chord,
      extensions: extendedHarmony.extensions,
    }
  }

  /**
   * A function that updates the progression chord based on the current timestamp and BPM.
   *
   * This function is responsible for triggering the pad synth with the current chord at the appropriate beat intervals. It calculates the current beat based on the timestamp and BPM, and then retrieves the current chord from the harmony manager. If the current chord is valid, it triggers the pad synth to play the chord.
   */
  const updateProgressionChord = (() => {
    let lastBeat = -1

    return (timestamp: number) => {
      const currentBeat = Math.floor((timestamp * currentBPM.value) / 60) % 4

      if (currentBeat !== lastBeat) {
        const currentChord = harmonyManager.getCurrentChord(timestamp)

        if (currentChord.length > 0 && currentChord.every((note) => note)) {
          padSynth.triggerAttackRelease(currentChord, '4n')
        }
        lastBeat = currentBeat
      }
    }
  })()

  /**
   * Updates the current BPM (beats per minute) value and propagates the change to the harmony manager.
   *
   * @param newBPM - The new BPM value to set.
   */
  const updateBPM = (newBPM: number) => {
    currentBPM.value = newBPM
    harmonyManager.bpm = newBPM
  }

  cleanup()
  animationFrameId = requestAnimationFrame(animate)
  onUnmounted(() => cleanup())
  requestAnimationFrame(animate)

  return {
    startPlayback,
    stopPlayback,
    playPattern,
    updateHarmony,
    synthState,
    updateSynthParam,
    currentKey,
    currentScale,
    currentBPM,
    updateBPM,
    bassSynth,
    padSynth,
    padEffects,
    leadSynth,
    leadEffects,
  }
}
