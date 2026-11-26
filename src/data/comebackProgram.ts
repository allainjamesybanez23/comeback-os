export const categories = [
  'Lower Strength', 'Upper Band Strength', 'Plyometrics & Speed', 'Forearm Rehab',
  'Dynamic Warm-Up', 'Mobility & Stretching', 'Core & Isometrics', 'Dorm Conditioning',
  'Silent Foam Ball Handles', 'Grip & Forearm', 'FLAG (Forearm Load Warning)',
] as const
/* Clearance ladder: now (Phase 0) → light right-hand use OK'd → surgeon phases 1–4. */
export const gates = ['now', 'light', 'phase1', 'phase2', 'phase3', 'phase4'] as const
export type Gate = typeof gates[number]
/* Cheap extras you can switch on in Program. Everything else in the plan uses the base kit. */
export const optionalEquipment = ['rice bucket', 'hand gripper', 'wrist roller', 'basketball', 'putty'] as const

export type Category = typeof categories[number]
export type Exercise = {
  id: string
  name: string
  category: Category
  sets: number
  reps: string
  rest: number
  tempo: string
  load: string
  block: string
  move: string
  cue: string
  mistake: string
  seconds?: number
  contacts?: number
  flag?: boolean
  adjustment?: string
  gate?: Gate
  family?: string   // progression family: easier ↔ harder variants of one job
  rung?: number     // 1 = easiest in the family
  equipment?: string[]
  side?: 'left' | 'right' | 'each' | 'both'
  range?: [number, number] // dose range per side: reps or seconds
  reason?: string   // why the coach engine changed this today
}
export type Section = { id: string; name: string; duration?: string; rows: Exercise[] }
export type Day = { name: string; title: string; focus: string; level: 'Hard' | 'Moderate' | 'Easy'; minutes: number; main: Exercise[] }

const [lower, upper, plyo, rehab, warm, mobility, core, conditioning, handles, grip] = categories
const body = 'Bodyweight'
const left = '17 kg · left hand only'
const light = 'Light band'
type Entry = [string, number, string, string, string, number?, string?, string?, number?, number?, boolean?]
function row(id: string, category: Category, entry: Entry, block = ''): Exercise {
  const [name, sets, reps, move, text, rest = 0, tempo = '', load = body, seconds, contacts, flag] = entry
  const [cue, mistake] = text.split(' | ')
  return { id, name, category, sets, reps, block, move, cue, mistake, rest, tempo, load, seconds, contacts, flag }
}
function rows(prefix: string, category: Category, entries: Entry[]) {
  return entries.map((entry, i) => row(prefix + (i + 1), category, entry))
}
type Block = [string, Category, Entry]
function blocks(day: string, entries: Block[]) {
  return entries.map(([key, category, entry]) => row(day + key, category, entry, key))
}

type Meta = Pick<Exercise, 'gate' | 'family' | 'rung' | 'equipment' | 'side' | 'range'> & { flag?: boolean }
/* New rows get name-based ids so reordering never breaks your logged history. */
function more(category: Category, list: [Entry, Meta][]) {
  return list.map(([entry, meta]) => ({ ...row('x-' + entry[0].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, ''), category, entry), ...meta }))
}

/* Equipment on hand: one 17 kg dumbbell, light resistance bands, a bench, a low step,
   a wall, a foam ball, a tennis ball, a pillow and floor tape. Nothing needs a door
   anchor or a pull-up bar. */

// Warm-up runs general → specific → explosive so the first hard set starts warm.
export const warmUp = rows('warm-', warm, [
  ['Easy jog in place', 1, '2 min', 'jog', 'Jog lightly on the balls of your feet and let the arms swing loosely. The right arm stays relaxed. | Avoid big overhead arm swings or stomping.', 0, '', body, 120],
  ['Leg swings', 1, '10 / leg each way', 'swing', 'Hold a wall or the bench with the left hand. Swing one leg front to back, then side to side. | Keep the torso tall and let the arc grow gradually.'],
  ['Banded lateral walk', 2, '5 steps each way', 'bandWalk', 'Band just above the knees. Sit into a quarter squat and step sideways without letting the feet touch. | Do not let the knees cave in or drag the trailing foot.', 15, '', 'Band above knees'],
  ['Ankle rocks', 1, '10 / side', 'rock', 'Half-kneel and drive the front knee forward past the toes while the heel stays down. | Avoid collapsing the arch inward.'],
  ['Reverse lunge with rotation', 1, '6 / side', 'lungeTwist', 'Step back, lower the back knee, and rotate the chest toward the front leg. | Keep the hands off the floor and the front knee over the foot.'],
  ['A-skips', 2, '20 s', 'skip', 'Skip in place with a high knee, toes up, and a quick foot strike under the hip. | Avoid leaning back or loud landings.', 15, '', body, 20, 0],
  ['Pogo hops', 2, '10', 'bounce', 'Small, springy hops from the ankles with almost straight knees. | Keep every landing quiet.', 15, '', body, undefined, 20],
])

// Forearm rehab: range of motion → strength → function → stretch.
const rehabBase = rows('rehab-', rehab, [
  ['Wrist flexion / extension', 2, '15', 'wrist', 'Rest the forearm on a table with the hand over the edge. Slowly lift the hand up, then lower it down within your allowed range. | Avoid adding load or forcing the end range.', 20, '2-0-2', 'No weight'],
  ['Radial / ulnar deviation', 2, '15', 'deviate', 'Forearm supported with the thumb up. Tilt the hand up toward the thumb, then down toward the little finger. | Move only at the wrist, not the whole forearm.', 20, '2-0-2', 'No weight'],
  ['Supination / pronation', 2, '15', 'rotate', 'Elbow bent 90° and tucked at your side. Hold a water bottle and slowly turn the palm up, then down. | Avoid swinging the elbow away from the body.', 20, '2-0-2', 'Water bottle · rehab only'],
  ['Band wrist extension / flexion', 2, '15', 'bandWrist', 'Forearm supported, band pinned under your foot. Lift the back of the hand against light tension and lower slowly, then repeat palm up. | Avoid moving the elbow or working through pain.', 20, '2-0-2', 'Lightest band'],
  ['Finger extension vs band', 2, '15', 'fingers', 'Loop a light band around the fingertips and thumb. Spread the fingers open, then return slowly. | Avoid flicking or snapping the band.', 20, '', 'Lightest band'],
  ['Tennis ball squeeze', 3, '10 × 3 s', 'grip', 'Gently squeeze the ball, hold three seconds, then fully relax the hand. Week 1 effort stays at 2/10 or less. | Avoid maximal grip or long holds.', 20, '', 'Tennis ball'],
  ['Tennis ball wall toss and catch', 2, '1 min', 'toss', 'Stand about 1 m from a wall and use soft, close-range tosses. Catch with the left hand; any prescribed right-hand catches stay soft. | Avoid fast rebounds or firm right-hand catches.', 20, '', 'Tennis ball', 60],
  ['Prayer / reverse-prayer stretch', 2, '20 s each', 'prayer', 'Press the palms together at chest height and lower the hands slowly. Then place the backs of the hands together, fingers down. | Avoid leaning your weight into the right wrist.', 10, '', 'Gentle stretch', 40],
])
rehabBase.forEach(item => { item.side = item.move === 'toss' ? 'both' : 'right' })
rehabBase[3].gate = 'light' // band resistance is load, so it waits for the light right-hand OK
// Daily right-hand range of motion with no load (Phase 0 safe).
const rehabExtra = more(rehab, [
  [['Tendon glides', 2, '5 rounds', 'fingers', 'Move slowly through five hand shapes: straight, hook, full fist, tabletop, straight fist. Hold each for five seconds. | Avoid forcing any shape that pulls at the scar.', 15, '', 'No weight'], { gate: 'now', side: 'right', range: [5, 8] }],
  [['Thumb-to-fingertip opposition', 2, '10 rounds', 'fingers', 'Touch the thumb tip to each fingertip in turn, making a clear O, then open the hand fully. | Avoid rushing or pressing hard.', 15, '', 'No weight'], { gate: 'now', side: 'right', range: [10, 15] }],
  [['Soft putty squeeze', 2, '10 × 3 s', 'grip', 'Squeeze the softest putty gently for three seconds, then open the hand wide. Effort 2/10. | Avoid hard squeezes or any pain.', 20, '', 'Soft putty'], { gate: 'now', side: 'right', equipment: ['putty'], range: [10, 15] }],
])
const rb = (n: number) => rehabBase[n - 1]
// Range of motion → light strength → grip → function → stretch.
export const rehabRows = [rb(1), rb(2), rb(3), rehabExtra[0], rehabExtra[1], rb(4), rb(5), rehabExtra[2], rb(6), rb(7), rb(8)]

