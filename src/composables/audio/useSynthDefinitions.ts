import * as Tone from 'tone'

export function useSynthDefinitions() {
  /**
   * Defines the effects applied to the bass synth, including a low-pass filter and volume control.
   */
  const bassEffects = {
    filter: new Tone.Filter({
      frequency: 200,
      type: 'lowpass',
      rolloff: -24,
      Q: 2,
    }),
    volume: new Tone.Volume(0),
  }

  /**
   * Defines a MonoSynth instance with a square wave oscillator and an envelope with specific attack, decay, sustain, and release parameters. The synth is then chained with the `bassEffects` object, which includes a low-pass filter and volume control, before being routed to the Tone.js audio destination.
   */
  const bassSynth = new Tone.MonoSynth({
    oscillator: { type: 'square8' },
    envelope: { attack: 0.8, decay: 1.2, sustain: 0.2, release: 1.6 },
  }).chain(bassEffects.filter, bassEffects.volume, Tone.Destination)

  /**
   * Defines the effects applied to the pad synth, including a low-pass filter, reverb, chorus, and volume control.
   */
  const padEffects = {
    filter: new Tone.Filter({
      frequency: 2000,
      type: 'lowpass',
    }),
    reverb: new Tone.Reverb({
      decay: 8,
      wet: 0.85,
    }),
    chorus: new Tone.Chorus({
      frequency: 0.5,
      depth: 0.8,
      wet: 0.3,
    }),
    volume: new Tone.Volume(4),
  }

  /**
   * Defines a PolySynth instance using the FMSynth type, with specific envelope and modulation settings. The synth is then chained with the `padEffects` object, which includes a low-pass filter, chorus, reverb, and volume control, before being routed to the Tone.js audio destination.
   */
  const padSynth = new Tone.PolySynth(Tone.FMSynth)
    .set({
      envelope: {
        attack: 0.8,
        decay: 1.8,
        sustain: 0.9,
        release: 3.0,
      },
      modulation: {
        type: 'sine',
      },
      modulationEnvelope: {
        attack: 0.4,
        decay: 0.6,
        sustain: 0.7,
        release: 2.2,
      },
      harmonicity: 1.5,
    })
    .chain(
      padEffects.filter,
      padEffects.chorus,
      padEffects.reverb,
      padEffects.volume,
      Tone.Destination,
    )

  /**
   * Defines the effects applied to the lead synth, including a low-pass filter, ping-pong delay, reverb, distortion, and volume control.
   */
  const leadEffects = {
    filter: new Tone.Filter({
      frequency: 600,
      type: 'lowpass',
      rolloff: -24,
      Q: 2,
    }),
    delay: new Tone.PingPongDelay({
      delayTime: '16n',
      feedback: 0.35,
      wet: 0.4,
    }),
    reverb: new Tone.Reverb({
      decay: 2.5,
      wet: 0.3,
    }),
    distortion: new Tone.Distortion(0.6),
    volume: new Tone.Volume(-18),
  }

  /**
   * Defines the lead synth, which uses a triangle8 oscillator and an envelope with specific attack, decay, sustain, and release parameters. The synth is then chained with various effects, including a low-pass filter, ping-pong delay, distortion, reverb, and volume control, before being routed to the final audio destination.
   */
  const leadSynth = new Tone.MonoSynth({
    oscillator: {
      type: 'triangle8',
    },
    envelope: {
      attack: 0.02,
      decay: 0.3,
      sustain: 0.6,
      release: 0.8,
    },
  }).chain(
    leadEffects.filter,
    leadEffects.delay,
    leadEffects.distortion,
    leadEffects.reverb,
    leadEffects.volume,
    Tone.Destination,
  )

  return {
    bassEffects,
    bassSynth,
    leadEffects,
    leadSynth,
    padEffects,
    padSynth,
  }
}
