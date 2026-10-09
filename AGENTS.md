# Saint Shard — agent guide

This file is for anyone changing the code. [README.md](README.md) is for players and for the deploy. Keep the two on the same game.

## Keep both docs current

When a change alters how the game plays, looks, sounds, saves, or deploys, update `README.md` and `AGENTS.md` in the same change. Quote the four goal sentences from `lib/story/goal.ts` in both files, and keep the save key `saint-shard-3055-v1` in both. `lib/docs.test.ts` fails if either file drops them.

A change that does not move those facts can leave both files as they are. Do not update one and leave the other describing an older game. Cursor loads `.cursor/rules/keep-docs.mdc` on every turn so this rule stays in front of an agent.

Do not add accounts, a database, a 3D city, multiplayer, or a new dice system unless the task asks for it. The fiction is original.

## Commands

```bash
npm test
npx tsc --noEmit
npm run build
```

`npm test` runs `tsx --test lib/*.test.ts`. Story changes belong in `lib/engine.test.ts`. The graph test walks every choice, so a new scene has to be in `SCENES` and every `next` has to name a real scene.

## Where the game lives

The app is a static Next.js client. `components/GameApp.tsx` switches title, create, and play. `components/PlayScreen.tsx` renders the scene, the goal, and the choices. `components/Sheet.tsx` is the character sheet. `components/CheckDialog.tsx` rolls the die.

| Concern | File |
| --- | --- |
| Rules and `commitChoice` | `lib/engine.ts` |
| Stats, origins, complications, factions | `lib/character.ts` |
| Scene type and choice gates | `lib/types.ts` |
| Act 1, The Hour | `lib/story/act1.ts` |
| Act 2, The Week | `lib/story/act2.ts` |
| Act 3, The Wall | `lib/story/act3.ts` |
| Goal line and act name | `lib/story/goal.ts` |
| Night retell | `lib/story/retell.ts` |
| Cast and speaker roles | `lib/story/cast.ts` |
| Journal ids and titles | `lib/journal.ts` |
| Codex endings | `lib/story/codas.ts` |
| Saves | `lib/storage.ts` |
| Layout | `app/globals.css` |
| Beds and cues | `lib/sound.ts`, `public/audio/` |
| Production gate | `scripts/ci-gate.mjs`, `scripts/wait-for-ci.mjs`, `vercel.json` |

## The story

Quill hires you to lift Mara Voss's hour from Glass Chapel before dawn. The hour is a memo: she signed the Ward Nine coolant dump, and three hundred people died. Kerr is paid to stop you. Sister Lumen may help leak it or break it. A week later the city asks for a buyer or a witness. At Ward Nine, Sera keeps the names on a wall.

`currentGoal` shows one of these sentences under the location and on the continue note. `actName` shows The Hour, The Week, or The Wall beside the place, from the same scene sets.

- Lift Mara Voss's hour from Glass Chapel before dawn. Kerr is paid to stop you.
- You know what the hour is. Decide who gets it.
- The week wants a buyer or a witness.
- The wall has the names. Say them, or leave them to the rain.

The truth sentence replaces the job once `heard_memo` is set or the journal has `ward-nine`. Week scenes and anything starting with `act2_` use the week sentence. Wall scenes and anything starting with `act3_` use the wall sentence.

The first time the shard is in hand and `heard_memo` is still false, `shardNext` routes to the `memo` scene. The next scene, `mara_why`, is Mara saying why she signed. That pair is not a check. Kerr's first line and Lumen's first honest answer restate the stake. Journal rows show a title from `JOURNAL_TITLES`. The id stays the key for checks. `kerr-knee`, `calibration`, `clinic-debt`, and `shard-copy` each change a sentence later.

`week-after` goes to `card_week` (The Hour, then the street). The street names the origin. `back-to-board` goes to `card_wall`. Open districts get a door scene before the check, and each door has a refusal that changes the check scene. `act2_middle` names Junie Calder before the week ending. `ward_wall` shows Ivo Pell, Junie Calder when the journal has `ward-nine`, Nia Pell when the wards are at 2 or more, and a check for Pell the younger. The ending hub stays at `act3_arrival`. A finale shows three retell lines from `nightRetell` before the coda. Seen codas render on the title screen. Unseen endings stay a blank.

