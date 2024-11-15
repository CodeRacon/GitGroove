export class GitHubService {
  /**
   * The GitHub API token used for authentication.
   */
  private readonly token = import.meta.env.VITE_GITHUB_TOKEN

  /**
   * The base URL for the GitHub GraphQL API.
   */
  private readonly baseUrl = 'https://api.github.com/graphql'

  /**
   * Fetches the GitHub contribution calendar data for the specified user.
   *
   * @param username - The GitHub username to fetch contributions for.
   * @returns An object containing the total contributions and a weekly breakdown of contribution counts and levels.
   */
  async fetchUserContributions(username: string) {
    const query = `
      query($username: String!) {
        user(login: $username) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                }
              }
            }
          }
        }
      }
    `

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { username },
      }),
    })

    const data = await response.json()
    return this.transformContributions(data)
  }

  /**
   * Transforms the GitHub contribution calendar data into a more structured format.
   *
   * @param data - The raw data returned from the GitHub GraphQL API.
   * @returns An object containing the total contributions and a weekly breakdown of contribution counts and levels.
   */
  private transformContributions(data: any) {
    const calendar = data.data.user.contributionsCollection.contributionCalendar

    return {
      totalContributions: calendar.totalContributions,
      weeks: calendar.weeks.map((week: any) => ({
        days: week.contributionDays.map((day: any) => ({
          date: day.date,
          count: day.contributionCount,
          level: this.getLevel(day.contributionCount),
        })),
      })),
    }
  }

  /**
   * Determines the contribution level based on the provided contribution count.
   *
   * @param count - The contribution count for a given day.
   * @returns The contribution level, which can be 0, 1, 2, 3, or 4.
   */
  private getLevel(count: number): 0 | 1 | 2 | 3 | 4 {
    if (count === 0) return 0
    if (count <= 5) return 1
    if (count <= 10) return 2
    if (count <= 19) return 3
    return 4
  }
}

/**
 * An instance of the GitHubService class, which provides methods for interacting with the GitHub GraphQL API.
 */
export const githubService = new GitHubService()
