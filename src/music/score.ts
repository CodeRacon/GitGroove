import type { ContributionResponse, ContributionWeek } from '@/contributions/calendar'

export const SCORE_MAPPING_VERSION = 1
export type Voice = 'bass' | 'pad' | 'lead'
export type ChordDegree = 'I' | 'IV' | 'V' | 'vi'

export interface ScoreEvent {
  readonly beat: number
  readonly duration: number
  readonly voice: Voice
  readonly notes: readonly string[]
  readonly velocity: number
  readonly week: number
  readonly day: number
}

export interface ScoreWeek {
  readonly sourceIndex: number
  readonly firstDay: string
  readonly degree: ChordDegree
  readonly days: readonly Readonly<ContributionWeek['days'][number]>[]
}

export interface Score {
  readonly mappingVersion: number
  readonly username: string
  readonly startWeek: number
  readonly weeks: readonly ScoreWeek[]
  readonly events: readonly ScoreEvent[]
  readonly totalBeats: number
}

export interface ScoreSettings {
  readonly key?: string
  readonly mode?: 'major' | 'minor'
}

const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
const DEGREE_OFFSETS: Record<ChordDegree, number> = { I: 0, IV: 5, V: 7, vi: 9 }
const PROGRESSION: readonly ChordDegree[] = ['I', 'IV', 'V', 'vi']

function note(midi: number): string {
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`
}

export function chordNotes(degree: ChordDegree, key = 'C', mode: 'major' | 'minor' = 'major'): readonly string[] {
  const keyIndex = NOTE_NAMES.indexOf(key)
  if (keyIndex < 0) throw new Error('Ungültiger Grundton.')
  const root = 60 + keyIndex + DEGREE_OFFSETS[degree]
  const minor = degree === 'vi' || (mode === 'minor' && degree === 'I')
  return Object.freeze([root, root + (minor ? 3 : 4), root + 7].map(note))
}

function hash(value: string): number {
  let result = 2166136261
  for (let i = 0; i < value.length; i++) {
    result ^= value.charCodeAt(i)
    result = Math.imul(result, 16777619)
  }
  return result >>> 0
}

export function createScore(
  calendar: ContributionResponse,
  username: string,
  startWeek = 0,
  weekCount = calendar.weeks.length,
  settings: ScoreSettings = {},
): Score {
  if (!Number.isInteger(startWeek) || !Number.isInteger(weekCount) || startWeek < 0 ||
      weekCount < 1 || startWeek + weekCount > calendar.weeks.length) {
    throw new Error('Ungültiger Wochenbereich.')
  }
  const key = settings.key ?? 'C'
  const mode = settings.mode ?? 'major'
  const weeks: ScoreWeek[] = []
  const events: ScoreEvent[] = []
  const profile = username.trim().toLowerCase()
  for (let localWeek = 0; localWeek < weekCount; localWeek++) {
    const sourceIndex = startWeek + localWeek
    const source = calendar.weeks[sourceIndex]
    if (source.days.length !== 7) throw new Error('Kalenderwoche muss sieben Tage haben.')
    const intensity = source.days.reduce((sum, day) => sum + day.count, 0)
    const degree = PROGRESSION[(sourceIndex + Math.min(3, Math.floor(intensity / 20))) % PROGRESSION.length]
    const chord = chordNotes(degree, key, mode)
    const days = Object.freeze(source.days.map((day) => Object.freeze({ ...day })))
    weeks.push(Object.freeze({ sourceIndex, firstDay: source.firstDay, degree, days }))
    for (let day = 0; day < 7; day++) {
      const contribution = source.days[day]
      if (contribution.outsideRange || contribution.level === 0) continue
      const beat = localWeek * 4 + day * (4 / 7)
      const velocity = Math.min(1, 0.55 + contribution.level * 0.1)
      const add = (voice: Voice, notes: readonly string[], duration: number, strength = velocity) => {
        events.push(Object.freeze({ beat, duration, voice, notes, velocity: strength, week: sourceIndex, day }))
      }
      add('bass', Object.freeze([note(36 + NOTE_NAMES.indexOf(key) + DEGREE_OFFSETS[degree])]), 0.45)
      if (contribution.level >= 2) {
        add('pad', Object.freeze(chord.map((tone) => tone.replace(/\d$/, '3'))), 1.4, velocity * 0.65)
      }
      if (contribution.level >= 3) {
        const seed = hash(`${profile}:${contribution.date}:${contribution.count}`)
        const order = contribution.level === 4 ? [0, 1, 2, 1] : [0, 2]
        if (seed % 2) order.reverse()
        order.forEach((chordIndex, noteIndex) => {
          events.push(Object.freeze({
            beat: beat + noteIndex * (4 / 7 / order.length),
            duration: 0.25,
            voice: 'lead' as const,
            notes: Object.freeze([chord[chordIndex].replace(/\d$/, '5')]),
            velocity: velocity * 0.8,
            week: sourceIndex,
            day,
          }))
        })
      }
    }
  }
  return Object.freeze({
    mappingVersion: SCORE_MAPPING_VERSION,
    username: profile,
    startWeek,
    weeks: Object.freeze(weeks),
    events: Object.freeze(events),
    totalBeats: weekCount * 4,
  })
}
