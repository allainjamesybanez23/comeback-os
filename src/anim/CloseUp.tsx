import type { ReactNode } from 'react'
import type { CloseUp } from './motions'

/* Close-up diagrams for small joints: the forearm rehab moves and toe yoga.
   Each kind is a timeline of small value vectors with labels, drawn in a 240 × 180 view. */
type CKey = { v: number[]; d: number; hold?: number; label?: string }
const timelines: Record<CloseUp, CKey[]> = {
  wrist: [
    { v: [0], d: 2, hold: 0.3, label: 'Neutral' },
    { v: [-48], d: 2, hold: 0.5, label: 'Lift the hand (extension)' },
    { v: [0], d: 2, hold: 0.3, label: 'Back to neutral' },
    { v: [52], d: 2, hold: 0.5, label: 'Lower the hand (flexion)' },
  ],
  bandWrist: [
    { v: [30], d: 2, hold: 0.3, label: 'Start low' },
    { v: [-35], d: 2, hold: 0.5, label: 'Lift against the band' },
  ],
  deviate: [
    { v: [0], d: 2, hold: 0.3, label: 'Thumb up · neutral' },
    { v: [-22], d: 2, hold: 0.5, label: 'Toward the thumb' },
    { v: [0], d: 2, hold: 0.3, label: 'Neutral' },
    { v: [28], d: 2, hold: 0.5, label: 'Toward the little finger' },
  ],
  rotate: [
    { v: [0], d: 2, hold: 0.3, label: 'Thumb up' },
    { v: [-82], d: 2, hold: 0.5, label: 'Turn palm up' },
    { v: [0], d: 2, hold: 0.3, label: 'Thumb up' },
    { v: [82], d: 2, hold: 0.5, label: 'Turn palm down' },
  ],
  fingers: [
    { v: [0], d: 1.6, hold: 0.4, label: 'Fingers together' },
    { v: [1], d: 1.2, hold: 0.6, label: 'Spread open' },
  ],
  grip: [
    { v: [0], d: 0.7, hold: 1, label: 'Fully relax' },
    { v: [1], d: 0.6, hold: 3, label: 'Squeeze gently · hold 3 s' },
  ],
  prayer: [
    { v: [0, 0], d: 1.2, hold: 0.5, label: 'Palms together' },
    { v: [0, 1], d: 1.6, hold: 2, label: 'Lower the hands slowly' },
    { v: [0, 0], d: 1.2, hold: 0.2 },
    { v: [1, 0], d: 1, hold: 0.3, label: 'Backs of the hands together' },
    { v: [1, 1], d: 1.4, hold: 2, label: 'Lift the elbows gently' },
    { v: [1, 0], d: 1.2, hold: 0.2 },
  ],
  toeYoga: [
    { v: [0], d: 0.8, hold: 0.4, label: 'Toes relaxed' },
    { v: [1], d: 0.8, hold: 1, label: 'Lift only the big toe' },
    { v: [0], d: 0.8, hold: 0.4, label: 'Press it down' },
    { v: [-1], d: 0.8, hold: 1, label: 'Lift the other four' },
  ],
}
const ease = (u: number) => u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2
export function closeUpLength(kind: CloseUp) {
  return timelines[kind].reduce((sum, key) => sum + key.d + (key.hold ?? 0), 0)
}
export function sampleCloseUp(kind: CloseUp, time: number) {
  const keys = timelines[kind]
  const T = closeUpLength(kind)
  let t = ((time % T) + T) % T
  let label = keys[0].label ?? ''
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i], next = keys[(i + 1) % keys.length]
    if (key.label) label = key.label
    const hold = key.hold ?? 0
    if (t < hold) return { v: key.v, label }
    t -= hold
    if (t < next.d) {
      const u = ease(t / next.d)
      return { v: key.v.map((value, j) => value + (next.v[j] - value) * u), label: next.label ?? label }
    }
    t -= next.d
  }
  return { v: keys[0].v, label }
}

const C = { fig: '#E6EDF9', figDim: '#9FB1CF', skin2: '#C9D6EC', line: '#5A7D9A', surface: '#16233A', band: '#7FA0FF', ball: '#CDE05A', accent: '#8CA9F5', muted: '#4A6B82' }
const rad = Math.PI / 180
const pt = (x: number, y: number, a: number, l: number): [number, number] => [x + Math.cos(a * rad) * l, y + Math.sin(a * rad) * l]

