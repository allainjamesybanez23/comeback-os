import { useEffect, useRef, type ReactNode } from 'react'
import { Activity, AlertTriangle, ArrowUpRight, BicepsFlexed, BookOpen, Circle, Dumbbell, Footprints, HeartPulse, Move, Shield, Sparkles, X, Zap } from 'lucide-react'
import type { Exercise } from '../data/comebackProgram'
import { categories, redFlags } from '../data/comebackProgram'
import { ExerciseAnimation } from './ExerciseAnimation'
import { blockedReason, type DayLog } from '../model'

const icons = [Dumbbell, BicepsFlexed, Zap, HeartPulse, Activity, Move, Shield, Footprints, Circle, AlertTriangle]
export function CategoryPill({ item }: { item: Exercise }) {
  const Icon = icons[categories.indexOf(item.category)] ?? Activity
  return <span className="pills"><span className="pill"><Icon size={12}/>{item.category}</span>{item.flag && <span className="pill flag"><AlertTriangle size={12}/>FLAG <span className="sr-only">Forearm Load Warning</span></span>}</span>
}
export const prescription = (item: Exercise) => item.sets > 1 ? item.sets + ' × ' + item.reps : item.reps
export function ExerciseRow({ item, open, done }: { item: Exercise; open(): void; done?: number }) {
  return <button className="exercise-row" onClick={open} type="button">
    <span className="block-code">{item.block || '—'}</span>
    <span className="exercise-copy"><strong>{item.name}</strong><CategoryPill item={item}/></span>
    <span className="mono row-dose">{prescription(item)}{done !== undefined && <small>{done}/{item.sets} logged</small>}</span>
    <ArrowUpRight size={16} className="row-arrow" aria-hidden="true"/>
  </button>
}
export function Dialog({ title, children, close, drawer = false }: { title: string; children: ReactNode; close(): void; drawer?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => { dialog?.close() }
  }, [])
  return <dialog ref={ref} className={drawer ? 'drawer' : 'modal'} onCancel={event => { event.preventDefault(); close() }} onClick={event => { if (event.target === event.currentTarget && !drawer) close() }}>
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

export function ExerciseDetail({ exercise, phase, log, close }: { exercise: Exercise; phase: number; log: DayLog; close(): void }) {
  const reason = blockedReason(exercise, log, phase)
  return <Dialog title={exercise.name} close={close} drawer>
    <CategoryPill item={exercise}/>
    {reason && <div className="alert" role="status"><AlertTriangle size={18}/>{reason}</div>}
    <ExerciseAnimation exercise={exercise} protectedArm={phase === 0}/>
    <dl className="exercise-facts">
      <div><dt>Sets / reps</dt><dd className="mono">{prescription(exercise)}</dd></div>
      <div><dt>Load</dt><dd>{exercise.load}</dd></div>
      <div><dt>Tempo</dt><dd className="mono">{exercise.tempo || 'Controlled'}</dd></div>
      <div><dt>Rest</dt><dd className="mono">{exercise.rest ? exercise.rest + ' s' : '—'}</dd></div>
    </dl>
    {exercise.adjustment && <p className="notice">{exercise.adjustment}</p>}
    <h3>Execution</h3><ol className="cue-list">{exercise.cue.split(/(?<=\.)\s+/).map((cue,i) => <li key={i}>{cue}</li>)}</ol>
    <h3>Common mistakes</h3><p>{exercise.mistake || 'Keep the movement controlled and within your prescribed range.'}</p>
  </Dialog>
}
export function Court({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 470 340" fill="none" aria-hidden="true">
    <g stroke="currentColor" strokeWidth="1.2">
      <path d="M31 20h410v300H31zM31 320h410M159 20v131h154V20M175 20v120h122V20M63 20v52a174 174 0 0 0 346 0V20"/>
      <path d="M184 151a52 52 0 0 0 104 0M183 151a53 53 0 0 1 106 0" strokeDasharray="5 5"/>
      <path d="M203 45h66M236 45v13M221 76a15 15 0 1 1 30 0c0 8-7 15-15 15s-15-7-15-15ZM236 92v228M31 170h27m356 0h27M31 264h30m350 0h30" opacity=".66"/>
      <path d="M31 320h410M187 320a49 49 0 0 1 98 0M175 320a61 61 0 0 1 122 0" />
      <path d="M20 20h22m-11-11v22m399-11h22m-11-11v22M225 151h22m-11-11v22m-11 158h22m-11-11v22" opacity=".9"/>
    </g>
    <circle cx="236" cy="151" r="4" fill="currentColor"/>
  </svg>
}
export function Wordmark() {
  return <div className="wordmark"><span className="mark"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="11.2"/><path d="M5 16h22M16 5v22M8 8c9 5 9 11 0 16M24 8c-9 5-9 11 0 16"/></svg></span><span>Comeback OS<small>Strength &amp; Rehab</small></span></div>
}
export function Empty({ children }: { children: ReactNode }) { return <div className="empty"><Sparkles size={18}/>{children}</div> }
export function FaithIcon() { return <BookOpen size={17} aria-hidden="true"/> }
