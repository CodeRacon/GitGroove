import { beforeEach, describe, expect, it, vi } from 'vitest'
import { normalizeContributionCalendar } from '@/contributions/calendar'
import { createScore } from '@/music/score'
import { defaultSynthParams } from '@/audio/params'
import { SynthMix } from '@/audio/mix'
import { ToneAudioAdapter } from './tone-adapter'

const { transport, graph } = vi.hoisted(() => ({
  transport: {
    PPQ: 672,
    ticks: 0,
    bpm: { value: 90, rampTo: vi.fn() },
    loop: false,
    loopStart: 0,
    loopEnd: '' as string,
    scheduleRepeat:
      vi.fn<(callback: (time: number) => void, interval: string, start: number) => number>(),
    getTicksAtTime: vi.fn((): number => 0),
    start: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    cancel: vi.fn(),
  },
  graph: { trigger: vi.fn(), releaseAll: vi.fn(), dispose: vi.fn() },
}))

vi.mock('tone', () => ({ getContext: () => ({ transport }), start: vi.fn() }))
vi.mock('@/audio/graph', () => ({
  StudioAudioGraph: class {
    ready = Promise.resolve()
    trigger = graph.trigger
    releaseAll = graph.releaseAll
    dispose = graph.dispose
  },
}))

const calendar = normalizeContributionCalendar({
  totalContributions: 20,
  weeks: [{ contributionDays: [{ date: '2026-01-05', contributionCount: 20 }] }],
})

beforeEach(() => vi.clearAllMocks())

describe('ToneAudioAdapter live transposition', () => {
  it('uses the latest pitches for every voice on the original schedule without stopping or rescheduling', async () => {
    const adapter = new ToneAudioAdapter(new SynthMix(), defaultSynthParams())
    const original = createScore(calendar, 'CodeRacon')
    const shifted = createScore(calendar, 'CodeRacon', 0, 1, {
      key: 'F#',
      octaves: { bass: -1, pad: 1, lead: -1 },
    })
    adapter.load(original)
    await adapter.start()
    transport.ticks = 1680
    const callback = transport.scheduleRepeat.mock.calls[0][0]
    const stops = transport.stop.mock.calls.length
    const cancellations = transport.cancel.mock.calls.length
    adapter.retune(shifted)
    expect(adapter.positionBeats()).toBe(2.5)
    expect(transport.stop).toHaveBeenCalledTimes(stops)
    expect(transport.cancel).toHaveBeenCalledTimes(cancellations)
    expect(transport.scheduleRepeat).toHaveBeenCalledTimes(1)
    expect(transport.scheduleRepeat).toHaveBeenCalledWith(expect.any(Function), '96i', 0)
    expect(transport.start).toHaveBeenCalledTimes(1)
    expect(transport.pause).not.toHaveBeenCalled()
    expect(graph.releaseAll).not.toHaveBeenCalled()
    expect(new Set(shifted.events.map((event) => event.voice))).toEqual(
      new Set(['bass', 'pad', 'lead']),
    )
    for (let tick = 0; tick < original.totalBeats * transport.PPQ; tick += 96) {
      transport.getTicksAtTime.mockReturnValue(tick)
      callback(10)
    }
    expect(graph.trigger.mock.calls.map(([event]) => event)).toEqual(shifted.events)
    shifted.events.forEach((event, index) =>
      expect(event.notes).not.toEqual(original.events[index].notes),
    )
    adapter.clear()
    graph.trigger.mockClear()
    callback(20)
    expect(graph.trigger).not.toHaveBeenCalled()
  })
  it('clears the old calendar on load and does not restart playback automatically', () => {
    const adapter = new ToneAudioAdapter(new SynthMix(), defaultSynthParams())
    const first = createScore(calendar, 'CodeRacon')
    const next = createScore(calendar, 'CodeRacon', 0, 1, { patterns: { bass: 'down' } })
    adapter.load(first)
    adapter.load(next)
    expect(transport.stop).toHaveBeenCalledTimes(2)
    expect(transport.cancel).toHaveBeenCalledTimes(2)
    expect(transport.start).not.toHaveBeenCalled()
    const callback = transport.scheduleRepeat.mock.calls[1][0]
    for (let tick = 0; tick < next.totalBeats * transport.PPQ; tick += 96) {
      transport.getTicksAtTime.mockReturnValue(tick)
      callback(10)
    }
    expect(graph.trigger.mock.calls.map(([event]) => event)).toEqual(next.events)
    adapter.dispose()
  })
})
