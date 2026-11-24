import { Award, Crown, Dumbbell, Flame, Footprints, Gem, HeartPulse, Medal, Rocket, ShieldCheck, Sparkles, Star, Trophy, Waves, Zap, type LucideIcon } from 'lucide-react'
import { monday, sessionDone, statsFor, type State } from './model'

export type Badge = { id: string; name: string; detail: string; icon: LucideIcon; value: number; goal: number; unit?: string }

export function progressTotals(state: State, today: string) {
  let workouts = 0, rehab = 0, stretch = 0, ball = 0, contacts = 0, volume = 0, reps = 0
  const weeks = new Map<string, number>()
  for (const [key, log] of Object.entries(state.logs)) {
    if (key > today) continue
    if (sessionDone(log, 'workout')) workouts++
    if (sessionDone(log, 'rehab')) rehab++
    if (sessionDone(log, 'mobility')) stretch++
    if (sessionDone(log, 'foam')) ball++
    contacts += log.contacts ?? 0
    for (const set of Object.values(log.sets ?? {})) {
      contacts += set.contacts
      reps += set.reps ?? 0
      volume += (set.reps ?? 0) * (set.kg ?? 0)
    }
    if (log.status === 'full' || log.status === 'recovery') weeks.set(monday(key), (weeks.get(monday(key)) ?? 0) + 1)
  }
  const { longest, streak } = statsFor(state, today)
  return { workouts, rehab, stretch, ball, contacts, volume: Math.round(volume), reps, longest, streak, bestWeek: Math.max(0, ...weeks.values()) }
}

export function badges(state: State, today: string): Badge[] {
  const t = progressTotals(state, today)
  return [
    { id: 'first', name: 'First Rep', detail: 'Finish your first workout', icon: Rocket, value: t.workouts, goal: 1 },
    { id: 'streak3', name: 'On a Roll', detail: '3-day training streak', icon: Flame, value: t.longest, goal: 3, unit: 'days' },
    { id: 'streak7', name: 'Locked In', detail: '7-day training streak', icon: Flame, value: t.longest, goal: 7, unit: 'days' },
    { id: 'week', name: 'Perfect Week', detail: 'Train or recover all 7 days of a week', icon: Star, value: t.bestWeek, goal: 7, unit: 'days' },
    { id: 'streak14', name: 'Two-Week Grind', detail: '14-day training streak', icon: Medal, value: t.longest, goal: 14, unit: 'days' },
    { id: 'rehab10', name: 'Rehab Regular', detail: '10 forearm rehab sessions', icon: HeartPulse, value: t.rehab, goal: 10 },
    { id: 'stretch10', name: 'Loose Hips', detail: '10 stretching sessions', icon: Waves, value: t.stretch, goal: 10 },
    { id: 'ball10', name: 'Off-Hand Handles', detail: '10 ball-handling sessions', icon: Sparkles, value: t.ball, goal: 10 },
    { id: 'contacts1k', name: 'Spring Loaded', detail: '1,000 total foot contacts', icon: Footprints, value: t.contacts, goal: 1000 },
    { id: 'volume10k', name: 'Iron Mover', detail: 'Lift 10,000 kg of total volume', icon: Dumbbell, value: t.volume, goal: 10000, unit: 'kg' },
    { id: 'workouts25', name: 'Comeback Built', detail: '25 workouts complete', icon: Trophy, value: t.workouts, goal: 25 },
    { id: 'rehab30', name: 'Bulletproof Forearm', detail: '30 forearm rehab sessions', icon: ShieldCheck, value: t.rehab, goal: 30 },
    { id: 'streak30', name: 'Unbreakable', detail: '30-day training streak', icon: Crown, value: t.longest, goal: 30, unit: 'days' },
    { id: 'contacts5k', name: 'Bounce House', detail: '5,000 total foot contacts', icon: Zap, value: t.contacts, goal: 5000 },
    { id: 'workouts50', name: 'Foundation Laid', detail: '50 workouts complete', icon: Gem, value: t.workouts, goal: 50 },
    { id: 'allIn', name: 'Full Day', detail: 'Finish workout, stretching, rehab and handles in one day', icon: Award, value: fullDays(state, today), goal: 1 },
  ]
}
function fullDays(state: State, today: string) {
  return Object.entries(state.logs).filter(([key, log]) => key <= today && (['workout', 'mobility', 'rehab', 'foam'] as const).every(m => sessionDone(log, m))).length
}
export const unlocked = (badge: Badge) => badge.value >= badge.goal
export function nextBadge(list: Badge[]) {
  return list.filter(badge => !unlocked(badge)).sort((a, b) => b.value / b.goal - a.value / a.goal)[0]
}
export function foundationDay(today: string, start: string) {
  const day = Math.round((Date.parse(today) - Date.parse(start)) / 86400000) + 1
  return Math.min(56, Math.max(0, day))
}