function Table() {
  return <g><rect x="-10" y="120" width="164" height="9" rx="3" fill={C.surface} stroke={C.line}/><path d="M10 129v44M136 129v44" stroke={C.line} strokeWidth="3"/></g>
}
function RangeArc({ cx, cy, r, from, to, at }: { cx: number; cy: number; r: number; from: number; to: number; at: number }) {
  const [x1, y1] = pt(cx, cy, from, r), [x2, y2] = pt(cx, cy, to, r), [x3, y3] = pt(cx, cy, at, r)
  return <g><path d={`M${x1} ${y1}A${r} ${r} 0 0 1 ${x2} ${y2}`} fill="none" stroke={C.muted} strokeWidth="2" strokeDasharray="3 5"/><circle cx={x3} cy={y3} r="4" fill={C.accent}/></g>
}
function SideHand({ angle, band }: { angle: number; band?: boolean }) {
  const [tx, ty] = pt(152, 107, angle, 62)
  return <g>
    {band && <path d={`M${tx} ${ty} Q ${tx + 6} ${(ty + 176) / 2} 168 176`} fill="none" stroke={C.band} strokeWidth="3"/>}
    <rect x="22" y="96" width="132" height="22" rx="11" fill={C.fig}/>
    <g transform={`rotate(${angle} 152 107)`}>
      <path d="M150 97h26c5 0 8 3 8 8v5c0 5-3 8-8 8h-26z" fill={C.fig}/>
      <rect x="178" y="99" width="34" height="15" rx="7.5" fill={C.skin2}/>
      <path d="M186 99v15M196 99v15" stroke={C.surface} strokeWidth="1.2" opacity=".5"/>
    </g>
    <circle cx="152" cy="107" r="3" fill={C.surface}/>
  </g>
}

