import { describe, expect, it } from 'vitest'
import { delayFeedbackGain, MAX_DELAY_FEEDBACK, OUTPUT_CEILING, softCeiling } from './output'

describe('output protection', () => {
  it('keeps quiet samples linear and the ceiling continuous, symmetric and bounded', () => {
    for (const value of [-0.9, -0.5, 0, 0.5, 0.9]) expect(softCeiling(value)).toBe(value)
    expect(softCeiling(0.9 + 0.000001)).toBeCloseTo(0.900001, 8)
    let previous = 0
    for (let i = 0; i <= 1000; i++) {
      const input = i / 10
      const output = softCeiling(input)
      expect(output).toBeGreaterThanOrEqual(previous)
      expect(output).toBeLessThanOrEqual(OUTPUT_CEILING)
      expect(softCeiling(-input)).toBe(-output)
      previous = output
    }
  })

  it('keeps feedback increasing across the entire control range while ensuring echoes decay', () => {
    expect(delayFeedbackGain(0)).toBe(0)
    let previous = 0
    for (let i = 1; i <= 1000; i++) {
      const gain = delayFeedbackGain(i / 1000)
      expect(gain).toBeGreaterThan(previous)
      expect(gain).toBeLessThan(1)
      previous = gain
    }
    expect(delayFeedbackGain(1)).toBe(MAX_DELAY_FEEDBACK)
  })
})
