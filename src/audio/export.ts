import * as Tone from 'tone'
import { createScore } from '@/music/score'
import { snapshotFromData, snapshotToData, type StudioSnapshot } from '@/studio/snapshot'
import { SynthMix } from './mix'
import { StudioAudioGraph } from './graph'
import { encodeWav } from './wav'

export type ExportMode = 'loop' | 'tail'
export const EXPORT_SAMPLE_RATE = 44100
export const EXPORT_TAIL_SECONDS = 12

export function loopDuration(snapshot: StudioSnapshot): number {
  return (snapshot.selection.weekCount * 4 * 60) / snapshot.bpm
}

export async function renderWav(
  input: StudioSnapshot,
  mode: ExportMode,
  signal?: AbortSignal,
  onStatus?: (status: string) => void,
): Promise<{ blob: Blob; duration: number; normalized: boolean }> {
  const snapshot = snapshotFromData(snapshotToData(input))
  const score = createScore(
    snapshot.calendar,
    snapshot.profile,
    snapshot.selection.startWeek,
    snapshot.selection.weekCount,
    snapshot.sound,
  )
  const seconds = loopDuration(snapshot)
  const warmup = mode === 'loop' ? EXPORT_TAIL_SECONDS : 0
  const outputFrames = Math.round(
    (seconds + (mode === 'tail' ? EXPORT_TAIL_SECONDS : 0)) * EXPORT_SAMPLE_RATE,
  )
  const startFrame = Math.round(warmup * EXPORT_SAMPLE_RATE)
  const context = new Tone.OfflineContext(
    2,
    (startFrame + outputFrames + 1) / EXPORT_SAMPLE_RATE,
    EXPORT_SAMPLE_RATE,
  )
  const mix = new SynthMix()
  mix.restore(snapshot.mix)
  for (const voice of ['bass', 'pad', 'lead'] as const)
    mix.setLevel(voice, snapshot.synth[voice].volume)
  context.transport.bpm.value = snapshot.bpm
  const graph = new StudioAudioGraph(context, snapshot.synth, mix, snapshot.sound)
  let rendered: Tone.ToneAudioBuffer | undefined
  try {
    onStatus?.('Preparing the sound…')
    await graph.ready
    if (signal?.aborted) throw new DOMException('Export cancelled.', 'AbortError')
    const beatSeconds = 60 / snapshot.bpm
    for (let cycle = -Math.ceil(warmup / seconds); cycle <= 0; cycle++) {
      for (const event of score.events) {
        const time = warmup + cycle * seconds + event.beat * beatSeconds
        if (time >= 0) graph.trigger(event, time)
      }
    }
    onStatus?.('Rendering stereo audio…')
    rendered = await context.render()
    if (signal?.aborted) throw new DOMException('Export cancelled.', 'AbortError')
    const audio = rendered.get()
    if (!audio) throw new Error('No audio was rendered.')
    const channels = Array.from({ length: audio.numberOfChannels }, (_, index) =>
      audio.getChannelData(index),
    )
    const result = await encodeWav(channels, {
      sampleRate: EXPORT_SAMPLE_RATE,
      offset: startFrame,
      frames: outputFrames,
      fadeStartFrames: mode === 'loop' ? Math.round(0.003 * EXPORT_SAMPLE_RATE) : 0,
      fadeEndFrames: Math.round((mode === 'loop' ? 0.003 : 0.5) * EXPORT_SAMPLE_RATE),
      signal,
      onProgress: (progress) => onStatus?.(`Encoding WAV… ${Math.round(progress * 100)}%`),
    })
    return {
      blob: new Blob([result.bytes], { type: 'audio/wav' }),
      duration: outputFrames / EXPORT_SAMPLE_RATE,
      normalized: result.normalized,
    }
  } finally {
    graph.dispose()
    rendered?.dispose()
    context.dispose()
  }
}
