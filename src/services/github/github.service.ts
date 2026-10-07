import { normalizeContributionCalendar, type ContributionResponse } from '@/contributions/calendar'

export class GitHubServiceError extends Error {
  constructor(
    public readonly kind: 'invalid-user' | 'not-found' | 'auth' | 'rate-limit' | 'network' | 'invalid-response',
    message: string,
  ) {
    super(message)
    this.name = 'GitHubServiceError'
  }
}

export class GitHubService {
  async fetchUserContributions(username: string): Promise<ContributionResponse> {
    const login = username.trim()
    if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(login)) {
      throw new GitHubServiceError('invalid-user', 'Enter a valid GitHub username.')
    }
    let response: Response
    try {
      response = await fetch(`/api/contributions.php?username=${encodeURIComponent(login)}`, {
        headers: { Accept: 'application/json' },
      })
    } catch {
      throw new GitHubServiceError('network', 'GitHub is currently unavailable.')
    }
    if (response.status === 404) throw new GitHubServiceError('not-found', 'GitHub profile not found.')
    if (response.status === 401 || response.status === 403) throw new GitHubServiceError('auth', 'GitHub access is currently unavailable.')
    if (response.status === 429) throw new GitHubServiceError('rate-limit', 'Too many requests. Please try again later.')
    if (!response.ok) throw new GitHubServiceError('network', 'GitHub is currently unavailable.')
    try {
      const body: unknown = await response.json()
      return normalizeContributionCalendar(body)
    } catch {
      throw new GitHubServiceError('invalid-response', 'GitHub returned invalid contribution data.')
    }
  }
}

export const githubService = new GitHubService()
