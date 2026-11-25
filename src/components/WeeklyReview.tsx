import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, HeartPulse, Lightbulb, Minus, Moon, Trophy } from 'lucide-react'
import { progression } from '../data/comebackProgram'
import { bestSet, calendarWeek, dateLabel, formatDuration, historyFor, moduleLabel, moduleOrder, plusDays, sessionDone, statsFor, trainedExercises, weekTotals, type Module, type SetLog, type State } from '../model'
import { library } from '../data/library'
import { Dialog, Rings, moduleIcon, ringTones } from './ui'

type PR = { name: string; set: SetLog; previous?: SetLog }
const better = (a: SetLog, b?: SetLog) => !b || (a.kg ?? 0) > (b.kg ?? 0) || ((a.kg ?? 0) === (b.kg ?? 0) && (a.reps ?? 0) > (b.reps ?? 0))

export function reviewFor(state: State, start: string, today: string) {
  const end = plusDays(start, 6)
  const dates = Array.from({ length: 7 }, (_, i) => plusDays(start, i)).filter(date => date <= today)
  const counts = Object.fromEntries(moduleOrder.map(m => [m, dates.filter(date => sessionDone(state.logs[date], m)).length])) as Record<Module, number>
  const totals = weekTotals(state, start)
  const partial = dates.length < 7
  const previous = weekTotals(state, plusDays(start, -7), dates.length || 7)
  const prs: PR[] = []
  for (const { id } of trainedExercises(state)) {
    const all = historyFor(state, id)
    const week = all.filter(day => day.date >= start && day.date <= end)
    const before = all.filter(day => day.date < start)
    const top = bestSet(week), prior = bestSet(before)
    if (top && prior && better(top, prior)) prs.push({ name: library.find(item => item.id === id)?.name ?? 'Custom exercise', set: top, previous: prior })
  }
  const logs = dates.map(date => state.logs[date]).filter(Boolean)
  const pains = logs.map(log => log!.pain).filter((value): value is number => value !== undefined)
  const sleeps = logs.map(log => log!.check?.sleep).filter((value): value is number => value !== undefined)
  const weights = logs.map(log => log!.check?.weight).filter((value): value is number => value !== undefined)
  const avg = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : undefined
  const week = calendarWeek(start)
  const painMax = pains.length ? Math.max(...pains) : 0
  const tip = painMax >= 3 ? 'Your forearm hit the 3/10 stop line this week. Keep rehab gentle and mention it to your surgical team if it happens again.'
    : counts.rehab < 5 ? `Forearm rehab ${counts.rehab}/7 this week. It is the most important session for your comeback. Try pairing it with something you already do every day, like after dinner.`
    : counts.mobility < 4 ? `Stretching ${counts.mobility}/7. Ten minutes after your workout keeps hips and ankles ready for jumping.`
    : counts.workout < 5 ? `Workouts ${counts.workout}/7. Even an easy session keeps the streak and the habit alive.`
    : 'Strong, consistent week. Keep the same rhythm and protect your sleep.'
  return { partial, start, end, dates, counts, totals, previous, prs, painAvg: avg(pains), painMax, painDays: pains.filter(p => p > 0).length, sleep: avg(sleeps), weight: avg(weights), streak: statsFor(state, end < today ? end : today).streak, week, tip, next: progression[Math.min(7, week)] }
}

function Delta({ now, before, unit = '', partial = false }: { now: number; before: number; unit?: string; partial?: boolean }) {
  if (!before && !now) return null
  const diff = now - before
  const Icon = diff > 0 ? ArrowUpRight : diff < 0 ? ArrowDownRight : Minus
  return <span className={'delta ' + (diff >= 0 ? 'up' : 'down')}><Icon size={12}/>{diff > 0 ? '+' : ''}{diff.toLocaleString()}{unit} vs {partial ? 'same days last week' : 'last week'}</span>
}

