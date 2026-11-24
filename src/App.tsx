import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, BookOpen, CalendarRange, ChevronRight, Dumbbell, Flame, HeartPulse, Home, LockKeyhole, Trophy, Volume2, VolumeX } from 'lucide-react'
import { days, type Exercise } from './data/comebackProgram'
import { activePhase, dateKey, dateLabel, dayFor, deloadText, moduleLabel, plusDays, programSections, recoveryReasons, statsFor, type DayLog, type Module, type SetLog, type State, type Step } from './model'
import { useStore, type Update } from './store'
import { ExerciseDetail, RedFlags, Wordmark } from './components/ui'
import { CheckInForm } from './components/Tracking'
import { Program } from './components/Program'
import { Library } from './components/Library'
import { Progress } from './components/Progress'
import { Sessions } from './components/Sessions'
import { Today } from './components/Today'
import { WorkoutPlayer, type Setting } from './components/WorkoutPlayer'
import { armAudio } from './audio'

type Route = 'today' | 'workouts' | 'library' | 'progress' | 'checkin' | 'program'
const routes = [
  { id: 'today', label: 'Today', icon: Home },
  { id: 'workouts', label: 'Sessions', icon: Dumbbell },
  { id: 'library', label: 'Exercise library', icon: BookOpen },
  { id: 'progress', label: 'Progress', icon: Trophy },
  { id: 'checkin', label: 'Check-in', icon: HeartPulse },
  { id: 'program', label: 'Program', icon: CalendarRange },
] as const
const subtitles: Record<Route, string> = {
  today: '', workouts: 'Every session, in order. Tap any move for its demo.', library: 'Animated guides for every movement in the plan.',
  progress: 'Weekly goals, streaks, badges and history.', checkin: 'Daily targets, weigh-ins and mobility benchmarks.', program: 'Weekly split, exercise editor, progression and clearance.',
}

export default function App() {
  const { state, update, error } = useStore()
  if (!state) return <main className="boot"><Wordmark/><p role={error ? 'alert' : 'status'}>{error || 'Opening your training plan…'}</p></main>
  return <Workspace state={state} update={update} error={error}/>
}

function useToday() {
  const [today, setToday] = useState(() => dateKey(new Date()))
  useEffect(() => {
    const tick = () => setToday(dateKey(new Date()))
    const interval = window.setInterval(tick, 30000)
    window.addEventListener('focus', tick)
    return () => { clearInterval(interval); window.removeEventListener('focus', tick) }
  }, [])
  return today
}