export function CloseUpSvg({ kind, time, title }: { kind: CloseUp; time: number; title: string }) {
  const { v, label } = sampleCloseUp(kind, time)
  let body: ReactNode
  if (kind === 'wrist' || kind === 'bandWrist') {
    body = <><Table/><RangeArc cx={152} cy={107} r={74} from={kind === 'bandWrist' ? -35 : -48} to={kind === 'bandWrist' ? 30 : 52} at={v[0]}/><SideHand angle={v[0]} band={kind === 'bandWrist'}/></>
  } else if (kind === 'deviate') {
    const a = v[0]
    body = <>
      <rect x="-10" y="70" width="164" height="76" rx="6" fill={C.surface} stroke={C.line}/>
      <RangeArc cx={150} cy={108} r={78} from={-22} to={28} at={a}/>
      <rect x="16" y="94" width="138" height="28" rx="14" fill={C.fig}/>
      <g transform={`rotate(${a} 150 108)`}>
        <rect x="146" y="90" width="36" height="36" rx="10" fill={C.fig}/>
        {[94, 103, 112, 121].map((y, i) => <rect key={y} x="178" y={y - 3.5} width={i === 3 ? 22 : 30 - i} height="7.5" rx="3.75" fill={C.skin2}/>)}
        <path d="M160 92c6-12 18-14 26-12" stroke={C.fig} strokeWidth="8" strokeLinecap="round" fill="none"/>
      </g>
      <text x="198" y="64" fill={C.figDim} fontSize="10" textAnchor="middle">thumb side</text>
    </>
  } else if (kind === 'rotate') {
    const a = v[0]
    const palmUp = a < -40, palmDown = a > 40
    body = <>
      <path d="M40 30v120" stroke={C.muted} strokeWidth="10" strokeLinecap="round" opacity=".55"/>
      <path d="M40 120h60" stroke={C.fig} strokeWidth="18" strokeLinecap="round"/>
      <RangeArc cx={120} cy={118} r={70} from={-172} to={-8} at={a - 90}/>
      <circle cx="120" cy="118" r="24" fill={C.muted}/>
      <g transform={`rotate(${a} 120 118)`}>
        <rect x="108" y="40" width="24" height="62" rx="9" fill="none" stroke={C.accent} strokeWidth="3"/>
        <rect x="113" y="32" width="14" height="10" rx="3" fill={C.accent}/>
        <circle cx="120" cy="118" r="18" fill={C.fig}/>
        <path d="M104 112a17 17 0 0 1 32 0" stroke={C.skin2} strokeWidth="6" fill="none"/>
      </g>
      <text x="120" y="172" fill={palmUp || palmDown ? C.accent : C.figDim} fontSize="11" textAnchor="middle">{palmUp ? 'Palm up' : palmDown ? 'Palm down' : 'Thumb up'}</text>
      <text x="40" y="22" fill={C.figDim} fontSize="10" textAnchor="middle">elbow at side</text>
    </>
  } else if (kind === 'fingers') {
    const s = v[0]
    const bases: [number, number][] = [[103, 84], [114, 80], [126, 80], [137, 84]]
    const tips = bases.map(([x, y], i) => pt(x, y, -90 + (i - 1.5) * (4 + 13 * s), i === 0 || i === 3 ? 30 : 36))
    const thumb = pt(96, 112, -150 + -22 * s, 30)
    const loop = [...tips, thumb]
    body = <>
      <rect x="92" y="78" width="56" height="58" rx="16" fill={C.fig}/>
      <path d="M100 136v34h40v-34" fill={C.fig}/>
      {bases.map(([x, y], i) => <line key={i} x1={x} y1={y} x2={tips[i][0]} y2={tips[i][1]} stroke={C.skin2} strokeWidth="9" strokeLinecap="round"/>)}
      <line x1="98" y1="112" x2={thumb[0]} y2={thumb[1]} stroke={C.skin2} strokeWidth="10" strokeLinecap="round"/>
      <path d={'M' + loop.map(p => p.join(' ')).join(' L') + ' Z'} fill="none" stroke={C.band} strokeWidth="3" strokeLinejoin="round"/>
    </>
  } else if (kind === 'grip') {
    const c = v[0]
    const finger = (x: number, y: number, dim: boolean) => {
      let a = -8, px = x, py = y
      const parts: string[] = [`M${px} ${py}`]
      for (const length of [17, 13, 11]) { a += 18 + 56 * c; [px, py] = pt(px, py, a, length); parts.push(`L${px} ${py}`) }
      return <path d={parts.join('')} stroke={dim ? C.figDim : C.skin2} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    }
    body = <>
      <rect x="22" y="96" width="78" height="24" rx="12" fill={C.fig}/>
      <rect x="86" y="86" width="34" height="40" rx="12" fill={C.fig}/>
      <ellipse cx="136" cy="104" rx={22 - 2.2 * c} ry={22 + 1.4 * c} fill={C.ball}/>
      <path d="M120 92c10 8 22 8 32 0M120 116c10-8 22-8 32 0" stroke="#9CB33A" strokeWidth="2" fill="none"/>
      {finger(118, 90, true)}
      {finger(120, 84, false)}
      <path d={`M110 122 Q ${130 - 4 * c} ${132 - 8 * c} ${146 - 6 * c} ${122 - 8 * c}`} stroke={C.fig} strokeWidth="10" strokeLinecap="round" fill="none"/>
      <text x="136" y="160" fill={C.figDim} fontSize="11" textAnchor="middle">effort ≤ 2/10</text>
    </>
  } else if (kind === 'prayer') {
    const [mode, depth] = v
    const prayer = (() => {
      const wy = 98 + 28 * depth
      return <g opacity={1 - mode}>
        <path d={`M46 ${126 + 2 * depth} L114 ${wy}M194 ${126 + 2 * depth} L126 ${wy}`} stroke={C.fig} strokeWidth="16" strokeLinecap="round"/>
        <rect x="111" y={wy - 50} width="9" height="52" rx="4.5" fill={C.skin2}/>
        <rect x="120" y={wy - 50} width="9" height="52" rx="4.5" fill={C.fig}/>
      </g>
    })()
    const reverse = (() => {
      const ey = 122 - 22 * depth
      return <g opacity={mode}>
        <path d={`M46 ${ey} L114 104M194 ${ey} L126 104`} stroke={C.fig} strokeWidth="16" strokeLinecap="round"/>
        <rect x="111" y="102" width="9" height="52" rx="4.5" fill={C.fig}/>
        <rect x="120" y="102" width="9" height="52" rx="4.5" fill={C.skin2}/>
      </g>
    })()
    body = <><path d="M20 172h200" stroke={C.muted}/>{prayer}{reverse}</>
  } else {
    const a = v[0]
    body = <>
      <path d="M20 152h200" stroke={C.muted} strokeWidth="2"/>
      <path d="M70 40v70" stroke={C.fig} strokeWidth="22" strokeLinecap="round"/>
      <path d="M54 150c-6-30 6-44 28-44 30 0 50 18 72 30 8 4 10 14 2 14z" fill={C.fig}/>
      <g transform={`rotate(${a < 0 ? 28 * a : 0} 150 146)`}><rect x="146" y="139" width="22" height="9" rx="4.5" fill={C.figDim}/></g>
      <g transform={`rotate(${a > 0 ? -32 * a : 0} 150 141)`}><rect x="148" y="134" width="30" height="12" rx="6" fill={C.skin2}/></g>
      <text x="164" y="118" fill={C.figDim} fontSize="10" textAnchor="middle">big toe</text>
    </>
  }
  return { label, svg: <svg viewBox="0 0 240 180" role="img"><title>{title}</title>{body}</svg> }
}