// Stretching flows floor → kneeling → squat → standing so you never bounce up and down.
export const dailyMobility = rows('mob-', mobility, [
  ['Side-lying open book', 1, '8 / side', 'book', 'Lie on your side with the knees bent and stacked. Open the top arm across to the other side and follow it with your eyes. | Keep the knees stacked together.'],
  ['Seated straight-leg lift over pillow', 1, '10 / side', 'lift', 'Sit tall with the legs long and a pillow beside one leg. Lift the straight leg up and over the pillow, then back. | Avoid leaning back or pushing with the right hand.'],
  ['90/90 hip switches', 1, '10 total', 'switch', 'Sit with both knees bent and feet wide. Rotate both knees to one side, then the other, keeping the chest tall. | Use left-hand support only if needed.'],
  ['90/90 side reach', 1, '5 / side × 2 s', 'sideReach', 'In the 90/90 position, reach the left arm overhead and bend from the ribs. | Avoid loading the right hand.'],
  ['90/90 back-knee lift-off', 1, '5 / side', 'kneeLift', 'Sit tall in 90/90 and lift the back knee off the floor without rolling the pelvis. | Avoid leaning sideways to cheat the lift.'],
  ['Half-kneeling hip flexor stretch', 1, '45 s / side', 'kneel', 'Half-kneel, squeeze the glute of the down leg, tuck the pelvis, and reach the left arm overhead. | Avoid arching the lower back.', 0, '', body, 90],
  ['Ankle rocks + elevated lunge hold', 1, '10 rocks + 30 s / side', 'rock', 'Rock the front knee forward ten times, then hold the end position with the heel down. | Avoid rolling the foot inward.'],
  ['Deep squat pry hold', 1, '60 s', 'squat', 'Sit deep between the hips with the heels down. Hold the bench or bed frame with the left hand if needed and gently sway side to side. | Avoid letting the heels lift.', 0, '', body, 60],
  ['Cossack squat', 1, '5 / side', 'cossack', 'From a wide stance, sit toward one bent leg while the other stays straight with the toes up. | Avoid forcing depth or lifting the working heel.'],
  ['Band pass-through', 1, '10', 'pass', 'Hold the lightest band wide and lift it overhead and back within your approved range. | Avoid forcing the band behind you.', 0, '', 'Lightest band'],
  ['Tennis ball foot roll', 1, '1 min / foot', 'roll', 'Stand and roll the ball slowly under the arch with comfortable pressure. | Avoid painful pressure or losing balance.', 0, '', 'Tennis ball', 120],
])
export const sundayMobility = rows('sun-mob-', mobility, [
  ['Seated straddle reach', 1, '1 min', 'straddle', 'Sit with the legs comfortably wide and hinge forward from the hips. | Avoid forcing a wider stance or rounding hard.', 0, '', body, 60],
  ['Bench pigeon stretch', 1, '1 min / side', 'pigeon', 'Rest the front shin across the bench and hinge gently over it. | Avoid twisting or pressure in the knee.', 0, '', body, 120],
  ['Couch stretch', 1, '1 min / side', 'couch', 'Back foot up on the bench or bed, knee on padding. Tuck the pelvis and stay tall. | Avoid arching to create range.', 0, '', body, 120],
  ['Supported deep squat breathing', 2, '5 slow breaths', 'squat', 'Settle into a deep squat, hold the bench with the left hand, and breathe slowly into the belly. | Keep the right arm unloaded.', 10],
  ['Wall calf stretch', 1, '45 s each / side', 'calfStretch', 'Left hand on the wall, back heel down. Hold with a straight back knee, then a bent back knee. | Avoid letting the arch collapse.', 0, '', body, 180],
  ['Toe yoga', 2, '10', 'toeYoga', 'Lift only the big toe, press it down, then lift the other four toes. | Keep the arch steady without clawing.', 10],
])
const mob = (n: number) => dailyMobility[n - 1]
const sun = (n: number) => sundayMobility[n - 1]
// Sunday's long flow merges both lists in floor → standing order.
export const sundayFlow = [mob(1), mob(2), sun(1), mob(3), mob(4), mob(5), sun(2), mob(6), sun(3), mob(7), mob(8), sun(4), mob(9), sun(5), sun(6), mob(10), mob(11)]

export const cooldown = rows('cool-', mobility, [
  ['Easy cooldown walk', 1, '3 min', 'walk', 'Walk easily around the room and let your breathing settle. | Avoid turning the cooldown into another interval.', 0, '', body, 180],
  ['Standing hamstring stretch', 1, '30 s / side', 'hamstring', 'Rest one heel on the bench with the leg straight and hinge forward from the hips. | Avoid bouncing or rounding hard.', 0, '', body, 60],
  ['Wall calf stretch', 1, '30 s / side', 'calfStretch', 'Left hand on the wall, back heel down, lean in gently. | Avoid letting the arch collapse.', 0, '', body, 60],
  ['Couch stretch', 1, '30 s / side', 'couch', 'Back foot up on the bench or bed, tuck the pelvis and relax into the hip-flexor stretch. | Avoid arching the back.', 0, '', body, 60],
])

