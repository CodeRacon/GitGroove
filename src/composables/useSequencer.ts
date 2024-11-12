import { ref, computed, watch, type Ref } from 'vue'

export function useSequencer(bars: Ref<number>) {
  const isPlaying = ref(false)
  const currentBar = ref(0)
  const startPosition = ref(0)
  const bpm = ref(120)

  const msPerBar = computed(() => (60 / bpm.value) * 1000)

  let animationFrame: number
  let lastTimestamp: number

  const progress = ref(0)

  const tick = (timestamp: number) => {
    if (!lastTimestamp) lastTimestamp = timestamp

    const elapsed = timestamp - lastTimestamp
    progress.value = elapsed / msPerBar.value

    if (elapsed >= msPerBar.value) {
      currentBar.value =
        startPosition.value + ((currentBar.value + 1 - startPosition.value) % bars.value)
      lastTimestamp = timestamp
    }

    if (isPlaying.value) {
      animationFrame = requestAnimationFrame(tick)
    }
  }

  const play = () => {
    isPlaying.value = true
    lastTimestamp = 0
    animationFrame = requestAnimationFrame(tick)
  }

  const pause = () => {
    isPlaying.value = false
    cancelAnimationFrame(animationFrame)
  }

  const stop = () => {
    pause()
    currentBar.value = startPosition.value
  }

  const setBPM = (newBPM: number) => {
    bpm.value = Math.max(30, Math.min(300, newBPM))
  }

  watch(bars, () => {
    stop()
  })

  const setStartPosition = (position: number) => {
    startPosition.value = position
    currentBar.value = position
    lastTimestamp = 0
  }

  return {
    isPlaying,
    currentBar,
    progress,
    bpm,
    play,
    pause,
    stop,
    setBPM,
    setStartPosition,
  }
}
