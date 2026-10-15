import * as Tone from 'tone'
import type { ScoreEvent, Voice } from '@/music/score'
import type { SoundSettings } from '@/studio/state'
import type { SynthParams } from './params'
import { SynthMix } from './mix'
import { delayFeedbackGain, StudioOutput } from './output'

export function leadFocusGain(amount: number, audible: boolean): number {
  return audible ? Math.pow(10, (-12 * amount) / 100 / 20) : 1
}

/** One signal graph per audio context; live playback and export use this same implementation. */
export class StudioAudioGraph {
  private readonly bassFilter: Tone.Filter
  private readonly padFilter: Tone.Filter
  private readonly padChorus: Tone.Chorus
  private readonly padReverb: Tone.Reverb
  private readonly padDuck: Tone.Gain
  private readonly leadFilter: Tone.Filter
  private readonly leadDelay: Tone.PingPongDelay
  private readonly leadDistortion: Tone.Distortion
  private readonly leadReverb: Tone.Reverb
  private readonly volumes: Record<Voice, Tone.Volume>
  private readonly gates: Record<Voice, Tone.Gain>
  private readonly bass: Tone.MonoSynth
  private readonly pad: Tone.PolySynth<Tone.FMSynth>
  private readonly lead: Tone.MonoSynth
  private readonly output: StudioOutput
  readonly ready: Promise<void>

  constructor(
    private readonly context: Tone.BaseContext,
    private readonly params: SynthParams,
    private readonly mix: SynthMix,
    private readonly sound: SoundSettings,
  ) {
    this.bassFilter = new Tone.Filter({ context, frequency: 240, type: 'lowpass', Q: 2 })
    this.padFilter = new Tone.Filter({ context, frequency: 1250, type: 'lowpass' })
    this.padChorus = new Tone.Chorus({ context, frequency: 0.5, depth: 0.8, wet: 0.3 }).start(0)
    this.padReverb = new Tone.Reverb({ context, decay: 8, wet: 0.85 })
    this.padDuck = new Tone.Gain({ context, gain: 1 })
    this.leadFilter = new Tone.Filter({ context, frequency: 800, type: 'lowpass' })
    this.leadDelay = new Tone.PingPongDelay({ context, delayTime: 0.25, feedback: 0.35, wet: 0.4 })
    this.leadDistortion = new Tone.Distortion({ context, distortion: 0.6 })
    this.leadReverb = new Tone.Reverb({ context, decay: 2.5, wet: 0.3 })
    this.volumes = {
      bass: new Tone.Volume({ context, volume: -8 }),
      pad: new Tone.Volume({ context, volume: 4 }),
      lead: new Tone.Volume({ context, volume: -16 }),
    }
    this.output = new StudioOutput(context)
    this.gates = {
      bass: new Tone.Gain({ context, gain: 1 }).connect(this.output.input),
      pad: new Tone.Gain({ context, gain: 1 }).connect(this.output.input),
      lead: new Tone.Gain({ context, gain: 1 }).connect(this.output.input),
    }
    this.bass = new Tone.MonoSynth({ context, oscillator: { type: 'square8' } }).chain(
      this.bassFilter,
      this.volumes.bass,
      this.gates.bass,
    )
    this.pad = new Tone.PolySynth({ voice: Tone.FMSynth, context }).chain(
      this.padFilter,
      this.padChorus,
      this.padReverb,
      this.padDuck,
      this.volumes.pad,
      this.gates.pad,
    )
    this.lead = new Tone.MonoSynth({ context, oscillator: { type: 'triangle8' } }).chain(
      this.leadFilter,
      this.leadDelay,
      this.leadDistortion,
      this.leadReverb,
      this.volumes.lead,
      this.gates.lead,
    )
    this.ready = Promise.all([this.padReverb.ready, this.leadReverb.ready]).then(() => {})
    this.updateParams()
    this.updateMix()
  }

