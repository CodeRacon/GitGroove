import { defineStore } from 'pinia'
import { githubService } from '../services/github/github.service'
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
  }),

  actions: {
    async fetchContributions(username: string) {
      const request = ++latestRequest
      this.loading = true
      this.error = null
      this.contributions = null
      this.username = ''
      try {
        const contributions = await githubService.fetchUserContributions(username)
        if (request === latestRequest) {
          this.contributions = contributions
          this.username = username.trim()
        }
      } catch (error) {
        if (request === latestRequest) {
          this.error = error instanceof GitHubServiceError ? error.message : 'Der Kalender konnte nicht geladen werden.'
        }
      } finally {
        if (request === latestRequest) this.loading = false
      }
    },
  },
})
