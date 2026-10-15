import { describe, expect, it } from 'vitest'
import { encodeWav } from './wav'

describe('WAV export', () => {
  it('writes a stereo PCM16 header, exact duration and interleaved channel samples', async () => {
    const { bytes, normalized } = await encodeWav(
      [new Float32Array([0, 0.5, -1]), new Float32Array([1, -0.5, 0])],
      { sampleRate: 44100 },
    )
    const view = new DataView(bytes)
    const text = (start: number, length: number) =>
      String.fromCharCode(...new Uint8Array(bytes, start, length))
    expect(text(0, 4)).toBe('RIFF')
    expect(text(8, 4)).toBe('WAVE')
    expect(text(36, 4)).toBe('data')
    expect(view.getUint16(20, true)).toBe(1)
    expect(view.getUint16(22, true)).toBe(2)
    expect(view.getUint32(24, true)).toBe(44100)
    expect(view.getUint16(34, true)).toBe(16)
    expect(view.getUint32(40, true)).toBe(12)
    expect(bytes.byteLength).toBe(56)
    expect([44, 46, 48, 50, 52, 54].map((offset) => view.getInt16(offset, true))).toEqual([
      0, 32767, 16384, -16384, -32768, 0,
    ])
    expect(normalized).toBe(false)
  })

  it('crops the requested cycle, reduces excessive peaks and closes loop boundaries at zero', async () => {
    const { bytes, normalized } = await encodeWav([new Float32Array([99, 2, 2, 2, 2, 99])], {
      sampleRate: 48000,
      offset: 1,
      frames: 4,
      fadeStartFrames: 2,
      fadeEndFrames: 2,
    })
    const view = new DataView(bytes)
    expect(bytes.byteLength).toBe(52)
    expect(view.getInt16(44, true)).toBe(0)
    expect(view.getInt16(50, true)).toBe(0)
    expect(view.getInt16(46, true)).toBe(Math.round(0.98 * 32767))
    expect(normalized).toBe(true)
  })

  it('rejects invalid samples and cancels before producing a download', async () => {
    await expect(encodeWav([new Float32Array([NaN])], { sampleRate: 44100 })).rejects.toThrow(
      /invalid samples/,
    )
    const controller = new AbortController()
    controller.abort()
    await expect(
      encodeWav([new Float32Array([0])], { sampleRate: 44100, signal: controller.signal }),
    ).rejects.toThrow(/cancelled/)
  })
})
