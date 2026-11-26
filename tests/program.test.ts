import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { circuit, circuitRows, cooldown, dailyMobility, days, expansion, foamRows, gripDrills, handleDrills, leftHandles, phases, rehabRows, sundayFlow, sundayMobility, warmUp, type Exercise } from '../src/data/comebackProgram'
import { motionFor } from '../src/anim/motions'
import { benefits } from '../src/data/benefits'
import { activePhase, blockedReason, calendarWeek, clearanceEarliest, editKey, gateLevel, migrate, stepSeconds, timerPlan, defaultReminders, dueReminders, eligiblePhase, exerciseSeries, formatDuration, weekTotals, fresh, loadKg, sessionTimes, plusDays, prescribed, programSections, queueFor, recoveryReasons, scheduleConflicts, sessionDone, statsFor, targetReps, weightTrend, weekFor, workSeconds, type State } from '../src/model'
import { tempoTicks } from '../src/audio'

test('launch falls in Week 3 and progression changes squat, plyos and Saturday intervals', () => {
  assert.equal(weekFor(fresh,'2026-11-23'),3)
  assert.equal(prescribed(0,3)[0].tempo,'4-1-1')
  assert.equal(prescribed(3,3)[0].tempo,'4-1-1')
  assert.equal(prescribed(2,3).find(item => item.block === 'B2')?.sets,4)
  assert.equal(circuitRows(3).length,20)
  assert.equal(circuitRows(3)[4].rest,75)
  assert.equal(circuitRows(7).length,30)
  assert.equal(circuitRows(8)[0].seconds,30)
})

test('paired blocks alternate and rest once per round, including uneven groups', () => {
  const queue = queueFor([{id:'main',name:'Main work',rows:days[0].main}])
  assert.deepEqual(queue.slice(0,4).map(set => [set.item.block,set.round,set.rest]), [
    ['A1',1,0],['A2',1,90],['A1',2,0],['A2',2,90]
  ])
  const uneven = queueFor([{id:'main',name:'Main work',rows:[{...days[2].main[3],sets:4},days[2].main[4],days[2].main[5]]}])
  assert.equal(uneven.at(-1)?.item.block,'B1')
  assert.equal(uneven.at(-1)?.rest,60)
  assert.equal(tempoTicks('3-1-1').map(tick => tick.phase).join(','),'Lower,Lower,Lower,Pause,Drive')
  assert.equal(workSeconds(days[2].main[1]),20)
})

test('phase access requires clearance and elapsed progression time', () => {
  assert.equal(eligiblePhase('2026-12-31','2027-03-01'),0)
  assert.equal(eligiblePhase(clearanceEarliest,'2026-12-31'),0)
  assert.equal(eligiblePhase(clearanceEarliest,'2027-01-14'),1)
  assert.equal(eligiblePhase(clearanceEarliest,'2027-01-15'),2)
  assert.equal(activePhase({...fresh, clarity:clearanceEarliest, phase:4},'2027-01-15'),2)
  assert.equal(programSections(fresh,'2026-11-23','foam','2026-11-23')[0].rows.length,leftHandles.length)
  assert.deepEqual(programSections({...fresh, clarity:clearanceEarliest, phase:1},'2027-01-01','foam','2027-01-01').map(s => s.id),['foam','foam-right','foam-expansion'])
  assert.equal(blockedReason(phases[2].rows[0],{},0),'Locked until surgeon clearance phase 2.')
  assert.match(blockedReason(days[0].main[0],{pain:3},0),/Stop/)
  assert.match(blockedReason(days[0].main[0],{pain:0,stopped:[days[0].main[0].id]},0),/stopped/)
  assert.match(blockedReason(days[1].main[4],{pain:1},0),/zero/)
  assert.match(blockedReason({...days[0].main[0],load:'17 kg right'}, {},0),/left hand only/)
})

test('schedule conflict and deload use the real date-based prescription', () => {
  assert.deepEqual(scheduleConflicts(fresh,'2026-11-26')[0],['2026-11-25','2026-11-26'])
  const deload = programSections({...fresh,deload:'2026-11-23'},'2026-11-23','workout','2026-11-23')
  assert.equal(deload.find(section => section.id === 'main')?.rows[0].sets,3)
  const logState = {...fresh, hrBaseline:54, logs:{'2026-11-23':{pain:3,check:{hr:59,soreness:73}}}}
  assert.equal(recoveryReasons(logState,'2026-11-23').length,3)
})

