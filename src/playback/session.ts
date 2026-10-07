import { ref } from 'vue'
import type { Score, ScoreEvent } from '@/music/score'

export interface PlaybackAdapter {
  clear(): void
  load(score: Score): void
  start(): Promise<void>
  pause(): void
  stop(): void
  positionBeats(): number
  setBpm(bpm: number): void
  releaseAll(): void
  dispose(): void
}

export type PlaybackStatus = 'stopped' | 'playing' | 'paused'

export class PlaybackSession {
  readonly status = ref<PlaybackStatus>('stopped')
  readonly bpm = ref(90)
  readonly beat = ref(0)
  readonly week = ref(0)
  readonly day = ref(0)
  readonly progress = ref(0)
  private score: Score | null = null
  private frame = 0
  private revision = 0

  constructor(private readonly adapter: PlaybackAdapter) {}

  load(score: Score): void {
    this.stop()
    this.score = score
    this.adapter.load(score)
    this.updatePosition(0)
  }

  clear(): void {
    this.stop()
    this.score = null
    this.adapter.clear()
    this.updatePosition(0)
  }

  async play(): Promise<void> {
    if (!this.score || this.status.value === 'playing') return
    const revision = ++this.revision
    await this.adapter.start()
    if (revision !== this.revision) {
      this.adapter.pause()
      return
    }
    this.status.value = 'playing'
    this.draw()
  }

  pause(): void {
    this.revision++
    if (this.status.value !== 'playing') return
    this.adapter.pause()
    this.adapter.releaseAll()
    this.status.value = 'paused'
    cancelAnimationFrame(this.frame)
    this.updatePosition(this.adapter.positionBeats())
  }

  stop(): void {
    this.revision++
    this.adapter.stop()
    this.adapter.releaseAll()
    this.status.value = 'stopped'
    cancelAnimationFrame(this.frame)
    this.updatePosition(0)
  }

  setBpm(value: number): void {
    if (!Number.isFinite(value) || value < 30 || value > 300) return
    this.bpm.value = value
    this.adapter.setBpm(value)
  }

  dispose(): void {
    this.stop()
    this.adapter.dispose()
  }

  private draw = (): void => {
    if (this.status.value !== 'playing') return
    this.updatePosition(this.adapter.positionBeats())
    this.frame = requestAnimationFrame(this.draw)
  }

  private updatePosition(beat: number): void {
    const score = this.score
    const safeBeat = score ? Math.max(0, beat % score.totalBeats) : 0
    const localWeek = Math.floor(safeBeat / 4)
    const fraction = (safeBeat % 4) / 4
    this.beat.value = safeBeat
    this.week.value = (score?.startWeek ?? 0) + localWeek
    this.day.value = Math.min(6, Math.floor(fraction * 7))
    this.progress.value = fraction
  }
}

export type { ScoreEvent }
