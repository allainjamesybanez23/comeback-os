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

## Workout controls

Open a session in **Training**. Press Space to start or pause an interval, rest clock or enabled tempo metronome. Enter starts a timed set, then logs the set after the interval ends. For rep-based work, Enter logs the set immediately. Linked blocks alternate in order and rest after the completed round. The arrow keys move between exercises. M toggles synthesized audio. A timed set with an unknown jump count asks for actual contacts before it can be logged.

Shortcuts are active in the workout window and yield to text inputs and dialogs. To use the keys in the background, enable the Windows option in the player. This temporarily reserves those five keys while the workout is open and the app is unfocused. Foreground shortcuts remain available if Windows cannot register a background key.

Logs, schedule swaps, benchmark measurements, settings and edits are stored in IndexedDB in the Windows Electron user profile. There's no account or server. Set progress survives a restart. The active timer and background-key opt-in reset when you leave the player.

## Program decisions

- Foundation Week 1 begins November 9, 2026. November 23 is Week 3. The timeline follows the date, with a manual repeat-week selector under **Program → Weeks & phases**. Phase 0 stays active until a real January 2027 or later clearance date is recorded. Later phases follow their week windows and require a pain-free-week confirmation.
- The weekly split follows the request. The original Wednesday / Thursday hard-day conflict is surfaced in the Schedule view. Moving a hard leg day can show a confirmation when the new arrangement has consecutive hard sessions.
- Pain at 3/10 stops the active exercise for the day and opens the surgeon checklist. The low-pain status indicates the program threshold only. Separate restrictions apply to right-arm loading and flagged movements.
- Exercise diagrams are schematic movement guides. Combined movements may use a representative pose sequence, and custom exercises can use text cues. The same-hand dual-ball drill uses the foam ball's rebound window to toss and catch the tennis ball with the left hand.
- Weekly weight adjustments compare averages with three or more entries each. A stall uses three weekly averages spanning two weeks. Contact totals count each foot landing and include manually entered extra contacts. Recovery days contribute to streaks.

## Source map

- `src/data/comebackProgram.ts` holds the curriculum, progression and mindset library.
- `src/model.ts` generates dated prescriptions, set order, safety rules and tracker calculations.
- `src/components/ExerciseAnimation.tsx` renders offline SVG motion guides.
- `src/store.ts` owns local storage. `electron/main.cjs` and `electron/preload.cjs` own the Windows shell and the narrow system integration.
- `DESIGN.md` and `PRODUCT.md` capture the design and product context.

Curriculum reference supplied by the user: *Comeback Program: Hooper Strength & Size*, November 9, 2026. The device stores logs and implements the user's plan. Follow your surgical team's instructions for restrictions and clearance. [AAOS adult forearm fracture recovery](https://orthoinfo.aaos.org/en/diseases--conditions/adult-forearm-fractures/).
