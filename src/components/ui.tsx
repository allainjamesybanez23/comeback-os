import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Activity, AlertTriangle, ArrowUpRight, BicepsFlexed, BookOpen, ChevronRight, Circle, CircleDot, Dumbbell, Footprints, Hand, HeartPulse, History, Move, PersonStanding, Shield, ShieldCheck, Sparkles, Trophy, Waves, X, Zap, type LucideIcon } from 'lucide-react'
import type { Exercise } from '../data/comebackProgram'
import { categories, redFlags } from '../data/comebackProgram'
import { benefitFor, benefitLabel, type BenefitTag } from '../data/benefits'
import { ExerciseAnimation } from './ExerciseAnimation'
import { bestSet, blockedReason, dateLabel, historyFor, type DayLog, type Module, type State } from '../model'

const icons = [Dumbbell, BicepsFlexed, Zap, HeartPulse, Activity, Move, Shield, Footprints, Circle, AlertTriangle]
export const moduleIcon: Record<Module, LucideIcon> = { workout: Dumbbell, mobility: Waves, rehab: Hand, foam: Sparkles }
export const moduleBlurb: Record<Module, string> = {
  workout: 'Warm-up · main work · cooldown',
  mobility: 'Floor-to-standing stretch flow',
  rehab: 'Right forearm range, strength and grip',
  foam: 'Silent left-hand foam-ball handles',
}

export function CategoryPill({ item }: { item: Exercise }) {
  const Icon = icons[categories.indexOf(item.category)] ?? Activity
  const label = item.category === 'Silent Foam Ball Handles' ? 'Ball handling' : item.category
  return <span className="pills"><span className="pill"><Icon size={12} aria-hidden="true"/>{label}</span>{item.flag && <span className="pill flag"><AlertTriangle size={12} aria-hidden="true"/>FLAG <span className="sr-only">Forearm Load Warning</span></span>}</span>
}
/* A small basketball glyph: lucide has no basketball icon. */
function BallIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5v19M5.3 5.3c3.4 3.6 3.4 9.8 0 13.4M18.7 5.3c-3.4 3.6-3.4 9.8 0 13.4"/></svg>
}
const tagIcon: Record<BenefitTag, (props: { size?: number }) => ReactNode> = {
  court: BallIcon,
  body: ({ size }) => <PersonStanding size={size} aria-hidden="true"/>,
  forearm: ({ size }) => <Hand size={size} aria-hidden="true"/>,
}
export function BenefitTags({ item, labels = true }: { item: Exercise; labels?: boolean }) {
  const benefit = benefitFor(item.name)
  if (!benefit) return null
  return <span className="benefit-tags" aria-label={'Helps: ' + benefit.tags.map(tag => benefitLabel[tag]).join(', ')}>
    {benefit.tags.map(tag => { const Icon = tagIcon[tag]; return <span key={tag} className={'benefit-tag tag-' + tag} title={benefitLabel[tag]}><Icon size={12}/>{labels && benefitLabel[tag]}</span> })}
  </span>
}
export function WhyItHelps({ item, compact = false }: { item: Exercise; compact?: boolean }) {
  const benefit = benefitFor(item.name)
  if (!benefit) return null
  return <section className={'why-box' + (compact ? ' compact' : '')} aria-label="Why it helps you">
    <div className="why-head"><strong>Why it helps you</strong><BenefitTags item={item}/></div>
    <p>{benefit.why}</p>
  </section>
}
export const prescription = (item: Exercise) => item.sets > 1 ? item.sets + ' × ' + item.reps : item.reps

/* A row with a live thumbnail that animates on hover or focus. */
export function ExerciseRow({ item, open, done, protectedArm = true, code = true }: { item: Exercise; open(): void; done?: number; protectedArm?: boolean; code?: boolean }) {
  const [hover, setHover] = useState(false)
  const complete = done !== undefined && done >= item.sets
  return <button className={'exercise-row' + (complete ? ' is-done' : '')} onClick={open} type="button" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={() => setHover(false)}>
    <span className="row-thumb"><ExerciseAnimation exercise={item} protectedArm={protectedArm} compact playing={hover}/></span>
    <span className="exercise-copy">
      <strong>{code && item.block && /^[A-Z]\d?$/.test(item.block) && <span className="block-code">{item.block}</span>}{item.name}</strong>
      <span className="row-meta">{item.load !== 'Bodyweight' && <span>{item.load}</span>}{item.tempo && <span className="mono">Tempo {item.tempo}</span>}{item.flag && <span className="flag-text"><AlertTriangle size={12}/>Forearm flag</span>}<BenefitTags item={item} labels={false}/></span>
    </span>
    <span className="row-dose mono">{prescription(item)}{done !== undefined && <small>{complete ? 'Done' : done + '/' + item.sets + ' sets'}</small>}</span>
    <ChevronRight size={18} className="row-arrow" aria-hidden="true"/>
  </button>
}

