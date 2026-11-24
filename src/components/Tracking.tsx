import { useState, type FormEvent } from 'react'
import { Activity, CalendarDays, Check, ChevronLeft, ChevronRight, Flame, Footprints, HeartPulse, Scale, ShieldCheck } from 'lucide-react'
import { dateLabel, distance, formatDuration, monday, moduleLabel, moduleOrder, plusDays, recoveryReasons, startDate, statsFor, weightTrend, type Benchmark, type Check as CheckIn, type Module, type State, type Status } from '../model'
import type { Update } from '../store'
import { Dialog, Empty } from './ui'

const statusLabels: Record<Status, string> = { full: 'Full workout', recovery: 'Recovery / rehab', skipped: 'Skipped' }
const reasons = ['Fatigue', 'Soreness >3/10', 'Travel / schedule']
type TrackerProps = { state: State; update: Update; today: string }
const totalTime = (log: State['logs'][string] | undefined) => Object.values(log?.time ?? {}).reduce((sum, value) => sum + (value ?? 0), 0)

export function Stats({ state, today }: Pick<TrackerProps, 'state' | 'today'>) {
  const metrics = statsFor(state,today)
  return <dl className="stats-board">
    {[
      [Flame, metrics.streak, 'Current streak', ' days'],
      [Activity, metrics.longest, 'Longest streak', ' days'],
      [HeartPulse, metrics.rehab, 'Rehab compliance', '%'],
      [Footprints, metrics.contacts, 'Contacts this week', ''],
    ].map(([Icon, value, label, unit]) => {
      const Glyph = Icon as typeof Flame
      return <div className="metric" key={String(label)}><dt><Glyph size={16}/>{String(label)}</dt><dd className="mono">{String(value)}<small>{String(unit)}</small></dd></div>
    })}
  </dl>
}
export function Calendar({ state, update, today, stats = true }: TrackerProps & { stats?: boolean }) {
  const [view, setView] = useState<'month' | 'year'>('month')
  const [cursor, setCursor] = useState(today.slice(0,7))
  const [selected, setSelected] = useState('')
  const [status, setStatus] = useState<Status | ''>('')
  const [reason, setReason] = useState('')
  const [rehab, setRehab] = useState(false)
  const [contacts, setContacts] = useState('')
  const [minutes, setMinutes] = useState<Record<Module, string>>({ workout: '', mobility: '', rehab: '', foam: '' })
  const [loadedMinutes, setLoadedMinutes] = useState<Record<Module, string>>({ workout: '', mobility: '', rehab: '', foam: '' })
  const year = Number(cursor.slice(0,4))
  const month = Number(cursor.slice(5,7))
  const first = cursor + '-01'
  const gridStart = monday(first)
  const monthDays = new Date(year,month,0).getDate()
  const rows = Math.ceil((distance(gridStart,first) + monthDays) / 7)
  const yearFirst = year + '-01-01'
  const yearStart = monday(yearFirst)
  const yearCells = Math.ceil((distance(yearStart,year + '-12-31') + 1) / 7) * 7
  const short = { month: 'short', day: 'numeric' } as const
  function move(dir: number) {
    const date = new Date(year + (view === 'year' ? dir : 0), month - 1 + (view === 'month' ? dir : 0), 1)
    setCursor(date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2,'0'))
  }
  function select(key: string) {
    const log = state.logs[key]
    setSelected(key)
    setStatus(log?.status ?? '')
    setReason(log?.reason ?? '')
    setRehab(log?.rehab ?? false)
    setContacts(log?.contacts === undefined ? '' : String(log.contacts))
    const loaded = Object.fromEntries(moduleOrder.map(m => [m, log?.time?.[m] ? String(Math.round(log.time[m]! / 60)) : ''])) as Record<Module, string>
    setMinutes(loaded)
    setLoadedMinutes(loaded)
  }
  function save(event: FormEvent) {
    event.preventDefault()
    update(before => {
      const time = { ...before.logs[selected]?.time }
      for (const m of moduleOrder) {
        if (minutes[m] === loadedMinutes[m]) continue
        const value = Number(minutes[m])
        if (minutes[m] === '' || !Number.isFinite(value) || value <= 0) delete time[m]
        else time[m] = Math.round(value * 60)
      }
      return { ...before, logs: { ...before.logs, [selected]: {
        ...before.logs[selected], status: status || undefined, reason: status === 'skipped' ? reason || undefined : undefined,
        rehab, contacts: contacts === '' ? undefined : Number(contacts), time,
      } } }
    })
    setSelected('')
  }
  function cell(key: string, valid: boolean, annual: boolean) {
    if (!valid) return <div key={key} className="calendar-blank" aria-hidden="true"/>
    const log = state.logs[key]
    const status = log?.status ?? (log?.rehab ? 'recovery' : '')
    const label = status ? statusLabels[status] : 'No day status'
    return <button key={key} type="button" className={`calendar-cell ${status} ${key === today ? 'today' : ''}`}
      disabled={key > today} title={dateLabel(key,short) + ' · ' + label} aria-label={dateLabel(key,{dateStyle:'full'}) + ': ' + label} onClick={() => select(key)}>
      {!annual && <><span className="mono">{Number(key.slice(-2))}</span>{status && <span className="cell-status">{label}</span>}{totalTime(log) > 0 && <span className="cell-time mono">{formatDuration(totalTime(log))}</span>}</>}
    </button>
  }
  return <div className="page-content">
    {stats && <Stats state={state} today={today}/>}
    <section className="panel calendar">
      <div className="panel-header"><div><h2>{view === 'month' ? dateLabel(first,{month:'long',year:'numeric'}) : year}</h2><p>Training and recovery history</p></div><div className="compact-actions">
        <div className="segmented"><button className={view === 'month' ? 'selected' : ''} aria-pressed={view === 'month'} onClick={() => setView('month')}>Month</button><button className={view === 'year' ? 'selected' : ''} aria-pressed={view === 'year'} onClick={() => setView('year')}>Year</button></div>
        <button className="icon-btn" aria-label="Previous period" onClick={() => move(-1)}><ChevronLeft size={19}/></button><button className="icon-btn" aria-label="Next period" onClick={() => move(1)}><ChevronRight size={19}/></button>
      </div></div>
      {view === 'month' ? <div className="month-grid">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(name => <div className="day-name" key={name}>{name}</div>)}
        {Array.from({length:rows*7},(_,i) => { const key = plusDays(gridStart,i); return cell(key,key.startsWith(cursor),false) })}
      </div> : <div className="year-wrap"><div className="year-months">{Array.from({length:12},(_,i) => {
        const key = year + '-' + String(i+1).padStart(2,'0') + '-01'
        return <span key={key} style={{gridColumn:Math.floor(distance(yearStart,key)/7)+1}}>{dateLabel(key,{month:'short'})}</span>
      })}</div><div className="year-grid">{Array.from({length:yearCells},(_,i) => { const key = plusDays(yearStart,i); return cell(key,key.startsWith(String(year)),true) })}</div></div>}
      <div className="calendar-legend">{Object.entries(statusLabels).map(([key,label]) => <span key={key}><i className={key}/>{label}</span>)}<span><i/>Unlogged</span></div>
    </section>
    <p className="muted">Streaks count consecutive full or recovery days. Rehab compliance is measured against program days since {dateLabel(startDate,short)}. Foot contacts include set logs and any extra contacts entered on a day.</p>
    {selected && <Dialog title={dateLabel(selected,{dateStyle:'full'})} close={() => setSelected('')}>
      <form onSubmit={save} className="form-grid">
        <label className="field">Day status<select value={status} onChange={e => setStatus(e.target.value as Status | '')}><option value="">Unlogged</option>{Object.entries(statusLabels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        {status === 'skipped' && <label className="field">Skip reason<select value={reason} onChange={e => setReason(e.target.value)}><option value="">Optional</option>{reasons.map(item => <option key={item}>{item}</option>)}</select></label>}
        <label className="field">Extra plyo foot contacts<input type="number" min="0" max="9999" step="1" value={contacts} onChange={e => setContacts(e.target.value)}/></label>
        <label className="checkbox"><input type="checkbox" checked={rehab} onChange={e => setRehab(e.target.checked)}/> Forearm rehab completed</label>
        <fieldset className="minutes-fieldset"><legend>Session time (minutes)</legend>
          {moduleOrder.map(m => <label className="field" key={m}>{moduleLabel[m]}<span className="unit-input"><input type="number" min="0" max="600" step="1" value={minutes[m]} onChange={e => setMinutes(value => ({ ...value, [m]: e.target.value }))}/><span>min</span></span></label>)}
        </fieldset>
        <button type="submit" className="button"><Check size={17}/>Save day</button>
      </form>
    </Dialog>}
  </div>
}

const fields: [keyof CheckIn, string, string, number, number, number][] = [
  ['kcal','Calories','kcal',0,10000,1], ['protein','Protein','g',0,500,1],
  ['water','Water','L',0,15,.1], ['sleep','Sleep','h',0,24,.1],
  ['weight','Morning weight','kg',30,300,.1], ['hr','Resting heart rate','bpm',25,220,1],
  ['soreness','Soreness duration','h',0,999,1],
]
export function CheckInForm({ state, update, today }: TrackerProps) {
  const [key, setKey] = useState(today)
  return <DailyFields key={key} keyDate={key} setDate={setKey} state={state} update={update} today={today}/>
}
function DailyFields({ state, update, today, keyDate, setDate }: TrackerProps & {keyDate: string; setDate(key: string): void}) {
  const log = state.logs[keyDate]?.check ?? {}
  const [values, setValues] = useState<CheckIn>(log)
  const [baseline, setBaseline] = useState<number | undefined>(state.hrBaseline)
  const [saved, setSaved] = useState(false)
  const trend = weightTrend(state,today)
  const reasons = recoveryReasons(state,keyDate)
  function save(event: FormEvent) {
    event.preventDefault()
    update(before => ({ ...before, hrBaseline:baseline, logs: { ...before.logs, [keyDate]: { ...before.logs[keyDate], check: values } } }))
    setSaved(true)
  }
  return <div className="page-content">
    <div className="tracking-grid">
      <section className="panel padded">
        <div className="section-header"><div><h2>Daily check-in</h2><p>Nutrition, sleep and morning readiness</p></div><HeartPulse size={22}/></div>
        <label className="field date-field">Log date<input type="date" value={keyDate} min={startDate} max={today} onChange={e => { if (e.target.value && e.target.value <= today && e.target.value >= startDate) setDate(e.target.value) }}/></label>
        <form className="form-grid two-fields" onSubmit={save}>
          {fields.map(([key,label,unit,min,max,step]) => <label className="field" key={key}>{label}<span className="unit-input"><input name={key} type="number" min={min} max={max} step={step} value={values[key] ?? ''} onChange={e => { setSaved(false); setValues({ ...values, [key]: e.target.value === '' ? undefined : Number(e.target.value) }) }}/><span>{unit}</span></span></label>)}
          <label className="field">Resting HR baseline<span className="unit-input"><input type="number" min="25" max="220" step="1" value={baseline ?? ''} onChange={e => { setSaved(false); setBaseline(e.target.value ? Number(e.target.value) : undefined) }}/><span>bpm</span></span></label>
          <div className="form-footer"><button className="button" type="submit"><Check size={17}/>Save check-in</button>{saved && <span role="status">Saved locally</span>}</div>
        </form>
        {reasons.length > 0 && <div className={'notice ' + ((state.logs[keyDate]?.pain ?? 0) >= 3 ? 'alert' : '')}><ShieldCheck size={18}/><div><strong>Recovery flag</strong><br/>{reasons.join(' · ')}</div></div>}
      </section>
      <section className="panel padded">
        <div className="section-header"><div><h2>Lean bulk</h2><p>73 kg baseline · +0.25–0.35 kg per week</p></div><Scale size={22}/></div>
        <dl className="target-list">{[['Energy','3,100–3,300 kcal'],['Protein','130–150 g'],['Water','3 L'],['Sleep','8–9 h']].map(([label,value]) => <div key={label}><dt>{label}</dt><dd className="mono">{value}</dd></div>)}</dl>
        <h3>Weekly weigh-ins</h3><p>Log three morning weights per week, after the toilet and before eating.</p>
        <div className="weight-weeks">{trend.weeks.map(week => <div key={week.start}><span>{dateLabel(week.start,{month:'short',day:'numeric'})}</span><strong className="mono">{week.average === undefined ? '—' : week.average.toFixed(1) + ' kg'}</strong><small>{week.count}/3 weigh-ins</small></div>)}</div>
        {trend.delta !== undefined && <p>Latest change <strong className="mono">{trend.delta > 0 ? '+' : ''}{trend.delta.toFixed(2)} kg</strong></p>}
        {trend.advice && <div className="notice" role="status">{trend.advice}</div>}
        {trend.delta === undefined && <Empty>Weekly comparisons appear once two weeks have three weigh-ins each.</Empty>}
      </section>
    </div>
    <BenchmarkForm state={state} update={update} today={today}/>
  </div>
}

const measures: [keyof Omit<Benchmark,'toes'>,string,string,number][] = [
  ['ankleL','Left knee-to-wall','cm',10], ['ankleR','Right knee-to-wall','cm',10],
  ['squat','Deep squat hold','s',60], ['hipL','Left 90/90 upright','s',30], ['hipR','Right 90/90 upright','s',30],
]
function BenchmarkForm({ state, update, today }: TrackerProps) {
  const [period,setPeriod] = useState(today.slice(0,7))
  const [saved,setSaved] = useState(false)
  const data = state.benchmarks[period] ?? {}
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const result: Benchmark = { toes: values.get('toes') === 'on' }
    for (const [key] of measures) {
      const value = values.get(key)
      if (value !== '') result[key] = Number(value)
    }
    update(before => ({ ...before, benchmarks: { ...before.benchmarks, [period]: result } }))
    setSaved(true)
  }
  return <section className="panel padded">
    <div className="section-header"><div><h2>Mobility benchmarks</h2><p>Save a baseline for each month and revisit it as your range improves.</p></div><CalendarDays size={22}/></div>
    <label className="field date-field">Month<input type="month" value={period} max={today.slice(0,7)} onChange={e => { if (e.target.value && e.target.value <= today.slice(0,7)) { setPeriod(e.target.value); setSaved(false) } }}/></label>
    <form className="benchmark-form form-grid" key={period} onSubmit={save} onChange={() => setSaved(false)}>
      {measures.map(([key,label,unit,target]) => <label className="field" key={key}>{label}<span className="unit-input"><input name={key} type="number" min="0" max="600" step={unit === 'cm' ? .1 : 1} defaultValue={data[key]}/><span>{unit}</span></span><small>Goal ≥{target} {unit}{(data[key] ?? -1) >= target && ' · Met'}</small></label>)}
      <label className="checkbox"><input name="toes" type="checkbox" defaultChecked={data.toes}/> Fingertips reach toes</label>
      <div className="form-footer"><button className="button" type="submit"><Check size={17}/>Save benchmark</button>{saved && <span role="status">Saved locally</span>}</div>
    </form>
  </section>
}
