interface Pattern {
  pattern: number[]
  notes: string[]
}

export class PatternGenerator {
  private rhythmPatterns = {
    bass: {
      level0: [0], // Stille
      level1: [1, 0, 0, 0], // Grundschlag
      level2: [1, 0, 0.7, 0], // Betonung auf 1 und 3
      level3: [1, 0.6, 0.8, 0.6], // Walking Bass
      level4: [1, 0.7, 0.9, 0.8, 0.6, 0.8, 0.7, 0.9], // Komplexer Groove
    },
    chords: {
      level0: [0], // Stille
      // level1: [1], // Ganze Note
      level1: [1, 0, 0.7, 0], // Halbe Noten
      level2: [1, 0, 0.7, 0], // Halbe Noten
      level3: [0.9, 0, 0.7, 0, 0.8, 0, 0.7, 0], // Synkopiert
      level4: [1, 0.6, 0.8, 0.5, 0.9, 0.6, 0.7, 0.8], // Rhythmisch komplex
    },
  }

  private arpeggioPatterns = {
    level2: (notes: string[]) => notes, // Aufwärts
    level3: (notes: string[]) => {
      // Auf-Ab Pattern
      return [...notes, ...notes.slice(1, -1).reverse()]
    },
    level4: (notes: string[]) => {
      // Komplexes Pattern mit Wiederholungen
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

    // Default case for 'arpeggio' with level <= 1
    return notes
  }
}
