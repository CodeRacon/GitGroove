import * as Tone from 'tone'
import { ref, readonly, onUnmounted } from 'vue'
import { HarmonyManager } from './HarmonyManager'
import { PatternGenerator } from './PatternGenerator'

interface Pattern {
  pattern: number[]
  notes: string[]
}

export function useOrchestrator() {
  let isAudioContextInitialized = false

  const isPlaying = ref(false)

  const animate = () => {
    if (!isPlaying.value) return

    const now = Tone.now()
    updateProgressionChord(now)
    animationFrameId = requestAnimationFrame(animate)
  }

  const startPlayback = () => {
    isPlaying.value = true
    animate()
  }

  const stopPlayback = () => {
    isPlaying.value = false
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
    padSynth.releaseAll()
  }

  const initAudioContext = async () => {
    if (!isAudioContextInitialized) {
      await Tone.start()
      await Tone.getContext().resume()
      padSynth.triggerAttackRelease(['C1'], '32n', undefined, 0)
      isAudioContextInitialized = true
    }
  }

  let animationFrameId: number | null = null

  const cleanup = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      padSynth.releaseAll()
    }
  }

  const voiceStatus = ref({
    active: 0,
    pending: 0,
    lastCleanup: 0,
  })
  const MAX_VOICES = 4
  const currentBPM = ref(120)

  const manageVoices = async () => {
    const now = Tone.now()
    if (now - voiceStatus.value.lastCleanup > 1) {
      await cleanupVoices()
      voiceStatus.value.lastCleanup = now
    }
    return voiceStatus.value.active < MAX_VOICES
  }

  const bassEffects = {
    filter: new Tone.Filter({
      frequency: 200,
      type: 'lowpass',
      rolloff: -24,
    }),
    volume: new Tone.Volume(-28),
  }

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

  const bassSynth = new Tone.MonoSynth({
    oscillator: { type: 'square8' },
    envelope: { attack: 0.8, decay: 1.2, sustain: 0.2, release: 1.6 },
  }).chain(bassEffects.filter, bassEffects.volume, Tone.Destination)

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

  const harmonyManager = new HarmonyManager()
  const patternGenerator = new PatternGenerator()

  const updateVoiceStatus = (delta: number) => {
    voiceStatus.value.active = Math.max(0, voiceStatus.value.active + delta)
  }

  const cleanupVoices = async () => {
    padSynth.releaseAll()
    voiceStatus.value.active = 0
    voiceStatus.value.pending = 0
    return new Promise((resolve) => setTimeout(resolve, 100))
  }

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

  const currentKey = ref('C')
  const currentScale = ref('major')

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
    currentKey,
    currentScale,
    voiceStatus: readonly(voiceStatus),
    currentBPM,
    updateBPM,
  }
}