// Every superset block uses the same set count so rounds stay clean: A1 → A2 → rest → repeat.
export const days: Day[] = [
  { name: 'Monday', title: 'Lower Strength A', focus: 'Squat + knee', level: 'Hard', minutes: 50, main: blocks('mon-', [
    ['A1', lower, ['Front-rack squat', 4, '10', 'squatRack', 'Rack the dumbbell on the left shoulder. Sit between the hips, then drive up tall. | Avoid leaning into the dumbbell or gripping it with the right hand.', 90, '3-1-1', left]],
    ['A2', plyo, ['Squat jump', 4, '5', 'jump', 'Dip, jump straight up, and land softly with the hips and knees bending. | Avoid stiff or loud landings.', 90, '', body, undefined, 10]],
    ['B1', lower, ['Rear-foot elevated split squat', 3, '8 / leg', 'rfess', 'Rear foot on the bench, lower straight down until the back knee nearly touches the floor. | Keep the front foot planted and the right hand unloaded.', 75, '3-0-1', left]],
    ['B2', core, ['Split squat isometric hold', 3, '30 s / leg', 'splitHold', 'Settle into a split squat with the back knee just above the floor and hold. | Avoid leaning onto the lead leg or using the right arm for support.', 75, '', left, 60]],
    ['C1', lower, ['Peterson step-up', 3, '12 / leg', 'peterson', 'Stand on a low step. Let the working knee travel over the toes as you lower, then rise. | Avoid pushing off hard from the lower foot.', 60]],
    ['C2', lower, ['Reverse Nordic', 3, '6', 'nordic', 'Kneel on padding, brace, and lean back from the knees with the hips straight. | Do not bend at the hips or force range.', 60]],
    ['D1', lower, ['Tibialis raise', 3, '20', 'tibRaise', 'Lean your back on a wall, heels a foot out, and lift the toes as high as you can. | Avoid bouncing off the wall.', 45]],
    ['D2', lower, ['Single-leg calf raise', 3, '12 / leg', 'calf', 'Rise through the forefoot, pause for two seconds at the top, then lower smoothly. | Avoid resting bodyweight on the supporting hand.', 45, '2-2-1', left]],
    ['E', core, ['Dead bug', 3, '10 / side', 'deadbug', 'On your back, ribs down, extend one leg and the opposite arm without arching. | Avoid arching the lower back or loading the right hand.', 45]],
  ]) },
  { name: 'Tuesday', title: 'Upper A', focus: 'Bands + core + Zone 2', level: 'Moderate', minutes: 55, main: blocks('tue-', [
    ['A1', upper, ['Band chest press', 3, '15', 'bandPress', 'Wrap the band across your upper back and hold an end in each hand. Press forward to arm’s length, then return slowly. | Avoid flaring the elbows or strong tension on the right.', 60, '2-1-2', light]],
    ['A2', upper, ['Band seated row', 3, '15', 'row', 'Sit tall with the legs straight and the band looped around both feet. Pull the elbows back and squeeze the shoulder blades. | Avoid rocking the torso.', 60, '', light]],
    ['B1', upper, ['Half-kneeling single-arm band overhead press', 3, '12 / arm', 'ohp', 'Half-kneel with the band under the front foot. Brace and press up within your approved range. Keep right-side tension light. | Avoid rib flare or leaning sideways.', 60, '', light]],
    ['B2', upper, ['Prone Y-T-W raise', 3, '6 each', 'ytw', 'Lie face down with the forehead on a towel. Lift the arms into a Y, then a T, then a W, squeezing the shoulder blades. | Avoid shrugging or lifting the chest off the floor.', 60]],
    ['C1', upper, ['Wall push-up', 3, '15', 'wallPress', 'Only if pain-free and permitted: hands on the wall at shoulder height, body straight, lower the chest toward the wall and press away. | Stop if the forearm aches.', 45, '', body, undefined, undefined, true]],
    ['C2', upper, ['Band pull-apart', 3, '20', 'pullApart', 'Hold the band at chest height with long arms and pull it apart until it touches your chest. | Avoid shrugging or overextending the right wrist.', 45, '', light]],
    ['D1', core, ['Hollow body hold', 3, '25 s', 'hollow', 'Low back pressed down, lift the shoulders and legs into a shallow banana shape and breathe. | Avoid letting the lower back peel off the floor.', 0, '', body, 25]],
    ['D2', core, ['Reverse crunch', 3, '12', 'crunch', 'Knees bent over the hips, curl the pelvis up toward the ribs, then lower slowly. | Avoid swinging the legs for momentum.', 45]],
    ['E', conditioning, ['Zone 2 cardio', 1, '20–25 min', 'stepCardio', 'Steady step-ups on the low step or stair walking at a pace where you can still talk in full sentences. | Avoid turning this into a hard interval.', 0, '', body, 1200]],
  ]) },
  { name: 'Wednesday', title: 'Plyo + Speed', focus: 'Elasticity + acceleration', level: 'Hard', minutes: 50, main: blocks('wed-', [
    ['A1', plyo, ['Pogo hops', 3, '20', 'bounce', 'Bounce from the ankles with soft knees and short ground contacts. | Avoid loud landings or rushing tired reps.', 45, '', body, undefined, 40]],
    ['A2', plyo, ['Forward / back line hops', 3, '20 s', 'line', 'Hop just over a tape line forward and back. | Avoid reaching so far that you lose control of the landing.', 45, '', body, 20]],
    ['A3', plyo, ['Lateral line hops', 3, '20 s', 'latHop', 'Hop side to side over a short line, springy through the forefoot. | Avoid the knees wobbling side to side.', 45, '', body, 20]],
    ['B1', plyo, ['Squat jump · stick landing', 3, '4', 'jumpStick', 'Jump straight up and freeze the landing for two seconds. | Avoid rebounding before you are balanced.', 60, '', body, undefined, 8]],
    ['B2', plyo, ['Depth drop from low step', 3, '5', 'drop', 'Step off a low, stable surface and land softly in a balanced stance. | Avoid high platforms or jumping off the bench.', 60, '', body, undefined, 10]],
    ['B3', plyo, ['Split squat jump', 3, '6 / leg', 'splitJump', 'Switch legs in the air and absorb each landing with bent knees. | Stop if you cannot land quietly and balanced.', 90, '', body, undefined, 24]],
    ['C1', plyo, ['A-march', 4, '10 / leg', 'march', 'Stand tall, drive one knee to hip height with the toes up, and punch the foot down under the hip. | Avoid leaning back.', 30, '', body, undefined, 0]],
    ['C2', plyo, ['Quick high-knee switches', 4, '6 / leg', 'kneeSwitch', 'Lean slightly forward from the ankles and switch knees fast, landing under the hips. | Avoid losing posture or loud foot strikes.', 30, '', body, undefined, 12]],
    ['C3', plyo, ['Lateral shuffle', 4, '10 s', 'shuffle', 'Stay low and take two quick shuffle steps each way. | Avoid crossing the feet.', 45, '', body, 10]],
    ['D', core, ['Suitcase march', 3, '10 / leg', 'suitcase', 'Hold the dumbbell in the left hand at your side. March slowly with the knees to hip height without leaning. | Avoid tilting toward the weight or holding your breath.', 45, '', left]],
  ]) },
  { name: 'Thursday', title: 'Lower Strength B', focus: 'Hinge + single-leg + ankles', level: 'Hard', minutes: 55, main: blocks('thu-', [
    ['A1', lower, ['Single-leg RDL', 4, '8 / leg', 'rdl', 'Root the stance foot and hinge, sending the free heel back while the hips stay square. | Avoid opening the pelvis or loading the right hand.', 75, '3-1-1', left]],
    ['A2', core, ['Single-leg hamstring bridge hold', 4, '30 s / leg', 'bridge', 'One heel on the bench, lift the hips and hold while keeping the ribs down. | Avoid arching to get higher.', 75, '', body, 60]],
    ['B1', lower, ['Step-up onto bench', 3, '8 / leg', 'step', 'Place the whole foot on the bench and drive up through the top leg. | Avoid springing off the floor foot.', 75, '2-0-1', left]],
    ['B2', lower, ['Lateral lunge', 3, '8 / leg', 'sideLunge', 'Step to the side, sit the hip back, and drive back to center. | Keep the working foot flat and the right hand unloaded.', 75, '', left]],
    ['C1', core, ['Wall sit', 3, '45 s', 'wallSit', 'Slide down the wall until the thighs are near level and hold. | Keep the feet planted and avoid pressing off with the right hand.', 60, '', body, 45]],
    ['C2', core, ['Adductor squeeze', 3, '30 s', 'adductor', 'Lie on your back, squeeze a ball or pillow between the knees, and breathe steadily. | Avoid lifting the hips or holding your breath.', 60, '', 'Ball or pillow', 30]],
    ['D1', lower, ['Banded ankle pumps', 2, '15 / side', 'anklePump', 'Sit with the legs long, band around the forefoot and held in the left hand. Point and flex the ankle against the band. | Avoid turning the knee to move the band.', 30, '', light]],
    ['D2', mobility, ['Knee-elevated lunge hold', 2, '1 min / side', 'rock', 'Half-kneel and drive the front knee gently forward with the heel down, then hold. | Avoid forcing the stretch or shifting onto the right hand.', 30, '', body, 120]],
    ['D3', core, ['Single-leg balance · eyes closed', 2, '30 s / leg', 'balance', 'Stand near a wall with left-hand support ready and close your eyes. | Open your eyes and reset if balance breaks.', 30, '', body, 60]],
    ['E', core, ['Dead bug · heel taps', 3, '8 / side', 'deadbug', 'On your back with the knees over the hips, lower one heel to tap the floor while the low back stays down. | Avoid arching or holding your breath.', 45]],
  ]) },
  { name: 'Friday', title: 'Upper B', focus: 'Bands + isometrics + core', level: 'Moderate', minutes: 50, main: blocks('fri-', [
    ['A1', upper, ['Split-stance dumbbell row · left', 3, '12', 'dbRow', 'Stagger the stance, hinge to about 45°, and row the dumbbell toward the left hip. The right arm stays relaxed. | Avoid twisting the chest or bracing on the right hand.', 60, '2-1-2', left]],
    ['A2', upper, ['Band chest fly', 3, '15', 'fly', 'Wrap the band across your upper back. With soft elbows, sweep the hands together in front of the chest. | Avoid letting the band snap back.', 60, '', light]],
    ['B1', upper, ['Overhead band pull-down', 3, '12', 'pulldown', 'Hold the band overhead with a wide grip. Pull it apart as the elbows drive down to the ribs, then return. | Avoid shrugging or arching the back.', 60, '', light]],
    ['B2', upper, ['Band front raise', 3, '15', 'raise', 'Stand on the band and raise straight arms to eye level. | Avoid shrugging or swinging.', 60, '', light]],
    ['C1', upper, ['Band reverse fly', 3, '15', 'reverseFly', 'Hinge slightly, hold the band in front, and open the arms wide in an arc, squeezing the upper back. | Avoid arching the back or shrugging.', 45, '', light]],
    ['C2', upper, ['Band curl', 3, '12', 'curl', 'Stand on the band and curl with the elbows pinned to the ribs. | Avoid heavy right-side tension or swinging.', 45, '', light]],
    ['C3', upper, ['Band overhead triceps extension', 3, '12', 'tricepsExt', 'Stand on the band behind you, hands behind the head, and extend the arms overhead. | Avoid flaring the elbows or arching the back.', 45, '', light]],
    ['D1', core, ['Heels-elevated squat hold', 3, '45 s', 'squatHold', 'Heels on a folded towel or book, sit into a tall half squat with the knees forward and hold. | Avoid leaning forward or letting the knees cave.', 60, '', body, 45]],
    ['D2', core, ['Single-leg calf raise isometric', 3, '30 s / leg', 'calfHold', 'Rise onto the forefoot and hold at the top. Choose bodyweight if you need the left hand for balance. | Avoid supporting weight with the right arm.', 60, '', left, 60]],
    ['E1', core, ['Side-lying leg raise', 3, '12 / side', 'legRaise', 'Lie on your side with the hips stacked and lift the top leg slightly behind you. | Avoid rolling the pelvis back.', 0]],
    ['E2', core, ['Standing hip extension', 3, '12 / side', 'hipExt', 'Stand tall with the left hand on the wall and sweep one straight leg back, squeezing the glute. | Avoid arching the lower back.', 45]],
  ]) },
  { name: 'Saturday', title: 'Lateral Plyo + COD', focus: 'Change of direction + dorm circuit', level: 'Hard', minutes: 55, main: blocks('sat-', [
    ['A', plyo, ['4-square hops', 1, '4 patterns × 2', 'square', 'Tape a one-meter square. Hop front/back, side to side, diagonally, and clockwise around it. | Avoid long or noisy landings.', 30, '', body, undefined, 32]],
    ['B1', plyo, ['Short skater hops', 3, '5 / side', 'skate', 'Hop side to side, sticking each landing for two seconds. | Avoid reaching so far that the knee collapses inward.', 60, '', body, undefined, 10]],
    ['B2', plyo, ['Lateral line hops', 3, '20 s', 'latHop', 'Hop briskly over a narrow line with quiet landings. | Keep the range small enough to control.', 60, '', body, 20]],
    ['C1', plyo, ['Mini shuffle-touch drill', 3, '20 s', 'touch', 'Shuffle across 1.5 m and touch the tape with the left hand only. | Never reach with the injured arm.', 45, '', body, 20]],
    ['C2', plyo, ['Closeout + defensive slides', 3, '2', 'closeout', 'Chop the feet into a controlled closeout with the left hand high, then slide twice each way. | Avoid crossing the feet or overstriding.', 45, '', body, undefined, 0]],
    ['C3', plyo, ['Drop step + 2 explosive steps', 3, '2 / side', 'pivot', 'Open the hips with a drop step and take two sharp steps. | Avoid twisting on a fixed knee.', 45, '', body, undefined, 0]],
    ['E', core, ['Band diagonal lift', 3, '10 / side', 'chop', 'Stand on one end of the band. Pull it diagonally from the outside knee to above the opposite shoulder, rotating through the hips. | Avoid torquing the right wrist.', 45, '', 'Band · light on right']],
  ]) },
  { name: 'Sunday', title: 'Easy Recovery', focus: 'Walk + long stretch + rehab', level: 'Easy', minutes: 35, main: blocks('sun-', [
    ['A', conditioning, ['Easy walk', 1, '25–30 min', 'walk', 'Walk at a relaxed pace and let breathing stay easy. | Avoid pushing the pace on a recovery day.', 0, '', body, 1500]],
    ['B', mobility, ['Tennis ball foot roll', 1, '2 min / foot', 'roll', 'Roll gently under the arch, heel, and forefoot. | Avoid painful pressure.', 0, '', 'Tennis ball', 240]],
    ['E', conditioning, ['Weekly meal and schedule prep', 1, 'Plan the week', 'plan', 'Review your week, prep meals, and set a bedtime. | Leave room in the schedule for recovery.']],
  ]) },
]

