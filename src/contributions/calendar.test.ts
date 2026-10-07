import { describe, expect, it } from 'vitest'
import { normalizeContributionCalendar } from './calendar'

describe('normalizeContributionCalendar', () => {
  it('pads edge weeks with silent days and sorts by date', () => {
    const result = normalizeContributionCalendar({ totalContributions: 3, weeks: [
      { contributionDays: [{ date: '2026-01-06', contributionCount: 2 }] },
      { contributionDays: [{ date: '2026-01-05', contributionCount: 1 }] },
    ] })
    expect(result.weeks).toHaveLength(1)
    expect(result.weeks[0].days).toHaveLength(7)
    expect(result.weeks[0].days[0]).toMatchObject({ date: '2026-01-04', count: 0, outsideRange: true })
    expect(result.weeks[0].days[2]).toMatchObject({ date: '2026-01-06', count: 2, outsideRange: false })
  })

  it('preserves a 53 week calendar', () => {
    const days = Array.from({ length: 53 * 7 }, (_, index) => ({
      date: new Date(Date.UTC(2025, 0, 5 + index)).toISOString().slice(0, 10), contributionCount: 0,
    }))
    expect(normalizeContributionCalendar({ totalContributions: 0, weeks: [{ contributionDays: days }] }).weeks).toHaveLength(53)
  })

  it('rejects duplicate dates and malformed responses', () => {
    expect(() => normalizeContributionCalendar({ weeks: [] })).toThrow()
    expect(() => normalizeContributionCalendar({ totalContributions: 1, weeks: [
      { contributionDays: [{ date: '2026-01-05', contributionCount: 1 }, { date: '2026-01-05', contributionCount: 1 }] },
    ] })).toThrow(/doppelter/)
    expect(() => normalizeContributionCalendar({ totalContributions: 2, weeks: [
      { contributionDays: [{ date: '2026-01-05', contributionCount: 1 }, { date: '2026-01-07', contributionCount: 1 }] },
    ] })).toThrow(/Lücke/)
  })
})
