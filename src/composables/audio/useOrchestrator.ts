import * as Tone from 'tone'
import { ref, onUnmounted, type Ref } from 'vue'
import { HarmonyManager } from './HarmonyManager'
import { useSynthState } from './useSynthState'
import type { SynthState } from './useSynthState'
import { PatternGenerator } from './PatternGenerator'
import { useVoiceManager } from './useVoiceManager'
import { useVolumeManager } from './useVolumeManager'

const volumeManager = useVolumeManager()

/**
 * Defines the effects applied to the bass synth, including a low-pass filter and volume control.
 */
const bassEffects = {
  filter: new Tone.Filter({
    frequency: 240,
    type: 'lowpass',
    rolloff: -24,
    Q: 2,
  }),
  volume: new Tone.Volume(-8),
}

/**
 * Defines a MonoSynth instance with a square wave oscillator and an envelope with specific attack, decay, sustain, and release parameters. The synth is then chained with the `bassEffects` object, which includes a low-pass filter and volume control, before being routed to the Tone.js audio destination.
 */
const bassSynth = new Tone.MonoSynth({
  oscillator: { type: 'square8' },
  envelope: { attack: 0.2, decay: 0.6, sustain: 0.8, release: 1.6 },
}).chain(bassEffects.filter, bassEffects.volume, Tone.Destination)

/**
 * Defines the effects applied to the pad synth, including a low-pass filter, reverb, chorus, and volume control.
 */
const padEffects = {
  filter: new Tone.Filter({
    frequency: 2000,
    type: 'lowpass',
  }),
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
 * Defines a PolySynth instance using the FMSynth type, with specific envelope and modulation settings. The synth is then chained with the `padEffects` object, which includes a low-pass filter, chorus, reverb, and volume control, before being routed to the Tone.js audio destination.
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
      attack: 0.4,
      decay: 0.6,
      sustain: 0.7,
      release: 2.2,
    },
    harmonicity: 1.5,
  })
  .chain(
    padEffects.filter,
    padEffects.chorus,
    padEffects.reverb,
    padEffects.volume,
    Tone.Destination,
  )

/**
 * Defines the effects applied to the lead synth, including a low-pass filter, ping-pong delay, reverb, distortion, and volume control.
 */
const leadEffects = {
  filter: new Tone.Filter({
    frequency: 600,
    type: 'lowpass',
    rolloff: -24,
    Q: 2,
  }),
  delay: new Tone.PingPongDelay({
    delayTime: '16n',
    feedback: 0.35,
    wet: 0.4,
  }),
  reverb: new Tone.Reverb({
    decay: 2.5,
    wet: 0.3,
  }),
  distortion: new Tone.Distortion(0.6),
  volume: new Tone.Volume(-18),
}

/**
 * Defines the lead synth, which uses a triangle8 oscillator and an envelope with specific attack, decay, sustain, and release parameters. The synth is then chained with various effects, including a low-pass filter, ping-pong delay, distortion, reverb, and volume control, before being routed to the final audio destination.
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
}).chain(
  leadEffects.filter,
  leadEffects.delay,
  leadEffects.distortion,
  leadEffects.reverb,
  leadEffects.volume,
  Tone.Destination,
)

/**
 * Tracks the active state of the bass, pad, and lead synths.
 */
const activeSynths = ref({
  bass: false,
  pad: false,
  lead: false,
})

/**
 * Initializes a new instance of the `PatternGenerator` class, which is responsible for generating musical patterns.
 */
const patternGenerator = new PatternGenerator()

/**
 * Represents a musical pattern, consisting of an array of numbers representing the pattern and an array of strings representing the notes.
 */
export interface Pattern {
  pattern: number[]
  notes: string[]
}

/**
 * Represents a Sequencer interface, which provides methods for controlling the playback of a musical sequence.
 *
 * @property {Ref<number>} currentBar - The current bar or position in the musical sequence.
 * @method {play} - Starts playing the musical sequence.
 * @method {pause} - Pauses the playback of the musical sequence.
 */
interface Sequencer {
  currentBar: Ref<number>
  play: () => void
  pause: () => void
}

/**
 * Represents a single day's contribution data, including the contribution level, count, and date.
 */
interface ContributionDay {
  level: number
  count: number
  date: string
}

/**
 * Represents a single week's contribution data, including an array of `ContributionDay` objects.
 */
interface ContributionWeek {
  days: ContributionDay[]
}

/**
 * Represents the contribution data for a set of weeks, where each week contains an array of contribution days.
 */
interface ContributionData {
  weeks: ContributionWeek[]
}

/**
 * Retrieves the current state of the synthesizer from the `useSynthState` composable.
 */
const { synthState } = useSynthState()

/**
 * Stores the last volume values for the bass, pad, and lead synthesizer parameters.
 */
const lastVolumes = ref({
  bass: synthState.value.synthParams.bass.volume,
  pad: synthState.value.synthParams.pad.volume,
  lead: synthState.value.synthParams.lead.volume,
})

