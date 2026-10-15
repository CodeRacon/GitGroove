import { afterEach, describe, expect, it, vi } from 'vitest'
import { PlaybackSession, type PlaybackAdapter } from './session'
import type { Score } from '@/music/score'

class FakeAdapter implements PlaybackAdapter {
  beat = 0
  starts = 0
  stops = 0
  retunes = 0
  paused = 0
  released = 0
  bpm = 90
  loaded: Score | null = null
  clear() {
    this.loaded = null
  }
  load(score: Score) {
    this.loaded = score
    this.beat = 0
  }
  retune(score: Score) {
    this.loaded = score
    this.retunes++
  }
  async start() {
    this.starts++
  }
  pause() {
    this.paused++
  }
  stop() {
    this.stops++
    this.beat = 0
  }
  positionBeats() {
    return this.beat
  }
  setBpm(bpm: number) {
    this.bpm = bpm
  }
  releaseAll() {
    this.released++
  }
  dispose() {}
}

const score: Score = {
  username: 'coderacon',
  mappingVersion: 2,
  startWeek: 8,
  totalBeats: 8,
  weeks: [],
  events: [
    { voice: 'bass', beat: 1, duration: 0.45, notes: ['C2'], velocity: 0.65, week: 8, day: 1 },
  ],
}
const transposed = { ...score, events: score.events.map((event) => ({ ...event, notes: ['D2'] })) }

afterEach(() => vi.unstubAllGlobals())

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

  it('changes pitches during playback without restarting, releasing voices or resetting the position', async () => {
    vi.stubGlobal('requestAnimationFrame', () => 1)
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const adapter = new FakeAdapter()
    const session = new PlaybackSession(adapter)
    session.load(score)
    await session.play()
    adapter.beat = 2.5
    const stops = adapter.stops
    const releases = adapter.released
    session.retune(transposed)
    session.retune({
      ...transposed,
      events: transposed.events.map((event) => ({ ...event, notes: ['D3'] })),
    })
    expect(session.status.value).toBe('playing')
    expect(session.beat.value).toBe(2.5)
    expect(session.week.value).toBe(8)
    expect(adapter.starts).toBe(1)
    expect(adapter.stops).toBe(stops)
    expect(adapter.released).toBe(releases)
    expect(adapter.retunes).toBe(2)
    expect(adapter.loaded?.events[0].notes).toEqual(['D3'])
  })

  it('keeps a paused section at its position and resumes with the new pitches', async () => {
    vi.stubGlobal('requestAnimationFrame', () => 1)
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const adapter = new FakeAdapter()
    const session = new PlaybackSession(adapter)
    session.load(score)
    await session.play()
    adapter.beat = 3
    session.pause()
    session.retune(transposed)
    expect(session.status.value).toBe('paused')
    expect(session.beat.value).toBe(3)
    expect(adapter.starts).toBe(1)
    await session.play()
    expect(adapter.beat).toBe(3)
    expect(adapter.loaded).toBe(transposed)
  })

  it('does not start a stopped section when its pitches change', () => {
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const adapter = new FakeAdapter()
    const session = new PlaybackSession(adapter)
    session.load(score)
    session.retune(transposed)
    expect(session.status.value).toBe('stopped')
    expect(adapter.starts).toBe(0)
    expect(adapter.loaded).toBe(transposed)
  })

  it('loads structural changes normally instead of reusing an incompatible schedule', async () => {
    vi.stubGlobal('requestAnimationFrame', () => 1)
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const adapter = new FakeAdapter()
    const session = new PlaybackSession(adapter)
    session.load(score)
    await session.play()
    adapter.beat = 2
    session.retune({ ...transposed, startWeek: 9 })
    expect(session.status.value).toBe('stopped')
    expect(session.beat.value).toBe(0)
    expect(adapter.retunes).toBe(0)
    expect(adapter.loaded?.startWeek).toBe(9)
  })

  it('retunes while audio is starting without cancelling the pending start', async () => {
    vi.stubGlobal('requestAnimationFrame', () => 1)
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const adapter = new FakeAdapter()
    let completeStart!: () => void
    adapter.start = () =>
      new Promise<void>((resolve) => {
        completeStart = resolve
      })
    const session = new PlaybackSession(adapter)
    session.load(score)
    const playing = session.play()
    session.retune(transposed)
    completeStart()
    await playing
    expect(session.status.value).toBe('playing')
    expect(adapter.loaded).toBe(transposed)
    expect(adapter.paused).toBe(0)
  })
})
