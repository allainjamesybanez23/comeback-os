import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, AlertTriangle, ArrowRight, ArrowUpRight, BookOpen, CalendarDays, CalendarRange, ChevronDown, ChevronRight, CircleDot, ClipboardList, Clock3, Dumbbell, HeartPulse, LayoutGrid, LockKeyhole, Play, ShieldCheck, Target, Volume2, VolumeX } from 'lucide-react'
import { categories, days, mindset, phases, progression, quotes, type Exercise, type Section } from './data/comebackProgram'
import { activePhase, dateKey, dateLabel, dayFor, deloadText, distance, monday, plusDays, programSections, recoveryReasons, startDate, weekFor, type DayLog, type Module, type State, type Step } from './model'
import { useStore, type Update } from './store'
import { Court, Empty, ExerciseDetail, ExerciseRow, FaithIcon, RedFlags, Wordmark } from './components/ui'
import { Calendar, CheckInForm, Stats } from './components/Tracking'
import { Library, Program } from './components/Program'
import { WorkoutPlayer } from './components/WorkoutPlayer'
import { armAudio } from './audio'

type Route = 'home' | 'training' | 'program' | 'library' | 'calendar' | 'checkin'
const routes = [
  { id:'home', label:'Overview', icon:LayoutGrid }, { id:'training', label:'Training', icon:Dumbbell },
  { id:'program', label:'Program', icon:ClipboardList }, { id:'library', label:'Exercise library', icon:BookOpen },
  { id:'calendar', label:'Consistency', icon:CalendarDays }, { id:'checkin', label:'Check-in', icon:HeartPulse },
] as const
const titles: Record<Route,string> = { home:'Training overview',training:'Training',program:'Program manager',library:'Exercise library',calendar:'Consistency',checkin:'Check-in & recovery' }
const modules = [
  ['workout','Daily workout'], ['rehab','Forearm rehab'], ['mobility','Mobility'], ['foam','Foam ball'],
] as const
const compactDate = { weekday:'long', month:'long', day:'numeric' } as const

export default function App() {
  const { state,update,error } = useStore()
  if (!state) return <main className="boot"><Wordmark/><p role={error ? 'alert' : 'status'}>{error || 'Opening your training plan…'}</p></main>
  return <Workspace state={state} update={update} error={error}/>
}

function useToday() {
  const [today,setToday] = useState(() => dateKey(new Date()))
  useEffect(() => {
    const tick = () => setToday(dateKey(new Date()))
    const interval = window.setInterval(tick, 30000)
    window.addEventListener('focus',tick)
    return () => { clearInterval(interval); window.removeEventListener('focus',tick) }
  },[])
  return today
}

