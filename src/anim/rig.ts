/* A small 3D stick-figure rig with two-bone IK.
   World units are centimetres. x = forward of the default body, y = up, z = the body's right.
   Bones keep their length in every frame, so feet stay planted and limbs never stretch. */

export type V3 = [number, number, number]
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
export const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s]
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
export const len = (a: V3) => Math.hypot(a[0], a[1], a[2])
export const norm = (a: V3): V3 => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l] }
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
const rad = Math.PI / 180
function rotate(v: V3, axis: V3, deg: number): V3 {
  const a = norm(axis), c = Math.cos(deg * rad), s = Math.sin(deg * rad)
  return add(add(mul(v, c), mul(cross(a, v), s)), mul(a, dot(a, v) * (1 - c)))
}

export const B = { thigh: 44, shin: 43, upper: 29, fore: 26, torso: 50, neck: 7, head: 10.5, hipW: 9, shW: 16, ankle: 7 }
/* Standing pelvis height with soft knees. */
export const PH = 92.5

/* A limb target:
   - V3: absolute world point (planted feet, hands on a wall)
   - { s }: offset from the limb root in the level (yaw-only) frame [forward, up, right]
   - { r }: offset from the limb root in the body frame (pelvis for legs, torso for arms)
   - { k, a }: explicit knee/elbow and end points (kneeling shins, 90/90 legs) */
export type Target = V3 | { s: V3 } | { r: V3 } | { k: V3; a: V3 }
export type Pose = {
  p: V3
  yaw?: number; plean?: number; pbend?: number
  lean?: number; bend?: number; twist?: number; nod?: number; turn?: number
  lh: Target; rh: Target; la: Target; ra: Target
  lhPole?: V3; rhPole?: V3; laPole?: V3; raPole?: V3
  lft?: number; rft?: number
}
type Frame3 = { F: V3; U: V3; R: V3 }
export type Joint = 'pelvis' | 'chest' | 'neck' | 'head' | 'ls' | 'rs' | 'le' | 're' | 'lh' | 'rh' | 'lhip' | 'rhip' | 'lk' | 'rk' | 'la' | 'ra' | 'lheel' | 'rheel' | 'ltoe' | 'rtoe' | 'back'
export type Solved = Record<Joint, V3> & { torso: Frame3; pelvisFrame: Frame3; level: Frame3 }

function basis(yaw: number, lean: number, bend: number, start?: Frame3): Frame3 {
  let F: V3 = start ? start.F : [1, 0, 0], U: V3 = start ? start.U : [0, 1, 0], R: V3 = start ? start.R : [0, 0, 1]
  if (yaw) { F = rotate(F, U, yaw); R = rotate(R, U, yaw) }
  if (lean) { F = rotate(F, R, -lean); U = rotate(U, R, -lean) }
  if (bend) { U = rotate(U, F, -bend); R = rotate(R, F, -bend) }
  return { F, U, R }
}
const local = (f: Frame3, v: V3): V3 => add(add(mul(f.F, v[0]), mul(f.U, v[1])), mul(f.R, v[2]))

function ik(root: V3, target: V3, l1: number, l2: number, pole: V3): [V3, V3] {
  const d = sub(target, root)
  const dist = Math.min(Math.max(len(d), Math.abs(l1 - l2) + 0.5), l1 + l2 - 0.05)
  const dir = norm(d)
  const a = (l1 * l1 + dist * dist - l2 * l2) / (2 * dist)
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a))
  let perp = sub(pole, mul(dir, dot(pole, dir)))
  if (len(perp) < 1e-4) perp = cross(dir, [0, 0, 1])
  if (len(perp) < 1e-4) perp = cross(dir, [1, 0, 0])
  const joint = add(add(root, mul(dir, a)), mul(norm(perp), h))
  return [joint, add(root, mul(dir, dist))]
}

const isK = (t: Target): t is { k: V3; a: V3 } => !Array.isArray(t) && 'k' in t
const isS = (t: Target): t is { s: V3 } => !Array.isArray(t) && 's' in t
const isR = (t: Target): t is { r: V3 } => !Array.isArray(t) && 'r' in t

export function frames(pose: Pose) {
  const yaw = pose.yaw ?? 0
  const level = basis(yaw, 0, 0)
  const pelvisFrame = basis(yaw, pose.plean ?? 0, pose.pbend ?? 0)
  const torso = basis(pose.twist ?? 0, pose.lean ?? 0, pose.bend ?? 0, pelvisFrame)
  return { level, pelvisFrame, torso }
}
function resolve(target: Target, root: V3, level: Frame3, body: Frame3): V3 {
  if (Array.isArray(target)) return target
  if (isS(target)) return add(root, local(level, target.s))
  if (isR(target)) return add(root, local(body, target.r))
  return target.a
}

