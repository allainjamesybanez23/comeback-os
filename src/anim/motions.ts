import { B, PH, type Camera, type Pose, type Solved, type Target, type V3 } from './rig'

export type Ease = 'inout' | 'in' | 'out' | 'linear'
export type Key = { pose: Pose; d?: number; hold?: number; label?: string; ease?: Ease }
export type Anchor = 'lh' | 'rh' | 'la' | 'ra' | 'lk' | 'rk' | 'back' | 'lmid' | 'rmid' | 'ltoe' | 'rtoe' | V3
export type Box = { x: [number, number]; z: [number, number]; h: number }
export type Ball = { p: V3; r: number; kind: 'foam' | 'tennis' }
export type BallCtx = { T: number; keyTime(index: number): number; at(time: number): Solved }
export type CloseUp = 'wrist' | 'bandWrist' | 'deviate' | 'rotate' | 'fingers' | 'grip' | 'prayer' | 'toeYoga'
export type Motion = {
  caption: string
  keys?: Key[]
  cam?: Partial<Camera>
  tempo?: { down: number; up: number; pause?: 'down' | 'up' }
  arms?: 'both'
  band?: [Anchor, Anchor][]
  db?: 'l' | 'r' | 'both' | 'chest' | 'rack'
  ball?: (t: number, ctx: BallCtx) => Ball[]
  boxes?: Box[]
  wall?: number
  post?: V3
  tape?: V3[][]
  pillow?: 'knees' | V3
  towel?: boolean
  mat?: boolean
  hold?: boolean
  closeup?: CloseUp
}

const A = B.ankle
const hang = (side: 'l' | 'r'): Target => ({ s: [3, -53, side === 'l' ? -3 : 3] })
const feet = (x = 0, w = 10): Pick<Pose, 'la' | 'ra'> => ({ la: [x, A, -w], ra: [x, A, w] })
const stand = (o: Partial<Pose> = {}): Pose => ({ p: [0, PH, 0], lh: hang('l'), rh: hang('r'), ...feet(), ...o })
const bench = (x0: number, x1: number, h = 42, z = 24): Box => ({ x: [x0, x1], z: [-z, z], h })
const box = (x0: number, x1: number, h: number, z = 30): Box => ({ x: [x0, x1], z: [-z, z], h })
const pair = (s: V3): { lh: Target; rh: Target } => ({ lh: { s: [s[0], s[1], -s[2]] }, rh: { s } })
const supine = (o: Partial<Pose> = {}): Pose => ({ p: [0, 11, 0], plean: -90, la: [46, A, -14], ra: [46, A, 14], lh: [-20, 4, -26], rh: [-20, 4, 26], ...o })
const prone = (o: Partial<Pose> = {}): Pose => ({ p: [0, 10, 0], plean: 90, la: [-84, 6, -9], ra: [-84, 6, 9], lft: 165, rft: 165, nod: 30, lh: { r: [-8, 44, -30] }, rh: { r: [-8, 44, 30] }, ...o })
const seat = (o: Partial<Pose> = {}): Pose => ({ p: [0, 10, 0], lean: 6, la: [80, A, -10], ra: [80, A, 10], laPole: [0, 1, -0.2], raPole: [0, 1, 0.2], lft: -10, rft: -10, lh: { s: [20, -44, -6] }, rh: { s: [20, -44, 6] }, ...o })
const kneelShin = (side: 'l' | 'r', x = -2): Target => ({ k: [x, 5, side === 'l' ? -10 : 10], a: [x - 42, 6, side === 'l' ? -10 : 10] })
const halfKneel = (o: Partial<Pose> = {}): Pose => ({ p: [-2, 49, 0], la: [30, A, -10], ra: kneelShin('r'), rft: 165, lh: hang('l'), rh: hang('r'), ...o })
const sideLying = (o: Partial<Pose> = {}): Pose => ({ p: [0, 13, 0], yaw: -90, pbend: -90, bend: 6, ...o } as Pose)
const ninety = (o: Partial<Pose> = {}): Pose => ({ p: [0, 10, 0], lean: 2, la: { k: [36, 6, -28], a: [16, 6, 8] }, ra: { k: [14, 6, 50], a: [-28, 6, 58] }, lft: 60, rft: 60, lh: [-22, 4, -28], rh: { s: [20, -42, 6] }, ...o })
const air = (y: number, o: Partial<Pose> = {}): Pose => ({ p: [0, y, 0], la: { s: [2, -84, -1] }, ra: { s: [2, -84, 1] }, lft: 40, rft: 40, ...pair([12, -44, 8]), ...o })
const ground = (x: number, z = 0, o: Partial<Pose> = {}): Pose => ({ p: [x - 2, 88, z], lean: 8, la: [x, A, z - 10], ra: [x, A, z + 10], ...pair([14, -44, 8]), ...o })
const stance = (o: Partial<Pose> = {}): Pose => ({ p: [-8, 74, 0], lean: 22, la: [2, A, -24], ra: [2, A, 24], ...pair([18, -36, 14]), ...o })
const slide = (lz: number, rz: number, o: Partial<Pose> = {}): Pose => stance({ p: [-8, 72, (lz + rz) / 2], la: [2, A, lz], ra: [2, A, rz], ...o })
const dribbler = (hand: V3, o: Partial<Pose> = {}): Pose => ({ p: [-8, 66, 0], lean: 32, la: [8, A, -22], ra: [-10, A, 20], lh: hand, lhPole: [-1, 0.3, -0.7], rh: { s: [20, -36, 6] }, ...o })

/* Ball helpers: the ball rides under the palm, falls to a floor spot, and rises back into the catching hand. */
type Beat = { release: number; catch: number; floor: V3; hand?: 'lh' | 'rh'; to?: 'lh' | 'rh' }
const FOAM = 11
const palm = (s: Solved, hand: 'lh' | 'rh', r = FOAM): V3 => [s[hand][0] + 2, s[hand][1] - r - 3, s[hand][2]]
const easeIn = (u: number) => u * u
const easeOut = (u: number) => 1 - (1 - u) * (1 - u)
function dribbleBall(beats: Beat[], hand: 'lh' | 'rh' = 'lh', extra?: (t: number, ctx: BallCtx, s: Solved) => Ball[]) {
  return (t: number, ctx: BallCtx): Ball[] => {
    const now = ctx.at(t)
    const out = extra ? extra(t, ctx, now) : []
    for (const beat of beats) {
      let release = ctx.keyTime(beat.release), caught = ctx.keyTime(beat.catch)
      if (caught <= release) caught += ctx.T
      let local = t
      if (local < release) local += ctx.T
      if (local >= release && local <= caught) {
        const bounce = release + (caught - release) * 0.42
        const from = palm(ctx.at(release % ctx.T), beat.hand ?? hand)
        const floor: V3 = [beat.floor[0], FOAM, beat.floor[2]]
        if (local < bounce) {
          const u = easeIn((local - release) / (bounce - release))
          return [...out, { kind: 'foam', r: FOAM, p: [from[0] + (floor[0] - from[0]) * u, from[1] + (floor[1] - from[1]) * u, from[2] + (floor[2] - from[2]) * u] }]
        }
        const target = palm(now, beat.to ?? beat.hand ?? hand)
        const u = easeOut((local - bounce) / (caught - bounce))
        return [...out, { kind: 'foam', r: FOAM, p: [floor[0] + (target[0] - floor[0]) * u, floor[1] + (target[1] - floor[1]) * u, floor[2] + (target[2] - floor[2]) * u] }]
      }
    }
    const holder = beats.length ? (() => {
      let best: 'lh' | 'rh' = hand, bestGap = Infinity
      for (const beat of beats) {
        const caught = ctx.keyTime(beat.catch)
        const gap = (t - caught + ctx.T) % ctx.T
        if (gap < bestGap) { bestGap = gap; best = beat.to ?? beat.hand ?? hand }
      }
      return best
    })() : hand
    return [...out, { kind: 'foam', r: FOAM, p: palm(now, holder) }]
  }
}

/* ---------------- Walking & running cycles ---------------- */
const walkKeys = (o: Partial<Pose> = {}, d = 0.32): Key[] => [
  { pose: { p: [0, 90, 0], la: [26, A, -9], lft: -15, ra: [-24, 11, 9], rft: 35, lh: { s: [-14, -50, -4] }, rh: { s: [14, -50, 4] }, ...o }, d, label: 'Heel strike' },
  { pose: { p: [0, 93, 0], la: [0, A, -9], ra: [4, 22, 9], lh: hang('l'), rh: hang('r'), ...o }, d },
  { pose: { p: [0, 90, 0], la: [-24, 11, -9], lft: 35, ra: [26, A, 9], rft: -15, lh: { s: [14, -50, -4] }, rh: { s: [-14, -50, 4] }, ...o }, d, label: 'Roll through' },
  { pose: { p: [0, 93, 0], ra: [0, A, 9], la: [4, 22, -9], lh: hang('l'), rh: hang('r'), ...o }, d },
]
const runKeys = (knee = 36, d = 0.17, lean = 6): Key[] => [
  { pose: { p: [0, 88, 0], lean, la: [8, A, -9], ra: [-18, knee + 4, 9], rft: 30, lh: { s: [-14, -30, -6] }, rh: { s: [18, -24, 6] } }, d, ease: 'in', label: 'Light contact' },
  { pose: { p: [0, 96, 0], lean, la: [-10, 20, -9], lft: 35, ra: [10, knee, 9], lh: { s: [0, -44, -6] }, rh: { s: [0, -44, 6] } }, d, ease: 'out' },
  { pose: { p: [0, 88, 0], lean, ra: [8, A, 9], la: [-18, knee + 4, -9], lft: 30, lh: { s: [18, -24, -6] }, rh: { s: [-14, -30, 6] } }, d, ease: 'in', label: 'Light contact' },
  { pose: { p: [0, 96, 0], lean, ra: [-10, 20, 9], rft: 35, la: [10, knee, -9], lh: { s: [0, -44, -6] }, rh: { s: [0, -44, 6] } }, d, ease: 'out' },
]
const kneeUp = (side: 'l' | 'r', o: Partial<Pose> = {}): Pose => side === 'l'
  ? { p: [0, 94, 0], la: { s: [40, -42, -1] }, lft: -20, ra: [0, A, 9], rft: 12, lh: { s: [-16, -44, -6] }, rh: { s: [24, -18, 6] }, ...o }
  : { p: [0, 94, 0], ra: { s: [40, -42, 1] }, rft: -20, la: [0, A, -9], lft: 12, lh: { s: [24, -18, -6] }, rh: { s: [-16, -44, 6] }, ...o }
