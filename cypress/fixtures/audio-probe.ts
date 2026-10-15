import * as Tone from 'tone'
import { StudioAudioGraph } from '@/audio/graph'
import { SynthMix } from '@/audio/mix'
import { defaultStudioConfig } from '@/studio/state'
import { createScore, type ScoreEvent } from '@/music/score'
import { normalizeContributionCalendar } from '@/contributions/calendar'

type Probe = string

export async function renderAudioCase(name: Probe) {
  const config = defaultStudioConfig()
  const seconds = name.startsWith('feedback') ? 12 : name.startsWith('dense') ? 8 : 2
  const native = new OfflineAudioContext(2, seconds * 44100, 44100)
  const context = new Tone.OfflineContext(native)
  const mix = new SynthMix()
  if (name.startsWith('bass')) {
    mix.toggleSolo('bass')
    if (name === 'bass-hot') config.synth.bass.volume = 12
    else {
      config.synth.bass.cutoff = 4000
      config.synth.bass.resonance = 0.1
      config.synth.bass.attack = 0.1
      config.synth.bass.sustain = 1
      config.synth.bass.volume = -12
    }
  }
  if (name === 'lead-octave') {
    mix.toggleSolo('lead')
    config.synth.lead.cutoff = 2000
    config.synth.lead.reverbMix = 1
    config.synth.lead.delayFeedback = 1
  }
  if (name.startsWith('feedback')) {
    mix.toggleSolo('lead')
    config.synth.lead.reverbMix = 0
    config.synth.lead.cutoff = 2000
    config.synth.lead.release = 0.1
    config.synth.lead.delayFeedback = name === 'feedback-full' ? 1 : 0.8
  }
  if (name === 'dense-effects' || name === 'dense-hot' || name === 'dense-extreme') {
    config.synth.lead.reverbMix = 1
    config.synth.lead.delayFeedback = 1
    config.sound.octaves = { bass: 1, pad: -1, lead: 1 }
  }
  if (name === 'dense-hot') config.synth.bass.volume = 12
  if (name === 'dense-extreme') {
    for (const voice of ['bass', 'pad', 'lead'] as const) config.synth[voice].volume = 40
    config.synth.bass.waveform = 'sawtooth'
    config.synth.bass.cutoff = 4000
    config.synth.bass.resonance = 5
    config.synth.lead.distortion = true
  }
  for (const voice of ['bass', 'pad', 'lead'] as const)
    mix.setLevel(voice, config.synth[voice].volume)
  context.transport.bpm.value = 90
  const graph = new StudioAudioGraph(context, config.synth, mix, config.sound)
  await graph.ready
  const switchTime = name.startsWith('bass-wave-') ? Number(name.split('-').at(-1)) / 1000 : 1.071
  if (name.startsWith('dense')) {
    const calendar = normalizeContributionCalendar({
      totalContributions: 1120,
      weeks: [
        {
          contributionDays: Array.from({ length: 56 }, (_, i) => ({
            date: new Date(Date.UTC(2026, 0, 4 + i)).toISOString().slice(0, 10),
            contributionCount: 20,
          })),
        },
      ],
    })
    const score = createScore(calendar, 'CodeRacon', 0, 8, config.sound)
    for (const event of score.events)
      if ((event.beat * 60) / 90 < seconds) graph.trigger(event, (event.beat * 60) / 90)
  } else {
    const lead = name === 'lead-octave' || name.startsWith('feedback')
    const event: ScoreEvent = {
      voice: lead ? 'lead' : 'bass',
      beat: 0,
      duration: name.startsWith('feedback') ? 0.25 : 3,
      notes: [lead ? 'C5' : 'C3'],
      velocity: 0.8,
      week: 0,
      day: 0,
    }
    graph.trigger(event, 0.1)
    if (name.endsWith('octave'))
      context.setTimeout(
        () =>
          graph.trigger({ ...event, notes: [name === 'lead-octave' ? 'C6' : 'C4'] }, context.now()),
        switchTime,
      )
  }
  // Native suspension applies a non-AudioParam waveform change during sample rendering,
  // rather than changing the entire offline oscillator before rendering has begun.
  const switchWave = name.startsWith('bass-wave')
    ? native.suspend(switchTime).then(async () => {
        config.synth.bass.waveform = name.includes('saw') ? 'sawtooth' : 'sine'
        graph.updateParams()
        await native.resume()
      })
    : Promise.resolve()
  const rendered = await context.render()
  await switchWave
  const audio = rendered.get()!
  const channels = Array.from({ length: audio.numberOfChannels }, (_, index) =>
    audio.getChannelData(index),
  )
  const data = channels[0]
  let peak = 0,
    clipped = 0,
    jump = 0,
    switchJump = 0,
    energy = 0,
    switchCurve = 0,
    initialEnergy = 0,
    tailEnergy = 0
  for (const channel of channels) {
    for (const sample of channel) {
      peak = Math.max(peak, Math.abs(sample))
      if (Math.abs(sample) > 1) clipped++
    }
  }
  for (let i = 1; i < data.length; i++) {
    const step = Math.abs(data[i] - data[i - 1])
    jump = Math.max(jump, step)
    if (Math.abs(i / 44100 - switchTime) < 0.012) {
      switchJump = Math.max(switchJump, step)
      if (i > 1)
        switchCurve = Math.max(switchCurve, Math.abs(data[i] - 2 * data[i - 1] + data[i - 2]))
    }
    energy += data[i] * data[i]
    if (i < 44100) initialEnergy += data[i] * data[i]
    if (i > data.length - 44100) tailEnergy += data[i] * data[i]
  }
  graph.dispose()
  rendered.dispose()
  context.dispose()
  return {
    name,
    peak,
    clipped,
    jump,
    switchJump,
    switchCurve,
    rms: Math.sqrt(energy / data.length),
    tailRatio: Math.sqrt(tailEnergy / initialEnergy),
  }
}
Object.assign(window, { audioProbe: renderAudioCase })
document.querySelector('#ready')!.textContent = 'Ready'
