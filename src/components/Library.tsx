import { useMemo, useState } from 'react'
import { LockKeyhole, Search } from 'lucide-react'
import { circuit, cooldown, dailyMobility, days, expansion, foamRows, gripDrills, handleDrills, phases, rehabRows, sundayMobility, warmUp, type Exercise } from '../data/comebackProgram'
import { gateLabel, gateRank, moduleLabel, moduleOrder, owns, type Module, type State } from '../model'
import { benefitFor, benefitLabel } from '../data/benefits'
import { ExerciseAnimation } from './ExerciseAnimation'
import { BenefitTags, Empty, moduleIcon, prescription } from './ui'

const sources: Record<Module, Exercise[]> = {
  workout: [...warmUp, ...days.flatMap(day => day.main.filter(row => row.move !== 'plan')), ...gripDrills, ...circuit, ...phases.flatMap(phase => phase.rows)],
  mobility: [...dailyMobility, ...sundayMobility, ...cooldown],
  rehab: rehabRows,
  foam: [...foamRows, ...handleDrills, ...expansion],
}
function unique(rows: Exercise[]) {
  const seen = new Set<string>()
  return rows.filter(row => { const key = row.name.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true })
}

function Card({ item, phase, locked, open }: { item: Exercise; phase: number; locked: boolean; open(): void }) {
  const [hover, setHover] = useState(false)
  return <button className="lib-card" onClick={open} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={() => setHover(false)}>
    <span className="lib-thumb"><ExerciseAnimation exercise={item} protectedArm={phase === 0} compact playing={hover} controls={false}/></span>
    <span className="lib-copy"><strong>{item.name}</strong><BenefitTags item={item}/><span className="mono muted">{item.reps ? prescription(item) : 'Timed rounds'}</span>{locked && <span className="lock-chip"><LockKeyhole size={12}/>Unlocks with {gateLabel(item.gate)}</span>}</span>
  </button>
}

/* Shows future exercises too (with their unlock), but hides any that need equipment you don't have. */
export function Library({ state, phase, level, open }: { state: State; phase: number; level: number; open(item: Exercise): void }) {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<Module | 'all'>('all')
  const lists = useMemo(() => Object.fromEntries(moduleOrder.map(m => [m, unique(sources[m]).filter(item => owns(state, item.equipment))])) as Record<Module, Exercise[]>, [state.equipment])
  const needle = query.trim().toLowerCase()
  const match = (item: Exercise) => !needle || [item.name, item.category, item.load, benefitFor(item.name)?.why ?? '', ...(benefitFor(item.name)?.tags.map(tag => benefitLabel[tag]) ?? [])].some(text => text.toLowerCase().includes(needle))
  const shown = (tab === 'all' ? moduleOrder : [tab]).map(m => [m, lists[m].filter(match)] as const).filter(([, items]) => items.length)
  return <div className="library">
    <div className="library-bar">
      <div className="module-tabs" role="tablist" aria-label="Exercise type">
        <button role="tab" aria-selected={tab === 'all'} onClick={() => setTab('all')}>All</button>
        {moduleOrder.map(m => { const Icon = moduleIcon[m]; return <button key={m} role="tab" aria-selected={tab === m} className={'tone-' + m} onClick={() => setTab(m)}><Icon size={16}/>{moduleLabel[m]}<span className="count mono">{lists[m].length}</span></button> })}
      </div>
      <label className="search"><Search size={17}/><input type="search" value={query} placeholder="Search moves, equipment, “forearm”…" onChange={event => setQuery(event.target.value)} aria-label="Search exercises"/></label>
    </div>
    {shown.length ? shown.map(([m, items]) => <section key={m} className="lib-section">
      <h2>{moduleLabel[m]} <span className="mono muted">{items.length}</span></h2>
      <div className="lib-grid">{items.map(item => <Card key={item.id} item={item} phase={phase} locked={gateRank(item) > level} open={() => open(item)}/>)}</div>
    </section>) : <Empty>No exercises match “{query}”.</Empty>}
  </div>
}
