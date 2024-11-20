import * as Tone from 'tone'
import { useSynthDefinitions } from './useSynthDefinitions'
import { useSynthState } from './useSynthState'
import { useVoiceManager } from './useVoiceManager'
import { PatternGenerator } from './PatternGenerator'
import type { Pattern } from './useOrchestrator'
import { ref } from 'vue'

/**
 * Reactive object that tracks the active state of different synth types.
 * This is used to manage the state of the audio synthesis in the application.
 */
const activeSynths = ref({
  bass: false,
  pad: false,
  lead: false,
})

export function usePatternHandler(initAudioContext: () => Promise<void>) {
  const { synthState } = useSynthState()

  const { bassEffects, bassSynth, leadEffects, leadSynth, padEffects, padSynth } =
    useSynthDefinitions()

  const { voiceStatus, updateVoiceStatus, manageVoices, cleanupVoices, MAX_VOICES } =
    useVoiceManager(padSynth)

  const patternGenerator = new PatternGenerator()

  /**
   * Executes a pattern of chords, managing the voices and triggering the pad synth.
   *
   * @param pattern - The pattern to execute, containing the notes and pattern data.
   * @param type - The type of pattern, which must be 'chords' for this function.
   * @param now - The current time, used to schedule the pattern playback.
   * @returns - Nothing, as this function is an implementation detail.
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
   * Plays a pattern of audio based on the specified type, level, and notes.
   *
   * This function is responsible for setting up the appropriate synth and effects parameters,
   * generating the pattern, and triggering the playback of the pattern.
   *
   * @param type - The type of pattern to play, which can be 'bass', 'chords', or 'arpeggio'.
   * @param level - The level or complexity of the pattern to generate.
   * @param notes - The notes to use for the pattern.
   * @returns - Nothing, as this function is an implementation detail.
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

  return {
    executePattern,
    playPattern,
    activeSynths,
  }
}
