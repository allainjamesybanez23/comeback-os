import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ArrowRight, Check, ChevronLeft, ChevronRight, Clock3, Flame, LockKeyhole, Mic, MicOff, Minus, Pause, Play, Plus, SkipForward, Timer, Trophy, Volume2, VolumeX, X } from 'lucide-react'
import type { Exercise, Section } from '../data/comebackProgram'
import { quotes } from '../data/comebackProgram'
import { blockedReason, historyFor, loadKg, moduleLabel, moduleOrder, queueFor, sessionDone, statsFor, targetReps, weekRings, workSeconds, type Module, type SetLog, type State, type Step } from '../model'
import { armAudio, chime, tempoTicks } from '../audio'
import { hush, speak, spokenDose } from '../voice'
import { badges, unlocked } from '../achievements'
import { ExerciseAnimation } from './ExerciseAnimation'
import { CategoryPill, Dialog, Readiness, Rings, WhyItHelps, formatClock, moduleIcon, ringTones } from './ui'

type Phase = 'idle' | 'ready' | 'work' | 'rest' | 'finish'
type Clock = { left: number; duration: number; deadline?: number }
const READY = 5
export type Setting = 'audio' | 'voice' | 'tempo' | 'autoflow'
type Props = {
  module: Module
  title: string
  sections: Section[]
  state: State
  today: string
  phase: number
  record(step: Step, data: SetLog, isLast: boolean): void
  complete(): void
  addTime(seconds: number): void
  markStarted(): void
  stop(item: Exercise): void
  setPain(value: number): void
  openFlags(): void
  showDetail(item: Exercise): void
  onSetting(key: Setting): void
  onExit(): void
  startNext(module: Module): void
}

