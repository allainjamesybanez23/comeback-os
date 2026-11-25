import { circuitRows, cooldown, dailyMobility, days, expansion, foamRows, phases, rehabRows, sundayFlow, warmUp, type Exercise, type Section } from './data/comebackProgram'

export const startDate = '2026-11-09'
export const clearanceEarliest = '2027-01-01'
export type Status = 'full' | 'recovery' | 'skipped'
export type Module = 'workout' | 'mobility' | 'rehab' | 'foam'
export const moduleOrder: Module[] = ['workout', 'mobility', 'rehab', 'foam']
export const moduleLabel: Record<Module, string> = { workout: 'Workout', mobility: 'Stretching', rehab: 'Forearm rehab', foam: 'Ball handling' }
export type Check = { kcal?: number; protein?: number; water?: number; sleep?: number; weight?: number; hr?: number; soreness?: number }
export type Benchmark = { ankleL?: number; ankleR?: number; squat?: number; hipL?: number; hipR?: number; toes?: boolean }
export type SetLog = { contacts: number; reps?: number; kg?: number; at?: number }
export type DayLog = {
  status?: Status; reason?: string; pain?: number; stopped?: string[];
  sets?: Record<string, SetLog>; check?: Check; contacts?: number; rehab?: boolean
  done?: Partial<Record<Module, boolean>>; time?: Partial<Record<Module, number>>; started?: Partial<Record<Module, number>>
}
export type State = {
  version: 1
  logs: Record<string, DayLog>
  edits: Record<string, Exercise[]>
  schedule: Record<string, number>
  benchmarks: Record<string, Benchmark>
  clarity: string
  phase: number
  audio: boolean
  tempo: boolean
  voice?: boolean
  autoflow?: boolean
  reminders?: Reminder[]
  reminderPrefs?: { background: boolean; login: boolean }
  reminderLog?: Record<string, string>
  hrBaseline?: number
  weekOverride?: number
  deload?: string
}
export type ReminderTarget = Module | 'checkin' | 'bed'
export type Reminder = { id: string; label: string; time: string; days: number[]; target: ReminderTarget; on: boolean }
const everyDay = [0, 1, 2, 3, 4, 5, 6]
export const defaultReminders: Reminder[] = [
  { id: 'checkin', label: 'Morning check-in + weigh-in', time: '07:30', days: [0, 2, 4], target: 'checkin', on: false },
  { id: 'workout', label: 'Workout time', time: '17:00', days: everyDay, target: 'workout', on: false },
  { id: 'foam', label: 'Ball handling', time: '18:30', days: everyDay, target: 'foam', on: false },
  { id: 'rehab', label: 'Forearm rehab', time: '19:30', days: everyDay, target: 'rehab', on: false },
  { id: 'mobility', label: 'Stretch flow', time: '21:00', days: everyDay, target: 'mobility', on: false },
  { id: 'bed', label: 'Wind down for 8–9 h of sleep', time: '22:30', days: everyDay, target: 'bed', on: false },
]
/* Reminders due right now: enabled, scheduled today, within an hour after their time, not yet sent today. */
export function dueReminders(state: State, now: Date) {
  const key = dateKey(now)
  const minutes = now.getHours() * 60 + now.getMinutes()
  const day = (now.getDay() + 6) % 7
  return (state.reminders ?? defaultReminders).filter(reminder => {
    if (!reminder.on || !reminder.days.includes(day) || state.reminderLog?.[reminder.id] === key) return false
    const [h, m] = reminder.time.split(':').map(Number)
    const at = h * 60 + m
    return minutes >= at && minutes - at < 60
  })
}
export const fresh: State = { version: 1, logs: {}, edits: {}, schedule: {}, benchmarks: {}, clarity: '', phase: 0, audio: true, tempo: false, voice: true, autoflow: true }
export const dateKey = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}
export const parseDate = (key: string) => new Date(key + 'T12:00:00')
export function plusDays(key: string, number: number) {
  const date = parseDate(key)
  date.setDate(date.getDate() + number)
  return dateKey(date)
}
export const distance = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000)
export const dayIndex = (key: string) => (parseDate(key).getDay() + 6) % 7
export const monday = (key: string) => plusDays(key, -dayIndex(key))
export const dateLabel = (key: string, options: Intl.DateTimeFormatOptions) => parseDate(key).toLocaleDateString('en-US', options)
export const calendarWeek = (key: string) => Math.min(8, Math.max(1, 1 + Math.floor(distance(startDate, key) / 7)))
export const weekFor = (state: State, key: string) => state.weekOverride ?? calendarWeek(key)
export const editKey = (week: number, day: number, phase = 0) => week + '/' + day + '/' + phase
export const dayFor = (state: State, key: string) => state.schedule[key] ?? dayIndex(key)
export function eligiblePhase(clearance: string, key: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clearance) || clearance < clearanceEarliest || clearance > key) return 0
  return Math.min(4, 1 + Math.floor(distance(clearance, key) / 14))
}
export function activePhase(state: State, key: string) {
  return Math.max(0, Math.min(state.phase, eligiblePhase(state.clarity, key)))
}
export const deloadText = 'Swap the next hard session for recovery, or cut sets by one-third for a week. Prioritize sleep. If joint or tendon soreness keeps returning, reduce plyometrics and keep the isometrics.'

