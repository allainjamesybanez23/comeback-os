import { useEffect, useId, useMemo, useState, type ReactNode } from 'react'
import { ClipboardList, Pause, Play } from 'lucide-react'
import type { Exercise } from '../data/comebackProgram'
import { motionFor, type Anchor, type Ball, type Ease, type Key, type Motion } from '../anim/motions'
import { mix, project, solve, type Camera, type Pose, type Solved, type V3 } from '../anim/rig'
import { CloseUpSvg, closeUpLength } from '../anim/CloseUp'

/* ---------- Timeline ---------- */
type TKey = Key & { d: number; hold: number }
type Timeline = { keys: TKey[]; times: number[]; T: number; labels: string[]; solved: Solved[] }
const easeFn: Record<Ease, (u: number) => number> = {
  linear: u => u,
  in: u => u * u,
  out: u => 1 - (1 - u) * (1 - u),
  inout: u => u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2,
}
function protect(pose: Pose, on: boolean): Pose {
  return on ? { ...pose, rh: { r: [15, -32, -5] }, rhPole: [-1, -0.6, 0.35] } : pose
}
function buildTimeline(motion: Motion, tempo: string, guard: boolean): Timeline {
  const keys: TKey[] = motion.keys!.map(key => ({ ...key, d: key.d ?? 0.8, hold: key.hold ?? 0, pose: protect(key.pose, guard) }))
  const labels = keys.map(key => key.label ?? '')
  const parts = tempo.split('-').map(Number)
  if (motion.tempo && parts.length === 3 && parts.every(n => Number.isFinite(n))) {
    const { down, up, pause = 'down' } = motion.tempo
    keys[down].d = Math.max(0.5, parts[0])
    keys[up].d = Math.max(0.45, parts[2])
    if (parts[1] > 0) keys[pause === 'down' ? down : up].hold = parts[1]
    labels[down] = (labels[down] || 'Lower') + ' · ' + parts[0] + ' s'
    labels[up] = (labels[up] || 'Drive') + ' · ' + parts[2] + ' s'
  }
  for (let i = 0; i < labels.length; i++) if (!labels[i]) labels[i] = labels[(i - 1 + labels.length) % labels.length] || labels.find(Boolean) || ''
  const times: number[] = []
  let clock = 0
  keys.forEach((key, i) => { if (i) clock += key.d; times.push(clock); clock += key.hold })
  const T = clock + keys[0].d
  return { keys, times, T, labels, solved: keys.map(key => solve(key.pose)) }
}
function sample(tl: Timeline, time: number): { solved: Solved; label: string } {
  const t = ((time % tl.T) + tl.T) % tl.T
  const n = tl.keys.length
  for (let i = 0; i < n; i++) {
    const start = tl.times[i], holdEnd = start + tl.keys[i].hold
    const nextIndex = (i + 1) % n
    const end = nextIndex ? tl.times[nextIndex] : tl.T
    if (t < start) continue
    if (t <= holdEnd) return { solved: tl.solved[i], label: tl.labels[i] }
    if (t < end) {
      const next = tl.keys[nextIndex]
      const u = easeFn[next.ease ?? 'inout']((t - holdEnd) / (end - holdEnd))
      return { solved: solve(mix(tl.keys[i].pose, next.pose, u, tl.solved[i], tl.solved[nextIndex])), label: tl.labels[nextIndex] }
    }
  }
  return { solved: tl.solved[0], label: tl.labels[0] }
}

/* ---------- Drawing helpers ---------- */
const hex = (value: string) => [1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16))
function shade(far: string, near: string, t: number) {
  const a = hex(far), b = hex(near)
  return 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * Math.min(1, Math.max(0, t)))).join(',') + ')'
}
const BODY = ['#7E93B7', '#F1F5FC'] as const
const GUARD = ['#3C566D', '#6F90AB'] as const
type Pt = [number, number, number]
type Draw = { depth: number; node: ReactNode }
const anchorPoint = (s: Solved, a: Anchor): V3 => {
  if (Array.isArray(a)) return a
  if (a === 'lmid') return [(s.lheel[0] + s.ltoe[0]) / 2, (s.lheel[1] + s.ltoe[1]) / 2, (s.lheel[2] + s.ltoe[2]) / 2]
  if (a === 'rmid') return [(s.rheel[0] + s.rtoe[0]) / 2, (s.rheel[1] + s.rtoe[1]) / 2, (s.rheel[2] + s.rtoe[2]) / 2]
  return s[a]
}
function hull(points: [number, number][]) {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const crossZ = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lower: [number, number][] = [], upper: [number, number][] = []
  for (const p of pts) { while (lower.length >= 2 && crossZ(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p) }
  for (const p of pts.reverse()) { while (upper.length >= 2 && crossZ(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p) }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)]
}
const poly = (points: [number, number][]) => 'M' + points.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z'

