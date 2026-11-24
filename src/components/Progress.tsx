import { Activity, Dumbbell, Flame, Footprints, HeartPulse, Lock, Medal, Waves } from 'lucide-react'
import { statsFor, weekRings, type State } from '../model'
import type { Update } from '../store'
import { badges, progressTotals, unlocked } from '../achievements'
import { Calendar } from './Tracking'
import { Rings, ringTones } from './ui'

export function Progress({ state, update, today }: { state: State; update: Update; today: string }) {
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