export function prescribed(day: number, week: number, phase = 0) {
  const base = days[day].main
  if ((day === 1 || day === 4) && phase > 0) {
    const next = phases[phase].rows
    return [...(phase === 4 ? base.filter(item => item.category !== 'Upper Band Strength') : base), ...next]
  }
  return base.map(baseItem => {
    const item = { ...baseItem }
    const block = item.block[0]
    const isLower = day === 0 || day === 3
    const isPlyo = day === 2 || day === 5
    const isUpper = day === 1 || day === 4
    if (isLower && (week === 1 || week === 4)) {
      item.sets = 3
      if (week === 4 && item.tempo) item.tempo = '2-0-1'
    }
    if (isLower && week === 2 && block === 'A') item.sets = 4
    if (isLower && week === 3 && (item.move === 'squatRack' || item.move === 'rdl' || item.move === 'rfess')) item.tempo = item.tempo.replace(/^3/, '4')
    if (isLower && week >= 5) {
      if (item.id === 'mon-C1' || item.id === 'thu-A2' || item.id === 'thu-C1') item.load = '17 kg · left hand only'
      if (item.id === 'mon-A1' && week < 8) item.tempo = '3-3-1'
      if (item.id === 'mon-B1' && week === 5) item.adjustment = 'One full rep plus a half rep'
      if (item.id === 'mon-B1' && week === 6) item.tempo = '3-3-1'
      if (item.id === 'thu-A1' && week < 8) item.tempo = '4-2-1'
      if (item.id === 'thu-B1' && week < 8) item.tempo = '4-0-1'
      if (week === 7) item.sets = 4
      if (week === 8) {
        item.sets = Math.min(item.sets, 3)
        if (item.tempo) item.tempo = '2-0-1'
        if (item.id === 'mon-A1' || item.id === 'mon-D2') item.adjustment = 'Retest controlled reps'
      }
    }
    if (isPlyo && item.category === 'Plyometrics & Speed') {
      if (week === 3 && block === 'B') item.sets += 1
      if (week === 4 || week === 8) item.sets = Math.max(1, Math.ceil(item.sets * 2 / 3))
      if (week === 2 && ((day === 2 && block === 'A') || (day === 5 && block === 'B'))) item.sets += 1
      if (week === 5 && item.id === 'wed-B2') {
        item.name = 'Low-step depth jump'
        item.adjustment = 'Step down, land softly, and rebound only while controlled'
      }
      if (week === 6 && item.id === 'wed-B1') {
        item.adjustment = 'Two consecutive jumps, then stick the landing'
        item.contacts = 16
      }
      if (week === 7) item.rest = Math.max(item.rest, 75)
      if (week === 8 && item.id === 'wed-B1') item.adjustment = 'Retest controlled jump reach'
    }
    if (isUpper && week >= 5 && week <= 7 && block === 'A') item.sets += 1
    if (isUpper && item.load === 'Light band') {
      if (week >= 3 && week <= 7 && ['tue-A1','tue-A2','fri-A2','fri-B1'].includes(item.id)) item.load = 'Left: progress band · right: light'
      if (week === 8) item.load = 'Easy band tension'
    }
    return item
  })
}

