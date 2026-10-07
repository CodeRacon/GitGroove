import { describe, expect, it } from 'vitest'
import { normalizeContributionCalendar } from '@/contributions/calendar'
import { chordNotes, createScore } from './score'

const calendar = normalizeContributionCalendar({ totalContributions: 3, weeks: [
  { contributionDays: [
    { date: '2026-01-04', contributionCount: 0 },
    { date: '2026-01-05', contributionCount: 2 },
    { date: '2026-01-06', contributionCount: 8 },
    { date: '2026-01-07', contributionCount: 21 },
  ] },
] })

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
})
