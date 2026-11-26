/* Coach engine: a small learning model per exercise. Pure functions only, so the same
   history always gives the same plan (and tests can replay it).

   - Capacity = exponentially weighted moving average of what you did ÷ the exercise's base dose,
     nudged by RPE, with its variance tracked.
   - Today's dose = capacity × readiness, capped at ±12% per session (and ±20% per week on the right arm).
   - Families: advance a rung after two sessions above the range with RPE ≤ 7 and no pain; regress on a miss,
     RPE ≥ 9, pain ≥ 2/10 or a worse next morning. A plateau swaps to a sibling picked by Thompson sampling.
   - Safety always wins: no progress unless pain stayed ≤ 1/10 and the next morning was back to baseline. */

export type Session = {
  date: string
  id: string
  ratio: number    // what you did ÷ the base dose (1 = base)
  dose: number     // what was prescribed ÷ the base dose
  rpe?: number     // 1–10, hardest set of the day
  pain: number     // highest forearm pain logged during the sets
  morning?: number // next-morning pain minus that morning's (undefined = not logged)
}
export type Member = { id: string; name: string; rung: number; allowed: boolean; top: number; right: boolean; lock?: string }
export type Plan = { id: string; dose: number; extraSet: boolean; why?: string; moved?: 'up' | 'down' | 'swap' }

const ALPHA = 0.35
const STEP = 0.12, WEEK = 0.2
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))

/* RPE 8 is on target; easier sets count as spare capacity, harder ones as less. Unlogged RPE ≈ 7. */
export const rpeFactor = (rpe?: number) => rpe === undefined ? 1.02 : clamp(1 + 0.04 * (8 - rpe), 0.88, 1.12)

export function learn(sessions: Session[]) {
  let mean = 1, variance = 0
  const series: number[] = []
  sessions.forEach((s, i) => {
    const x = s.ratio * rpeFactor(s.rpe)
    if (i === 0) mean = x
    else { const diff = x - mean; mean += ALPHA * diff; variance = (1 - ALPHA) * (variance + ALPHA * diff * diff) }
    series.push(mean)
  })
  return { mean, variance, series }
}

export type Check = { sleep?: number; soreness?: number; hr?: number; baseline?: number; pain?: number }
export function readiness(c: Check) {
  const hits: [number, string][] = []
  if (c.sleep !== undefined && c.sleep < 6) hits.push([0.1, `${c.sleep} h sleep`])
  else if (c.sleep !== undefined && c.sleep < 7) hits.push([0.05, `${c.sleep} h sleep`])
  if ((c.soreness ?? 0) > 72) hits.push([0.1, 'soreness over 72 h'])
  else if ((c.soreness ?? 0) > 48) hits.push([0.05, 'soreness over 48 h'])
  if (c.hr !== undefined && c.baseline !== undefined && c.hr - c.baseline >= 5) hits.push([0.1, 'resting HR +5'])
  else if (c.hr !== undefined && c.baseline !== undefined && c.hr - c.baseline >= 3) hits.push([0.05, 'resting HR +3'])
  if ((c.pain ?? 0) > 0) hits.push([0.05 * c.pain!, `forearm ${c.pain}/10`])
  return { value: Math.max(0.75, 1 - hits.reduce((sum, [cut]) => sum + cut, 0)), why: hits.map(([, why]) => why).join(', ') }
}

