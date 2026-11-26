import { useMemo, useState, type FormEvent } from 'react'
import { AlertTriangle, ArrowDown, ArrowLeftRight, ArrowUp, CalendarDays, Check, ChevronRight, Copy, Hand, LockKeyhole, Package, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { categories, circuitDoses, days, optionalEquipment, phases, progression, type Category, type Exercise } from '../data/comebackProgram'
import { library } from '../data/library'
import { activePhase, programSections, sessionMinutes, clearanceEarliest, dateLabel, dayFor, editKey, eligiblePhase, gateLevel, gateRank, monday, owns, plusDays, prescribed, scheduleConflicts, startDate, weekFor, type State } from '../model'
import type { Update } from '../store'
import { CategoryPill, Dialog, Empty } from './ui'

type Props = { state: State; update: Update; today: string }
type Editor = { mode: 'new' | 'edit' | 'swap'; item: Exercise }
export { library }

export function Program({ state, update, today, navigate }: Props & { navigate(date: string): void }) {
  const [tab,setTab] = useState<'schedule' | 'editor' | 'progression'>('schedule')
  const [start,setStart] = useState(monday(today))
  const [week,setWeek] = useState(weekFor(state,today))
  const [day,setDay] = useState(dayFor(state,today))
  const [category,setCategory] = useState<Category | ''>('')
  const [editor,setEditor] = useState<Editor>()
  const [remove,setRemove] = useState<Exercise>()
  const [ready,setReady] = useState(false)
  const [clearanceDate,setClearanceDate] = useState(today)
  const [change,setChange] = useState('')
  const [target,setTarget] = useState('')
  const [showWarnings,setShowWarnings] = useState(false)
  const [clearDialog,setClearDialog] = useState(false)
  const [advance,setAdvance] = useState(0)
  const phase = activePhase(state,today)
  const level = gateLevel(state,today)
  const eligible = eligiblePhase(state.clarity,today)
  const key = editKey(week,day,phase)
  const items = state.edits[key] ?? prescribed(day,week,phase)
  const changed = state.edits[key] !== undefined
  const filtered = category ? items.filter(item => category === categories[categories.length - 1] ? item.flag : item.category === category) : items
  const weekDays = Array.from({length:7},(_,i) => plusDays(start,i))
  const propose = (before: State) => ({
    ...before, schedule: { ...before.schedule, [change]: dayFor(before,target), [target]: dayFor(before,change) },
  })
  const conflicts = change && target && target !== change ? [...scheduleConflicts(propose(state),change),...scheduleConflicts(propose(state),target)] : []
  const conflictKeys = [...new Set(conflicts.filter(pair => pair.includes(change) || pair.includes(target)).map(pair => pair.join('/')))].map(pair => pair.split('/'))

  function write(value: Exercise[]) {
    update(before => ({ ...before, edits: { ...before.edits, [key]: value } }))
  }
  function reorder(index: number, direction: number) {
    const other = index + direction
    if (other < 0 || other >= items.length) return
    const next = [...items]
    ;[next[index],next[other]] = [next[other],next[index]]
    write(next)
  }
  function duplicate(id: string) {
    const index = items.findIndex(item => item.id === id)
    const copy = { ...items[index], id: 'custom-' + crypto.randomUUID() }
    write([...items.slice(0,index+1),copy,...items.slice(index+1)])
  }
  function saveItem(item: Exercise) {
    write(editor?.mode === 'new' ? [...items,item] : items.map(existing => existing.id === editor?.item.id ? item : existing))
    setEditor(undefined)
  }
  function reset() {
    update(before => {
      const edits = { ...before.edits }
      delete edits[key]
      return { ...before, edits }
    })
  }
  function swap(event: FormEvent) {
    event.preventDefault()
    if (change === target || target < today || !target) return
    if (conflictKeys.length && !showWarnings) { setShowWarnings(true); return }
    update(propose)
    setChange('')
  }
  const currentWarnings = scheduleConflicts(state,plusDays(start,3)).filter(([a,b]) => weekDays.includes(a) && weekDays.includes(b))
  const rowName = (date: string) => dateLabel(date,{weekday:'short',month:'short',day:'numeric'})
  return <div className="page-content">
    <div className="view-tabs" aria-label="Program sections">
      <button onClick={() => setTab('schedule')} aria-pressed={tab === 'schedule'}>Schedule</button>
      <button onClick={() => setTab('editor')} aria-pressed={tab === 'editor'}>Exercise editor</button>
      <button onClick={() => setTab('progression')} aria-pressed={tab === 'progression'}>Weeks &amp; phases</button>
    </div>
    {tab === 'schedule' && <section className="panel">
      <div className="panel-header"><div><h2>Weekly split</h2><p>{rowName(start)} – {rowName(plusDays(start,6))}</p></div><div className="compact-actions"><button className="button subtle" onClick={() => setStart(plusDays(start,-7))}>Previous</button><button className="button subtle" onClick={() => setStart(plusDays(start,7))}>Next</button></div></div>
      {currentWarnings.length > 0 && <div className="notice schedule-notice"><AlertTriangle size={18}/><div><strong>48-hour recovery rule</strong><br/>{currentWarnings.map(([a,b]) => `${rowName(a)} and ${rowName(b)}`).join(' · ')} have consecutive hard leg sessions.</div></div>}
      <div>{weekDays.map(date => {
        const plan = days[dayFor(state,date)]
        return <div className="schedule-row" key={date}>
          <div className={'schedule-date ' + (date === today ? 'is-today' : '')}><span>{dateLabel(date,{weekday:'short'})}</span><strong className="mono">{date.slice(-2)}</strong></div>
          <div><strong>{plan.title}</strong><p>{plan.focus}</p></div><span className="pill">{plan.level} · ~{sessionMinutes(programSections(state,date,'workout',today))} min</span>
          <button className="button subtle" onClick={() => navigate(date)}>View <ChevronRight size={16}/></button>
          <button className="icon-btn" aria-label={'Reschedule ' + rowName(date)} title="Swap scheduled days" disabled={date < today} onClick={() => {setChange(date);setTarget(plusDays(date,1));setShowWarnings(false)}}><ArrowLeftRight size={17}/></button>
        </div>
      })}</div>
      {change && <Dialog title="Reschedule session" close={() => setChange('')}>
        <p>Swap {rowName(change)} with another upcoming date. Completed and partial logs stay on their original dates.</p>
        <form className="form-grid" onSubmit={swap}>
          <label className="field">Swap with<input type="date" required min={today} value={target} onChange={e => {setTarget(e.target.value);setShowWarnings(false)}}/></label>
          {target === change && <p className="negative">Choose a different date.</p>}
          {conflictKeys.length > 0 && <div className="alert"><AlertTriangle size={18}/><div><strong>Less than 48 hours between hard leg days</strong><br/>{conflictKeys.map(([a,b]) => rowName(a) + ' / ' + rowName(b)).join(' · ')}</div></div>}
          <button className="button" type="submit" disabled={!target || target === change || target < today}><ArrowLeftRight size={17}/>{showWarnings ? 'Confirm swap with warning' : 'Swap scheduled days'}</button>
        </form>
      </Dialog>}
    </section>}
    {tab === 'editor' && <section className="panel editor-panel">
      <div className="panel-header"><div><h2>Exercise editor</h2><p>Apply changes to the selected week and day.</p></div><button className="button" onClick={() => setEditor({ mode:'new', item:{ id:'custom-' + crypto.randomUUID(), name:'', category:categories[0], sets:3, reps:'10', tempo:'', load:'Bodyweight', rest:45, block:'', move:'', cue:'', mistake:'' } })}><Plus size={18}/>Add exercise</button></div>
      <div className="editor-controls">
        <label className="field">Week<select value={week} onChange={e => setWeek(Number(e.target.value))}>{progression.map((_,i) => <option key={i} value={i+1}>Week {i+1}</option>)}</select></label>
        <label className="field">Day<select value={day} onChange={e => setDay(Number(e.target.value))}>{days.map((item,i) => <option key={item.name} value={i}>{item.name}</option>)}</select></label>
        <label className="field">Category<select value={category} onChange={e => setCategory(e.target.value as Category | '')}><option value="">All categories</option>{categories.map(item => <option key={item}>{item}</option>)}</select></label>
      </div>
      {filtered.length === 0 && <Empty>No exercises match this category.</Empty>}
      {filtered.map(item => {
        const index = items.indexOf(item)
        return <div key={item.id} className="editor-row">
          <span className="block-code">{item.block || '—'}</span><div><strong>{item.name}</strong><CategoryPill item={item}/></div>
          <div className="editor-actions">
            {[
              [ArrowUp,'Move up',() => reorder(index,-1),index === 0],
              [ArrowDown,'Move down',() => reorder(index,1),index === items.length-1],
              [Pencil,'Edit',() => setEditor({ mode:'edit',item }),false],
              [Copy,'Duplicate',() => duplicate(item.id),false],
              [ArrowLeftRight,'Swap exercise',() => setEditor({ mode:'swap',item }),false],
              [Trash2,'Remove',() => setRemove(item),false],
            ].map(([Icon,label,action,disabled]) => {
              const Glyph = Icon as typeof ArrowUp
              return <button key={String(label)} className="icon-btn" type="button" title={String(label)} aria-label={String(label) + ' ' + item.name} disabled={Boolean(disabled)} onClick={action as () => void}><Glyph size={16}/></button>
            })}
          </div>
        </div>
      })}
      {changed && <div className="panel-footer"><button className="button subtle" onClick={reset}>Reset to program defaults</button></div>}
      {editor && <ExerciseForm key={editor.item.id + editor.mode} editor={editor} state={state} level={level} save={saveItem} close={() => setEditor(undefined)}/>}
      {remove && <Dialog title="Remove exercise?" close={() => setRemove(undefined)}><p>Remove {remove.name} from this week’s session plan.</p><button className="button" onClick={() => { write(items.filter(item => item.id !== remove.id));setRemove(undefined) }}>Remove exercise</button></Dialog>}
    </section>}
    {tab === 'progression' && <div className="page-content">
      <section className="panel padded">
        <div className="section-header"><div><h2>Eight-week foundation</h2><p>Program began {dateLabel(startDate,{dateStyle:'long'})}. Repeat a week if it feels too hard.</p></div><CalendarDays size={22}/></div>
        <label className="field date-field">Active week<select value={state.weekOverride ?? ''} onChange={e => update(before => ({ ...before, weekOverride:e.target.value === '' ? undefined : Number(e.target.value) }))}><option value="">Follow program dates</option>{progression.map((_,i) => <option key={i} value={i+1}>Repeat / follow Week {i+1}</option>)}</select></label>
        <div className="progression-list">{progression.map(([effort, title, lower, plyo, upper],i) => {
          const [rounds, work, rest, between] = circuitDoses[i]
          return <details key={title} open={i + 1 === weekFor(state,today)}><summary><span className="mono">W{i+1}</span><strong>{title}</strong><span className="mono">{effort}/10 effort</span></summary>
            <dl><div><dt>Lower strength</dt><dd>{lower}</dd></div><div><dt>Plyo</dt><dd>{plyo}</dd></div><div><dt>Upper</dt><dd>{upper}</dd></div><div><dt>Dorm circuit</dt><dd className="mono">{rounds} rounds · {work}s work / {rest}s rest · {between}s between rounds</dd></div></dl></details>
        })}</div>
      </section>
      <section className="panel padded">
        <div className="section-header"><div><h2>Surgeon clearance</h2><p>Post-clearance training opens on or after January 1, 2027 with confirmed clearance.</p></div><ShieldCheck size={22}/></div>
        <label className="toggle-line"><span>{state.clarity ? 'Surgeon clearance unlocked' : 'Surgeon clearance locked'}<small>{state.clarity ? dateLabel(state.clarity,{dateStyle:'long'}) : 'Phase 0 restrictions active'}</small></span><input type="checkbox" role="switch" checked={Boolean(state.clarity)} onChange={e => { if (e.target.checked) { setReady(false);setClearanceDate(today);setClearDialog(true) } else update(before => ({ ...before, clarity:'', phase:0 })) }}/></label>
        {clearDialog && <Dialog title="Record surgeon clearance" close={() => setClearDialog(false)}>
          <p>Record the date your surgeon cleared you. Follow any activity and load limits they gave you.</p>
          <form className="form-grid" onSubmit={e => { e.preventDefault(); if (!ready || !eligiblePhase(clearanceDate,today)) return; update(before => ({ ...before, clarity:clearanceDate, phase:1 }));setClearDialog(false) }}>
            {today < clearanceEarliest ? <div className="notice"><LockKeyhole size={17}/>This control becomes available January 1, 2027.</div> : <>
              <label className="field">Clearance date<input type="date" required value={clearanceDate} min={clearanceEarliest} max={today} onChange={e => setClearanceDate(e.target.value)}/></label>
              <label className="checkbox"><input type="checkbox" checked={ready} onChange={e => setReady(e.target.checked)}/> My surgeon has cleared me to begin reloading.</label>
              <button type="submit" className="button" disabled={!ready || !eligiblePhase(clearanceDate,today)}>Unlock Phase 1</button>
            </>}
          </form>
        </Dialog>}
        <form key={state.light?.date ?? 'none'} className="light-gate form-grid two-fields" onSubmit={e => {
          e.preventDefault()
          const data = new FormData(e.currentTarget), date = String(data.get('date') ?? ''), note = String(data.get('note') ?? '').trim()
          if (/^\d{4}-\d{2}-\d{2}$/.test(date) && date <= today) update(before => ({ ...before, light: { date, note: note || undefined } }))
        }}>
          <p className="field wide"><strong><Hand size={15}/> Light right-hand use OK’d</strong>Enter this after your follow-up, only if your surgeon or physio said light right-hand use is fine. It unlocks the soft right-hand ladder and light grip work. Heavy, impact and twisting load still wait for clearance.</p>
          <label className="field">Date OK’d<input name="date" type="date" required max={today} defaultValue={state.light?.date}/></label>
          <label className="field">Note<input name="note" maxLength={140} placeholder="What they said, e.g. foam ball only" defaultValue={state.light?.note}/></label>
          <div className="form-footer"><button className="button" type="submit"><Check size={17}/>{state.light ? 'Update' : 'Save'}</button>{state.light && <button type="button" className="button subtle" onClick={() => update(before => ({ ...before, light: undefined }))}>Remove</button>}{state.light && <span role="status">{state.light.date <= today ? 'Unlocked' : 'Unlocks'} {dateLabel(state.light.date,{dateStyle:'medium'})}</span>}</div>
        </form>
        <div className="phase-list">{phases.map((item,i) => <details key={item.name} open={i === phase}>
          <summary><span className="mono">P{i}</span><strong>{item.name}</strong><span>{i === phase ? 'Active' : i > phase ? <><LockKeyhole size={14}/> Locked</> : 'Available'}</span></summary>
          <p>{item.span} · {item.basketball}</p>
          {i === 0 ? <p>17 kg dumbbell in the left hand only. No pull-ups, hangs, floor push-ups, or hand planks.</p> : item.rows.map(row => <p key={row.id}>{row.name} <span className="mono muted">{row.sets > 1 ? row.sets + ' × ' : ''}{row.reps}</span> · {row.load}</p>)}
          {i === phase+1 && i <= eligible && <button className="button subtle" onClick={() => setAdvance(i)}>Advance to Phase {i}</button>}
        </details>)}</div>
        {advance > 0 && <Dialog title="Advance the active phase" close={() => setAdvance(0)}><p>Confirm you have been pain-free for a full week and the next phase is within your surgeon’s instructions.</p><button className="button" onClick={() => { if (advance <= eligible) update(before => ({ ...before, phase:advance }));setAdvance(0) }}>Confirm progression</button></Dialog>}
      </section>
      <section className="panel padded">
        <div className="section-header"><div><h2>Your equipment</h2><p>Base kit: 17 kg dumbbell, bands, bench, wall, foam ball, tennis ball and towel. Tick the extras you own. Exercises that need gear you don’t have stay hidden.</p></div><Package size={22}/></div>
        <div className="equipment-list">{optionalEquipment.map(item => <label key={item} className="checkbox"><input type="checkbox" checked={(state.equipment ?? []).includes(item)} onChange={e => update(before => ({ ...before, equipment: e.target.checked ? [...(before.equipment ?? []), item] : (before.equipment ?? []).filter(owned => owned !== item) }))}/>{{ 'rice bucket': 'Rice bucket', 'hand gripper': 'Hand gripper', 'wrist roller': 'DIY wrist roller (stick, rope, water bottle)', basketball: 'Real basketball', putty: 'Therapy putty' }[item]}</label>)}</div>
      </section>
    </div>}
  </div>
}

function ExerciseForm({ editor, save, close, state, level }: { editor: Editor; state: State; level: number; save(item: Exercise): void; close(): void }) {
  const [draft,setDraft] = useState(editor.item)
  const [query,setQuery] = useState('')
  const [choice,setChoice] = useState('')
  const libraryMatches = useMemo(() => library.filter(item => gateRank(item) <= level && owns(state, item.equipment) && item.name.toLowerCase().includes(query.trim().toLowerCase())),[query,level,state.equipment])
  const selected = libraryMatches.find(item => item.id === choice)
  function apply(event: FormEvent) {
    event.preventDefault()
    if (editor.mode === 'swap') { if (selected) save({ ...selected, id: 'custom-' + crypto.randomUUID(), block:editor.item.block }); return }
    const name = draft.name.trim()
    if (!name || !draft.reps.trim()) return
    save({ ...draft, name, block:draft.block.toUpperCase().trim() })
  }
  const set = <K extends keyof Exercise,>(key: K, value: Exercise[K]) => setDraft(item => ({ ...item, [key]: value }))
  return <Dialog title={editor.mode === 'swap' ? 'Swap exercise' : editor.mode === 'new' ? 'Add exercise' : 'Edit exercise'} close={close} drawer>
    <form className="form-grid two-fields" onSubmit={apply}>
      {editor.mode === 'swap' ? <>
        <label className="field wide">Search curriculum<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by exercise name"/></label>
        <label className="field wide">Replacement<select value={choice} onChange={e => setChoice(e.target.value)} required><option value="">Choose an exercise</option>{libraryMatches.map(item => <option key={item.id} value={item.id}>{item.name} · {item.category}</option>)}</select></label>
      </> : <>
        <label className="field wide">Name<input value={draft.name} maxLength={90} required onChange={e => set('name',e.target.value)}/></label>
        <label className="field">Category<select value={draft.category} onChange={e => set('category',e.target.value as Category)}>{categories.slice(0,-1).map(item => <option key={item}>{item}</option>)}</select></label>
        <label className="field">Block<input value={draft.block} maxLength={3} pattern="[A-Za-z][0-9]{0,2}" placeholder="A1" onChange={e => set('block',e.target.value)}/></label>
        <label className="field">Sets<input type="number" min="1" max="30" required value={draft.sets || ''} onChange={e => set('sets',Number(e.target.value))}/></label>
        <label className="field">Reps / dose<input value={draft.reps} maxLength={40} required onChange={e => set('reps',e.target.value)}/></label>
        <label className="field">Tempo<input value={draft.tempo} pattern="[0-9]{1,2}-[0-9]{1,2}-[0-9]{1,2}" placeholder="3-1-1" onChange={e => set('tempo',e.target.value)}/></label>
        <label className="field">Rest (seconds)<input type="number" min="0" max="1800" value={draft.rest} onChange={e => set('rest',Number(e.target.value))}/></label>
        <label className="field">Work interval (seconds)<input type="number" min="0" max="3600" value={draft.seconds ?? ''} onChange={e => set('seconds',Number(e.target.value) || undefined)}/></label>
        <label className="field">Load<input value={draft.load} maxLength={90} required onChange={e => set('load',e.target.value)}/></label>
        <label className="field wide">Execution cues<textarea rows={3} value={draft.cue} required onChange={e => set('cue',e.target.value)}/></label>
        <label className="field wide">Common mistakes<textarea rows={2} value={draft.mistake ?? ''} onChange={e => set('mistake',e.target.value)}/></label>
        <label className="checkbox wide"><input type="checkbox" checked={Boolean(draft.flag)} onChange={e => set('flag',e.target.checked)}/> Flag forearm load</label>
      </>}
      <button className="button" type="submit"><Check size={17}/>Save exercise</button>
    </form>
  </Dialog>
}
