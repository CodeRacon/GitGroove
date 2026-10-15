import { BASS_WAVEFORMS, defaultSynthParams, SYNTH_RANGES, type SynthParams } from '@/audio/params'
import { normalizeContributionCalendar, type ContributionResponse } from '@/contributions/calendar'
import { SCORE_MAPPING_VERSION, type Voice } from '@/music/score'
import { ROOT_KEYS, ARPEGGIO_PATTERNS, type StudioConfig, type Octave } from './state'

export const SNAPSHOT_VERSION = 1
export const SOUND_VERSION = 2
const VOICES: Voice[] = ['bass', 'pad', 'lead']

export interface MixSnapshot {
  muted: Record<Voice, boolean>
  solo: Voice | null
}
export interface StudioSnapshot extends StudioConfig {
  schemaVersion: 1
  mappingVersion: number
  soundVersion: 2
  profile: string
  calendar: ContributionResponse
  bpm: number
  mix: MixSnapshot
}

export type SnapshotData = Omit<StudioSnapshot, 'calendar'> & {
  calendar: { firstDay: string; counts: number[]; range: [number, number]; total: number }
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid snapshot data.')
  return value as Record<string, unknown>
}
function number(value: unknown, min: number, max: number, integer = false): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < min ||
    value > max ||
    (integer && !Number.isInteger(value))
  )
    throw new Error('A snapshot setting is outside its supported range.')
  return value
}
function boolean(value: unknown): boolean {
  if (typeof value !== 'boolean') throw new Error('Invalid snapshot switch setting.')
  return value
}
function choice<T extends string | number>(value: unknown, options: readonly T[]): T {
  if (!options.includes(value as T)) throw new Error('Unsupported snapshot setting.')
  return value as T
}

function packCalendar(calendar: ContributionResponse) {
  const days = calendar.weeks.flatMap((week) => week.days)
  const from = days.findIndex((day) => !day.outsideRange)
  let to = days.length - 1
  while (to >= 0 && days[to].outsideRange) to--
  if (from < 0 || to < from) throw new Error('Load a contribution calendar before sharing.')
  return {
    firstDay: days[0].date,
    counts: days.map((day) => day.count),
    range: [from, to] as [number, number],
    total: calendar.totalContributions,
  }
}

function unpackCalendar(input: unknown): ContributionResponse {
  const data = object(input)
  if (typeof data.firstDay !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data.firstDay))
    throw new Error('Invalid snapshot calendar date.')
  const first = Date.parse(data.firstDay + 'T00:00:00Z')
  if (
    !Number.isFinite(first) ||
    new Date(first).toISOString().slice(0, 10) !== data.firstDay ||
    new Date(first).getUTCDay() !== 0
  )
    throw new Error('Invalid snapshot calendar date.')
  if (
    !Array.isArray(data.counts) ||
    data.counts.length < 7 ||
    data.counts.length > 378 ||
    data.counts.length % 7 !== 0 ||
    !Array.isArray(data.range) ||
    data.range.length !== 2
  )
    throw new Error('Invalid snapshot calendar size.')
  const from = number(data.range[0], 0, data.counts.length - 1, true)
  const to = number(data.range[1], from, data.counts.length - 1, true)
  if (from > 6 || to < data.counts.length - 7)
    throw new Error('Invalid snapshot calendar boundaries.')
  const counts = data.counts.map((count) => number(count, 0, 2_147_483_647, true))
  if (counts.some((count, index) => (index < from || index > to) && count !== 0))
    throw new Error('Invalid snapshot placeholder.')
  return normalizeContributionCalendar({
    totalContributions: number(data.total, 0, Number.MAX_SAFE_INTEGER, true),
    weeks: [
      {
        contributionDays: counts.slice(from, to + 1).map((count, index) => ({
          date: new Date(first + (from + index) * 86_400_000).toISOString().slice(0, 10),
          contributionCount: count,
        })),
      },
    ],
  })
}

