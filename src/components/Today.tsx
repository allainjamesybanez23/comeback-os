import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BookOpen, CalendarClock, Check, ChevronRight, Clock3, Flame, Layers, Play, RotateCcw, Target, Trophy } from 'lucide-react'
import { days, mindset, phases, progression, quotes, type Exercise } from '../data/comebackProgram'
import { clearanceEarliest, dateLabel, dayFor, distance, formatDuration, moduleLabel, programSections, queueFor, sessionDone, sessionMinutes, sessionStats, startDate, statsFor, weekFor, weekRings, type Module, type State } from '../model'
import { badges, foundationDay, nextBadge, unlocked } from '../achievements'
import { ExerciseAnimation } from './ExerciseAnimation'
import { Court, FaithIcon, Readiness, Rings, moduleBlurb, moduleIcon, ringTones } from './ui'

type Props = {
  state: State; today: string; phase: number
  start(module: Module): void
  preview(module: Module, date?: string): void
  showDetail(item: Exercise): void
  setPain(value: number): void
  openFlags(): void
  openProgress(): void
}
const greeting = () => { const h = new Date().getHours(); return h < 5 ? 'Late night grind' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening' }

export function Today({ state, today, phase, start, preview, showDetail, setPain, openFlags, openProgress }: Props) {
  const [verseOffset, setVerse] = useState(0)
  const [spot, setSpot] = useState(0)
  const log = state.logs[today] ?? {}
  const pain = log.pain ?? 0
  const hold = pain >= 3
  const week = weekFor(state, today)
  const day = days[dayFor(state, today)]
  const sessions = useMemo(() => Object.fromEntries((['workout', 'mobility', 'rehab', 'foam'] as Module[]).map(m => {
    const sections = programSections(state, today, m, today)
    return [m, { sections, minutes: sessionMinutes(sections), stats: sessionStats(sections, log), done: sessionDone(log, m) }]
  })) as Record<Module, { sections: ReturnType<typeof programSections>; minutes: number; stats: ReturnType<typeof sessionStats>; done: boolean }>,
  [state.edits, state.schedule, state.clarity, state.phase, state.weekOverride, state.deload, state.logs[today], today])
  const main = sessions.workout.sections.find(section => section.id === 'main')?.rows.filter(row => row.move !== 'plan') ?? []
  useEffect(() => {
    if (main.length < 2) return
    const interval = window.setInterval(() => setSpot(value => (value + 1) % main.length), 7000)
    return () => clearInterval(interval)
  }, [main.length])
  const featured = main[spot % Math.max(1, main.length)]
  const workout = sessions.workout
  const started = workout.stats.done > 0 && !workout.done
  const ordinal = distance(startDate, today)
  const verse = mindset[((ordinal + verseOffset) % mindset.length + mindset.length) % mindset.length]
  const quote = quotes[(ordinal % quotes.length + quotes.length) % quotes.length]
  const rings = weekRings(state, today)
  const stats = statsFor(state, today)
  const list = badges(state, today)
  const earned = list.filter(unlocked).length
  const upcoming = nextBadge(list)
  const NextIcon = upcoming?.icon ?? Trophy
  const foundation = foundationDay(today, startDate)
  const toClearance = distance(today, clearanceEarliest)
  const blockGroups = new Set(main.map(row => row.block[0])).size

  return <div className="today">
    <header className="today-head">
      <div>
        <p className="eyebrow">{dateLabel(today, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        <h1>{greeting()}.</h1>
        <p className="today-sub">Week {week} of 8 · {progression[week - 1][1]} · {phases[phase].name}</p>
      </div>
      <div className="streak-pill" title="Current streak"><Flame size={20}/><strong className="mono">{stats.streak}</strong><span>day streak</span></div>
    </header>

    <div className="today-grid">
      <div className="today-main">
        <section className={'hero' + (workout.done ? ' is-done' : '')}>
          <Court className="hero-court"/>
          <div className="hero-copy">
            <p className="eyebrow light">{day.name} · {day.level} day</p>
            <h2>{day.title}</h2>
            <p className="hero-focus">{day.focus}</p>
            <ul className="hero-facts">
              <li><Clock3 size={16}/>~{workout.minutes} min</li>
              <li><Layers size={16}/>{workout.stats.exercises} exercises</li>
              <li><Target size={16}/>{blockGroups} blocks</li>
            </ul>
            {started && <div className="hero-progress"><div className="progress-track"><span style={{ width: workout.stats.done / workout.stats.sets * 100 + '%' }}/></div><span className="mono">{workout.stats.done}/{workout.stats.sets} sets</span></div>}
            <div className="hero-actions">
              {workout.done ? <span className="done-badge"><Check size={18}/>Workout complete{log.time?.workout ? ' · ' + formatDuration(log.time.workout) : ''}</span> :
                <button className="button xl go" onClick={() => start('workout')} disabled={hold} title={hold ? 'Pain at 3/10 or more: training is locked for today' : undefined}><Play size={20} fill="currentColor"/>{started ? 'Resume workout' : 'Start workout'}<ArrowRight size={18}/></button>}
              <button className="button ghost light" onClick={() => preview('workout')}>{workout.done ? 'Review session' : 'Preview'}<ChevronRight size={17}/></button>
            </div>
          </div>
          {featured && <button className="hero-demo" onClick={() => showDetail(featured)} aria-label={'Open guide for ' + featured.name}>
            <ExerciseAnimation exercise={featured} protectedArm={phase === 0} compact controls={false}/>
            <span className="hero-demo-name"><span className="block-code">{featured.block}</span>{featured.name}</span>
          </button>}
        </section>

        <section>
          <div className="section-title"><h2>Also today</h2><p>Separate sessions. Do them any time.</p></div>
          <div className="session-cards">
            {(['mobility', 'rehab', 'foam'] as Module[]).map(m => {
              const info = sessions[m]
              const Icon = moduleIcon[m]
              const partial = info.stats.done > 0 && !info.done
              const first = queueFor(info.sections)[0]?.item
              return <article key={m} className={'session-card tone-' + m + (info.done ? ' is-done' : '')}>
                <div className="session-card-top">
                  <span className="session-icon"><Icon size={20}/></span>
                  {info.done ? <span className="done-badge small"><Check size={14}/>Done{log.time?.[m] ? ' · ' + formatDuration(log.time[m]!) : ''}</span> : <span className="mono muted">{log.time?.[m] ? formatDuration(log.time[m]!) + ' so far' : '~' + info.minutes + ' min'}</span>}
                </div>
                <h3>{moduleLabel[m]}</h3>
                <p>{moduleBlurb[m]}</p>
                {first && <div className="session-thumb"><ExerciseAnimation exercise={first} protectedArm={phase === 0} compact playing={false} controls={false}/></div>}
                <p className="session-count">{info.stats.exercises} exercises · {info.stats.sets} sets{partial ? ` · ${info.stats.done} done` : ''}</p>
                <div className="session-actions">
                  {info.done ? <button className="button subtle" onClick={() => start(m)}><RotateCcw size={16}/>Review</button> :
                    <button className="button" onClick={() => start(m)} disabled={hold}><Play size={16} fill="currentColor"/>{partial ? 'Resume' : 'Start'}</button>}
                  <button className="button ghost" onClick={() => preview(m)}>Preview</button>
                </div>
              </article>
            })}
          </div>
        </section>

        <section className="panel week-strip">
          <div className="card-heading"><CalendarClock size={18}/><h2>This week</h2></div>
          <div className="week-days">{rings.dates.map(date => {
            const dayLog = state.logs[date]
            const plan = days[dayFor(state, date)]
            return <button type="button" key={date} className={(date === today ? 'current ' : '') + (date < today ? 'past ' : '')} onClick={() => preview('workout', date)} aria-current={date === today ? 'date' : undefined} aria-label={dateLabel(date, { weekday: 'long', month: 'long', day: 'numeric' }) + ', ' + plan.title}>
              <span>{dateLabel(date, { weekday: 'short' })}</span>
              <strong className="mono">{Number(date.slice(-2))}</strong>
              <em>{plan.title.replace('Strength ', '').replace(' + ', '+')}</em>
              <span className="day-dots">{(['workout', 'mobility', 'rehab', 'foam'] as Module[]).map(m => <i key={m} className={sessionDone(dayLog, m) ? 'on' : ''} style={{ '--tone': ringTones[m] } as React.CSSProperties} title={moduleLabel[m]}/>)}</span>
            </button>
          })}</div>
        </section>
        <p className="quote-line">“{quote}”</p>
      </div>

      <aside className="today-rail">
        <section className="panel rings-card">
          <div className="card-heading"><Target size={18}/><h2>Weekly goals</h2><button className="quiet small" onClick={openProgress}>Progress <ChevronRight size={14}/></button></div>
          <div className="rings-body">
            <Rings values={[
              { value: rings.workout, goal: 7, tone: ringTones.workout, label: 'Workouts' },
              { value: rings.rehab, goal: 7, tone: ringTones.rehab, label: 'Rehab' },
              { value: rings.mobility, goal: 7, tone: ringTones.mobility, label: 'Stretching' },
            ]}/>
            <ul className="ring-legend">
              <li><i style={{ background: ringTones.workout }}/><span>Workouts</span><b className="mono">{rings.workout}/7</b></li>
              <li><i style={{ background: ringTones.rehab }}/><span>Forearm rehab</span><b className="mono">{rings.rehab}/7</b></li>
              <li><i style={{ background: ringTones.mobility }}/><span>Stretching</span><b className="mono">{rings.mobility}/7</b></li>
            </ul>
          </div>
        </section>

        <section className="panel countdown-card">
          <Court className="countdown-court"/>
          {state.clarity ? <>
            <p className="eyebrow">Cleared {dateLabel(state.clarity, { month: 'short', day: 'numeric' })}</p>
            <strong className="countdown-number mono">P{phase}</strong>
            <p>{phases[phase].name} · {phases[phase].basketball}</p>
          </> : toClearance > 0 ? <>
            <p className="eyebrow">Comeback countdown</p>
            <strong className="countdown-number mono">{toClearance}<small> days</small></strong>
            <p>until the earliest surgeon-clearance window (Jan 1, 2027).</p>
          </> : <>
            <p className="eyebrow">Clearance window open</p>
            <strong className="countdown-number mono">Ready</strong>
            <p>Record your surgeon’s clearance in Program when you get it.</p>
          </>}
          <div className="foundation">
            <div className="progress-track"><span style={{ width: foundation / 56 * 100 + '%' }}/></div>
            <span className="mono">Foundation day {foundation}/56</span>
          </div>
        </section>

        <button className="panel badge-card" onClick={openProgress}>
          <span className="badge-icon"><NextIcon size={22}/></span>
          <span className="badge-copy">
            <span className="eyebrow">{earned}/{list.length} badges · next up</span>
            {upcoming ? <><strong>{upcoming.name}</strong><small>{upcoming.detail}</small>
              <span className="progress-track"><span style={{ width: Math.min(100, upcoming.value / upcoming.goal * 100) + '%' }}/></span>
              <small className="mono">{Math.min(upcoming.value, upcoming.goal).toLocaleString()} / {upcoming.goal.toLocaleString()} {upcoming.unit ?? ''}</small></> : <strong>Every badge earned</strong>}
          </span>
        </button>

        <Readiness pain={pain} setPain={setPain} phase={phase} openFlags={openFlags}/>

        <section className="panel faith-panel">
          <div className="card-heading"><FaithIcon/><h2>Daily mindset</h2></div>
          <blockquote>{verse[1]}</blockquote><cite>{verse[0]} · KJV excerpt</cite>
          <p>{verse[2]}</p>
          <button className="quiet small" onClick={() => setVerse(value => value + 1)}><BookOpen size={14}/>Next verse</button>
        </section>
      </aside>
    </div>
  </div>
}
