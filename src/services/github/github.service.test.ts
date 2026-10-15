import { afterEach, describe, expect, it, vi } from 'vitest'
import { GitHubService } from './github.service'

const calendar = {
  totalContributions: 3,
  weeks: [{ contributionDays: [{ date: '2024-02-29', contributionCount: 3 }] }],
  contributionYears: [2023, 2024, 2024],
}
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('yearly contribution loading', () => {
  it('sorts the year list and caches each profile/period independently for five minutes', async () => {
    let now = Date.UTC(2026, 9, 15)
    vi.spyOn(Date, 'now').mockImplementation(() => now)
    const fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => calendar })
    vi.stubGlobal('fetch', fetch)
    const service = new GitHubService()
    const result = await service.fetchUserContributions('CodeRacon', 2024)
    expect(fetch.mock.calls[0][0]).toBe('/api/contributions.php?username=CodeRacon&year=2024')
    expect(result.years).toEqual([2024, 2023])
    expect(result.calendar.weeks[0].days.find((day) => day.date === '2024-02-29')?.count).toBe(3)
    await service.fetchUserContributions('coderacon', 2024)
    expect(fetch).toHaveBeenCalledTimes(1)
    await service.fetchUserContributions('CodeRacon')
    await service.fetchUserContributions('other', 2024)
    expect(fetch).toHaveBeenCalledTimes(3)
    now += 300_001
    await service.fetchUserContributions('CodeRacon', 2024)
    expect(fetch).toHaveBeenCalledTimes(4)
  })
  it('rejects a response from the wrong year and does not cache failures', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => calendar })
    vi.stubGlobal('fetch', fetch)
    const service = new GitHubService()
    await expect(service.fetchUserContributions('CodeRacon', 2023)).rejects.toThrow(/invalid/)
    await expect(service.fetchUserContributions('CodeRacon', 2023)).rejects.toThrow(/invalid/)
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
