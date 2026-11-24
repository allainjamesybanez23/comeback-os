import { useEffect, useId, useState } from 'react'
import type { Exercise } from '../data/comebackProgram'

type Vec = [number, number]
type Joint = 'head' | 'shoulder' | 'hip' | 'le' | 'lh' | 're' | 'rh' | 'lk' | 'lf' | 'rk' | 'rf'
type Pose = Record<Joint, Vec>
const upright: Pose = {
  head:[143,36], shoulder:[140,64], hip:[139,113], le:[126,89], lh:[128,109], re:[157,88], rh:[152,104],
  lk:[126,150], lf:[121,194], rk:[156,150], rf:[164,194],
}
const squat: Partial<Pose> = { head:[150,67], shoulder:[145,92], hip:[128,140], le:[127,110], lh:[139,94], lk:[102,153], rk:[163,154] }
const kneel: Partial<Pose> = { hip:[139,132], lk:[105,151], lf:[103,191], rk:[151,191], rf:[183,194], head:[141,56], shoulder:[140,82], le:[125,107], lh:[130,126], re:[154,109], rh:[150,126] }
const lunge: Partial<Pose> = { head:[130,65], shoulder:[132,89], hip:[137,138], lk:[96,147], lf:[86,194], rk:[158,178], rf:[195,194], le:[118,122], lh:[115,145], re:[155,111], rh:[147,122] }
const split: Partial<Pose> = { ...upright, lf:[86,194], lk:[104,150], rf:[195,194], rk:[163,148] }
const seated: Partial<Pose> = { head:[103,94], shoulder:[105,120], hip:[107,180], lk:[155,165], lf:[175,192], rk:[142,181], rf:[187,194], le:[141,143], lh:[168,148], re:[120,147], rh:[126,160] }
const lying: Partial<Pose> = { head:[73,175], shoulder:[99,178], hip:[148,180], lk:[183,150], lf:[216,194], rk:[171,149], rf:[203,194], le:[118,152], lh:[116,125], re:[121,180], rh:[143,180] }
const lean: Partial<Pose> = { head:[95,65], shoulder:[111,83], hip:[144,114], le:[113,111], lh:[111,142], re:[135,93], rh:[147,102], lk:[141,150], lf:[143,194], rk:[185,116], rf:[218,111] }
const raised: Partial<Pose> = { le:[124,43], lh:[120,18] }
const handDown: Partial<Pose> = { le:[112,138], lh:[100,150] }
const dribbleBase: Partial<Pose> = { ...squat, le:[113,113], lh:[104,126], re:[157,110], rh:[150,120] }
const floating: Partial<Pose> = { head:[143,23], shoulder:[140,51], hip:[140,100], le:[120,75], lh:[114,97], re:[154,73], rh:[145,91], lk:[128,138], lf:[122,173], rk:[158,138], rf:[165,173] }
const wall: Partial<Pose> = { head:[98,50], shoulder:[111,74], hip:[141,120], lk:[162,157], lf:[182,194], rk:[171,157], rf:[191,194], le:[86,88], lh:[69,76], re:[119,95], rh:[112,107] }

