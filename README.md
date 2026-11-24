# Comeback OS · Hooper Strength & Rehab

A Windows desktop training and recovery app. The installer and portable edition are x64. Once installed, all exercise guides, fonts, audio, schedules and data work offline.

## Run the included build

- Run **Comeback-OS-Setup-1.0.0.exe** for a per-user installation.
- Run **Comeback-OS-Portable-1.0.0.exe** directly to launch without installing. The portable edition stores its workouts in the Windows profile, so logs survive closing it.
- If using the unpacked Windows ZIP, extract the full folder and run **Comeback OS.exe** inside it. Keep the executable with its runtime files.
- Both editions are unsigned. Build with your own Windows signing certificate if you distribute the app.

## Build from source on Windows

1. Install Node.js 22 or newer and open PowerShell in the extracted source folder.
2. Run `npm install` to fetch build dependencies.
3. Run `npm run build` to type-check, bundle the renderer and generate the multi-resolution ICO from `build/icon.svg`.
4. Run `npm start` to launch the local Electron build.
5. Run `npm test` to check the program engine.
6. Run `npm run dist` to make the NSIS installer and portable executable in `release/`. The first build needs internet access to fetch Electron and packaging tools.

The included executables were compiled from electron-builder's Windows app directory with the native x64 NSIS compiler. To reproduce that packaging path, run `pwsh -File scripts/package-x64.ps1 -MakeNsis "C:\path\to\makensis.exe"` with the [native x64 NSIS tool from MSYS2](https://packages.msys2.org/packages/mingw-w64-ucrt-x86_64-nsis).

## Sessions

Each day has four separate sessions on the **Today** screen:

- **Workout** – warm-up → main work → cooldown. Supersets alternate (A1 → A2 → rest → repeat) and every block uses the same set count, so rounds stay clean.
- **Stretching** – a floor-to-standing flow (long flow on Sunday).
- **Forearm rehab** – range of motion → light strength → grip → toss → stretch.
- **Ball handling** – silent left-hand foam-ball drills.

Equipment: one 17 kg dumbbell, light bands, a bench, a low step, a wall, a foam ball, a tennis ball, a pillow and floor tape. Nothing needs a door anchor or pull-up bar.

## Workout player

The animated movement guide sits beside the timer for every set, and shows the next exercise during rest. Timed sets get a 5-second get-ready countdown; rests flow straight into the next set. The offline voice coach (Windows voices) calls out exercises, rests and countdowns.

- **Enter** – log the set / start a timed set / skip rest
- **Space** – pause or resume the clock (or the tempo metronome on rep sets)
- **← →** – previous / next exercise
- **V** – voice coach on/off · **M** – beeps on/off · **Esc** – leave (progress is saved)

Rep sets log actual reps and kg; the guide drawer shows your history and best set. Timed plyo sets with an unknown jump count ask for foot contacts before logging. The finish screen shows time, sets, reps, volume, streak, weekly rings and any badge unlocked.

Logs, schedule swaps, benchmark measurements, settings and edits are stored in IndexedDB in the Windows Electron user profile. There's no account or server.

## Program decisions

- Foundation Week 1 begins November 9, 2026. November 23 is Week 3. The timeline follows the date, with a manual repeat-week selector under **Program → Weeks & phases**. Phase 0 stays active until a real January 2027 or later clearance date is recorded. Later phases follow their week windows and require a pain-free-week confirmation.
- The weekly split follows the request. The original Wednesday / Thursday hard-day conflict is surfaced in the Schedule view. Moving a hard leg day can show a confirmation when the new arrangement has consecutive hard sessions.
- Pain at 3/10 stops the active exercise for the day and opens the surgeon checklist. The low-pain status indicates the program threshold only. Separate restrictions apply to right-arm loading and flagged movements.
- Exercise diagrams are schematic movement guides. Combined movements may use a representative pose sequence, and custom exercises can use text cues. The same-hand dual-ball drill uses the foam ball's rebound window to toss and catch the tennis ball with the left hand.
- Weekly weight adjustments compare averages with three or more entries each. A stall uses three weekly averages spanning two weeks. Contact totals count each foot landing and include manually entered extra contacts. Recovery days contribute to streaks.

## Source map

- `src/data/comebackProgram.ts` holds the curriculum, progression and mindset library.
- `src/model.ts` generates dated prescriptions, set order, safety rules and tracker calculations.
- `src/anim/rig.ts` is a small 3D stick-figure rig with two-bone IK (fixed bone lengths, planted feet). `src/anim/motions.ts` holds the keyframed motion for every exercise, and `src/anim/CloseUp.tsx` draws the forearm and toe close-ups. `src/components/ExerciseAnimation.tsx` renders them offline as SVG.
- `src/components/WorkoutPlayer.tsx` is the session player; `Today.tsx`, `Sessions.tsx`, `Library.tsx` and `Progress.tsx` are the main screens. `src/achievements.ts` computes badges and `src/voice.ts` is the voice coach.
- `src/store.ts` owns local storage. `electron/main.cjs` and `electron/preload.cjs` own the Windows shell and the narrow system integration.
- `DESIGN.md` and `PRODUCT.md` capture the design and product context.

Curriculum reference supplied by the user: *Comeback Program: Hooper Strength & Size*, November 9, 2026. The device stores logs and implements the user's plan. Follow your surgical team's instructions for restrictions and clearance. [AAOS adult forearm fracture recovery](https://orthoinfo.aaos.org/en/diseases--conditions/adult-forearm-fractures/).