type Equip = { band: boolean; db: Motion['db'] | undefined; guard: boolean }
function equipmentFor(exercise: Exercise, motion: Motion, protectedArm: boolean): Equip {
  const load = exercise.load + ' ' + exercise.name
  const band = Boolean(motion.band) && /band/i.test(load)
  const hasDb = /\bkg\b|dumbbell|\bDB\b/i.test(load)
  const db = hasDb ? (motion.db ?? (/left/i.test(load) ? 'l' : 'both')) : undefined
  const guard = protectedArm && motion.arms !== 'both' && !exercise.flag && exercise.category !== 'Forearm Rehab'
  return { band, db, guard }
}

function render(motion: Motion, s: Solved, balls: Ball[], cam: Camera, equip: Equip) {
  const P = (p: V3): Pt => project(p, cam)
  const center = P(s.pelvis)[2]
  const shadeAt = (depth: number, guard = false) => guard ? shade(GUARD[0], GUARD[1], 0.5 + (depth - center) / 34) : shade(BODY[0], BODY[1], 0.5 + (depth - center) / 34)
  const items: Draw[] = []
  const seg = (a: V3, b: V3, width: number, guard = false, key = '') => {
    const pa = P(a), pb = P(b), depth = (pa[2] + pb[2]) / 2
    items.push({ depth, node: <line key={key} x1={pa[0]} y1={pa[1]} x2={pb[0]} y2={pb[1]} stroke={shadeAt(depth, guard)} strokeWidth={width} strokeLinecap="round"/> })
  }
  const rightGuard = equip.guard
  for (const side of ['l', 'r'] as const) {
    const guard = side === 'r' && rightGuard
    seg(s[side + 's' as 'ls'], s[side + 'e' as 'le'], 8.5, guard, side + 'ua')
    seg(s[side + 'e' as 'le'], s[side + 'h' as 'lh'], 7.4, guard, side + 'fa')
    const hand = P(s[side + 'h' as 'lh'])
    items.push({ depth: hand[2] + 0.5, node: <circle key={side + 'hand'} cx={hand[0]} cy={hand[1]} r="4.6" fill={shadeAt(hand[2], guard)}/> })
    seg(s[side + 'hip' as 'lhip'], s[side + 'k' as 'lk'], 11.5, false, side + 'th')
    seg(s[side + 'k' as 'lk'], s[side + 'a' as 'la'], 9.5, false, side + 'sh')
    const ankle = P(s[side + 'a' as 'la']), heel = P(s[side + 'heel' as 'lheel']), toe = P(s[side + 'toe' as 'ltoe'])
    const footDepth = (ankle[2] + toe[2]) / 2
    items.push({ depth: footDepth, node: <path key={side + 'foot'} d={poly([[ankle[0], ankle[1]], [heel[0], heel[1]], [toe[0], toe[1]]])} fill={shadeAt(footDepth)} stroke={shadeAt(footDepth)} strokeWidth="5" strokeLinejoin="round"/> })
  }
  const ls = P(s.ls), rs = P(s.rs), lhip = P(s.lhip), rhip = P(s.rhip), chest = P(s.chest), pelvis = P(s.pelvis), neck = P(s.neck), head = P(s.head)
  const torsoDepth = (chest[2] + pelvis[2]) / 2
  const torsoColor = shadeAt(torsoDepth + 4)
  items.push({ depth: torsoDepth, node: <g key="torso">
    <path d={poly([[ls[0], ls[1]], [rs[0], rs[1]], [rhip[0], rhip[1]], [lhip[0], lhip[1]]])} fill={torsoColor} stroke={torsoColor} strokeWidth="9" strokeLinejoin="round"/>
    <line x1={pelvis[0]} y1={pelvis[1]} x2={chest[0]} y2={chest[1]} stroke={torsoColor} strokeWidth="21" strokeLinecap="round"/>
    <line x1={chest[0]} y1={chest[1]} x2={neck[0]} y2={neck[1]} stroke={torsoColor} strokeWidth="8" strokeLinecap="round"/>
  </g> })
  items.push({ depth: head[2], node: <circle key="head" cx={head[0]} cy={head[1]} r="10.6" fill={shadeAt(head[2] + 4)}/> })
  if (equip.band && motion.band) motion.band.forEach(([a, b], i) => {
    const pa = P(anchorPoint(s, a)), pb = P(anchorPoint(s, b))
    const mx = (pa[0] + pb[0]) / 2, my = (pa[1] + pb[1]) / 2 + 3
    items.push({ depth: Math.max(pa[2], pb[2]) + 2, node: <path key={'band' + i} d={`M${pa[0]} ${pa[1]}Q${mx} ${my} ${pb[0]} ${pb[1]}`} fill="none" stroke="#7FA0FF" strokeWidth="2.8" strokeLinecap="round"/> })
  })
  if (equip.db) {
    const hands: V3[] = equip.db === 'chest' ? [[(s.lh[0] + s.rh[0]) / 2, (s.lh[1] + s.rh[1]) / 2, (s.lh[2] + s.rh[2]) / 2]] :
      equip.db === 'both' ? [s.lh, s.rh] : equip.db === 'r' ? [s.rh] : [s.lh]
    const axis = equip.db === 'rack' ? s.torso.R : equip.db === 'chest' ? [0, 1, 0] as V3 : s.level.F
    hands.forEach((hand, i) => {
      const a = P([hand[0] - axis[0] * 8, hand[1] - axis[1] * 8, hand[2] - axis[2] * 8]), b = P([hand[0] + axis[0] * 8, hand[1] + axis[1] * 8, hand[2] + axis[2] * 8])
      items.push({ depth: Math.max(a[2], b[2]) + 3, node: <g key={'db' + i}><line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#8CA9F5" strokeWidth="3.4"/><circle cx={a[0]} cy={a[1]} r="6.4" fill="#8CA9F5" stroke="#0B111E" strokeWidth="1.2"/><circle cx={b[0]} cy={b[1]} r="6.4" fill="#8CA9F5" stroke="#0B111E" strokeWidth="1.2"/></g> })
    })
  }
  if (motion.pillow) {
    const at = motion.pillow === 'knees' ? [(s.lk[0] + s.rk[0]) / 2, (s.lk[1] + s.rk[1]) / 2 - 3, (s.lk[2] + s.rk[2]) / 2] as V3 : motion.pillow
    const p = P(at)
    items.push({ depth: p[2] + 1, node: <ellipse key="pillow" cx={p[0]} cy={p[1]} rx="11" ry="7" fill="#9FB1CF" stroke="#5A7D9A"/> })
  }
  balls.forEach((ball, i) => {
    const p = P(ball.p)
    items.push({ depth: p[2] + 1, node: ball.kind === 'foam'
      ? <g key={'ball' + i}><circle cx={p[0]} cy={p[1]} r={ball.r} fill="#E8853D"/><path d={`M${p[0] - ball.r} ${p[1]}h${ball.r * 2}M${p[0]} ${p[1] - ball.r}v${ball.r * 2}`} stroke="#7A3B12" strokeWidth="1.2" opacity=".7"/></g>
      : <circle key={'ball' + i} cx={p[0]} cy={p[1]} r={ball.r + 0.6} fill="#CDE05A"/> })
  })
  items.sort((a, b) => a.depth - b.depth)
  return items.map(item => item.node)
}

function scenery(motion: Motion, cam: Camera, box: [number, number, number, number], s: Solved) {
  const P = (p: V3) => project(p, cam)
  const [x0, y0, w] = box
  const nodes: ReactNode[] = []
  const floorY = P([0, 0, 0])[1]
  if (cam.tilt < 6) nodes.push(<path key="floor" d={`M${x0} ${floorY}H${x0 + w}`} stroke="#4A6B82" strokeWidth="1.5"/>)
  else {
    const corners: V3[] = [[-170, 0, -90], [170, 0, -90], [170, 0, 90], [-170, 0, 90]]
    nodes.push(<path key="floor" d={poly(corners.map(c => { const p = P(c); return [p[0], p[1]] }))} fill="#101a2c" stroke="#2a3b55"/>)
  }
  if (motion.mat) {
    const corners: V3[] = [[-105, 0.4, -34], [105, 0.4, -34], [105, 0.4, 34], [-105, 0.4, 34]]
    nodes.push(<path key="mat" d={poly(corners.map(c => { const p = P(c); return [p[0], p[1]] }))} fill="#1B2A45" stroke="#34507a" strokeWidth="1.5"/>)
  }
  if (motion.wall !== undefined && Math.abs(Math.cos(cam.yaw * Math.PI / 180)) > 0.3) {
    const corners: V3[] = [[motion.wall, 0, -70], [motion.wall, 230, -70], [motion.wall, 230, 70], [motion.wall, 0, 70]]
    const pts = corners.map(c => { const p = P(c); return [p[0], p[1]] as [number, number] })
    nodes.push(<path key="wall" d={poly(hull(pts))} fill="#16223a" stroke="#5A7D9A" strokeWidth="2.5"/>)
  }
  if (motion.post) {
    const a = P(motion.post), b = P([motion.post[0], 140, motion.post[2]])
    nodes.push(<line key="post" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#5A7D9A" strokeWidth="4" strokeLinecap="round"/>)
  }
  for (const [i, b] of [...(motion.boxes ?? []), ...(motion.towel ? [{ x: [-8, 10] as [number, number], z: [-20, 20] as [number, number], h: 3 }] : [])].entries()) {
    const corners: V3[] = []
    for (const x of b.x) for (const z of b.z) for (const y of [0, b.h]) corners.push([x, y, z])
    const pts = corners.map(c => { const p = P(c); return [p[0], p[1]] as [number, number] })
    const top: V3[] = [[b.x[0], b.h, b.z[0]], [b.x[1], b.h, b.z[0]], [b.x[1], b.h, b.z[1]], [b.x[0], b.h, b.z[1]]]
    nodes.push(<g key={'box' + i}><path d={poly(hull(pts))} fill="#16233A" stroke="#5A7D9A" strokeWidth="1.8" strokeLinejoin="round"/><path d={poly(top.map(c => { const p = P(c); return [p[0], p[1]] }))} fill="#1d2d48" stroke="#6d8fac" strokeWidth="1.4"/></g>)
  }
  motion.tape?.forEach((line, i) => nodes.push(<path key={'tape' + i} d={'M' + line.map(p => { const q = P(p); return q[0] + ' ' + q[1] }).join('L')} stroke="#8eaac1" strokeWidth="2.4" strokeDasharray="7 4" fill="none"/>))
  const shadow = P([s.pelvis[0], 0, s.pelvis[2]])
  const height = Math.max(0, Math.min(1, (s.pelvis[1] - 10) / 120))
  nodes.push(<ellipse key="shadow" cx={shadow[0]} cy={shadow[1] + 1} rx={20 + 14 * height} ry={3 + 7 * Math.sin(cam.tilt * Math.PI / 180) + 1} fill="#000" opacity={0.28 - 0.08 * Math.max(0, (s.pelvis[1] - 95) / 30)}/>)
  return nodes
}

/* ---------- Component ---------- */
function useReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => setReduced(query.matches)
    query.addEventListener('change', change)
    return () => query.removeEventListener('change', change)
  }, [])
  return reduced
}
function useClock(playing: boolean, reset: string) {
  const [time, setTime] = useState(0)
  useEffect(() => { setTime(0) }, [reset])
  useEffect(() => {
    if (!playing) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      setTime(value => value + dt)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing])
  return time
}