const kneesDown = (o: Partial<Pose> = {}): Pose => ({ p: [0, 94, 0], ...feet(0, 9), lft: 12, rft: 12, lh: hang('l'), rh: hang('r'), ...o })

const rackL: Target = { r: [9, 2, 3] }
const rackPole: V3 = [1, -0.6, -0.5]

export const motions: Record<string, Motion> = {
  /* ---------- Lower strength ---------- */
  squatRack: {
    caption: 'Dumbbell racked on the left shoulder · sit between the hips', db: 'rack', tempo: { down: 1, up: 0 },
    keys: [
      { pose: stand({ lean: 3, lh: rackL, lhPole: rackPole, ...feet(0, 13) }), d: 1, hold: 0.4, label: 'Drive up tall' },
      { pose: { p: [-19, 51, 0], lean: 28, lh: rackL, lhPole: rackPole, rh: hang('r'), ...feet(0, 13) }, d: 2, hold: 0.4, label: 'Sit between the hips' },
    ],
  },
  squat: {
    caption: 'Heels down · sit deep and breathe', hold: true, boxes: [bench(40, 78, 42, 30)],
    keys: [
      { pose: { p: [-12, 37, 0], lean: 24, lh: [42, 46, -14], rh: { s: [16, -40, 4] }, ...feet(0, 17) }, d: 2, hold: 1.2, label: 'Settle deep' },
      { pose: { p: [-10, 38, -5], lean: 22, bend: 4, lh: [42, 46, -14], rh: { s: [16, -40, 4] }, ...feet(0, 17) }, d: 2, hold: 0.6, label: 'Sway left' },
      { pose: { p: [-10, 38, 5], lean: 22, bend: -4, lh: [42, 46, -14], rh: { s: [16, -40, 4] }, ...feet(0, 17) }, d: 2.4, hold: 0.6, label: 'Sway right' },
    ],
  },
  rfess: {
    caption: 'Rear foot on the bench · drop straight down', db: 'l', tempo: { down: 1, up: 0 }, boxes: [bench(-84, -46)],
    keys: [
      { pose: { p: [-6, 84, 0], lean: 6, la: [27, A, -9], ra: [-54, 49, 9], rft: 70, lh: hang('l'), rh: hang('r') }, d: 1, hold: 0.3, label: 'Drive up' },
      { pose: { p: [-8, 53, 0], lean: 12, la: [27, A, -9], ra: [-54, 49, 9], rft: 70, lh: hang('l'), rh: hang('r') }, d: 2.4, hold: 0.3, label: 'Lower straight down' },
    ],
  },
  splitHold: {
    caption: 'Back knee hovers just above the floor', hold: true, db: 'l',
    keys: [
      { pose: { p: [-6, 54, 0], lean: 4, la: [30, A, -9], ra: [-40, 14, 9], rft: 55, lh: hang('l'), rh: hang('r') }, d: 1.5, hold: 1.6, label: 'Hold low' },
      { pose: { p: [-6, 55.5, 0], lean: 4, la: [30, A, -9], ra: [-40, 14, 9], rft: 55, lh: hang('l'), rh: hang('r') }, d: 1.5, hold: 0.4, label: 'Breathe' },
    ],
  },
  lunge: {
    caption: 'Back knee lowers · front foot stays planted', tempo: { down: 1, up: 0 },
    keys: [
      { pose: { p: [-6, 84, 0], lean: 2, la: [30, A, -9], ra: [-40, 14, 9], rft: 55, lh: hang('l'), rh: hang('r') }, d: 1, hold: 0.2, label: 'Drive up' },
      { pose: { p: [-6, 54, 0], lean: 4, la: [30, A, -9], ra: [-40, 14, 9], rft: 55, lh: hang('l'), rh: hang('r') }, d: 1.4, hold: 0.2, label: 'Lower' },
    ],
  },
  lungeTwist: {
    caption: 'Step back · lower · rotate toward the front leg',
    keys: [
      { pose: stand(pair([24, -34, 8])), d: 0.9, hold: 0.2, label: 'Stand tall' },
      { pose: { p: [-26, 54, 0], lean: 4, twist: 38, la: [0, A, -9], ra: [-66, 13, 9], rft: 55, lh: { r: [30, -14, -4] }, rh: { r: [30, -14, 4] } }, d: 1.2, hold: 0.6, label: 'Lower + rotate' },
      { pose: stand(pair([24, -34, 8])), d: 1, hold: 0.2, label: 'Stand tall' },
      { pose: { p: [-26, 54, 0], lean: 4, twist: -38, ra: [0, A, 9], la: [-66, 13, -9], lft: 55, lh: { r: [30, -14, -4] }, rh: { r: [30, -14, 4] } }, d: 1.2, hold: 0.6, label: 'Other side' },
    ],
  },
  step: {
    caption: 'Whole foot on the bench · drive through the top leg', db: 'l', tempo: { down: 0, up: 2 }, boxes: [bench(18, 58)],
    keys: [
      { pose: { p: [2, 88, 0], lean: 14, la: [36, 49, -9], ra: [0, A, 9], lh: hang('l'), rh: hang('r') }, d: 1.6, hold: 0.3, label: 'Lower with control' },
      { pose: { p: [20, 112, 0], lean: 12, la: [36, 49, -9], ra: [10, 46, 9], rft: 30, lh: hang('l'), rh: hang('r') }, d: 0.5, label: 'Drive' },
      { pose: { p: [34, 133, 0], lean: 3, la: [36, 49, -9], ra: [38, 49, 9], lh: hang('l'), rh: hang('r') }, d: 0.5, hold: 0.4, label: 'Stand tall on top' },
      { pose: { p: [20, 112, 0], lean: 10, la: [36, 49, -9], ra: [8, 44, 9], rft: 30, lh: hang('l'), rh: hang('r') }, d: 0.7, label: 'Step down' },
    ],
  },
  peterson: {
    caption: 'Knee travels over the toes · rise through the step leg', boxes: [box(4, 40, 15)],
    keys: [
      { pose: { p: [22, 106, 0], lean: 2, la: [22, 22, -9], ra: { s: [16, -80, 1] }, lh: hang('l'), rh: hang('r') }, d: 0.9, hold: 0.3, label: 'Rise tall' },
      { pose: { p: [13, 81, 0], lean: 10, la: [22, 22, -9], ra: [46, 9, 9], rft: -22, lh: { s: [22, -40, -6] }, rh: hang('r') }, d: 1.4, hold: 0.3, label: 'Knee over toes · heel taps' },
    ],
  },
  nordic: {
    caption: 'Kneel tall · lean back from the knees with the hips straight', mat: true,
    keys: [
      { pose: { p: [0, 48.5, 0], la: kneelShin('l', 1), ra: kneelShin('r', 1), lft: 165, rft: 165, lh: { r: [16, -18, 6] }, rh: { r: [16, -18, -6] } }, d: 1.2, hold: 0.4, label: 'Kneel tall' },
      { pose: { p: [-26.1, 39.7, 0], plean: -38, la: kneelShin('l', 1), ra: kneelShin('r', 1), lft: 165, rft: 165, lh: { r: [16, -18, 6] }, rh: { r: [16, -18, -6] } }, d: 2.2, hold: 0.3, label: 'Lean back slowly' },
    ],
  },
  tibRaise: {
    caption: 'Back on the wall · lift the toes high', wall: -40,
    keys: [
      { pose: { p: [-20, 88, 0], lean: -9, ...feet(5, 10), lh: hang('l'), rh: hang('r') }, d: 0.7, hold: 0.2, label: 'Toes down' },
      { pose: { p: [-20, 88, 0], lean: -9, ...feet(5, 10), lft: -32, rft: -32, lh: hang('l'), rh: hang('r') }, d: 0.7, hold: 0.3, label: 'Toes up' },
    ],
  },
  calf: {
    caption: 'Rise through the forefoot · pause at the top', db: 'l', tempo: { down: 0, up: 1, pause: 'up' },
    keys: [
      { pose: { p: [0, PH, 0], la: [0, A, -9], ra: { s: [-22, -62, 1] }, lh: hang('l'), rh: hang('r') }, d: 1.5, hold: 0.2, label: 'Lower slowly' },
      { pose: { p: [5, 99.5, 0], la: [5.6, 14.4, -9], lft: 40, ra: { s: [-22, -62, 1] }, lh: hang('l'), rh: hang('r') }, d: 0.9, hold: 1.4, label: 'Rise · pause' },
    ],
  },
  calfHold: {
    caption: 'Hold high on the forefoot', hold: true, db: 'l',
    keys: [
      { pose: { p: [5, 99.5, 0], la: [5.6, 14.4, -9], lft: 40, ra: { s: [-22, -62, 1] }, lh: hang('l'), rh: hang('r') }, d: 1.4, hold: 1.6, label: 'Hold the top' },
      { pose: { p: [5, 99, 0], la: [5.6, 14, -9], lft: 39, ra: { s: [-22, -62, 1] }, lh: hang('l'), rh: hang('r') }, d: 1.4, label: 'Breathe' },
    ],
  },
  rdl: {
    caption: 'Hinge on the right leg · left heel reaches back', db: 'l', tempo: { down: 1, up: 0 },
    keys: [
      { pose: { p: [0, 92, 0], ra: [0, A, 9], la: { s: [-10, -82, -1] }, lft: 20, lh: hang('l'), rh: hang('r') }, d: 1, hold: 0.3, label: 'Stand tall' },
      { pose: { p: [-6, 88, 0], lean: 78, ra: [0, A, 9], la: { s: [-83, -17, -1] }, lft: 60, lh: { s: [3, -53, -2] }, rh: hang('r') }, d: 2.4, hold: 0.4, label: 'Hinge · heel back' },
    ],
  },
  sideLunge: {
    caption: 'Shift to one side · sit the hip back · other leg long', db: 'l', cam: { yaw: 62 },
    keys: [
      { pose: { p: [0, 86, 0], la: [0, A, -45], ra: [0, A, 45], lh: hang('l'), rh: hang('r') }, d: 1, hold: 0.2, label: 'Tall and wide' },
      { pose: { p: [-16, 62, -30], lean: 32, la: [0, A, -45], ra: [0, A, 45], lh: hang('l'), rh: hang('r') }, d: 1.2, hold: 0.3, label: 'Sit into the left hip' },
      { pose: { p: [0, 86, 0], la: [0, A, -45], ra: [0, A, 45], lh: hang('l'), rh: hang('r') }, d: 1, hold: 0.2, label: 'Drive to center' },
      { pose: { p: [-16, 62, 30], lean: 32, la: [0, A, -45], ra: [0, A, 45], lh: hang('l'), rh: hang('r') }, d: 1.2, hold: 0.3, label: 'Sit into the right hip' },
    ],
  },
  cossack: {
    caption: 'Deep side squat · straight leg with toes up', cam: { yaw: 80 },
    keys: [
      { pose: { p: [0, 80, 0], la: [0, A, -53], ra: [0, A, 53], ...pair([30, -30, 6]) }, d: 1.2, hold: 0.2, label: 'Wide stance' },
      { pose: { p: [-12, 40, -36], lean: 28, la: [0, A, -53], ra: [0, A, 53], rft: -35, ...pair([40, -16, 6]) }, d: 1.6, hold: 0.6, label: 'Sit left · toes up' },
      { pose: { p: [0, 80, 0], la: [0, A, -53], ra: [0, A, 53], ...pair([30, -30, 6]) }, d: 1.2, hold: 0.2, label: 'Return' },
      { pose: { p: [-12, 40, 36], lean: 28, la: [0, A, -53], ra: [0, A, 53], lft: -35, ...pair([40, -16, 6]) }, d: 1.6, hold: 0.6, label: 'Sit right · toes up' },
    ],
  },
  wallSit: {
    caption: 'Back flat on the wall · thighs near level', wall: -26, hold: true,
    keys: [
      { pose: { p: [-14, 50, 0], la: [30, A, -10], ra: [30, A, 10], lh: { s: [26, -46, -4] }, rh: hang('r') }, d: 1.5, hold: 2, label: 'Hold · thighs level' },
      { pose: { p: [-14, 51, 0], la: [30, A, -10], ra: [30, A, 10], lh: { s: [26, -46, -4] }, rh: hang('r') }, d: 1.5, label: 'Breathe' },
    ],
  },
  squatHold: {
    caption: 'Heels on a towel · tall half squat · knees forward', hold: true, towel: true,
    keys: [
      { pose: { p: [-10, 66, 0], lean: 10, la: [0, 10, -12], ra: [0, 10, 12], ...pair([46, -4, 8]) }, d: 1.5, hold: 2, label: 'Hold' },
      { pose: { p: [-10, 67, 0], lean: 10, la: [0, 10, -12], ra: [0, 10, 12], ...pair([46, -4, 8]) }, d: 1.5, label: 'Breathe' },
    ],
  },
  balance: {
    caption: 'One foot · eyes closed · wall nearby', hold: true, post: [0, 0, -46],
    keys: [
      { pose: { p: [0, 92, 0], la: [0, A, -9], ra: { s: [8, -70, 1] }, lh: { s: [10, -40, -14] }, rh: hang('r') }, d: 1.4, hold: 0.6, label: 'Balance' },
      { pose: { p: [1, 92, -1], bend: 2, la: [0, A, -9], ra: { s: [8, -70, 1] }, lh: { s: [10, -40, -16] }, rh: hang('r') }, d: 1.4, hold: 0.6, label: 'Small corrections' },
    ],
  },
  /* ---------- Plyometrics & speed ---------- */
  jump: {
    caption: 'Load · explode up · land soft',
    keys: [
      { pose: stand(feet(0, 12)), d: 0.6, hold: 0.25, label: 'Reset' },
      { pose: { p: [-14, 66, 0], lean: 30, ...pair([-22, -44, 6]), ...feet(0, 12) }, d: 0.5, label: 'Load' },
      { pose: air(118, pair([8, 48, 4])), d: 0.28, ease: 'out', label: 'Explode' },
      { pose: { p: [-13, 64, 0], lean: 30, ...pair([22, -30, 8]), ...feet(0, 12) }, d: 0.3, ease: 'in', hold: 0.35, label: 'Land soft' },
    ],
  },
  jumpStick: {
    caption: 'Jump · freeze the landing for two seconds',
    keys: [
      { pose: stand(feet(0, 12)), d: 0.6, hold: 0.25, label: 'Reset' },
      { pose: { p: [-14, 66, 0], lean: 30, ...pair([-22, -44, 6]), ...feet(0, 12) }, d: 0.5, label: 'Load' },
      { pose: air(118, pair([8, 48, 4])), d: 0.28, ease: 'out', label: 'Explode' },
      { pose: { p: [-13, 64, 0], lean: 30, ...pair([24, -26, 8]), ...feet(0, 12) }, d: 0.3, ease: 'in', hold: 1.6, label: 'Stick it · 2 s' },
    ],
  },
  bounce: {
    caption: 'Quick, springy ankle bounces',
    keys: [
      { pose: stand({ p: [0, 91.5, 0], ...feet(0, 10), ...pair([10, -46, 8]) }), d: 0.17, ease: 'in', label: 'Quick contact' },
      { pose: { p: [0, 103, 0], la: { s: [1, -86, -1] }, ra: { s: [1, -86, 1] }, lft: 45, rft: 45, ...pair([10, -46, 8]) }, d: 0.19, ease: 'out', label: 'Spring' },
    ],
  },
  line: {
    caption: 'Hop forward and back over the line', tape: [[[0, 0, -26], [0, 0, 26]]],
    keys: [
      { pose: ground(-13), d: 0.22, ease: 'in', label: 'Land behind' },
      { pose: air(104, { p: [-2, 104, 0], lean: 4 }), d: 0.2, ease: 'out' },
      { pose: ground(13), d: 0.22, ease: 'in', label: 'Land in front' },
      { pose: air(104, { p: [-2, 104, 0], lean: 4 }), d: 0.2, ease: 'out' },
    ],
  },
  latHop: {
    caption: 'Hop side to side over the line', cam: { yaw: 78 }, tape: [[[-28, 0, 0], [28, 0, 0]]],
    keys: [
      { pose: ground(0, -15), d: 0.22, ease: 'in', label: 'Land left' },
      { pose: air(104, { p: [-2, 104, 0], lean: 4 }), d: 0.2, ease: 'out' },
      { pose: ground(0, 15), d: 0.22, ease: 'in', label: 'Land right' },
      { pose: air(104, { p: [-2, 104, 0], lean: 4 }), d: 0.2, ease: 'out' },
    ],
  },
  skate: {
    caption: 'Bound side to side · stick each landing', cam: { yaw: 66 },
    keys: [
      { pose: { p: [-8, 72, -34], lean: 26, la: [0, A, -40], ra: { s: [-30, -50, -16] }, rft: 30, lh: { s: [-10, -44, -8] }, rh: { s: [6, -40, -20] } }, d: 0.42, ease: 'in', hold: 0.7, label: 'Stick left' },
      { pose: { p: [0, 100, 0], lean: 12, la: { s: [0, -74, -4] }, ra: { s: [0, -74, 4] }, lft: 30, rft: 30, lh: hang('l'), rh: hang('r') }, d: 0.3, ease: 'out', label: 'Bound' },
      { pose: { p: [-8, 72, 34], lean: 26, ra: [0, A, 40], la: { s: [-30, -50, 16] }, lft: 30, lh: { s: [6, -40, 20] }, rh: { s: [-10, -44, 8] } }, d: 0.42, ease: 'in', hold: 0.7, label: 'Stick right' },
      { pose: { p: [0, 100, 0], lean: 12, la: { s: [0, -74, -4] }, ra: { s: [0, -74, 4] }, lft: 30, rft: 30, lh: hang('l'), rh: hang('r') }, d: 0.3, ease: 'out', label: 'Bound' },
    ],
  },
  splitJump: {
    caption: 'Switch legs in the air · land soft in a lunge',
    keys: [
      { pose: { p: [-6, 56, 0], lean: 6, la: [28, A, -9], ra: [-40, 14, 9], rft: 55, lh: { s: [-14, -44, -6] }, rh: { s: [16, -36, 6] } }, d: 0.34, ease: 'in', hold: 0.25, label: 'Land soft' },
      { pose: { p: [-4, 112, 0], la: { s: [4, -82, -1] }, ra: { s: [-4, -82, 1] }, lft: 35, rft: 35, ...pair([10, -40, 8]) }, d: 0.3, ease: 'out', label: 'Switch' },
      { pose: { p: [-6, 56, 0], lean: 6, ra: [28, A, 9], la: [-40, 14, -9], lft: 55, lh: { s: [16, -36, -6] }, rh: { s: [-14, -44, 6] } }, d: 0.34, ease: 'in', hold: 0.25, label: 'Land soft' },
      { pose: { p: [-4, 112, 0], la: { s: [-4, -82, -1] }, ra: { s: [4, -82, 1] }, lft: 35, rft: 35, ...pair([10, -40, 8]) }, d: 0.3, ease: 'out', label: 'Switch' },
    ],
  },
  drop: {
    caption: 'Step off a low step · absorb and freeze', boxes: [box(-50, -12, 30)],
    keys: [
      { pose: { p: [-30, 122, 0], la: [-30, 37, -10], ra: [-30, 37, 10], lh: hang('l'), rh: hang('r') }, d: 0.9, hold: 0.5, label: 'Tall on the step' },
      { pose: { p: [-18, 120, 0], lean: 4, la: { s: [24, -78, -1] }, ra: [-20, 37, 10], lh: hang('l'), rh: hang('r') }, d: 0.5, label: 'Step off' },
      { pose: { p: [-2, 108, 0], la: { s: [4, -84, -1] }, ra: { s: [2, -84, 1] }, lft: 30, rft: 30, lh: hang('l'), rh: hang('r') }, d: 0.3, ease: 'in', label: 'Drop' },
      { pose: { p: [-6, 64, 0], lean: 30, la: [10, A, -12], ra: [10, A, 12], ...pair([22, -28, 8]) }, d: 0.28, ease: 'in', hold: 0.8, label: 'Absorb + freeze' },
      { pose: stand({ p: [8, PH, 0], ...feet(10, 12) }), d: 0.7, label: 'Stand' },
      { pose: { p: [-4, 92, 0], lean: -4, la: [-24, 37, -10], ra: [8, A, 10], lh: hang('l'), rh: hang('r') }, d: 0.8, label: 'Step back up' },
      { pose: { p: [-24, 116, 0], la: [-24, 37, -10], ra: [-4, 46, 10], lh: hang('l'), rh: hang('r') }, d: 0.6 },
    ],
  },
  march: {
    caption: 'Knee to hip height · toes up · punch down',
    keys: [
      { pose: kneeUp('l'), d: 0.45, hold: 0.25, label: 'Knee up · toes up' },
      { pose: kneesDown(), d: 0.25, ease: 'in', label: 'Punch down' },
      { pose: kneeUp('r'), d: 0.45, hold: 0.25, label: 'Switch' },
      { pose: kneesDown(), d: 0.25, ease: 'in', label: 'Punch down' },
    ],
  },
  kneeSwitch: {
    caption: 'Slight forward lean · switch knees fast',
    keys: [
      { pose: kneeUp('l', { plean: 12, p: [4, 93, 0] }), d: 0.18, label: 'Switch' },
      { pose: kneeUp('r', { plean: 12, p: [4, 93, 0] }), d: 0.18, label: 'Switch' },
    ],
  },
  skip: {
    caption: 'Skip with a high knee · quick foot strike under the hip',
    keys: [
      { pose: kneeUp('l', { p: [0, 97, 0], ra: [0, 11, 9], rft: 30 }), d: 0.22, ease: 'out', label: 'Knee up' },
      { pose: kneesDown({ p: [0, 93, 0] }), d: 0.16, ease: 'in', label: 'Strike' },
      { pose: kneeUp('r', { p: [0, 97, 0], la: [0, 11, -9], lft: 30 }), d: 0.22, ease: 'out', label: 'Knee up' },
      { pose: kneesDown({ p: [0, 93, 0] }), d: 0.16, ease: 'in', label: 'Strike' },
    ],
  },
  highKnees: { caption: 'Fast knees to hip height · quiet steps', keys: runKeys(52, 0.15, 2) },
  jog: { caption: 'Light jog on the balls of the feet', keys: runKeys(36, 0.18, 6) },
  walk: { caption: 'Easy, steady steps', keys: walkKeys() },
  farmerCarry: { caption: 'Walk tall · dumbbell at your side', db: 'l', keys: walkKeys({ lh: { s: [2, -53, -5] } }, 0.42) },
  stepCardio: {
    caption: 'Steady step-ups · conversational pace', boxes: [box(16, 54, 18)],
    keys: [
      { pose: stand(), d: 0.45, label: 'Step up' },
      { pose: { p: [3, 94, 0], la: [14, 34, -10], ra: [0, A, 10], lh: hang('l'), rh: hang('r') }, d: 0.4 },
      { pose: { p: [14, 100, 0], lean: 6, la: [32, 25, -10], ra: [0, A, 10], lh: hang('l'), rh: hang('r') }, d: 0.4 },
      { pose: { p: [30, 110.5, 0], la: [32, 25, -10], ra: [32, 25, 10], lh: hang('l'), rh: hang('r') }, d: 0.45, label: 'Step down' },
      { pose: { p: [14, 93, 0], lean: -3, la: [32, 25, -10], ra: [4, A, 10], lh: hang('l'), rh: hang('r') }, d: 0.5 },
      { pose: { p: [4, 92, 0], la: [12, 30, -10], ra: [4, A, 10], lh: hang('l'), rh: hang('r') }, d: 0.4 },
    ],
  },
  quickFeet: {
    caption: 'Low, wide stance · rapid small steps', cam: { yaw: 40 },
    keys: [
      { pose: stance({ la: [2, 14, -24], lft: 20 }), d: 0.12 },
      { pose: stance({ ra: [2, 14, 24], rft: 20 }), d: 0.12 },
    ],
  },
  shuffle: {
    caption: 'Stay low · push and reach · never cross the feet', cam: { yaw: 76 },
    keys: [
      { pose: slide(-26, 26), d: 0.22, label: 'Push' },
      { pose: slide(-26, 48), d: 0.2, label: 'Reach right' },
      { pose: slide(-4, 48), d: 0.2, label: 'Close' },
      { pose: slide(-26, 48), d: 0.2, label: 'Reach left' },
    ],
  },
  bandWalk: {
    caption: 'Quarter squat · step sideways against the band', cam: { yaw: 80 }, band: [['lk', 'rk']],
    keys: [
      { pose: slide(-16, 16, { p: [-6, 82, 0], lean: 12 }), d: 0.5, label: 'Hold the squat' },
      { pose: slide(-16, 34, { p: [-6, 82, 9], lean: 12 }), d: 0.5, label: 'Step out' },
      { pose: slide(2, 34, { p: [-6, 82, 18], lean: 12 }), d: 0.5, label: 'Follow' },
      { pose: slide(-16, 34, { p: [-6, 82, 9], lean: 12 }), d: 0.5, label: 'Step back' },
    ],
  },
  touch: {
    caption: 'Shuffle · touch the tape with the left hand only', cam: { yaw: 76 }, tape: [[[20, 0, -60], [20, 0, -40]]],
    keys: [
      { pose: slide(-26, 26), d: 0.24 },
      { pose: slide(-48, 26), d: 0.2, label: 'Shuffle' },
      { pose: slide(-48, -4), d: 0.2 },
      { pose: { p: [-6, 58, -30], lean: 38, bend: 22, la: [2, A, -48], ra: [2, A, -4], lh: [16, 4, -50], rh: { s: [18, -30, 6] } }, d: 0.32, hold: 0.2, label: 'Touch · left hand' },
      { pose: slide(-48, -4), d: 0.3 },
      { pose: slide(-48, 26), d: 0.2, label: 'Shuffle back' },
    ],
  },
  closeout: {
    caption: 'Chop the feet · high left hand · slide', cam: { yaw: 40 },
    keys: [
      { pose: stance({ p: [-28, 76, 0], la: [-20, A, -18], ra: [-32, A, 18] }), d: 0.6, label: 'Approach' },
      { pose: stance({ p: [-12, 80, 0], lean: 14, la: [-2, 12, -16], ra: [-14, A, 16] }), d: 0.25, label: 'Chop' },
      { pose: stance({ p: [-4, 80, 0], lean: 14, la: [4, A, -16], ra: [-8, 12, 16] }), d: 0.2, label: 'Chop' },
      { pose: { p: [2, 82, 0], lean: 8, la: [16, A, -14], ra: [-14, A, 16], rft: 20, lh: { s: [8, 52, -6] }, rh: { s: [16, -30, 8] } }, d: 0.25, hold: 0.45, label: 'Closeout · hand high' },
      { pose: slide(-6, 40, { p: [-6, 72, 17] }), d: 0.3, label: 'Slide' },
      { pose: slide(-26, 26, { p: [-6, 72, 0] }), d: 0.3, label: 'Slide back' },
    ],
  },
  pivot: {
    caption: 'Drop step to open the hips · two sharp steps', cam: { yaw: 50, tilt: 10 },
    keys: [
      { pose: stance(), d: 0.8, hold: 0.3, label: 'Stance' },
      { pose: stance({ yaw: -60, p: [-8, 76, 10], la: [2, A, -20], ra: [-20, A, 32] }), d: 0.35, label: 'Drop step' },
      { pose: stance({ yaw: -60, lean: 30, p: [4, 80, 28], la: [18, A, 46], ra: [-14, 10, 36], rft: 35 }), d: 0.25, label: 'Step 1' },
      { pose: stance({ yaw: -60, lean: 30, p: [14, 82, 46], ra: [28, A, 72], la: [10, 12, 44], lft: 35 }), d: 0.25, hold: 0.3, label: 'Step 2' },
    ],
  },
  square: {
    caption: 'Two-foot hops around the taped square', cam: { yaw: 35, tilt: 30 },
    tape: [[[16, 0, -16], [16, 0, 16], [-16, 0, 16], [-16, 0, -16], [16, 0, -16]], [[0, 0, -32], [0, 0, 32]], [[-32, 0, 0], [32, 0, 0]]],
    keys: [
      { pose: ground(16, -16), d: 0.22, ease: 'in', label: 'Front left' },
      { pose: air(102, { p: [16, 102, 0] }), d: 0.18, ease: 'out' },
      { pose: ground(16, 16), d: 0.22, ease: 'in', label: 'Front right' },
      { pose: air(102, { p: [0, 102, 16] }), d: 0.18, ease: 'out' },
      { pose: ground(-16, 16), d: 0.22, ease: 'in', label: 'Back right' },
      { pose: air(102, { p: [-16, 102, 0] }), d: 0.18, ease: 'out' },
      { pose: ground(-16, -16), d: 0.22, ease: 'in', label: 'Back left' },
      { pose: air(102, { p: [0, 102, -16] }), d: 0.18, ease: 'out' },
    ],
  },
  suitcase: {
    caption: 'Dumbbell in the left hand · slow march without leaning', db: 'l',
    keys: [
      { pose: kneeUp('l', { lh: { s: [2, -53, -5] }, rh: hang('r') }), d: 0.8, hold: 0.4, label: 'Left knee up' },
      { pose: kneesDown({ lh: { s: [2, -53, -5] } }), d: 0.6, label: 'Down' },
      { pose: kneeUp('r', { lh: { s: [2, -53, -5] }, rh: hang('r') }), d: 0.8, hold: 0.4, label: 'Right knee up' },
      { pose: kneesDown({ lh: { s: [2, -53, -5] } }), d: 0.6, label: 'Down' },
    ],
  },
  swing: {
    caption: 'Left hand on support · swing from the hip', post: [0, 0, -46],
    keys: [
      { pose: { p: [0, 93, 0], la: [0, A, -9], ra: { s: [52, -66, 1] }, rft: -10, lh: [0, 112, -40], rh: hang('r') }, d: 0.6, label: 'Swing forward' },
      { pose: { p: [0, 93, 0], la: [0, A, -9], ra: { s: [-44, -72, 1] }, rft: 30, lh: [0, 112, -40], rh: hang('r') }, d: 0.6, label: 'Swing back' },
    ],
  },
  /* ---------- Core ---------- */
  deadbug: {
    caption: 'Low back stays down · reach opposite arm and leg', arms: 'both', mat: true,
    keys: [
      { pose: supine({ la: [42, 56, -9], ra: [42, 56, 9], lh: { s: [0, 54, -1] }, rh: { s: [0, 54, 1] } }), d: 1, hold: 0.2, label: 'Tabletop' },
      { pose: supine({ la: [82, 16, -9], ra: [42, 56, 9], lh: { s: [0, 54, -1] }, rh: { s: [-52, 6, 2] } }), d: 1.2, hold: 0.4, label: 'Reach long' },
      { pose: supine({ la: [42, 56, -9], ra: [42, 56, 9], lh: { s: [0, 54, -1] }, rh: { s: [0, 54, 1] } }), d: 1, hold: 0.2, label: 'Tabletop' },
      { pose: supine({ ra: [82, 16, 9], la: [42, 56, -9], rh: { s: [0, 54, 1] }, lh: { s: [-52, 6, -2] } }), d: 1.2, hold: 0.4, label: 'Other side' },
    ],
  },
  hollow: {
    caption: 'Low back down · shoulders and legs hover', arms: 'both', hold: true, mat: true,
    keys: [
      { pose: supine({ lean: 22, la: [84, 24, -6], ra: [84, 24, 6], lft: 20, rft: 20, lh: { r: [14, 48, -8] }, rh: { r: [14, 48, 8] } }), d: 1.6, hold: 1.5, label: 'Hold the hollow' },
      { pose: supine({ lean: 20, la: [84, 21, -6], ra: [84, 21, 6], lft: 20, rft: 20, lh: { r: [14, 48, -8] }, rh: { r: [14, 48, 8] } }), d: 1.4, label: 'Breathe' },
    ],
  },
  crunch: {
    caption: 'Curl the pelvis toward the ribs · lower slowly', arms: 'both', mat: true,
    keys: [
      { pose: supine({ la: [42, 56, -8], ra: [42, 56, 8] }), d: 1.3, hold: 0.2, label: 'Lower slowly' },
      { pose: supine({ p: [2, 16, 0], plean: -118, lean: 28, la: [14, 66, -8], ra: [14, 66, 8] }), d: 0.8, hold: 0.4, label: 'Curl up' },
    ],
  },
  bridge: {
    caption: 'Heel on the bench · hips up · ribs down', arms: 'both', boxes: [bench(60, 100)],
    keys: [
      { pose: supine({ p: [0, 12, 0], ra: [66, 50, 9], rft: -20, la: { s: [8, 84, -1] }, lh: [-12, 4, -26], rh: [-12, 4, 26] }), d: 0.9, label: 'Set' },
      { pose: supine({ p: [0, 32, 0], plean: -116, ra: [66, 50, 9], rft: -20, la: { s: [8, 84, -1] }, lh: [-12, 4, -26], rh: [-12, 4, 26] }), d: 1, hold: 2.6, label: 'Hips up · hold' },
    ],
  },
  adductor: {
    caption: 'Squeeze the pillow between the knees · breathe', arms: 'both', pillow: 'knees', cam: { yaw: 0, tilt: 22 }, mat: true,
    keys: [
      { pose: supine({ laPole: [1, 0, -0.25], raPole: [1, 0, 0.25] }), d: 1, hold: 0.4, label: 'Relax' },
      { pose: supine({ laPole: [1, 0, 0.12], raPole: [1, 0, -0.12] }), d: 0.6, hold: 2.2, label: 'Squeeze · breathe' },
    ],
  },
  legRaise: {
    caption: 'Hips stacked · lift the top leg slightly back', arms: 'both', cam: { yaw: 180, tilt: 15 }, mat: true,
    keys: [
      { pose: sideLying({ la: [84, 22, 2], ra: [84, 4, 2], lh: [-6, 4, 32], rh: [-100, 4, 0] }), d: 0.9, hold: 0.2, label: 'Lower slowly' },
      { pose: sideLying({ la: [78, 48, -8], ra: [84, 4, 2], lh: [-6, 4, 32], rh: [-100, 4, 0] }), d: 0.8, hold: 0.4, label: 'Lift' },
    ],
  },
  hipExt: {
    caption: 'Left hand on the wall · sweep the leg back', wall: 46,
    keys: [
      { pose: { p: [0, 92, 0], lean: 6, la: [2, 9, -10], ra: [0, A, 9], lh: [44, 118, -18], rh: hang('r') }, d: 0.9, hold: 0.2, label: 'Return' },
      { pose: { p: [0, 92, 0], lean: 10, la: { s: [-36, -78, -1] }, lft: 20, ra: [0, A, 9], lh: [44, 118, -18], rh: hang('r') }, d: 0.8, hold: 0.4, label: 'Squeeze back' },
    ],
  },
  chop: {
    caption: 'Band under the foot · lift diagonally across the body', cam: { yaw: 55 }, arms: 'both', band: [['rmid', 'lh'], ['rmid', 'rh']],
    keys: [
      { pose: { p: [-10, 70, 0], lean: 30, twist: -40, ...feet(0, 16), lh: [28, 64, 16], rh: [30, 62, 22] }, d: 1.2, hold: 0.2, label: 'Low by the knee' },
      { pose: { p: [0, PH, 0], lean: -4, twist: 40, ...feet(0, 16), rft: 30, lh: [14, 186, -26], rh: [16, 184, -20] }, d: 0.9, hold: 0.3, label: 'Lift high across' },
    ],
  },
  anklePump: {
    caption: 'Legs long · band around the forefoot · point and flex', band: [['ltoe', 'lh']],
    keys: [
      { pose: seat({ lh: { s: [44, -30, -4] }, rh: { s: [24, -44, 6] }, lft: -20 }), d: 0.9, hold: 0.2, label: 'Pull the toes back' },
      { pose: seat({ lh: { s: [46, -30, -4] }, rh: { s: [24, -44, 6] }, lft: 45 }), d: 0.9, hold: 0.3, label: 'Point against the band' },
    ],
  },
  /* ---------- Upper body (no anchors) ---------- */
  bandPress: {
    caption: 'Band across the upper back · press to arm’s length', cam: { yaw: 32 }, arms: 'both', tempo: { down: 0, up: 1 }, band: [['back', 'lh'], ['back', 'rh']],
    keys: [
      { pose: stand({ ...feet(0, 14), ...pair([10, -10, 14]), lhPole: [-1, -0.3, -0.6], rhPole: [-1, -0.3, 0.6] }), d: 1.6, hold: 0.6, label: 'Return slowly' },
      { pose: stand({ ...feet(0, 14), ...pair([52, -6, -4]), lhPole: [0, -1, -1], rhPole: [0, -1, 1] }), d: 1.6, hold: 0.3, label: 'Press out' },
    ],
  },
  row: {
    caption: 'Sit tall · band around the feet · elbows back', arms: 'both', band: [['ltoe', 'lh'], ['rtoe', 'rh']],
    keys: [
      { pose: seat(pair([50, -16, -4])), d: 1.2, hold: 0.2, label: 'Arms long' },
      { pose: seat({ lean: 2, ...pair([6, -32, 10]), lhPole: [-1, 0, -0.4], rhPole: [-1, 0, 0.4] }), d: 1, hold: 0.6, label: 'Row · squeeze' },
    ],
  },
  ohp: {
    caption: 'Half-kneel · press up without leaning', band: [['ltoe', 'lh']],
    keys: [
      { pose: halfKneel({ lh: { s: [6, 4, -8] }, lhPole: [0.2, -1, -0.6] }), d: 1.2, hold: 0.2, label: 'Hand at the shoulder' },
      { pose: halfKneel({ lh: { s: [2, 54, -3] }, lhPole: [0.3, -1, -0.6] }), d: 1, hold: 0.3, label: 'Press overhead' },
    ],
  },
  ytw: {
    caption: 'Face down · lift into Y, T, then W', arms: 'both', cam: { yaw: 15, tilt: 52 }, mat: true,
    keys: [
      { pose: prone({ lh: { r: [-10, 44, -30] }, rh: { r: [-10, 44, 30] } }), d: 1, hold: 0.6, label: 'Y' },
      { pose: prone({ lh: { r: [-10, 0, -54] }, rh: { r: [-10, 0, 54] } }), d: 1, hold: 0.6, label: 'T' },
      { pose: prone({ lh: { r: [-8, 6, -24] }, rh: { r: [-8, 6, 24] }, lhPole: [0, -1, -1], rhPole: [0, -1, 1] }), d: 1, hold: 0.6, label: 'W' },
    ],
  },
  wallPress: {
    caption: 'Body in one straight line · chest toward the wall', wall: 56, arms: 'both', cam: { yaw: 20 },
    keys: [
      { pose: { p: [-8.1, 89.7, 0], plean: 18, la: [-35, A, -10], ra: [-35, A, 10], lh: [55, 128, -20], rh: [55, 128, 20], lhPole: [0, -1, -1], rhPole: [0, -1, 1] }, d: 1.1, hold: 0.2, label: 'Press away' },
      { pose: { p: [5.8, 83.8, 0], plean: 28, la: [-35, A, -10], ra: [-35, A, 10], lh: [55, 128, -20], rh: [55, 128, 20], lhPole: [0, -1, -1], rhPole: [0, -1, 1] }, d: 1.3, hold: 0.2, label: 'Lower to the wall' },
    ],
  },
  pullApart: {
    caption: 'Long arms · pull the band to the chest', cam: { yaw: 68 }, arms: 'both', band: [['lh', 'rh']],
    keys: [
      { pose: stand({ ...feet(0, 13), ...pair([52, -2, -7]) }), d: 1.1, hold: 0.2, label: 'Arms forward' },
      { pose: stand({ ...feet(0, 13), ...pair([6, -2, 53]) }), d: 0.9, hold: 0.5, label: 'Pull apart' },
    ],
  },
  fly: {
    caption: 'Band across the back · hug the hands together', cam: { yaw: 55, tilt: 12 }, arms: 'both', band: [['back', 'lh'], ['back', 'rh']],
    keys: [
      { pose: stand({ ...feet(0, 13), ...pair([12, -6, 48]) }), d: 1.2, hold: 0.2, label: 'Open wide' },
      { pose: stand({ ...feet(0, 13), ...pair([46, -8, 5]) }), d: 1, hold: 0.4, label: 'Hug together' },
    ],
  },
  pulldown: {
    caption: 'Band overhead · pull apart as elbows drop to the ribs', cam: { yaw: 82 }, arms: 'both', band: [['lh', 'rh']],
    keys: [
      { pose: stand({ ...feet(0, 13), ...pair([6, 52, 24]) }), d: 1.1, hold: 0.2, label: 'Arms overhead' },
      { pose: stand({ ...feet(0, 13), ...pair([-2, 6, 44]), lhPole: [0, -1, -0.4], rhPole: [0, -1, 0.4] }), d: 1, hold: 0.4, label: 'Pull down + apart' },
    ],
  },
  raise: {
    caption: 'Stand on the band · straight arms to eye level', cam: { yaw: 18 }, arms: 'both', band: [['lmid', 'lh'], ['rmid', 'rh']],
    keys: [
      { pose: stand({ ...feet(0, 12), ...pair([8, -52, 10]) }), d: 1.2, hold: 0.2, label: 'Lower slowly' },
      { pose: stand({ ...feet(0, 12), ...pair([50, 14, 10]) }), d: 1, hold: 0.3, label: 'Raise to eye level' },
    ],
  },
  reverseFly: {
    caption: 'Slight hinge · open the arms wide', cam: { yaw: 70, tilt: 10 }, arms: 'both', band: [['lh', 'rh']],
    keys: [
      { pose: stand({ p: [-6, 90, 0], lean: 25, ...feet(0, 13), ...pair([24, -46, 6]) }), d: 1.1, hold: 0.2, label: 'Hands together' },
      { pose: stand({ p: [-6, 90, 0], lean: 25, ...feet(0, 13), ...pair([6, -20, 50]) }), d: 0.9, hold: 0.4, label: 'Open wide' },
    ],
  },
  curl: {
    caption: 'Stand on the band · elbows pinned to the ribs', cam: { yaw: 20 }, arms: 'both', band: [['lmid', 'lh'], ['rmid', 'rh']],
    keys: [
      { pose: stand({ ...feet(0, 12), ...pair([5, -52, 6]) }), d: 1.2, hold: 0.2, label: 'Lower slowly' },
      { pose: stand({ ...feet(0, 12), ...pair([14, -8, 6]), lhPole: [-1, -1, -0.2], rhPole: [-1, -1, 0.2] }), d: 0.9, hold: 0.3, label: 'Curl up' },
    ],
  },
  tricepsExt: {
    caption: 'Band under the back foot · extend overhead', cam: { yaw: 15 }, arms: 'both', band: [['rmid', 'lh'], ['rmid', 'rh']],
    keys: [
      { pose: stand({ la: [10, A, -10], ra: [-28, A, 10], lh: { r: [-12, 26, 2] }, rh: { r: [-12, 26, -2] }, lhPole: [1, 1, -0.3], rhPole: [1, 1, 0.3] }), d: 1.2, hold: 0.2, label: 'Hands behind the head' },
      { pose: stand({ la: [10, A, -10], ra: [-28, A, 10], ...pair([2, 54, 4]), lhPole: [1, 1, -0.3], rhPole: [1, 1, 0.3] }), d: 0.9, hold: 0.3, label: 'Extend overhead' },
    ],
  },
  dbRow: {
    caption: 'Split stance · hinge · row to the left hip', db: 'l', tempo: { down: 0, up: 1 },
    keys: [
      { pose: { p: [-4, 86, 0], lean: 45, la: [-30, A, -10], ra: [20, A, 10], lh: { s: [2, -53, -2] }, rh: { s: [6, -46, 6] } }, d: 1.6, hold: 0.6, label: 'Arm long' },
      { pose: { p: [-4, 86, 0], lean: 45, la: [-30, A, -10], ra: [20, A, 10], lh: { s: [-16, -26, -4] }, lhPole: [-1, 0.8, -0.2], rh: { s: [6, -46, 6] } }, d: 1.4, hold: 0.4, label: 'Row to the hip' },
    ],
  },
  bentRow: {
    caption: 'Hinge with a flat back · row both elbows to the hips', arms: 'both', cam: { yaw: 25 },
    keys: [
      { pose: { p: [-12, 84, 0], lean: 50, ...feet(0, 13), lh: { s: [2, -53, -4] }, rh: { s: [2, -53, 4] } }, d: 1.4, hold: 0.2, label: 'Arms long' },
      { pose: { p: [-12, 84, 0], lean: 50, ...feet(0, 13), ...pair([-16, -26, 6]), lhPole: [-1, 0.8, -0.2], rhPole: [-1, 0.8, 0.2] }, d: 1, hold: 0.4, label: 'Row' },
    ],
  },
  press: {
    caption: 'Upper arms on the floor · press straight up', arms: 'both', cam: { yaw: 20, tilt: 15 }, mat: true,
    keys: [
      { pose: supine({ lh: { s: [6, 22, -4] }, rh: { s: [6, 22, 4] }, lhPole: [-0.3, -0.4, -1], rhPole: [-0.3, -0.4, 1] }), d: 1.4, hold: 0.3, label: 'Lower' },
      { pose: supine({ lh: { s: [2, 54, 4] }, rh: { s: [2, 54, -4] }, lhPole: [-0.3, -0.4, -1], rhPole: [-0.3, -0.4, 1] }), d: 1, hold: 0.3, label: 'Press' },
    ],
  },
  pullover: {
    caption: 'Lie on the bench · long arms lower behind the head', db: 'chest', arms: 'both', boxes: [bench(-70, 22, 42, 18)],
    keys: [
      { pose: { p: [10, 52, 0], plean: -90, la: [50, A, -16], ra: [50, A, 16], lh: { s: [0, 52, 6] }, rh: { s: [0, 52, -6] } }, d: 1.2, hold: 0.2, label: 'Over the chest' },
      { pose: { p: [10, 52, 0], plean: -90, la: [50, A, -16], ra: [50, A, 16], lh: { s: [-50, 10, 6] }, rh: { s: [-50, 10, -6] } }, d: 1.8, hold: 0.3, label: 'Lower behind the head' },
    ],
  },
  pushup: {
    caption: 'One straight line · lower as a unit', arms: 'both', cam: { yaw: 18 },
    keys: [
      { pose: { p: [-47.4, 40.3, 0], plean: 71.7, la: [-130, 13, -10], ra: [-130, 13, 10], lft: 70, rft: 70, lh: [2, 4, -20], rh: [2, 4, 20] }, d: 1, hold: 0.2, label: 'Press up' },
      { pose: { p: [-43.2, 18.7, 0], plean: 86.3, la: [-130, 13, -10], ra: [-130, 13, 10], lft: 70, rft: 70, lh: [2, 4, -20], rh: [2, 4, 20], lhPole: [-1, 0, -1], rhPole: [-1, 0, 1] }, d: 1.4, hold: 0.2, label: 'Lower' },
    ],
  },
  inclinePushup: {
    caption: 'Hands on the bench · body straight', arms: 'both', cam: { yaw: 18 }, boxes: [bench(-6, 30)],
    keys: [
      { pose: { p: [-39.4, 64.9, 0], plean: 50, la: [-106, 9, -10], ra: [-106, 9, 10], lft: 20, rft: 20, lh: [2, 46, -20], rh: [2, 46, 20] }, d: 1, hold: 0.2, label: 'Press away' },
      { pose: { p: [-27, 45.3, 0], plean: 65.3, la: [-106, 9, -10], ra: [-106, 9, 10], lft: 20, rft: 20, lh: [2, 46, -20], rh: [2, 46, 20], lhPole: [-1, 0, -1], rhPole: [-1, 0, 1] }, d: 1.3, hold: 0.2, label: 'Lower to the bench' },
    ],
  },
  /* ---------- Stretching ---------- */
  rock: {
    caption: 'Front knee drives past the toes · heel stays down',
    keys: [
      { pose: halfKneel({ p: [-4, 49, 0], ra: kneelShin('r', -4), lh: { s: [24, -32, -6] } }), d: 0.9, label: 'Back' },
      { pose: halfKneel({ p: [8, 47.3, 0], ra: kneelShin('r', -4), lh: { s: [24, -32, -6] } }), d: 0.9, hold: 0.4, label: 'Knee past the toes' },
    ],
  },
  kneel: {
    caption: 'Tuck the pelvis · reach the left arm overhead',
    keys: [
      { pose: halfKneel({ p: [-4, 49, 0], ra: kneelShin('r', -4) }), d: 1, hold: 0.3, label: 'Tall half-kneel' },
      { pose: halfKneel({ p: [8, 47.3, 0], plean: -6, bend: -10, ra: kneelShin('r', -4), lh: { s: [6, 54, 3] } }), d: 1.4, hold: 2.5, label: 'Tuck · reach · hold' },
    ],
  },
  couch: {
    caption: 'Back shin up the bench · tuck the pelvis · stay tall', boxes: [bench(-66, -24)], mat: true,
    keys: [
      { pose: { p: [-10, 48.3, 0], lean: -2, la: [32, A, -10], ra: { k: [-18, 5, 10], a: [-24, 47, 10] }, rft: 40, lh: { s: [24, -40, -6] }, rh: hang('r') }, d: 1, hold: 0.4, label: 'Set up' },
      { pose: { p: [-6, 47.3, 0], plean: -8, la: [32, A, -10], ra: { k: [-18, 5, 10], a: [-24, 47, 10] }, rft: 40, lh: { s: [24, -40, -6] }, rh: hang('r') }, d: 1.4, hold: 2.6, label: 'Tuck · hold' },
    ],
  },
  calfStretch: {
    caption: 'Left hand on the wall · back heel down', wall: 52,
    keys: [
      { pose: { p: [-2, 84, 0], plean: 10, la: [16, A, -10], ra: [-42, A, 10], lh: [50, 132, -18], rh: hang('r') }, d: 1.2, hold: 2.5, label: 'Straight back knee' },
      { pose: { p: [-2, 76, 0], plean: 8, la: [16, A, -10], ra: [-42, A, 10], lh: [50, 128, -18], rh: hang('r') }, d: 1.2, hold: 2.5, label: 'Bend the back knee' },
    ],
  },
  hamstring: {
    caption: 'Heel on the bench · hinge from the hips', boxes: [bench(52, 92)],
    keys: [
      { pose: { p: [0, 92, 0], la: [72, 50, -9], lft: -25, ra: [-2, A, 9], lh: hang('l'), rh: hang('r') }, d: 1, hold: 0.5, label: 'Leg long on the bench' },
      { pose: { p: [-6, 89, 0], lean: 38, la: [72, 50, -9], lft: -25, ra: [-2, A, 9], lh: { s: [28, -36, -4] }, rh: hang('r') }, d: 1.6, hold: 2.5, label: 'Hinge forward' },
    ],
  },
  book: {
    caption: 'Knees stacked · open the top arm and follow it with the eyes', arms: 'both', cam: { yaw: 180, tilt: 35 }, mat: true,
    keys: [
      { pose: sideLying({ la: { k: [0, 22, 44], a: [43, 22, 44] }, ra: { k: [0, 4, 44], a: [43, 4, 44] }, lft: 30, rft: 30, lh: { r: [52, 0, 2] }, rh: [-20, 4, 46] }), d: 1.2, hold: 0.4, label: 'Arms together' },
      { pose: sideLying({ twist: 135, turn: 40, la: { k: [0, 22, 44], a: [43, 22, 44] }, ra: { k: [0, 4, 44], a: [43, 4, 44] }, lft: 30, rft: 30, lh: { r: [52, 0, 2] }, rh: [-20, 4, 46] }), d: 2, hold: 1.2, label: 'Open the book' },
    ],
  },
  lift: {
    caption: 'Straight leg up and over the pillow', cam: { yaw: 60, tilt: 18 }, pillow: [58, 6, -30], arms: 'both',
    keys: [
      { pose: seat({ lean: 4, la: [82, A, -12], ra: [82, A, 12], lh: [-6, 4, -28], rh: { s: [24, -44, 4] } }), d: 0.8, hold: 0.2, label: 'Leg long' },
      { pose: seat({ lean: 4, la: [78, 36, -26], ra: [82, A, 12], lh: [-6, 4, -28], rh: { s: [24, -44, 4] } }), d: 0.7, label: 'Lift' },
      { pose: seat({ lean: 4, la: [76, A, -46], ra: [82, A, 12], lh: [-6, 4, -28], rh: { s: [24, -44, 4] } }), d: 0.7, hold: 0.2, label: 'Over the pillow' },
      { pose: seat({ lean: 4, la: [78, 36, -26], ra: [82, A, 12], lh: [-6, 4, -28], rh: { s: [24, -44, 4] } }), d: 0.7, label: 'Back over' },
    ],
  },
  switch: {
    caption: 'Feet wide and planted · rotate both knees together', cam: { yaw: 88, tilt: 22 }, mat: true,
    keys: [
      { pose: { p: [0, 10, 0], lean: 2, la: [36, A, -34], ra: [36, A, 34], laPole: [0.2, 0.2, -1], raPole: [0.2, 0.2, -1], lh: [-24, 4, -22], rh: { s: [20, -40, 6] } }, d: 1.1, hold: 0.4, label: 'Knees left' },
      { pose: { p: [0, 10, 0], lean: 2, la: [36, A, -34], ra: [36, A, 34], laPole: [0.2, 1, -0.1], raPole: [0.2, 1, 0.1], lh: [-24, 4, -22], rh: { s: [20, -40, 6] } }, d: 0.9, label: 'Through center' },
      { pose: { p: [0, 10, 0], lean: 2, la: [36, A, -34], ra: [36, A, 34], laPole: [0.2, 0.2, 1], raPole: [0.2, 0.2, 1], lh: [-24, 4, -22], rh: { s: [20, -40, 6] } }, d: 0.9, hold: 0.4, label: 'Knees right' },
      { pose: { p: [0, 10, 0], lean: 2, la: [36, A, -34], ra: [36, A, 34], laPole: [0.2, 1, -0.1], raPole: [0.2, 1, 0.1], lh: [-24, 4, -22], rh: { s: [20, -40, 6] } }, d: 0.9, label: 'Through center' },
    ],
  },
  sideReach: {
    caption: 'Sit tall in 90/90 · reach the left arm overhead', cam: { yaw: 80, tilt: 20 }, mat: true,
    keys: [
      { pose: ninety({ lh: { s: [16, -40, -8] } }), d: 1, hold: 0.3, label: 'Sit tall' },
      { pose: ninety({ bend: -22, lh: { r: [2, 50, 8] } }), d: 1.2, hold: 2, label: 'Reach · hold 2 s' },
    ],
  },
  kneeLift: {
    caption: 'Hips still · lift the back knee off the floor', cam: { yaw: 80, tilt: 20 }, mat: true,
    keys: [
      { pose: ninety({ lean: -4 }), d: 0.9, hold: 0.3, label: 'Set' },
      { pose: ninety({ lean: -4, ra: { k: [14, 22, 46], a: [-28, 6, 58] } }), d: 0.8, hold: 0.6, label: 'Lift the back knee' },
    ],
  },
  straddle: {
    caption: 'Legs wide · hinge forward from the hips', cam: { yaw: 55, tilt: 20 }, hold: true, mat: true,
    keys: [
      { pose: { p: [0, 10, 0], la: [62, A, -60], ra: [62, A, 60], laPole: [0, 1, -0.3], raPole: [0, 1, 0.3], lft: -10, rft: -10, ...pair([30, -30, 8]) }, d: 1.2, hold: 0.3, label: 'Sit tall' },
      { pose: { p: [0, 10, 0], lean: 34, la: [62, A, -60], ra: [62, A, 60], laPole: [0, 1, -0.3], raPole: [0, 1, 0.3], lft: -10, rft: -10, ...pair([44, -18, 10]) }, d: 1.8, hold: 2.5, label: 'Hinge · breathe' },
    ],
  },
  pigeon: {
    caption: 'Front shin across the bench · hinge gently', cam: { yaw: 40, tilt: 15 }, boxes: [bench(22, 62, 42, 40)],
    keys: [
      { pose: { p: [14, 80, 0], la: { k: [40, 49, -30], a: [40, 49, 12] }, ra: [-32, A, 10], lft: 40, lh: hang('l'), rh: hang('r') }, d: 1, hold: 0.4, label: 'Set the shin' },
      { pose: { p: [14, 80, 0], lean: 38, la: { k: [40, 49, -30], a: [40, 49, 12] }, ra: [-32, A, 10], lft: 40, lh: { s: [14, -48, -4] }, rh: hang('r') }, d: 1.8, hold: 2.5, label: 'Hinge · hold' },
    ],
  },
  pass: {
    caption: 'Wide grip · lift the band overhead and back', cam: { yaw: 70 }, arms: 'both', band: [['lh', 'rh']],
    keys: [
      { pose: stand({ ...feet(0, 13), ...pair([26, -46, 30]) }), d: 1, hold: 0.2, label: 'In front' },
      { pose: stand({ ...feet(0, 13), ...pair([4, 52, 34]) }), d: 1, label: 'Overhead' },
      { pose: stand({ ...feet(0, 13), ...pair([-26, 34, 36]) }), d: 0.9, hold: 0.3, label: 'Behind' },
      { pose: stand({ ...feet(0, 13), ...pair([4, 52, 34]) }), d: 0.9, label: 'Overhead' },
    ],
  },
  roll: {
    caption: 'Roll the arch slowly over the tennis ball',
    ball: () => [{ kind: 'tennis', r: 3.4, p: [0, 3.4, -10] }],
    keys: [
      { pose: { p: [-2, 93, 0], la: [3, 12, -10], ra: [-2, A, 9], lh: { s: [10, -46, -10] }, rh: hang('r') }, d: 1.1, label: 'Heel over the ball' },
      { pose: { p: [-2, 93, 0], la: [-10, 12, -10], ra: [-2, A, 9], lh: { s: [10, -46, -10] }, rh: hang('r') }, d: 1.1, label: 'Forefoot over the ball' },
    ],
  },
  /* ---------- Ball handling ---------- */
  dribbleLow: {
    caption: 'Pound the ball below the knee · left fingertips',
    ball: dribbleBall([{ release: 1, catch: 0, floor: [34, 0, -28] }]),
    keys: [
      { pose: dribbler([30, 44, -28], { p: [-10, 56, 0], lean: 40 }), d: 0.28, ease: 'out', label: 'Receive' },
      { pose: dribbler([31, 37, -28], { p: [-10, 56, 0], lean: 40 }), d: 0.12, ease: 'in', label: 'Pound' },
    ],
  },
  dribble: {
    caption: 'Snap the wrist · knee-height rebound',
    ball: dribbleBall([{ release: 1, catch: 0, floor: [32, 0, -28] }]),
    keys: [
      { pose: dribbler([28, 62, -28]), d: 0.38, ease: 'out', label: 'Receive' },
      { pose: dribbler([30, 52, -28]), d: 0.16, ease: 'in', label: 'Pound' },
    ],
  },
  dribbleRight: {
    caption: 'Right-hand mirror at the cleared pace', arms: 'both',
    ball: dribbleBall([{ release: 1, catch: 0, floor: [32, 0, 28], hand: 'rh' }], 'rh'),
    keys: [
      { pose: dribbler([28, 62, -28], { lh: { s: [20, -36, -6] }, rh: [28, 62, 28], rhPole: [-1, 0.3, 0.7] }), d: 0.38, ease: 'out', label: 'Receive' },
      { pose: dribbler([28, 62, -28], { lh: { s: [20, -36, -6] }, rh: [30, 52, 28], rhPole: [-1, 0.3, 0.7] }), d: 0.16, ease: 'in', label: 'Pound' },
    ],
  },
  dribbleHigh: {
    caption: 'Drive the ball down · meet the high rebound',
    ball: dribbleBall([{ release: 1, catch: 0, floor: [34, 0, -30] }]),
    keys: [
      { pose: dribbler([30, 120, -30], { p: [-4, 86, 0], lean: 10 }), d: 0.56, ease: 'out', label: 'Receive high' },
      { pose: dribbler([32, 100, -30], { p: [-4, 86, 0], lean: 10 }), d: 0.22, ease: 'in', label: 'Drive down' },
    ],
  },
  vDribble: {
    caption: 'Front-to-back V beside the left hip',
    ball: dribbleBall([{ release: 1, catch: 2, floor: [22, 0, -30] }, { release: 3, catch: 0, floor: [22, 0, -30] }]),
    keys: [
      { pose: dribbler([38, 60, -28]), d: 0.34, ease: 'out', label: 'Front' },
      { pose: dribbler([32, 54, -29]), d: 0.14, ease: 'in', label: 'Push back' },
      { pose: dribbler([4, 62, -32]), d: 0.34, ease: 'out', label: 'Back' },
      { pose: dribbler([12, 55, -31]), d: 0.14, ease: 'in', label: 'Push forward' },
    ],
  },
  vSide: {
    caption: 'Side-to-side V in front of you', cam: { yaw: 80 },
    ball: dribbleBall([{ release: 1, catch: 2, floor: [32, 0, -22] }, { release: 3, catch: 0, floor: [32, 0, -22] }]),
    keys: [
      { pose: dribbler([28, 63, -40]), d: 0.34, ease: 'out', label: 'Outside' },
      { pose: dribbler([29, 57, -36]), d: 0.14, ease: 'in', label: 'Push in' },
      { pose: dribbler([28, 63, -4]), d: 0.34, ease: 'out', label: 'Middle' },
      { pose: dribbler([29, 57, -8]), d: 0.14, ease: 'in', label: 'Push out' },
    ],
  },
  gather: {
    caption: 'Dribble · head fake · pull back to the left hip',
    ball: dribbleBall([{ release: 1, catch: 2, floor: [32, 0, -28] }, { release: 3, catch: 4, floor: [32, 0, -28] }]),
    keys: [
      { pose: dribbler([28, 62, -28]), d: 0.5, ease: 'out', label: 'Dribble' },
      { pose: dribbler([30, 52, -28]), d: 0.16, ease: 'in' },
      { pose: dribbler([28, 62, -28]), d: 0.38, ease: 'out', label: 'Dribble' },
      { pose: dribbler([30, 52, -28]), d: 0.16, ease: 'in' },
      { pose: dribbler([4, 78, -32], { p: [-10, 70, 0], lean: 24 }), d: 0.42, ease: 'out', label: 'Pull back to the hip' },
      { pose: dribbler([4, 80, -32], { p: [-10, 70, 0], lean: 24, twist: 18, turn: 25, nod: 8 }), d: 0.25, hold: 0.25, label: 'Head fake' },
    ],
  },
  pickup: {
    caption: 'Jab step · pound · gather high into the left pocket',
    ball: dribbleBall([{ release: 1, catch: 2, floor: [40, 0, -28] }]),
    keys: [
      { pose: dribbler([28, 62, -28]), d: 0.5, hold: 0.2, label: 'Stance' },
      { pose: dribbler([40, 52, -28], { p: [2, 64, 0], la: [32, A, -22] }), d: 0.24, ease: 'in', label: 'Jab + pound' },
      { pose: dribbler([36, 64, -30], { p: [0, 66, 0], la: [32, A, -22] }), d: 0.36, ease: 'out', label: 'Catch' },
      { pose: dribbler([0, 96, -32], { p: [-8, 80, 0], lean: 14, la: [8, A, -22] }), d: 0.45, hold: 0.3, label: 'Gather high' },
    ],
  },
  weave: {
    caption: 'Kneeling · short left-hand taps in a figure-8', cam: { yaw: 50, tilt: 28 },
    ball: (t, ctx) => { const s = ctx.at(t); return [{ kind: 'foam', r: FOAM, p: [s.lh[0] + 2, Math.max(FOAM, s.lh[1] - FOAM - 3), s.lh[2]] }] },
    keys: [0, 1, 2, 3, 4, 5, 6, 7].map(i => {
      const a = (i / 8) * Math.PI * 2
      const x = 30 + 14 * Math.sin(2 * a), z = 26 * Math.sin(a), y = i % 2 ? 26 : 32
      return { pose: { p: [-2, 47, 0], lean: 24, la: kneelShin('l', 0), ra: kneelShin('r', 0), lft: 165, rft: 165, lh: [x, y, z - 6] as V3, lhPole: [-1, 0.4, -0.6] as V3, rh: { s: [18, -30, 6] } as Target }, d: 0.24, label: i === 0 ? 'Tap around the knees' : undefined }
    }),
  },
  dual: {
    caption: 'Toss and catch the tennis ball during the rebound',
    ball: dribbleBall([{ release: 1, catch: 0, floor: [32, 0, -28] }], 'lh', (t, ctx, now) => {
      const start = ctx.keyTime(1) + 0.05, end = ctx.keyTime(3)
      const u = (t - start) / (end - start)
      const hand: V3 = [now.lh[0] + 3, now.lh[1] + 4, now.lh[2]]
      const lift = u > 0 && u < 1 ? 4 * 26 * u * (1 - u) : 0
      return [{ kind: 'tennis', r: 3.4, p: [hand[0], hand[1] + lift, hand[2]] }]
    }),
    keys: [
      { pose: dribbler([28, 62, -28]), d: 0.3, ease: 'out', label: 'Receive the foam ball' },
      { pose: dribbler([30, 52, -28]), d: 0.16, ease: 'in', label: 'Pound' },
      { pose: dribbler([28, 70, -28]), d: 0.24, ease: 'out', label: 'Toss' },
      { pose: dribbler([28, 66, -28]), d: 0.3, label: 'Catch' },
    ],
  },
  crossover: {
    caption: 'Low crossover · hand to hand', cam: { yaw: 82 }, arms: 'both',
    ball: dribbleBall([{ release: 1, catch: 2, floor: [32, 0, 0], hand: 'lh', to: 'rh' }, { release: 3, catch: 0, floor: [32, 0, 0], hand: 'rh', to: 'lh' }]),
    keys: [
      { pose: dribbler([28, 58, -28], { rh: [28, 64, 26], rhPole: [-1, 0.3, 0.7] }), d: 0.32, ease: 'out', label: 'Left hand' },
      { pose: dribbler([30, 50, -22], { rh: [28, 64, 26], rhPole: [-1, 0.3, 0.7] }), d: 0.14, ease: 'in', label: 'Cross' },
      { pose: dribbler([28, 64, -28], { rh: [28, 58, 28], rhPole: [-1, 0.3, 0.7] }), d: 0.32, ease: 'out', label: 'Right hand' },
      { pose: dribbler([28, 64, -28], { rh: [30, 50, 22], rhPole: [-1, 0.3, 0.7] }), d: 0.14, ease: 'in', label: 'Cross back' },
    ],
  },
  wrap: {
    caption: 'Wrap the ball close around the hips', cam: { yaw: 45, tilt: 10 }, arms: 'both',
    ball: (t, ctx) => {
      const a = (t / ctx.T) * Math.PI * 2
      const s = ctx.at(t)
      return [{ kind: 'foam', r: FOAM, p: [s.pelvis[0] + 28 * Math.cos(a), 92, -30 * Math.sin(a)] }]
    },
    keys: [
      { pose: stand({ ...feet(0, 16), lh: [30, 92, -10], rh: [26, 92, 14] }), d: 0.4, label: 'Front' },
      { pose: stand({ ...feet(0, 16), lh: [0, 92, -36], rh: { s: [6, -40, 6] } }), d: 0.4, label: 'Left hand around' },
      { pose: stand({ ...feet(0, 16), lh: [-26, 92, -12], rh: [-26, 92, 12] }), d: 0.4, label: 'Hand-off behind' },
      { pose: stand({ ...feet(0, 16), lh: { s: [6, -40, -6] }, rh: [0, 92, 36] }), d: 0.4, label: 'Right hand around' },
    ],
  },
  toss: {
    caption: 'Soft toss to the wall · catch with the left hand', wall: 100,
    ball: (t, ctx) => {
      const s = ctx.at(t)
      const release = ctx.keyTime(1), caught = ctx.keyTime(3)
      const hand: V3 = [s.lh[0] + 4, s.lh[1] + 2, s.lh[2]]
      if (t < release || t > caught) return [{ kind: 'tennis', r: 3.4, p: hand }]
      const wallAt = release + (caught - release) * 0.5
      const from = ctx.at(release).lh, to = ctx.at(caught).lh
      const wallPoint: V3 = [96.6, 136, -18]
      const [a, b, u] = t < wallAt ? [[from[0] + 4, from[1] + 2, from[2]] as V3, wallPoint, (t - release) / (wallAt - release)] : [wallPoint, [to[0] + 4, to[1] + 2, to[2]] as V3, (t - wallAt) / (caught - wallAt)]
      return [{ kind: 'tennis', r: 3.4, p: [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + 4 * 9 * u * (1 - u), a[2] + (b[2] - a[2]) * u] }]
    },
    keys: [
      { pose: stand({ lh: [26, 110, -18], lhPole: [-1, -1, -0.4] }), d: 0.4, label: 'Ready' },
      { pose: stand({ lh: [32, 120, -18], lhPole: [-1, -1, -0.4] }), d: 0.18, label: 'Soft toss' },
      { pose: stand({ lh: [28, 114, -18], lhPole: [-1, -1, -0.4] }), d: 0.4 },
      { pose: stand({ lh: [30, 116, -18], lhPole: [-1, -1, -0.4] }), d: 0.4, label: 'Soft catch' },
    ],
  },
  /* ---------- Forearm close-ups ---------- */
  wrist: { caption: 'Forearm supported · move only at the wrist', closeup: 'wrist' },
  bandWrist: { caption: 'Band under the foot · lift against light tension', closeup: 'bandWrist' },
  deviate: { caption: 'Thumb up · tilt toward the thumb, then the little finger', closeup: 'deviate' },
  rotate: { caption: 'Elbow tucked · turn the palm up, then down', closeup: 'rotate' },
  fingers: { caption: 'Spread the fingers against the band', closeup: 'fingers' },
  grip: { caption: 'Gentle squeeze · hold 3 s · fully relax', closeup: 'grip' },
  prayer: { caption: 'Palms together, then backs of the hands', closeup: 'prayer' },
  toeYoga: { caption: 'Big toe up, then the other four', closeup: 'toeYoga' },
}

/* Older saved edits may still use retired movement keys. */
export const aliases: Record<string, string> = {
  pallof: 'suitcase', rowHigh: 'ytw', drive: 'kneeSwitch', jack: 'jog', hinge: 'straddle',
  toes: 'tibRaise', sideReachSeat: 'sideReach', dribbleBase: 'dribble', hang: 'bentRow',
}
export const motionFor = (move: string) => motions[move] ?? motions[aliases[move] ?? '']