function TimerRing({ fraction, tone, children, urgent }: { fraction: number; tone: string; children: React.ReactNode; urgent?: boolean }) {
  const r = 92, length = 2 * Math.PI * r
  return <div className={'timer-ring' + (urgent ? ' urgent' : '')}>
    <svg viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="100" r={r} fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth="9"/>
      <circle cx="100" cy="100" r={r} fill="none" stroke={tone} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${Math.max(0.001, fraction) * length} ${length}`} transform="rotate(-90 100 100)" className="ring-progress"/>
    </svg>
    <div className="ring-center">{children}</div>
  </div>
}
function Stepper({ label, value, set, step = 1, min = 0, max = 999, unit }: { label: string; value: number; set(value: number): void; step?: number; min?: number; max?: number; unit: string }) {
  return <div className="stepper" role="group" aria-label={label}>
    <span className="stepper-label">{label}</span>
    <div className="stepper-row">
      <button type="button" className="step-btn" aria-label={'Decrease ' + label} onClick={() => set(Math.max(min, +(value - step).toFixed(1)))}><Minus size={18}/></button>
      <input aria-label={label} className="mono" inputMode="decimal" value={value} onChange={event => { const next = Number(event.target.value); if (Number.isFinite(next)) set(Math.min(max, Math.max(min, next))) }}/>
      <button type="button" className="step-btn" aria-label={'Increase ' + label} onClick={() => set(Math.min(max, +(value + step).toFixed(1)))}><Plus size={18}/></button>
    </div>
    <span className="stepper-unit">{unit}</span>
  </div>
}

export function WorkoutPlayer(props: Props) {
  const { state, today, sections, module } = props
  const log = state.logs[today] ?? {}
  const audio = state.audio, voice = state.voice ?? true, tempo = state.tempo, autoflow = state.autoflow ?? true
  const queue = useMemo(() => queueFor(sections), [sections])
  const openIndex = () => Math.max(0, queue.findIndex(entry => !log.sets?.[entry.id] && !log.stopped?.includes(entry.item.id)))
  const [index, setIndex] = useState(openIndex)
  const [phase, setPhase] = useState<Phase>(() => queue.length > 0 && queue.every(entry => log.sets?.[entry.id] || log.stopped?.includes(entry.item.id)) ? 'finish' : 'idle')
  const [clock, setClock] = useState<Clock>()
  const [pending, setPending] = useState(false)
  const [reps, setReps] = useState(0)
  const [kg, setKg] = useState(0)
  const [contacts, setContacts] = useState('')
  const [contactError, setContactError] = useState(false)
  const [tempoRunning, setTempoRunning] = useState(false)
  const [tempoLabel, setTempoLabel] = useState('')
  const [painOpen, setPainOpen] = useState(false)
  const [exitOpen, setExitOpen] = useState(false)
  const [background, setBackground] = useState(false)
  const [hotkeyError, setHotkeyError] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startedAt = useRef(performance.now())
  const priorTime = useRef(log.time?.[module] ?? 0)
  const flushed = useRef(0)
  const active = useRef(false)
  const latest = useRef(props)
  latest.current = props
  const badgeSnapshot = useRef(badges(state, today).filter(unlocked).map(badge => badge.id))
  const root = useRef<HTMLDivElement>(null)
  const inputStep = useRef('')
  const prefs = useRef({ audio, voice })
  prefs.current = { audio, voice }
  const say = (text: string) => speak(text, prefs.current.voice)
  const beep = (frequency: number, finish = false) => { if (prefs.current.audio) chime(frequency, finish) }

  const step = queue[index]
  const item = step?.item
  const blocked = item ? blockedReason(item, log, props.phase) : ''
  const seconds = item ? workSeconds(item) : 0
  const manual = Boolean(item && (item.category === 'Plyometrics & Speed' || item.id.startsWith('circuit-') && ['jump', 'skate'].includes(item.move)) && item.contacts === undefined)
  const kgBase = item ? loadKg(item.load) : undefined
  const lastSets = item ? historyFor(state, item.id, today)[0]?.sets : undefined
  const lastSet = lastSets?.[(step?.round ?? 1) - 1] ?? lastSets?.[0]
  const showKg = kgBase !== undefined || lastSet?.kg !== undefined
  const ticks = tempoTicks(item?.tempo || '')
  const elapsedNow = () => Math.round((performance.now() - startedAt.current) / 1000)
  /* Session time is saved in pieces: on finish, on exit and when the player closes,
     so leaving and resuming later still adds up to the real total. */
  function activate() { if (!active.current) { active.current = true; latest.current.markStarted() } }
  function flushTime() {
    if (!active.current) return
    const now = elapsedNow(), delta = now - flushed.current
    if (delta > 0) { flushed.current = now; latest.current.addTime(delta) }
  }

  useEffect(() => {
    root.current?.focus()
    window.desktop?.keepAwake(true)
    const off = window.desktop?.onWorkoutKeyError(() => { setBackground(false); setHotkeyError(true) })
    if (phase !== 'finish' && queue[index]) announce(queue[index])
    return () => { window.desktop?.keepAwake(false); window.desktop?.backgroundKeys(false); off?.(); hush(); flushTime() }
  }, [])
  useEffect(() => {
    if (!item) return
    inputStep.current = step.id
    setReps(targetReps(item.reps) ?? 0)
    setKg(lastSet?.kg ?? kgBase ?? 0)
    setContacts(manual ? String(Math.round((seconds || 10) * 2)) : '')
    setContactError(false)
    setTempoLabel('')
  }, [step?.id])
  useEffect(() => {
    if (phase === 'finish') return
    const interval = window.setInterval(() => setElapsed(elapsedNow()), 1000)
    return () => clearInterval(interval)
  }, [phase])
  useEffect(() => { if (blocked) { setClock(undefined); setTempoRunning(false); if (phase !== 'finish' && phase !== 'rest') setPhase('idle') } }, [blocked])

  /* Timer engine: one deadline, handlers read the latest state through a ref. */
  const onEnd = useRef<() => void>(() => undefined)
  onEnd.current = () => {
    if (phase === 'ready') startWork()
    else if (phase === 'work') workEnd()
    else if (phase === 'rest') { beep(860, true); goTo(index, true) }
  }
  useEffect(() => {
    if (!clock?.deadline) return
    const deadline = clock.deadline
    let previous = clock.left
    const interval = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - performance.now()) / 1000))
      if (left === previous) return
      previous = left
      if (left > 0 && left <= 3) beep(650)
      if (phase === 'work' && clock.duration >= 30 && left === Math.floor(clock.duration / 2)) say('Halfway')
      if (phase === 'rest' && clock.duration >= 20 && left === 10) say('Ten seconds. Get ready.')
      setClock(value => value?.deadline === deadline ? { ...value, left, deadline: left ? deadline : undefined } : value)
      if (left === 0) onEnd.current()
    }, 50)
    return () => clearInterval(interval)
  }, [clock?.deadline])
  useEffect(() => {
    if (!tempoRunning || !tempo || blocked || !ticks.length) return
    let played = 0
    const origin = performance.now()
    const play = () => {
      const beat = Math.floor((performance.now() - origin) / 1000)
      if (beat < played) return
      played = beat + 1
      const tick = ticks[beat % ticks.length]
      beep(tick.tone)
      setTempoLabel(tick.phase + ' ' + tick.count)
    }
    play()
    const interval = window.setInterval(play, 45)
    return () => clearInterval(interval)
  }, [tempoRunning, tempo, item?.tempo, blocked])

  function announce(target: Step) {
    const sets = target.item.sets > 1 ? `Set ${target.round} of ${target.item.sets}.` : ''
    say(`${target.item.name}. ${sets} ${spokenDose(target.item.reps)}.`)
  }
  function run(kind: Phase, duration: number) {
    setPhase(kind)
    setClock({ left: duration, duration, deadline: performance.now() + duration * 1000 })
  }
  function startReady(target = step) {
    if (!target) return
    armAudio()
    activate()
    run('ready', READY)
    say(`Get ready. ${target.item.name}.`)
  }
  function startWork() {
    beep(860, true)
    run('work', seconds)
    say('Go')
  }
  function workEnd() {
    beep(860, true)
    setClock(undefined)
    if (manual || !autoflow) {
      setPhase('idle')
      setPending(true)
      say(manual ? 'Time. Log your foot contacts.' : 'Time. Log the set.')
    } else logSet(true)
  }
  function goTo(target: number, auto: boolean) {
    const next = queue[target]
    setIndex(target)
    setPending(false)
    setTempoRunning(false)
    if (!next) return
    const timed = workSeconds(next.item) > 0
    if (auto && timed && autoflow && !blockedReason(next.item, log, props.phase)) startReady(next)
    else { setPhase('idle'); setClock(undefined); announce(next) }
  }
  function upcoming(from: number) {
    return queue.findIndex((entry, i) => i > from && !log.sets?.[entry.id] && !log.stopped?.includes(entry.item.id))
  }
  function logSet(fromTimer = false) {
    if (!step || !item || blocked) return
    if (!fromTimer && seconds && !pending && !log.sets?.[step.id]) { startReady(); return }
    const count = Number(contacts)
    if (manual && (contacts === '' || !Number.isInteger(count) || count < 0 || count > 500)) { setContactError(true); return }
    armAudio()
    activate()
    const data: SetLog = { contacts: manual ? count : item.contacts ?? 0, at: Date.now() }
    const fresh = inputStep.current === step.id
    const repCount = fresh ? reps : targetReps(item.reps) ?? 0
    const weight = fresh ? kg : lastSet?.kg ?? kgBase ?? 0
    if (!seconds && repCount > 0) { data.reps = repCount; if (showKg && weight > 0) data.kg = weight }
    const after = upcoming(index)
    const isLast = after < 0
    props.record(step, data, isLast)
    setTempoRunning(false)
    setPending(false)
    if (isLast) { finish(); return }
    if (step.rest > 0) {
      setIndex(after)
      run('rest', step.rest)
      const next = queue[after]
      say(`Rest ${step.rest} seconds. Next, ${next.item.id === item.id ? `set ${next.round}` : next.item.name}.`)
    } else {
      if (step.nextInGroup) say('Superset. Keep moving.')
      goTo(after, true)
    }
  }
  function finish() {
    flushTime()
    setClock(undefined)
    setPhase('finish')
    beep(860, true)
    say('Session complete. Great work.')
  }
  function toggle() {
    if (phase === 'finish' || blocked) return
    armAudio()
    if (clock?.deadline) { setClock({ ...clock, deadline: undefined }); return }
    if (clock && clock.left > 0) { setClock({ ...clock, deadline: performance.now() + clock.left * 1000 }); return }
    if (phase === 'idle' && seconds && !pending) { startReady(); return }
    if (phase === 'idle' && tempo && ticks.length) setTempoRunning(value => !value)
  }
  function primary() {
    if (phase === 'finish' || blocked) return
    if (phase === 'rest') { beep(860, true); goTo(index, true); return }
    if (phase === 'ready' || phase === 'work') { toggle(); return }
    logSet()
  }
  function moveExercise(direction: -1 | 1) {
    const ids = [...new Set(queue.map(entry => entry.item.id))]
    const target = ids[ids.indexOf(item?.id ?? '') + direction]
    if (!target) return
    const open = queue.findIndex(entry => entry.item.id === target && !log.sets?.[entry.id])
    hush()
    goTo(open < 0 ? queue.findIndex(entry => entry.item.id === target) : open, false)
  }
  function skip() {
    if (!item) return
    if ((log.pain ?? 0) >= 3) props.stop(item)
    const other = queue.findIndex((entry, i) => i > index && entry.item.id !== item.id && !log.sets?.[entry.id] && !log.stopped?.includes(entry.item.id))
    if (other >= 0) goTo(other, false)
    else setExitOpen(true)
  }
  function exit() {
    if (phase === 'finish' || !queue.some(entry => log.sets?.[entry.id])) { props.onExit(); return }
    setExitOpen(true)
  }

  useEffect(() => {
    function runKey(key: string) {
      if (document.querySelector('dialog[open]')) return
      if (key === ' ') toggle()
      if (key === 'enter') primary()
      if (key === 'm') { armAudio(); props.onSetting('audio') }
      if (key === 'v') props.onSetting('voice')
      if (key === 'arrowleft') moveExercise(-1)
      if (key === 'arrowright') moveExercise(1)
      if (key === 'escape') exit()
    }
    function keydown(event: KeyboardEvent) {
      if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || document.querySelector('dialog[open]')) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, select, textarea, [contenteditable="true"]') && event.key !== 'Enter') return
      const key = event.key.toLowerCase()
      if ((key === ' ' || key === 'enter') && target?.closest('button, a')) return
      if (![' ', 'enter', 'arrowleft', 'arrowright', 'm', 'v', 'escape'].includes(key)) return
      event.preventDefault()
      runKey(key)
    }
    window.addEventListener('keydown', keydown)
    const off = window.desktop?.onWorkoutKey(runKey)
    return () => { window.removeEventListener('keydown', keydown); off?.() }
  })

  const done = queue.filter(entry => log.sets?.[entry.id]).length
  const ModuleIcon = moduleIcon[module]
  const header = <header className="player-bar">
    <button className="icon-btn ghost" onClick={exit} aria-label="Exit session" title="Exit (Esc)"><X size={20}/></button>
    <div className="player-title"><span className="eyebrow"><ModuleIcon size={13}/>{moduleLabel[module]}{step && phase !== 'finish' ? ' · ' + step.section : ''}</span><strong>{props.title}</strong></div>
    <div className="player-progress" aria-label={`${done} of ${queue.length} sets complete`}>
      <div className="progress-track"><span style={{ width: (queue.length ? done / queue.length * 100 : 0) + '%' }}/></div>
      <span className="mono">{done}/{queue.length} sets</span>
    </div>
    <div className="player-tools">
      <span className="elapsed mono" title="Total time in this session today"><Clock3 size={15}/>{formatClock(priorTime.current + elapsed)}</span>
      <button className={'pain-chip level-' + Math.min(log.pain ?? 0, 3)} onClick={() => setPainOpen(true)} title="Log forearm pain">Forearm <strong className="mono">{log.pain ?? 0}/10</strong></button>
      <button className="icon-btn" aria-pressed={voice} onClick={() => props.onSetting('voice')} title={'Voice coach ' + (voice ? 'on' : 'off') + ' (V)'} aria-label="Voice coach">{voice ? <Mic size={18}/> : <MicOff size={18}/>}</button>
      <button className="icon-btn" aria-pressed={audio} onClick={() => { armAudio(); props.onSetting('audio') }} title={'Beeps ' + (audio ? 'on' : 'off') + ' (M)'} aria-label="Beeps">{audio ? <Volume2 size={18}/> : <VolumeX size={18}/>}</button>
      <button className="icon-btn" aria-pressed={tempo} onClick={event => { event.currentTarget.blur(); props.onSetting('tempo') }} title={'Tempo metronome ' + (tempo ? 'on' : 'off')} aria-label="Tempo metronome"><Timer size={18}/></button>
    </div>
  </header>

  const dialogs = <>
    {painOpen && <Dialog title="Forearm check" close={() => setPainOpen(false)}><Readiness pain={log.pain ?? 0} setPain={value => { props.setPain(value) }} phase={props.phase} openFlags={() => { setPainOpen(false); props.openFlags() }} compact/></Dialog>}
    {exitOpen && <Dialog title="Leave this session?" close={() => setExitOpen(false)}>
      <p>{done} of {queue.length} sets are saved. You can resume from Today, or count the session as finished.</p>
      <div className="dialog-actions">
        <button className="button" autoFocus onClick={() => setExitOpen(false)}>Keep going</button>
        <button className="button subtle" onClick={() => { setExitOpen(false); activate(); props.complete(); finish() }}>Finish session now</button>
        <button className="button subtle" onClick={props.onExit}>Save &amp; exit</button>
      </div>
    </Dialog>}
  </>

  if (!queue.length) return <div className="player-shell">{header}<div className="player-empty"><p>This session has no exercises.</p><button className="button" onClick={props.onExit}>Back</button></div></div>

  if (phase === 'finish') return <div className="player-shell" ref={root} tabIndex={-1}>{header}<Finish {...props} startedBadges={badgeSnapshot.current} elapsed={elapsed} queue={queue}/>{dialogs}</div>

  if (!step || !item) return null
  const timed = seconds > 0
  const section = sections.find(entry => entry.name === step.section)
  const letter = /^([A-Z])\d+$/.exec(item.block)?.[1]
  const group = letter && section ? section.rows.filter(row => new RegExp('^' + letter + '\\d+$').test(row.block)) : []
  const rounds = group.length ? Math.max(...group.map(row => row.sets)) : item.sets
  const circuit = item.id.startsWith('circuit-')
  const cues = item.cue.split(/(?<=\.)\s+/).filter(Boolean)
  const upcomingSteps = queue.filter((entry, i) => i > index && !log.sets?.[entry.id]).slice(0, 4)
  const ringTone = phase === 'rest' ? '#8CA9F5' : phase === 'ready' ? '#F4F6F9' : '#FF5A3C'
  const urgent = Boolean(clock?.deadline && clock.left <= 3)
  const restNext = phase === 'rest'

  return <div className={'player-shell phase-' + phase} ref={root} tabIndex={-1}>
    {header}
    <main className="player-main">
      <section className={'demo-panel' + (restNext ? ' is-next' : '')} aria-label="Exercise demo">
        {restNext && <span className="demo-flag">Up next</span>}
        <ExerciseAnimation key={item.id} exercise={item} protectedArm={props.phase === 0} className="player-anim"/>
        <div className="demo-cues">
          <WhyItHelps item={item} compact/>
          <ol className="cue-list">{cues.map((cue, i) => <li key={i}>{cue}</li>)}</ol>
          {item.mistake && <p className="avoid"><AlertTriangle size={15}/>{item.mistake}</p>}
          <button className="quiet" onClick={() => props.showDetail(item)}>Full guide &amp; history <ChevronRight size={15}/></button>
        </div>
      </section>

      <section className="control-panel">
        <div className="control-meta">
          {group.length > 1 ? <span className="group-tag">Superset {letter} · round {step.round}/{rounds}</span> : circuit ? <span className="group-tag">Circuit · {item.adjustment}</span> : <span className="group-tag subtle">{step.section}</span>}
          <CategoryPill item={item}/>
        </div>
        {group.length > 1 && <ol className="superset-chain">{group.map(row => <li key={row.id} className={row.id === item.id ? 'current' : ''}><span className="block-code">{row.block}</span>{row.name}</li>)}</ol>}
        <h1 className="exercise-title">{restNext && <small>Next · </small>}{item.name}</h1>
        <div className="set-line">
          <span className="mono">Set {step.round} of {item.sets}</span>
          <span className="set-dots" aria-hidden="true">{Array.from({ length: item.sets }, (_, i) => <i key={i} className={log.sets?.[item.id + ':' + (i + 1)] ? 'done' : i + 1 === step.round ? 'now' : ''}/>)}</span>
        </div>
        <div className="chips">
          {item.load !== 'Bodyweight' && <span className="chip">{item.load}</span>}
          {item.tempo && <span className="chip mono">Tempo {item.tempo}</span>}
          {item.adjustment && !circuit && <span className="chip accent">{item.adjustment}</span>}
        </div>

        {blocked ? <div className="blocked">
          <div className="alert" role="status"><LockKeyhole size={18}/>{blocked}</div>
          <button className="button subtle" onClick={skip}><SkipForward size={17}/>Skip to the next exercise</button>
        </div> : <>
          <div className="big-display">
            {phase === 'ready' && clock ? <TimerRing fraction={clock.left / clock.duration} tone={ringTone} urgent>
              <span className="ring-label">Get ready</span><strong className="ring-count mono">{clock.left}</strong>
            </TimerRing> : phase === 'work' && clock ? <TimerRing fraction={clock.left / clock.duration} tone={ringTone} urgent={urgent}>
              <span className="ring-label">{clock.deadline ? 'Work' : 'Paused'}</span><strong className="ring-time mono">{formatClock(clock.left)}</strong>
            </TimerRing> : phase === 'rest' && clock ? <TimerRing fraction={clock.left / clock.duration} tone={ringTone} urgent={urgent}>
              <span className="ring-label">{clock.deadline ? 'Rest' : 'Rest paused'}</span><strong className="ring-time mono">{formatClock(clock.left)}</strong>
            </TimerRing> : timed ? <TimerRing fraction={pending ? 0 : 1} tone={ringTone}>
              <span className="ring-label">{pending ? 'Set complete' : 'Timed set'}</span><strong className="ring-time mono">{formatClock(seconds)}</strong>
            </TimerRing> : <div className="rep-target">
              <strong className="mono">{targetReps(item.reps) ?? item.reps}</strong>
              <span>{targetReps(item.reps) !== undefined ? item.reps.replace(/^\d+\s*/, '') || 'reps' : ''}</span>
              {tempoRunning && <em className="tempo-beat">{tempoLabel}</em>}
            </div>}
          </div>

          {phase === 'idle' && !timed && reps > 0 && <div className="log-inputs">
            <Stepper label="Reps" value={reps} set={setReps} max={200} unit={/\/\s*(leg|side|arm)/.test(item.reps) ? 'per side' : 'done'}/>
            {showKg && <Stepper label="Weight" value={kg} set={setKg} step={0.5} max={300} unit="kg"/>}
          </div>}
          {pending && manual && <label className="field contacts-field">Foot contacts this set<input type="number" value={contacts} min={0} max={500} onChange={event => { setContacts(event.target.value); setContactError(false) }} autoFocus/>{contactError && <span className="negative">Enter a whole number from 0 to 500.</span>}</label>}
          {lastSet && phase === 'idle' && <p className="last-time"><Flame size={14}/>Last time: <strong className="mono">{lastSet.reps !== undefined ? lastSet.reps + (lastSet.kg ? ' × ' + lastSet.kg + ' kg' : ' reps') : lastSet.contacts ? lastSet.contacts + ' contacts' : 'done'}</strong></p>}

          <div className="primary-actions">
            <button className={'button xl' + (phase === 'rest' ? ' subtle' : ' go')} onClick={event => { event.currentTarget.blur(); primary() }}>
              {phase === 'rest' ? <><SkipForward size={20}/>Skip rest</> :
                phase === 'ready' || phase === 'work' ? (clock?.deadline ? <><Pause size={20}/>Pause</> : <><Play size={20}/>Resume</>) :
                pending || !timed ? <><Check size={21}/>Log set</> : <><Play size={20} fill="currentColor"/>Start set</>}
              <kbd>{phase === 'ready' || phase === 'work' ? 'Space' : 'Enter'}</kbd>
            </button>
            {phase === 'rest' && clock && <button className="button subtle" onClick={() => setClock({ ...clock, left: clock.left + 15, duration: clock.duration + 15, deadline: clock.deadline ? clock.deadline + 15000 : undefined })}><Plus size={17}/>15 s</button>}
            {phase === 'work' && <button className="button subtle" onClick={() => { setClock(undefined); workEnd() }}><Check size={17}/>Done early</button>}
            {phase === 'idle' && !timed && tempo && ticks.length > 0 && <button className="button subtle" onClick={toggle} aria-pressed={tempoRunning}><Timer size={17}/>{tempoRunning ? 'Stop metronome' : 'Metronome'}<kbd>Space</kbd></button>}
          </div>
        </>}

        <div className="nav-row">
          <button className="button ghost" onClick={() => moveExercise(-1)}><ChevronLeft size={17}/>Previous</button>
          <button className="button ghost" onClick={skip}>Skip exercise<ChevronRight size={17}/></button>
        </div>
      </section>
    </main>
    <footer className="player-queue">
      <span className="queue-title">Up next</span>
      <ol>{upcomingSteps.length ? upcomingSteps.map(entry => <li key={entry.id}><strong>{entry.item.name}</strong><span className="mono">Set {entry.round}/{entry.item.sets} · {entry.item.reps}</span></li>) : <li><strong>Last set</strong><span>Finish strong</span></li>}</ol>
      <div className="keys" aria-label="Keyboard shortcuts"><span><kbd>Enter</kbd> log / start / skip rest</span><span><kbd>Space</kbd> pause</span><span><kbd>←</kbd><kbd>→</kbd> exercise</span><span><kbd>V</kbd> voice</span><span><kbd>M</kbd> beeps</span></div>
      {window.desktop && <label className="checkbox bg-keys" title={hotkeyError ? 'Windows could not register every key.' : 'Reserve the workout keys while this window is in the background.'}><input type="checkbox" checked={background} onChange={event => { setBackground(event.target.checked); setHotkeyError(false); window.desktop?.backgroundKeys(event.target.checked) }}/>Keys work in other apps</label>}
    </footer>
    {dialogs}
  </div>
}

function Finish(props: Props & { startedBadges: string[]; elapsed: number; queue: Step[] }) {
  const { state, today, module, queue } = props
  const log = state.logs[today] ?? {}
  const sets = queue.filter(entry => log.sets?.[entry.id]).map(entry => log.sets![entry.id])
  const reps = sets.reduce((sum, set) => sum + (set.reps ?? 0), 0)
  const volume = Math.round(sets.reduce((sum, set) => sum + (set.reps ?? 0) * (set.kg ?? 0), 0))
  const contacts = sets.reduce((sum, set) => sum + set.contacts, 0)
  const time = log.time?.[module] ?? props.elapsed
  const streak = statsFor(state, today).streak
  const rings = weekRings(state, today)
  const fresh = badges(state, today).filter(badge => unlocked(badge) && !props.startedBadges.includes(badge.id))
  const next = moduleOrder.find(m => m !== module && !sessionDone(log, m))
  const NextIcon = next ? moduleIcon[next] : ArrowRight
  const quote = quotes[(today.charCodeAt(9) + module.length) % quotes.length]
  return <main className="finish">
    <div className="finish-burst" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ '--i': i } as React.CSSProperties}/>)}</div>
    <div className="finish-badge"><Trophy size={44}/></div>
    <p className="eyebrow">{moduleLabel[module]} complete</p>
    <h1>{props.title}</h1>
    <p className="finish-quote">“{quote}”</p>
    <dl className="finish-stats">
      <div><dt>Time</dt><dd className="mono">{formatClock(time)}</dd></div>
      <div><dt>Sets</dt><dd className="mono">{sets.length}</dd></div>
      {reps > 0 && <div><dt>Reps</dt><dd className="mono">{reps}</dd></div>}
      {volume > 0 && <div><dt>Volume</dt><dd className="mono">{volume.toLocaleString()}<small> kg</small></dd></div>}
      {contacts > 0 && <div><dt>Foot contacts</dt><dd className="mono">{contacts}</dd></div>}
      <div><dt>Streak</dt><dd className="mono">{streak}<small> {streak === 1 ? 'day' : 'days'}</small></dd></div>
    </dl>
    <div className="finish-row">
      <div className="finish-rings">
        <Rings size={112} stroke={10} values={[
          { value: rings.workout, goal: 7, tone: ringTones.workout, label: 'Workouts' },
          { value: rings.rehab, goal: 7, tone: ringTones.rehab, label: 'Rehab' },
          { value: rings.mobility, goal: 7, tone: ringTones.mobility, label: 'Stretching' },
        ]}/>
        <ul><li><i style={{ background: ringTones.workout }}/>Workouts <b className="mono">{rings.workout}/7</b></li><li><i style={{ background: ringTones.rehab }}/>Rehab <b className="mono">{rings.rehab}/7</b></li><li><i style={{ background: ringTones.mobility }}/>Stretching <b className="mono">{rings.mobility}/7</b></li></ul>
      </div>
      {fresh.length > 0 && <div className="new-badges"><p className="eyebrow">Badge unlocked</p>{fresh.map(badge => { const Icon = badge.icon; return <div key={badge.id} className="badge-pop"><span><Icon size={22}/></span><div><strong>{badge.name}</strong><small>{badge.detail}</small></div></div> })}</div>}
    </div>
    <div className="finish-actions">
      {next && <button className="button xl go" onClick={() => props.startNext(next)}><NextIcon size={20}/>Start {moduleLabel[next].toLowerCase()}<ArrowRight size={18}/></button>}
      <button className="button subtle xl" onClick={props.onExit}>Back to Today</button>
    </div>
  </main>
}
