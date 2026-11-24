/* Why each exercise is in the plan, written for a basketball player coming back from a right forearm injury.
   Tags: court = basketball performance, body = general strength, health and injury-proofing,
   forearm = directly helps the injured forearm, wrist, hand or grip. */
export type BenefitTag = 'court' | 'body' | 'forearm'
export type Benefit = { tags: BenefitTag[]; why: string }
type Row = [string, BenefitTag[], string]

const rows: Row[] = [
  /* ---------- Warm-up ---------- */
  ['Easy jog in place', ['body', 'court'], 'Raises heart rate and muscle temperature so tendons are ready for jumps and cuts. A warm body moves faster and gets hurt less.'],
  ['Leg swings', ['body', 'court'], 'Opens the hips front-to-back and side-to-side, the same range you use for long strides, closeouts and slides.'],
  ['Banded lateral walk', ['court', 'body'], 'Wakes up the glute muscles that keep your knees from caving in on landings and power your defensive slides.'],
  ['Ankle rocks', ['body', 'court'], 'More ankle bend lets you sit lower in a defensive stance and lowers stress on the knees when you land.'],
  ['Reverse lunge with rotation', ['body', 'court'], 'Warms the hips and trunk together, like the turn you make on a pivot or a drop step.'],
  ['A-skips', ['court'], 'Teaches quick, stiff ground contacts under the hip, the rhythm of a fast first step and an explosive takeoff.'],
  ['Pogo hops', ['court', 'body'], 'Primes the springy ankles and Achilles tendon you rely on for quick second jumps and rebounds.'],

  /* ---------- Lower strength ---------- */
  ['Front-rack squat', ['court', 'body'], 'Builds leg strength for a higher vertical and stronger box-outs. Racking the weight on the left shoulder keeps the right forearm completely unloaded.'],
  ['Squat jump', ['court'], 'Turns squat strength into explosive takeoff power for rebounds, blocks and finishing at the rim.'],
  ['Rear-foot elevated split squat', ['court', 'body'], 'Single-leg strength for one-foot takeoffs, layups and hard first steps. It also fixes left-right strength gaps.'],
  ['Split squat isometric hold', ['body', 'court'], 'Builds knee and hip strength in the deep lunge position you hit on drives and cuts, without pounding the joints.'],
  ['Peterson step-up', ['body', 'court'], 'Strengthens the inner quad that guards the kneecap. Keeps knees healthy through lots of jumping and landing.'],
  ['Reverse Nordic', ['body', 'court'], 'Strengthens the quads at long length, which helps protect the knee tendon (jumper’s knee) and improves deceleration.'],
  ['Tibialis raise', ['body', 'court'], 'Trains the shin muscle that controls each landing, helping your shins and ankles handle the pounding of jumps.'],
  ['Single-leg calf raise', ['court', 'body'], 'Stronger calves and Achilles mean more spring off the floor and faster sprints, plus fewer ankle and calf injuries.'],
  ['Single-leg RDL', ['court', 'body'], 'Builds hamstrings and glutes for sprint speed and jumping, and trains balance on one leg like a layup takeoff.'],
  ['Step-up onto bench', ['court', 'body'], 'Single-leg drive strength that carries over to climbing for rebounds and exploding off one foot.'],
  ['Lateral lunge', ['court', 'body'], 'Strengthens the side-to-side movement pattern and the inner thigh muscles you use on defensive slides and crossovers.'],
  ['Banded ankle pumps', ['body', 'court'], 'Keeps the ankle strong through its whole range, which helps prevent rolled ankles on the court.'],
  ['Heels-elevated squat hold', ['body', 'court'], 'Loads the quads and knee tendon gently with no bouncing, building knee resilience for jumping.'],
  ['Single-leg calf raise isometric', ['body', 'court'], 'Holding at the top strengthens the Achilles tendon so it can store and release more energy on every jump.'],
  ['Wall sit', ['body', 'court'], 'Builds quad endurance so your legs stay strong in a low defensive stance late in games.'],

  /* ---------- Plyometrics & speed ---------- */
  ['Forward / back line hops', ['court'], 'Trains quick, controlled ground contacts that make your feet faster and your landings sharper.'],
  ['Lateral line hops', ['court', 'body'], 'Quick side-to-side footwork with stable knees, the base for lateral quickness on defense.'],
  ['Squat jump · stick landing', ['court', 'body'], 'Teaches you to absorb force safely. Good landings protect your knees and ankles every time you come down from a rebound.'],
  ['Depth drop from low step', ['body', 'court'], 'Trains your legs to soak up landing forces fast, an important skill for preventing knee injuries.'],
  ['Split squat jump', ['court'], 'Explosive power from a split stance, like pushing off on a fast break or a hard first step.'],
  ['A-march', ['court'], 'Grooves good sprinting posture and knee drive for a quicker first step and faster transition runs.'],
  ['Quick high-knee switches', ['court'], 'Fast leg turnover for acceleration, the first two or three steps that win most races to the ball.'],
  ['Lateral shuffle', ['court'], 'Builds the defensive slide: staying low, pushing off, and never crossing your feet.'],
  ['4-square hops', ['court', 'body'], 'Multi-direction foot speed and body control so you can change direction without losing balance.'],
  ['Short skater hops', ['court', 'body'], 'Single-leg lateral power with a controlled landing, the move behind explosive cuts and defensive recovery.'],
  ['Mini shuffle-touch drill', ['court'], 'Change-of-direction speed while staying low, exactly like guarding a ball handler.'],
  ['Closeout + defensive slides', ['court'], 'Rehearses the real defensive closeout: sprint, chop the feet under control, contest with a high hand, then slide.'],
  ['Drop step + 2 explosive steps', ['court'], 'Trains opening the hips and exploding into a new direction, used in post moves, recovering on defense and attacking a closeout.'],

  /* ---------- Core ---------- */
  ['Dead bug', ['body', 'court'], 'Teaches the core to stay solid while arms and legs move, which carries over to contact, finishing through bumps and staying balanced in the air.'],
  ['Dead bug · heel taps', ['body'], 'Builds deep core control and protects the lower back while the legs move.'],
  ['Hollow body hold', ['body', 'court'], 'A strong, tight midsection helps you hold your body position in the air and absorb contact.'],
  ['Reverse crunch', ['body'], 'Strengthens the lower abs and pelvic control that support the lower back during jumping.'],
  ['Suitcase march', ['body', 'forearm'], 'Trains your core to resist leaning, for balance through contact. Holding the dumbbell also builds grip in your healthy left hand while the right side heals.'],
  ['Single-leg hamstring bridge hold', ['body', 'court'], 'Strengthens the hamstrings and glutes that help prevent hamstring pulls when you sprint.'],
  ['Adductor squeeze', ['body', 'court'], 'Strengthens the inner thighs. Groin strains are common in basketball, and this helps prevent them.'],
  ['Single-leg balance · eyes closed', ['body', 'court'], 'Sharpens ankle and knee balance reflexes, one of the best ways to prevent sprained ankles.'],
  ['Side-lying leg raise', ['body', 'court'], 'Strengthens the side glute that keeps your knee and hip in line when you land on one leg.'],
  ['Standing hip extension', ['body', 'court'], 'Activates the glutes that power your jump and sprint, and helps take strain off the lower back.'],
  ['Band diagonal lift', ['court', 'body'], 'Trains power from the hips through the trunk, like rotating for a pass, a rip-through or a strong finish.'],

  /* ---------- Upper body ---------- */
  ['Band chest press', ['body', 'court'], 'Keeps chest and shoulder pushing strength during recovery for passing, holding position and finishing through contact. Light band tension keeps the right forearm safe.'],
  ['Band seated row', ['body', 'court'], 'Strengthens the upper back for better posture and healthier shoulders, and balances all the pushing work.'],
  ['Half-kneeling single-arm band overhead press', ['body', 'court'], 'Builds shoulder strength overhead for shooting range and rebounding, while the kneeling position trains core control.'],
  ['Prone Y-T-W raise', ['body', 'court'], 'Strengthens the small shoulder-blade muscles that keep shoulders healthy for shooting and reaching. No grip needed, so the forearm rests.'],
  ['Wall push-up', ['body', 'forearm'], 'A gentle, low-load way to start pushing again. Only do it if pain-free and your surgeon allows it.'],
  ['Band pull-apart', ['body', 'court'], 'Strengthens the upper back and rear shoulders for posture, and helps keep your shooting shoulder healthy.'],
  ['Split-stance dumbbell row · left', ['body'], 'Builds back and arm strength on your healthy side while the right side recovers, so you stay strong overall.'],
  ['Band chest fly', ['body'], 'Keeps the chest and front shoulders active with very little wrist load.'],
  ['Overhead band pull-down', ['body', 'court'], 'Strengthens the lats and mid-back without a door anchor, for rebounding power and healthy shoulders.'],
  ['Band front raise', ['body', 'court'], 'Builds front-shoulder strength used when you raise the ball to shoot.'],
  ['Band reverse fly', ['body', 'court'], 'Strengthens the rear shoulders and upper back to balance shooting and pushing and to support good posture.'],
  ['Band curl', ['body', 'forearm'], 'Light biceps work that also gently trains the elbow and forearm muscles around the injured area, within your approved range.'],
  ['Band overhead triceps extension', ['body', 'court'], 'Strengthens the triceps, a key muscle for straightening your arm on a jump shot and pushing off.'],

  /* ---------- Conditioning & recovery ---------- */
  ['Zone 2 cardio', ['body', 'court'], 'Builds your aerobic base so you recover faster between sprints and stay sharp late in games.'],
  ['Easy walk', ['body'], 'Low-effort movement that improves blood flow and recovery without adding fatigue.'],
  ['Weekly meal and schedule prep', ['body', 'forearm'], 'Good food and sleep are when your body builds muscle and heals bone and tissue. Planning ahead makes both happen.'],
  ['High knees', ['court', 'body'], 'Fast leg turnover and conditioning for repeated sprints up and down the floor.'],
  ['Defensive stance quick feet', ['court'], 'Builds leg endurance and foot speed in a low defensive stance.'],
  ['Skater hops', ['court', 'body'], 'Lateral power and landing control under fatigue, like defending late in a game.'],
  ['Squat jumps', ['court'], 'Keeps your jump explosive even when you are tired.'],

  /* ---------- Cooldown & stretching ---------- */
  ['Easy cooldown walk', ['body'], 'Brings your heart rate down gradually and helps clear fatigue so you recover faster.'],
  ['Standing hamstring stretch', ['body', 'court'], 'Keeps the hamstrings long so they are less likely to strain on sprints and long strides.'],
  ['Wall calf stretch', ['body', 'court'], 'Restores ankle and calf flexibility after jumping, helping with lower stance and lower Achilles stress.'],
  ['Couch stretch', ['body', 'court'], 'Opens the hip flexors and quads that get tight from jumping and sitting. A more open hip gives a longer stride and less back strain.'],
  ['Side-lying open book', ['body', 'court'], 'Improves upper-back rotation for passing and shooting, and keeps the shoulder and neck from getting stiff.'],
  ['Seated straight-leg lift over pillow', ['body'], 'Builds active hip flexibility and control, so you can actually use the range you stretch.'],
  ['90/90 hip switches', ['body', 'court'], 'Improves hip rotation for smoother pivots, drop steps and change of direction.'],
  ['90/90 side reach', ['body'], 'Opens the side of the trunk and hips for freer rotation and better posture.'],
  ['90/90 back-knee lift-off', ['body', 'court'], 'Strengthens the hip at the end of its range, which helps protect the groin and hip on wide cuts.'],
  ['Half-kneeling hip flexor stretch', ['body', 'court'], 'Releases tight hip flexors for a fuller hip extension when you sprint and jump.'],
  ['Ankle rocks + elevated lunge hold', ['body', 'court'], 'Builds ankle bend for a lower defensive stance and softer, safer landings.'],
  ['Knee-elevated lunge hold', ['body', 'court'], 'Builds lasting ankle mobility for a deeper stance and better landing mechanics.'],
  ['Deep squat pry hold', ['body'], 'Opens the hips, knees and ankles together so you move freely and comfortably in deep positions.'],
  ['Supported deep squat breathing', ['body'], 'Relaxes the hips and lower back and calms your body down after a hard week.'],
  ['Cossack squat', ['body', 'court'], 'Side-to-side hip and groin mobility for wide defensive slides and lunges.'],
  ['Band pass-through', ['body', 'court'], 'Keeps your shoulders mobile for overhead reaching and a smooth shooting motion.'],
  ['Seated straddle reach', ['body', 'court'], 'Stretches the inner thighs and hamstrings, helping prevent groin strains.'],
  ['Bench pigeon stretch', ['body'], 'Releases the outer hip and glute that tighten from running and jumping.'],
  ['Toe yoga', ['body', 'court'], 'Strengthens the small foot muscles that support your arch and improve balance and push-off.'],
  ['Tennis ball foot roll', ['body'], 'Loosens the bottom of the foot and helps it feel springy and fresh for training.'],

  /* ---------- Forearm rehab ---------- */
  ['Wrist flexion / extension', ['forearm', 'court'], 'Restores the bend-and-extend motion of your wrist, the motion behind a shooting follow-through and every dribble.'],
  ['Radial / ulnar deviation', ['forearm', 'court'], 'Restores side-to-side wrist motion you use to control the ball and steer passes.'],
  ['Supination / pronation', ['forearm', 'court'], 'Restores forearm rotation, which is often limited after a forearm fracture. You need it to turn the palm for catching, ball handling and shooting.'],
  ['Band wrist extension / flexion', ['forearm', 'court'], 'Gradually rebuilds strength in the wrist muscles so the forearm can handle the ball, catches and contact again.'],
  ['Finger extension vs band', ['forearm'], 'Strengthens the finger-opening muscles to balance your grip, which helps the forearm and elbow stay healthy.'],
  ['Tennis ball squeeze', ['forearm', 'court'], 'Rebuilds grip strength gradually. Grip controls the ball on dribbles, rebounds and catches.'],
  ['Tennis ball wall toss and catch', ['forearm', 'court'], 'Retrains hand-eye coordination and soft hands for catching, at a low load your forearm can handle.'],
  ['Prayer / reverse-prayer stretch', ['forearm'], 'Gently restores wrist flexibility in both directions, which you need for a smooth shooting release.'],
  ['Progressed tennis ball grip', ['forearm', 'court'], 'Builds grip strength further after clearance, as you return to full ball handling.'],

  /* ---------- Ball handling ---------- */
  ['Low ankle pounds', ['court'], 'Builds a strong, low left-hand dribble that is hard to steal.'],
  ['Knee-height pounds', ['court'], 'Develops a controlled, consistent dribble with your left hand at game height.'],
  ['Shoulder-height pounds', ['court'], 'Builds wrist strength and control for a high-speed dribble in the open floor.'],
  ['Front-to-back V-dribbles', ['court'], 'Improves ball control for in-and-out moves and changing pace while you drive.'],
  ['Side-to-side V-dribbles', ['court'], 'Builds the hand control behind a quick crossover, while you train the left hand.'],
  ['Hip-pocket pull-back + head fake', ['court'], 'Teaches you to protect the ball and sell a fake, so you can create space against defenders.'],
  ['Seated / kneeling figure-8 weave', ['court'], 'Builds fingertip control and ball feel, so the ball goes where you want it.'],
  ['Left dribble + tennis ball toss', ['court'], 'Trains you to dribble without looking at the ball while reacting to something else, like reading the defense.'],
  ['Silent wall tap + high-pickup footwork', ['court'], 'Combines footwork with a secure pickup, like a jab step into a strong gather on your way to the rim.'],
  ['Two-hand crossover', ['court', 'forearm'], 'Brings the right hand back into ball handling and rebuilds your crossover once you are cleared.'],
  ['Behind-the-back wrap', ['court', 'forearm'], 'Restores ball control around the body and gentle wrist and shoulder motion after clearance.'],
  ['Right-hand symmetry drill', ['court', 'forearm'], 'Rebuilds right-hand dribbling to match the left. You come back as a better two-handed player.'],

  /* ---------- Post-clearance phases ---------- */
  ['Incline bench push-up', ['body', 'forearm'], 'A gentle first step back to loading the wrist in an extended position, with less load than the floor.'],
  ['Light dumbbell row or band row', ['body', 'forearm'], 'Brings pulling strength and light grip work back to the right arm within your clearance limits.'],
  ['Light dumbbell press or band press', ['body', 'forearm'], 'Returns light pushing to both arms and rebuilds confidence in the injured side.'],
  ['Floor push-up', ['body', 'court'], 'Full-body pushing strength and a solid trunk for contact and finishing.'],
  ['Dumbbell bent-over row', ['body', 'forearm'], 'Rebuilds back strength and grip on both sides for rebounding and strong ball security.'],
  ['Dumbbell floor press', ['body', 'court'], 'Rebuilds pressing strength safely, with the floor limiting how deep the shoulder goes.'],
  ['Farmer carry hold', ['forearm', 'body'], 'One of the best ways to rebuild grip and forearm strength, plus core and posture.'],
  ['Alternating single-arm incline DB press', ['body', 'court'], 'Builds pressing power one arm at a time, so the right side can catch up to the left.'],
  ['Single-arm kneeling DB overhead press', ['body', 'court'], 'Overhead shoulder strength and core stability for rebounding and shooting range.'],
  ['Dumbbell front raise', ['body', 'court'], 'Front-shoulder strength for raising the ball and holding your shooting pocket.'],
  ['Dumbbell pullover', ['body', 'court'], 'Strengthens the lats and chest through an overhead range, like securing a rebound overhead.'],
  ['Full push-up variations', ['body', 'court'], 'Upper-body and core strength for physical play once you are fully cleared.'],
  ['Single-arm dumbbell row · heavy', ['body', 'forearm'], 'Heavy pulling rebuilds back strength and a strong grip on both hands.'],
  ['Progressive dumbbell row and press', ['body', 'court'], 'Rebuilds balanced push and pull strength for full contact basketball.'],
]

export const benefits: Record<string, Benefit> = Object.fromEntries(rows.map(([name, tags, why]) => [name, { tags, why }]))
export const benefitLabel: Record<BenefitTag, string> = { court: 'Basketball', body: 'Body', forearm: 'Forearm' }
export const benefitFor = (name: string): Benefit | undefined => benefits[name]