export function snapshotToData(snapshot: StudioSnapshot): SnapshotData {
  return { ...snapshot, calendar: packCalendar(snapshot.calendar) }
}

export function snapshotFromData(input: unknown): StudioSnapshot {
  const data = object(input)
  if (
    data.schemaVersion !== SNAPSHOT_VERSION ||
    (data.mappingVersion !== 2 && data.mappingVersion !== SCORE_MAPPING_VERSION) ||
    (data.soundVersion !== 1 && data.soundVersion !== SOUND_VERSION)
  )
    throw new Error('This sound uses a snapshot version that GitGroove cannot open.')
  if (
    typeof data.profile !== 'string' ||
    !/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(data.profile)
  )
    throw new Error('Invalid snapshot profile.')
  const calendar = unpackCalendar(data.calendar)
  const selection = object(data.selection)
  const weekCount = number(selection.weekCount, 1, calendar.weeks.length, true)
  const startWeek = number(selection.startWeek, 0, calendar.weeks.length - weekCount, true)
  const rawSynth = object(data.synth)
  const synth = defaultSynthParams()
  for (const voice of VOICES) {
    const source = object(rawSynth[voice])
    const target = synth[voice] as unknown as Record<string, number | boolean | string>
    for (const [key, [min, max]] of Object.entries(SYNTH_RANGES[voice]))
      target[key] = number(source[key], min, max)
  }
  synth.bass.waveform = choice(object(rawSynth.bass).waveform, BASS_WAVEFORMS)
  synth.pad.chorus = boolean(object(rawSynth.pad).chorus)
  synth.lead.distortion = boolean(object(rawSynth.lead).distortion)
  const sound = object(data.sound)
  const octaves = object(sound.octaves)
  const patterns =
    data.mappingVersion === 2 ? { bass: 'original', lead: 'original' } : object(sound.patterns)
  const rawMix = object(data.mix)
  const muted = object(rawMix.muted)
  const view = object(data.view)
  return {
    schemaVersion: SNAPSHOT_VERSION,
    mappingVersion: SCORE_MAPPING_VERSION,
    // Version 1 retains all controls and notes, using the corrected version 2 output stage.
    soundVersion: SOUND_VERSION,
    profile: data.profile,
    calendar,
    selection: { startWeek, weekCount },
    synth,
    sound: {
      key: choice(sound.key, ROOT_KEYS),
      patterns: {
        bass: choice(patterns.bass, ARPEGGIO_PATTERNS),
        lead: choice(patterns.lead, ARPEGGIO_PATTERNS),
      },
      octaves: Object.fromEntries(
        VOICES.map((voice) => [voice, number(octaves[voice], -1, 1, true) as Octave]),
      ) as Record<Voice, Octave>,
      leadFocus: number(sound.leadFocus, 0, 100),
    },
    bpm: number(data.bpm, 30, 300),
    mix: {
      muted: Object.fromEntries(VOICES.map((voice) => [voice, boolean(muted[voice])])) as Record<
        Voice,
        boolean
      >,
      solo: rawMix.solo === null ? null : choice(rawMix.solo, VOICES),
    },
    view: { padEnvelope: choice(view.padEnvelope, ['amplitude', 'modulation'] as const) },
  }
}

export function captureSnapshot(
  config: StudioConfig,
  profile: string,
  calendar: ContributionResponse,
  bpm: number,
  mix: MixSnapshot,
): StudioSnapshot {
  // Validation also makes a detached copy: later edits cannot change a captured sound.
  return snapshotFromData(
    snapshotToData({
      ...config,
      schemaVersion: SNAPSHOT_VERSION,
      mappingVersion: SCORE_MAPPING_VERSION,
      soundVersion: SOUND_VERSION,
      profile,
      calendar,
      bpm,
      mix,
    }),
  )
}

export function applySynthParams(target: SynthParams, source: SynthParams): void {
  for (const voice of VOICES) Object.assign(target[voice], source[voice])
}
