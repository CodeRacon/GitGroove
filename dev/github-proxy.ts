import type { Plugin } from 'vite'

const query = 'query($username: String!) { user(login: $username) { contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { contributionCount date } } } } } }'

export function githubDevProxy(token: string | undefined): Plugin {
  const cache = new Map<string, { expires: number; body: string }>()
  return {
    name: 'gitgroove-github-dev-proxy',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/contributions.php', async (request, response) => {
        response.setHeader('Content-Type', 'application/json; charset=utf-8')
        response.setHeader('Cache-Control', 'private, max-age=0')
        const send = (status: number, body: unknown) => {
          response.statusCode = status
          response.end(JSON.stringify(body))
        }
        if (request.method !== 'GET') return send(405, { error: 'Method not allowed' })
        const username = new URL(request.url ?? '', 'http://localhost').searchParams.get('username')?.trim() ?? ''
        if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(username)) return send(400, { error: 'Invalid GitHub username' })
        if (!token) return send(503, { error: 'GITHUB_TOKEN is not configured' })
        const cached = cache.get(username.toLowerCase())
        if (cached && cached.expires > Date.now()) {
          response.end(cached.body)
          return
        }
        try {
          const upstream = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            signal: AbortSignal.timeout(12_000),
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              Accept: 'application/vnd.github+json',
              'User-Agent': 'GitGroove',
            },
            body: JSON.stringify({ query, variables: { username } }),
          })
          if (upstream.status === 401 || upstream.status === 403) return send(403, { error: 'GitHub authorization unavailable' })
          if (upstream.status === 429) return send(429, { error: 'GitHub rate limit' })
          if (!upstream.ok) return send(502, { error: 'GitHub request failed' })
          const payload = await upstream.json() as { errors?: unknown[]; data?: { user?: { contributionsCollection?: { contributionCalendar?: unknown } } } }
          if (payload.errors?.length) {
            const types = payload.errors.map((error) => typeof error === 'object' && error !== null && 'type' in error ? error.type : null)
            if (types.includes('NOT_FOUND')) return send(404, { error: 'GitHub user not found' })
            if (types.includes('RATE_LIMITED')) return send(429, { error: 'GitHub rate limit' })
            return send(502, { error: 'GitHub GraphQL error' })
          }
          const calendar = payload.data?.user?.contributionsCollection?.contributionCalendar
          if (!calendar) return send(404, { error: 'GitHub user not found' })
          const body = JSON.stringify(calendar)
          cache.set(username.toLowerCase(), { expires: Date.now() + 300_000, body })
          response.end(body)
        } catch {
          send(502, { error: 'GitHub connection unavailable' })
        }
      })
    },
  }
}