test('stats and weight trend use stored logs, not planned sets', () => {
  const today = '2026-11-25'
  const state: State = {...fresh, logs:{
    '2026-11-23':{status:'full', rehab:true, sets:{'mon-A2:1':{contacts:10}}},
    '2026-11-24':{status:'recovery', rehab:true, contacts:6},
  }}
  assert.deepEqual(statsFor(state,today),{streak:2,longest:2,rehab:12,contacts:16})
  for (const [i, start] of ['2026-11-09','2026-11-16','2026-11-23'].entries()) {
    for (let d=0; d<3; d++) state.logs[plusDays(start,d)] = {check:{weight:73 + i * .55}}
  }
  assert.match(weightTrend(state,today).advice,/−200/)
  state.logs['2026-11-25'] = {check:{weight:73}}
  assert.equal(weightTrend(state,today).advice,'')
})

const everything = [...days.flatMap(day => day.main), ...warmUp, ...rehabRows, ...dailyMobility, ...sundayMobility, ...cooldown, ...foamRows, ...circuit, ...expansion, ...handleDrills, ...gripDrills, ...phases.flatMap(phase => phase.rows)]

test('no exercise needs a door, door anchor or pull-up bar', () => {
  for (const item of everything) {
    const text = [item.name, item.cue, item.mistake, item.load].join(' ')
    assert.doesNotMatch(text, /door|pull-?ups?|dead hang|\bhanging\b|high anchor|anchor point|anchored/i, item.name)
  }
})

test('workout, stretching, forearm rehab and ball handling are separate sessions', () => {
  const key = '2026-11-23'
  assert.deepEqual(programSections(fresh, key, 'workout', key).map(section => section.id), ['warm', 'main', 'grip', 'cooldown'])
  assert.deepEqual(programSections(fresh, '2026-11-24', 'workout', '2026-11-24').map(section => section.id), ['warm', 'main', 'cooldown'])
  assert.deepEqual(programSections(fresh, '2026-11-28', 'workout', '2026-11-28').map(section => section.id), ['warm', 'main', 'circuit', 'finisher', 'cooldown'])
  const workout = programSections(fresh, key, 'workout', key).flatMap(section => section.rows)
  assert.ok(workout.every(item => item.category !== 'Forearm Rehab'))
  assert.deepEqual(programSections(fresh, key, 'rehab', key)[0].rows, rehabRows.filter(row => row.gate !== 'light' && !row.equipment?.includes('putty')))
  assert.deepEqual(programSections(fresh, key, 'mobility', key)[0].rows, dailyMobility)
  assert.equal(programSections(fresh, '2026-11-29', 'mobility', '2026-11-29')[0].rows.length, sundayFlow.length)
  assert.equal(sundayFlow.length, dailyMobility.length + sundayMobility.length)
  assert.ok(sessionDone({ done: { mobility: true } }, 'mobility'))
  assert.ok(sessionDone({ rehab: true }, 'rehab'))
})

test('superset blocks keep the same set count every week so rounds stay clean', () => {
  for (let week = 1; week <= 8; week++) for (let day = 0; day < 7; day++) {
    const groups = new Map<string, number[]>()
    for (const item of prescribed(day, week)) {
      const letter = /^([A-Z])\d+$/.exec(item.block)?.[1]
      if (letter) groups.set(letter, [...(groups.get(letter) ?? []), item.sets])
    }
    for (const [letter, sets] of groups) assert.equal(new Set(sets).size, 1, `week ${week} day ${day} block ${letter}: ${sets}`)
  }
})

test('every movement has an animated guide', () => {
  const missing = [...new Set(everything.map(item => item.move))].filter(move => move !== 'plan' && !motionFor(move))
  assert.deepEqual(missing, [])
})

test('rep and load parsing for set logging', () => {
  assert.equal(targetReps('10'), 10)
  assert.equal(targetReps('8 / leg'), 8)
  assert.equal(targetReps('30 s / leg'), undefined)
  assert.equal(targetReps('10 × 3 s'), 10)
  assert.equal(loadKg('17 kg · left hand only'), 17)
  assert.equal(loadKg('5–10 kg or band'), undefined)
  assert.equal(loadKg('Light band'), undefined)
})

test('session times are listed per day and formatted in minutes and hours', () => {
  const state: State = {...fresh, logs:{
    '2026-11-23':{time:{workout:3125, rehab:640}},
    '2026-11-24':{time:{mobility:700}},
    '2026-11-30':{time:{workout:100}},
  }}
  const list = sessionTimes(state, '2026-11-24')
  assert.deepEqual(list.map(entry => [entry.date, entry.module, entry.seconds]), [
    ['2026-11-24','mobility',700], ['2026-11-23','workout',3125], ['2026-11-23','rehab',640],
  ])
  assert.equal(formatDuration(3125), '52 min')
  assert.equal(formatDuration(4500), '1 h 15 min')
  assert.equal(formatDuration(20), '<1 min')
})