function Workspace({ state, update, error }: { state: State; update: Update; error: string }) {
  const today = useToday()
  const [route, setRoute] = useState<Route>('today')
  const [planDate, setPlanDate] = useState(today)
  const [module, setModule] = useState<Module>('workout')
  const [session, setSession] = useState<{ module: Module; key: number }>()
  const [detail, setDetail] = useState<Exercise>()
  const [red, setRed] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  const phase = activePhase(state, today)
  const log = state.logs[today] ?? {}
  const reasons = recoveryReasons(state, today)
  const pain = log.pain ?? 0
  const hold = pain >= 3
  const streak = statsFor(state, today).streak
  const current = useRef<Exercise>(null)
  const playerSections = useMemo(() => session ? programSections(state, today, session.module, today) : [],
    [session?.module, session?.key, state.edits, state.schedule, state.clarity, state.phase, state.weekOverride, state.deload, today])

  function go(next: Route) {
    if (next === 'workouts') setPlanDate(today)
    setRoute(next)
    mainRef.current?.scrollTo(0, 0)
  }
  function preview(next: Module, date = today) {
    setModule(next)
    setPlanDate(date)
    setRoute('workouts')
    mainRef.current?.scrollTo(0, 0)
  }
  function start(next: Module) {
    armAudio()
    setSession({ module: next, key: Date.now() })
  }
  function updateLog(date: string, change: (previous: DayLog) => DayLog) {
    update(before => ({ ...before, logs: { ...before.logs, [date]: change(before.logs[date] ?? {}) } }))
  }
  function setPain(value: number) {
    const item = session ? current.current : null
    if (value >= 3 && pain < 3) { setDetail(undefined); setRed(true) }
    updateLog(today, before => ({ ...before, pain: value, stopped: value >= 3 && item ? [...new Set([...(before.stopped ?? []), item.id])] : before.stopped }))
  }
  function finished(before: DayLog, m: Module, seconds: number): DayLog {
    const easy = days[dayFor(state, today)].level === 'Easy'
    return {
      ...before,
      done: { ...before.done, [m]: true },
      time: { ...before.time, [m]: (before.time?.[m] ?? 0) + seconds },
      status: m === 'workout' ? (easy ? (before.status === 'full' ? 'full' : 'recovery') : 'full') : before.status === 'full' ? 'full' : 'recovery',
      rehab: before.rehab || m === 'rehab',
      reason: undefined,
    }
  }
  function record(m: Module, step: Step, data: SetLog, isLast: boolean, seconds: number) {
    current.current = step.item
    updateLog(today, before => {
      const next = { ...before, sets: { ...before.sets, [step.id]: data } }
      return isLast ? finished(next, m, seconds) : next
    })
  }
  function stop(item: Exercise) {
    updateLog(today, before => ({ ...before, stopped: [...new Set([...(before.stopped ?? []), item.id])] }))
  }
  function setting(key: Setting) {
    const defaults: Record<Setting, boolean> = { audio: true, voice: true, tempo: false, autoflow: true }
    update(before => ({ ...before, [key]: !(before[key] ?? defaults[key]) }))
  }
  function swapForRecovery() {
    const nextHard = Array.from({ length: 8 }, (_, i) => plusDays(today, i)).find(key => days[dayFor(state, key)].level === 'Hard')
    if (nextHard) update(before => ({ ...before, schedule: { ...before.schedule, [nextHard]: 6 } }))
  }

  const dialogs = <>
    {detail && <ExerciseDetail exercise={detail} phase={phase} log={log} state={state} today={today} close={() => setDetail(undefined)}/>}
    {red && <RedFlags close={() => setRed(false)}/>}
  </>

  if (session) {
    const m = session.module
    return <>
      <WorkoutPlayer key={m + session.key} module={m} title={m === 'workout' ? days[dayFor(state, today)].title : moduleLabel[m]}
        sections={playerSections} state={state} today={today} phase={phase}
        record={(step, data, isLast, seconds) => record(m, step, data, isLast, seconds)}
        complete={seconds => updateLog(today, before => finished(before, m, seconds))}
        stop={stop} setPain={setPain} openFlags={() => setRed(true)} showDetail={setDetail} onSetting={setting}
        onExit={() => { setSession(undefined); setRoute('today') }} startNext={next => start(next)}/>
      {dialogs}
    </>
  }

  const active = routes.find(item => item.id === route)!
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <aside className="sidebar">
      <button className="brand-button" aria-label="Comeback OS home" onClick={() => go('today')}><Wordmark/></button>
      <nav aria-label="Main navigation">{routes.map(({ id, label, icon: Icon }) => <button key={id} className={route === id ? 'nav-item active' : 'nav-item'} aria-current={route === id ? 'page' : undefined} onClick={() => go(id)} title={label}><Icon size={19}/><span>{label}</span></button>)}</nav>
      <div className="sidebar-bottom">
        <div className="side-streak" title="Current streak"><Flame size={18}/><strong className="mono">{streak}</strong><span>day streak</span></div>
        <button className="phase-chip" title="View program phases" onClick={() => go('program')}><span className="phase-icon"><LockKeyhole size={15}/></span><span><strong>Phase {phase}</strong><small>{phase ? 'Post-clearance' : 'Pre-clearance'}</small></span><ChevronRight size={15}/></button>
        <div className="offline"><span/> Offline · saved on this PC</div>
      </div>
    </aside>
    <div className="workspace">
      <header className="toolbar">
        <div className="toolbar-title"><strong>{active.label}</strong>{subtitles[route] && <span>{subtitles[route]}</span>}</div>
        <div className="toolbar-right">
          <span className="toolbar-date">{dateLabel(today, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          <button className="icon-btn" title={state.audio ? 'Mute beeps' : 'Enable beeps'} aria-label={state.audio ? 'Mute beeps' : 'Enable beeps'} aria-pressed={state.audio} onClick={() => { armAudio(); setting('audio') }}>{state.audio ? <Volume2 size={18}/> : <VolumeX size={18}/>}</button>
        </div>
      </header>
      <main className="main" id="main-content" ref={mainRef}>
        {error && <div className="alert" role="alert"><AlertTriangle size={17}/>{error}</div>}
        {(hold || reasons.length > 0) && route !== 'program' && <div className={hold ? 'alert global-flag' : 'notice global-flag'} role="status">
          <AlertTriangle size={21}/><div><strong>{hold ? 'Training stops for today' : 'Recovery flag'}</strong><p>{reasons.join(' · ')}. {hold ? 'Review the surgeon checklist and swap the next hard session for recovery. ' : ''}{deloadText}</p></div>
          {hold ? <button className="button subtle" onClick={() => setRed(true)}>Red flags</button> :
            <button className="button subtle" onClick={() => update(before => ({ ...before, deload: today }))} disabled={state.deload === today}>{state.deload === today ? 'Deload applied' : 'Apply 7-day deload'}</button>}
          <button className="button subtle" onClick={swapForRecovery}>Swap next hard day</button>
        </div>}
        {route === 'today' && <Today state={state} today={today} phase={phase} start={start} preview={preview} showDetail={setDetail} setPain={setPain} openFlags={() => setRed(true)} openProgress={() => go('progress')}/>}
        {route === 'workouts' && <Sessions state={state} today={today} phase={phase} module={module} date={planDate} setModule={setModule} setDate={setPlanDate} start={start} showDetail={setDetail}/>}
        {route === 'library' && <Library phase={phase} open={setDetail}/>}
        {route === 'progress' && <Progress state={state} update={update} today={today}/>}
        {route === 'checkin' && <CheckInForm state={state} update={update} today={today}/>}
        {route === 'program' && <Program state={state} update={update} today={today} navigate={date => preview('workout', date)}/>}
      </main>
    </div>
    {dialogs}
  </div>
}