export const circuit = rows('circuit-', conditioning, [
  ['High knees', 1, '', 'highKnees', 'Drive alternating knees up in place with quiet, quick steps. | Avoid leaning backward.'],
  ['Defensive stance quick feet', 1, '', 'quickFeet', 'Stay low in a wide stance and chop your feet in place. | Avoid letting your stance narrow.'],
  ['Skater hops', 1, '', 'skate', 'Bound from foot to foot over a short distance. Land softly. | Avoid overshooting your balance.'],
  ['Lateral shuffle', 1, '', 'shuffle', 'Two shuffle steps each way from a stable stance. | Avoid crossing the feet.'],
  ['Squat jumps', 1, '', 'jump', 'Dip, jump, and land softly with bent knees. | Keep the jumps controlled as fatigue builds.'],
])
export const circuitDoses = [[3,20,10,90],[3,20,10,90],[4,20,10,75],[3,20,10,90],[4,30,15,75],[5,30,15,60],[6,30,10,60],[3,30,15,90]]
export function circuitRows(week: number) {
  const [rounds, work, rest, between] = circuitDoses[week - 1]
  return Array.from({ length: rounds }, (_, round) => circuit.map((item, i) => ({
    ...item, id: item.id + '-r' + (round + 1), block: 'R' + (round + 1), reps: work + ' s',
    seconds: work, rest: i === 4 ? (round === rounds - 1 ? 0 : between) : rest,
    adjustment: 'Round ' + (round + 1) + ' of ' + rounds,
  }))).flat()
}