export function programSections(state: State, key: string, module: Module, today: string): Section[] {
  const phase = Math.min(activePhase(state, today), activePhase(state, key))
  const week = weekFor(state, key)
  const index = dayFor(state, key)
  if (module === 'rehab') return [{ id: 'rehab', name: 'Forearm rehab', rows: rehabRows }]
  if (module === 'mobility') return [{ id: 'mobility', name: index === 6 ? 'Long stretch flow' : 'Stretch flow', rows: index === 6 ? sundayFlow : dailyMobility }]
  if (module === 'foam') return [
    { id: 'foam', name: 'Left-hand handles', rows: foamRows },
    ...(phase ? [{ id: 'foam-expansion', name: 'Cleared two-hand expansion', rows: expansion }] : []),
  ]
  const edited = state.edits[editKey(week,index,phase)]
  let main = (edited ?? prescribed(index,week,phase)).filter(item => (item.minPhase ?? 0) <= phase)
  const reduced = Boolean(state.deload && key >= state.deload && distance(state.deload,key) < 7)
  if (reduced && days[index].level === 'Hard') main = main.map(item => ({ ...item, sets: Math.max(1, Math.round(item.sets * 2 / 3)) }))
  const setMain: Section = { id: 'main', name: 'Main work', rows: main }
  if (index === 6) return [
    { ...setMain, name: 'Recovery work', rows: main.filter(item => item.id !== 'sun-E') },
    ...(main.some(item => item.id === 'sun-E') ? [{ id: 'prep', name: 'Weekly prep', rows: main.filter(item => item.id === 'sun-E') }] : []),
  ]
  const sections: Section[] = [{ id: 'warm', name: 'Warm-up', rows: warmUp }, setMain]
  if (index === 5) {
    let rounds = circuitRows(week)
    if (reduced) rounds = rounds.slice(0, Math.max(1, Math.round(rounds.length / 5 * 2 / 3)) * 5)
    const finisher = main.find(item => item.id === 'sat-E')
    sections[1] = { ...setMain, rows: main.filter(item => item.id !== 'sat-E') }
    sections.push({ id: 'circuit', name: 'Dorm conditioning circuit', rows: rounds })
    if (finisher) sections.push({ id: 'finisher', name: 'Core finisher', rows: [finisher] })
  }
  return [...sections, { id: 'cooldown', name: 'Cooldown', rows: cooldown }]
}

export type Step = { id: string; section: string; item: Exercise; round: number; rest: number; nextInGroup: boolean }
export function queueFor(sections: Section[]): Step[] {
  const queue: Step[] = []
  for (const section of sections) {
    let cursor = 0
    while (cursor < section.rows.length) {
      const first = section.rows[cursor]
      const prefix = /^([A-Z])\d+$/.exec(first.block)?.[1]
      const group = [first]
      cursor++
      while (prefix && cursor < section.rows.length && /^([A-Z])\d+$/.exec(section.rows[cursor].block)?.[1] === prefix) {
        group.push(section.rows[cursor++])
      }
      for (let round = 1; round <= Math.max(...group.map(item => item.sets)); round++) {
        const live = group.filter(item => item.sets >= round)
        live.forEach((item, i) => {
          const nextInGroup = i < live.length - 1
          queue.push({ id: item.id + ':' + round, section: section.name, item, round, nextInGroup, rest: nextInGroup ? 0 : item.rest })
        })
      }
    }
  }
  return queue
}
export function blockedReason(item: Exercise, log: DayLog, phase: number) {
  if ((log.pain ?? 0) >= 3) return 'Stop this exercise for today. Forearm pain reached 3/10.'
  if (log.stopped?.includes(item.id)) return 'This exercise was stopped for today.'
  if ((item.minPhase ?? 0) > phase) return 'Surgeon clearance phase is required.'
  if (item.flag && (log.pain ?? 0) > 0) return 'This flagged move requires zero forearm pain.'
  if (phase === 0 && /(?:pull[ -]?ups?|dead[ -]?hangs?|floor push[ -]?ups?|hand planks?|planks? on (?:the )?hands?|push[ -]?ups? on (?:the )?floor)/i.test(item.name)) return 'Locked during Phase 0.'
  if (phase === 0 && /(?:\bdumbbells?\b|\bDB\b|\bkg\b)/i.test(item.load + ' ' + item.name) &&
      (!/^17 kg · left hand only$/.test(item.load) || /\bright\b/.test(item.name.toLowerCase()))) return 'Phase 0 dumbbell work must use 17 kg in the left hand only.'
  return ''
}
export function workSeconds(item: Exercise) {
  const simple = /^(\d+)\s*(s|min)(\s*\/\s*(leg|side|foot))?$/.exec(item.reps)
  if (item.seconds !== undefined) return item.seconds
  return simple ? Number(simple[1]) * (simple[2] === 'min' ? 60 : 1) * (simple[4] ? 2 : 1) : 0
}
export function recoveryReasons(state: State, key: string) {
  const log = state.logs[key] ?? {}
  const check = log.check ?? {}
  const reasons = []
  if ((log.pain ?? 0) >= 3) reasons.push('Forearm pain reached 3/10')
  if (state.hrBaseline !== undefined && check.hr !== undefined && check.hr - state.hrBaseline >= 5) reasons.push('Resting HR is +5 bpm or more above baseline')
  if ((check.soreness ?? 0) > 72) reasons.push('Soreness has lasted over 72 hours')
  return reasons
}
export function scheduleConflicts(state: State, date: string) {
  const dates = Array.from({ length: 9 }, (_, i) => plusDays(date, i - 4))
  return dates.slice(1).flatMap((key, i) => {
    const previous = dates[i]
    return days[dayFor(state, key)].level === 'Hard' && days[dayFor(state, previous)].level === 'Hard' ? [[previous, key]] : []
  })
}
export function statsFor(state: State, today: string) {
  const first = Object.keys(state.logs).filter(key => key <= today).sort()[0]
  const earliest = first && first < startDate ? first : startDate
  let longest = 0, streak = 0, rehab = 0
  const totalDays = Math.max(0, distance(earliest,today) + 1)
  for (let day = 0; day < totalDays; day++) {
    const key = plusDays(earliest, day)
    const log = state.logs[key]
    if (log?.status === 'full' || log?.status === 'recovery') streak++
    else if (key !== today || log?.status === 'skipped') streak = 0
    longest = Math.max(streak, longest)
    if (log?.rehab) rehab++
  }
  const contacts = Object.entries(state.logs).reduce((total, [key, log]) => {
    if (key < monday(today) || key > today) return total
    return total + (log.contacts ?? 0) + Object.values(log.sets ?? {}).reduce((sum, set) => sum + set.contacts, 0)
  }, 0)
  return { longest, streak, rehab: totalDays ? Math.round(rehab / totalDays * 100) : 0, contacts }
}
export function weightTrend(state: State, today: string) {
  const current = monday(today)
  const weeks = [-21, -14, -7, 0].map(offset => {
    const start = plusDays(current, offset)
    const values = Object.entries(state.logs).filter(([key, log]) => key >= start && key < plusDays(start, 7) && key <= today && log.check?.weight !== undefined).map(([,log]) => log.check!.weight!)
    return { start, count: values.length, average: values.length ? values.reduce((a,b) => a + b,0) / values.length : undefined }
  })
  const end = weeks[3].count >= 3 ? 3 : 2
  const a = weeks[end - 2], b = weeks[end - 1], c = weeks[end]
  const delta = c.count >= 3 && b.count >= 3 ? c.average! - b.average! : undefined
  const advice = delta !== undefined && delta > 0.5 ? 'Program adjustment: −200 kcal/day' :
    a.count >= 3 && b.count >= 3 && c.count >= 3 && c.average! - a.average! <= 0 ? 'Program adjustment: +200 kcal/day' : ''
  return { weeks, delta, advice }
}

