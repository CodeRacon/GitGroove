import { beforeAll, describe, expect, it, vi } from 'vitest'
import { CompressionStream, DecompressionStream } from 'node:stream/web'
import { deflateSync } from 'node:zlib'
import { normalizeContributionCalendar } from '@/contributions/calendar'
import { createScore } from '@/music/score'
import { defaultStudioConfig } from './state'
import { captureSnapshot, snapshotFromData, snapshotToData } from './snapshot'
import { decodeSnapshot, encodeSnapshot } from './share'
import { SYNTH_RANGES } from '@/audio/params'

beforeAll(() => {
  vi.stubGlobal('CompressionStream', CompressionStream)
  vi.stubGlobal('DecompressionStream', DecompressionStream)
})

function source() {
  const days = Array.from({ length: 365 }, (_, index) => ({
    date: new Date(Date.UTC(2025, 0, 6 + index)).toISOString().slice(0, 10),
    contributionCount: index % 23,
  }))
  const calendar = normalizeContributionCalendar({
    totalContributions: days.reduce((sum, day) => sum + day.contributionCount, 0),
    weeks: [{ contributionDays: days }],
  })
  const config = defaultStudioConfig()
  for (const voice of ['bass', 'pad', 'lead'] as const) {
    const values = config.synth[voice] as unknown as Record<string, number | string | boolean>
    for (const [key, [min, max]] of Object.entries(SYNTH_RANGES[voice]))
      values[key] = (min + max) / 2
  }
  config.selection = { startWeek: 12, weekCount: 16 }
  config.sound = { key: 'Eb', octaves: { bass: -1, pad: 0, lead: 1 }, leadFocus: 35 }
  config.synth.bass.waveform = 'sawtooth'
  config.synth.pad.modDecay = 2.1
  config.synth.lead.distortion = true
  config.view.padEnvelope = 'modulation'
  const snapshot = captureSnapshot(config, 'CodeRacon', calendar, 147, {
    muted: { bass: true, pad: false, lead: false },
    solo: 'bass',
  })
  return { config, calendar, snapshot }
}

describe('sound snapshots', () => {
  it('restores every setting, date, count and partial-week placeholder without fetching GitHub', async () => {
    const { snapshot } = source()
    const restored = await decodeSnapshot(await encodeSnapshot(snapshot))
    expect(restored).toEqual(snapshot)
    expect(restored.calendar.weeks).toHaveLength(53)
    expect(restored.calendar.weeks[0].days[0].outsideRange).toBe(true)
    expect(
      createScore(
        restored.calendar,
        restored.profile,
        restored.selection.startWeek,
        restored.selection.weekCount,
        restored.sound,
      ),
    ).toEqual(
      createScore(
        snapshot.calendar,
        snapshot.profile,
        snapshot.selection.startWeek,
        snapshot.selection.weekCount,
        snapshot.sound,
      ),
    )
  })

  it('captures independent values so later calendar or knob edits do not change a shared sound', () => {
    const { snapshot, config, calendar } = source()
    config.synth.pad.modDecay = 1
    config.sound.octaves.lead = 0
    calendar.weeks[1].days[1].count = 99
    expect(snapshot.synth.pad.modDecay).toBe(2.1)
    expect(snapshot.sound.octaves.lead).toBe(1)
    expect(snapshot.calendar.weeks[1].days[1].count).not.toBe(99)
  })

  it('upgrades old sound links without changing their calendar, notes or control settings', () => {
    const { snapshot } = source()
    const legacy = { ...snapshotToData(snapshot), soundVersion: 1 }
    expect(snapshotFromData(legacy)).toEqual(snapshot)
    expect(snapshotFromData(legacy).soundVersion).toBe(2)
    expect(() => snapshotFromData({ ...legacy, soundVersion: 999 })).toThrow(/version/)
  })

  it('rejects unsupported versions, invalid ranges and untrusted synth values', () => {
    const { snapshot } = source()
    const data = structuredClone(snapshotToData(snapshot))
    expect(() => snapshotFromData({ ...data, mappingVersion: 999 })).toThrow(/version/)
    expect(() => snapshotFromData({ ...data, selection: { startWeek: 52, weekCount: 8 } })).toThrow(
      /range/,
    )
    data.synth.bass.cutoff = Infinity
    expect(() => snapshotFromData(data)).toThrow(/range/)
    data.synth.bass.cutoff = 240
    data.calendar.counts[0] = 20
    expect(() => snapshotFromData(data)).toThrow(/placeholder/)
  })

  it('rejects corrupt, oversized and future share links', async () => {
    await expect(decodeSnapshot('v9.abc')).rejects.toThrow(/unsupported/)
    await expect(decodeSnapshot('v1.not-a-compressed-sound')).rejects.toThrow(/damaged/)
    await expect(decodeSnapshot('v1.' + 'a'.repeat(12_001))).rejects.toThrow()
    const oversizedJson = deflateSync('x'.repeat(40_000)).toString('base64url')
    await expect(decodeSnapshot('v1.' + oversizedJson)).rejects.toThrow(/too large/)
  })
})
