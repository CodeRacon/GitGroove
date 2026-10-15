import * as Tone from 'tone'
import type { Score, ScoreEvent } from '@/music/score'
import type { PlaybackAdapter } from './session'
import type { SynthParams } from '@/audio/params'
import type { SoundSettings } from '@/studio/state'
import { defaultStudioConfig } from '@/studio/state'
import { SynthMix } from '@/audio/mix'
import { StudioAudioGraph } from '@/audio/graph'

export class ToneAudioAdapter implements PlaybackAdapter {
  private readonly context = Tone.getContext()
  private readonly transport = this.context.transport
  private readonly graph: StudioAudioGraph
  private score: Score | null = null
  private events = new Map<number, readonly ScoreEvent[]>()

  constructor(
    mix: SynthMix,
    params: SynthParams,
    sound: SoundSettings = defaultStudioConfig().sound,
  ) {
    this.transport.PPQ = 672
    this.transport.bpm.value = 90
    this.graph = new StudioAudioGraph(this.context, params, mix, sound)
  }
  load(score: Score): void {
    this.clear()
    this.transport.loop = true
    this.transport.loopStart = 0
    this.setScore(score)
    // Every possible contribution subdivision lies on this lattice (7 days × 4 notes).
    // Read the latest pitches on each step without restarting the transport.
    this.transport.scheduleRepeat(
      (time) => {
        if (!this.score) return
        const ticks = Math.round(this.transport.getTicksAtTime(time))
        const localTick = ticks % Math.round(this.score.totalBeats * this.transport.PPQ)
        for (const event of this.events.get(localTick) ?? []) this.graph.trigger(event, time)
      },
      `${this.transport.PPQ / 7}i`,
      0,
    )
  }
  retune(score: Score): void {
    this.setScore(score)
  }
  private setScore(score: Score): void {
    this.score = score
    this.transport.loopEnd = `${Math.round(score.totalBeats * this.transport.PPQ)}i`
    this.events.clear()
    for (const event of score.events) {
      const tick = Math.round(event.beat * this.transport.PPQ)
      this.events.set(tick, [...(this.events.get(tick) ?? []), event])
    }
  }
  clear(): void {
    this.score = null
    this.events.clear()
    this.transport.stop()
    this.transport.cancel(0)
    this.transport.loop = false
  }
  async start(): Promise<void> {
    await Tone.start()
    await this.graph.ready
    this.transport.start()
  }
  pause(): void {
    this.transport.pause()
  }
  stop(): void {
    this.transport.stop()
  }
  positionBeats(): number {
    return this.transport.ticks / this.transport.PPQ
  }
  setBpm(bpm: number): void {
    this.transport.bpm.rampTo(bpm, 0.05)
  }
  releaseAll(): void {
    this.graph.releaseAll()
  }
  updateMix(): void {
    this.graph.updateMix()
  }
  updateParams(): void {
    this.graph.updateParams()
  }
  dispose(): void {
    this.clear()
    this.graph.dispose()
  }
}