export function Dialog({ title, children, close, drawer = false, wide = false }: { title: string; children: ReactNode; close(): void; drawer?: boolean; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => { dialog?.close() }
  }, [])
  return <dialog ref={ref} className={(drawer ? 'drawer' : 'modal') + (wide ? ' wide' : '')} onCancel={event => { event.preventDefault(); close() }} onClick={event => { if (event.target === event.currentTarget) close() }}>
    <div className="dialog-inner">
      <header className="dialog-header"><h2>{title}</h2><button className="icon-btn" type="button" aria-label="Close" title="Close" onClick={close}><X size={20}/></button></header>
      {children}
    </div>
  </dialog>
}
export function RedFlags({ close }: { close(): void }) {
  return <Dialog title="Surgeon red-flag checklist" close={close}>
    <p>Stop the exercise for today at 3/10 forearm pain. Contact your surgical team if any of these symptoms occur.</p>
    <ul className="red-list">{redFlags.map(flag => <li key={flag}><AlertTriangle size={16}/>{flag}</li>)}</ul>
    <button className="button" onClick={close}>Close checklist</button>
  </Dialog>
}

export function Readiness({ pain, setPain, phase, openFlags, compact = false }: { pain: number; setPain(value: number): void; phase: number; openFlags(): void; compact?: boolean }) {
  const hold = pain >= 3
  return <section className={'panel readiness' + (compact ? ' compact' : '')}>
    <div className="card-heading"><ShieldCheck size={18}/><h2>Forearm check</h2><span className={'status-dot ' + (hold ? 'alert' : pain ? 'warn' : 'ok')}>{hold ? 'Stop' : pain ? 'Caution' : 'Clear'}</span></div>
    <label htmlFor={compact ? 'pain-compact' : 'pain-slider'} className="pain-label"><span>Pain right now</span><strong className="mono">{pain}<small>/10</small></strong></label>
    <input id={compact ? 'pain-compact' : 'pain-slider'} className={'pain-range level-' + Math.min(pain, 3)} type="range" min="0" max="10" step="1" value={pain} onChange={event => setPain(Number(event.target.value))} aria-valuetext={pain + ' out of 10'}/>
    <div className="range-labels"><span>0 none</span><span className="threshold">3 stop</span><span>10</span></div>
    {hold ? <p className="gate alert"><AlertTriangle size={16}/>Safety lockout. Training stops for today.</p> : <p className="gate"><CircleDot size={14}/>Below the 3/10 stop threshold.</p>}
    {phase === 0 && !compact && <ul className="restrictions"><li>17 kg dumbbell in the left hand only</li><li>No pull-ups, hangs, floor push-ups or hand planks</li></ul>}
    <button className="quiet" onClick={openFlags}>Surgeon red flags <ArrowUpRight size={15}/></button>
  </section>
}

