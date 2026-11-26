import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { learn, plan, readiness, thompson, type Member, type Session } from '../src/engine'

const s = (date: string, id: string, ratio: number, extra: Partial<Session> = {}): Session => ({ date, id, ratio, dose: ratio, pain: 0, ...extra })
const ladder = (nextAllowed = true): Member[] => [
  { id: 'a', name: 'Easy', rung: 1, allowed: true, top: 1.5, right: false },
  { id: 'b', name: 'Hard', rung: 2, allowed: nextAllowed, top: 1.5, right: false, lock: 'the light right-hand OK' },
]
const base = { date: '2026-12-01', slot: 'test', ready: 1 }

test('capacity is a moving average of performance, nudged by RPE', () => {
  const { mean, series } = learn([s('2026-11-01', 'a', 1, { rpe: 8 }), s('2026-11-03', 'a', 1.2, { rpe: 8 })])
  assert.equal(series[0], 1)
  assert.ok(Math.abs(mean - 1.07) < 1e-9)
  assert.ok(learn([s('2026-11-01', 'a', 1, { rpe: 6 })]).mean > learn([s('2026-11-01', 'a', 1, { rpe: 9 })]).mean)
})

test('advances a rung after two sessions above the range at low RPE with no pain', () => {
  const sessions = [s('2026-11-25', 'a', 1.6, { rpe: 6, morning: 0 }), s('2026-11-27', 'a', 1.6, { rpe: 7, morning: 0 })]
  const up = plan({ ...base, members: ladder(), sessions })!
  assert.equal(up.id, 'b')
  assert.equal(up.moved, 'up')
  assert.match(up.why!, /Up to Hard/)
  assert.equal(plan({ ...base, members: ladder(), sessions: sessions.map(x => ({ ...x, rpe: 8 })) })!.id, 'a', 'RPE 8 is not easy enough to advance')
  const locked = plan({ ...base, members: ladder(false), sessions })!
  assert.equal(locked.id, 'a', 'never picks a rung above the gate')
  assert.ok(locked.extraSet)
  assert.match(locked.why!, /waits for the light right-hand OK/)
})

test('regresses a rung on pain, a worse morning, a miss or RPE 9+', () => {
  for (const bad of [{ pain: 2 }, { morning: 1 }, { ratio: 0.6 }, { rpe: 9 }]) {
    const last = { ...s('2026-11-29', 'b', 1), ...bad, dose: 1 }
    const down = plan({ ...base, members: ladder(), sessions: [s('2026-11-27', 'b', 1), last] })!
    assert.equal(down.id, 'a', JSON.stringify(bad))
    assert.equal(down.moved, 'down')
  }
})

test('pain stops progress even when the numbers say go', () => {
  const single: Member[] = [{ id: 'x', name: 'X', rung: 1, allowed: true, top: 1.5, right: false }]
  const hurt = plan({ ...base, members: single, sessions: [s('2026-11-27', 'x', 1.3, { rpe: 5 }), s('2026-11-29', 'x', 1.3, { rpe: 5, pain: 2, dose: 1.2 })] })!
  assert.ok(hurt.dose <= 1.2 * 0.88 + 1e-9)
  assert.match(hurt.why!, /pain 2\/10/)
  const right: Member[] = [{ ...single[0], right: true }]
  const unlogged = plan({ ...base, members: right, sessions: [s('2026-11-27', 'x', 1.3, { rpe: 5, dose: 1 }), s('2026-11-29', 'x', 1.3, { rpe: 5, dose: 1 })] })!
  assert.equal(unlogged.dose, 1, 'right arm holds until the next-morning check is logged')
  assert.match(unlogged.why!, /holding/)
})

test('dose changes are capped per session and per week on the right arm', () => {
  const single: Member[] = [{ id: 'x', name: 'X', rung: 1, allowed: true, top: 3, right: false }]
  const fast = plan({ ...base, members: single, sessions: [s('2026-11-29', 'x', 2, { dose: 1, rpe: 5 })] })!
  assert.ok(Math.abs(fast.dose - 1.12) < 1e-9)
  const right: Member[] = [{ ...single[0], right: true }]
  const week = ['2026-11-24', '2026-11-26', '2026-11-28', '2026-11-30'].map((date, i) => s(date, 'x', 2, { dose: [1, 1.12, 1.2, 1.2][i], rpe: 5, morning: 0 }))
  assert.ok(plan({ ...base, members: right, sessions: week })!.dose <= 1.2 + 1e-9)
})

test('a plateau swaps to a sibling chosen by seeded Thompson sampling', () => {
  const peers: Member[] = [
    { id: 'p1', name: 'Farmer hold', rung: 1, allowed: true, top: 2, right: false },
    { id: 'p2', name: 'Pinch hold', rung: 1, allowed: true, top: 2, right: false },
  ]
  const flat = ['2026-11-21', '2026-11-23', '2026-11-25', '2026-11-27'].map(date => s(date, 'p1', 1, { rpe: 8 }))
  const swap = plan({ ...base, members: peers, sessions: flat })!
  assert.equal(swap.moved, 'swap')
  assert.equal(swap.id, 'p2')
  assert.match(swap.why!, /no gain in 3 sessions/)
  assert.deepEqual(plan({ ...base, members: peers, sessions: flat }), swap, 'same day, same pick')
  assert.equal(thompson([{ id: 'loser', wins: 0, losses: 12 }, { id: 'winner', wins: 12, losses: 0 }], 'seed'), 'winner')
})

test('readiness lowers the dose on poor sleep, soreness, high resting HR or pain', () => {
  assert.equal(readiness({}).value, 1)
  assert.ok(Math.abs(readiness({ sleep: 5.5 }).value - 0.9) < 1e-9)
  assert.equal(readiness({ sleep: 4, soreness: 80, hr: 70, baseline: 60, pain: 2 }).value, 0.75)
  const tired = plan({ ...base, ready: 0.9, readyWhy: '5.5 h sleep', members: ladder(), sessions: [] })!
  assert.equal(tired.dose, 0.9)
  assert.match(tired.why!, /5\.5 h sleep/)
})

test('with no history it starts on the slot default, the first easiest member', () => {
  const peers: Member[] = [
    { id: 'p1', name: 'Default', rung: 1, allowed: true, top: 2, right: false },
    { id: 'p2', name: 'Sibling', rung: 1, allowed: true, top: 2, right: false },
    { id: 'p3', name: 'Harder', rung: 2, allowed: true, top: 2, right: false },
  ]
  assert.equal(plan({ ...base, members: peers, sessions: [] })!.id, 'p1')
  assert.equal(plan({ ...base, members: peers.map(p => p.id === 'p3' ? { ...p, allowed: false } : p), sessions: [s('2026-11-29', 'p3', 1)] })!.id, 'p1', 'locked again → back to the default of the highest allowed rung')
})
