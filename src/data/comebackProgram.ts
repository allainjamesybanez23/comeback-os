export const categories = [
  'Lower Strength', 'Upper Band Strength', 'Plyometrics & Speed', 'Forearm Rehab',
  'Dynamic Warm-Up', 'Mobility & Stretching', 'Core & Isometrics', 'Dorm Conditioning',
  'Silent Foam Ball Handles', 'FLAG (Forearm Load Warning)',
] as const

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
  minPhase?: number
  adjustment?: string
}
export type Section = { id: string; name: string; duration?: string; rows: Exercise[] }
export type Day = { name: string; title: string; focus: string; level: 'Hard' | 'Moderate' | 'Easy'; minutes: number; main: Exercise[] }

const [lower, upper, plyo, rehab, warm, mobility, core, conditioning, handles] = categories
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

export const warmUp = rows('warm-', warm, [
  ['Jumping jacks / jog in place', 1, '2 min', 'jack', 'Build heat with an easy jog or quiet jacks. Keep the right arm relaxed. | Avoid forcing overhead arm swings.', 0, '', body, 120],
  ['Leg swings', 1, '10 / leg each way', 'swing', 'Use left-hand wall support. Swing front to back, then side to side. | Keep the torso still and avoid forcing the arc.'],
  ['Reverse lunge with rotation', 1, '6 / side', 'lunge', 'Step back, lower, and turn gently toward the front leg. | Keep hands off the floor and the front knee tracking forward.'],
  ['90/90 hip switches', 1, '8 / side', 'switch', 'Sit tall with bent knees and rotate both knees to the opposite side. | Avoid leaning into the right hand.'],
  ['Banded lateral + monster walk', 2, '5 steps each way', 'shuffle', 'Place the band above the knees. Stay low for side steps and diagonal walks. | Do not drag the trailing foot.', 0, '', 'Band above knees'],
  ['Ankle rocks', 1, '10 / side', 'rock', 'From half-kneeling, push the front knee forward with heel down. | Avoid collapsing the foot inward.'],
  ['A-skips + pogo hops', 2, '20 s + 10 hops', 'skip', 'Raise alternating knees in place, then spring lightly through the ankles. | Keep landings soft and controlled.', 0, '', body, undefined, 20],
])

export const rehabRows = rows('rehab-', rehab, [
  ['Wrist flexion / extension', 2, '15', 'wrist', 'With your forearm supported, slowly bend and extend the wrist through your allowed range. | Avoid a load or forcing end range.', 0, '2-0-2', 'No weight'],
  ['Supination / pronation', 2, '15', 'rotate', 'Keep the elbow by your side and slowly turn palm up then down within your approved range. | Avoid swinging the elbow or increasing the prescribed resistance.', 0, '2-0-2', 'Water bottle · rehab only'],
  ['Radial / ulnar deviation', 2, '15', 'deviate', 'With thumb up and forearm supported, move the wrist gently side to side. | Avoid turning the whole forearm.', 0, '2-0-2', 'No weight'],
  ['Tennis ball squeeze', 3, '10 × 3 s', 'grip', 'Gently squeeze, hold three seconds, then fully relax. Week 1 effort is at most 2/10. | Avoid maximal grip or prolonged holds.', 0, '', 'Tennis ball'],
  ['Band wrist extension / flexion', 2, '15', 'wrist', 'With the forearm supported, move the wrist against the lightest tension. | Avoid moving the elbow or working through pain.', 0, '2-0-2', 'Lightest band'],
  ['Finger extension vs band', 2, '15', 'grip', 'Place the band around fingertips and slowly spread them. | Avoid flicking or snapping the band.', 0, '', 'Lightest band'],
  ['Tennis ball wall toss and catch', 2, '1 min', 'toss', 'Use soft, close-range tosses. Practice left-only and keep any prescribed right-hand work soft. | Avoid fast rebounds or firm right-hand catches.', 0, '', 'Tennis ball', 60],
  ['Prayer / reverse-prayer stretch', 2, '20 s each', 'prayer', 'Bring palms together, then backs of hands together, using gentle pressure. | Avoid leaning your weight into the right wrist.', 0, '', 'Gentle stretch', 40],
])

