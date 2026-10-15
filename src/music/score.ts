import type { ContributionResponse, ContributionWeek } from '@/contributions/calendar'
import {
  ROOT_KEYS,
  type RootKey,
  type Octave,
  ARPEGGIO_PATTERNS,
  type ArpeggioPattern,
} from '@/studio/state'

export const SCORE_MAPPING_VERSION = 3
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
  readonly patterns?: Partial<Record<'bass' | 'lead', ArpeggioPattern>>
  readonly key?: RootKey
  readonly mode?: 'major' | 'minor'
  readonly octaves?: Partial<Record<Voice, Octave>>
}

const PATTERN_ORDER = { up: [0, 1, 2], down: [2, 1, 0], 'up-down': [0, 1, 2, 1] } as const
const NOTE_NAMES = ROOT_KEYS
const DEGREE_OFFSETS: Record<ChordDegree, number> = { I: 0, IV: 5, V: 7, vi: 9 }
const PROGRESSION: readonly ChordDegree[] = ['I', 'IV', 'V', 'vi']

function note(midi: number): string {
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`
}

export function chordNotes(
  degree: ChordDegree,
  key = 'C',
  mode: 'major' | 'minor' = 'major',
): readonly string[] {
  const keyIndex = NOTE_NAMES.indexOf(key as RootKey)
  if (keyIndex < 0) throw new Error('Invalid root note.')
  const root = 60 + keyIndex + DEGREE_OFFSETS[degree]
  const minor = degree === 'vi' || (mode === 'minor' && degree === 'I')
  return Object.freeze([root, root + (minor ? 3 : 4), root + 7].map(note))
}

function transpose(tone: string, semitones: number): string {
  const parts = /^([A-G](?:#|b)?)(-?\d+)$/.exec(tone)
  if (!parts) throw new Error('Invalid note.')
  return note((Number(parts[2]) + 1) * 12 + NOTE_NAMES.indexOf(parts[1] as RootKey) + semitones)
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
  if (
    !Number.isInteger(startWeek) ||
    !Number.isInteger(weekCount) ||
    startWeek < 0 ||
    weekCount < 1 ||
    startWeek + weekCount > calendar.weeks.length
  ) {
    throw new Error('Invalid week range.')
  }
  const key = settings.key ?? 'C'
  const mode = settings.mode ?? 'major'
  const keyIndex = NOTE_NAMES.indexOf(key)
  if (keyIndex < 0) throw new Error('Invalid root note.')
  const octaves = {
    bass: settings.octaves?.bass ?? 0,
    pad: settings.octaves?.pad ?? 0,
    lead: settings.octaves?.lead ?? 0,
  }
  if (Object.values(octaves).some((octave) => !Number.isInteger(octave) || Math.abs(octave) > 1))
    throw new Error('Invalid octave setting.')
  const patterns = {
    bass: settings.patterns?.bass ?? 'original',
    lead: settings.patterns?.lead ?? 'original',
  }
  if (Object.values(patterns).some((pattern) => !ARPEGGIO_PATTERNS.includes(pattern)))
    throw new Error('Invalid arpeggio pattern.')
  const weeks: ScoreWeek[] = []
  const events: ScoreEvent[] = []
  const profile = username.trim().toLowerCase()
  for (let localWeek = 0; localWeek < weekCount; localWeek++) {
    const sourceIndex = startWeek + localWeek
    const source = calendar.weeks[sourceIndex]
    if (source.days.length !== 7) throw new Error('A calendar week must contain seven days.')
    const intensity = source.days.reduce((sum, day) => sum + day.count, 0)
    const degree =
      PROGRESSION[(sourceIndex + Math.min(3, Math.floor(intensity / 20))) % PROGRESSION.length]
    const chord = chordNotes(degree, 'C', mode)
    // Walk across active notes within each source week, independent of the selected loop range.
    const cursor = { bass: 0, lead: 0 }
    const patternNote = (voice: 'bass' | 'lead'): string => {
      const pattern = patterns[voice]
      if (pattern === 'original') throw new Error('Original uses the legacy voicing.')
      const order = PATTERN_ORDER[pattern]
      const index = order[cursor[voice]++ % order.length]
      const root = (voice === 'bass' ? 36 : 72) + keyIndex + DEGREE_OFFSETS[degree]
      const minor = degree === 'vi' || (mode === 'minor' && degree === 'I')
      return note(root + [0, minor ? 3 : 4, 7][index] + octaves[voice] * 12)
    }
    const days = Object.freeze(source.days.map((day) => Object.freeze({ ...day })))
    weeks.push(Object.freeze({ sourceIndex, firstDay: source.firstDay, degree, days }))
    for (let day = 0; day < 7; day++) {
      const contribution = source.days[day]
      if (contribution.outsideRange || contribution.level === 0) continue
      const beat = localWeek * 4 + day * (4 / 7)
      const velocity = Math.min(1, 0.55 + contribution.level * 0.1)
      const add = (
        voice: Voice,
        notes: readonly string[],
        duration: number,
        strength = velocity,
      ) => {
        events.push(
          Object.freeze({
            beat,
            duration,
            voice,
            notes,
            velocity: strength,
            week: sourceIndex,
            day,
          }),
        )
      }
      add(
        'bass',
        Object.freeze([
          patterns.bass === 'original'
            ? note(36 + keyIndex + DEGREE_OFFSETS[degree] + octaves.bass * 12)
            : patternNote('bass'),
        ]),
        0.45,
      )
      if (contribution.level >= 2) {
        add(
          'pad',
          Object.freeze(
            chord.map((tone) => transpose(tone.replace(/\d$/, '3'), keyIndex + octaves.pad * 12)),
          ),
          1.4,
          velocity * 0.65,
        )
      }
      if (contribution.level >= 3) {
        const seed = hash(`${profile}:${contribution.date}:${contribution.count}`)
        const order = contribution.level === 4 ? [0, 1, 2, 1] : [0, 2]
        if (seed % 2) order.reverse()
        order.forEach((chordIndex, noteIndex) => {
          events.push(
            Object.freeze({
              beat: beat + noteIndex * (4 / 7 / order.length),
              duration: 0.25,
              voice: 'lead' as const,
              notes: Object.freeze([
                patterns.lead === 'original'
                  ? transpose(chord[chordIndex].replace(/\d$/, '5'), keyIndex + octaves.lead * 12)
                  : patternNote('lead'),
              ]),
              velocity: velocity * 0.8,
              week: sourceIndex,
              day,
            }),
          )
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
