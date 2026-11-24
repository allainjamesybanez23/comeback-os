import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Info, LockKeyhole, Pause, Play, SkipForward, Timer, Volume2, VolumeX } from 'lucide-react'
import type { Exercise, Section } from '../data/comebackProgram'
import { blockedReason, queueFor, workSeconds, type DayLog, type Module, type Step } from '../model'
import { armAudio, chime, tempoTicks } from '../audio'
import { CategoryPill } from './ui'

type TimerState = { kind: 'rest' | 'work'; duration: number; left: number; deadline?: number }
const clockText = (seconds: number) => String(Math.floor(seconds / 60)).padStart(2,'0') + ':' + String(seconds % 60).padStart(2,'0')

type Props = {
  title: string
  sections: Section[]
  module: Module
  log: DayLog
  phase: number
  audio: boolean
  tempo: boolean
  show(exercise: Exercise): void
  record(step: Step, contacts: number, isLast: boolean, rehab: boolean): void
  stop(exercise: Exercise): void
  onCurrent(exercise: Exercise): void
  onAudio(): void
  onTempo(): void
  onExit(): void
}
export function WorkoutPlayer(props: Props) {
  const { sections, log, phase, audio, tempo } = props
  const queue = useMemo(() => queueFor(sections), [sections])
  const [stepIndex, setIndex] = useState(() => Math.max(0, queue.findIndex(entry => !log.sets?.[entry.id] && !log.stopped?.includes(entry.item.id))))
  const [timer, setTimer] = useState<TimerState>()
  const [tempoRunning, setTempoRunning] = useState(false)
  const [tempoLabel, setTempoLabel] = useState('')
  const [actualContacts, setActualContacts] = useState('')
  const [contactError, setContactError] = useState(false)
  const [triggeredFinish, setTriggeredFinish] = useState(false)
  const [background, setBackground] = useState(false)
  const [hotkeyError, setHotkeyError] = useState(false)
  const completeGuard = useRef('')
  const playerRoot = useRef<HTMLDivElement>(null)
  const step = queue[stepIndex]
  const current = step?.item
  const blocked = current ? blockedReason(current,log,phase) : ''
  const allComplete = queue.length > 0 && queue.every(node => log.sets?.[node.id])
  const next = queue.slice(stepIndex + 1).find(entry => !log.sets?.[entry.id] && !log.stopped?.includes(entry.item.id))
  const exerciseIds = [...new Set(queue.map(entry => entry.item.id))]
  const exerciseIndex = exerciseIds.indexOf(current?.id ?? '')
  const ticks = tempoTicks(current?.tempo || '')
  const resting = timer?.kind === 'rest'
  const completedCount = queue.filter(entry => log.sets?.[entry.id]).length
  const secondsToWork = current ? workSeconds(current) : 0
  const timedReady = !secondsToWork || (timer?.kind === 'work' && timer.left === 0)
  const manualCount = Boolean(current && (current.category === 'Plyometrics & Speed' || current.id.startsWith('circuit-') && ['jump','skate'].includes(current.move)) && current.contacts === undefined)
  const audioRef = useRef(audio)
  audioRef.current = audio

  useEffect(() => {
    playerRoot.current?.focus()
    window.desktop?.keepAwake(true)
    const off = window.desktop?.onWorkoutKeyError(() => { setBackground(false);setHotkeyError(true) })
    return () => { window.desktop?.keepAwake(false);window.desktop?.backgroundKeys(false);off?.() }
  }, [])
  useEffect(() => {
    if (current) props.onCurrent(current)
    setActualContacts('')
    setContactError(false)
    setTempoLabel('')
    completeGuard.current = ''
  }, [step?.id])
  useEffect(() => {
    if (blocked) {
      setTimer(undefined)
      setTempoRunning(false)
    }
  }, [blocked])
  useEffect(() => {
    if (!timer?.deadline) return
    const deadline = timer.deadline
    let previous = timer.left
    const interval = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - performance.now()) / 1000))
      if (left === previous) return
      previous = left
      if (audioRef.current && left <= 3) chime(left ? 650 : 860, left === 0)
      setTimer(value => value?.deadline === deadline ? { ...value, left, deadline: left ? deadline : undefined } : value)
    }, 50)
    return () => clearInterval(interval)
  }, [timer?.deadline])
  useEffect(() => {
    if (!tempoRunning || !tempo || blocked || !ticks.length) return
    let played = 0
    const origin = performance.now()
    const play = () => {
      const beat = Math.floor((performance.now() - origin) / 1000)
      if (beat < played) return
      played = beat + 1
      const tick = ticks[beat % ticks.length]
      if (audioRef.current) chime(tick.tone)
      setTempoLabel(tick.phase + ' ' + tick.count)
    }
    play()
    const interval = window.setInterval(play, 45)
    return () => clearInterval(interval)
  }, [tempoRunning, tempo, current?.tempo, blocked])

  function toggle() {
    if (blocked || !current || (allComplete && !resting)) return
    armAudio()
    if (timer?.deadline) {
      setTimer({ ...timer, deadline: undefined })
      return
    }
    if (timer && timer.left > 0) {
      setTimer({ ...timer, deadline: performance.now() + timer.left * 1000 })
      return
    }
    if (secondsToWork && (!resting || timer.left === 0) && !log.sets?.[step.id]) {
      const seconds = secondsToWork
      setTimer({ kind: 'work', duration: seconds, left: seconds, deadline: performance.now() + seconds * 1000 })
      return
    }
    if (tempo && ticks.length && (!resting || timer.left === 0)) setTempoRunning(value => !value)
    else {
      const seconds = step.rest || current.rest || 45
      setTimer({ kind: 'rest', duration: seconds, left: seconds, deadline: performance.now() + seconds * 1000 })
    }
  }

  function choose(index: number) {
    if (index < 0 || index >= queue.length) return
    setIndex(index)
    setTimer(previous => previous?.kind === 'rest' ? previous : undefined)
    setTempoRunning(false)
  }
  function moveExercise(direction: -1 | 1) {
    const target = exerciseIds[exerciseIndex + direction]
    if (!target) return
    const unlogged = queue.findIndex(entry => entry.item.id === target && !log.sets?.[entry.id])
    choose(unlogged < 0 ? queue.findIndex(entry => entry.item.id === target) : unlogged)
  }
  function skipOrStop() {
    if (!current) return
    if (blocked && (log.pain ?? 0) >= 3) props.stop(current)
    const other = queue.findIndex((entry, index) => index > stepIndex && entry.item.id !== current.id && !log.sets?.[entry.id] && !log.stopped?.includes(entry.item.id))
    if (other >= 0) choose(other)
  }

  function complete() {
    if (blocked || !step || (resting && timer.left > 0)) return
    if (log.sets?.[step.id]) {
      if (next) choose(queue.indexOf(next))
      return
    }
    if (completeGuard.current === step.id) return
    if (!timedReady) { if (!timer?.deadline) toggle(); return }
    if (manualCount && (actualContacts === '' || Number(actualContacts) < 0 || Number(actualContacts) > 500 || !Number.isInteger(Number(actualContacts)))) {
      setContactError(true)
      return
    }
    armAudio()
    completeGuard.current = step.id
    const has = (entry: Step) => Boolean(log.sets?.[entry.id] || entry.id === step.id)
    const isLast = queue.every(has)
    const rehab = (props.module === 'workout' || props.module === 'rehab') && queue.some(entry => entry.item.category === 'Forearm Rehab') &&
      queue.filter(entry => entry.item.category === 'Forearm Rehab').every(has)
    props.record(step, manualCount ? Number(actualContacts) : current.contacts ?? 0, isLast, rehab)
    setTempoRunning(false)
    if (next) setIndex(queue.indexOf(next))
    if (isLast) { setTimer(undefined); setTriggeredFinish(true); if (audio) chime(860, true); return }
    if (step.rest > 0 && next) {
      setTimer({ kind: 'rest', duration: step.rest, left: step.rest, deadline: performance.now() + step.rest * 1000 })
    } else setTimer(undefined)
    if (tempo && step.nextInGroup && next?.item.tempo && !workSeconds(next.item)) setTempoRunning(true)
  }

  useEffect(() => {
    function runKey(key: string) {
      if (document.querySelector('dialog[open]')) return
      if (key === ' ') toggle()
      if (key === 'enter') complete()
      if (key === 'm') { armAudio(); props.onAudio() }
      if (key === 'arrowleft') moveExercise(-1)
      if (key === 'arrowright') moveExercise(1)
    }
    function keydown(event: KeyboardEvent) {
      if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || document.querySelector('dialog[open]')) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, select, textarea, [contenteditable="true"]')) return
      const key = event.key.toLowerCase()
      if ((key === ' ' || key === 'enter') && target?.closest('button, a')) return
      if (![' ', 'enter', 'arrowleft', 'arrowright', 'm'].includes(key)) return
      event.preventDefault()
      runKey(key)
    }
    window.addEventListener('keydown', keydown)
    const off = window.desktop?.onWorkoutKey(runKey)
    return () => { window.removeEventListener('keydown', keydown);off?.() }
  })

  if (!step || !current) return <div className="panel padded"><p>This session has no exercises.</p><button className="button" onClick={props.onExit}>Back to plan</button></div>
  const clock = timer?.left ?? (secondsToWork || step.rest || 45)
  const mode = resting ? (timer.left ? 'Rest timer' : 'Rest complete') : secondsToWork ? 'Work interval' : 'Set timer'
  return <div className="player" ref={playerRoot} tabIndex={-1}>
    <div className="player-top"><button className="button subtle" onClick={props.onExit}><ArrowLeft size={18}/>Back to plan</button><div className="player-settings">
      <button className="button subtle" onClick={() => { armAudio(); props.onAudio() }} aria-pressed={audio}>{audio ? <Volume2 size={17}/> : <VolumeX size={17}/>}<span>Audio {audio ? 'on' : 'off'}</span><kbd>M</kbd></button>
      <button className="button subtle" onClick={event => { event.currentTarget.blur(); armAudio(); const enable = !tempo; props.onTempo(); setTempoRunning(enable && !resting && !secondsToWork) }} aria-pressed={tempo}><Timer size={17}/> Tempo {tempo ? 'on' : 'off'}</button>
    </div></div>
    {allComplete && triggeredFinish && <div className="notice" role="status"><Check size={20}/> {props.title} saved. All sets logged.</div>}
    <div className="player-grid">
      <section className="panel player-focus">
        <div className="player-meta"><span>{step.section}</span><span className="mono">{completedCount} / {queue.length} sets</span></div>
        <progress value={completedCount} max={queue.length} aria-label="Session sets complete"/>
        <CategoryPill item={current}/><h1>{current.name}</h1>
        <p className="current-dose mono">Set {step.round} / {current.sets} <span>·</span> {current.reps}</p>
        <span>{current.load}{current.tempo && <> · <span className="mono">{current.tempo}</span></>}</span>
        {current.adjustment && <p>{current.adjustment}</p>}
        {blocked && <div className="alert" role="status"><LockKeyhole size={17}/>{blocked}</div>}
        <div className="player-actions">
          <button className="button" type="button" disabled={Boolean(blocked) || resting && timer.left > 0 || allComplete} onClick={event => { event.currentTarget.blur(); complete() }}>{timedReady ? <Check size={19}/> : <Play size={18}/>} {log.sets?.[step.id] ? 'Next unlogged set' : timedReady ? 'Complete set' : timer?.deadline ? 'Interval running' : 'Start interval'} <kbd>Enter</kbd></button>
          <button className="button subtle" onClick={() => props.show(current)}><Info size={17}/>Exercise guide</button>
        </div>
        {manualCount && <label className="field contacts-field">Actual foot contacts<input type="number" value={actualContacts} min={0} max={500} placeholder="Count both feet" onChange={event => { setActualContacts(event.target.value); setContactError(false) }}/>{contactError && <span className="negative">Enter a whole number from 0 to 500 before logging this set.</span>}</label>}
        {blocked && <button className="button subtle" onClick={skipOrStop}><SkipForward size={16}/>Move to next exercise</button>}
        <div className="player-navigation"><button className="button subtle" onClick={() => moveExercise(-1)} disabled={exerciseIndex === 0}><ChevronLeft size={17}/>Previous exercise</button><button className="button subtle" onClick={() => moveExercise(1)} disabled={exerciseIndex >= exerciseIds.length - 1}>Next exercise<ChevronRight size={17}/></button></div>
        {next && <p className="up-next"><ArrowRight size={17}/>{step.nextInGroup ? 'Superset next' : 'Up next'} <strong>{next.item.name}</strong></p>}
      </section>
      <section className={'panel timer-panel' + (timer?.deadline && clock <= 3 ? ' urgent' : '')}>
        <div className="timer-title"><Timer size={18}/>{mode}</div>
        <output className="timer-display mono" aria-label={mode}>{clockText(clock)}</output>
        <div className="timer-line"><span style={{ width: (timer ? timer.left / timer.duration * 100 : 100) + '%' }}/></div>
        <button className="button subtle" onClick={event => { event.currentTarget.blur(); toggle() }} disabled={Boolean(blocked) || allComplete}>{timer?.deadline || tempoRunning ? <Pause size={17}/> : <Play size={17}/>} {timer?.deadline || tempoRunning ? 'Pause' : 'Start'} <kbd>Space</kbd></button>
        {resting && timer.left > 0 && <button className="quiet" onClick={() => setTimer(undefined)}>End rest</button>}
        <div className="tempo-label" aria-live="off">{tempoRunning ? tempoLabel : tempo && ticks.length ? 'Tempo metronome ready' : ' '}</div>
      </section>
    </div>
    <div className="keyboard-legend"><span><kbd>Space</kbd> Start / pause</span><span><kbd>Enter</kbd> Complete or start interval</span><span><kbd>←</kbd> <kbd>→</kbd> Previous / next</span><span><kbd>M</kbd> Toggle audio</span></div>
    {window.desktop && <div className="background-keys"><label className="checkbox"><input type="checkbox" checked={background} onChange={event => {
      setBackground(event.target.checked)
      setHotkeyError(false)
      window.desktop?.backgroundKeys(event.target.checked)
    }}/> Enable workout shortcuts in other Windows apps</label><p>{hotkeyError ? 'Windows could not register every key. Shortcuts still work in this window.' : 'While the workout window is in the background, these keys are reserved for the workout.'}</p></div>}
  </div>
}