test('every exercise explains why it helps for basketball, body or forearm', () => {
  const missing = [...new Set(everything.map(item => item.name))].filter(name => !benefits[name])
  assert.deepEqual(missing, [])
  const names = new Set(everything.map(item => item.name))
  assert.deepEqual(Object.keys(benefits).filter(name => !names.has(name)), [], 'benefits for exercises that no longer exist')
  for (const [name, benefit] of Object.entries(benefits)) {
    assert.ok(benefit.tags.length > 0 && benefit.why.length > 30, name)
  }
})

test('reminders fire once, inside an hour after their time, on chosen days', () => {
  const on = defaultReminders.map(r => r.id === 'rehab' ? { ...r, on: true } : r)
  const state: State = { ...fresh, reminders: on }
  const at = (h: number, m: number) => new Date(2026, 10, 25, h, m)
  assert.deepEqual(dueReminders(state, at(19, 29)).map(r => r.id), [])
  assert.deepEqual(dueReminders(state, at(19, 30)).map(r => r.id), ['rehab'])
  assert.deepEqual(dueReminders(state, at(20, 31)).map(r => r.id), [])
  assert.deepEqual(dueReminders({ ...state, reminderLog: { rehab: '2026-11-25' } }, at(19, 45)).map(r => r.id), [])
  const checkin = defaultReminders.map(r => r.id === 'checkin' ? { ...r, on: true } : r)
  assert.deepEqual(dueReminders({ ...fresh, reminders: checkin }, at(7, 40)).map(r => r.id), ['checkin'])
  assert.deepEqual(dueReminders({ ...fresh, reminders: checkin }, new Date(2026, 10, 24, 7, 40)).map(r => r.id), [])
})

test('strength series and weekly totals come from logged sets', () => {
  const state: State = { ...fresh, logs: {
    '2026-11-23': { sets: { 'mon-A1:1': { contacts: 0, reps: 10, kg: 17 }, 'mon-A1:2': { contacts: 0, reps: 9, kg: 17 }, 'mon-A2:1': { contacts: 10 } }, time: { workout: 3000 } },
    '2026-11-30': { sets: { 'mon-A1:1': { contacts: 0, reps: 12, kg: 17 } } },
  } }
  const series = exerciseSeries(state, 'mon-A1')
  assert.deepEqual(series.map(p => [p.date, p.totalReps, p.best, p.volume]), [['2026-11-23', 19, 10, 323], ['2026-11-30', 12, 12, 204]])
  const week = weekTotals(state, '2026-11-23')
  assert.deepEqual([week.sets, week.reps, week.volume, week.seconds, week.contacts], [3, 19, 323, 3000, 10])
})

const named = (name: string) => everything.find(item => item.name === name)!
const rows = (state: State, key: string, module: 'workout' | 'rehab' | 'foam') => programSections(state, key, module, key).flatMap(section => section.rows)

test('per-side timed sets run as two clocks with a switch, right side first', () => {
  const hold = days[0].main.find(item => item.name === 'Split squat isometric hold')!
  assert.deepEqual(timerPlan(hold).map(part => [part.kind, part.seconds, part.label]), [
    ['ready', 5, 'Get ready'], ['work', 30, 'Right · 1/2'], ['switch', 3, 'Switch sides'], ['work', 30, 'Left · 2/2'],
  ])
  assert.equal(timerPlan(hold)[2].side, 'Left')
  assert.deepEqual(timerPlan(days[3].main.find(item => item.name === 'Wall sit')!).map(part => [part.kind, part.seconds]), [['ready', 5], ['work', 45]])
  const prayer = named('Prayer / reverse-prayer stretch')
  assert.deepEqual(timerPlan(prayer).map(part => part.seconds), [5, 20, 3, 20])
  assert.equal(workSeconds({ ...prayer, seconds: undefined }), 40, 'a stored total and the reps text agree')
  assert.equal(workSeconds({ ...hold, reps: '20 s / hand', seconds: undefined }), 40)
  assert.equal(stepSeconds(hold), 63, 'session estimates include the switch')
  assert.deepEqual(timerPlan({ ...hold, reps: '10', seconds: undefined }), [])
})