export function Rings({ values, size = 132, stroke = 11 }: { values: { value: number; goal: number; tone: string; label: string }[]; size?: number; stroke?: number }) {
  const c = size / 2
  return <svg className="rings" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={values.map(v => `${v.label} ${v.value} of ${v.goal}`).join(', ')}>
    {values.map((ring, i) => {
      const r = c - stroke / 2 - i * (stroke + 4)
      const length = 2 * Math.PI * r
      const fraction = Math.min(1, ring.value / ring.goal)
      return <g key={ring.label} transform={`rotate(-90 ${c} ${c})`}>
        <circle cx={c} cy={c} r={r} fill="none" stroke={ring.tone} strokeOpacity=".16" strokeWidth={stroke}/>
        <circle className="ring-value" cx={c} cy={c} r={r} fill="none" stroke={ring.tone} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${Math.max(0.001, fraction * length)} ${length}`}/>
      </g>
    })}
  </svg>
}
export const ringTones = { workout: '#FF5A3C', rehab: '#8CA9F5', mobility: '#7FD1C7', foam: '#F2B35B' }

export function ExerciseDetail({ exercise, phase, log, state, close, today }: { exercise: Exercise; phase: number; log: DayLog; state: State; close(): void; today: string }) {
  const reason = blockedReason(exercise, log, phase)
  const history = historyFor(state, exercise.id).slice(0, 5)
  const best = bestSet(historyFor(state, exercise.id))
  const cues = exercise.cue.split(/(?<=\.)\s+/).filter(Boolean)
  return <Dialog title={exercise.name} close={close} drawer>
    <CategoryPill item={exercise}/>
    {reason && <div className="alert" role="status"><AlertTriangle size={18}/>{reason}</div>}
    <ExerciseAnimation exercise={exercise} protectedArm={phase === 0} className="detail-anim"/>
    <dl className="exercise-facts">
      <div><dt>Sets × dose</dt><dd className="mono">{prescription(exercise)}</dd></div>
      <div><dt>Load</dt><dd>{exercise.load}</dd></div>
      <div><dt>Tempo</dt><dd className="mono">{exercise.tempo ? exercise.tempo + ' (down-pause-up)' : 'Controlled'}</dd></div>
      <div><dt>Rest</dt><dd className="mono">{exercise.rest ? exercise.rest + ' s' : 'None · keep moving'}</dd></div>
    </dl>
    {exercise.adjustment && <p className="notice">{exercise.adjustment}</p>}
    <WhyItHelps item={exercise}/>
    <h3>How to</h3><ol className="cue-list">{cues.map((cue, i) => <li key={i}>{cue}</li>)}</ol>
    <h3>Avoid</h3><p className="avoid">{exercise.mistake || 'Keep the movement controlled and within your prescribed range.'}</p>
    <h3><History size={15}/> Your history</h3>
    {best && <p className="pr-line"><Trophy size={15}/> Best set <strong className="mono">{best.reps}{best.kg ? ' × ' + best.kg + ' kg' : ' reps'}</strong></p>}
    {history.length ? <ul className="history-list">{history.map(day => <li key={day.date}><span>{day.date === today ? 'Today' : dateLabel(day.date, { month: 'short', day: 'numeric' })}</span><span className="mono">{day.sets.map(set => set.reps !== undefined ? set.reps + (set.kg ? '×' + set.kg : '') : set.contacts ? set.contacts + 'c' : '✓').join(' · ')}</span></li>)}</ul> : <Empty>No sets logged yet. Your reps and weights show up here.</Empty>}
  </Dialog>
}
export function Court({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 470 340" fill="none" aria-hidden="true">
    <g stroke="currentColor" strokeWidth="1.2">
      <path d="M31 20h410v300H31zM31 320h410M159 20v131h154V20M175 20v120h122V20M63 20v52a174 174 0 0 0 346 0V20"/>
      <path d="M184 151a52 52 0 0 0 104 0M183 151a53 53 0 0 1 106 0" strokeDasharray="5 5"/>
      <path d="M203 45h66M236 45v13M221 76a15 15 0 1 1 30 0c0 8-7 15-15 15s-15-7-15-15ZM236 92v228M31 170h27m356 0h27M31 264h30m350 0h30" opacity=".66"/>
      <path d="M31 320h410M187 320a49 49 0 0 1 98 0M175 320a61 61 0 0 1 122 0" />
    </g>
    <circle cx="236" cy="151" r="4" fill="currentColor"/>
  </svg>
}
export function Wordmark() {
  return <div className="wordmark"><span className="mark"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="11.2"/><path d="M5 16h22M16 5v22M8 8c9 5 9 11 0 16M24 8c-9 5-9 11 0 16"/></svg></span><span>Comeback OS<small>Strength &amp; Rehab</small></span></div>
}
export function Empty({ children }: { children: ReactNode }) { return <div className="empty"><Sparkles size={18}/>{children}</div> }
export function FaithIcon() { return <BookOpen size={17} aria-hidden="true"/> }
export function formatClock(seconds: number) {
  const s = Math.max(0, Math.round(seconds))
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60
  return (h ? h + ':' + String(m).padStart(2, '0') : String(m).padStart(2, '0')) + ':' + String(r).padStart(2, '0')
}
