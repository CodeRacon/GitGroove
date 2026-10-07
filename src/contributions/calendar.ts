export type ContributionLevel = 0 | 1 | 2 | 3 | 4

export interface ContributionDay {
  date: string
  count: number
  level: ContributionLevel
  outsideRange: boolean
}

export interface ContributionWeek {
  firstDay: string
  days: ContributionDay[]
}

export interface ContributionResponse {
  totalContributions: number
  weeks: ContributionWeek[]
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid GitHub contribution data.')
  }
  return value as Record<string, unknown>
}

function dateNumber(value: unknown): number {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('Invalid contribution date.')
  }
  const time = Date.parse(`${value}T00:00:00Z`)
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value) {
    throw new Error('Invalid contribution date.')
  }
  return time
}

function isoDate(time: number): string {
  return new Date(time).toISOString().slice(0, 10)
}

export function contributionLevel(count: number): ContributionLevel {
  if (count === 0) return 0
  if (count <= 5) return 1
  if (count <= 10) return 2
  if (count <= 19) return 3
  return 4
}

export function normalizeContributionCalendar(input: unknown): ContributionResponse {
  const calendar = record(input)
  if (!Array.isArray(calendar.weeks) || !Number.isInteger(calendar.totalContributions) ||
      (calendar.totalContributions as number) < 0) {
    throw new Error('Invalid GitHub contribution data.')
  }
  const days = new Map<number, number>()
  for (const rawWeek of calendar.weeks) {
    const week = record(rawWeek)
    const rawDays = week.contributionDays ?? week.days
    if (!Array.isArray(rawDays)) throw new Error('Invalid contribution week.')
    for (const rawDay of rawDays) {
      const day = record(rawDay)
      const time = dateNumber(day.date)
      const count = day.contributionCount ?? day.count
      if (!Number.isInteger(count) || (count as number) < 0 || days.has(time)) {
        throw new Error('Invalid or duplicate contribution day.')
      }
      days.set(time, count as number)
    }
  }
  if (days.size === 0) {
    if (calendar.totalContributions !== 0) throw new Error('Incomplete contribution calendar.')
    return { totalContributions: 0, weeks: [] }
  }
  const times = [...days.keys()].sort((a, b) => a - b)
  const first = times[0]
  const last = times[times.length - 1]
  for (let time = first; time <= last; time += 86_400_000) {
    if (!days.has(time)) throw new Error('Gap in contribution calendar.')
  }
  const start = first - new Date(first).getUTCDay() * 86_400_000
  const end = last + (6 - new Date(last).getUTCDay()) * 86_400_000
  const weeks: ContributionWeek[] = []
  for (let weekStart = start; weekStart <= end; weekStart += 7 * 86_400_000) {
    const weekDays: ContributionDay[] = []
    for (let step = 0; step < 7; step++) {
      const time = weekStart + step * 86_400_000
      const count = days.get(time) ?? 0
      weekDays.push({ date: isoDate(time), count, level: contributionLevel(count), outsideRange: !days.has(time) })
    }
    weeks.push({ firstDay: weekDays[0].date, days: weekDays })
  }
  return { totalContributions: calendar.totalContributions as number, weeks }
}