export const foamRows = rows('foam-', handles, [
  ['Low ankle pounds', 3, '30 s', 'dribbleLow', 'Pound the foam ball hard with the left fingertips below the knee. | Avoid chasing the ball beyond your training space.', 15, '', 'Foam ball · left hand', 30],
  ['Knee-height pounds', 3, '30 s', 'dribble', 'Stay in your stance and snap the left wrist for a consistent knee-height rebound. | Avoid letting the ball travel outside your stance.', 15, '', 'Foam ball · left hand', 30],
  ['Shoulder-height pounds', 3, '30 s', 'dribbleHigh', 'Drive the foam ball down with the left hand and meet the higher rebound. | Keep the right arm out of the drill.', 15, '', 'Foam ball · left hand', 30],
  ['Front-to-back V-dribbles', 3, '30 s', 'vDribble', 'Use the left fingertips to send the ball forward and back beside the hip. | Keep the rebound within your one-meter lane.', 15, '', 'Foam ball · left hand', 30],
  ['Side-to-side V-dribbles', 3, '30 s', 'vSide', 'Roll the left hand around the ball to make a tight side-to-side V in front of you. | Avoid catching and carrying the ball.', 15, '', 'Foam ball · left hand', 30],
  ['Hip-pocket pull-back + head fake', 3, '30 s', 'gather', 'Show the fake with your eyes and shoulders, then pull the rebound back beside the left hip. | Avoid turning the fake into a big step.', 15, '', 'Foam ball · left hand', 30],
  ['Seated / kneeling figure-8 weave', 3, '30 s', 'weave', 'Use short left-hand taps around and under the legs. Reset between loops as needed. | Keep right-hand support out of the drill.', 15, '', 'Foam ball · left hand', 30],
  ['Left dribble + tennis ball toss', 4, '30 s', 'dual', 'Dribble left, toss and catch the tennis ball with the same hand during the foam-ball rebound, then resume. Start with a single low toss. | Reset if the timing breaks. Never reach with the right hand to save a ball.', 15, '', 'Foam ball + tennis ball · left only', 30],
  ['Silent wall tap + high-pickup footwork', 3, '10 / side', 'pickup', 'Jab or drop-step, pound the foam ball, and gather it into the left pocket. | Keep the feet and ball inside the two-meter square.', 15, '', 'Foam ball · left hand'],
])
for (let i = 0; i < 3; i++) foamRows[i].block = 'A' + (i + 1)
foamRows.forEach(item => { item.side = 'left' })
for (const [i, family] of [[0, 'pound-low'], [1, 'pound-knee'], [2, 'pound-high'], [4, 'v-side'], [7, 'toss-combo']] as const) Object.assign(foamRows[i], { family, rung: 1 })
const expansionBase = rows('foam-next-', handles, [
  ['Two-hand crossover', 3, '30 s', 'crossover', 'Alternate hands in a low crossover within the cleared range. | Avoid reaching outside your base.', 15, '', 'Foam ball · both hands', 30],
  ['Behind-the-back wrap', 3, '30 s', 'wrap', 'Wrap the ball close around the hips and receive it softly with the other hand. | Avoid forcing shoulder or wrist range.', 15, '', 'Foam ball · both hands', 30],
]).map((item, i) => ({ ...item, gate: 'phase1' as const, side: 'both' as const, family: ['two-cross', 'two-wrap'][i], rung: 1 }))

const foamL = 'Foam ball · left hand', foamR = 'Foam ball · right hand', foam2 = 'Foam ball · both hands'
const slot = (list: Exercise[], family: string) => list.find(item => item.family === family)!
/* Ball handling for a 2 × 2 m dorm space. Families let the coach engine swap a stale drill for a sibling. */
export const handleDrills = more(handles, [
  [['Fingertip pulse control · left', 3, '30 s', 'dribbleLow', 'Keep the ball a few centimetres off the floor with rapid fingertip pulses. | Avoid slapping with the palm.', 15, '', foamL, 30], { gate: 'now', family: 'pound-low', rung: 1, equipment: ['foam ball'], side: 'left', range: [30, 45] }],
  [['Hesitation pound · left', 3, '30 s', 'dribble', 'Pound hard three times, freeze the ball in a soft hesitation at the hip, then explode back into pounds. | Avoid standing up tall on the hesitation.', 15, '', foamL, 30], { gate: 'now', family: 'pound-knee', rung: 1, equipment: ['foam ball'], side: 'left', range: [30, 45] }],
  [['Eyes-closed pound · left', 3, '30 s', 'dribble', 'Close your eyes and keep a steady knee-height pound by feel. | Open your eyes and reset if the ball drifts.', 15, '', foamL, 30], { gate: 'now', family: 'pound-knee', rung: 1, equipment: ['foam ball'], side: 'left', range: [30, 45] }],
  [['Three-height pound ladder · left', 3, '30 s', 'dribbleHigh', 'Five pounds at the ankle, five at the knee, five at the shoulder, then back down without stopping. | Avoid letting the ball leave your stance.', 15, '', foamL, 30], { gate: 'now', family: 'pound-high', rung: 1, equipment: ['foam ball'], side: 'left', range: [30, 45] }],
  [['In-and-out dribble · left', 3, '30 s', 'vSide', 'Push the ball toward your middle, then snap it back outside with the hand on top, like a fake crossover. | Avoid carrying the ball.', 15, '', foamL, 30], { gate: 'now', family: 'v-side', rung: 1, equipment: ['foam ball'], side: 'left', range: [30, 45] }],
  [['Wall toss + dribble · left', 3, '30 s', 'dual', 'Dribble left while tossing the tennis ball off the wall with the same hand, catching it in rhythm. | Reset if the timing breaks. Never reach with the right hand.', 15, '', 'Foam ball + tennis ball · left only', 30], { gate: 'now', family: 'toss-combo', rung: 1, equipment: ['foam ball', 'tennis ball', 'wall'], side: 'left', range: [30, 45] }],
  [['Wall fingertip taps · left', 3, '30 s', 'toss', 'Hold the ball on the wall at head height and tap it up and down fast with the left fingertips. | Avoid pushing with the palm.', 15, '', foamL, 30], { gate: 'now', family: 'react-left', rung: 1, equipment: ['foam ball', 'wall'], side: 'left', range: [30, 45] }],
  [['One-hand drop and catch · left', 3, '10', 'toss', 'Hold the tennis ball at shoulder height, palm down, let go, and snatch it before it passes your waist. | Avoid scooping from below.', 15, '', 'Tennis ball · left hand'], { gate: 'now', family: 'react-left', rung: 1, equipment: ['tennis ball'], side: 'left', range: [10, 20] }],
  [['Reaction toss off the wall · left', 3, '30 s', 'toss', 'Toss the tennis ball at the wall from your stance and catch it left-handed wherever it comes back. Vary the angle. | Avoid stepping out of your lane.', 15, '', 'Tennis ball · left hand', 30], { gate: 'now', family: 'react-left', rung: 1, equipment: ['tennis ball', 'wall'], side: 'left', range: [30, 45] }],
  // Right-hand ladder after the light right-hand OK: soft, never faster than your left-hand pace, stop at 2/10 pain.
  [['Right-hand low pound', 2, '20 s', 'dribbleLow', 'Soft, low pounds at ankle height with the foam ball. Match or stay slower than your left-hand pace. | Stop at 2/10 pain. Avoid hard slaps.', 30, '', foamR, 20], { gate: 'light', family: 'rh-dribble', rung: 1, equipment: ['foam ball'], side: 'right', range: [20, 30] }],
  [['Right-hand knee-height pound', 2, '30 s', 'dribble', 'Knee-height pounds with a relaxed wrist and fingertip control. | Stop at 2/10 pain or if the rhythm breaks.', 30, '', foamR, 30], { gate: 'light', family: 'rh-dribble', rung: 2, equipment: ['foam ball'], side: 'right', range: [20, 40] }],
  [['Right-hand pocket pull-back', 2, '30 s', 'gather', 'Pound, then pull the ball back into the right hip pocket and pound again. | Stop at 2/10 pain.', 30, '', foamR, 30], { gate: 'light', family: 'rh-dribble', rung: 3, equipment: ['foam ball'], side: 'right', range: [20, 40] }],
  [['Right-hand front-to-back V', 2, '30 s', 'vDribble', 'Push the ball forward and pull it back beside the right foot with the fingertips. | Avoid reaching outside your stance.', 30, '', foamR, 30], { gate: 'light', family: 'rh-dribble', rung: 4, equipment: ['foam ball'], side: 'right', range: [20, 40] }],
  [['Right-hand side V / in-and-out', 2, '30 s', 'vSide', 'Rock the ball across in front of you and back with the hand on top. | Avoid carrying the ball.', 30, '', foamR, 30], { gate: 'light', family: 'rh-dribble', rung: 5, equipment: ['foam ball'], side: 'right', range: [20, 40] }],
  [['Right-hand dribble + tennis ball toss', 2, '30 s', 'dual', 'Mirror the left drill: dribble right, then toss and catch the tennis ball with the same hand. Start with one low toss. | Never lunge to save a ball.', 30, '', 'Foam ball + tennis ball · right only', 30], { gate: 'light', family: 'rh-dribble', rung: 6, equipment: ['foam ball', 'tennis ball'], side: 'right', range: [20, 40] }],
  [['Wall fingertip taps · right', 2, '20 s', 'toss', 'Tap the ball up and down the wall at head height with soft right fingertips. | Stop at 2/10 pain.', 20, '', foamR, 20], { gate: 'light', family: 'react-right', rung: 1, equipment: ['foam ball', 'wall'], side: 'right', range: [20, 40] }],
  [['One-hand drop and catch · right', 2, '8', 'toss', 'Drop the tennis ball from shoulder height and catch it softly with the right hand before your waist. | Avoid grabbing hard.', 20, '', 'Tennis ball · right hand'], { gate: 'light', family: 'react-right', rung: 1, equipment: ['tennis ball'], side: 'right', range: [8, 15] }],
  [['Around-the-world wraps', 2, '30 s', 'wrap', 'Pass the ball around the waist, then the head, then each knee, hand to hand. | Avoid slapping the ball into the right hand.', 20, '', foam2, 30], { gate: 'light', family: 'two-light', rung: 1, equipment: ['foam ball'], side: 'both', range: [20, 45] }],
  [['Fingertip ball slaps', 2, '30 s', 'wrap', 'Tip the ball quickly between your fingertips, moving from overhead down to the knees and back. | Avoid catching with the palms.', 20, '', foam2, 30], { gate: 'light', family: 'two-light', rung: 1, equipment: ['foam ball'], side: 'both', range: [20, 45] }],
  // Two-hand handles after surgeon clearance.
  [['Spider dribble', 3, '30 s', 'crossover', 'Ball between the feet: tap right, left in front, then right, left behind, fingertips only. | Avoid standing up tall.', 15, '', foam2, 30], { gate: 'phase1', family: 'two-cross', rung: 1, equipment: ['foam ball'], side: 'both', range: [30, 45] }],
  [['Kill-crossover reset', 3, '30 s', 'crossover', 'Hard low crossover, kill the dribble into a two-hand pocket hold, reset, and go again. | Avoid crossing above the knee.', 15, '', foam2, 30], { gate: 'phase1', family: 'two-cross', rung: 1, equipment: ['foam ball'], side: 'both', range: [30, 45] }],
  [['Stationary between-the-legs', 3, '30 s', 'weave', 'In a wide stance, push the ball between the legs front to back and switch the lead foot. | Avoid hitting your leg or bending over.', 15, '', foam2, 30], { gate: 'phase1', family: 'two-cross', rung: 1, equipment: ['foam ball'], side: 'both', range: [30, 45] }],
  [['Stationary behind-the-back', 3, '30 s', 'wrap', 'Wrap the ball behind the hips hand to hand off one bounce. | Avoid twisting the right wrist to save a bad bounce.', 15, '', foam2, 30], { gate: 'phase1', family: 'two-wrap', rung: 1, equipment: ['foam ball'], side: 'both', range: [30, 45] }],
  [['Figure-8 dribble', 3, '30 s', 'weave', 'Dribble a figure 8 around and through the legs, switching hands each loop. | Keep the dribbles low.', 15, '', foam2, 30], { gate: 'phase1', family: 'two-wrap', rung: 1, equipment: ['foam ball'], side: 'both', range: [30, 45] }],
  [['Two-ball same-time pound', 3, '30 s', 'dribble', 'Foam ball in the right hand, basketball in the left. Pound both together at knee height. | Avoid letting the right ball rush the left.', 15, '', 'Foam ball + basketball', 30], { gate: 'phase1', family: 'two-ball', rung: 1, equipment: ['foam ball', 'basketball'], side: 'both', range: [30, 45] }],
  [['Two-ball alternating pound', 3, '30 s', 'dribble', 'Alternate the two balls like pistons, one up while the other is down. | Avoid an uneven rhythm.', 15, '', 'Foam ball + basketball', 30], { gate: 'phase1', family: 'two-ball', rung: 2, equipment: ['foam ball', 'basketball'], side: 'both', range: [30, 45] }],
  [['Two-ball high-low', 3, '30 s', 'dribbleHigh', 'One ball pounds low while the other pounds shoulder high, then switch. | Avoid looking down.', 15, '', 'Foam ball + basketball', 30], { gate: 'phase1', family: 'two-ball', rung: 3, equipment: ['foam ball', 'basketball'], side: 'both', range: [30, 45] }],
])
export const leftHandles = [...foamRows, slot(handleDrills, 'react-left')]
export const rightHandles = ['rh-dribble', 'react-right', 'two-light'].map(family => slot(handleDrills, family))
export const expansion = [...expansionBase, slot(handleDrills, 'two-ball')]

