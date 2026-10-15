import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ViteDevServer } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { githubDevProxy } from './github-proxy'

afterEach(() => vi.unstubAllGlobals())

function proxy() {
  let middleware!: (request: IncomingMessage, response: ServerResponse) => Promise<void>
  const configure = githubDevProxy('test-token').configureServer as (server: ViteDevServer) => void
  configure({
    middlewares: {
      use: (_path: string, handler: typeof middleware) => {
        middleware = handler
      },
    },
  } as unknown as ViteDevServer)
  return async (url: string) => {
    let body = ''
    const response = {
      statusCode: 200,
      setHeader: () => {},
      end: (value: string) => {
        body = value
      },
    }
    await middleware(
      { method: 'GET', url } as IncomingMessage,
      response as unknown as ServerResponse,
    )
    return { status: response.statusCode, body: JSON.parse(body) }
  }
}

describe('development GitHub proxy', () => {
  it('passes explicit periods to GitHub and caches distinct years independently', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({
          data: {
            user: {
              contributionsCollection: {
                contributionYears: [2025, 2024],
                contributionCalendar: { totalContributions: 20, weeks: [] },
              },
            },
          },
        }),
      })
    vi.stubGlobal('fetch', fetch)
    const request = proxy()
    const response = await request('?username=CodeRacon&year=2024')
    expect(response).toEqual({
      status: 200,
      body: { totalContributions: 20, weeks: [], contributionYears: [2025, 2024] },
    })
    expect(JSON.parse(fetch.mock.calls[0][1].body).variables).toEqual({
      username: 'CodeRacon',
      from: '2024-01-01T00:00:00Z',
      to: '2024-12-31T23:59:59Z',
    })
    await request('?username=coderacon&year=2024')
    expect(fetch).toHaveBeenCalledTimes(1)
    await request('?username=CodeRacon&year=2025')
    await request('?username=CodeRacon')
    expect(fetch).toHaveBeenCalledTimes(3)
  })
  it('rejects invalid input before contacting GitHub', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const request = proxy()
    expect((await request('?username=CodeRacon&year=invalid')).status).toBe(400)
    expect((await request('?username=invalid.name&year=2024')).status).toBe(400)
    expect(fetch).not.toHaveBeenCalled()
  })
})
