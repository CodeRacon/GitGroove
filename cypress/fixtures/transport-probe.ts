import * as Tone from 'tone'
import { ToneAudioAdapter } from '@/playback/tone-adapter'
import { StudioAudioGraph } from '@/audio/graph'
import { SynthMix } from '@/audio/mix'
import { defaultStudioConfig } from '@/studio/state'
import { createScore, type ScoreEvent } from '@/music/score'
import { normalizeContributionCalendar } from '@/contributions/calendar'

// A real Tone transport, clock and synth graph in a separate offline audio context.
export async function renderTransportCase() {
  const previous = Tone.getContext()
  const seconds = 9
  const context = new Tone.OfflineContext(2, seconds, 44100)
  Tone.setContext(context)
  const config = defaultStudioConfig()
  const calendar = (firstDay: string, days: number) =>
    normalizeContributionCalendar({
      totalContributions: days * 20,
      weeks: [
        {
          contributionDays: Array.from({ length: days }, (_, i) => ({
            date: new Date(Date.parse(firstDay) + i * 86400000).toISOString().slice(0, 10),
            contributionCount: 20,
          })),
        },
      ],
    })
  const first = createScore(calendar('2025-01-05', 7), 'CodeRacon')
  const next = createScore(calendar('2024-01-07', 14), 'CodeRacon', 0, 2, {
    patterns: { bass: 'down', lead: 'up-down' },
  })
  const played: { voice: string; notes: readonly string[]; time: number }[] = []
  const trigger = StudioAudioGraph.prototype.trigger
  StudioAudioGraph.prototype.trigger = function (event: ScoreEvent, time: number) {
    played.push({ voice: event.voice, notes: event.notes, time })
    trigger.call(this, event, time)
  }
  const adapter = new ToneAudioAdapter(new SynthMix(), config.synth, config.sound)
  let rendered: Tone.ToneAudioBuffer | undefined
  const stoppedAt = 0.5
  const restartedAt = 1.5
  try {
    adapter.load(first)
    await adapter.start()
    context.setTimeout(() => {
      adapter.stop()
      adapter.releaseAll()
      adapter.load(next)
      // Explicit Play at a later audio time; load itself must not start the new year.
      context.transport.start(restartedAt)
    }, stoppedAt)
    rendered = await context.render()
    const expected: typeof played = []
    for (const event of first.events.filter((event) => (event.beat * 60) / 90 < stoppedAt))
      expected.push({ voice: event.voice, notes: event.notes, time: (event.beat * 60) / 90 })
    for (let start = restartedAt; start < seconds; start += (next.totalBeats * 60) / 90) {
      for (const event of next.events) {
        const time = start + (event.beat * 60) / 90
        if (time < seconds) expected.push({ voice: event.voice, notes: event.notes, time })
      }
    }
    expected.sort((a, b) => a.time - b.time)
    const samples = rendered.get()!.getChannelData(0)
    let peak = 0,
      energy = 0
    for (const sample of samples) {
      peak = Math.max(peak, Math.abs(sample))
      energy += sample * sample
    }
    return {
      played,
      expected,
      stoppedAt,
      restartedAt,
      peak,
      rms: Math.sqrt(energy / samples.length),
    }
  } finally {
    adapter.dispose()
    StudioAudioGraph.prototype.trigger = trigger
    rendered?.dispose()
    context.dispose()
    Tone.setContext(previous)
  }
}
