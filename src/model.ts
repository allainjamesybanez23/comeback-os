import { circuitRows, cooldown, dailyMobility, days, expansion, foamRows, phases, rehabRows, sundayMobility, warmUp, type Exercise, type Section } from './data/comebackProgram'

export const startDate = '2026-11-09'
export const clearanceEarliest = '2027-01-01'
export type Status = 'full' | 'recovery' | 'skipped'
export type Module = 'workout' | 'mobility' | 'rehab' | 'foam'
export type Check = { kcal?: number; protein?: number; water?: number; sleep?: number; weight?: number; hr?: number; soreness?: number }
export type Benchmark = { ankleL?: number; ankleR?: number; squat?: number; hipL?: number; hipR?: number; toes?: boolean }
export type SetLog = { contacts: number }
export type DayLog = {
  status?: Status; reason?: string; pain?: number; stopped?: string[];
  sets?: Record<string, SetLog>; check?: Check; contacts?: number; rehab?: boolean
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
  hrBaseline?: number
  weekOverride?: number
  deload?: string
}
export const fresh: State = { version: 1, logs: {}, edits: {}, schedule: {}, benchmarks: {}, clarity: '', phase: 0, audio: true, tempo: false }
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
      if (week === 2 && (item.id === 'wed-A1' || item.id === 'sat-B2')) item.sets += 1
      if (week === 5 && item.id === 'wed-B2') {
        item.name = 'Low-step depth jump'
        item.adjustment = 'Step down, land softly, and rebound only while controlled'
      }
      if (week === 6 && item.id === 'wed-B1') {
        item.adjustment = 'Two consecutive jumps, then stick the landing'
        item.contacts = 12
      }
      if (week === 7) item.rest = Math.max(item.rest, 75)
      if (week === 8 && item.id === 'wed-B1') item.adjustment = 'Retest controlled jump reach'
    }
    if (isUpper && item.load === 'Light band') {
      if (week >= 3 && week <= 7 && ['tue-A1','tue-A2','fri-A1','fri-B1'].includes(item.id)) item.load = 'Left: progress band · right: light'
      if (week >= 5 && week <= 7 && block === 'A') item.sets += 1
      if (week === 8) item.load = 'Easy band tension'
    }
    return item
  })
}

export function programSections(state: State, key: string, module: Module, today: string): Section[] {
  const phase = Math.min(activePhase(state, today), activePhase(state, key))
  const week = weekFor(state, key)
  const index = dayFor(state, key)
  const rehab: Section = { id: 'rehab', name: 'Forearm rehab', duration: '10 min', rows: rehabRows }
  const mob: Section = { id: 'mobility', name: index === 6 ? 'Long mobility' : 'Mobility flow', duration: index === 6 ? '25 min' : '12 min', rows: index === 6 ? [...dailyMobility, ...sundayMobility] : dailyMobility }
  if (module === 'rehab') return [rehab]
  if (module === 'mobility') return [mob]
  if (module === 'foam') return [
    { id: 'foam', name: 'Left-hand flow', duration: '12–15 min target', rows: foamRows },
    ...(phase ? [{ id: 'foam-expansion', name: 'Cleared two-hand expansion', rows: expansion }] : []),
  ]
  const edited = state.edits[editKey(week,index,phase)]
  let main = (edited ?? prescribed(index,week,phase)).filter(item => (item.minPhase ?? 0) <= phase)
  const reduced = Boolean(state.deload && key >= state.deload && distance(state.deload,key) < 7)
  if (reduced && days[index].level === 'Hard') main = main.map(item => ({ ...item, sets: Math.max(1, Math.round(item.sets * 2 / 3)) }))
  const setMain: Section = { id: 'main', name: days[index].title, rows: index === 6 ? main.filter(item => item.id !== 'sun-E') : main }
  const finish: Section = { id: 'cooldown', name: 'Cooldown', duration: '5 min', rows: cooldown }
  if (index === 6) return [setMain, mob, rehab, { id: 'prep', name: 'Weekly prep', rows: main.filter(item => item.id === 'sun-E') }, finish]
  const sections = [{ id: 'warm', name: 'Dynamic warm-up', duration: '10 min', rows: warmUp }, setMain]
  if (index === 5) {
    let rounds = circuitRows(week)
    if (reduced) rounds = rounds.slice(0, Math.max(1, Math.round(rounds.length / 5 * 2 / 3)) * 5)
    const withoutFinisher = { ...setMain, rows: main.filter(item => item.id !== 'sat-E') }
    const finisher = main.find(item => item.id === 'sat-E')
    sections[1] = withoutFinisher
    sections.push({ id: 'circuit', name: 'Dorm conditioning circuit', rows: rounds })
    if (finisher) sections.push({ id: 'finisher', name: 'Core finisher', rows: [finisher] })
  }
  return [...sections, rehab, finish, mob]
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
