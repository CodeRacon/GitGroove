import { describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useGitHubStore } from './github.store'
import { githubService } from '@/services/github/github.service'
import type { GitHubCalendar } from '@/services/github/github.service'

describe('restoring frozen calendars', () => {
  it('does not let an earlier live request overwrite a restored snapshot', async () => {
    setActivePinia(createPinia())
    let finish!: (calendar: GitHubCalendar) => void
    const request = vi.spyOn(githubService, 'fetchUserContributions').mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const store = useGitHubStore()
    const loading = store.fetchContributions('live')
    const frozen = { totalContributions: 17, weeks: [] }
    store.restoreCalendar(frozen, 'frozen')
    finish({ calendar: { totalContributions: 99, weeks: [] }, years: [2025] })
    await loading
    expect(store.username).toBe('frozen')
    expect(store.contributions).toEqual(frozen)
    expect(store.loading).toBe(false)
    request.mockRestore()
  })
})

describe('preparing contribution years', () => {
  it('preserves the active calendar while loading, discards stale responses and commits explicitly', async () => {
    setActivePinia(createPinia())
    const finishes: Array<(value: GitHubCalendar) => void> = []
    const request = vi
      .spyOn(githubService, 'fetchUserContributions')
      .mockImplementation(() => new Promise((resolve) => finishes.push(resolve)))
    const store = useGitHubStore()
    const original = { totalContributions: 17, weeks: [] }
    store.restoreCalendar(original, 'CodeRacon')
    const a = store.preparePeriod(2023)
    const b = store.preparePeriod(2024)
    expect(store.contributions).toEqual(original)
    finishes[0]({ calendar: { totalContributions: 99, weeks: [] }, years: [2023] })
    expect(await a).toBeNull()
    expect(store.periodLoading).toBe(true)
    const result = { calendar: { totalContributions: 24, weeks: [] }, years: [2024, 2023] }
    finishes[1](result)
    expect(await b).toEqual(result)
    expect(store.contributions).toEqual(original)
    store.commitPeriod(result, 2024)
    expect(store.contributions?.totalContributions).toBe(24)
    expect(store.sourceYear).toBe(2024)
    expect(store.frozen).toBe(false)
    request.mockRestore()
  })
  it('keeps the calendar and year on error and invalidates requests when a snapshot is restored', async () => {
    setActivePinia(createPinia())
    const store = useGitHubStore()
    store.restoreCalendar({ totalContributions: 17, weeks: [] }, 'CodeRacon', 2024)
    const request = vi
      .spyOn(githubService, 'fetchUserContributions')
      .mockRejectedValueOnce(new Error('offline'))
    await store.preparePeriod(2023)
    expect(store.sourceYear).toBe(2024)
    expect(store.contributions?.totalContributions).toBe(17)
    expect(store.periodError).toBeTruthy()
    let finish!: (value: GitHubCalendar) => void
    request.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const pending = store.preparePeriod(2023)
    store.restoreCalendar({ totalContributions: 42, weeks: [] }, 'snapshot', 2022)
    finish({ calendar: { totalContributions: 3, weeks: [] }, years: [2023] })
    expect(await pending).toBeNull()
    expect(store.username).toBe('snapshot')
    expect(store.sourceYear).toBe(2022)
    request.mockRestore()
  })
})