function Workspace({ state,update,error }: { state: State; update: Update; error: string }) {
  const today = useToday()
  const [route,setRoute] = useState<Route>('home')
  const [planDate,setPlanDate] = useState(today)
  const [module,setModule] = useState<Module>('workout')
  const [play,setPlay] = useState(false)
  const [detail,setDetail] = useState<Exercise>()
  const [red,setRed] = useState(false)
  const [verseOffset,setVerse] = useState(0)
  const [category,setCategory] = useState('')
  const [reviewSections,setReviewSections] = useState<string[]>(['main','foam','rehab','mobility'])
  const current = useRef<Exercise>(null)
  const mainRef = useRef<HTMLElement>(null)
  const phase = activePhase(state,today)
  const week = weekFor(state,today)
  const day = days[dayFor(state,today)]
  const selectedDay = days[dayFor(state,planDate)]
  const log = state.logs[today] ?? {}
  const planLog = state.logs[planDate] ?? {}
  const reasons = recoveryReasons(state,today)
  const pain = log.pain ?? 0
  const hold = pain >= 3
  const dateOrdinal = distance(startDate,today)
  const verse = mindset[((dateOrdinal + verseOffset) % mindset.length + mindset.length) % mindset.length]
  const quote = quotes[(dateOrdinal % quotes.length + quotes.length) % quotes.length]
  const sections = useMemo(() => programSections(state,planDate,module,today),
    [state.edits,state.schedule,state.clarity,state.phase,state.weekOverride,state.deload,planDate,module,today])
  const overview = useMemo(() => programSections(state,today,'workout',today),
    [state.edits,state.schedule,state.clarity,state.phase,state.weekOverride,state.deload,today])
  const mainRows = overview.find(section => section.id === 'main')?.rows ?? []
  const showVerse = () => setVerse(value => value+1)

  function go(next: Route) {
    if (next === 'training') {
      setPlanDate(today)
      setModule('workout')
    }
    setPlay(false)
    setCategory('')
    setRoute(next)
    mainRef.current?.scrollTo(0,0)
  }
  function goPlan(date = today, nextModule: Module = 'workout', start = false) {
    setRoute('training')
    setPlanDate(date)
    setCategory('')
    setModule(nextModule)
    setPlay(start)
    if (start) armAudio()
    mainRef.current?.scrollTo(0,0)
  }
  function updateLog(date: string, change: (previous: DayLog) => DayLog) {
    update(before => ({ ...before, logs: { ...before.logs, [date]:change(before.logs[date] ?? {}) } }))
  }
  function setPain(value: number) {
    const item = play ? current.current : null
    if (value >= 3 && pain < 3) {
      setDetail(undefined)
      setRed(true)
    }
    updateLog(today,before => ({
      ...before,pain:value,
      stopped: value >= 3 && item ? [...new Set([...(before.stopped ?? []),item.id])] : before.stopped,
    }))
  }
  function record(step: Step, contacts: number, isLast: boolean, rehab: boolean) {
    updateLog(today,before => ({
      ...before,
      sets: { ...before.sets, [step.id]:{contacts} },
      rehab: before.rehab || rehab,
      status: isLast && module === 'workout' ? days[dayFor(state,today)].level === 'Easy' ? 'recovery' : 'full' :
        (before.status === 'full' ? 'full' : rehab ? 'recovery' : before.status),
      reason: isLast && (module === 'workout' || rehab) ? undefined : before.reason,
    }))
  }
  function stop(item: Exercise) {
    updateLog(today,before => ({ ...before, stopped:[...new Set([...(before.stopped ?? []),item.id])] }))
  }
  function audioToggle() {
    armAudio()
    update(before => ({ ...before,audio:!before.audio }))
  }
  function swapForRecovery() {
    const nextHard = Array.from({length:8},(_,i) => plusDays(today,i)).find(key => days[dayFor(state,key)].level === 'Hard')
    if (!nextHard) return
    update(before => ({ ...before, schedule:{ ...before.schedule, [nextHard]:6 } }))
  }
  const inPlayer = route === 'training' && play && planDate === today
  const startButton = (label: string, onClick: () => void) => <button className="button" type="button" onClick={onClick} disabled={hold}><Play size={17} fill="currentColor"/>{label}<ArrowRight size={16}/></button>
  const readiness = <section className="panel readiness">
    <div className="rail-heading"><ShieldCheck size={20}/><h2>Forearm readiness</h2></div>
    <label htmlFor="forearm-slider" className="pain-label"><span>Pain level</span><strong className="mono">{pain}<small> / 10</small></strong></label>
    <input id="forearm-slider" className="pain-range" type="range" min="0" max="10" step="1" value={pain} onChange={event => setPain(Number(event.target.value))} aria-valuetext={pain + ' out of 10'}/>
    <div className="range-labels"><span>0 · No pain</span><span>3 · Stop threshold</span><span>10</span></div>
    <div className={hold ? 'gate alert' : 'gate'} role="status">{hold ? <AlertTriangle size={17}/> : <CircleDot size={15}/>}<strong>{hold ? 'Safety lockout' : 'Within program threshold'}</strong></div>
    {phase === 0 && <ul className="restrictions"><li>17 kg dumbbell · left hand only</li><li>No pull-ups, dead hangs, floor push-ups or hand planks</li></ul>}
    <button className="quiet checklist-link" onClick={() => setRed(true)}>Surgeon red flags <ArrowUpRight size={15}/></button>
  </section>

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <aside className="sidebar">
      <button className="brand-button" title="Training overview" aria-label="Comeback OS home" onClick={() => go('home')}><Wordmark/></button>
      <nav aria-label="Main navigation">{routes.map(({id,label,icon:Icon}) => <button key={id} className={route === id ? 'nav-item active' : 'nav-item'} aria-current={route === id ? 'page' : undefined} onClick={() => go(id)} title={label}><Icon size={19}/><span>{label}</span></button>)}</nav>
      <div className="sidebar-bottom">
        <button className="phase-chip" title="View program phases" onClick={() => go('program')}><span className="phase-icon"><LockKeyhole size={16}/></span><span><strong>Phase {phase}</strong><small>{phase ? 'Post-clearance' : 'Pre-clearance'}</small></span><ChevronRight size={15}/></button>
        <div className="offline"><span/> Offline · Local data</div>
      </div>
    </aside>
    <div className="workspace">
      <header className="toolbar"><div className="breadcrumb"><span>Comeback OS</span><ChevronRight size={13}/><strong>{inPlayer ? 'Workout player' : routes.find(item => item.id === route)?.label}</strong></div><div className="toolbar-right">
        <span className="toolbar-date"><CalendarDays size={16}/>{dateLabel(today,{weekday:'short',month:'short',day:'numeric'})}</span>
        <button className="icon-btn toolbar-audio" title={state.audio ? 'Mute audio' : 'Enable audio'} aria-label={state.audio ? 'Mute audio' : 'Enable audio'} aria-pressed={state.audio} onClick={audioToggle}>{state.audio ? <Volume2 size={18}/> : <VolumeX size={18}/>}</button>
      </div></header>
      <main className="main" id="main-content" ref={mainRef}>
        {error && <div className="alert" role="alert"><AlertTriangle size={17}/>{error}</div>}
        {!inPlayer && <div className="page-heading"><div><h1>{titles[route]}</h1><p>{route === 'home' ? dateLabel(today,compactDate) + ' · ' + phases[phase].name : route === 'training' ? 'Today’s work and supplemental sessions' : route === 'program' ? 'Weekly split, progression and clearance' : route === 'library' ? 'Movement guides and prescriptions' : route === 'calendar' ? 'Track the work you put in' : 'Daily targets, weigh-ins and mobility benchmarks'}</p></div>{route === 'home' && <button className="button subtle heading-check" onClick={() => go('checkin')}><Activity size={17}/> Daily check-in</button>}</div>}
        {(hold || reasons.length > 0) && <div className={hold ? 'alert global-flag' : 'notice global-flag'} role="status">
          <AlertTriangle size={21}/><div><strong>{hold ? 'Stop this exercise for today' : 'Recovery flag'}</strong><p>{reasons.join(' · ')}. {hold ? 'Review the surgeon checklist and swap the next hard session for recovery. ' : ''}{deloadText}</p></div>
          {hold && <button className="button subtle" onClick={() => setRed(true)}>Red flags</button>}
          {!hold && <button className="button subtle" onClick={() => update(before => ({ ...before, deload:today }))} disabled={state.deload === today}>{state.deload === today ? 'Deload applied' : 'Apply 7-day deload'}</button>}
          <button className="button subtle" onClick={swapForRecovery}>Swap next hard day</button>
        </div>}
        {route === 'home' && <>
          <div className="overview-grid">
            <div className="overview-primary">
              <section className="session-lead">
                <Court className="hero-court"/>
                <div className="lead-content">
                  <div className="lead-context"><span className="lead-day">{day.name} session</span></div>
                  <h2>{day.title}</h2><p>{day.focus}</p>
                  <div className="lead-facts"><span><Clock3 size={16}/>{day.minutes} min</span><span><Target size={16}/>{day.level} effort</span></div>
                  <div className="lead-actions"><button className="button lead-start" type="button" onClick={() => goPlan(today,'workout',true)} disabled={hold}><Play size={16} fill="currentColor"/>{Object.keys(log.sets ?? {}).length ? 'Resume workout' : 'Start workout'}<ArrowRight size={17}/></button><button className="quiet lead-quiet" type="button" onClick={() => goPlan()}>View plan <ChevronRight size={16}/></button></div>
                </div>
              </section>
              <section className="panel week-strip">
                <div className="strip-intro"><CalendarRange size={17}/><strong>This week</strong></div>
                <div className="week-days">{Array.from({length:7},(_,i) => {
                  const date = plusDays(monday(today),i)
                  const status = state.logs[date]?.status || ''
                  return <button type="button" key={date} className={(date === today ? 'current ' : '') + status} onClick={() => goPlan(date)} aria-current={date === today ? 'date' : undefined} aria-label={dateLabel(date,compactDate) + (status ? ', ' + status : '')}><span>{dateLabel(date,{weekday:'short'})}</span><strong className="mono">{date.slice(-2)}</strong><i/></button>
                })}</div>
              </section>
              <section className="panel plan-preview">
                <div className="panel-header"><div><h2>Session plan</h2><p>Main work · {mainRows.length} exercises</p></div><button className="quiet" onClick={() => goPlan()}>Full session <ArrowUpRight size={16}/></button></div>
                {mainRows.slice(0,4).map(item => <ExerciseRow key={item.id} item={item} open={() => setDetail(item)} done={Object.keys(log.sets ?? {}).filter(key => key.startsWith(item.id + ':')).length}/>)}
              </section>
            </div>
            <aside className="overview-rail">
              {readiness}
              <section className="panel phase-panel">
                <div className="rail-heading"><CalendarRange size={19}/><h2>Phase {phase} progression</h2></div>
                <div className="week-count"><strong className="mono">{String(week).padStart(2,'0')}</strong><span> / 08<br/> <small>Foundation weeks</small></span><span className="effort mono">{progression[week-1][0]}/10 <small>Effort</small></span></div>
                <div className="week-progress" aria-label={`Week ${week} of 8`}>{progression.map((_,i) => <span key={i} className={i+1 === week ? 'here' : i+1 < week ? 'passed' : ''}/>)}</div>
                <p>{progression[week-1][2]}. {progression[week-1][3]}.</p>
                <button className="quiet" onClick={() => go('program')}>Program timeline <ArrowUpRight size={15}/></button>
              </section>
              <section className="panel faith-panel">
                <div className="rail-heading"><FaithIcon/><h2>Daily mindset</h2></div>
                <blockquote>{verse[1]}</blockquote><cite>{verse[0]} · KJV excerpt</cite>
                <p>{verse[2]}</p>
                <button className="quiet" onClick={showVerse}>Next verse <ArrowRight size={15}/></button>
              </section>
            </aside>
          </div>
          <Stats state={state} today={today}/>
          <section className="panel quote"><BookOpen size={18}/><p>“{quote}”</p></section>
        </>}
        {route === 'training' && (!inPlayer ? <div className="page-content">
          <div className="training-tools">
            <div className="view-tabs" aria-label="Session type">{modules.map(([id,label]) => <button key={id} aria-pressed={module === id} onClick={() => { setModule(id);setCategory('') }}>{label}</button>)}</div>
            <label className="field training-date">Plan date<input type="date" value={planDate} onChange={e => { if (e.target.value) setPlanDate(e.target.value) }}/></label>
          </div>
          <section className="panel training-lead"><div><h2>{module === 'workout' ? selectedDay.title : module === 'foam' ? 'Silent foam ball handles' : modules.find(([id]) => id === module)?.[1]}</h2><p>{dateLabel(planDate,compactDate)} · {module === 'foam' ? '2 × 2 m dorm setup' : module === 'workout' ? selectedDay.focus : 'Recovery work'}</p>
            {module === 'foam' && phase === 0 && <p><LockKeyhole size={15}/> Two-hand drills unlock after surgeon clearance.</p>}</div>
            {planDate === today ? startButton('Start session',() => goPlan(planDate,module,true)) : <button className="button subtle" onClick={() => goPlan(today,module)}>Back to today</button>}
          </section>
          <label className="field category-filter">Filter exercises<select value={category} onChange={e => setCategory(e.target.value)}><option value="">All categories</option>{categories.map(item => <option key={item}>{item}</option>)}</select></label>
          {sections.map(section => <SessionSection key={section.id} section={section} select={setDetail} filter={category} log={planLog} open={Boolean(category) || reviewSections.includes(section.id)} toggle={() => setReviewSections(list => list.includes(section.id) ? list.filter(id => id !== section.id) : [...list,section.id])}/>)}
          {category && !sections.some(section => section.rows.some(item => category === categories[9] ? item.flag : item.category === category)) && <Empty>No matching exercises in this session.</Empty>}
        </div> : <div className="page-content">
          <WorkoutPlayer key={module + planDate} title={module === 'workout' ? day.title : modules.find(([id]) => id === module)?.[1] ?? 'Session'} sections={sections} module={module} log={log} phase={phase} audio={state.audio} tempo={state.tempo} show={setDetail} record={record} stop={stop} onCurrent={item => { current.current = item }} onAudio={audioToggle} onTempo={() => update(before => ({ ...before,tempo:!before.tempo }))} onExit={() => setPlay(false)}/>
          <div className="player-readiness">{readiness}</div>
        </div>)}
        {route === 'program' && <Program state={state} update={update} today={today} navigate={goPlan}/>}
        {route === 'library' && <Library phase={phase} open={setDetail}/>}
        {route === 'calendar' && <Calendar state={state} update={update} today={today}/>}
        {route === 'checkin' && <CheckInForm state={state} update={update} today={today}/>}
      </main>
    </div>
    {detail && <ExerciseDetail exercise={detail} phase={phase} log={log} close={() => setDetail(undefined)}/>}
    {red && <RedFlags close={() => setRed(false)}/>}
  </div>
}

function SessionSection({ section,select,filter,log,open,toggle }: { section: Section; select(item: Exercise): void; filter:string; log: DayLog; open:boolean; toggle(): void }) {
  const items = filter ? section.rows.filter(item => filter === categories[9] ? item.flag : item.category === filter) : section.rows
  if (!items.length) return null
  return <section className="panel session-section">
    <button className="section-toggle" onClick={toggle} aria-expanded={open} disabled={Boolean(filter)}><span><strong>{section.name}</strong><small>{section.duration || items.length + ' exercises'}</small></span><ChevronDown size={20}/></button>
    {open && <div>{items.map((item,i) => {
      const group = /^[A-Z]\d+$/.test(item.block) ? item.block[0] : ''
      const linked = Boolean(group && items[i+1]?.block[0] === group)
      const preceded = Boolean(group && items[i-1]?.block[0] === group)
      return <div className={'session-item ' + (linked ? 'linked ' : '') + (preceded ? 'preceded' : '')} key={item.id}><ExerciseRow item={item} open={() => select(item)} done={Object.keys(log.sets ?? {}).filter(id => id.startsWith(item.id + ':')).length}/></div>
    })}</div>}
  </section>
}
