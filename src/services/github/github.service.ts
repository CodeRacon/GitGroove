export class GitHubService {
  private readonly token = import.meta.env.VITE_GITHUB_TOKEN
  private readonly baseUrl = 'https://api.github.com/graphql'

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

  private getLevel(count: number): 0 | 1 | 2 | 3 | 4 {
    if (count === 0) return 0
    if (count <= 5) return 1
    if (count <= 10) return 2
    if (count <= 19) return 3
    return 4
  }
}

export const githubService = new GitHubService()
