import { describe, expect, it } from 'vitest'
import { SynthMix } from './mix'

describe('SynthMix', () => {
  it('temporarily overrides mute with solo without changing the fader', () => {
    const mix = new SynthMix()
    mix.setLevel('bass', -12)
    mix.setMute('bass', true)
    expect(mix.effectiveLevel('bass')).toBe(-Infinity)
    mix.toggleSolo('bass')
    expect(mix.effectiveLevel('bass')).toBe(-12)
    expect(mix.effectiveLevel('pad')).toBe(-Infinity)
    mix.toggleSolo('bass')
    expect(mix.isMuted('bass')).toBe(true)
    expect(mix.level('bass')).toBe(-12)
    expect(mix.effectiveLevel('bass')).toBe(-Infinity)
  })

  it('closes the output gate without changing stored levels', () => {
    const mix = new SynthMix()
    mix.setGate(false)
    expect(mix.effectiveLevel('pad')).toBe(-Infinity)
    mix.setGate(true)
    expect(mix.effectiveLevel('pad')).toBe(4)
  })
})
