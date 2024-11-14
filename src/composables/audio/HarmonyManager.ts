import { ref } from 'vue'

export class HarmonyManager {
  private currentBeat = 0
  private _bpm = ref(120)

  private rootHistory: string[] = []
  private readonly MAX_ROOT_REPETITIONS = 4
  private readonly AVAILABLE_ROOTS = ['C', 'D', 'E', 'F', 'G', 'A']

  private getNextRoot(): string {
    const currentRepetitions = this.rootHistory.filter(
      (root) => root === this.currentKey.value,
    ).length

    if (currentRepetitions >= this.MAX_ROOT_REPETITIONS) {
      const availableRoots = this.AVAILABLE_ROOTS.filter((root) => root !== this.currentKey.value)
      return availableRoots[Math.floor(Math.random() * availableRoots.length)]
    }

    return this.currentKey.value
  }

  // Neue Properties
  private progressionHistory: string[] = []
  private readonly MAX_CHORD_REPETITIONS = 2

  private getNextProgression(currentChord: string): string {
    const repetitions = this.progressionHistory
      .slice(-2)
      .filter((chord) => chord === currentChord).length

    if (repetitions >= this.MAX_CHORD_REPETITIONS) {
      const currentProgression = this.currentProgression.value
      const availableChords = currentProgression.filter((chord) => chord !== currentChord)
      return availableChords[Math.floor(Math.random() * availableChords.length)]
    }

    return currentChord
  }

  private scales = {
    major: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    minor: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
  }

  private alignProgressionWithRoot(newRoot: string): string[] {
    const currentScale = this.scales[this.currentScale.value]
    const rootIndex = currentScale.indexOf(newRoot)

    // Wenn wir z.B. von C nach G wechseln (Dominante),
    // könnten wir bevorzugt eine V-I Progression wählen
    if (rootIndex === 4) {
      // G ist der 5. Ton (Index 4)
      return this.progressions.basic // ['I', 'IV', 'V', 'I']
    }

    // Bei Subdominante (F in C-Dur)
    if (rootIndex === 3) {
      return this.progressions.pop // ['I', 'V', 'vi', 'IV']
    }

    return this.currentProgression.value
  }

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

  private getAvailableRoots(): string[] {
    const currentScale = this.scales[this.currentScale.value]
    const primaryDegrees = [0, 3, 4] // I/i, IV/iv, V/v
    return primaryDegrees.map((degree) => currentScale[degree])
  }

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

  private progressions = {
    basic: ['I', 'IV', 'V', 'I'],
    pop: ['I', 'V', 'vi', 'IV'],
    jazz: ['ii', 'V', 'I'],
    emotional: ['vi', 'IV', 'I', 'V'],
  }

  private currentKey = ref('C')
  private currentScale = ref<'major' | 'minor'>('major')
  private currentProgression = ref(this.progressions.basic)

  get bpm() {
    return this._bpm.value
  }

  set bpm(value: number) {
    this._bpm.value = value
  }

  getCurrentChord(timestamp: number): string[] {
    this.currentBeat = Math.floor((timestamp * this._bpm.value) / 60) % 4
    console.log('HarmonyManager:', {
      timestamp,
      beat: this.currentBeat,
      bpm: this._bpm.value,
      progression: this.currentProgression.value,
    })

    const progression = this.currentProgression.value
    const progressionIndex = this.currentBeat
    const chordSymbol = progression[progressionIndex]
    const chord = this.getChordNotes(chordSymbol)

    console.log('Generated Chord:', {
      symbol: chordSymbol,
      notes: chord,
    })

    return chord
  }

  getBeatInfo() {
    return {
      currentBeat: this.currentBeat,
      totalBeats: 4,
      bpm: this._bpm.value,
    }
  }

  determineHarmony(contributionLevel: number, dayOfWeek: number) {
    this.currentScale.value = contributionLevel > 2 ? 'major' : 'minor'

    // Neue harmonische Grundtonbestimmung
    const nextRoot = this.getNextHarmonicRoot()
    this.currentKey.value = nextRoot
    this.rootHistory.push(nextRoot)

    // Progression an neuen Grundton anpassen
    this.currentProgression.value = this.alignProgressionWithRoot(nextRoot)

    // History Management
    if (this.rootHistory.length > 8) this.rootHistory.shift()

    return {
      key: this.currentKey.value,
      scale: this.currentScale.value,
      progression: this.currentProgression.value,
    }
  }

  private noteOffsets = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
  }

  private chordIntervals = {
    major: [0, 4, 7],
    minor: [0, 3, 7],
    dom7: [0, 4, 7, 10],
    min7: [0, 3, 7, 10],
    sus4: [0, 5, 7],
  }

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

  private getChordType(chordSymbol: string): keyof typeof this.chordIntervals {
    if (chordSymbol.includes('7')) return 'dom7'
    if (chordSymbol.includes('sus4')) return 'sus4'
    if (chordSymbol.toLowerCase() === chordSymbol) return 'minor'
    return 'major'
  }

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