/* Forearm size and grip strength: hypertrophy doses (2–4 × 10–20 reps or 20–45 s holds), loaded 3× a week.
   Left-arm work also helps the right arm keep its strength (cross-education). */
export const gripDrills = more(grip, [
  [['Wrist curl · left', 3, '15', 'wrist', 'Forearm on the bench, palm up, dumbbell in the left hand. Let it roll to the fingertips, then curl the wrist up and squeeze. | Avoid lifting the forearm off the bench.', 45, '2-0-1', left], { gate: 'now', family: 'flexors-left', rung: 1, equipment: ['dumbbell', 'bench'], side: 'left', range: [12, 20] }],
  [['Reverse wrist curl · left', 3, '12', 'wrist', 'Forearm on the bench, palm down. Lift the back of the hand, pause, and lower slowly. Choke up on the handle if it is too heavy. | Avoid swinging or lifting the elbow.', 45, '2-1-2', left], { gate: 'now', family: 'extensors-left', rung: 1, equipment: ['dumbbell', 'bench'], side: 'left', range: [10, 20] }],
  [['Hammer curl · left', 3, '10', 'curl', 'Thumb up, elbow pinned to your side. Curl to the shoulder and lower for three seconds. | Avoid swinging the body.', 45, '1-0-3', left], { gate: 'now', family: 'curls-left', rung: 1, equipment: ['dumbbell'], side: 'left', range: [8, 15] }],
  [['Reverse curl · left', 3, '10', 'curl', 'Palm down, elbow at your side. Curl up and lower slowly to build the top of the forearm. | Avoid letting the wrist bend back.', 45, '1-0-3', left], { gate: 'now', family: 'curls-left', rung: 1, equipment: ['dumbbell'], side: 'left', range: [8, 15] }],
  [['Farmer hold · left', 3, '30 s', 'farmerCarry', 'Stand tall with the dumbbell at your left side and crush the handle. Keep the shoulders level. | Avoid leaning toward the weight.', 45, '', left, 30], { gate: 'now', family: 'holds-left', rung: 1, equipment: ['dumbbell'], side: 'left', range: [30, 60] }],
  [['Towel thick-grip hold · left', 3, '25 s', 'farmerCarry', 'Wrap a towel around the handle to make it thick, then hold the dumbbell at your side and squeeze hard. | Avoid letting the wrist bend.', 45, '', left, 25], { gate: 'now', family: 'holds-left', rung: 1, equipment: ['dumbbell', 'towel'], side: 'left', range: [20, 45] }],
  [['Dumbbell-head pinch hold · left', 3, '20 s', 'farmerCarry', 'Pinch one end of the dumbbell between the thumb and flat fingers and hold it at your side. | Avoid curling the fingers into a fist.', 45, '', left, 20], { gate: 'now', family: 'holds-left', rung: 1, equipment: ['dumbbell'], side: 'left', range: [15, 40] }],
  [['Leverage pronation / supination · left', 2, '10', 'rotate', 'Elbow bent at your side, hold the dumbbell by one end like a hammer. Turn the palm down, then up, slowly. Choke up to make it easier. | Avoid moving the elbow away from the body.', 45, '2-0-2', left], { gate: 'now', family: 'rotation-left', rung: 1, equipment: ['dumbbell'], side: 'left', range: [8, 15] }],
  [['Leverage radial / ulnar deviation · left', 2, '12', 'deviate', 'Arm at your side, hold the dumbbell by one end, thumb up. Tip the free end up in front, then back behind you. | Avoid bending the elbow.', 45, '2-0-2', left], { gate: 'now', family: 'rotation-left', rung: 1, equipment: ['dumbbell'], side: 'left', range: [10, 15] }],
  [['Fingertip claw ball hold · left', 2, '20 s', 'grip', 'Grab the foam ball from above with only the fingertips and thumb spread wide, and squeeze. | Avoid letting the palm touch the ball.', 30, '', foamL, 20], { gate: 'now', family: 'claw-left', rung: 1, equipment: ['foam ball'], side: 'left', range: [15, 40] }],
  [['Basketball claw hold · left', 2, '20 s', 'grip', 'Hold a basketball from above with spread fingertips, arm straight down, and squeeze. This is the palming grip. | Avoid cupping it with the palm.', 30, '', 'Basketball · left hand', 20], { gate: 'now', family: 'claw-left', rung: 2, equipment: ['basketball'], side: 'left', range: [15, 45] }],
  // Right arm after the light right-hand OK: soft grip and wrist work, never through 2/10 pain.
  [['Light putty squeeze · right', 3, '12', 'grip', 'Squeeze the putty with the whole right hand for a slow count of two, then open fully. Effort 3/10. | Stop at 2/10 pain.', 30, '', 'Putty · right hand'], { gate: 'light', family: 'grip-right', rung: 1, equipment: ['putty'], side: 'right', range: [10, 20] }],
  [['Light gripper squeeze · right', 3, '10', 'grip', 'Use the lightest gripper. Close it slowly, hold one second, and open slowly. | Avoid forcing a full close or any pain.', 30, '', 'Hand gripper · lightest'], { gate: 'light', family: 'grip-right', rung: 1, equipment: ['hand gripper'], side: 'right', range: [8, 15] }],
  [['Light towel wring · right', 2, '6 / direction', 'rotate', 'Hold a rolled towel in both hands and wring it gently one way, then the other, with the right hand leading softly. | Avoid hard twisting.', 30, '', 'Towel'], { gate: 'light', family: 'grip-right', rung: 1, equipment: ['towel'], side: 'right', range: [5, 10] }],
  [['Gentle rice bucket · right', 2, '30 s', 'rotate', 'Bury the right hand in rice. Slowly open and close it, then turn the wrist side to side. Effort 3/10. | Avoid digging hard or twisting fast.', 30, '', 'Rice bucket', 30], { gate: 'light', family: 'wrist-right', rung: 1, equipment: ['rice bucket'], side: 'right', range: [30, 60] }],
  [['Fingertip ball taps · right', 2, '30 s', 'dribbleLow', 'Bounce the foam ball softly off the floor using only the right fingertips, low and slow. | Avoid slapping with the palm.', 20, '', foamR, 30], { gate: 'light', family: 'wrist-right', rung: 1, equipment: ['foam ball'], side: 'right', range: [20, 45] }],
  // Right arm after surgeon clearance: progressive load, starting light.
  [['Wrist curl · right', 3, '12', 'wrist', 'Forearm on the bench, palm up. Start with a water bottle or the lightest load your surgeon cleared, and curl the wrist up slowly. | Avoid any pain at the plate.', 45, '2-0-2', 'Cleared load · start light'], { gate: 'phase1', family: 'wrist-right', rung: 2, equipment: ['bench'], side: 'right', range: [10, 20] }],
  [['Wrist roller', 2, '3 rolls', 'wrist', 'Hold the stick at shoulder height with straight arms, roll the bottle up, then lower it by rolling back slowly. | Avoid shrugging or locking the elbows.', 60, '', 'DIY roller · water bottle'], { gate: 'phase1', family: 'wrist-right', rung: 2, equipment: ['wrist roller'], side: 'both', range: [2, 5] }],
  [['Full rice bucket · right', 3, '45 s', 'rotate', 'Dig, grab, twist and spread the right hand hard in the rice for the full time. | Stop if the plate area aches.', 45, '', 'Rice bucket', 45], { gate: 'phase1', family: 'wrist-right', rung: 2, equipment: ['rice bucket'], side: 'right', range: [30, 60] }],
  [['Hammer curl · right', 3, '10', 'curl', 'Thumb up, elbow pinned. Use the lightest cleared load and lower for three seconds. | Avoid swinging.', 45, '1-0-3', 'Cleared load · start light'], { gate: 'phase1', family: 'curls-right', rung: 1, side: 'right', range: [8, 15] }],
  [['Reverse curl · right', 3, '10', 'curl', 'Palm down, elbow at your side. Curl up and lower slowly with a light cleared load. | Avoid letting the wrist bend back.', 45, '1-0-3', 'Cleared load · start light'], { gate: 'phase1', family: 'curls-right', rung: 1, side: 'right', range: [8, 15] }],
  [['Zottman curl · right', 3, '8', 'curl', 'Curl up palm up, turn the palm down at the top, then lower slowly. | Avoid rushing the turn.', 45, '1-1-3', 'Cleared load · start light'], { gate: 'phase1', family: 'curls-right', rung: 1, side: 'right', range: [6, 12] }],
  [['Gripper progression · right', 3, '8', 'grip', 'Close the gripper fully for one to two seconds each rep. Move to the next spring only after 15 clean reps. | Avoid half reps or pain at the plate.', 60, '', 'Hand gripper'], { gate: 'phase1', family: 'grip-right', rung: 2, equipment: ['hand gripper'], side: 'right', range: [8, 15] }],
  [['Pinch hold · right', 3, '20 s', 'farmerCarry', 'Pinch one end of the cleared weight between the thumb and flat fingers and hold it at your side. | Avoid curling into a fist.', 45, '', 'Cleared load · start light', 20], { gate: 'phase1', family: 'grip-right', rung: 2, side: 'right', range: [15, 40] }],
  [['Farmer carry · right', 3, '30 s', 'farmerCarry', 'Hold the cleared load at your right side and walk slowly and tall. | Avoid leaning or shrugging.', 45, '', 'Cleared load · start light', 30], { gate: 'phase1', family: 'grip-right', rung: 2, side: 'right', range: [20, 60] }],
  // Phase 3+, zero pain only: palming and fingertip strength.
  [['Towel-grip farmer hold · both hands', 3, '30 s', 'farmerCarry', 'Wrap a towel around the handle, hold it with both hands in front of the hips, and crush the towel. Trains the towel-hang grip without a bar. | Stop if the plate area aches.', 60, '', '17 kg · towel grip', 30], { gate: 'phase3', family: 'grip-right', rung: 3, equipment: ['dumbbell', 'towel'], side: 'both', range: [20, 45], flag: true }],
  [['One-hand ball palm and pickup · right', 3, '5', 'pickup', 'Spread the right fingers on a basketball on the floor, grip with the fingertips, lift it to waist height, and set it down. | Avoid using the palm or jerking it up.', 60, '', 'Basketball · right hand'], { gate: 'phase3', family: 'grip-right', rung: 3, equipment: ['basketball'], side: 'right', range: [3, 10], flag: true }],
  [['Fingertip wall push-up', 3, '10', 'wallPress', 'Hands on the wall on spread fingertips, body straight. Lower and press away. | Avoid collapsing onto the palms.', 60, '', body], { gate: 'phase3', family: 'fingertip-pushup', rung: 1, equipment: ['wall'], side: 'both', range: [8, 15], flag: true }],
  [['Fingertip incline push-up', 3, '8', 'inclinePushup', 'Fingertips on the bench edge, body straight. Lower under control and press up. | Avoid sagging hips.', 60, '', body], { gate: 'phase3', family: 'fingertip-pushup', rung: 2, equipment: ['bench'], side: 'both', range: [6, 12], flag: true }],
  [['Fingertip floor push-up', 3, '6', 'pushup', 'On spread fingertips on the floor, lower as a unit and press up. Drop to the knees if needed. | Avoid letting the fingers flatten.', 60, '', body], { gate: 'phase3', family: 'fingertip-pushup', rung: 3, side: 'both', range: [5, 12], flag: true }],
])
/* One slot per family; the coach engine picks which member fills it. Two short blocks keep workouts reasonable:
   A on Monday and Friday, B on Wednesday. Holds and right-hand grip are in both. */
