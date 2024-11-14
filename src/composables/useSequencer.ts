import { ref, computed, watch, type Ref } from 'vue'
import { useOrchestrator } from './audio/useOrchestrator'
import * as Tone from 'tone'

export function useSequencer(bars: Ref<number>) {
  const orchestrator = useOrchestrator()
  const isPlaying = ref(false)
  const currentBar = ref(0)
  const startPosition = ref(0)
  const bpm = ref(120)
  const progress = ref(0)
  const isLooping = ref(false)
  const isTriggered = ref(false)

  const msPerBar = computed(() => (60 / bpm.value) * 1000)

  let animationFrame: number
  let lastTimestamp: number

  // Hier kommt unsere neue tick-Funktion

  const tick = (timestamp: number) => {
    if (!lastTimestamp) lastTimestamp = timestamp

    try {
      const elapsed = timestamp - lastTimestamp
      progress.value = Math.min(elapsed / msPerBar.value, 0.999)

      if (elapsed >= msPerBar.value) {
        const now = Tone.now()
        isTriggered.value = true
        const currentWeek = currentBar.value
        const days = document.querySelectorAll(`.week:nth-child(${currentWeek + 1}) .day`)

        Array.from(days).forEach((day: Element, index: number) => {
          const level = parseInt(
            Array.from(day.classList)
              .find((c) => c.startsWith('level-'))
              ?.split('-')[1] || '0',
          )

          if (level > 0) {
            const timeOffset = now + index * 0.05 // Strikt aufsteigendes Timing
            const harmony = orchestrator.updateHarmony(level, new Date().getDay())
            if (harmony && harmony.chord && harmony.chord.length > 0) {
              setTimeout(() => {
                orchestrator.playPattern('bass', level, [harmony.bass])
                orchestrator.playPattern('chords', level, harmony.chord)
                if (level > 2) {
                  orchestrator.playPattern('arpeggio', level, harmony.extensions)
                }
              }, index * 50) // 50ms Verzögerung zwischen den Tagen
            }
          }
        })

        setTimeout(() => (isTriggered.value = false), 100)

        const nextBar = currentBar.value + 1
        if (nextBar > startPosition.value + bars.value - 1) {
          isLooping.value = true
          currentBar.value = startPosition.value
          progress.value = 0
          lastTimestamp = timestamp
        } else {
          isLooping.value = false
          currentBar.value = nextBar
          lastTimestamp = timestamp
          progress.value = 0
        }
      }

      if (isPlaying.value) {
        animationFrame = requestAnimationFrame(tick)
      }
    } catch (error) {
      console.error('Sequencer tick error:', error)
      stop()
    }
  }

  const play = () => {
    isPlaying.value = true
    progress.value = 0
    lastTimestamp = performance.now()
    currentBar.value = startPosition.value
    isLooping.value = false
    animationFrame = requestAnimationFrame(tick)
  }

  const pause = () => {
    isPlaying.value = false
    cancelAnimationFrame(animationFrame)
  }

  const stop = () => {
    pause()
    progress.value = 0
    currentBar.value = startPosition.value
    isLooping.value = false
  }

  const setBPM = (newBPM: number) => {
    bpm.value = Math.max(30, Math.min(300, newBPM))
  }

  const setStartPosition = (position: number) => {
    startPosition.value = position
    currentBar.value = position
    progress.value = 0
    lastTimestamp = 0
    isLooping.value = false
  }

  watch(bars, () => {
    stop()
  })

  return {
    isPlaying,
    currentBar,
    progress,
    bpm,
    isLooping,
    play,
    pause,
    stop,
    setBPM,
    setStartPosition,
    isTriggered,
  }
}
