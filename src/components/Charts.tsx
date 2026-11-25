import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'

/* Single-series charts: one hue (#8CA9F5, 6.9:1 on the chart surface), hairline grid,
   2px line / ≤24px columns with 4px rounded ends, crosshair + tooltip on hover and focus. */
export type ChartPoint = { key: string; label: string; value: number; detail?: string }
const SERIES = '#8CA9F5'
const GRID = '#22324d'
const H = 200
const M = { top: 18, right: 46, bottom: 28, left: 42 }

function useWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(560)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(260, Math.round(entry.contentRect.width))))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}
function niceStep(raw: number) {
  const power = 10 ** Math.floor(Math.log10(raw || 1))
  const scaled = raw / power
  return (scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 2.5 ? 2.5 : scaled <= 5 ? 5 : 10) * power
}
function scaleFor(values: number[]) {
  const max = Math.max(1, ...values)
  const step = niceStep(max / 3)
  const top = Math.ceil(max / step) * step
  return { top, ticks: Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step) }
}
export const compact = (value: number) => value >= 10000 ? (value / 1000).toFixed(value >= 100000 ? 0 : 1).replace(/\.0$/, '') + 'K' : value.toLocaleString()

function Tooltip({ point, unit, x, width }: { point: ChartPoint; unit: string; x: number; width: number }) {
  const left = Math.min(Math.max(x, 70), width - 70)
  return <div className="chart-tip" style={{ left }} role="status">
    <strong className="mono">{point.value.toLocaleString()}{unit && <small> {unit}</small>}</strong>
    <span>{point.label}</span>
    {point.detail && <em>{point.detail}</em>}
  </div>
}

function useActive(count: number) {
  const [active, setActive] = useState<number>()
  const onKey = (event: KeyboardEvent) => {
    if (!count) return
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault()
      setActive(value => Math.min(count - 1, Math.max(0, (value ?? count - 1) + (event.key === 'ArrowRight' ? 1 : -1))))
    }
  }
  return { active, setActive, onKey }
}

export function TrendChart({ points, unit, label }: { points: ChartPoint[]; unit: string; label: string }) {
  const [ref, width] = useWidth()
  const { active, setActive, onKey } = useActive(points.length)
  const { top, ticks } = scaleFor(points.map(p => p.value))
  const innerW = width - M.left - M.right, innerH = H - M.top - M.bottom
  const x = (i: number) => M.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW)
  const y = (v: number) => M.top + innerH - (v / top) * innerH
  const line = points.map((p, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.value).toFixed(1)).join('')
  const area = points.length > 1 ? line + `L${x(points.length - 1)} ${y(0)}L${x(0)} ${y(0)}Z` : ''
  const last = points[points.length - 1]
  const showDots = points.length <= 24
  const xLabels = points.length <= 2 ? points.map((_, i) => i) : [0, Math.floor((points.length - 1) / 2), points.length - 1]
  function move(event: PointerEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    const px = (event.clientX - box.left) * (width / box.width)
    let best = 0
    points.forEach((_, i) => { if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i })
    setActive(best)
  }
  const shown = active !== undefined ? points[active] : undefined
  return <div className="chart" ref={ref}>
    <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} role="img" tabIndex={0} aria-label={`${label}. ${points.length} sessions. Latest ${last?.value ?? 0} ${unit}. Use left and right arrows to read each point.`}
      onPointerMove={move} onPointerLeave={() => setActive(undefined)} onFocus={() => setActive(points.length - 1)} onBlur={() => setActive(undefined)} onKeyDown={onKey}>
      {ticks.map(t => <g key={t}><line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth="1"/><text x={M.left - 8} y={y(t) + 4} textAnchor="end" className="chart-axis">{compact(t)}</text></g>)}
      {xLabels.map(i => <text key={i} x={x(i)} y={H - 8} textAnchor={i === 0 && points.length > 1 ? 'start' : i === points.length - 1 && points.length > 1 ? 'end' : 'middle'} className="chart-axis">{points[i].label}</text>)}
      {area && <path d={area} fill={SERIES} opacity=".1"/>}
      <path d={line} fill="none" stroke={SERIES} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
      {shown && <line x1={x(active!)} x2={x(active!)} y1={M.top} y2={M.top + innerH} stroke="#9AA9BE" strokeWidth="1"/>}
      {points.map((p, i) => (showDots || i === points.length - 1 || i === active) && <circle key={p.key} cx={x(i)} cy={y(p.value)} r={i === active ? 5.5 : 4} fill={SERIES} stroke="#101929" strokeWidth="2"/>)}
      {last && <text x={x(points.length - 1) + 9} y={y(last.value) + 4} className="chart-end">{compact(last.value)}</text>}
    </svg>
    {shown && <Tooltip point={shown} unit={unit} x={x(active!)} width={width}/>}
  </div>
}

