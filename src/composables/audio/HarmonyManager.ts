import { ref } from 'vue'

export class HarmonyManager {
  /**
   * The current beat index within the current progression.
   */
  private currentBeat = 0

  /**
   * The current beats per minute (BPM) of the audio playback.
   */
  private _bpm = ref(120)

  /**
   * An array that keeps track of the history of root notes used in the progression.
   */
  private rootHistory: string[] = []

  /**
   * The maximum number of times the current root note can be repeated before a new root note is selected.
   */
  private readonly MAX_ROOT_REPETITIONS = 4

  /**
   * An object that defines the notes in the major and minor scales.
   * The major scale is defined as an array of 7 note names, starting from C.
   * The minor scale is defined as an array of 7 note names, starting from C.
   */
  private scales = {
    major: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    minor: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
  }

  /**
   * Aligns the current progression with the given root note.
   *
   * If the root note is the 5th degree of the current scale, the basic progression is returned.
   * If the root note is the 4th degree of the current scale, the pop progression is returned.
   * Otherwise, the current progression is returned.
   *
   * @param newRoot - The new root note to align the progression with.
   * @returns The aligned progression.
   */
  private alignProgressionWithRoot(newRoot: string): string[] {
    const currentScale = this.scales[this.currentScale.value]
    const rootIndex = currentScale.indexOf(newRoot)

    if (rootIndex === 4) {
      return this.progressions.basic
    }

    if (rootIndex === 3) {
      return this.progressions.pop
    }

    return this.currentProgression.value
  }

  /**
   * Retrieves the next harmonic root note to use in the progression.
   *
   * If the current root note has been repeated more than the maximum allowed repetitions,
   * a new root note is selected from the available roots, excluding the current root note.
   * Otherwise, the current root note is returned.
   *
   * @returns The next harmonic root note to use in the progression.
   */
  private getNextHarmonicRoot(): string {
    const availableRoots = this.getAvailableRoots()
    const currentRepetitions = this.rootHistory.filter(
      (root) => root === this.currentKey.value,
    ).length

    if (currentRepetitions >= this.MAX_ROOT_REPETITIONS) {
      const newRoots = availableRoots.filter((root) => root !== this.currentKey.value)
      return newRoots[Math.floor(Math.random() * newRoots.length)]
    }

    return this.currentKey.value
  }

  /**
   * Retrieves an array of available root notes based on the current scale.
   *
   * The available root notes are the 1st, 4th, and 5th degrees of the current scale.
   *
   * @returns An array of available root notes.
   */
  private getAvailableRoots(): string[] {
    const currentScale = this.scales[this.currentScale.value]
    const primaryDegrees = [0, 3, 4]
    return primaryDegrees.map((degree) => currentScale[degree])
  }

  /**
   * Defines the default note configurations for major and minor chords.
   * The `major` and `minor` properties each contain an object with the following properties:
   * - `bass`: The bass note for the chord.
   * - `chord`: An array of notes that make up the chord.
   * - `extensions`: An array of notes that extend the chord.
   */
  private defaultNotes = {
    major: {
      bass: 'C2',
      chord: ['C3', 'E3', 'G3'],
      extensions: ['C4', 'E4', 'G4'],
    },
    minor: {
      bass: 'A2',
      chord: ['A3', 'C4', 'E4'],
      extensions: ['A4', 'C4', 'E4'],
    },
  }

  /**
   * Defines the default chord progressions used in the application.
   * Each progression is represented as an array of chord symbols, where each symbol
   * corresponds to a degree of the current scale.
   */
  private progressions = {
    basic: ['I', 'IV', 'V', 'I'],
    pop: ['I', 'V', 'vi', 'IV'],
    jazz: ['ii', 'V', 'I'],
    emotional: ['vi', 'IV', 'I', 'V'],
  }

  /**
   * Manages the harmony and chord progressions used in the application.
   *
   * The `HarmonyManager` class maintains the current key, scale, and chord progression
   * used for generating musical harmony. It provides methods for retrieving the current
   * chord, beat information, and determining the appropriate harmony based on user
   * activity.
   *
   * The `currentKey`, `currentScale`, and `currentProgression` properties store the
   * current state of the harmony, which can be accessed and updated as needed.
   */
  private currentKey = ref('C')
  private currentScale = ref<'major' | 'minor'>('major')
  private currentProgression = ref(this.progressions.basic)

  /**
   * Gets the current beats per minute (BPM) value.
   * @returns {number} The current BPM value.
   */
  get bpm() {
    return this._bpm.value
  }

  /**
   * Sets the current beats per minute (BPM) value.
   *
   * @param value - The new BPM value to set.
   */
  set bpm(value: number) {
    this._bpm.value = value
  }

  /**
   * Gets the current chord based on the current beat and chord progression.
   *
   * This method retrieves the chord symbol for the current beat in the current chord progression,
   * and then uses the `getChordNotes` method to get the notes that make up the current chord.
   *
   * @param timestamp - The current timestamp, used to calculate the current beat.
   * @returns The notes that make up the current chord.
   */
  getCurrentChord(timestamp: number): string[] {
    this.currentBeat = Math.floor((timestamp * this._bpm.value) / 60) % 4
    console.log('HarmonyManager:', {
      timestamp,
      beat: this.currentBeat,
      bpm: this._bpm.value,
      progression: this.currentProgression.value,
    })

    /**
     * Gets the current chord based on the current beat and chord progression.
     *
     * This method retrieves the chord symbol for the current beat in the current chord progression,
     * and then uses the `getChordNotes` method to get the notes that make up the current chord.
     *
     * @param timestamp - The current timestamp, used to calculate the current beat.
     * @returns The notes that make up the current chord.
     */
    const progression = this.currentProgression.value
    const progressionIndex = this.currentBeat
    const chordSymbol = progression[progressionIndex]
    const chord = this.getChordNotes(chordSymbol)

    return chord
  }