type Props = { exercise: Exercise; protectedArm: boolean; playing?: boolean; compact?: boolean; controls?: boolean; className?: string }
export function ExerciseAnimation({ exercise, protectedArm, playing, compact = false, controls = !compact, className = '' }: Props) {
  const id = useId()
  const reduced = useReducedMotion()
  const [override, setOverride] = useState<boolean>()
  const motion = motionFor(exercise.move)
  const run = (playing ?? true) && (override ?? !reduced)
  const time = useClock(run, exercise.id + exercise.move)
  const title = exercise.name + (motion ? '. ' + motion.caption : '') + (protectedArm ? '. Right arm shown in muted blue to protect the forearm.' : '')

  const model = useMemo(() => {
    if (!motion || motion.closeup || !motion.keys) return undefined
    const equip = equipmentFor(exercise, motion, protectedArm)
    const tl = buildTimeline(motion, exercise.tempo, equip.guard)
    const cam: Camera = { yaw: motion.cam?.yaw ?? 0, tilt: motion.cam?.tilt ?? 0 }
    const ctx = { T: tl.T, keyTime: (i: number) => tl.times[i] ?? 0, at: (t: number) => sample(tl, t).solved }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    const steps = 28
    for (let i = 0; i < steps; i++) {
      const t = (i / steps) * tl.T
      const s = sample(tl, t).solved
      const points: V3[] = [s.head, s.lh, s.rh, s.la, s.ra, s.lk, s.rk, s.ltoe, s.rtoe, s.lheel, s.rheel, s.pelvis, s.chest]
      for (const ball of motion.ball?.(t, ctx) ?? []) points.push(ball.p)
      for (const p of points) {
        const [x, y] = project(p, cam)
        minX = Math.min(minX, x - 14); maxX = Math.max(maxX, x + 14); minY = Math.min(minY, y - 14); maxY = Math.max(maxY, y + 10)
      }
    }
    for (const b of motion.boxes ?? []) for (const x of b.x) for (const z of b.z) for (const y of [0, b.h]) {
      const [px, py] = project([x, y, z], cam)
      minX = Math.min(minX, px - 4); maxX = Math.max(maxX, px + 4); minY = Math.min(minY, py - 4); maxY = Math.max(maxY, py + 4)
    }
    const floor = project([0, 0, 0], cam)[1]
    maxY = Math.max(maxY, floor + 8)
    let w = maxX - minX, h = maxY - minY
    const aspect = 4 / 3
    if (w / h < aspect) { const extra = h * aspect - w; minX -= extra / 2; w = h * aspect } else { const extra = w / aspect - h; minY -= extra * 0.7; h = w / aspect }
    const pad = Math.max(w, h) * (compact ? 0.02 : 0.06)
    const view: [number, number, number, number] = [minX - pad, minY - pad, w + pad * 2, h + pad * 2]
    return { tl, cam, ctx, view, equip }
  }, [exercise.id, exercise.move, exercise.tempo, exercise.load, motion, protectedArm, compact])

  let figure: ReactNode
  let label = ''
  if (motion?.closeup) {
    const shown = run ? time : closeUpLength(motion.closeup) * 0.3
    const view = CloseUpSvg({ kind: motion.closeup, time: shown, title })
    figure = view.svg
    label = view.label
  } else if (model) {
    const t = run ? time : model.tl.times[Math.min(1, model.tl.times.length - 1)] + (model.tl.keys[1]?.hold ?? 0) / 2
    const frame = sample(model.tl, t)
    label = frame.label
    const balls = motion!.ball?.(((t % model.tl.T) + model.tl.T) % model.tl.T, model.ctx) ?? []
    figure = <svg viewBox={model.view.join(' ')} role="img" aria-labelledby={id} preserveAspectRatio="xMidYMid meet">
      <title id={id}>{title}</title>
      {scenery(motion!, model.cam, model.view, frame.solved)}
      {render(motion!, frame.solved, balls, model.cam, model.equip)}
    </svg>
  } else {
    return <figure className={'anim anim-empty ' + (compact ? 'compact ' : '') + className}><ClipboardList size={compact ? 22 : 34}/><figcaption>{compact ? 'No demo' : 'No movement demo for this step. Follow the cues.'}</figcaption></figure>
  }
  return <figure className={'anim ' + (compact ? 'compact ' : '') + className}>
    <div className="anim-stage">{figure}</div>
    {!compact && label && <span className="anim-label" aria-live="off">{label}</span>}
    {controls && <button type="button" className="anim-toggle" onClick={() => setOverride(!run)} aria-label={run ? 'Pause demo' : 'Play demo'} title={run ? 'Pause demo' : 'Play demo'}>{run ? <Pause size={15}/> : <Play size={15}/>}</button>}
    {!compact && motion && <figcaption>{motion.caption}</figcaption>}
  </figure>
}
export function hasMotion(exercise: Exercise) { return Boolean(motionFor(exercise.move)) }