Leaving a scene with a speaker sets `met_quill`, `met_mara`, `met_kerr`, `met_lumen`, `met_ives`, or `met_sera`. `speakerRole` puts the role next to the name. With no speaker, the plate caption is the handle and the origin. The sheet lists who you have met. `commitChoice` appends the choice label to `log`. Old saves migrate with an empty log. Version stays 2. The optional `pendingCheck` records the scene, legal choice, and die face before animation; it must survive saves and imports and be removed only when its outcome is committed.

## Rules that should stay stable

- 1d10. Stats are chrome, nerve, face, and ghost. Two points to spend. Cap is 5. Strain max is 5.
- Origins: gutterwire, spire, dustline. Complications: `debt` (−40 creds, Quill +1), `optic` (Strain 1, Chrome +1, Lumen +1), `on-file` (Helion +2).
- Factions are quill, lumen, helion, and wards, clamped from −3 to 5.
- A choice that changes a faction, an item, or a journal clue says so in `detail` when the consequence is real. `effectPreview` adds the numeric shift (creds, strain, items, factions) before the click. At Strain 4, `CheckDialog` shows "The chair is close." before the roll. `statVoice` in `lib/story/voices.ts` is the one sentence that stat says before the die. It does not change the bonus.
- Save version is 2. The key is `saint-shard-3055-v1`. Sound is `saint-shard-sound`. Text size is `saint-shard-text` (`html[data-text]` 0, 1, or 2). Codex is `saint-shard-codex`. `log` is the recent choice labels.
- Storage access catches blocked getters, failed reads, quota errors, and failed removals. Reads fall back to empty saves/codex and default preferences. Writes return a success boolean. `GameApp` uses the save result to show a session-only progress notice in play and on the title screen; a failed save must not prevent play. Sound and text controls still work without persisted preferences.

## Screens

Desktop, wider than 1100px: the sheet is a 320px column, and the portrait is 220px. Tablet, 1100px and under: the sheet is a drawer with a focus trap, and the portrait is 160px. Phone, 700px and under: the portrait is compact, prose spans the reading width below the scene header, district cards stack, and Settings, Saves, Sheet, and Abandon share one row so the goal stays in the first screen. `viewportFit` is `cover`. The goal element is `data-testid="goal"`. Prose advances one paragraph at a time unless the player shows the rest or selects whole-scene reading. The live announcement is the place, the act, and the goal. Play a changed screen at 390px and at desktop, and confirm the goal is visible without opening the sheet.

Story number shortcuts are disabled while the sheet is open. Sheet tabs use Left/Right arrows with wrapping, plus Home/End. The drawer and dialogs use native `dialog.showModal()` for background isolation, focus trapping, Escape handling, and focus restoration. All sheet panels retain ids, with inactive panels hidden. Background story shortcuts also ignore form fields and other open dialogs.

## Sound

`lib/sound.ts` plays the theme and the rain through the Web Audio API. The rain is drips plus a quiet tone, not a noise bed. Week-board scenes use `sting-week`. Ward Nine uses `sting-ward`. `scripts/generate-audio.mjs` writes `public/audio/*.wav`. `lib/audio.test.ts` checks the theme seam, the rain level, and the two new stings. Sound off suspends the audio context. `theme-chapel` and `theme-ward` are extended distinct beds, crossfaded by `sceneMood`; `sting-memory` marks the bench. Music, ambience, and effects use separate mixer buses. Scene effects never clear a pending roll when sound or volume changes. Unmounting play stops the bed.

## Deploy

