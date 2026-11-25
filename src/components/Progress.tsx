import { Activity, Clock3, Dumbbell, Flame, Footprints, HeartPulse, Lock, Medal, Waves } from 'lucide-react'
import { days } from '../data/comebackProgram'
import { dateLabel, dayFor, formatDuration, monday, moduleLabel, moduleOrder, sessionTimes, statsFor, weekRings, type Module, type State } from '../model'
import type { Update } from '../store'
import { badges, progressTotals, unlocked } from '../achievements'
import { Calendar } from './Tracking'
import { StrengthPanel } from './Strength'
import { Empty, Rings, moduleIcon, ringTones } from './ui'

export function Progress({ state, update, today, openReview }: { state: State; update: Update; today: string; openReview(start: string): void }) {
  const rings = weekRings(state, today)
  const totals = progressTotals(state, today)
  const metrics = statsFor(state, today)
  const list = badges(state, today)
  const earned = list.filter(unlocked)
  return <div className="progress-page">
    <div className="progress-top">
      <section className="panel rings-hero">
        <Rings size={176} stroke={15} values={[
          { value: rings.workout, goal: 7, tone: ringTones.workout, label: 'Workouts' },
          { value: rings.rehab, goal: 7, tone: ringTones.rehab, label: 'Rehab' },
          { value: rings.mobility, goal: 7, tone: ringTones.mobility, label: 'Stretching' },
        ]}/>
        <div>
          <p className="eyebrow">This week</p>
          <h2>{rings.workout + rings.rehab + rings.mobility} of 21 sessions</h2>
          <button className="button subtle review-btn" onClick={() => openReview(monday(today))}>Week in review</button>
          <ul className="ring-legend big">
            <li><i style={{ background: ringTones.workout }}/><span>Workouts</span><b className="mono">{rings.workout}/7</b></li>
            <li><i style={{ background: ringTones.rehab }}/><span>Forearm rehab</span><b className="mono">{rings.rehab}/7</b></li>
            <li><i style={{ background: ringTones.mobility }}/><span>Stretching</span><b className="mono">{rings.mobility}/7</b></li>
            <li><i style={{ background: ringTones.foam }}/><span>Ball handling</span><b className="mono">{rings.foam}</b></li>
          </ul>
        </div>
      </section>
      <dl className="stat-tiles">
        {([
          [Flame, metrics.streak, 'Current streak', 'days'],
          [Medal, metrics.longest, 'Longest streak', 'days'],
          [Dumbbell, totals.workouts, 'Workouts done', ''],
          [HeartPulse, metrics.rehab, 'Rehab compliance', '%'],
          [Waves, totals.stretch, 'Stretch sessions', ''],
          [Footprints, totals.contacts, 'Foot contacts', 'total'],
          [Activity, totals.volume.toLocaleString(), 'Volume lifted', 'kg'],
          [Medal, earned.length, 'Badges earned', '/ ' + list.length],
        ] as const).map(([Icon, value, label, unit]) => <div key={label} className="tile"><dt><Icon size={15}/>{label}</dt><dd className="mono">{value}<small> {unit}</small></dd></div>)}
      </dl>
    </div>
    <StrengthPanel state={state} today={today}/>
    <SessionTimes state={state} today={today}/>
    <section className="panel padded">
      <div className="card-heading"><Medal size={18}/><h2>Achievements</h2><span className="muted mono">{earned.length}/{list.length}</span></div>
      <div className="badge-grid">{list.map(badge => {
        const Icon = badge.icon
        const done = unlocked(badge)
        return <div key={badge.id} className={'badge' + (done ? ' earned' : '')}>
          <span className="badge-medal">{done ? <Icon size={24}/> : <Lock size={18}/>}</span>
          <strong>{badge.name}</strong>
          <small>{badge.detail}</small>
          {!done && <span className="progress-track"><span style={{ width: Math.min(100, badge.value / badge.goal * 100) + '%' }}/></span>}
          <small className="mono">{done ? 'Unlocked' : Math.min(badge.value, badge.goal).toLocaleString() + ' / ' + badge.goal.toLocaleString()}</small>
        </div>
      })}</div>
    </section>
    <Calendar state={state} update={update} today={today} stats={false}/>
  </div>
}

/* How long each session took, per day, so time on task is easy to review. */
function SessionTimes({ state, today }: { state: State; today: string }) {
  const entries = sessionTimes(state, today)
  const week = monday(today)
  const thisWeek = entries.filter(entry => entry.date >= week)
  const weekTotal = thisWeek.reduce((sum, entry) => sum + entry.seconds, 0)
  const workouts = entries.filter(entry => entry.module === 'workout').slice(0, 10)
  const average = workouts.length ? workouts.reduce((sum, entry) => sum + entry.seconds, 0) / workouts.length : 0
  const longest = entries.reduce((best, entry) => Math.max(best, entry.seconds), 0)
  const allTime = entries.reduce((sum, entry) => sum + entry.seconds, 0)
  const dates = [...new Set(entries.map(entry => entry.date))].slice(0, 21)
  const byModule = (module: Module) => thisWeek.filter(entry => entry.module === module).reduce((sum, entry) => sum + entry.seconds, 0)
  const at = (date: string, module: Module) => entries.find(entry => entry.date === date && entry.module === module)
  return <section className="panel padded session-times">
    <div className="card-heading"><Clock3 size={18}/><h2>Session time</h2><span className="muted">Timed automatically while a session is open</span></div>
    <dl className="time-summary">
      <div><dt>This week</dt><dd className="mono">{formatDuration(weekTotal)}</dd></div>
      <div><dt>Average workout</dt><dd className="mono">{average ? formatDuration(average) : '—'}</dd></div>
      <div><dt>Longest session</dt><dd className="mono">{longest ? formatDuration(longest) : '—'}</dd></div>
      <div><dt>All time</dt><dd className="mono">{formatDuration(allTime)}</dd></div>
    </dl>
    <ul className="time-split">{moduleOrder.map(m => <li key={m}><i style={{ background: ringTones[m] }}/>{moduleLabel[m]} <b className="mono">{formatDuration(byModule(m))}</b></li>)}</ul>
    {dates.length ? <div className="time-table-wrap"><table className="time-table">
      <thead><tr><th scope="col">Day</th>{moduleOrder.map(m => { const Icon = moduleIcon[m]; return <th key={m} scope="col"><span><Icon size={14}/>{moduleLabel[m]}</span></th> })}<th scope="col">Total</th></tr></thead>
      <tbody>{dates.map(date => {
        const total = moduleOrder.reduce((sum, m) => sum + (at(date, m)?.seconds ?? 0), 0)
        return <tr key={date}>
          <th scope="row"><strong>{date === today ? 'Today' : dateLabel(date, { weekday: 'short', month: 'short', day: 'numeric' })}</strong><small>{days[dayFor(state, date)].title}</small></th>
          {moduleOrder.map(m => { const entry = at(date, m); return <td key={m} className="mono">{entry ? <>{formatDuration(entry.seconds)}{entry.started && <small>{new Date(entry.started).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</small>}</> : <span className="muted">—</span>}</td> })}
          <td className="mono total">{formatDuration(total)}</td>
        </tr>
      })}</tbody>
    </table></div> : <Empty>Finish or leave a session and its time shows up here. You can also add minutes from the calendar.</Empty>}
  </section>
}