export const dailyMobility = rows('mob-', mobility, [
  ['90/90 hip switches', 1, '10 total', 'switch', 'Rotate both knees between seated 90/90 positions. | Use left-hand support only if needed.'],
  ['90/90 side reach', 1, '5 / side × 2 s', 'sideReach', 'Reach the left arm overhead as the torso bends from the ribs. | Avoid loading the right hand.'],
  ['90/90 back-knee lift-off', 1, '5 / side', 'lift', 'Sit tall in 90/90 and lift the back knee without rolling your pelvis. | Avoid compensating by leaning sideways.'],
  ['Half-kneeling hip flexor stretch', 1, '45 s / side', 'kneel', 'Squeeze the glute of the down leg and reach gently overhead with the left arm. | Avoid arching the lower back.', 0, '', body, 90],
  ['Ankle rocks + elevated lunge hold', 1, '10 rocks + 30 s / side', 'rock', 'Rock forward, then hold with the heel down and knee forward. | Avoid rolling the foot inward.'],
  ['Deep squat pry hold', 1, '60 s', 'squat', 'Sit between the hips. Use the left hand on a door frame if needed. | Avoid letting your heels lift.', 0, '', body, 60],
  ['Cossack squat', 1, '5 / side', 'sideLunge', 'Shift toward one bent leg while the other leg stays extended. | Avoid forcing depth or lifting the working heel.'],
  ['Seated straight-leg lift over pillow', 1, '10 / side', 'lift', 'Sit upright and lift the straight leg up and over the pillow. | Avoid momentum or leaning on the right hand.'],
  ['Side-lying open book', 1, '8 / side', 'book', 'Stack bent knees and open the upper arm, letting the eyes follow. | Keep the knees stacked.'],
  ['Band pass-through', 1, '10', 'pass', 'Use a wide grip and the lightest band within approved range. | Avoid forcing the band behind you.', 0, '', 'Lightest band'],
  ['Tennis ball foot roll', 1, '1 min / foot', 'roll', 'Roll the ball under the arch with comfortable pressure. | Avoid painful pressure or losing balance.', 0, '', 'Tennis ball', 120],
])
export const sundayMobility = rows('sun-mob-', mobility, [
  ['Couch stretch', 1, '1 min / side', 'kneel', 'Put the back foot on a stable bench or bed and tuck the pelvis. | Avoid arching to create range.', 0, '', body, 120],
  ['Bench pigeon stretch', 1, '1 min / side', 'switch', 'Support the front shin on the bench and hinge gently. | Avoid twisting the knee.', 0, '', body, 120],
  ['Seated straddle reach', 1, '1 min', 'hinge', 'Sit with legs comfortably apart and hinge from the hips. | Avoid forcing a wider stance.', 0, '', body, 60],
  ['Wall calf stretch', 1, '45 s each / side', 'calf', 'Keep the heel down and repeat with straight and bent knees. | Use left-hand wall support if needed.', 0, '', body, 180],
  ['Toe yoga', 2, '10', 'toes', 'Lift the big toe independently, then switch to the other toes. | Keep the arch steady without clawing.'],
  ['Supported deep squat breathing', 2, '5 slow breaths', 'squat', 'Settle into the squat using left-hand support and breathe slowly. | Keep the right arm unloaded.'],
])
export const cooldown = rows('cool-', mobility, [
  ['Easy cooldown walk', 1, '3 min', 'walk', 'Walk easily and let your breathing settle. | Avoid turning the cooldown into another interval.', 0, '', body, 180],
  ['Couch stretch', 1, '30 s', 'kneel', 'Tuck your pelvis and relax into an easy hip-flexor stretch. | Avoid arching the back.', 0, '', body, 30],
  ['Hamstring stretch', 1, '30 s', 'hinge', 'Hinge gently at the hips over an extended leg. | Avoid bouncing into the stretch.', 0, '', body, 30],
  ['Calf stretch', 1, '30 s', 'calf', 'Keep the back heel down and lean forward gently. | Use left-hand support if needed.', 0, '', body, 30],
  ['Side-lying open book', 1, '30 s', 'book', 'Open through the upper back while the knees stay stacked. | Avoid pulling through the wrist.', 0, '', body, 30],
])