export function useOrchestrator() {
  const { synthState, isBassParam, isPadParam, isLeadParam } = useSynthState()
  const { voiceStatus, updateVoiceStatus, manageVoices, cleanupVoices, MAX_VOICES } =
    useVoiceManager(padSynth)

  let isAudioContextInitialized = false
  let animationFrameId: number | null = null
  const currentBPM = ref(90)
  const currentKey = ref('C')
  const currentScale = ref('major')
  const playheadPosition = ref(0)
  const isPaused = ref(false)
  const contributions = ref<ContributionData | null>(null)
  const isPlaying = ref(false)
  const currentDayIndex = ref(0)
  const currentWeekIndex = ref(0)
  const startPosition = ref(0)

  /**
   * Checks if the current day is the active day being played.
   *
   * @param weekIndex - The index of the current week.
   * @param dayIndex - The index of the current day.
   * @returns `true` if the current day is the active day being played, `false` otherwise.
   */
  const isCurrentDay = (weekIndex: number, dayIndex: number): boolean => {
    return (
      isPlaying.value && weekIndex === currentWeekIndex.value && dayIndex === currentDayIndex.value
    )
  }

  /**
   * Executes a pattern of chords by triggering attack and release events on the pad synthesizer.
   *
   * @param pattern - The pattern object containing the notes and velocities to play.
   * @param type - The type of pattern being executed, which must be 'chords'.
   * @param now - The current time in the audio context.
   * @returns - Nothing, as the function is asynchronous and does not return a value.
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
   * Plays a pattern of notes based on the specified type (bass, chords, or arpeggio).
   *
   * @param type - The type of pattern to play, either 'bass', 'chords', or 'arpeggio'.
   * @param level - The level or complexity of the pattern to play.
   * @param notes - An array of note names to use in the pattern.
   * @returns - Nothing, as the function is asynchronous and does not return a value.
   */
  const playPattern = async (
    type: 'bass' | 'chords' | 'arpeggio',
    level: number,
    notes: string[],
  ) => {
    await initAudioContext()

    switch (type) {
      case 'bass':
        activeSynths.value.bass = true
        const bassParams = synthState.value.synthParams.bass
        bassEffects.filter.frequency.value = bassParams.cutoff
        bassEffects.filter.Q.value = bassParams.resonance
        bassEffects.volume.volume.value = bassParams.volume
        bassSynth.set({
          envelope: {
            attack: bassParams.attack,
            decay: bassParams.decay,
            sustain: bassParams.sustain,
            release: bassParams.release,
          },
        })
        break

      case 'chords':
        activeSynths.value.pad = true
        const padParams = synthState.value.synthParams.pad
        padEffects.filter.frequency.value = padParams.cutoff
        padEffects.reverb.wet.value = padParams.reverbMix
        padEffects.volume.volume.value = padParams.volume
        padEffects.chorus.wet.value = padParams.chorus ? 0.3 : 0
        padSynth.set({
          envelope: {
            attack: padParams.attack,
            decay: padParams.decay,
            sustain: padParams.sustain,
            release: padParams.release,
          },
          modulationEnvelope: {
            attack: padParams.modAttack,
            decay: padParams.modDecay,
            sustain: padParams.modSustain,
            release: padParams.modRelease,
          },
        })
        break

      case 'arpeggio':
        activeSynths.value.lead = true
        const leadParams = synthState.value.synthParams.lead
        leadEffects.filter.frequency.value = leadParams.cutoff
        leadEffects.delay.delayTime.value = leadParams.delayTime
        leadEffects.delay.feedback.value = leadParams.delayFeedback
        leadEffects.reverb.wet.value = leadParams.reverbMix
        leadEffects.volume.volume.value = leadParams.volume
        leadEffects.distortion.wet.value = leadParams.distortion ? 0.6 : 0
        leadSynth.set({
          envelope: {
            attack: leadParams.attack,
            decay: leadParams.decay,
            sustain: leadParams.sustain,
            release: leadParams.release,
          },
        })
        break
    }

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
   * Initializes the audio context and sets up the initial audio state.
   * This function is called to ensure the audio context is properly started and configured before any audio playback.
   * It starts the Tone.js audio context, resumes it if necessary, initializes the volume levels, and triggers a short pad synth note to confirm the audio setup.
   */
  const initAudioContext = async () => {
    if (!isAudioContextInitialized) {
      await Tone.start()
      await Tone.getContext().resume()
      initializeVolumes()
      padSynth.triggerAttackRelease(['C1'], '32n', undefined, 0)
      isAudioContextInitialized = true
    }
  }

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
   * Handles the sequencer tick event, updating the current week index and day index, and playing the patterns for the current day.
   * This function is called at each tick of the audio sequencer to synchronize the visual and audio components of the application.
   *
   * @param currentBar - The current bar index in the audio sequence.
   * @param progress - The progress within the current bar, between 0 and 1.
   */
  const handleSequencerTick = (currentBar: number, progress: number) => {
    if (!isPlaying.value) return

    currentWeekIndex.value = currentBar
    const dayIndex = Math.floor(progress * 7)

    if (dayIndex !== currentDayIndex.value) {
      currentDayIndex.value = dayIndex
      playCurrentDayPatterns(currentBar, dayIndex)
    }
  }

  /**
   * Plays the patterns for the current day in the audio sequence.
   * This function is called when the current day index changes during the audio playback.
   * It retrieves the day's contribution data, updates the harmony, and plays the corresponding bass, chords, and arpeggio patterns.
   *
   * @param weekIndex - The current week index in the audio sequence.
   * @param dayIndex - The current day index in the audio sequence.
   */
  const playCurrentDayPatterns = (weekIndex: number, dayIndex: number) => {
    if (!contributions.value?.weeks[weekIndex]?.days[dayIndex]) return

    const day = contributions.value.weeks[weekIndex].days[dayIndex]
    const harmony = updateHarmony(day.level, dayIndex)

    if (harmony && harmony.chord?.length > 0) {
      playPattern('bass', day.level, [harmony.bass])
      playPattern('chords', day.level, harmony.chord)
      if (day.level > 2) {
        playPattern('arpeggio', day.level, harmony.extensions)
      }
    }
  }

  /**
   * Sets the start position for the audio playback.
   *
   * @param position - The new start position, in number of bars.
   */
  const setStartPosition = (position: number) => {
    startPosition.value = position
  }

  /**
   * Initializes the volumes for the bass, pad, and lead effects based on the current synth state.
   * It also stores the last set volumes in the `lastVolumes` object.
   */
  const initializeVolumes = () => {
    bassEffects.volume.volume.value = synthState.value.synthParams.bass.volume
    padEffects.volume.volume.value = synthState.value.synthParams.pad.volume
    leadEffects.volume.volume.value = synthState.value.synthParams.lead.volume

    lastVolumes.value = {
      bass: synthState.value.synthParams.bass.volume,
      pad: synthState.value.synthParams.pad.volume,
      lead: synthState.value.synthParams.lead.volume,
    }
  }

  /**
   * Starts the audio playback from the specified start bar.
   *
   * @param startBar - The start bar index for the audio playback.
   * @returns {Promise<void>} - A Promise that resolves when the audio playback is initialized.
   */
  const startPlayback = async (startBar: number) => {
    await initAudioContext()

    volumeManager.setVolume('bass', synthState.value.synthParams.bass.volume, bassEffects.volume)
    volumeManager.setVolume('pad', synthState.value.synthParams.pad.volume, padEffects.volume)
    volumeManager.setVolume('lead', synthState.value.synthParams.lead.volume, leadEffects.volume)

    isPlaying.value = true
    currentWeekIndex.value = startBar
  }

  /**
   * Pauses the audio playback by setting the `isPlaying` and `synthState.isPlaying` flags to `false`,
   * setting the `isPaused` flag to `true`, fading out the volume of the bass, pad, and lead effects,
   * and storing the current playhead position in the `playheadPosition` value.
   */
  const pausePlayback = () => {
    isPlaying.value = false
    synthState.value.isPlaying = false
    isPaused.value = true

    volumeManager.fadeOut(bassEffects.volume)
    volumeManager.fadeOut(padEffects.volume)
    volumeManager.fadeOut(leadEffects.volume)

    playheadPosition.value = currentWeekIndex.value
  }

  /**
   * Resumes the audio playback by setting the `isPlaying` and `synthState.isPlaying` flags to `true`,
   * setting the `isPaused` flag to `false`, fading in the volume of the bass, pad, and lead effects,
   * and calling the `playCurrentDayPatterns` function with the current week and day indices.
   */
  const resumePlayback = () => {
    isPlaying.value = true
    synthState.value.isPlaying = true
    isPaused.value = false

    volumeManager.fadeIn('bass', bassEffects.volume)
    volumeManager.fadeIn('pad', padEffects.volume)
    volumeManager.fadeIn('lead', leadEffects.volume)

    playCurrentDayPatterns(currentWeekIndex.value, currentDayIndex.value)
  }

  /**
   * Stops the audio playback by setting the necessary flags, canceling the animation frame,
   * and releasing all active synthesizers.
   */
  const stopPlayback = () => {
    isPlaying.value = false
    synthState.value.isPlaying = false
    isPaused.value = false

    currentWeekIndex.value = startPosition.value
    currentDayIndex.value = 0

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
   * Handles the completion of the audio loop.
   * Resets the playback state and updates the harmony based on the first day of the current week.
   */
  const handleLoopComplete = () => {
    isPlaying.value = true
    currentDayIndex.value = 0

    if (contributions.value?.weeks[currentWeekIndex.value]) {
      const firstDay = contributions.value.weeks[currentWeekIndex.value].days[0]
      updateHarmony(firstDay.level, 0)
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
    setContributions: (data: ContributionData) => {
      contributions.value = data
    },
    setStartPosition,
    isCurrentDay,
    handleLoopComplete,
    handleSequencerTick,
    resumePlayback,
    pausePlayback,
    startPlayback,
    stopPlayback,
    playPattern,
    activeSynths,
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