  updateParams(): void {
    const { bass, pad, lead } = this.params
    this.bassFilter.frequency.rampTo(bass.cutoff, 0.03)
    this.bassFilter.Q.rampTo(bass.resonance, 0.03)
    this.bass.set({
      oscillator: { type: bass.waveform },
      envelope: {
        attack: bass.attack,
        decay: bass.decay,
        sustain: bass.sustain,
        release: bass.release,
      },
    })
    this.padFilter.frequency.rampTo(pad.cutoff, 0.03)
    this.padReverb.wet.rampTo(pad.reverbMix, 0.03)
    this.padChorus.wet.rampTo(pad.chorus ? 0.3 : 0, 0.03)
    this.pad.set({
      envelope: {
        attack: pad.attack,
        decay: pad.decay,
        sustain: pad.sustain,
        release: pad.release,
      },
      modulationEnvelope: {
        attack: pad.modAttack,
        decay: pad.modDecay,
        sustain: pad.modSustain,
        release: pad.modRelease,
      },
    })
    this.leadFilter.frequency.rampTo(lead.cutoff, 0.03)
    this.leadDelay.delayTime.rampTo(lead.delayTime, 0.03)
    this.leadDelay.feedback.rampTo(delayFeedbackGain(lead.delayFeedback), 0.03)
    this.leadReverb.wet.rampTo(lead.reverbMix, 0.03)
    this.leadDistortion.wet.rampTo(lead.distortion ? 0.6 : 0, 0.03)
    this.lead.set({
      envelope: {
        attack: lead.attack,
        decay: lead.decay,
        sustain: lead.sustain,
        release: lead.release,
      },
    })
    if (this.sound.leadFocus === 0) this.clearDucking()
  }

  updateMix(): void {
    for (const voice of ['bass', 'pad', 'lead'] as const) {
      this.volumes[voice].volume.rampTo(this.mix.level(voice), 0.03)
      this.gates[voice].gain.rampTo(Number.isFinite(this.mix.effectiveLevel(voice)) ? 1 : 0, 0.03)
    }
    if (!Number.isFinite(this.mix.effectiveLevel('lead'))) this.clearDucking()
  }

  trigger(event: ScoreEvent, time: number): void {
    const seconds = (event.duration * 60) / this.context.transport.bpm.getValueAtTime(time)
    if (event.voice === 'pad')
      this.pad.triggerAttackRelease([...event.notes], seconds, time, event.velocity)
    else if (event.voice === 'bass')
      this.bass.triggerAttackRelease(event.notes[0], seconds, time, event.velocity)
    else {
      this.lead.triggerAttackRelease(event.notes[0], seconds, time, event.velocity)
      const gain = leadFocusGain(
        this.sound.leadFocus,
        Number.isFinite(this.mix.effectiveLevel('lead')),
      )
      if (gain < 1) {
        this.padDuck.gain.cancelAndHoldAtTime(time)
        this.padDuck.gain.linearRampToValueAtTime(gain, time + 0.012)
        this.padDuck.gain.setValueAtTime(gain, time + seconds)
        this.padDuck.gain.linearRampToValueAtTime(1, time + seconds + 0.18)
      }
    }
  }

  private clearDucking(): void {
    const now = this.context.now()
    this.padDuck.gain.cancelAndHoldAtTime(now)
    this.padDuck.gain.linearRampToValueAtTime(1, now + 0.03)
  }

  releaseAll(): void {
    this.bass.triggerRelease()
    this.pad.releaseAll()
    this.lead.triggerRelease()
    this.clearDucking()
  }

  dispose(): void {
    this.bass.dispose()
    this.pad.dispose()
    this.lead.dispose()
    this.bassFilter.dispose()
    this.padFilter.dispose()
    this.padChorus.dispose()
    this.padReverb.dispose()
    this.padDuck.dispose()
    this.leadFilter.dispose()
    this.leadDelay.dispose()
    this.leadDistortion.dispose()
    this.leadReverb.dispose()
    for (const voice of ['bass', 'pad', 'lead'] as const) {
      this.volumes[voice].dispose()
      this.gates[voice].dispose()
    }
    this.output.dispose()
  }
}
