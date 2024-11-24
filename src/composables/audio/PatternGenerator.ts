interface Pattern {
  pattern: number[]
  notes: string[]
}

export class PatternGenerator {
  /**
   * Defines rhythm patterns for bass and chords at different levels of complexity.
   * The patterns are represented as arrays of numbers, where each number represents
   * the velocity of a note.
   *
   * The `bass` and `chords` properties each contain patterns for their respective
   * instrument types, with different levels of complexity represented by the `level#`
   * properties.
   */
  private rhythmPatterns = {
    bass: {
      level0: [0],
      level1: [0.8],
      level2: [0.85],
      level3: [0.9],
      level4: [1.0],
    },

    chords: {
      level0: [0],
      level1: [1, 0, 0.7, 0],
      level2: [1, 0, 0.7, 0],
      level3: [0.9, 0, 0.7, 0, 0.8, 0, 0.7, 0],
      level4: [1, 0.6, 0.8, 0.5, 0.9, 0.6, 0.7, 0.8],
    },
  }

  /**
   * Defines arpeggio patterns for different levels of complexity.
   * The patterns are represented as functions that take an array of notes and return a new array of notes.
   * The `level2` pattern simply returns the input notes.
   * The `level3` pattern returns the input notes with the middle notes reversed.
   * The `level4` pattern returns a specific sequence of the input notes.
   */
  private arpeggioPatterns = {
    level2: (notes: string[]) => notes,
    level3: (notes: string[]) => {
      return [...notes, ...notes.slice(1, -1).reverse()]
    },
    level4: (notes: string[]) => {
      const pattern = [...notes]
      return [
        pattern[0],
        pattern[1],
        pattern[0],
        pattern[2],
        pattern[1],
        pattern[2],
        pattern[1],
        pattern[0],
      ]
    },
  }

  /**
   * Generates a pattern based on the provided type and level.f
   *
   * If the type is 'arpeggio' and the level is greater than 1, it uses the corresponding arpeggio pattern function to transform the input notes.
   * If the type is 'bass' or 'chords', it retrieves the rhythm pattern for the given level and returns an object with the pattern and the input notes.
   * If the type is neither 'arpeggio' nor 'bass' or 'chords', it simply returns the input notes.
   *
   * @param type - The type of pattern to generate ('bass', 'chords', or 'arpeggio').
   * @param level - The complexity level of the pattern (0-4).
   * @param notes - The notes to use for the pattern.
   * @returns The generated pattern or the input notes if the type is not recognized.
   */
  generatePattern(
    type: 'bass' | 'chords' | 'arpeggio',
    level: number,
    notes: string[],
  ): Pattern | string[] {
    if (type === 'arpeggio' && level > 1) {
      const patternFunc =
        this.arpeggioPatterns[`level${level}` as keyof typeof this.arpeggioPatterns] ||
        this.arpeggioPatterns.level2
      return patternFunc(notes)
    }

    if (type === 'bass' || type === 'chords') {
      const patterns = this.rhythmPatterns[type]
      const pattern = patterns[`level${level}` as keyof typeof patterns] || patterns.level1

      return {
        pattern,
        notes,
      }
    }
    return notes
  }
}