`.github/workflows/ci.yml` jobs must stay named `Test` and `Build`. Build needs Test. Build installs Playwright browsers, runs the production build, then runs the desktop/mobile Chromium, Firefox, and WebKit regression and automated accessibility suite. A failed browser check fails Build and therefore blocks production. `vercel.json` `ignoreCommand` runs `node scripts/wait-for-ci.mjs`. Exit 1 continues the Vercel build. Exit 0 skips it. Production waits until the latest Test and Build checks have both succeeded. A failed, skipped, or cancelled check skips production. A timeout or an unreadable status skips too. Previews, where `VERCEL_ENV` is not `production`, build immediately. Do not rename the jobs without updating `scripts/ci-gate.mjs` and `lib/ci-gate.test.ts`.

## Campaign expansion and recovery

The bench is an optional first choice in `mara_why`; the direct `why-signed` route remains valid for legacy jobs. `lib/story/memory.ts` inspects signature/order/roster flags and seals exactly one disposition. `lib/story/missions.ts` supplies earned training, origin contracts, witness transfer, checkpoint recovery, and archive verification. `requireAllFlags`, `requireOrigin`, and `requireFaction` belong to the engine, not just the UI. `commitChoice` uses the canonical scene choice. Keep the 1d10 rules and base stat cap of 5. One earned perk adds a check bonus, never a base-stat increase. Tools explicitly consumed by a choice are removed after resolution.

`aftermath` in `lib/evidence.ts` describes only known consequences. `memoryDisposition` and categorized journal entries expose source quality and promise status. Protecting a roster alone must not claim Nia was moved. Missing verification must not claim a proven command chain. `third_attempted` prevents retry farming at the wall.

`lib/vault.ts` provides three snapshot slots and export/import. The legacy autosave key `saint-shard-3055-v1` and version 2 stay stable. Storage validates stats, numeric values, items, rolls, and pending-choice legality. A previous valid autosave is copied to its `-backup` key before replacement; invalid autosaves fall back to that copy. Failed persistence leaves play usable with a session-only notice. The snapshot checksum is accidental-corruption detection, not authentication. Imports reject files above 1 MB and ask before replacing an active run. Clearing an active run leaves manual slots intact.

`lib/preferences.ts` migrates old sound/text preferences into `saint-shard-preferences`. `SettingsDialog` supports text, contrast, paragraph/all reading, reduced motion, sound channels, and opt-in standard gamepad input. Settings apply during the session even if storage fails. `SaveDialog` is available on title and play. Diagnostics are explicit exports of bounded incident codes; never add names, choices, user identifiers, save contents, or automatic uploads.

Use `npm run story:report -- story-report.json` to inspect the graph and 900 seeded completion simulations. `lib/campaign.test.ts` covers the new consequence paths. `tests/game.spec.ts` covers player flows, portable pending rolls, corrupted imports, and automated accessibility. Match implementation changes in README and this guide. `docs/PRODUCTION.md`, `docs/RELEASE.md`, and `CREDITS.md` describe human review and rights gates without claiming they have passed.

The deterministic score generator runs automatically before development, tests, and production builds. The chapel and ward beds and memory cue are generated assets; keep their source in `scripts/generate-audio.mjs`.

The six-phase status and remaining production milestones are tracked in [docs/ROADMAP.md](docs/ROADMAP.md). The candidate contains 64 scenes and 149 choices; retain all four original finales.

This review adds a compact commitments panel, contextual next steps, and warnings on week-closing choices when a memory promise remains open. The memory bench places inspection controls in each fragment row and expands inspected source details on request. Archive preservation alone is not independent verification; exposed-location testimony can corroborate an order without protecting its witness. Motion and reading pace are independent settings. Story shortcuts ignore key repeats and focus inside the character sheet. Manual slots reject invalid date metadata. See [the current review and grade](docs/REVIEW.md).

Audio resumes from an explicit player gesture when sound is enabled or a saved sound-enabled run is continued, so browser autoplay restrictions do not strand the score. Unsupported audio remains optional.

Inspecting a memory fragment opens its source text and moves focus to that source summary; the player can revisit or collapse inspected sources.

At Ward Nine, Nia appears in a private witness ledger beside the memorial; she is explicitly a living witness, and her current address is not displayed.

Score and cue loading never wait on `AudioContext.resume()`: browser policy or an unavailable audio device can delay that promise indefinitely. Resume requests are optional and nonblocking; player actions can retry activation.