export function solve(pose: Pose): Solved {
  const { level, pelvisFrame, torso } = frames(pose)
  const p = pose.p
  const chest = add(p, mul(torso.U, B.torso))
  const neck = add(chest, mul(torso.U, B.neck))
  const nod = (pose.nod ?? 0) * rad
  const headDir = norm(add(mul(torso.U, Math.cos(nod)), mul(torso.F, Math.sin(nod))))
  const turn = pose.turn ?? 0
  const head = add(neck, mul(turn ? rotate(headDir, torso.U, turn) : headDir, B.head))
  const ls = sub(chest, mul(torso.R, B.shW)), rs = add(chest, mul(torso.R, B.shW))
  const lhip = sub(p, mul(pelvisFrame.R, B.hipW)), rhip = add(p, mul(pelvisFrame.R, B.hipW))
  const limb = (target: Target, root: V3, l1: number, l2: number, pole: V3, body: Frame3): [V3, V3] => {
    if (isK(target)) return [target.k, target.a]
    return ik(root, resolve(target, root, level, body), l1, l2, local(body, pole))
  }
  const [le, lh] = limb(pose.lh, ls, B.upper, B.fore, pose.lhPole ?? [-1, -0.7, -0.35], torso)
  const [re, rh] = limb(pose.rh, rs, B.upper, B.fore, pose.rhPole ?? [-1, -0.7, 0.35], torso)
  const [lk, la] = limb(pose.la, lhip, B.thigh, B.shin, pose.laPole ?? [1, 0, -0.12], pelvisFrame)
  const [rk, ra] = limb(pose.ra, rhip, B.thigh, B.shin, pose.raPole ?? [1, 0, 0.12], pelvisFrame)
  const foot = (knee: V3, ankle: V3, flex: number, side: number): [V3, V3] => {
    const shin = norm(sub(ankle, knee))
    const flatDir = norm(rotate([level.F[0], 0, level.F[2]], [0, 1, 0], side * 9))
    let shinDir: V3 = [0, 0, 0]
    for (const candidate of [flatDir, pelvisFrame.F, pelvisFrame.U]) {
      shinDir = sub(candidate, mul(shin, dot(candidate, shin)))
      if (len(shinDir) > 0.3) break
    }
    shinDir = norm(shinDir)
    const w = Math.min(1, Math.max(0, (ankle[1] - 12) / 22))
    const dir0 = norm(lerp3(flatDir, shinDir, w))
    const sole0 = norm(lerp3([0, -1, 0], shin, w))
    const c = Math.cos(flex * rad), s = Math.sin(flex * rad)
    const dir = norm(add(mul(dir0, c), mul(sole0, s)))
    const sole = norm(sub(mul(sole0, c), mul(dir0, s)))
    return [add(add(ankle, mul(sole, 5)), mul(dir, -4)), add(add(ankle, mul(sole, 4)), mul(dir, 13))]
  }
  const [lheel, ltoe] = foot(lk, la, pose.lft ?? 0, 1)
  const [rheel, rtoe] = foot(rk, ra, pose.rft ?? 0, -1)
  const back = sub(add(p, mul(torso.U, B.torso * 0.75)), mul(torso.F, 11))
  return { pelvis: p, chest, neck, head, ls, rs, le, re, lh, rh, lhip, rhip, lk, rk, la, ra, lheel, rheel, ltoe, rtoe, back, torso, pelvisFrame, level }
}

/* Interpolate two poses. Targets of the same kind interpolate in their own space
   (so planted feet stay planted); mixed kinds fall back to world positions. */
const num = (a: number | undefined, b: number | undefined, t: number) => lerp(a ?? 0, b ?? 0, t)
function mixTarget(a: Target, b: Target, t: number, aw: V3, bw: V3, ak?: V3, bk?: V3): Target {
  if (Array.isArray(a) && Array.isArray(b)) return lerp3(a, b, t)
  if (isS(a) && isS(b)) return { s: lerp3(a.s, b.s, t) }
  if (isR(a) && isR(b)) return { r: lerp3(a.r, b.r, t) }
  if (isK(a) && isK(b)) return { k: lerp3(a.k, b.k, t), a: lerp3(a.a, b.a, t) }
  if (ak && bk && (isK(a) || isK(b))) return { k: lerp3(ak, bk, t), a: lerp3(aw, bw, t) }
  return lerp3(aw, bw, t)
}
const defaultPoles: Record<'lhPole' | 'rhPole' | 'laPole' | 'raPole', V3> = {
  lhPole: [-1, -0.7, -0.35], rhPole: [-1, -0.7, 0.35], laPole: [1, 0, -0.12], raPole: [1, 0, 0.12],
}
export function mix(a: Pose, b: Pose, t: number, sa: Solved, sb: Solved): Pose {
  const out: Pose = {
    p: lerp3(a.p, b.p, t),
    yaw: num(a.yaw, b.yaw, t), plean: num(a.plean, b.plean, t), pbend: num(a.pbend, b.pbend, t),
    lean: num(a.lean, b.lean, t), bend: num(a.bend, b.bend, t), twist: num(a.twist, b.twist, t), nod: num(a.nod, b.nod, t), turn: num(a.turn, b.turn, t),
    lh: mixTarget(a.lh, b.lh, t, sa.lh, sb.lh, sa.le, sb.le), rh: mixTarget(a.rh, b.rh, t, sa.rh, sb.rh, sa.re, sb.re),
    la: mixTarget(a.la, b.la, t, sa.la, sb.la, sa.lk, sb.lk), ra: mixTarget(a.ra, b.ra, t, sa.ra, sb.ra, sa.rk, sb.rk),
    lft: num(a.lft, b.lft, t), rft: num(a.rft, b.rft, t),
  }
  for (const key of Object.keys(defaultPoles) as (keyof typeof defaultPoles)[]) {
    out[key] = lerp3(a[key] ?? defaultPoles[key], b[key] ?? defaultPoles[key], t)
  }
  return out
}

/* Orthographic camera. yaw 0 looks at the body's left side (the figure faces screen-left),
   90 looks at the front. tilt lifts the camera to look down. */
export type Camera = { yaw: number; tilt: number }
export function project(p: V3, cam: Camera): [number, number, number] {
  const c = Math.cos(cam.yaw * rad), s = Math.sin(cam.yaw * rad)
  const x = -p[0] * c - p[2] * s
  const depth = p[0] * s - p[2] * c
  const ct = Math.cos(cam.tilt * rad), st = Math.sin(cam.tilt * rad)
  return [x, -(p[1] * ct - depth * st), depth * ct + p[1] * st]
}