const gripSlots = (list: string[]) => list.map(family => slot(gripDrills, family))
export const gripRows = {
  A: gripSlots(['flexors-left', 'extensors-left', 'holds-left', 'claw-left', 'grip-right', 'wrist-right']),
  B: gripSlots(['curls-left', 'rotation-left', 'holds-left', 'curls-right', 'grip-right', 'fingertip-pushup']),
}

export const progression = [
  ['6', 'Learn the moves', '3 sets on strength blocks', 'About 60 contacts', 'Light bands'],
  ['7', 'Build volume', '4 sets on A blocks', 'About 80 contacts', 'Light bands'],
  ['8', 'Increase control', 'Top of rep ranges · 4 s lowering on squats and RDLs', '+1 set on B blocks', 'Slightly stronger band tension · right arm stays light'],
  ['6', 'Deload', '3 sets, normal tempo', 'About 50 contacts', 'Same as week 3'],
  ['8', 'Add pauses', '3 s front-rack pause · 1.5-rep split squats', 'Low-step depth jump after the drop', '+1 set on A blocks'],
  ['8–9', 'Build rebound', '3 s pause on squats and split squats', 'Second consecutive squat jump · about 100 contacts', 'Same as week 5'],
  ['9', 'Peak quality', '4 strength sets · 4 s on step-ups and RDLs', 'Full rest between jumps', 'Same as week 5'],
  ['6', 'Deload + retest', '2–3 sets · retest squat and calf reps', 'About 50 contacts · retest squat jump reach', 'Easy bands'],
]
export const phases = [
  { name: 'Pre-Clearance Foundation', span: 'Nov 2026 – Jan 2027', basketball: 'Left-hand foam-ball training · no games or contact', rows: [] as Exercise[] },
  { name: 'Controlled Re-entry', span: 'Weeks 1–2 after clearance', basketball: 'Stationary dribbling and close-range form shooting', rows: rows('ph1-', upper, [
    ['Incline bench push-up', 3, '10–12', 'inclinePushup', 'Hands on the edge of a secured bench, body in a straight line. | Stop if the forearm becomes symptomatic.', 60],
    ['Light dumbbell row or band row', 3, 'Per clearance', 'dbRow', 'Draw the elbow toward the hip within the cleared load and range. | Avoid twisting.', 60, '', '5–10 kg or band'],
    ['Light dumbbell press or band press', 3, 'Per clearance', 'press', 'Press smoothly within the clearance instructions. | Avoid exceeding the cleared load.', 60, '', '5–10 kg or band'],
    ['Progressed tennis ball grip', 1, 'Per clearance', 'grip', 'Increase grip work only within the clearance instructions. | Avoid forcing effort.', 45, '', 'Tennis ball'],
  ]) },
  { name: 'Strength Rebuild', span: 'Weeks 3–4 after clearance', basketball: 'Full handles, shooting off the move and non-contact drills', rows: rows('ph2-', upper, [
    ['Floor push-up', 3, '8–15', 'pushup', 'Lower as a unit and press the floor away within the cleared range. | Avoid elbow flare or sagging hips.', 60],
    ['Dumbbell bent-over row', 3, '10', 'bentRow', 'Hinge and pull the elbow to the hip. | Avoid rotating the chest.', 75, '', '17 kg within clearance'],
    ['Dumbbell floor press', 3, '10', 'press', 'Pause lightly as the upper arm meets the floor and press up. | Avoid bouncing at the bottom.', 75, '', '17 kg within clearance'],
    ['Farmer carry hold', 3, '20–30 s / hand', 'farmerCarry', 'Hold the dumbbell at your side, stand tall, and walk slowly without leaning. | Stop if the grip or forearm becomes symptomatic.', 60, '', '17 kg within clearance', 50],
  ]) },
  { name: 'Return to Contact', span: 'Weeks 5–6 after clearance', basketball: 'Controlled contact, then pickup games', rows: rows('ph3-', upper, [
    ['Alternating single-arm incline DB press', 3, '4–6', 'press', 'Press one arm at a time on a stable bench. | Avoid rotating under the load.', 75, '', '17 kg within clearance'],
    ['Single-arm kneeling DB overhead press', 3, '8–12', 'ohp', 'Brace in half-kneeling and press overhead in the cleared range. | Avoid extending the lower back.', 75, '', 'Cleared dumbbell load'],
    ['Dumbbell front raise', 3, '8–12', 'raise', 'Raise smoothly to the cleared height. | Avoid swinging the weight.', 60, '', 'Cleared dumbbell load'],
    ['Dumbbell pullover', 3, '10', 'pullover', 'Lie on the bench, hold the dumbbell over the chest with both hands, and lower it behind the head with long arms. | Avoid arching the back or forcing shoulder range.', 75, '', 'Cleared dumbbell load'],
  ]) },
  { name: 'Full Return', span: 'Week 7+ after clearance', basketball: 'Full games and leagues within clearance', rows: rows('ph4-', upper, [
    ['Full push-up variations', 3, 'Programmed reps', 'pushup', 'Use a cleared variation and keep the body aligned. | Avoid changing volume and difficulty together.'],
    ['Single-arm dumbbell row · heavy', 3, 'Programmed reps', 'dbRow', 'Row from a split stance with a brace through the trunk. | Avoid jerking the weight.', 75, '', 'Cleared dumbbell load'],
    ['Progressive dumbbell row and press', 3, 'Programmed reps', 'bentRow', 'Use rows and presses at the programmed load. | Avoid jumping beyond your cleared progression.', 75, '', 'Cleared dumbbell load'],
  ]) },
]
phases.forEach((phase, index) => phase.rows.forEach(item => { item.gate = gates[index + 1] }))