export function WeeklyReview({ state, today, start, setStart, close }: { state: State; today: string; start: string; setStart(date: string): void; close(): void }) {
  const r = reviewFor(state, start, today)
  const range = dateLabel(r.start, { month: 'short', day: 'numeric' }) + ' – ' + dateLabel(r.end, { month: 'short', day: 'numeric' })
  const minutes = Math.round(r.totals.seconds / 60), prevMinutes = Math.round(r.previous.seconds / 60)
  return <Dialog title="Week in review" close={close} wide>
    <div className="review-nav">
      <button className="icon-btn" aria-label="Previous week" onClick={() => setStart(plusDays(start, -7))}><ChevronLeft size={18}/></button>
      <div><strong>Week {r.week} · {range}</strong><small>{progression[r.week - 1]?.[1]}{r.partial ? ' · in progress' : ''}</small></div>
      <button className="icon-btn" aria-label="Next week" disabled={plusDays(start, 7) > today} onClick={() => setStart(plusDays(start, 7))}><ChevronRight size={18}/></button>
    </div>
    <div className="review-top">
      <Rings size={124} stroke={11} values={[
        { value: r.counts.workout, goal: 7, tone: ringTones.workout, label: 'Workouts' },
        { value: r.counts.rehab, goal: 7, tone: ringTones.rehab, label: 'Rehab' },
        { value: r.counts.mobility, goal: 7, tone: ringTones.mobility, label: 'Stretching' },
      ]}/>
      <ul className="review-sessions">{moduleOrder.map(m => { const Icon = moduleIcon[m]; return <li key={m}><i style={{ background: ringTones[m] }}/><Icon size={15}/><span>{moduleLabel[m]}</span><b className="mono">{r.counts[m]}/7</b></li> })}</ul>
    </div>
    <dl className="review-stats">
      <div><dt>Training time</dt><dd>{formatDuration(r.totals.seconds)}</dd><Delta now={minutes} before={prevMinutes} unit=" min" partial={r.partial}/></div>
      <div><dt>Sets logged</dt><dd>{r.totals.sets}</dd><Delta now={r.totals.sets} before={r.previous.sets} partial={r.partial}/></div>
      <div><dt>Reps</dt><dd>{r.totals.reps.toLocaleString()}</dd><Delta now={r.totals.reps} before={r.previous.reps} partial={r.partial}/></div>
      <div><dt>Foot contacts</dt><dd>{r.totals.contacts.toLocaleString()}</dd><Delta now={r.totals.contacts} before={r.previous.contacts} partial={r.partial}/></div>
      {r.totals.volume > 0 && <div><dt>Volume</dt><dd>{r.totals.volume.toLocaleString()} kg</dd><Delta now={r.totals.volume} before={r.previous.volume} unit=" kg" partial={r.partial}/></div>}
      <div><dt>Streak</dt><dd>{r.streak} {r.streak === 1 ? 'day' : 'days'}</dd></div>
    </dl>
    <section className="review-block">
      <h3><Trophy size={15}/>Personal bests this week</h3>
      {r.prs.length ? <ul className="pr-list">{r.prs.map(pr => <li key={pr.name}><strong>{pr.name}</strong><span className="mono">{pr.set.reps}{pr.set.kg ? ' × ' + pr.set.kg + ' kg' : ' reps'}</span><small>was {pr.previous?.reps}{pr.previous?.kg ? ' × ' + pr.previous.kg + ' kg' : ''}</small></li>)}</ul>
        : <p>No new bests this week. Bests show up when you beat an earlier logged set.</p>}
    </section>
    <div className="review-two">
      <section className="review-block">
        <h3><HeartPulse size={15}/>Forearm</h3>
        <p>{r.painAvg === undefined ? 'No pain logged this week.' : `Average ${r.painAvg.toFixed(1)}/10, highest ${r.painMax}/10, ${r.painDays} ${r.painDays === 1 ? 'day' : 'days'} above zero.`}</p>
      </section>
      <section className="review-block">
        <h3><Moon size={15}/>Recovery</h3>
        <p>{r.sleep === undefined ? 'No sleep logged.' : `Sleep ${r.sleep.toFixed(1)} h average.`} {r.weight === undefined ? '' : `Weight ${r.weight.toFixed(1)} kg average.`}</p>
      </section>
    </div>
    <section className="review-block tip"><h3><Lightbulb size={15}/>Focus for next week</h3><p>{r.tip}</p>{r.next && <p className="muted">Next up: Week {Math.min(8, r.week + 1)} · {r.next[1]} · effort {r.next[0]}/10.</p>}</section>
  </Dialog>
}