type Motion = { from?: Partial<Pose>; to: Partial<Pose>; via?: Partial<Pose>; equipment?: 'bench' | 'wall' | 'band' | 'bar' | 'step' | 'tape' | 'floor'; ball?: 'low' | 'mid' | 'high' | 'wide' | 'toss' | 'dual' | 'foot' | 'hold'; caption: string }
const motions: Record<string, Motion> = {
  squatRack:{ from:{ le:[118,82],lh:[126,66] }, to:squat, caption:'Left rack · hips descend between the knees' },
  squat:{ to:{...squat,le:[106,101],lh:[85,96]}, caption:'Sit between the hips · keep the heels down' },
  wallSit:{ from:{...upright, lf:[101,194],rf:[117,194]}, to:{...squat,head:[175,73],shoulder:[179,102],hip:[179,146],lk:[108,146],rk:[119,148],lf:[101,194],rf:[117,194],le:[154,125],lh:[132,130]}, equipment:'wall',caption:'Back supported · thighs near level' },
  rdl:{ from:{rf:[163,176],rk:[153,150]},to:lean,caption:'Hips hinge · rear heel and torso counterbalance' },
  hinge:{ from:{...seated,lf:[212,192]},to:{...seated,head:[150,128],shoulder:[134,147],le:[165,148],lh:[184,165],lf:[212,192]},caption:'Reach from the hips' },
  lunge:{ from:split,to:lunge,caption:'Back knee lowers · front foot stays planted' },
  rfess:{ from:{...split,rf:[194,156]},to:{...lunge,rf:[194,156]},equipment:'bench',caption:'Rear foot elevated · descend straight down' },
  sideLunge:{ from:{lf:[91,194],rf:[191,194]},to:{...squat,hip:[103,128],lk:[91,160],lf:[91,194],rk:[151,160],rf:[191,194]},caption:'Sit toward the working leg · opposite leg stays long' },
  nordic:{ from:{...kneel,lk:[120,192],lf:[86,194]},to:{...kneel,lk:[120,192],lf:[86,194],hip:[140,147],shoulder:[166,106],head:[178,80]},caption:'Pivot from the knees with hips extended' },
  step:{ from:{...upright,lf:[194,155],lk:[171,134]},to:{...floating,head:[187,22],shoulder:[180,45],hip:[184,84],lk:[184,121],lf:[194,155],rk:[167,123],rf:[144,144]},equipment:'bench',caption:'Drive through the foot on the bench' },
  jump:{ from:squat,via:floating,to:{...squat,head:[145,75]},caption:'Load · jump · land softly' },
  bounce:{ from:upright,to:{...floating,lf:[121,182],rf:[164,182]},caption:'Short ankle-driven bounce' },
  line:{ from:upright,to:{...floating,hip:[155,109],lf:[144,178],rf:[180,178]}, equipment:'tape',caption:'Hop forward and back over a narrow line' },
  skate:{ from:{...squat,lf:[102,194],rf:[121,182]},via:floating,to:{...squat,hip:[171,133],lk:[138,151],lf:[147,181],rk:[183,157],rf:[191,194]},equipment:'tape',caption:'Short lateral hop · absorb the landing' },
  splitJump:{ from:lunge,via:floating,to:{...lunge,hip:[155,135],lk:[122,171],lf:[86,194],rk:[178,147],rf:[195,194]},caption:'Switch legs in the air' },
  drop:{ from:{...floating,head:[182,18],shoulder:[186,42],hip:[188,82],lk:[174,116],lf:[170,155],rk:[199,117],rf:[201,155]},via:{...floating,hip:[138,112]},to:squat,equipment:'bench',caption:'Step off a low surface · absorb the landing' },
  jack:{ from:{lf:[135,194],rf:[154,194]},to:{...raised,lf:[94,194],rf:[197,194]},caption:'Step or jump out lightly · right arm relaxed' },
  swing:{ from:{lk:[106,149],lf:[83,185],le:[97,75],lh:[73,91]},to:{lk:[171,118],lf:[205,126],le:[97,75],lh:[73,91]},caption:'Left-hand support · swing from the hip' },
  skip:{ from:{lk:[87,106],lf:[106,145],rh:[147,96]},to:{rk:[196,109],rf:[209,150],lh:[106,96]},caption:'Alternate a high knee and quiet foot contact' },
  walk:{ from:{lk:[115,153],lf:[96,194],rf:[183,192]},to:{lf:[183,192],rk:[122,152],rf:[96,194]},caption:'Alternate steady, controlled steps' },
  shuffle:{ from:{...squat,lf:[96,194],rf:[157,194]},to:{...squat,head:[175,74],hip:[170,135],lk:[150,153],rk:[195,152],lf:[127,194],rf:[205,194]},equipment:'tape',caption:'Stay low · keep the feet from crossing' },
  touch:{ from:squat,to:{...squat,head:[103,116],shoulder:[114,132],le:[100,158],lh:[91,190],hip:[138,132],lk:[100,154],lf:[78,194],rf:[187,194]},equipment:'tape',caption:'Touch the tape with the left hand only' },
  pivot:{ from:squat,to:{...upright,hip:[173,109],rk:[187,137],rf:[211,181],lk:[155,150],lf:[129,194]},caption:'Open the hips · drive into two short steps' },
  square:{ from:squat,to:{...floating,lk:[97,144],lf:[91,178],rk:[133,141],rf:[139,177]},equipment:'tape',caption:'Keep each landing inside your marked square' },
  drive:{ from:wall,to:{...wall,lk:[115,122],lf:[139,151]},equipment:'wall',caption:'Drive the knee with only permitted wall contact' },
  calf:{ from:{rf:[160,182],rk:[154,148]},to:{...floating,head:[143,28],shoulder:[140,56],hip:[139,105],lf:[127,194],lk:[132,147],rf:[156,175]},caption:'Rise through the forefoot' },
  toes:{ from:upright,to:{lk:[124,155],lf:[111,185],rf:[155,186]},caption:'Lift the toes with the heels supported' },
  rock:{ from:kneel,to:{...kneel,hip:[119,133],lk:[78,148],lf:[103,191],shoulder:[119,85],head:[118,61]},caption:'Knee moves ahead while the heel stays down' },
  kneel:{ from:kneel,to:{...kneel,head:[128,52],hip:[123,133],shoulder:[128,78],le:[109,52],lh:[100,27]},caption:'Tuck the pelvis and reach from the ribs' },
  sideReach:{ from:seated,to:{...seated,head:[129,100],shoulder:[117,126],le:[95,99],lh:[105,73]},caption:'Open the ribs with a gentle left-arm reach' },
  switch:{ from:seated,to:{...seated,lk:[137,159],lf:[191,181],rk:[149,185],rf:[177,161]},caption:'Rotate both bent knees together from the hips' },
  lift:{ from:{...seated,lf:[210,192]},to:{...seated,lk:[150,163],lf:[207,150]},caption:'Lift from the hip without leaning back' },
  book:{ from:{...lying,lh:[147,146]},to:{...lying,le:[80,139],lh:[63,113]},caption:'Open the upper arm while the knees stay stacked' },
  pass:{ from:{lh:[103,113],le:[119,87]},to:{...raised,lh:[153,16]},equipment:'band',caption:'Move a wide, light band within comfortable range' },
  roll:{ from:{lk:[116,153],lf:[91,189]},to:{lk:[135,156],lf:[106,189]},ball:'foot',caption:'Move slowly over the arch of the foot' },
  balance:{ from:upright,to:{rk:[171,140],rf:[157,169]},caption:'Balance on one foot · have left-hand support available' },
  bridge:{ from:{...lying,lf:[208,155],rf:[185,160]},to:{...lying,hip:[145,151],lk:[179,135],lf:[208,155],rk:[165,126],rf:[177,108]},equipment:'bench',caption:'Drive the heel into the bench and lift the pelvis' },
  adductor:{ from:lying,to:{...lying,lk:[173,147],rk:[167,149]},ball:'hold',caption:'Apply steady inward pressure with the knees' },
  deadbug:{ from:{...lying,lk:[170,137],lf:[197,139]},to:{...lying,lk:[177,167],lf:[214,179],le:[88,141],lh:[72,114]},caption:'Extend one leg while keeping the lower back down' },
  crunch:{ from:{...lying,lf:[213,177]},to:{...lying,hip:[144,163],lk:[147,130],lf:[172,126],rk:[152,133],rf:[175,139]},caption:'Curl the pelvis toward the ribs' },
  legRaise:{ from:{...lying,lk:[183,179],lf:[226,186]},to:{...lying,lk:[181,146],lf:[225,124]},caption:'Raise the top leg without rotating the pelvis' },
  wrist:{ from:{...seated,le:[130,148],lh:[162,146]},to:{...seated,le:[130,148],lh:[149,130]},caption:'Supported forearm · motion at the wrist' },
  rotate:{ from:{...seated,le:[130,148],lh:[157,153]},to:{...seated,le:[130,148],lh:[157,139]},caption:'Rotate the palm with the elbow still' },
  deviate:{ from:{...seated,le:[132,143],lh:[154,136]},to:{...seated,le:[132,143],lh:[156,150]},caption:'Move the wrist side to side from thumb-up' },
  grip:{ from:{...seated,le:[136,146],lh:[171,145]},to:{...seated,le:[136,146],lh:[167,149]},ball:'hold',caption:'Squeeze or open the fingers without forcing range' },
  toss:{ from:{le:[104,104],lh:[79,105]},to:{le:[105,91],lh:[78,72]},ball:'toss',caption:'Short arc · soft release and catch' },
  prayer:{ from:{le:[111,99],lh:[137,82],re:[168,99],rh:[143,82]},to:{le:[107,104],lh:[139,101],re:[172,104],rh:[141,101]},caption:'Gentle wrist stretch · no bodyweight on the hands' },
  press:{ from:{...lying,le:[119,167],lh:[122,141]},to:{...lying,le:[125,143],lh:[126,108]},caption:'Press up smoothly · keep the ribs settled' },
  row:{ from:{...seated,le:[148,135],lh:[184,140]},to:{...seated,le:[82,143],lh:[127,135]},equipment:'band',caption:'Pull the elbow toward the hip' },
  bentRow:{ from:lean,to:{...lean,le:[147,86],lh:[116,109]},caption:'Hinge and row without turning the torso' },
  rowHigh:{ from:{le:[104,77],lh:[75,69]},to:{le:[153,69],lh:[124,61]},equipment:'band',caption:'Pull toward eye level with elbows high' },
  ohp:{ from:{...kneel,le:[111,90],lh:[115,66]},to:{...kneel,le:[118,54],lh:[118,23]},caption:'Press overhead without leaning back' },
  fly:{ from:{le:[91,75],lh:[67,84]},to:{le:[120,68],lh:[147,73]},equipment:'band',caption:'Trace a wide arm arc with a soft elbow' },
  pulldown:{ from:{...kneel,...raised},to:{...kneel,le:[123,114],lh:[114,84]},equipment:'band',caption:'Pull the elbow down toward the ribs' },
  raise:{ from:upright,to:{le:[108,66],lh:[73,59]},caption:'Raise to eye level without swinging' },
  curl:{ from:{le:[118,92],lh:[115,128]},to:{le:[118,92],lh:[103,67]},equipment:'band',caption:'Keep the elbow close as the forearm moves' },
  pallof:{ from:{le:[108,80],lh:[129,79]},to:{le:[99,82],lh:[73,82]},equipment:'band',caption:'Press out without rotating the chest' },
  chop:{ from:{le:[173,75],lh:[193,44]},to:{le:[111,109],lh:[87,136]},equipment:'band',caption:'Rotate through hips and ribs along a diagonal' },
  wallPress:{ from:wall,to:{...wall,head:[82,55],shoulder:[95,75],le:[96,105]},equipment:'wall',caption:'Maintain a straight body line within the approved range' },
  pushup:{ from:{...lying,head:[69,123],shoulder:[92,137],hip:[148,150],lk:[186,175],lf:[219,194],rk:[190,173],rf:[222,192],le:[92,164],lh:[90,192],re:[97,164],rh:[100,193]},to:{...lying,head:[63,159],shoulder:[90,172],hip:[146,174],lk:[182,180],lf:[219,194],rk:[186,180],rf:[222,194],le:[114,182],lh:[90,192],re:[108,179],rh:[100,193]},caption:'Lower and press while maintaining body alignment' },
  hang:{ from:{...floating,le:[124,33],lh:[125,16],re:[156,31],rh:[155,16]},to:{...floating,head:[140,23],le:[111,61],lh:[125,16],re:[167,58],rh:[155,16]},equipment:'bar',caption:'Use a secure grip only when hanging is cleared' },
  dribbleLow:{ from:dribbleBase,to:{...dribbleBase,...handDown,head:[141,89],hip:[136,144]},ball:'low',caption:'Push the foam ball with left fingertips below the knee' },
  dribble:{ from:dribbleBase,to:{...dribbleBase,...handDown},ball:'mid',caption:'Meet the ball near knee height with the left hand' },
  dribbleHigh:{ from:{...dribbleBase,le:[105,91],lh:[94,88]},to:dribbleBase,ball:'high',caption:'Left hand controls the higher rebound' },
  vDribble:{ from:dribbleBase,to:{...dribbleBase,le:[122,121],lh:[132,137]},ball:'wide',caption:'Keep the V tight and within the footprint' },
  gather:{ from:dribbleBase,to:{...squat,lf:[78,194],le:[109,129],lh:[113,111]},ball:'mid',caption:'Jab or pivot, then gather beside the left hip' },
  weave:{ from:{...kneel,le:[119,129],lh:[92,153]},to:{...kneel,le:[139,119],lh:[153,151]},ball:'wide',caption:'Guide the ball closely around the legs' },
  dual:{ from:dribbleBase,to:{...dribbleBase,le:[113,106],lh:[103,93]},ball:'dual',caption:'Toss and catch with the left hand during a rebound' },
}

