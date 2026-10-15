import { normalizeContributionCalendar, type ContributionResponse } from '@/contributions/calendar'

export class GitHubServiceError extends Error {
  constructor(
    public readonly kind:
      | 'invalid-user'
      | 'not-found'
      | 'auth'
      | 'rate-limit'
      | 'network'
      | 'invalid-response',
    message: string,
  ) {
    super(message)
    this.name = 'GitHubServiceError'
  }
}

export interface GitHubCalendar {
  calendar: ContributionResponse
  years: number[]
}

export class GitHubService {
  private cache = new Map<string, { expires: number; value: GitHubCalendar }>()
  async fetchUserContributions(
    username: string,
    year: number | null = null,
  ): Promise<GitHubCalendar> {
    const login = username.trim()
    if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(login)) {
      throw new GitHubServiceError('invalid-user', 'Enter a valid GitHub username.')
    }
    const currentYear = new Date().getUTCFullYear()
    if (year !== null && (!Number.isInteger(year) || year < 1 || year > currentYear))
      throw new GitHubServiceError('invalid-response', 'Choose a valid contribution year.')
    const key = `${login.toLowerCase()}:${year ?? 'rolling'}`
    const cached = this.cache.get(key)
    if (cached && cached.expires > Date.now()) return cached.value
    let response: Response
    try {
      response = await fetch(
        `/api/contributions.php?username=${encodeURIComponent(login)}${year === null ? '' : `&year=${String(year).padStart(4, '0')}`}`,
        {
          headers: { Accept: 'application/json' },
        },
      )
    } catch {
      throw new GitHubServiceError('network', 'GitHub is currently unavailable.')
    }
    if (response.status === 404)
      throw new GitHubServiceError('not-found', 'GitHub profile not found.')
    if (response.status === 401 || response.status === 403)
      throw new GitHubServiceError('auth', 'GitHub access is currently unavailable.')
    if (response.status === 429)
      throw new GitHubServiceError('rate-limit', 'Too many requests. Please try again later.')
    if (!response.ok) throw new GitHubServiceError('network', 'GitHub is currently unavailable.')
    try {
      const body: unknown = await response.json()
      const calendar = normalizeContributionCalendar(body)
      const rawYears = (body as Record<string, unknown>).contributionYears ?? []
      if (
        !Array.isArray(rawYears) ||
        rawYears.some((value) => !Number.isInteger(value) || value < 1 || value > currentYear)
      )
        throw new Error('Invalid contribution years.')
      if (
        year !== null &&
        calendar.weeks
          .flatMap((week) => week.days)
          .some((day) => !day.outsideRange && Number(day.date.slice(0, 4)) !== year)
      )
        throw new Error('Unexpected contribution period.')
      const value = { calendar, years: [...new Set(rawYears as number[])].sort((a, b) => b - a) }
      // Reuse responses in page memory only; the production server does not persist calendars.
      if (this.cache.size >= 40) this.cache.delete(this.cache.keys().next().value!)
      this.cache.set(key, { expires: Date.now() + 300_000, value })
      return value
    } catch {
      throw new GitHubServiceError('invalid-response', 'GitHub returned invalid contribution data.')
    }
  }
}

export const githubService = new GitHubService()
