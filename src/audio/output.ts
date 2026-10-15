import * as Tone from 'tone'

export const MAX_DELAY_FEEDBACK = 0.95
export const OUTPUT_CEILING = 0.98

/** The control remains 0–1; regeneration stays below unity at its upper end. */
export function delayFeedbackGain(amount: number): number {
  return Math.max(0, Math.min(1, amount)) * MAX_DELAY_FEEDBACK
}

/** Leave ordinary samples linear; round only the last part of the output range. */
export function softCeiling(sample: number): number {
  const magnitude = Math.abs(sample)
  if (magnitude <= 0.9) return sample
  return Math.sign(sample) * (0.9 + 0.08 * Math.tanh((magnitude - 0.9) / 0.08))
}

/** One shared output stage for every voice, in both live and offline contexts. */
export class StudioOutput {
  readonly input: Tone.Gain
  private readonly compressor: Tone.Compressor
  private readonly ceiling: Tone.WaveShaper

  constructor(context: Tone.BaseContext) {
    this.input = new Tone.Gain({ context, gain: Tone.dbToGain(-6) })
    this.compressor = new Tone.Compressor({
      context,
      threshold: -6,
      knee: 3,
      ratio: 20,
      attack: 0.003,
      release: 0.12,
    })
    this.ceiling = new Tone.WaveShaper({ context, mapping: softCeiling, length: 16_385 })
    this.input.chain(this.compressor, this.ceiling)
    this.ceiling.toDestination()
  }

  dispose(): void {
    this.input.dispose()
    this.compressor.dispose()
    this.ceiling.dispose()
  }
}
