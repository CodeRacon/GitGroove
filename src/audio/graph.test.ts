import { describe, expect, it } from 'vitest'
import { leadFocusGain } from './graph'
import { SynthMix } from './mix'

describe('lead focus', () => {
  it('keeps the pad unchanged when the lead is muted, excluded by solo, or playback is gated', () => {
    const mix = new SynthMix()
    const gain = () => leadFocusGain(100, Number.isFinite(mix.effectiveLevel('lead')))
    expect(gain()).toBeLessThan(0.26)
    mix.setMute('lead', true)
    expect(gain()).toBe(1)
    mix.toggleSolo('lead')
    expect(gain()).toBeLessThan(0.26)
    mix.toggleSolo('bass')
    expect(gain()).toBe(1)
    mix.setGate(false)
    expect(gain()).toBe(1)
    expect(mix.level('pad')).toBe(4)
  })

  it('has no effect at zero strength and increases attenuation gradually', () => {
    expect(leadFocusGain(0, true)).toBe(1)
    expect(leadFocusGain(50, true)).toBeGreaterThan(leadFocusGain(100, true))
    expect(leadFocusGain(50, true)).toBeLessThan(1)
  })
})