export function ColumnChart({ points, unit, label }: { points: ChartPoint[]; unit: string; label: string }) {
  const [ref, width] = useWidth()
  const { active, setActive, onKey } = useActive(points.length)
  const { top, ticks } = scaleFor(points.map(p => p.value))
  const innerW = width - M.left - 16, innerH = H - M.top - M.bottom
  const band = innerW / Math.max(1, points.length)
  const bar = Math.min(24, band - 2)
  const cx = (i: number) => M.left + band * i + band / 2
  const y = (v: number) => M.top + innerH - (v / top) * innerH
  const every = band < 46 ? 2 : 1
  const last = points[points.length - 1]
  const shown = active !== undefined ? points[active] : undefined
  return <div className="chart" ref={ref}>
    <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} role="img" tabIndex={0} aria-label={`${label}. ${points.map(p => p.label + ' ' + p.value).join(', ')} ${unit}.`}
      onPointerLeave={() => setActive(undefined)} onFocus={() => setActive(points.length - 1)} onBlur={() => setActive(undefined)} onKeyDown={onKey}>
      {ticks.map(t => <g key={t}><line x1={M.left} x2={width - 16} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth="1"/><text x={M.left - 8} y={y(t) + 4} textAnchor="end" className="chart-axis">{compact(t)}</text></g>)}
      {points.map((p, i) => {
        const h = Math.max(0, y(0) - y(p.value)), left = cx(i) - bar / 2, r = Math.min(4, h)
        return <g key={p.key} onPointerEnter={() => setActive(i)}>
          <rect x={cx(i) - band / 2} y={M.top} width={band} height={innerH} fill="transparent"/>
          {h > 0 && <path d={`M${left} ${y(0)}V${y(p.value) + r}Q${left} ${y(p.value)} ${left + r} ${y(p.value)}H${left + bar - r}Q${left + bar} ${y(p.value)} ${left + bar} ${y(p.value) + r}V${y(0)}Z`} fill={SERIES} opacity={active === undefined || active === i ? 1 : 0.55}/>}
          {i % every === (points.length - 1) % every && <text x={cx(i)} y={H - 8} textAnchor="middle" className="chart-axis">{p.label}</text>}
        </g>
      })}
      {last && last.value > 0 && <text x={cx(points.length - 1)} y={y(last.value) - 7} textAnchor="middle" className="chart-end">{compact(last.value)}</text>}
    </svg>
    {shown && <Tooltip point={shown} unit={unit} x={cx(active!)} width={width}/>}
  </div>
}

export function ChartTable({ points, unit, columns = ['Date', 'Value'] }: { points: ChartPoint[]; unit: string; columns?: [string, string] | string[] }) {
  return <div className="time-table-wrap"><table className="time-table chart-table">
    <thead><tr><th scope="col">{columns[0]}</th><th scope="col">{columns[1]}</th><th scope="col">Detail</th></tr></thead>
    <tbody>{[...points].reverse().map(p => <tr key={p.key}><th scope="row">{p.label}</th><td className="mono">{p.value.toLocaleString()} {unit}</td><td>{p.detail ?? ''}</td></tr>)}</tbody>
  </table></div>
}
