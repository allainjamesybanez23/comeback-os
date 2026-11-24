import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { circuit, circuitRows, cooldown, dailyMobility, days, expansion, foamRows, phases, rehabRows, sundayFlow, sundayMobility, warmUp } from '../src/data/comebackProgram'
import { motionFor } from '../src/anim/motions'
import { activePhase, blockedReason, clearanceEarliest, eligiblePhase, formatDuration, fresh, loadKg, sessionTimes, plusDays, prescribed, programSections, queueFor, recoveryReasons, scheduleConflicts, sessionDone, statsFor, targetReps, weightTrend, weekFor, workSeconds, type State } from '../src/model'
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
  assert.equal(programSections(fresh,'2026-11-23','foam','2026-11-23')[0].rows.length,foamRows.length)
  assert.equal(programSections({...fresh, clarity:clearanceEarliest, phase:1},'2027-01-01','foam','2027-01-01').length,2)
  assert.equal(blockedReason(phases[2].rows[0],{},0),'Surgeon clearance phase is required.')
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

const everything = [...days.flatMap(day => day.main), ...warmUp, ...rehabRows, ...dailyMobility, ...sundayMobility, ...cooldown, ...foamRows, ...circuit, ...expansion, ...phases.flatMap(phase => phase.rows)]

test('no exercise needs a door, door anchor or pull-up bar', () => {
  for (const item of everything) {
    const text = [item.name, item.cue, item.mistake, item.load].join(' ')
    assert.doesNotMatch(text, /door|pull-?ups?|dead hang|\bhanging\b|high anchor|anchor point|anchored/i, item.name)
  }
})

test('workout, stretching, forearm rehab and ball handling are separate sessions', () => {
  const key = '2026-11-23'
  assert.deepEqual(programSections(fresh, key, 'workout', key).map(section => section.id), ['warm', 'main', 'cooldown'])
  assert.deepEqual(programSections(fresh, '2026-11-28', 'workout', '2026-11-28').map(section => section.id), ['warm', 'main', 'circuit', 'finisher', 'cooldown'])
  const workout = programSections(fresh, key, 'workout', key).flatMap(section => section.rows)
  assert.ok(workout.every(item => item.category !== 'Forearm Rehab'))
  assert.deepEqual(programSections(fresh, key, 'rehab', key)[0].rows, rehabRows)
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
