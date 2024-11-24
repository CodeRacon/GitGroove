import { ref, computed, watch, type Ref } from 'vue'

/**
 * Defines the events that the `useSequencer` composable can emit.
 *
 * - `onTick`: Emitted on each animation frame, providing the current bar index and progress within the bar (0-1).
 * - `onBarChange`: Emitted when the current bar changes.
 * - `onLoopComplete`: Emitted when the sequencer has completed a full loop.
 */
interface SequencerEvents {
  onTick: (currentBar: number, progress: number) => void
  onBarChange: (bar: number) => void
  onLoopComplete: () => void
}

export function useSequencer(bars: Ref<number>, events: SequencerEvents) {
  const isPlaying = ref(false)
  const currentBar = ref(0)
  const startPosition = ref(0)
  const bpm = ref(90)
  const progress = ref(0)
  const isLooping = ref(false)
  const msPerBar = computed(() => (60 / bpm.value) * 1000)

  let animationFrame: number
  let lastTimestamp: number

  /**
   * Updates the current bar position based on the elapsed time since the last update.
   * If the next bar is beyond the end of the sequence, it resets the current bar to the start position and emits the `onLoopComplete` event.
   * Otherwise, it increments the current bar and resets the progress.
   *
   * @param timestamp - The current timestamp in milliseconds.
   */
  const updateBarPosition = (timestamp: number) => {
    const nextBar = currentBar.value + 1
    if (nextBar > startPosition.value + bars.value - 1) {
      isLooping.value = true
      currentBar.value = startPosition.value
      progress.value = 0
      lastTimestamp = timestamp
      events.onLoopComplete()
    } else {
      isLooping.value = false
      currentBar.value = nextBar
      lastTimestamp = timestamp
      progress.value = 0
    }
  }

  /**
   * The `tick` function is responsible for updating the current bar position and progress within the bar during the sequencer's playback.
   * It is called on each animation frame and performs the following tasks:
   * - Calculates the elapsed time since the last update.
   * - Updates the `progress` value based on the elapsed time.
   * - Emits the `onTick` event with the current bar index and progress.
   * - If the elapsed time is greater than or equal to the duration of a bar, it calls the `updateBarPosition` function to advance to the next bar.
   * - If the sequencer is playing, it schedules the next animation frame to call this `tick` function again.
   * - If an error occurs, it logs the error and calls the `stop` function to stop the sequencer.
   *
   * @param timestamp - The current timestamp in milliseconds.
   */
  const tick = (timestamp: number) => {
    if (!lastTimestamp) lastTimestamp = timestamp

    try {
      const elapsed = timestamp - lastTimestamp
      progress.value = Math.min(elapsed / msPerBar.value, 0.999)

      events.onTick(currentBar.value, progress.value)

      if (elapsed >= msPerBar.value) {
        updateBarPosition(timestamp)
        events.onBarChange(currentBar.value)
      }

      if (isPlaying.value) {
        animationFrame = requestAnimationFrame(tick)
      }
    } catch (error) {
      console.error('Sequencer tick error:', error)
      stop()
    }
  }

  /**
   * Starts the sequencer playback.
   * - Sets the `isPlaying` flag to `true`.
   * - Resets the `progress` value to `0`.
   * - Sets the `lastTimestamp` to the current time using `performance.now()`.
   * - Sets the `isLooping` flag to `false`.
   * - Schedules the first animation frame to call the `tick` function.
   */
  const play = () => {
    isPlaying.value = true
    progress.value = 0
    lastTimestamp = performance.now()
    isLooping.value = false
    animationFrame = requestAnimationFrame(tick)
  }

  /**
   * Resumes the sequencer playback.
   * - Sets the `isPlaying` flag to `true`.
   * - Calculates the `lastTimestamp` based on the current progress value to continue playback from the current position.
   * - Schedules the next animation frame to call the `tick` function.
   */
  const resume = () => {
    isPlaying.value = true
    lastTimestamp = performance.now() - progress.value * msPerBar.value
    animationFrame = requestAnimationFrame(tick)
  }

  /**
   * Pauses the sequencer playback.
   * - Sets the `isPlaying` flag to `false`.
   * - Cancels the current animation frame.
   */
  const pause = () => {
    isPlaying.value = false
    cancelAnimationFrame(animationFrame)
  }

  /**
   * Stops the sequencer playback.
   * - Pauses the playback by calling the `pause` function.
   * - Resets the `progress` value to `0`.
   * - Sets the `currentBar` value to the `startPosition` value.
   * - Sets the `isLooping` flag to `false`.
   */
  const stop = () => {
    pause()
    progress.value = 0
    currentBar.value = startPosition.value
    isLooping.value = false
  }

  /**
   * Sets the BPM (beats per minute) value for the sequencer.
   * The BPM value is clamped between 30 and 300 to ensure a valid range.
   * @param newBPM - The new BPM value to set.
   */
  const setBPM = (newBPM: number) => {
    bpm.value = Math.max(30, Math.min(300, newBPM))
  }

  /**
   * Sets the start position for the sequencer playback.
   * - Updates the `startPosition` and `currentBar` values to the provided `position`.
   * - Resets the `progress` value to `0`.
   * - Resets the `lastTimestamp` to `0`.
   * - Sets the `isLooping` flag to `false`.
   * @param position - The new start position for the sequencer playback.
   */
  const setStartPosition = (position: number) => {
    startPosition.value = position
    currentBar.value = position
    progress.value = 0
    lastTimestamp = 0
    isLooping.value = false
  }

  /**
   * Watches the `bars` reactive property and stops the sequencer playback when the `bars` value changes.
   */
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
    resume,
    pause,
    stop,
    setBPM,
    setStartPosition,
  }
}
