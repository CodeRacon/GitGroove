import { defineStore } from 'pinia'
import { githubService } from '../services/github/github.service'
import type { ContributionResponse } from '@/types/github.types'

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
      this.loading = true
      this.error = null
      try {
        this.contributions = await githubService.fetchUserContributions(username)
        this.username = username
      } catch (error) {
        this.error = 'Fehler beim Laden der GitHub Daten'
        console.error(error)
      } finally {
        this.loading = false
      }
    },
  },
})