export const redFlags = [
  'Pain that wakes you at night',
  'Swelling, warmth, redness, fever, or a change at the scar',
  'Clicking, grinding, shifting, or a change in arm shape',
  'Numbness, tingling, or new weakness in the hand or fingers',
  'New or increasing plate-area pain, or pain that lasts more than 24 hours',
  'Any fall, especially onto the right arm, even if it feels fine',
]

export const mindset = [
  ['Jeremiah 29:11', '“Thoughts of peace, and not of evil, to give you an expected end.”', 'What can I do faithfully today while the future is still unclear?'],
  ['Philippians 4:6–7', '“Let your requests be made known unto God. And the peace of God … shall keep your hearts and minds.”', 'What worry can I name and bring into prayer before training?'],
  ['Proverbs 3:5–6', '“Trust in the LORD with all thine heart … and he shall direct thy paths.”', 'What would trusting the process change about today’s effort?'],
  ['Isaiah 40:31', '“They that wait upon the LORD shall renew their strength.”', 'Where can I practice patience with the pace of recovery?'],
  ['Romans 8:28', '“All things work together for good to them that love God.”', 'What has recovery taught me that I can carry back to the court?'],
  ['Matthew 6:34', '“Take therefore no thought for the morrow.”', 'What is the next action I can finish today?'],
  ['1 Peter 5:7', '“Casting all your care upon him; for he careth for you.”', 'Which pressure am I carrying alone?'],
  ['Joshua 1:9', '“Be strong and of a good courage … for the LORD thy God is with thee.”', 'How can I show courage through restraint today?'],
  ['James 1:2–4', '“The trying of your faith worketh patience.”', 'Where am I becoming more consistent through this setback?'],
  ['Psalm 37:4–5', '“Commit thy way unto the LORD; trust also in him.”', 'What would it look like to commit to this session and let go of the score?'],
]
export const quotes = [
  'The patient reps still count.',
  'Your off-hand gets better one clean rebound at a time.',
  'The comeback starts with showing up for the work you can do today.',
  'Discipline includes putting the weight down on time.',
  'Strong legs, quiet landings, healthy forearm. That is the job.',
  'Every rehab set is a deposit for the first game back.',
  'You do not rise to the moment. You fall back on the reps you banked.',
  'Small, boring, consistent. That is how comebacks are built.',
]
