import * as Tone from 'tone'
import type { Score, ScoreEvent, Voice } from '@/music/score'
import type { PlaybackAdapter } from './session'
import type { SynthParams } from '@/audio/params'
import { SynthMix } from '@/audio/mix'

type Params = SynthParams

export class ToneAudioAdapter implements PlaybackAdapter {
  private readonly bassFilter = new Tone.Filter({ frequency: 240, type: 'lowpass', Q: 2 })
  private readonly padFilter = new Tone.Filter({ frequency: 1250, type: 'lowpass' })
  private readonly padChorus = new Tone.Chorus({ frequency: 0.5, depth: 0.8, wet: 0.3 }).start()
  private readonly padReverb = new Tone.Reverb({ decay: 8, wet: 0.85 })
  private readonly leadFilter = new Tone.Filter({ frequency: 800, type: 'lowpass' })
  private readonly leadDelay = new Tone.PingPongDelay({ delayTime: 0.25, feedback: 0.35, wet: 0.4 })
  private readonly leadDistortion = new Tone.Distortion(0.6)
  private readonly leadReverb = new Tone.Reverb({ decay: 2.5, wet: 0.3 })
  private readonly volumes: Record<Voice, Tone.Volume> = {
    bass: new Tone.Volume(-8), pad: new Tone.Volume(4), lead: new Tone.Volume(-16),
  }
  private readonly gates: Record<Voice, Tone.Gain> = {
    bass: new Tone.Gain(1).toDestination(),
    pad: new Tone.Gain(1).toDestination(),
    lead: new Tone.Gain(1).toDestination(),
  }
  private readonly bass = new Tone.MonoSynth({ oscillator: { type: 'square8' } })
    .chain(this.bassFilter, this.volumes.bass, this.gates.bass)
  private readonly pad = new Tone.PolySynth(Tone.FMSynth)
    .chain(this.padFilter, this.padChorus, this.padReverb, this.volumes.pad, this.gates.pad)
  private readonly lead = new Tone.MonoSynth({ oscillator: { type: 'triangle8' } })
    .chain(this.leadFilter, this.leadDelay, this.leadDistortion, this.leadReverb, this.volumes.lead, this.gates.lead)

  constructor(private readonly mix: SynthMix, private readonly params: Params) {
    Tone.getTransport().PPQ = 672
    Tone.getTransport().bpm.value = 90
    this.updateParams()
    this.updateMix()
  }

  load(score: Score): void {
    this.clear()
    const transport = Tone.getTransport()
    transport.loop = true
    transport.loopStart = 0
    transport.loopEnd = `${Math.round(score.totalBeats * transport.PPQ)}i`
    for (const event of score.events) {
      transport.schedule((time) => this.trigger(event, time), `${Math.round(event.beat * transport.PPQ)}i`)
    }
  }

  clear(): void {
    const transport = Tone.getTransport()
    transport.stop()
    transport.cancel(0)
    transport.loop = false
  }

  async start(): Promise<void> {
    await Tone.start()
    Tone.getTransport().start()
  }

  pause(): void { Tone.getTransport().pause() }
  stop(): void { Tone.getTransport().stop() }
  positionBeats(): number {
    const transport = Tone.getTransport()
    return transport.ticks / transport.PPQ
  }
  setBpm(bpm: number): void { Tone.getTransport().bpm.rampTo(bpm, 0.05) }
  releaseAll(): void {
    this.bass.triggerRelease()
    this.pad.releaseAll()
    this.lead.triggerRelease()
  }

  updateMix(): void {
    for (const voice of ['bass', 'pad', 'lead'] as const) {
      this.volumes[voice].volume.rampTo(this.mix.level(voice), 0.03)
      this.gates[voice].gain.rampTo(Number.isFinite(this.mix.effectiveLevel(voice)) ? 1 : 0, 0.03)
    }
  }

  updateParams(): void {
    const { bass, pad, lead } = this.params
    this.bassFilter.frequency.rampTo(bass.cutoff, 0.03)
    this.bassFilter.Q.rampTo(bass.resonance, 0.03)
    this.bass.set({ envelope: { attack: bass.attack, decay: bass.decay, sustain: bass.sustain, release: bass.release } })
    this.padFilter.frequency.rampTo(pad.cutoff, 0.03)
    this.padReverb.wet.rampTo(pad.reverbMix, 0.03)
    this.padChorus.wet.rampTo(pad.chorus ? 0.3 : 0, 0.03)
    this.pad.set({
      envelope: { attack: pad.attack, decay: pad.decay, sustain: pad.sustain, release: pad.release },
      modulationEnvelope: { attack: pad.modAttack, decay: pad.modDecay, sustain: pad.modSustain, release: pad.modRelease },
    })
    this.leadFilter.frequency.rampTo(lead.cutoff, 0.03)
    this.leadDelay.delayTime.rampTo(lead.delayTime, 0.03)
    this.leadDelay.feedback.rampTo(lead.delayFeedback, 0.03)
    this.leadReverb.wet.rampTo(lead.reverbMix, 0.03)
    this.leadDistortion.wet.rampTo(lead.distortion ? 0.6 : 0, 0.03)
    this.lead.set({ envelope: { attack: lead.attack, decay: lead.decay, sustain: lead.sustain, release: lead.release } })
  }

  private trigger(event: ScoreEvent, time: number): void {
    const seconds = event.duration * 60 / Tone.getTransport().bpm.value
    if (event.voice === 'pad') {
      this.pad.triggerAttackRelease([...event.notes], seconds, time, event.velocity)
    } else if (event.voice === 'bass') {
      this.bass.triggerAttackRelease(event.notes[0], seconds, time, event.velocity)
    } else {
      this.lead.triggerAttackRelease(event.notes[0], seconds, time, event.velocity)
    }
  }

  dispose(): void {
    this.clear()
    this.bass.dispose(); this.pad.dispose(); this.lead.dispose()
    this.bassFilter.dispose(); this.padFilter.dispose(); this.padChorus.dispose(); this.padReverb.dispose()
    this.leadFilter.dispose(); this.leadDelay.dispose(); this.leadDistortion.dispose(); this.leadReverb.dispose()
    for (const voice of ['bass', 'pad', 'lead'] as const) {
      this.volumes[voice].dispose(); this.gates[voice].dispose()
    }
  }
}
