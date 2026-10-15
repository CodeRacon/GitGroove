import { describe, expect, it } from 'vitest'
import { contributionQuery, contributionRequest } from './github-query'

const now = new Date('2026-10-15T12:34:56Z')
describe('GitHub contribution query', () => {
  it('keeps the rolling year and requests the available history', () => {
    const request = contributionRequest(new URLSearchParams('username=CodeRacon'), now)
    expect(request.variables).toEqual({ username: 'CodeRacon' })
    expect(request.cacheKey).toBe('coderacon:rolling')
    expect(contributionQuery).toContain('contributionYears')
  })
  it('uses UTC calendar boundaries including the whole leap year and caps this year at now', () => {
    const past = contributionRequest(new URLSearchParams('username=CodeRacon&year=2024'), now)
    expect(past.variables).toEqual({
      username: 'CodeRacon',
      from: '2024-01-01T00:00:00Z',
      to: '2024-12-31T23:59:59Z',
    })
    expect(past.cacheKey).toBe('coderacon:2024')
    const current = contributionRequest(new URLSearchParams('username=CodeRacon&year=2026'), now)
    expect(current.variables.to).toBe(now.toISOString())
  })
  it.each(['2027', '2024.5', '', '0', '0000', '2024&year=2025', 'oops'])(
    'rejects invalid year %s',
    (year) => {
      expect(() =>
        contributionRequest(new URLSearchParams(`username=CodeRacon&year=${year}`), now),
      ).toThrow(/year/)
    },
  )
})
