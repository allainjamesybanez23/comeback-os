import { useMemo, useState } from 'react'
import { BarChart3, Table2, TrendingUp } from 'lucide-react'
import type { Exercise } from '../data/comebackProgram'
import { dateLabel, exerciseSeries, formatDuration, recentWeeks, trainedExercises, type ProgressPoint, type State } from '../model'
import { library } from '../data/library'
import { ChartTable, ColumnChart, TrendChart, type ChartPoint } from './Charts'

type Metric = 'totalReps' | 'best' | 'volume'
const metricLabel: Record<Metric, string> = { totalReps: 'Total reps', best: 'Best set', volume: 'Volume' }
const metricUnit: Record<Metric, string> = { totalReps: 'reps', best: 'reps', volume: 'kg' }

export function exerciseName(state: State, id: string): Exercise | undefined {
  return library.find(item => item.id === id) ?? Object.values(state.edits).flat().find(item => item.id === id)
}
const short = (date: string) => dateLabel(date, { month: 'short', day: 'numeric' })
function toPoints(series: ProgressPoint[], metric: Metric): ChartPoint[] {
  return series.map(p => ({
    key: p.date, label: short(p.date), value: p[metric],
    detail: `${p.sets} sets · best ${p.best}${p.bestKg ? ' × ' + p.bestKg + ' kg' : ' reps'} · ${p.totalReps} total reps`,
  }))
}
function MetricSwitch({ metric, setMetric, volume }: { metric: Metric; setMetric(m: Metric): void; volume: boolean }) {
  return <div className="segmented" role="group" aria-label="Chart measure">
    {(['totalReps', 'best', ...(volume ? ['volume'] : [])] as Metric[]).map(m => <button key={m} className={metric === m ? 'selected' : ''} aria-pressed={metric === m} onClick={() => setMetric(m)}>{metricLabel[m]}</button>)}
  </div>
}

/* Small progress chart for the exercise guide drawer. */
export function ExerciseProgress({ state, id }: { state: State; id: string }) {
  const series = useMemo(() => exerciseSeries(state, id), [state.logs, id])
  const volume = series.some(p => p.volume > 0)
  const [metric, setMetric] = useState<Metric>(volume ? 'volume' : 'totalReps')
  if (series.length < 2) return <p className="muted small-note">Log this exercise on two different days to see your progress chart.</p>
  return <div className="exercise-progress">
    <MetricSwitch metric={metric} setMetric={setMetric} volume={volume}/>
    <TrendChart points={toPoints(series, metric)} unit={metricUnit[metric]} label={metricLabel[metric] + ' per session'}/>
  </div>
}

/* Progress page section: pick an exercise, read its trend, and see weekly training load. */
export function StrengthPanel({ state, today }: { state: State; today: string }) {
  const trained = useMemo(() => trainedExercises(state).map(entry => ({ ...entry, item: exerciseName(state, entry.id) })).filter(entry => entry.item), [state.logs, state.edits])
  const [id, setId] = useState(trained[0]?.id ?? '')
  const current = trained.find(entry => entry.id === id) ?? trained[0]
  const series = useMemo(() => current ? exerciseSeries(state, current.id) : [], [state.logs, current?.id])
  const volume = series.some(p => p.volume > 0)
  const [metric, setMetric] = useState<Metric>('totalReps')
  const shownMetric = metric === 'volume' && !volume ? 'totalReps' : metric
  const [table, setTable] = useState(false)
  const [weekly, setWeekly] = useState<'sets' | 'minutes' | 'volume'>('sets')
  const weeks = recentWeeks(state, today, 8)
  const weekPoints: ChartPoint[] = weeks.map(w => ({
    key: w.start, label: short(w.start),
    value: weekly === 'sets' ? w.sets : weekly === 'minutes' ? Math.round(w.seconds / 60) : w.volume,
    detail: `${w.sets} sets · ${w.reps} reps · ${formatDuration(w.seconds)}${w.volume ? ' · ' + w.volume.toLocaleString() + ' kg' : ''}`,
  }))
  const points = toPoints(series, shownMetric)
  const first = series[0], last = series[series.length - 1]
  const change = first && last && series.length > 1 ? last[shownMetric] - first[shownMetric] : undefined
  return <section className="panel padded strength-panel">
    <div className="card-heading"><TrendingUp size={18}/><h2>Strength progress</h2><button className="quiet small" onClick={() => setTable(value => !value)} aria-pressed={table}><Table2 size={14}/>{table ? 'Show charts' : 'Show tables'}</button></div>
    <div className="strength-grid">
      <div className="strength-block">
        {trained.length ? <>
          <div className="chart-controls">
            <label className="field compact-field">Exercise<select value={current?.id} onChange={event => setId(event.target.value)}>{trained.map(entry => <option key={entry.id} value={entry.id}>{entry.item!.name} · {entry.sessions} {entry.sessions === 1 ? 'day' : 'days'}</option>)}</select></label>
            <MetricSwitch metric={shownMetric} setMetric={setMetric} volume={volume}/>
          </div>
          <p className="chart-title">{metricLabel[shownMetric]} per session{change !== undefined && <span className={change >= 0 ? 'delta up' : 'delta down'}>{change >= 0 ? '+' : ''}{change.toLocaleString()} {metricUnit[shownMetric]} since {short(first.date)}</span>}</p>
          {series.length < 2 && !table ? <p className="empty">One session logged so far. Log it again on another day to start the trend.</p> :
            table ? <ChartTable points={points} unit={metricUnit[shownMetric]}/> : <TrendChart points={points} unit={metricUnit[shownMetric]} label={(current?.item?.name ?? '') + ' ' + metricLabel[shownMetric]}/>}
        </> : <p className="empty">Log reps in the workout player and your strength trends show up here.</p>}
      </div>
      <div className="strength-block">
        <div className="chart-controls">
          <p className="chart-title"><BarChart3 size={15}/>Weekly training load</p>
          <div className="segmented" role="group" aria-label="Weekly measure">
            {(['sets', 'minutes', 'volume'] as const).map(m => <button key={m} className={weekly === m ? 'selected' : ''} aria-pressed={weekly === m} onClick={() => setWeekly(m)}>{m === 'sets' ? 'Sets' : m === 'minutes' ? 'Minutes' : 'Volume'}</button>)}
          </div>
        </div>
        {table ? <ChartTable points={weekPoints} unit={weekly === 'sets' ? 'sets' : weekly === 'minutes' ? 'min' : 'kg'} columns={['Week of', weekly === 'sets' ? 'Sets' : weekly === 'minutes' ? 'Minutes' : 'Volume']}/> :
          <ColumnChart points={weekPoints} unit={weekly === 'sets' ? 'sets' : weekly === 'minutes' ? 'min' : 'kg'} label={'Weekly ' + weekly}/>}
      </div>
    </div>
  </section>
}
