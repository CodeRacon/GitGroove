import * as Tone from 'tone'
import { ref, readonly, onUnmounted } from 'vue'
import { HarmonyManager } from './HarmonyManager'
import { PatternGenerator } from './PatternGenerator'

/**
 * Represents a pattern of notes to be played.
 * @property {number[]} pattern - An array of numbers representing the pattern of notes.
 * @property {string[]} notes - An array of strings representing the notes in the pattern.
 */
interface Pattern {
  pattern: number[]
  notes: string[]
}

export function useOrchestrator() {
  /**
   * Indicates whether the audio context has been initialized.
   */
  let isAudioContextInitialized = false

  /**
   * Indicates whether the audio playback is currently in progress.
   */
  const isPlaying = ref(false)

  /**
   * Animates the audio playback by updating the progression chord and requesting the next animation frame.
   * This function is called recursively as long as the audio playback is in progress.
   */
  const animate = () => {
    if (!isPlaying.value) return

    const now = Tone.now()
    updateProgressionChord(now)
    animationFrameId = requestAnimationFrame(animate)
  }

  /**
   * Starts the audio playback by setting the `isPlaying` flag to `true` and calling the `animate` function to begin the animation loop.
   */
  const startPlayback = () => {
    isPlaying.value = true
    animate()
  }

  /**
   * Stops the audio playback by setting the `isPlaying` flag to `false`, canceling the animation frame, and releasing all voices on the `padSynth`.
   */
  const stopPlayback = () => {
    isPlaying.value = false
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
    padSynth.releaseAll()
  }

  /**
   * Initializes the audio context and ensures it is in a playable state.
   * This function checks if the audio context has already been initialized, and if not, it starts the Tone.js audio context, resumes it, and triggers a short audio playback to ensure the context is in a playable state.
   * After the audio context is initialized, the `isAudioContextInitialized` flag is set to `true`.
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
   * Stores the ID of the current animation frame, or `null` if no animation is in progress.
   */
  let animationFrameId: number | null = null

  /**
   * Cleans up the audio playback by canceling the current animation frame and releasing all voices on the `padSynth`.
   */
  const cleanup = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      padSynth.releaseAll()
    }
  }

  /**
   * Tracks the status of active, pending, and last cleanup time for the audio voices.
   */
  const voiceStatus = ref({
    active: 0,
    pending: 0,
    lastCleanup: 0,
  })

  /**
   * The maximum number of active voices that can be played simultaneously.
   */
  const MAX_VOICES = 4

  /**
   * The current beats per minute (BPM) for the audio playback.
   */
  const currentBPM = ref(120)

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
   * Defines the effects applied to the bass synth in the audio orchestrator.
   * The bass synth is filtered using a lowpass filter with a frequency of 200 Hz and a rolloff of -24 dB/octave. The volume of the bass synth is also reduced by 28 dB.
   */
  const bassEffects = {
    filter: new Tone.Filter({
      frequency: 200,
      type: 'lowpass',
      rolloff: -24,
    }),
    volume: new Tone.Volume(-28),
  }

  /**
   * Defines the effects applied to the pad synth in the audio orchestrator.
   * The pad synth is processed through a reverb effect with a decay time of 8 seconds and a wet mix of 85%. It is also processed through a chorus effect with a frequency of 0.5 Hz, a depth of 0.8, and a wet mix of 30%. Finally, the volume of the pad synth is increased by 4 dB.
   */
  const padEffects = {
    reverb: new Tone.Reverb({
      decay: 8,
      wet: 0.85,
    }),
    chorus: new Tone.Chorus({
      frequency: 0.5,
      depth: 0.8,
      wet: 0.3,
    }),
    volume: new Tone.Volume(4),
  }

  /**
   * Defines the effects applied to the lead synth in the audio orchestrator.
   * The lead synth is processed through a ping-pong delay effect with a delay time of 16th notes, a feedback of 35%, and a wet mix of 40%. It is also processed through an auto-filter effect with a frequency of 0.8 Hz, a depth of 0.4, a sine wave type, and a wet mix of 30%. Finally, the volume of the lead synth is reduced by 24 dB.
   */
  const leadEffects = {
    delay: new Tone.PingPongDelay({
      delayTime: '16n',
      feedback: 0.35,
      wet: 0.4,
    }),
    filter: new Tone.AutoFilter({
      frequency: 0.8,
      depth: 0.4,
      type: 'sine',
      wet: 0.3,
    }),
    volume: new Tone.Volume(-24),
  }

  /**
   * Defines the bass synth in the audio orchestrator.
   * The bass synth uses a square wave oscillator and an envelope with a relatively long attack, decay, and release to create a deep, sustained bass sound. The bass synth is processed through a lowpass filter to remove high frequencies and a volume effect to reduce the overall volume.
   */
  const bassSynth = new Tone.MonoSynth({
    oscillator: { type: 'square8' },
    envelope: { attack: 0.8, decay: 1.2, sustain: 0.2, release: 1.6 },
  }).chain(bassEffects.filter, bassEffects.volume, Tone.Destination)

  /**
   * Defines the pad synth in the audio orchestrator.
   * The pad synth uses an FM synthesis engine with a sine wave modulation type. It has an envelope with a relatively long attack, decay, and release to create a sustained, evolving pad sound. The pad synth is processed through a chorus effect to add depth and movement, a reverb effect to create a spacious ambience, and a volume effect to adjust the overall volume.
   */
  const padSynth = new Tone.PolySynth(Tone.FMSynth)
    .set({
      envelope: {
        attack: 0.8,
        decay: 1.8,
        sustain: 0.9,
        release: 3.0,
      },
      modulation: {
        type: 'sine',
      },
      modulationEnvelope: {
        attack: 1,
        decay: 0.6,
        sustain: 0.7,
        release: 2.2,
      },
      harmonicity: 1.5,
    })
    .chain(padEffects.chorus, padEffects.reverb, padEffects.volume, Tone.Destination)

  /**
   * Defines the lead synth in the audio orchestrator.
   * The lead synth uses a triangle wave oscillator and an envelope with a relatively short attack, decay, and release to create a bright, punchy lead sound. The lead synth is processed through a lowpass filter to remove high frequencies, a ping-pong delay effect to add depth and movement, and a volume effect to adjust the overall volume.
   */
  const leadSynth = new Tone.MonoSynth({
    oscillator: {
      type: 'triangle8',
    },
    envelope: {
      attack: 0.02,
      decay: 0.3,
      sustain: 0.6,
      release: 0.8,
    },
    filter: {
      Q: 2,
      type: 'lowpass',
      rolloff: -12,
    },
    filterEnvelope: {
      attack: 0.1,
      decay: 0.2,
      sustain: 0.8,
      release: 0.5,
      baseFrequency: 2000,
      octaves: 1.5,
    },
  }).chain(leadEffects.filter, leadEffects.delay, leadEffects.volume, Tone.Destination)

  /**
   * Manages the harmony and chord progressions in the audio orchestrator.
   */
  const harmonyManager = new HarmonyManager()

  /**
   * Generates musical patterns for the audio orchestrator.
   * The PatternGenerator class is responsible for generating various types of musical patterns, such as bass lines, chord progressions, and arpeggios, based on input notes and a specified pattern level.
   */
  const patternGenerator = new PatternGenerator()

  /**
   * Updates the voice status by incrementing the active voice count.
   * @param delta - The number of voices to add to the active voice count.
   */
  const updateVoiceStatus = (delta: number) => {
    voiceStatus.value.active = Math.max(0, voiceStatus.value.active + delta)
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

  /**
   * Executes a musical pattern, such as a chord progression, by triggering the notes on the pad synth.
   * The function manages the active voices to ensure the maximum number of voices is not exceeded.
   * @param pattern - The musical pattern to execute, containing the notes and velocities.
   * @param type - The type of pattern being executed (e.g. 'chords').
   * @param now - The current time in the audio context.
   * @returns {Promise<void>} A promise that resolves when the pattern has been executed.
   */
  const executePattern = async (pattern: Pattern, type: string, now: number) => {
    if (type === 'chords' && 'pattern' in pattern) {
      if (!(await manageVoices())) return

      pattern.pattern.forEach((velocity: number, i: number) => {
        if (velocity > 0) {
          const limitedNotes = pattern.notes.slice(0, 3)
          if (voiceStatus.value.active + limitedNotes.length <= MAX_VOICES) {
            padSynth.triggerAttackRelease(limitedNotes, '12n', now + i * 0.25, velocity * 1.25)
            updateVoiceStatus(limitedNotes.length)
          }
        }
      })
    }
  }

  /**
   * Plays a musical pattern, such as a bass line, chord progression, or arpeggio, using the audio orchestrator.
   * This function initializes the audio context, generates the specified pattern, and triggers the notes on the appropriate synths.
   * It manages the active voices to ensure the maximum number of voices is not exceeded.
   *
   * @param type - The type of pattern to play, either 'bass', 'chords', or 'arpeggio'.
   * @param level - The level of complexity for the pattern, used to generate the pattern.
   * @param notes - The notes to use for the pattern.
   * @returns {Promise<void>} A promise that resolves when the pattern has been played.
   */
  const playPattern = async (
    type: 'bass' | 'chords' | 'arpeggio',
    level: number,
    notes: string[],
  ) => {
    await initAudioContext()

    if (!notes?.length) return

    const pattern = patternGenerator.generatePattern(type, level, notes) as Pattern | string[]
    const now = Tone.now()

    switch (type) {
      case 'bass':
        if ('pattern' in pattern && pattern.notes[0]) {
          pattern.pattern.forEach((velocity, i) => {
            if (velocity > 0) {
              bassSynth.triggerAttackRelease(pattern.notes[0], '8n', now + i * 0.25, velocity * 0.8)
            }
          })
        }
        break

      case 'chords':
        if (voiceStatus.value.active >= MAX_VOICES) {
          await cleanupVoices()
        }
        await executePattern(pattern as Pattern, type, now)
        break

      case 'arpeggio':
        if (Array.isArray(pattern) && pattern.every((note) => note)) {
          pattern.forEach((note, i) => {
            leadSynth.triggerAttackRelease(note, '16n', now + i * 0.125, 0.7 + (i % 2) * 0.2)
          })
        }
        break
    }
  }

  /**
   * The current key and scale being used in the audio orchestrator.
   * The key is represented as a string, e.g. 'C', 'D', 'E', etc.
   * The scale is represented as a string, e.g. 'major', 'minor', 'pentatonic', etc.
   * These values are used to determine the harmony and chord progressions played by the orchestrator.
   */
  const currentKey = ref('C')
  const currentScale = ref('major')

  /**
   * Updates the current key and scale used by the audio orchestrator based on the provided contribution level and day of the week.
   * The harmony manager is used to determine the appropriate key and scale for the given inputs.
   * Additionally, an extended harmony object is returned, which contains the bass, chord, and extension notes to be used in the orchestration.
   *
   * @param contributionLevel - The user's contribution level, which affects the harmony.
   * @param dayOfWeek - The current day of the week, which also affects the harmony.
   * @returns An object containing the bass, chord, and extension notes to be used in the orchestration.
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
   * A function that updates the current chord being played by the audio orchestrator.
   * It is called on each animation frame and checks if the current beat has changed. If so, it retrieves the current chord from the harmony manager and triggers it on the pad synth.
   *
   * @param timestamp - The current timestamp of the animation frame.
   */
  const updateProgressionChord = (() => {
    let lastBeat = -1

    return (timestamp: number) => {
      const currentBeat = Math.floor((timestamp * currentBPM.value) / 60) % 4

      if (currentBeat !== lastBeat) {
        const currentChord = harmonyManager.getCurrentChord(timestamp)
        console.log('Beat Change:', {
          timestamp,
          currentBeat,
          lastBeat,
          currentChord,
          voiceStatus: voiceStatus.value,
        })

        if (currentChord.length > 0 && currentChord.every((note) => note)) {
          console.log('Triggering Chord:', currentChord)
          padSynth.triggerAttackRelease(currentChord, '4n')
        }
        lastBeat = currentBeat
      }
    }
  })()

  /**
   * Updates the current BPM (beats per minute) value used by the audio orchestrator.
   * This function also updates the BPM value in the `harmonyManager` instance.
   *
   * @param newBPM - The new BPM value to set.
   */
  const updateBPM = (newBPM: number) => {
    currentBPM.value = newBPM
    harmonyManager.bpm = newBPM
  }

  /**
   * Cleans up any resources used by the audio orchestrator and stops the animation frame.
   */
  cleanup()
  animationFrameId = requestAnimationFrame(animate)

  /**
   * Cleans up any resources used by the audio orchestrator and stops the animation frame.
   */
  onUnmounted(() => cleanup())

  /**
   * Starts the animation frame loop for the audio orchestrator.
   */
  requestAnimationFrame(animate)

  /**
   * Provides an interface for controlling the audio playback and harmony in the application.
   *
   * @returns {Object} An object with the following properties and methods:
   * - `startPlayback`: Starts the audio playback.
   * - `stopPlayback`: Stops the audio playback.
   * - `playPattern`: Plays a specific pattern of notes.
   * - `updateHarmony`: Updates the current key and scale used for the harmony.
   * - `currentKey`: The current key being used for the harmony.
   * - `currentScale`: The current scale being used for the harmony.
   * - `voiceStatus`: The current status of the voices in the audio playback.
   * - `currentBPM`: The current beats per minute (BPM) used for the audio playback.
   * - `updateBPM`: Updates the current BPM used for the audio playback.
   */
  return {
    startPlayback,
    stopPlayback,
    playPattern,
    updateHarmony,
    currentKey,
    currentScale,
    voiceStatus: readonly(voiceStatus),
    currentBPM,
    updateBPM,
  }
}
