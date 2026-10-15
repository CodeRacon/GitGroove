import type { Plugin } from 'vite'

import { contributionQuery as query, contributionRequest } from './github-query'

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
        let period: ReturnType<typeof contributionRequest>
        try {
          period = contributionRequest(new URL(request.url ?? '', 'http://localhost').searchParams)
        } catch (error) {
          return send(400, { error: (error as Error).message })
        }
        if (!token) return send(503, { error: 'GITHUB_TOKEN is not configured' })
        const cached = cache.get(period.cacheKey)
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
            body: JSON.stringify({ query, variables: period.variables }),
          })
          if (upstream.status === 401 || upstream.status === 403)
            return send(403, { error: 'GitHub authorization unavailable' })
          if (upstream.status === 429) return send(429, { error: 'GitHub rate limit' })
          if (!upstream.ok) return send(502, { error: 'GitHub request failed' })
          const payload = (await upstream.json()) as {
            errors?: unknown[]
            data?: {
              user?: {
                contributionsCollection?: {
                  contributionCalendar?: Record<string, unknown>
                  contributionYears?: number[]
                }
              }
            }
          }
          if (payload.errors?.length) {
            const types = payload.errors.map((error) =>
              typeof error === 'object' && error !== null && 'type' in error ? error.type : null,
            )
            if (types.includes('NOT_FOUND')) return send(404, { error: 'GitHub user not found' })
            if (types.includes('RATE_LIMITED')) return send(429, { error: 'GitHub rate limit' })
            return send(502, { error: 'GitHub GraphQL error' })
          }
          const calendar = payload.data?.user?.contributionsCollection?.contributionCalendar
          if (!calendar) return send(404, { error: 'GitHub user not found' })
          const body = JSON.stringify({
            ...calendar,
            contributionYears: payload.data?.user?.contributionsCollection?.contributionYears ?? [],
          })
          cache.set(period.cacheKey, { expires: Date.now() + 300_000, body })
          response.end(body)
        } catch {
          send(502, { error: 'GitHub connection unavailable' })
        }
      })
    },
  }
}