  /**
   * Gets information about the current beat, including the current beat index, the total number of beats, and the current BPM.
   *
   * @returns An object containing the current beat index, the total number of beats, and the current BPM.
   */
  getBeatInfo() {
    return {
      currentBeat: this.currentBeat,
      totalBeats: 4,
      bpm: this._bpm.value,
    }
  }

  /**
   * Determines the harmony for the current context, including the key, scale, and chord progression.
   *
   * This method sets the current key, scale, and chord progression based on the provided contribution level and day of the week.
   * It also maintains a history of the root notes used, and aligns the chord progression with the current root note.
   *
   * @param contributionLevel - The current contribution level, used to determine the scale (major or minor).
   * @param dayOfWeek - The current day of the week, which may be used to influence the harmony.
   * @returns An object containing the current key, scale, and chord progression.
   */
  determineHarmony(contributionLevel: number, dayOfWeek: number) {
    this.currentScale.value = contributionLevel > 2 ? 'major' : 'minor'
    const nextRoot = this.getNextHarmonicRoot()
    this.currentKey.value = nextRoot
    this.rootHistory.push(nextRoot)
    this.currentProgression.value = this.alignProgressionWithRoot(nextRoot)
    if (this.rootHistory.length > 8) this.rootHistory.shift()
    return {
      key: this.currentKey.value,
      scale: this.currentScale.value,
      progression: this.currentProgression.value,
    }
  }

  /**
   * An object that maps scale types to the offsets of each note within that scale.
   * The `major` scale has offsets of [0, 2, 4, 5, 7, 9, 11], while the `minor` scale has offsets of [0, 2, 3, 5, 7, 8, 10].
   * These offsets are used to calculate the notes that make up a chord within a given scale.
   */
  private noteOffsets = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
  }

  /**
   * An object that maps chord types to the intervals that make up those chords.
   * The `major` chord has intervals of [0, 4, 7], the `minor` chord has intervals of [0, 3, 7],
   * the `dom7` chord has intervals of [0, 4, 7, 10], the `min7` chord has intervals of [0, 3, 7, 10],
   * and the `sus4` chord has intervals of [0, 5, 7].
   * These intervals are used to calculate the notes that make up a chord within a given scale.
   */
  private chordIntervals = {
    major: [0, 4, 7],
    minor: [0, 3, 7],
    dom7: [0, 4, 7, 10],
    min7: [0, 3, 7, 10],
    sus4: [0, 5, 7],
  }

  /**
   * Calculates the notes that make up a chord based on the current key and scale.
   *
   * @param chordSymbol - The symbol representing the chord, such as 'I', 'ii', 'V7', etc.
   * @returns An array of strings representing the notes that make up the chord, or an empty array if the chord symbol is invalid or the root note is not found in the current scale.
   */
  getChordNotes(chordSymbol: string): string[] {
    const scaleType = this.currentScale.value
    const offsets = this.noteOffsets[scaleType]
    const rootNote = this.currentKey.value
    const rootIndex = this.scales[scaleType].indexOf(rootNote)
    if (rootIndex === -1 || !chordSymbol) {
      return []
    }
    const chordType = this.getChordType(chordSymbol)
    const intervals = this.chordIntervals[chordType]
    const notes = intervals.map((interval) => {
      const offset = (rootIndex + offsets[interval % 7]) % 7
      const octave = Math.floor(interval / 7) + 4
      const note = this.scales[scaleType][offset]
      return note ? `${note}${octave}` : ''
    })
    return notes.every((note) => note !== '') ? notes : []
  }

  /**
   * Determines the chord type based on the provided chord symbol.
   *
   * @param chordSymbol - The symbol representing the chord, such as 'I', 'ii', 'V7', etc.
   * @returns The chord type, which can be 'dom7', 'sus4', 'minor', or 'major'.
   */
  private getChordType(chordSymbol: string): keyof typeof this.chordIntervals {
    if (chordSymbol.includes('7')) return 'dom7'
    if (chordSymbol.includes('sus4')) return 'sus4'
    if (chordSymbol.toLowerCase() === chordSymbol) return 'minor'
    return 'major'
  }

  /**
   * Calculates the extended harmony (bass, chord, and extensions) for a given chord progression level.
   *
   * @param level - The progression level, where level > 2 represents a major progression and level <= 2 represents a minor progression.
   * @returns An object containing the bass note, chord notes, and extension notes for the calculated extended harmony.
   */
  getExtendedHarmony(level: number) {
    const progression = level > 2 ? 'major' : 'minor'
    const chordSymbol = level > 2 ? 'I' : 'i'

    try {
      const baseChord = this.getChordNotes(chordSymbol)
      if (!baseChord || !baseChord.every((note) => note?.match(/^[A-G][b#]?\d$/))) {
        return this.defaultNotes[progression]
      }

      return {
        bass: baseChord[0].replace(/\d/, '2'),
        chord: baseChord.map((note) => note.replace(/\d/, '3')),
        extensions:
          level > 2
            ? [...baseChord.map((note) => note.replace(/\d/, '4')), baseChord[0].replace(/\d/, '5')]
            : baseChord.map((note) => note.replace(/\d/, '4')),
      }
    } catch {
      return this.defaultNotes[progression]
    }
  }
}
