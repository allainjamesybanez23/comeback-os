import { ArrowRight, Check, ChevronLeft, ChevronRight, Clock3, Layers, ListOrdered, Play, Repeat } from 'lucide-react'
import { days, type Exercise, type Section } from '../data/comebackProgram'
import { dateLabel, dayFor, moduleLabel, moduleOrder, plusDays, programSections, sessionDone, sessionMinutes, sessionStats, type DayLog, type Module, type State } from '../model'
import { ExerciseRow, moduleBlurb, moduleIcon } from './ui'

type Props = {
  state: State; today: string; phase: number
  module: Module; date: string
  setModule(module: Module): void
  setDate(date: string): void
  start(module: Module): void
  showDetail(item: Exercise): void
}
type Group = { kind: 'single'; item: Exercise } | { kind: 'superset'; letter: string; items: Exercise[] } | { kind: 'circuit'; items: Exercise[]; rounds: number; note: string }

export function groupRows(section: Section): Group[] {
  if (section.id === 'circuit') {
    const base = new Map<string, Exercise>()
    for (const row of section.rows) base.set(row.id.replace(/-r\d+$/, ''), row)
    const rounds = new Set(section.rows.map(row => row.block)).size
    const first = section.rows[0], last = section.rows[4]
    return [{ kind: 'circuit', items: [...base.values()], rounds, note: `${first?.seconds ?? 20} s work · ${first?.rest ?? 10} s switch · ${last?.rest || 60} s between rounds` }]
  }
  const groups: Group[] = []
  for (const row of section.rows) {
    const letter = /^([A-Z])\d+$/.exec(row.block)?.[1]
    const previous = groups[groups.length - 1]
    if (letter && previous?.kind === 'superset' && previous.letter === letter) previous.items.push(row)
    else if (letter && section.rows.some(other => other !== row && new RegExp('^' + letter + '\\d+$').test(other.block))) groups.push({ kind: 'superset', letter, items: [row] })
    else groups.push({ kind: 'single', item: row })
  }
  return groups
}
const doneCount = (log: DayLog, id: string) => Object.keys(log.sets ?? {}).filter(key => key.startsWith(id + ':')).length

export function Sessions({ state, today, phase, module, date, setModule, setDate, start, showDetail }: Props) {
  const log = state.logs[date] ?? {}
  const sections = programSections(state, date, module, today)
  const stats = sessionStats(sections, log)
  const minutes = sessionMinutes(sections)
  const day = days[dayFor(state, date)]
  const isToday = date === today
  const done = sessionDone(log, module)
  const hold = (state.logs[today]?.pain ?? 0) >= 3
  const Icon = moduleIcon[module]
  return <div className="sessions">
    <div className="sessions-bar">
      <div className="module-tabs" role="tablist" aria-label="Session type">
        {moduleOrder.map(m => { const TabIcon = moduleIcon[m]; return <button key={m} role="tab" aria-selected={module === m} className={'tone-' + m} onClick={() => setModule(m)}><TabIcon size={17}/>{moduleLabel[m]}{sessionDone(log, m) && <Check size={14} className="tab-check"/>}</button> })}
      </div>
      <div className="date-nav">
        <button className="icon-btn" aria-label="Previous day" onClick={() => setDate(plusDays(date, -1))}><ChevronLeft size={18}/></button>
        <span className="date-label"><strong>{isToday ? 'Today' : dateLabel(date, { weekday: 'long' })}</strong><small>{dateLabel(date, { month: 'short', day: 'numeric' })}</small></span>
        <button className="icon-btn" aria-label="Next day" onClick={() => setDate(plusDays(date, 1))}><ChevronRight size={18}/></button>
        {!isToday && <button className="button subtle" onClick={() => setDate(today)}>Today</button>}
      </div>
    </div>

    <section className={'session-lead tone-' + module}>
      <span className="session-icon big"><Icon size={26}/></span>
      <div className="session-lead-copy">
        <p className="eyebrow">{moduleLabel[module]}{module === 'workout' ? ' · ' + day.level + ' day' : ''}</p>
        <h1>{module === 'workout' ? day.title : moduleLabel[module]}</h1>
        <p>{module === 'workout' ? day.focus : moduleBlurb[module]}</p>
        <ul className="hero-facts"><li><Clock3 size={15}/>~{minutes} min</li><li><Layers size={15}/>{stats.exercises} exercises</li><li><ListOrdered size={15}/>{stats.sets} sets</li></ul>
      </div>
      <div className="session-lead-actions">
        {isToday ? (done ? <span className="done-badge"><Check size={18}/>Complete</span> :
          <button className="button xl go" onClick={() => start(module)} disabled={hold}><Play size={19} fill="currentColor"/>{stats.done ? 'Resume' : 'Start'} session<ArrowRight size={18}/></button>) :
          <p className="muted">Preview only. Sessions start on their day.</p>}
        {stats.done > 0 && <span className="mono muted">{stats.done}/{stats.sets} sets logged</span>}
      </div>
    </section>

    {sections.length > 1 && <ol className="flow-steps" aria-label="Session order">{sections.map((section, i) => <li key={section.id}><span className="mono">{i + 1}</span>{section.name}</li>)}</ol>}

    {sections.map((section, i) => <section key={section.id} className="panel flow-section">
      <header className="flow-head"><span className="flow-num mono">{i + 1}</span><div><h2>{section.name}</h2><p>{sectionHint(section)}</p></div></header>
      <div className="flow-body">{groupRows(section).map((group, g) => group.kind === 'single' ?
        <ExerciseRow key={group.item.id} item={group.item} open={() => showDetail(group.item)} done={doneCount(log, group.item.id)} protectedArm={phase === 0}/> :
        group.kind === 'superset' ? <div key={group.letter + g} className="superset">
          <div className="superset-head"><Repeat size={15}/><strong>Superset {group.letter}</strong><span>Alternate {group.items.map(item => item.block).join(' → ')} · {Math.max(...group.items.map(item => item.sets))} rounds · rest {group.items[group.items.length - 1].rest || 0} s after each round</span></div>
          {group.items.map(item => <ExerciseRow key={item.id} item={item} open={() => showDetail(item)} done={doneCount(log, item.id)} protectedArm={phase === 0}/>)}
        </div> : <div key={'circuit' + g} className="superset circuit">
          <div className="superset-head"><Repeat size={15}/><strong>{group.rounds} rounds</strong><span>{group.note}</span></div>
          {group.items.map(item => <ExerciseRow key={item.id} item={{ ...item, sets: group.rounds }} open={() => showDetail(item)} protectedArm={phase === 0} code={false}/>)}
        </div>)}</div>
    </section>)}
  </div>
}
function sectionHint(section: Section) {
  if (section.id === 'warm') return 'Raise heat, open the hips and ankles, then wake up the springs.'
  if (section.id === 'main') return 'Supersets alternate exercises and rest once per round.'
  if (section.id === 'circuit') return 'Move straight through the list each round.'
  if (section.id === 'cooldown') return 'Bring the heart rate down and loosen what you worked.'
  if (section.id === 'mobility') return 'Starts on the floor and finishes standing, so you never bounce up and down.'
  if (section.id === 'rehab') return 'Range of motion first, then light strength, grip, and a gentle stretch.'
  if (section.id === 'foam') return 'Stationary pounds first, then V-dribbles, moves and footwork.'
  return section.rows.length + ' exercises'
}
