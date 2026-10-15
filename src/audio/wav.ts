interface WavOptions {
  sampleRate: number
  offset?: number
  frames?: number
  fadeStartFrames?: number
  fadeEndFrames?: number
  signal?: AbortSignal
  onProgress?: (progress: number) => void
}

function checkAbort(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Export cancelled.', 'AbortError')
}
const yieldToUI = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

/** Stereo/mono PCM16 with an exact frame count, bounded peaks and optional boundary fades. */
export async function encodeWav(
  channels: readonly Float32Array[],
  options: WavOptions,
): Promise<{ bytes: ArrayBuffer; normalized: boolean }> {
  const offset = options.offset ?? 0
  const frames = options.frames ?? (channels[0]?.length ?? 0) - offset
  if (
    ![1, 2].includes(channels.length) ||
    !Number.isInteger(options.sampleRate) ||
    options.sampleRate < 8000 ||
    options.sampleRate > 192000 ||
    !Number.isInteger(offset) ||
    offset < 0 ||
    !Number.isInteger(frames) ||
    frames < 1 ||
    channels.some((channel) => channel.length < offset + frames)
  )
    throw new Error('Invalid WAV audio buffer.')
  checkAbort(options.signal)
  let peak = 0
  for (let frame = 0; frame < frames; frame++) {
    for (const channel of channels) {
      const value = channel[offset + frame]
      if (!Number.isFinite(value)) throw new Error('The audio contains invalid samples.')
      peak = Math.max(peak, Math.abs(value))
    }
    if (frame % 262144 === 0) {
      checkAbort(options.signal)
      await yieldToUI()
      options.onProgress?.((frame / frames) * 0.5)
    }
  }
  const gain = peak > 1 ? 0.98 / peak : 1
  const bytes = new ArrayBuffer(44 + frames * channels.length * 2)
  const view = new DataView(bytes)
  const text = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i))
  }
  text(0, 'RIFF')
  view.setUint32(4, bytes.byteLength - 8, true)
  text(8, 'WAVE')
  text(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, channels.length, true)
  view.setUint32(24, options.sampleRate, true)
  view.setUint32(28, options.sampleRate * channels.length * 2, true)
  view.setUint16(32, channels.length * 2, true)
  view.setUint16(34, 16, true)
  text(36, 'data')
  view.setUint32(40, bytes.byteLength - 44, true)
  const fadeStart = Math.min(options.fadeStartFrames ?? 0, frames)
  const fadeEnd = Math.min(options.fadeEndFrames ?? 0, frames)
  let position = 44
  for (let frame = 0; frame < frames; frame++) {
    const fade = Math.min(
      1,
      fadeStart > 1 ? frame / (fadeStart - 1) : 1,
      fadeEnd > 1 ? (frames - 1 - frame) / (fadeEnd - 1) : 1,
    )
    for (const channel of channels) {
      const sample = Math.max(-1, Math.min(1, channel[offset + frame] * gain * fade))
      view.setInt16(position, Math.round(sample * (sample < 0 ? 32768 : 32767)), true)
      position += 2
    }
    if (frame % 262144 === 0) {
      checkAbort(options.signal)
      await yieldToUI()
      options.onProgress?.(0.5 + (frame / frames) * 0.5)
    }
  }
  checkAbort(options.signal)
  options.onProgress?.(1)
  return { bytes, normalized: gain < 1 }
}
