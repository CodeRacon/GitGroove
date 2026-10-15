import { describe, expect, it } from 'vitest'
import { normalizeContributionCalendar } from '@/contributions/calendar'
import { chordNotes, createScore } from './score'

const calendar = normalizeContributionCalendar({
  totalContributions: 3,
  weeks: [
    {
      contributionDays: [
        { date: '2026-01-04', contributionCount: 0 },
        { date: '2026-01-05', contributionCount: 2 },
        { date: '2026-01-06', contributionCount: 8 },
        { date: '2026-01-07', contributionCount: 21 },
      ],
    },
  ],
})

describe('createScore', () => {
  it('generates the same events for the same snapshot', () => {
    expect(createScore(calendar, 'CodeRacon')).toEqual(createScore(calendar, 'coderacon'))
    const mutableCalendar = structuredClone(calendar)
    const score = createScore(mutableCalendar, 'CodeRacon')
    mutableCalendar.weeks[0].days[1].count = 99
    expect(score.weeks[0].days[1].count).toBe(2)
  })

  it('uses seven equal steps in a four-beat week and skips silent days', () => {
    const score = createScore(calendar, 'coderacon')
    expect(score.totalBeats).toBe(4)
    expect(score.events.some((event) => event.day === 0)).toBe(false)
    expect(score.events.find((event) => event.day === 1)?.beat).toBeCloseTo(4 / 7)
    expect(score.events.find((event) => event.day === 3)?.beat).toBeCloseTo(12 / 7)
    expect(score.events.some((event) => event.day > 3)).toBe(false)
  })

  it('resolves different chord degrees', () => {
    expect(chordNotes('I')).not.toEqual(chordNotes('IV'))
    expect(chordNotes('IV')).not.toEqual(chordNotes('V'))
  })

  it('preserves the existing C-major voicings in the default sound', () => {
    const score = createScore(calendar, 'coderacon')
    expect(score.events.find((event) => event.voice === 'pad')?.notes).toEqual(['F3', 'A3', 'C3'])
    expect(
      score.events
        .filter((event) => event.voice === 'lead')
        .every((event) => event.notes[0].endsWith('5')),
    ).toBe(true)
  })

  it('transposes all voices with the root key and keeps their relative registers across octave boundaries', () => {
    const c = createScore(calendar, 'coderacon', 0, 1, { key: 'C' })
    const b = createScore(calendar, 'coderacon', 0, 1, { key: 'B' })
    const midi = (tone: string) => {
      const names = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
      const parts = /^([A-G](?:#|b)?)(\d+)$/.exec(tone)!
      return (Number(parts[2]) + 1) * 12 + names.indexOf(parts[1])
    }
    expect(b.events).toHaveLength(c.events.length)
    b.events.forEach((event, index) => {
      expect(event.beat).toBe(c.events[index].beat)
      event.notes.forEach((tone, noteIndex) =>
        expect(midi(tone) - midi(c.events[index].notes[noteIndex])).toBe(11),
      )
    })
    const shifted = createScore(calendar, 'coderacon', 0, 1, { octaves: { bass: -1, lead: 1 } })
    shifted.events.forEach((event, index) => {
      const shift = event.voice === 'bass' ? -12 : event.voice === 'lead' ? 12 : 0
      event.notes.forEach((tone, noteIndex) =>
        expect(midi(tone) - midi(c.events[index].notes[noteIndex])).toBe(shift),
      )
    })
  })
})

describe('arpeggio patterns', () => {
  const active = normalizeContributionCalendar({
    totalContributions: 100,
    weeks: [
      {
        contributionDays: Array.from({ length: 7 }, (_, i) => ({
          date: `2026-01-${String(4 + i).padStart(2, '0')}`,
          contributionCount: i === 2 ? 0 : 20,
        })),
      },
    ],
  })
  // Week intensity chooses vi: A minor.
  it.each([
    ['up', ['A2', 'C3', 'E3', 'A2', 'C3', 'E3']],
    ['down', ['E3', 'C3', 'A2', 'E3', 'C3', 'A2']],
    ['up-down', ['A2', 'C3', 'E3', 'C3', 'A2', 'C3']],
  ] as const)(
    'plays %s across active bass days, preserving silence, rhythm and pad',
    (pattern, expected) => {
      const original = createScore(active, 'CodeRacon')
      const changed = createScore(active, 'CodeRacon', 0, 1, { patterns: { bass: pattern } })
      expect(
        changed.events.filter((event) => event.voice === 'bass').map((event) => event.notes[0]),
      ).toEqual(expected)
      expect(
        changed.events.map(({ notes: _notes, ...event }) => ({
          ...event,
          noteCount: _notes.length,
        })),
      ).toEqual(
        original.events.map(({ notes: _notes, ...event }) => ({
          ...event,
          noteCount: _notes.length,
        })),
      )
      expect(changed.events.filter((event) => event.voice !== 'bass')).toEqual(
        original.events.filter((event) => event.voice !== 'bass'),
      )
      expect(changed.events.some((event) => event.day === 2)).toBe(false)
    },
  )
  it('uses ascending lead chord voicings and independent patterns with key/octave transposition', () => {
    const original = createScore(active, 'CodeRacon')
    const changed = createScore(active, 'CodeRacon', 0, 1, { patterns: { lead: 'up' } })
    expect(
      changed.events
        .filter((event) => event.voice === 'lead')
        .slice(0, 6)
        .map((event) => event.notes[0]),
    ).toEqual(['A5', 'C6', 'E6', 'A5', 'C6', 'E6'])
    expect(changed.events.filter((event) => event.voice !== 'lead')).toEqual(
      original.events.filter((event) => event.voice !== 'lead'),
    )
    const shifted = createScore(active, 'CodeRacon', 0, 1, {
      key: 'D',
      octaves: { lead: -1 },
      patterns: { lead: 'up' },
    })
    expect(
      shifted.events
        .filter((event) => event.voice === 'lead')
        .slice(0, 3)
        .map((event) => event.notes[0]),
    ).toEqual(['B4', 'D5', 'F#5'])
    expect(
      createScore(active, 'CodeRacon', 0, 1, { patterns: { bass: 'original', lead: 'original' } }),
    ).toEqual(original)
  })
})
