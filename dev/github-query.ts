export const contributionQuery = `query($username: String!, $from: DateTime, $to: DateTime) {
  user(login: $username) {
    contributionsCollection(from: $from, to: $to) {
      contributionYears
      contributionCalendar { totalContributions weeks { contributionDays { contributionCount date } } }
    }
  }
}`

export function contributionRequest(params: URLSearchParams, now = new Date()) {
  const username = params.get('username')?.trim() ?? ''
  if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(username))
    throw new Error('Invalid GitHub username')
  const rawYear = params.get('year')
  const year = rawYear === null ? null : Number(rawYear)
  if (
    year !== null &&
    (!/^\d{4}$/.test(rawYear!) ||
      year < 1 ||
      year > now.getUTCFullYear() ||
      params.getAll('year').length !== 1)
  )
    throw new Error('Invalid contribution year')
  const variables: { username: string; from?: string; to?: string } = { username }
  if (year !== null) {
    variables.from = `${rawYear}-01-01T00:00:00Z`
    variables.to = year === now.getUTCFullYear() ? now.toISOString() : `${rawYear}-12-31T23:59:59Z`
  }
  return { variables, cacheKey: `${username.toLowerCase()}:${year ?? 'rolling'}` }
}