const bones: [Joint, Joint][] = [['head','shoulder'],['shoulder','hip'],['hip','lk'],['lk','lf'],['hip','rk'],['rk','rf'],['shoulder','le'],['le','lh'],['shoulder','re'],['re','rh']]
const mix = (a: number, b: number, x: number) => a + (b-a)*x

export function ExerciseAnimation({ exercise, protectedArm }: { exercise: Exercise; protectedArm: boolean }) {
  const id = useId()
  const [time,setTime] = useState(0)
  const [playing, setPlaying] = useState(() => !matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    if (!playing) return
    const start = performance.now()
    let frame = 0
    function draw(now: number) {
      setTime((now - start) % 2600 / 2600)
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [playing, exercise.id])
  const motion = motions[exercise.move]
  if (!motion) return <div className="diagram static-diagram">Use the execution cues for this activity.</div>
  const from = { ...upright, ...motion.from }
  const to = { ...upright, ...motion.to }
  const p = 0.5 - Math.cos(time * 2 * Math.PI) / 2
  const mid = motion.via ? { ...upright, ...motion.via } : undefined
  const a = mid && p > 0.5 ? mid : from
  const b = mid && p <= 0.5 ? mid : to
  const fraction = mid ? (p <= .5 ? p * 2 : (p - .5) * 2) : p
  const current = Object.fromEntries(Object.keys(a).map(raw => {
    const key = raw as Joint
    return [key, [mix(a[key][0], b[key][0], fraction), mix(a[key][1], b[key][1], fraction)]]
  })) as Pose

  if (protectedArm && !exercise.flag && exercise.category !== 'Forearm Rehab') {
    current.re = [current.shoulder[0] + 13, current.shoulder[1] + 24]
    current.rh = [current.shoulder[0] + 7, current.shoulder[1] + 36]
  }
  const hand = current.lh
  const ballX = motion.ball === 'foot' ? current.lf[0] :
    motion.ball === 'hold' && exercise.move === 'adductor' ? current.lk[0] : hand[0] - 5
  const ballY = motion.ball === 'foot' ? 191 : motion.ball === 'hold' ? (exercise.move === 'adductor' ? current.lk[1] + 4 : hand[1]) :
    motion.ball === 'toss' ? hand[1] - 18 - 25*p : mix(motion.ball === 'high' ? 89 : motion.ball === 'low' ? 154 : 125, 190, Math.abs(Math.sin(time * 4 * Math.PI)))

  return <figure className="diagram">
    <svg viewBox="0 0 280 218" role="img" aria-labelledby={id}>
      <title id={id}>{exercise.name}. {motion.caption}{protectedArm ? '. Right arm shown in muted stone blue.' : ''}</title>
      <path d="M32 194h216M32 199h216" stroke="#4A6B82" opacity=".56" fill="none"/>
      {motion.equipment === 'bench' && <path d="M167 193v-38h63v38" fill="#131C2E" stroke="#5A7D9A" strokeWidth="2"/>}
      {motion.equipment === 'wall' && <path d={exercise.move === 'wallSit' ? 'M184 36v158' : 'M69 36v158'} stroke="#5A7D9A" strokeWidth="3"/>}
      {motion.equipment === 'bar' && <path d="M84 16h113" stroke="#5A7D9A" strokeWidth="4"/>}
      {motion.equipment === 'tape' && <path d="M119 193l-9 8m56-8 9 8" stroke="#8eaac1" strokeWidth="2"/>}
      {motion.equipment === 'band' && <path d={`M45 ${exercise.move === 'pulldown' ? 26 : 121} L${hand[0]} ${hand[1]}`} stroke="#5A7D9A" strokeWidth="2"/>}
      {bones.map(([start,end]) => {
        const right = end === 're' || end === 'rh'
        return <line key={end} x1={current[start][0]} y1={current[start][1]} x2={current[end][0]} y2={current[end][1]} stroke={right && protectedArm ? '#5A7D9A' : '#e0ebfa'} strokeWidth={end === 'hip' ? 15 : 7} strokeLinecap="round"/>
      })}
      {(['shoulder','hip','le','lk','rk'] as const).map(joint => <circle key={joint} cx={current[joint][0]} cy={current[joint][1]} r="3.4" fill="#809bc2"/>)}
      <circle cx={current.head[0]} cy={current.head[1]} r="12" fill="#e0ebfa"/>
      {exercise.load.startsWith('17 kg · left') && <path d={`M${hand[0]-8} ${hand[1]}h16m-16-6v12m16-12v12`} stroke="#8CA9F5" strokeWidth="4" strokeLinecap="round"/>}
      {motion.ball && <circle cx={ballX} cy={ballY} r={motion.ball === 'toss' || motion.ball === 'hold' ? 5 : 8} fill="#8CA9F5"/>}
      {motion.ball === 'dual' && <circle cx={hand[0]-6} cy={hand[1]-17-24*p} r="4" fill="#d7e3ff"/>}
      <circle cx={hand[0]} cy={hand[1]} r="4" fill="#8CA9F5"/>
    </svg>
    <figcaption>{motion.caption}<button className="quiet" type="button" onClick={() => setPlaying(!playing)}>{playing ? 'Pause demo' : 'Play demo'}</button></figcaption>
  </figure>
}