export const days: Day[] = [
  { name: 'Monday', title: 'Lower Strength A', focus: 'Squat + knee', level: 'Hard', minutes: 65, main: blocks('mon-', [
    ['A1', lower, ['Front-rack squat', 4, '10', 'squatRack', 'Rack one dumbbell on the left shoulder. Sit between the hips, then drive up tall. | Avoid leaning into the dumbbell or gripping it with the right hand.', 90, '3-1-1', left]],
    ['A2', plyo, ['Squat jump', 4, '5', 'jump', 'Dip, jump vertically, and land softly with hips and knees bending. | Avoid stiff or loud landings.', 90, '', body, undefined, 10]],
    ['B1', lower, ['Rear-foot elevated split squat', 3, '8 / leg', 'rfess', 'Put your rear foot on a stable bench and lower straight down. | Keep the front foot planted and the right hand unloaded.', 75, '3-0-1', left]],
    ['B2', core, ['Split squat isometric hold', 3, '30 s / leg', 'lunge', 'Settle into a split squat with the back knee just above the floor. | Avoid leaning onto the lead leg or using the right arm for support.', 75, '', left, 60]],
    ['C1', lower, ['Peterson step-up', 3, '12 / leg', 'step', 'Use a low step. Let the working knee move over the toes as you rise. | Avoid pushing off hard from the lower foot.', 60]],
    ['C2', lower, ['Reverse Nordic', 3, '6', 'nordic', 'Kneel on padding, brace, and lean back from the knees with hips extended. | Do not bend at the hips or force range.', 60]],
    ['D1', lower, ['Tibialis raise', 3, '20', 'toes', 'Lean your back against a wall and lift the toes with heels planted. | Avoid bouncing off the wall.', 45]],
    ['D2', lower, ['Single-leg calf raise', 3, '12 / leg', 'calf', 'Rise through the forefoot, pause for two seconds, then lower smoothly. | Avoid resting bodyweight on the supporting hand.', 45, '2-2-1', left]],
    ['E', core, ['Dead bug', 3, '10 / side', 'deadbug', 'On your back, keep your ribs down as you extend one leg. | Avoid arching the lower back or loading the right hand.', 45]],
  ]) },
  { name: 'Tuesday', title: 'Upper A', focus: 'Bands + core + Zone 2', level: 'Moderate', minutes: 60, main: blocks('tue-', [
    ['A1', upper, ['Band chest press', 3, '15', 'press', 'Lie on a stable bench with the band securely anchored underneath. Press up smoothly. | Avoid flaring elbows or using strong tension on the right.', 60, '2-1-2', light]],
    ['A2', upper, ['Band seated row', 3, '15', 'row', 'Sit tall, pull the elbows back, and squeeze the shoulder blades. | Avoid rocking the torso.', 60, '', light]],
    ['B1', upper, ['Half-kneeling single-arm band overhead press', 3, '12 / arm', 'ohp', 'Brace in half-kneeling and press up within approved range. Keep right-side tension light. | Avoid rib flare or leaning sideways.', 60, '', light]],
    ['B2', upper, ['Band face pull', 3, '15', 'rowHigh', 'Pull a secure band toward eye level with elbows high. | Avoid shrugging or jerking the band.', 60, '', light]],
    ['C1', upper, ['Wall push-up', 3, '15', 'wallPress', 'Only if pain-free and permitted: use the wall and keep the body aligned. | Stop if the forearm aches.', 45, '', body, undefined, undefined, true]],
    ['C2', upper, ['Band pull-apart', 3, '20', 'fly', 'Keep arms long and open the band in front of your chest. | Avoid shrugging or overextending the right wrist.', 45, '', light]],
    ['D', core, ['Hollow body hold + reverse crunch', 3, '25 s + 12', 'crunch', 'Hold a tucked hollow shape, then curl the pelvis up for reverse crunches. | Avoid letting the lower back peel off during the hold.', 45]],
    ['E', conditioning, ['Zone 2 cardio', 1, '20–25 min', 'walk', 'Use steady stair walking or step-ups at a pace where you can speak in full sentences. | Avoid turning this into a hard interval.', 0, '', body, 1200]],
  ]) },
  { name: 'Wednesday', title: 'Plyo + Speed', focus: 'Elasticity + acceleration', level: 'Hard', minutes: 60, main: blocks('wed-', [
    ['A1', plyo, ['Pogo hops', 3, '20', 'bounce', 'Bounce from the ankles with soft knees and short contacts. | Avoid loud landings or rushing tired reps.', 45, '', body, undefined, 40]],
    ['A2', plyo, ['Forward / back line hops', 3, '20 s', 'line', 'Hop just over a tape line forward and back. | Avoid reaching too far so you can land under control.', 45, '', body, 20]],
    ['A3', plyo, ['Lateral line hops', 3, '20 s', 'skate', 'Hop side to side over a short line. Stay springy through the forefoot. | Avoid uncontrolled side-to-side knee motion.', 45, '', body, 20]],
    ['B1', plyo, ['Squat jump · stick landing', 4, '3', 'jump', 'Jump vertically and hold the landing for two seconds. | Avoid rebounding before balance is established.', 60, '', body, undefined, 6]],
    ['B2', plyo, ['Depth drop from bench', 3, '5', 'drop', 'Step from a low, stable surface and land softly in a balanced stance. | Avoid high platforms or jumping off the bench.', 60, '', body, undefined, 10]],
    ['B3', plyo, ['Split squat jump', 3, '6 / leg', 'splitJump', 'Switch legs in the air and absorb each landing with bent knees. | Stop if you cannot land quietly and balanced.', 90, '', body, undefined, 24]],
    ['C1', plyo, ['Wall drive march', 3, '10 / leg', 'drive', 'If pain-free and permitted, use light forearm contact while marching one knee forward. | Avoid pressing bodyweight through the injured arm.', 45, '', body, undefined, undefined, true]],
    ['C2', plyo, ['Fast wall drive switches', 6, '6 / leg', 'drive', 'Switch knees quickly using only approved light wall contact. | Avoid loading the right forearm or losing trunk position.', 45, '', body, undefined, undefined, true]],
    ['C3', plyo, ['Lateral shuffle', 6, '10 s', 'shuffle', 'Stay low and take two quick steps each way. | Avoid crossing the feet.', 45, '', body, 10]],
    ['D', core, ['Band Pallof press', 3, '10 / side', 'pallof', 'Stand side-on to a secure band anchor and press without twisting. | Avoid letting the band turn your ribs.', 45, '', 'Band · light on right']],
  ]) },
  { name: 'Thursday', title: 'Lower Strength B', focus: 'Hinge + single-leg + ankles', level: 'Hard', minutes: 65, main: blocks('thu-', [
    ['A1', lower, ['Single-leg RDL', 4, '8 / leg', 'rdl', 'Root the stance foot and hinge, sending the free heel back while hips stay square. | Avoid opening the pelvis or loading the right hand.', 75, '3-1-1', left]],
    ['A2', core, ['Single-leg hamstring bridge hold', 4, '30 s / leg', 'bridge', 'Put one heel on the bench and lift the hips while keeping the ribs down. | Avoid arching to get higher.', 75, '', body, 60]],
    ['B1', lower, ['Step-up onto bench', 3, '8 / leg', 'step', 'Place the full foot on a stable bench and drive through the top leg. | Avoid springing off the floor foot.', 75, '2-0-1', left]],
    ['B2', lower, ['Lateral lunge', 4, '8 / leg', 'sideLunge', 'Step to the side, sit the hip back, and drive back to center. | Keep the working foot flat and the right hand unloaded.', 75, '', left]],
    ['C1', core, ['Wall sit', 3, '45 s', 'wallSit', 'Slide down against the wall until thighs are near parallel. | Keep feet planted and avoid pressing off with the right hand.', 60, '', body, 45]],
    ['C2', core, ['Adductor squeeze', 3, '30 s', 'adductor', 'Squeeze a ball or pillow between bent knees and breathe steadily. | Avoid lifting the hips or holding your breath.', 60, '', 'Ball or pillow', 30]],
    ['D1', lower, ['Banded ankle pumps', 3, '15 / side', 'toes', 'Place the band around the forefoot and move through the ankle. | Avoid turning the knee to move the band.', 30, '', light]],
    ['D2', mobility, ['Knee-elevated lunge hold', 2, '1 min / side', 'rock', 'Drive the knee gently forward with the heel down. | Avoid forcing the stretch or shifting onto the right hand.', 30, '', body, 120]],
    ['D3', core, ['Single-leg balance · eyes closed', 2, '30 s / leg', 'balance', 'Stand near a wall with left-hand support immediately available. | Open your eyes and reset if balance breaks.', 30, '', body, 60]],
    ['E', core, ['Band dead bug', 3, '8 / side', 'deadbug', 'Hold the overhead-anchored band with the left hand while alternating legs. | Avoid losing low-back contact.', 45, '', 'Light band · left hand']],
  ]) },
  { name: 'Friday', title: 'Upper B', focus: 'Bands + isometrics + core', level: 'Moderate', minutes: 60, main: blocks('fri-', [
    ['A1', upper, ['Half-kneeling single-arm band row', 3, '12 / arm', 'row', 'Stay tall and draw the elbow back toward your hip. | Avoid rotating to move more tension.', 60, '', light]],
    ['A2', upper, ['Band chest fly', 3, '15', 'fly', 'Use softly bent elbows and bring the hands together slowly. | Avoid letting the band snap back.', 60, '', light]],
    ['B1', upper, ['Kneeling band pulldown', 3, '12', 'pulldown', 'Use an approved high anchor and pull elbows to ribs. | Avoid leaning back or forcing range.', 60, '', light]],
    ['B2', upper, ['Band front raise', 3, '15', 'raise', 'Raise to eye level using a smooth shoulder motion. | Avoid shrugging or swinging.', 60, '', light]],
    ['C1', upper, ['Band reverse fly', 3, '15', 'fly', 'Open the arms in a wide arc and pause briefly. | Avoid arching the back or shrugging.', 45, '', light]],
    ['C2', upper, ['Band curl + triceps pushdown', 2, '15 each', 'curl', 'Keep elbows near the ribs during curls, then press the band down. | Avoid using heavy right-side tension.', 45, '', light]],
    ['D1', core, ['Spanish squat isometric hold', 3, '45 s', 'squat', 'Anchor the band behind the knees and sit back into a tall squat hold. | Avoid an unstable anchor or leaning forward.', 60, '', 'Band behind knees', 45]],
    ['D2', core, ['Single-leg calf raise isometric', 3, '30 s / leg', 'calf', 'Rise and hold at the top under control. Choose bodyweight if you need the left hand for balance. | Avoid supporting weight with the right arm.', 60, '', left, 60]],
    ['E', core, ['Side-lying leg raise + standing hip extension', 3, '12 / side', 'legRaise', 'Lift the top leg with stacked hips, then stand and extend the leg back. | Avoid twisting the pelvis or pushing through the right hand.', 45]],
  ]) },
  { name: 'Saturday', title: 'Lateral Plyo + COD', focus: 'Change of direction + dorm circuit', level: 'Hard', minutes: 70, main: blocks('sat-', [
    ['A', plyo, ['4-square hops', 1, '4 patterns × 2', 'square', 'Use a one-meter tape square. Repeat front/back, lateral, diagonal, and clockwise paths. | Avoid long or noisy landings.', 30]],
    ['B1', plyo, ['Short skater hops', 3, '5 / side', 'skate', 'Hop side to side, sticking each landing for two seconds. | Avoid reaching so far that the knee collapses inward.', 60, '', body, undefined, 10]],
    ['B2', plyo, ['Lateral line hops', 3, '20 s', 'skate', 'Hop briskly over a narrow line with quiet landings. | Keep the range small enough to control.', 60, '', body, 20]],
    ['C1', plyo, ['Mini shuffle-touch drill', 6, '10 s', 'touch', 'Shuffle across 1.5 meters and touch the tape with the left hand only. | Never reach with the injured arm.', 60, '', body, 10]],
    ['C2', plyo, ['Closeout + defensive slides', 1, '6', 'shuffle', 'Chop feet into a controlled closeout and slide twice each way. | Avoid crossing the feet or overstriding.', 45]],
    ['C3', plyo, ['Drop step + 2 explosive steps', 1, '6 / side', 'pivot', 'Open the hips with a drop step and take two sharp steps. | Avoid twisting on a fixed knee.', 45]],
    ['E', core, ['Band woodchop', 3, '10 / side', 'chop', 'Pull the band diagonally while rotating through hips and ribs. | Avoid torquing the right wrist.', 45, '', 'Band · light on right']],
  ]) },
  { name: 'Sunday', title: 'Easy Recovery', focus: 'Walk + long mobility + rehab', level: 'Easy', minutes: 60, main: blocks('sun-', [
    ['A', conditioning, ['Easy walk', 1, '25–30 min', 'walk', 'Walk at a relaxed pace and let breathing stay easy. | Avoid pushing pace on a recovery day.', 0, '', body, 1500]],
    ['B', mobility, ['Tennis ball foot roll', 1, '2 min / foot', 'roll', 'Roll gently under the arch, heel, and forefoot. | Avoid painful pressure.', 0, '', 'Tennis ball', 240]],
    ['E', conditioning, ['Weekly meal and schedule prep', 1, 'Plan the week', 'plan', 'Review your week, prepare meals, and set a bedtime. | Leave room in the schedule for recovery.']],
  ]) },
]