test('gates: Phase 0 → light right-hand OK → surgeon phases, and pain rules override them', () => {
  const ladder = named('Right-hand low pound')
  const light: State = { ...fresh, light: { date: '2026-12-10' } }
  assert.equal(gateLevel(fresh, '2026-12-11'), 0)
  assert.equal(gateLevel(light, '2026-12-09'), 0, 'not before the date you entered')
  assert.equal(gateLevel(light, '2026-12-10'), 1)
  assert.equal(gateLevel({ ...light, clarity: clearanceEarliest, phase: 1 }, '2027-01-02'), 2)
  assert.match(blockedReason(ladder, {}, 0), /light right-hand OK/)
  assert.equal(blockedReason(ladder, {}, 1), '')
  assert.match(blockedReason(ladder, { pain: 2 }, 5), /2\/10/)
  assert.match(blockedReason(named('Fingertip floor push-up'), { pain: 1 }, 5), /zero/)
  assert.match(blockedReason(named('Wrist curl · left'), { pain: 3 }, 5), /Stop/)
  assert.equal(blockedReason(named('Wrist curl · left'), {}, 0), '', 'left-arm load is fine in Phase 0')
  assert.match(blockedReason(named('Band wrist extension / flexion'), {}, 0), /light right-hand OK/)
  assert.ok(!programSections(fresh, '2026-12-11', 'foam', '2026-12-11').some(section => section.id === 'foam-right'))
  assert.equal(programSections(light, '2026-12-11', 'foam', '2026-12-11').find(section => section.id === 'foam-right')?.rows[0].name, 'Right-hand low pound')
})

test('equipment you do not have stays hidden', () => {
  const key = '2026-11-23'
  assert.ok(!rows(fresh, key, 'rehab').some(item => item.name === 'Soft putty squeeze'))
  assert.ok(rows({ ...fresh, equipment: ['putty'] }, key, 'rehab').some(item => item.name === 'Soft putty squeeze'))
  const grip = rows(fresh, key, 'workout').filter(item => item.category === 'Grip & Forearm')
  assert.deepEqual(grip.map(item => item.name), ['Wrist curl · left', 'Reverse wrist curl · left', 'Farmer hold · left', 'Fingertip claw ball hold · left'])
  assert.deepEqual(rows(fresh, '2026-11-25', 'workout').filter(item => item.category === 'Grip & Forearm').map(item => item.name), ['Hammer curl · left', 'Leverage pronation / supination · left', 'Farmer hold · left'])
  assert.ok(grip.every(item => (item.gate ?? 'now') === 'now'))
})

test('the coach engine doses from your logs, explains it, and skips days you edited', () => {
  const set = { contacts: 0, reps: 15, target: 15, rpe: 6, pain: 0 }
  const state: State = { ...fresh, logs: {
    '2026-11-23': { sets: { 'x-wrist-curl-left:1': set, 'x-wrist-curl-left:2': set } },
    '2026-11-25': { sets: { 'x-wrist-curl-left:1': set, 'x-wrist-curl-left:2': set } },
  } }
  const curl = rows(state, '2026-11-27', 'workout').find(item => item.id === 'x-wrist-curl-left')!
  assert.equal(curl.reps, '16')
  assert.equal(curl.reason, '15 → 16: hit target twice at RPE 6, no pain')
  assert.equal(rows(fresh, '2026-11-27', 'workout').find(item => item.id === 'x-wrist-curl-left')!.reason, undefined)
  const front = days[0].main[0]
  const logged: State = { ...fresh, logs: { '2026-11-16': { sets: { [front.id + ':1']: { contacts: 0, reps: 14, target: 10, rpe: 6 } } } } }
  assert.notEqual(rows(logged, '2026-11-23', 'workout').find(item => item.id === front.id)!.reps, '10')
  const edited: State = { ...logged, edits: { [editKey(3, 0, 0)]: prescribed(0, 3) } }
  assert.equal(rows(edited, '2026-11-23', 'workout').find(item => item.id === front.id)!.reps, '10')
})

test('old saved data migrates to version 2 and weeks repeat after Week 8', () => {
  const old = { ...fresh, version: 1, edits: { '3/1/0': [{ ...days[1].main[0], minPhase: 2 }] } } as unknown as State
  const next = migrate(old)
  assert.equal(next.version, 2)
  assert.equal(next.edits['3/1/0'][0].gate, 'phase2')
  assert.ok(!('minPhase' in next.edits['3/1/0'][0]))
  assert.equal(migrate(fresh), fresh)
  assert.equal(calendarWeek('2027-01-03'), 8)
  assert.equal(calendarWeek('2027-01-04'), 1)
  assert.equal(calendarWeek('2026-11-01'), 1)
})

test('the desktop app accepts every reminder target', () => {
  const allowed = /const targets = \[([^\]]*)\]/.exec(readFileSync(new URL('../electron/main.cjs', import.meta.url), 'utf8'))![1]
  for (const reminder of defaultReminders) assert.match(allowed, new RegExp(`'${reminder.target}'`), reminder.target)
})

test('every new exercise has a family, gate, side, range and equipment list', () => {
  for (const item of [...handleDrills, ...gripDrills] as Exercise[]) {
    assert.ok(item.family && item.rung && item.gate && item.side && item.range, item.name)
    assert.ok(item.range![0] <= item.range![1], item.name)
  }
  assert.ok(handleDrills.length >= 20 && handleDrills.length <= 30)
})
