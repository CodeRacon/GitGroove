import { defineStore } from 'pinia'
import { githubService, type GitHubCalendar } from '../services/github/github.service'
import type { ContributionResponse } from '@/types/github.types'
import { GitHubServiceError } from '../services/github/github.service'

let latestRequest = 0

/**
 * Pinia store for managing GitHub data in the GitGroove application.
 * Provides state and actions for fetching and handling user contributions data from the GitHub API.
 */
export const useGitHubStore = defineStore('github', {
  state: () => ({
    contributions: null as ContributionResponse | null,
    loading: false,
    error: null as string | null,
    username: '',
    years: [] as number[],
    sourceYear: null as number | null,
    frozen: false,
    periodLoading: false,
    periodError: null as string | null,
  }),

  actions: {
    cancelPeriod() {
      latestRequest++
      this.periodLoading = false
      this.periodError = null
    },
    restoreCalendar(
      calendar: ContributionResponse,
      username: string,
      sourceYear: number | null = null,
    ) {
      latestRequest++
      this.contributions = calendar
      this.username = username
      this.loading = false
      this.error = null
      this.years = []
      this.sourceYear = sourceYear
      this.frozen = true
      this.periodLoading = false
      this.periodError = null
    },
    async fetchContributions(username: string) {
      const request = ++latestRequest
      this.loading = true
      this.error = null
      this.contributions = null
      this.username = ''
      this.years = []
      this.sourceYear = null
      this.frozen = false
      this.periodLoading = false
      this.periodError = null
      try {
        const result = await githubService.fetchUserContributions(username)
        if (request === latestRequest) {
          this.contributions = result.calendar
          this.years = result.years
          this.username = username.trim()
        }
      } catch (error) {
        if (request === latestRequest) {
          this.error =
            error instanceof GitHubServiceError
              ? error.message
              : 'The contribution calendar could not be loaded.'
        }
      } finally {
        if (request === latestRequest) this.loading = false
      }
    },
    async preparePeriod(year: number | null): Promise<GitHubCalendar | null> {
      if (!this.username) return null
      const request = ++latestRequest
      this.periodLoading = true
      this.periodError = null
      try {
        const result = await githubService.fetchUserContributions(this.username, year)
        return request === latestRequest ? result : null
      } catch (error) {
        if (request === latestRequest)
          this.periodError =
            error instanceof GitHubServiceError ? error.message : 'This year could not be loaded.'
        return null
      } finally {
        if (request === latestRequest) this.periodLoading = false
      }
    },
    commitPeriod(result: GitHubCalendar, year: number | null) {
      this.contributions = result.calendar
      this.years = result.years
      this.sourceYear = year
      this.frozen = false
      this.periodError = null
    },
  },
})
