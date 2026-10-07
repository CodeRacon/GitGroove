import type { Voice } from '@/music/score'

export interface VoiceMix {
  level: number
  muted: boolean
}

export class SynthMix {
  private voices: Record<Voice, VoiceMix> = {
    bass: { level: -8, muted: false },
    pad: { level: 4, muted: false },
    lead: { level: -16, muted: false },
  }
  private soloVoice: Voice | null = null
  private gated = true

  setLevel(voice: Voice, level: number): void {
    if (!Number.isFinite(level)) throw new Error('Invalid level.')
    this.voices[voice].level = level
  }

  setMute(voice: Voice, muted: boolean): void {
    this.voices[voice].muted = muted
  }

  toggleMute(voice: Voice): void {
    this.setMute(voice, !this.voices[voice].muted)
  }

  toggleSolo(voice: Voice): void {
    this.soloVoice = this.soloVoice === voice ? null : voice
  }

  setGate(open: boolean): void {
    this.gated = open
  }

  level(voice: Voice): number {
    return this.voices[voice].level
  }

  isMuted(voice: Voice): boolean {
    return this.voices[voice].muted
  }

  get solo(): Voice | null {
    return this.soloVoice
  }

  effectiveLevel(voice: Voice): number {
    const audible = this.gated &&
      (this.soloVoice === null ? !this.voices[voice].muted : this.soloVoice === voice)
    return audible ? this.voices[voice].level : -Infinity
  }
}
