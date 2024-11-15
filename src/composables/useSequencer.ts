import { ref, computed, watch, type Ref } from 'vue'
import { useOrchestrator } from './audio/useOrchestrator'
import * as Tone from 'tone'

export function useSequencer(bars: Ref<number>) {
  /**
   * Reactive state and computed properties related to the sequencer functionality.
   *
   * - `isPlaying`: Indicates whether the sequencer is currently playing.
   * - `currentBar`: The current bar position in the sequence.
   * - `startPosition`: The starting bar position of the sequence.
   * - `bpm`: The beats per minute of the sequence.
   * - `progress`: The progress of the current bar, from 0 to 0.999.
   * - `isLooping`: Indicates whether the sequence is looping.
   * - `isTriggered`: Indicates whether the sequence has been triggered.
   * - `msPerBar`: The duration of each bar in milliseconds, computed from the BPM.
   */
  const orchestrator = useOrchestrator()
  const isPlaying = ref(false)
  const currentBar = ref(0)
  const startPosition = ref(0)
  const bpm = ref(120)
  const progress = ref(0)
  const isLooping = ref(false)
  const isTriggered = ref(false)
  const msPerBar = computed(() => (60 / bpm.value) * 1000)

  /**
   * `animationFrame`: The ID of the current animation frame request.
   * `lastTimestamp`: The timestamp of the last animation frame.
   */
  let animationFrame: number
  let lastTimestamp: number

  /**
   * Handles the patterns for each day in the sequence.
   *
   * This function is called for each day in the current bar of the sequence. It retrieves the level associated with the day, and then uses the orchestrator to play the corresponding bass, chords, and arpeggio patterns.
   *
   * @param days - A NodeList of the day elements in the current bar.
   * @param now - The current timestamp, used to determine the day of the week.
   */
  const handleDayPatterns = (days: NodeListOf<Element>, now: number) => {
    Array.from(days).forEach((day: Element, index: number) => {
      const level = parseInt(
        Array.from(day.classList)
          .find((c) => c.startsWith('level-'))
          ?.split('-')[1] || '0',
      )

      if (level > 0) {
        const harmony = orchestrator.updateHarmony(level, new Date().getDay())
        if (harmony && harmony.chord && harmony.chord.length > 0) {
          setTimeout(() => {
            orchestrator.playPattern('bass', level, [harmony.bass])
            orchestrator.playPattern('chords', level, harmony.chord)
            if (level > 2) {
              orchestrator.playPattern('arpeggio', level, harmony.extensions)
            }
          }, index * 50)
        }
      }
    })
  }

  /**
   * Updates the current bar position in the sequence.
   *
   * This function is called after each bar is played. It checks if the current bar is the last bar in the sequence, and if so, resets the current bar to the start position and sets the `isLooping` flag to true. Otherwise, it increments the current bar and sets the `isLooping` flag to false.
   *
   * @param timestamp - The current timestamp, used to update the `lastTimestamp` value.
   */
  const updateBarPosition = (timestamp: number) => {
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

  /**
   * The `tick` function is responsible for updating the progress of the sequencer and triggering the playback of the current bar's patterns.
   *
   * It is called in a requestAnimationFrame loop when the sequencer is playing. The function calculates the elapsed time since the last tick, updates the progress value, and checks if a full bar has elapsed. If so, it triggers the playback of the patterns for the current bar and updates the current bar position.
   *
   * @param timestamp - The current timestamp, used to calculate the elapsed time since the last tick.
   */
  const tick = (timestamp: number) => {
    if (!lastTimestamp) lastTimestamp = timestamp

    try {
      const elapsed = timestamp - lastTimestamp
      progress.value = Math.min(elapsed / msPerBar.value, 0.999)

      if (elapsed >= msPerBar.value) {
        isTriggered.value = true
        const currentWeek = currentBar.value
        const days = document.querySelectorAll(`.week:nth-child(${currentWeek + 1}) .day`)

        handleDayPatterns(days, Tone.now())
        setTimeout(() => (isTriggered.value = false), 100)
        updateBarPosition(timestamp)
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
   *
   * This function sets the `isPlaying` flag to `true`, resets the `progress` value to `0`, sets the `lastTimestamp` to the current time, sets the `currentBar` to the `startPosition`, sets `isLooping` to `false`, and starts the animation frame loop by calling `requestAnimationFrame` with the `tick` function.
   */
  const play = () => {
    isPlaying.value = true
    progress.value = 0
    lastTimestamp = performance.now()
    currentBar.value = startPosition.value
    isLooping.value = false
    animationFrame = requestAnimationFrame(tick)
  }

  /**
   * Pauses the sequencer playback.
   *
   * This function sets the `isPlaying` flag to `false` and cancels the current animation frame loop by calling `cancelAnimationFrame` with the `animationFrame` value.
   */
  const pause = () => {
    isPlaying.value = false
    cancelAnimationFrame(animationFrame)
  }

  /**
   * Stops the sequencer playback.
   *
   * This function pauses the sequencer, resets the progress to 0, sets the current bar to the start position, and sets the looping flag to false.
   */
  const stop = () => {
    pause()
    progress.value = 0
    currentBar.value = startPosition.value
    isLooping.value = false
  }

  /**
   * Sets the beats per minute (BPM) of the sequencer.
   *
   * This function takes a `newBPM` parameter of type `number` and updates the `bpm` value to be within the valid range of 30 to 300 BPM.
   *
   * @param newBPM - The new BPM value to set for the sequencer.
   */
  const setBPM = (newBPM: number) => {
    bpm.value = Math.max(30, Math.min(300, newBPM))
  }

  /**
   * Sets the start position for the sequencer playback.
   *
   * This function updates the `startPosition` and `currentBar` values to the provided `position`, resets the `progress` value to 0, sets the `lastTimestamp` to 0, and sets the `isLooping` flag to false.
   *
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
   * Stops the sequencer playback when the `bars` value changes.
   *
   * This `watch` callback is triggered whenever the `bars` value changes. It calls the `stop()` function to pause the sequencer playback and reset the progress.
   */
  watch(bars, () => {
    stop()
  })

  /**
   * Provides a set of functions and state related to a sequencer component.
   *
   * The `useSequencer` composable returns an object with various properties and methods for controlling the playback and configuration of a sequencer.
   *
   * @returns An object with the following properties and methods:
   * - `isPlaying`: A reactive ref indicating whether the sequencer is currently playing.
   * - `currentBar`: A reactive ref representing the current bar position in the sequencer.
   * - `progress`: A reactive ref representing the progress of the current bar (0-1).
   * - `bpm`: A reactive ref representing the beats per minute (BPM) of the sequencer.
   * - `isLooping`: A reactive ref indicating whether the sequencer is set to loop.
   * - `play()`: A function to start the sequencer playback.
   * - `pause()`: A function to pause the sequencer playback.
   * - `stop()`: A function to stop the sequencer playback and reset the progress.
   * - `setBPM(newBPM: number)`: A function to set the BPM of the sequencer.
   * - `setStartPosition(position: number)`: A function to set the start position for the sequencer playback.
   * - `isTriggered`: A function to check if a specific bar is currently being triggered.
   */
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