/* ---------- Session helpers ---------- */
export function sessionDone(log: DayLog | undefined, module: Module) {
  if (!log) return false
  if (log.done?.[module]) return true
  if (module === 'workout') return log.status === 'full'
  if (module === 'rehab') return Boolean(log.rehab)
  return false
}
export function targetReps(reps: string) {
  const match = /^(\d+)/.exec(reps.trim())
  return match && !/\b(s|min)\b/.test(reps.split(/\s*[×x+]\s*/)[0]) ? Number(match[1]) : undefined
}
export function loadKg(load: string) {
  if (/\d\s*[–-]\s*\d+\s*kg/i.test(load)) return undefined
  const match = /(\d+(?:\.\d+)?)\s*kg/i.exec(load)
  return match ? Number(match[1]) : undefined
}
const perSide = (reps: string) => /\/\s*(leg|side|arm|foot)|each/.test(reps)
export function stepSeconds(item: Exercise) {
  const work = workSeconds(item)
  if (work) return work
  const reps = targetReps(item.reps) ?? 10
  const tempo = item.tempo ? item.tempo.split('-').map(Number).reduce((a, b) => a + b, 0) : 2.6
  return Math.min(150, Math.max(25, reps * tempo * (perSide(item.reps) ? 2 : 1)))
}
export function sessionMinutes(sections: Section[]) {
  const queue = queueFor(sections)
  const total = queue.reduce((sum, step) => sum + stepSeconds(step.item) + step.rest + 8, 0)
  return Math.max(5, Math.round(total / 60))
}
export function sessionStats(sections: Section[], log: DayLog) {
  const queue = queueFor(sections)
  const done = queue.filter(step => log.sets?.[step.id]).length
  return { sets: queue.length, done, exercises: new Set(queue.map(step => step.item.id)).size }
}
export type History = { date: string; sets: SetLog[] }[]
export function historyFor(state: State, id: string, before?: string): History {
  return Object.entries(state.logs)
    .filter(([key, log]) => (!before || key < before) && log.sets && Object.keys(log.sets).some(set => set.startsWith(id + ':')))
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, log]) => ({ date, sets: Object.entries(log.sets!).filter(([set]) => set.startsWith(id + ':'))
      .sort(([a], [b]) => Number(a.split(':')[1]) - Number(b.split(':')[1])).map(([, set]) => set) }))
}
export function bestSet(history: History) {
  let best: SetLog | undefined
  for (const day of history) for (const set of day.sets) {
    if (set.reps === undefined) continue
    if (!best || (set.kg ?? 0) > (best.kg ?? 0) || ((set.kg ?? 0) === (best.kg ?? 0) && set.reps > (best.reps ?? 0))) best = set
  }
  return best
}
export function weekRings(state: State, today: string) {
  const start = monday(today)
  const dates = Array.from({ length: 7 }, (_, i) => plusDays(start, i))
  const count = (module: Module) => dates.filter(date => sessionDone(state.logs[date], module)).length
  return { workout: count('workout'), rehab: count('rehab'), mobility: count('mobility'), foam: count('foam'), goal: 7, dates }
}

