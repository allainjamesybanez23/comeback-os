import { useEffect, useRef, useState } from 'react'
import { Bell, BellRing, Send, X } from 'lucide-react'
import { days } from '../data/comebackProgram'
import { dateKey, dayFor, defaultReminders, dueReminders, sessionDone, type Module, type Reminder, type ReminderTarget, type State } from '../model'
import type { Update } from '../store'
import { Dialog } from './ui'

const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const dayFull = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const isModule = (target: ReminderTarget): target is Module => ['workout', 'mobility', 'rehab', 'foam'].includes(target)

function message(reminder: Reminder, state: State, today: string) {
  const plan = days[dayFor(state, today)]
  const body: Record<ReminderTarget, string> = {
    workout: `${plan.title} is on today. Warm up, then attack the main work.`,
    rehab: 'A few calm minutes for your forearm. Every rep moves the comeback forward.',
    mobility: 'Ten minutes of stretching keeps hips and ankles ready to jump.',
    foam: 'Silent left-hand handles. Make the off hand a weapon.',
    checkin: 'Log sleep, weight and how the forearm feels this morning.',
    bed: 'Screens down soon. Sleep is when the muscle and bone repair happens.',
  }
  return { title: reminder.label, body: body[reminder.target] }
}

export type Toast = { id: number; title: string; body: string; target: ReminderTarget }
function send(title: string, body: string, target: ReminderTarget, toast: (t: Omit<Toast, 'id'>) => void) {
  if (window.desktop?.notify) { window.desktop.notify(title, body, target); return }
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') { new Notification(title, { body }); return }
  toast({ title, body, target })
}

/* Checks the reminder list every 20 seconds while the app is open (or in the tray). */
export function useReminders(state: State, update: Update, open: (target: ReminderTarget) => void) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const latest = useRef({ state, open })
  latest.current = { state, open }
  const toast = (t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random()
    setToasts(list => [...list.slice(-2), { ...t, id }])
    window.setTimeout(() => setToasts(list => list.filter(x => x.id !== id)), 15000)
  }
  useEffect(() => {
    const tick = () => {
      const current = latest.current.state
      const now = new Date()
      const today = dateKey(now)
      const due = dueReminders(current, now)
      if (!due.length) return
      update(before => ({ ...before, reminderLog: { ...before.reminderLog, ...Object.fromEntries(due.map(r => [r.id, today])) } }))
      for (const reminder of due) {
        if (isModule(reminder.target) && sessionDone(current.logs[today], reminder.target)) continue
        const { title, body } = message(reminder, current, today)
        send(title, body, reminder.target, toast)
      }
    }
    tick()
    const interval = window.setInterval(tick, 20000)
    const off = window.desktop?.onReminderOpen?.(target => latest.current.open(target as ReminderTarget))
    return () => { clearInterval(interval); off?.() }
  }, [])
  useEffect(() => {
    const prefs = state.reminderPrefs
    window.desktop?.setBackground?.(Boolean(prefs?.background))
    window.desktop?.setLaunchAtLogin?.(Boolean(prefs?.background && prefs?.login))
  }, [state.reminderPrefs?.background, state.reminderPrefs?.login])
  const toastView = toasts.length > 0 && <div className="toasts" role="status">{toasts.map(t => <div key={t.id} className="toast">
    <BellRing size={18}/>
    <button className="toast-body" onClick={() => { setToasts(list => list.filter(x => x.id !== t.id)); latest.current.open(t.target) }}><strong>{t.title}</strong><span>{t.body}</span></button>
    <button className="icon-btn ghost" aria-label="Dismiss" onClick={() => setToasts(list => list.filter(x => x.id !== t.id))}><X size={16}/></button>
  </div>)}</div>
  return { toastView, test: (reminder: Reminder) => { const { title, body } = message(reminder, latest.current.state, dateKey(new Date())); send(title, body, reminder.target, toast) } }
}

export function RemindersDialog({ state, update, close, test }: { state: State; update: Update; close(): void; test(reminder: Reminder): void }) {
  const list = state.reminders ?? defaultReminders
  const prefs = state.reminderPrefs ?? { background: false, login: false }
  const desktop = Boolean(window.desktop?.notify)
  const anyOn = list.some(r => r.on)
  const [permission, setPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'denied')
  const save = (next: Reminder[]) => update(before => ({ ...before, reminders: next }))
  const change = (id: string, patch: Partial<Reminder>) => save(list.map(r => r.id === id ? { ...r, ...patch } : r))
  return <Dialog title="Reminders" close={close} wide>
    <p>Desktop notifications at the times you choose. A session reminder is skipped if you already finished that session today.</p>
    <ul className="reminder-list">{list.map(r => <li key={r.id} className={r.on ? 'on' : ''}>
      <label className="switch"><input type="checkbox" role="switch" checked={r.on} onChange={e => change(r.id, { on: e.target.checked })}/><span aria-hidden="true"/><strong>{r.label}</strong></label>
      <input className="time-input mono" type="time" value={r.time} aria-label={r.label + ' time'} onChange={e => { if (e.target.value) change(r.id, { time: e.target.value }) }}/>
      <div className="day-chips" role="group" aria-label={r.label + ' days'}>{dayNames.map((name, i) => <button key={i} type="button" className={r.days.includes(i) ? 'selected' : ''} aria-pressed={r.days.includes(i)} aria-label={dayFull[i]} onClick={() => change(r.id, { days: r.days.includes(i) ? r.days.filter(d => d !== i) : [...r.days, i].sort() })}>{name}</button>)}</div>
      <button className="icon-btn" title="Send a test notification" aria-label={'Test ' + r.label} onClick={() => test(r)}><Send size={16}/></button>
    </li>)}</ul>
    {desktop ? <div className="reminder-prefs">
      <label className="checkbox"><input type="checkbox" checked={prefs.background} onChange={e => update(before => ({ ...before, reminderPrefs: { ...prefs, background: e.target.checked } }))}/>Keep running in the system tray when I close the window, so reminders still arrive</label>
      <label className="checkbox"><input type="checkbox" disabled={!prefs.background} checked={prefs.background && prefs.login} onChange={e => update(before => ({ ...before, reminderPrefs: { ...prefs, login: e.target.checked } }))}/>Start Comeback OS hidden in the tray when Windows starts</label>
      {anyOn && !prefs.background && <p className="notice small-note"><Bell size={15}/>Reminders only arrive while the Comeback OS window is open. Turn on the tray option to get them all day.</p>}
    </div> : <div className="reminder-prefs">
      <p className="small-note muted">You are in the browser preview. In the Windows app these are real desktop notifications.</p>
      {permission !== 'granted' && typeof Notification !== 'undefined' && <button className="button subtle" onClick={() => Notification.requestPermission().then(setPermission)}>Allow browser notifications</button>}
    </div>}
    <div className="dialog-actions"><button className="button" onClick={close}>Done</button><button className="button ghost" onClick={() => save(defaultReminders.map(d => ({ ...d, on: list.find(r => r.id === d.id)?.on ?? false })))}>Reset times</button></div>
  </Dialog>
}
