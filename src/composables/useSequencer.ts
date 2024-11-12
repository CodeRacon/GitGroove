import { ref, computed, watch, type Ref } from 'vue'

export function useSequencer(bars: Ref<number>) {
  const isPlaying = ref(false)
  const currentBar = ref(0)
  const startPosition = ref(0)
  const bpm = ref(120)
  const progress = ref(0)
  const isLooping = ref(false)

  const msPerBar = computed(() => (60 / bpm.value) * 1000)

  let animationFrame: number
  let lastTimestamp: number

  const tick = (timestamp: number) => {
    if (!lastTimestamp) lastTimestamp = timestamp

    const elapsed = timestamp - lastTimestamp
    progress.value = Math.min(elapsed / msPerBar.value, 0.999)

    if (elapsed >= msPerBar.value) {
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
  }
}