/* Seeded random numbers so a plateau swap is the same all day. */
function random(seed: string) {
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return () => {
    h = (h + 0x6D2B79F5) | 0
    let t = Math.imul(h ^ (h >>> 15), 1 | h)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const gamma = (shape: number, next: () => number) => { let x = 0; for (let i = 0; i < shape; i++) x -= Math.log(1 - next()); return x }
/* Thompson sampling over "improved without pain": draw from each Beta(wins + 1, losses + 1), take the best. */
export function thompson(options: { id: string; wins: number; losses: number }[], seed: string) {
  const next = random(seed)
  let best = options[0].id, top = -1
  for (const o of options) {
    const a = gamma(o.wins + 1, next), b = gamma(o.losses + 1, next), p = a / (a + b)
    if (p > top) { top = p; best = o.id }
  }
  return best
}
function record(sessions: Session[]) {
  let wins = 0
  sessions.forEach((s, i) => {
    const before = i ? learn(sessions.slice(0, i)).mean : 1
    if (s.ratio * rpeFactor(s.rpe) > before && s.pain < 2 && (s.morning ?? 0) <= 0) wins++
  })
  return { wins, losses: sessions.length - wins }
}

const DAY = 86400000
export function plan(o: { date: string; slot: string; members: Member[]; sessions: Session[]; ready: number; readyWhy?: string }): Plan | undefined {
  const allowed = o.members.filter(m => m.allowed)
  if (!allowed.length) return undefined
  const last = o.sessions.at(-1)
  // Stay on what you did last; if that is no longer allowed, take the highest allowed rung not above it; else the default.
  const lastRung = o.members.find(m => m.id === last?.id)?.rung ?? 0
  const fallback = allowed.filter(m => m.rung <= lastRung).at(-1)?.rung
  const cur = allowed.find(m => m.id === last?.id) ?? allowed.find(m => m.rung === fallback) ?? allowed[0]
  const at = (rung: number) => allowed.filter(m => m.rung === rung)
  const startDose = (m: Member) => clamp(learn(o.sessions.filter(s => s.id === m.id)).mean * o.ready, 0.6, 1)
  const mine = o.sessions.filter(s => s.id === cur.id)
  const end = mine.at(-1)
  const next = o.members.filter(m => m.rung === cur.rung + 1)
  const up = next.find(m => m.allowed)

  if (end && end === last) {
    const bad = end.pain >= 2 ? `pain ${end.pain}/10 last time` : (end.morning ?? 0) > 0 ? 'forearm was worse the next morning'
      : end.ratio < end.dose * 0.8 ? 'missed the target last time' : (end.rpe ?? 0) >= 9 ? `RPE ${end.rpe} last time` : ''
    if (bad) {
      const down = at(cur.rung - 1)[0]
      if (down) return { id: down.id, dose: startDose(down), extraSet: false, moved: 'down', why: `Back to ${down.name}: ${bad}` }
      return { id: cur.id, dose: clamp(Math.min(end.dose * (1 - STEP), learn(mine).mean * o.ready), 0.6, cur.top), extraSet: false, why: bad }
    }
    const great = (s: Session) => s.ratio >= cur.top && (s.rpe ?? 7) <= 7 && s.pain === 0 && (s.morning ?? 0) <= 0 && (!cur.right || s.morning !== undefined)
    const two = mine.slice(-2)
    if (up && two.length === 2 && two.every(great)) return { id: up.id, dose: startDose(up), extraSet: false, moved: 'up', why: `Up to ${up.name}: beat the top of the range twice at RPE ≤ 7, no pain` }
    const series = learn(mine).series
    const peers = at(cur.rung)
    if (series.length >= 4 && series.at(-1)! <= series.at(-4)! * 1.01 && peers.length > 1) {
      const pick = thompson(peers.map(p => ({ id: p.id, ...record(o.sessions.filter(s => s.id === p.id)) })), o.date + '|' + o.slot)
      const peer = peers.find(p => p.id === pick)!
      if (pick !== cur.id) return { id: pick, dose: startDose(peer), extraSet: false, moved: 'swap', why: `Swapped to ${peer.name}: no gain in 3 sessions` }
    }
  }

  if (!end) return { id: cur.id, dose: o.ready, extraSet: false, why: o.ready < 1 ? `lighter today: ${o.readyWhy}` : undefined }
  let dose = learn(mine).mean * o.ready
  dose = clamp(dose, end.dose * (1 - STEP), end.dose * (1 + STEP))
  if (cur.right) {
    const weekAgo = mine.filter(s => Date.parse(s.date) <= Date.parse(o.date) - 7 * DAY).at(-1) ?? mine[0]
    dose = clamp(dose, weekAgo.dose * (1 - WEEK), weekAgo.dose * (1 + WEEK))
  }
  let why = dose > end.dose ? `hit target${mine.slice(-2).length === 2 && mine.slice(-2).every(s => s.ratio >= s.dose) ? ' twice' : ''}${end.rpe ? ` at RPE ${end.rpe}` : ''}, no pain`
    : dose < end.dose ? (o.ready < 1 ? `lighter today: ${o.readyWhy}` : 'capacity dipped') : undefined
  if (dose > end.dose && (end.pain > 1 || (end.morning ?? 0) > 0)) { dose = end.dose; why = undefined }
  if (dose > end.dose && cur.right && end.morning === undefined) { dose = end.dose; why = 'holding: log your morning forearm check to progress' }
  dose = clamp(dose, 0.6, cur.top)
  const maxed = dose >= cur.top && end.ratio >= cur.top && !up
  return { id: cur.id, dose, extraSet: maxed, why: maxed ? (next.length ? `top of the range; next rung waits for ${next[0].lock ?? 'its gate'}` : 'top of the range: +1 set') : why }
}
