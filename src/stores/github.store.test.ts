import { describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useGitHubStore } from './github.store'
import { githubService } from '@/services/github/github.service'
import type { ContributionResponse } from '@/contributions/calendar'

describe('restoring frozen calendars', () => {
  it('does not let an earlier live request overwrite a restored snapshot', async () => {
    setActivePinia(createPinia())
    let finish!: (calendar: ContributionResponse) => void
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
    finish({ totalContributions: 99, weeks: [] })
    await loading
    expect(store.username).toBe('frozen')
    expect(store.contributions).toEqual(frozen)
    expect(store.loading).toBe(false)
    request.mockRestore()
  })
})
