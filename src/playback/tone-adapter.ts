import * as Tone from 'tone'
import type { Score } from '@/music/score'
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
    this.score = score
    this.transport.loop = true
    this.transport.loopStart = 0
    this.transport.loopEnd = `${Math.round(score.totalBeats * this.transport.PPQ)}i`
    score.events.forEach((event, index) => {
      this.transport.schedule(
        (time) => {
          const current = this.score?.events[index]
          if (current) this.graph.trigger(current, time)
        },
        `${Math.round(event.beat * this.transport.PPQ)}i`,
      )
    })
  }
  retune(score: Score): void {
    this.score = score
  }
  clear(): void {
    this.score = null
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