export const circuit = rows('circuit-', conditioning, [
  ['High knees', 1, '', 'skip', 'Drive alternating knees up in place with quiet steps. | Avoid leaning backward.'],
  ['Defensive stance quick feet', 1, '', 'shuffle', 'Stay low and chop your feet in place. | Avoid letting your stance narrow.'],
  ['Skater hops', 1, '', 'skate', 'Travel a short distance from foot to foot. Land softly. | Avoid overshooting your balance.'],
  ['Lateral shuffle', 1, '', 'shuffle', 'Go two steps each way from a stable stance. | Avoid crossing feet.'],
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
  ['Low ankle pounds', 3, '30 s', 'dribbleLow', 'Pound the foam ball firmly with left fingertips below the knee. | Avoid chasing the ball beyond your training space.', 0, '', 'Foam ball · left hand', 30],
  ['Knee-height pounds', 3, '30 s', 'dribble', 'Stay in your stance and snap the left wrist to a consistent knee-height rebound. | Avoid letting the ball travel outside your stance.', 0, '', 'Foam ball · left hand', 30],
  ['Shoulder-height pounds', 3, '30 s', 'dribbleHigh', 'Drive the foam ball down with the left hand and meet the higher rebound. | Keep the right arm out of the drill.', 15, '', 'Foam ball · left hand', 30],
  ['Front-to-back V-dribbles', 3, '30 s', 'vDribble', 'Use the left fingertips to send the ball forward and back beside the hip. | Keep the rebound within your one-meter lane.', 0, '', 'Foam ball · left hand', 30],
  ['Side-to-side V-dribbles', 3, '30 s', 'vDribble', 'Roll the left hand around the ball to create a tight side-to-side V. | Avoid catching and carrying the ball.', 0, '', 'Foam ball · left hand', 30],
  ['Hip-pocket pull-back + head fake', 3, '30 s', 'gather', 'Show the fake with your eyes, then pull the rebound beside the left hip. | Avoid turning the fake into a large step.', 0, '', 'Foam ball · left hand', 30],
  ['Seated / kneeling figure-8 weave', 3, '30 s', 'weave', 'Use short left-hand taps around or under the legs. Reset between loops as needed. | Keep right-hand support out of the drill.', 0, '', 'Foam ball · left hand', 30],
  ['Left dribble + tennis ball toss', 4, '30 s', 'dual', 'Dribble left, briefly toss and catch the tennis ball with the same hand during the foam-ball rebound, then resume the dribble. Start with a single low toss. | Reset if the timing breaks. Do not reach with the right hand to save either ball.', 0, '', 'Foam ball + tennis ball · left only', 30],
  ['Silent wall tap + high-pickup footwork', 3, '10 / side', 'gather', 'Jab or drop-step, pound the foam ball, and gather into the left pocket. | Keep the feet and ball inside the two-meter square.', 0, '', 'Foam ball · left hand'],
])
for (let i = 0; i < 3; i++) foamRows[i].block = 'A' + (i + 1)
export const expansion = rows('foam-next-', handles, [
  ['Two-hand crossover', 3, '30 s', 'vDribble', 'Use alternating hands in a low crossover within the cleared range. | Avoid reaching outside your base.', 15, '', 'Foam ball · both hands', 30],
  ['Behind-the-back wrap', 3, '30 s', 'weave', 'Wrap close to the hips and receive softly with the opposite hand. | Avoid forcing shoulder or wrist range.', 15, '', 'Foam ball · both hands', 30],
  ['Right-hand symmetry drill', 3, '30 s', 'dribble', 'Mirror the left-hand drill at the cleared pace, stopping if symptoms appear. | Avoid chasing pace or rebound height.', 15, '', 'Foam ball · right hand', 30],
]).map(item => ({ ...item, minPhase: 1 }))

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
    ['Incline bench push-up', 3, '10–12', 'wallPress', 'Use a secured bench and a straight body line. | Stop if the forearm becomes symptomatic.', 60],
    ['Light dumbbell row or band row', 3, 'Per clearance', 'row', 'Draw elbow toward the hip within the cleared load and range. | Avoid twisting.', 60, '', '5–10 kg or band'],
    ['Light dumbbell press or band press', 3, 'Per clearance', 'press', 'Press smoothly within the clearance instructions. | Avoid exceeding the cleared load.', 60, '', '5–10 kg or band'],
    ['Progressed tennis ball grip', 1, 'Per clearance', 'grip', 'Increase grip work only within the clearance instructions. | Avoid forcing effort.', 45, '', 'Tennis ball'],
  ]) },
  { name: 'Strength Rebuild', span: 'Weeks 3–4 after clearance', basketball: 'Full handles, shooting off the move and non-contact drills', rows: rows('ph2-', upper, [
    ['Floor push-up', 3, '8–15', 'pushup', 'Lower as a unit and press the floor away within cleared range. | Avoid elbow flare or sagging hips.', 60],
    ['Dumbbell bent-over row', 3, '10', 'bentRow', 'Hinge and pull the elbow to the hip. | Avoid rotating the chest.', 75, '', '17 kg within clearance'],
    ['Dumbbell floor press', 3, '10', 'press', 'Pause lightly as the upper arm meets the floor and press up. | Avoid bouncing at the bottom.', 75, '', '17 kg within clearance'],
    ['Short dead hang', 3, '10–20 s', 'hang', 'Take a secure grip only if hanging is cleared and unload under control. | Avoid dropping off the bar.', 60, '', body, 10],
  ]) },
  { name: 'Return to Contact', span: 'Weeks 5–6 after clearance', basketball: 'Controlled contact, then pickup games', rows: rows('ph3-', upper, [
    ['Alternating single-arm incline DB press', 3, '4–6', 'press', 'Press one arm at a time on a stable incline bench. | Avoid rotating under the load.', 75, '', '17 kg within clearance'],
    ['Single-arm kneeling DB overhead press', 3, '8–12', 'ohp', 'Brace in kneeling and press overhead in the cleared range. | Avoid extending the lower back.', 75, '', 'Cleared dumbbell load'],
    ['Dumbbell front raise', 3, '8–12', 'raise', 'Raise smoothly to the cleared height. | Avoid swinging the weight.', 60, '', 'Cleared dumbbell load'],
    ['Band-assisted pull-up', 3, '5', 'hang', 'Use secure assistance and pull elbows down before lowering slowly. | Avoid kicking or dropping into the bottom.', 75, '', 'Assist band'],
  ]) },
  { name: 'Full Return', span: 'Week 7+ after clearance', basketball: 'Full games and leagues within clearance', rows: rows('ph4-', upper, [
    ['Full push-up variations', 3, 'Programmed reps', 'pushup', 'Use a cleared variation and maintain body alignment. | Avoid changing volume and difficulty together.'],
    ['Full pull-up', 3, 'Programmed reps', 'hang', 'Pull from a secure grip and lower with control. | Avoid swinging into repetitions.'],
    ['Progressive dumbbell row and press', 3, 'Programmed reps', 'row', 'Use rows and presses at the programmed load. | Avoid jumping beyond your cleared progression.', 75, '', 'Cleared dumbbell load'],
  ]) },
]
phases.forEach((phase, index) => phase.rows.forEach(item => { item.minPhase = index }))

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
]