/* Every logged session duration, newest first. */
export type SessionTime = { date: string; module: Module; seconds: number; started?: number }
export function sessionTimes(state: State, today: string): SessionTime[] {
  return Object.entries(state.logs)
    .filter(([date]) => date <= today)
    .flatMap(([date, log]) => moduleOrder.filter(m => (log.time?.[m] ?? 0) > 0).map(m => ({ date, module: m, seconds: log.time![m]!, started: log.started?.[m] })))
    .sort((a, b) => b.date.localeCompare(a.date) || moduleOrder.indexOf(a.module) - moduleOrder.indexOf(b.module))
}
export function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60)
  if (seconds > 0 && minutes < 1) return '<1 min'
  if (minutes < 60) return minutes + ' min'
  return Math.floor(minutes / 60) + ' h ' + String(minutes % 60).padStart(2, '0') + ' min'
}

/* ---------- Strength progress ---------- */
export type ProgressPoint = { date: string; sets: number; totalReps: number; best: number; bestKg: number; volume: number }
export function exerciseSeries(state: State, id: string): ProgressPoint[] {
  return historyFor(state, id).filter(day => day.sets.some(set => set.reps !== undefined)).reverse().map(day => {
    const sets = day.sets.filter(set => set.reps !== undefined)
    const top = sets.reduce((a, b) => ((b.kg ?? 0) > (a.kg ?? 0) || ((b.kg ?? 0) === (a.kg ?? 0) && (b.reps ?? 0) > (a.reps ?? 0)) ? b : a), sets[0])
    return {
      date: day.date, sets: sets.length,
      totalReps: sets.reduce((sum, set) => sum + (set.reps ?? 0), 0),
      best: top.reps ?? 0, bestKg: top.kg ?? 0,
      volume: Math.round(sets.reduce((sum, set) => sum + (set.reps ?? 0) * (set.kg ?? 0), 0)),
    }
  })
}
/* Exercises that have logged reps, most-trained first. */
export function trainedExercises(state: State) {
  const counts = new Map<string, number>()
  for (const log of Object.values(state.logs)) {
    const seen = new Set<string>()
    for (const [key, set] of Object.entries(log.sets ?? {})) if (set.reps !== undefined) seen.add(key.split(':')[0])
    for (const id of seen) counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id, sessions]) => ({ id, sessions }))
}
export type WeekTotals = { start: string; sets: number; reps: number; volume: number; seconds: number; contacts: number }
export function weekTotals(state: State, start: string, length = 7): WeekTotals {
  const end = plusDays(start, length)
  const out: WeekTotals = { start, sets: 0, reps: 0, volume: 0, seconds: 0, contacts: 0 }
  for (const [key, log] of Object.entries(state.logs)) {
    if (key < start || key >= end) continue
    out.seconds += Object.values(log.time ?? {}).reduce((sum, value) => sum + (value ?? 0), 0)
    out.contacts += log.contacts ?? 0
    for (const set of Object.values(log.sets ?? {})) {
      out.sets++
      out.reps += set.reps ?? 0
      out.volume += (set.reps ?? 0) * (set.kg ?? 0)
      out.contacts += set.contacts
    }
  }
  out.volume = Math.round(out.volume)
  return out
}
export const recentWeeks = (state: State, today: string, count = 8) =>
  Array.from({ length: count }, (_, i) => weekTotals(state, plusDays(monday(today), (i - count + 1) * 7)))
