import { describe, expect, it, vi } from 'vitest'
import { PlaybackSession, type PlaybackAdapter } from './session'
import type { Score } from '@/music/score'

class FakeAdapter implements PlaybackAdapter {
  beat = 0
  starts = 0
  paused = 0
  released = 0
  bpm = 90
  loaded: Score | null = null
  clear() { this.loaded = null }
  load(score: Score) { this.loaded = score; this.beat = 0 }
  async start() { this.starts++ }
  pause() { this.paused++ }
  stop() { this.beat = 0 }
  positionBeats() { return this.beat }
  setBpm(bpm: number) { this.bpm = bpm }
  releaseAll() { this.released++ }
  dispose() {}
}

const score = { startWeek: 8, totalBeats: 8 } as Score

describe('PlaybackSession', () => {
  it('passes tempo changes to the playback adapter', () => {
    const adapter = new FakeAdapter()
    const session = new PlaybackSession(adapter)
    session.setBpm(165)
    expect(session.bpm.value).toBe(165)
    expect(adapter.bpm).toBe(165)
  })

  it('pauses at the current position and resumes without resetting', async () => {
    vi.stubGlobal('requestAnimationFrame', () => 1)
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const adapter = new FakeAdapter()
    const session = new PlaybackSession(adapter)
    session.load(score)
    await session.play()
    adapter.beat = 2.5
    session.pause()
    expect(session.status.value).toBe('paused')
    expect(session.week.value).toBe(8)
    expect(session.day.value).toBe(4)
    expect(adapter.beat).toBe(2.5)
    await session.play()
    expect(adapter.starts).toBe(2)
    expect(adapter.beat).toBe(2.5)
    session.stop()
    expect(session.week.value).toBe(8)
    expect(adapter.released).toBeGreaterThan(0)
    vi.unstubAllGlobals()
  })
})
