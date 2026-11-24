import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { circuit, cooldown, dailyMobility, days, expansion, foamRows, phases, rehabRows, sundayMobility, warmUp, type Exercise } from '../data/comebackProgram'
import { moduleLabel, moduleOrder, type Module } from '../model'
import { ExerciseAnimation } from './ExerciseAnimation'
import { CategoryPill, Empty, moduleIcon, prescription } from './ui'

const sources: Record<Module, Exercise[]> = {
  workout: [...warmUp, ...days.flatMap(day => day.main.filter(row => row.move !== 'plan')), ...circuit, ...phases.flatMap(phase => phase.rows)],
  mobility: [...dailyMobility, ...sundayMobility, ...cooldown],
  rehab: rehabRows,
  foam: [...foamRows, ...expansion],
}
function unique(rows: Exercise[]) {
  const seen = new Set<string>()
  return rows.filter(row => { const key = row.name.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true })
}

function Card({ item, phase, open }: { item: Exercise; phase: number; open(): void }) {
  const [hover, setHover] = useState(false)
  return <button className="lib-card" onClick={open} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={() => setHover(false)}>
    <span className="lib-thumb"><ExerciseAnimation exercise={item} protectedArm={phase === 0} compact playing={hover} controls={false}/></span>
    <span className="lib-copy"><strong>{item.name}</strong><CategoryPill item={item}/><span className="mono muted">{item.reps ? prescription(item) : 'Timed rounds'}</span></span>
  </button>
}

export function Library({ phase, open }: { phase: number; open(item: Exercise): void }) {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<Module | 'all'>('all')
  const lists = useMemo(() => Object.fromEntries(moduleOrder.map(m => [m, unique(sources[m]).filter(item => (item.minPhase ?? 0) <= phase)])) as Record<Module, Exercise[]>, [phase])
  const needle = query.trim().toLowerCase()
  const match = (item: Exercise) => !needle || item.name.toLowerCase().includes(needle) || item.category.toLowerCase().includes(needle) || item.load.toLowerCase().includes(needle)
  const shown = (tab === 'all' ? moduleOrder : [tab]).map(m => [m, lists[m].filter(match)] as const).filter(([, items]) => items.length)
  return <div className="library">
    <div className="library-bar">
      <div className="module-tabs" role="tablist" aria-label="Exercise type">
        <button role="tab" aria-selected={tab === 'all'} onClick={() => setTab('all')}>All</button>
        {moduleOrder.map(m => { const Icon = moduleIcon[m]; return <button key={m} role="tab" aria-selected={tab === m} className={'tone-' + m} onClick={() => setTab(m)}><Icon size={16}/>{moduleLabel[m]}<span className="count mono">{lists[m].length}</span></button> })}
      </div>
      <label className="search"><Search size={17}/><input type="search" value={query} placeholder="Search moves, equipment…" onChange={event => setQuery(event.target.value)} aria-label="Search exercises"/></label>
    </div>
    {shown.length ? shown.map(([m, items]) => <section key={m} className="lib-section">
      <h2>{moduleLabel[m]} <span className="mono muted">{items.length}</span></h2>
      <div className="lib-grid">{items.map(item => <Card key={item.id} item={item} phase={phase} open={() => open(item)}/>)}</div>
    </section>) : <Empty>No exercises match “{query}”.</Empty>}
  </div>
}
