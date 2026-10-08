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
| Goal line | `lib/story/goal.ts` |
| Cast and speaker roles | `lib/story/cast.ts` |
| Journal ids and titles | `lib/journal.ts` |
| Codex endings | `lib/story/codas.ts` |
| Saves | `lib/storage.ts` |
| Layout | `app/globals.css` |
| Beds and cues | `lib/sound.ts`, `public/audio/` |
| Production gate | `scripts/ci-gate.mjs`, `scripts/wait-for-ci.mjs`, `vercel.json` |

## The story

Quill hires you to lift Mara Voss's hour from Glass Chapel before dawn. The hour is a memo: she signed the Ward Nine coolant dump, and three hundred people died. Kerr is paid to stop you. Sister Lumen may help leak it or break it. A week later the city asks for a buyer or a witness. At Ward Nine, Sera keeps the names on a wall.

`currentGoal` shows one of these sentences under the location and on the continue note:

- Lift Mara Voss's hour from Glass Chapel before dawn. Kerr is paid to stop you.
- You know what the hour is. Decide who gets it.
- The week wants a buyer or a witness.
- The wall has the names. Say them, or leave them to the rain.

The truth sentence replaces the job once `heard_memo` is set or the journal has `ward-nine`. Week scenes and anything starting with `act2_` use the week sentence. Wall scenes and anything starting with `act3_` use the wall sentence.

The first time the shard is in hand and `heard_memo` is still false, `shardNext` routes to the `memo` scene. That scene is not a check. Kerr's first line and Lumen's first honest answer restate the stake. Journal rows show a title from `JOURNAL_TITLES`. The id stays the key for checks.

`week-after` goes to `card_week` (The Hour, then the street). `back-to-board` goes to `card_wall`. Open districts get a door scene before the check. `ward_wall` shows Sera and one readable name, Ivo Pell, before `act3_arrival`.

Leaving a scene with a speaker sets `met_quill`, `met_mara`, `met_kerr`, `met_lumen`, `met_ives`, or `met_sera`. `speakerRole` puts the role next to the name. The sheet lists who you have met.

## Rules that should stay stable

- 1d10. Stats are chrome, nerve, face, and ghost. Two points to spend. Cap is 5. Strain max is 5.
- Origins: gutterwire, spire, dustline. Complications: `debt` (−40 creds, Quill +1), `optic` (Strain 1, Chrome +1, Lumen +1), `on-file` (Helion +2).
- Factions are quill, lumen, helion, and wards, clamped from −3 to 5.
- A choice that changes a faction, an item, or a journal clue says so in `detail` when the consequence is real. At Strain 4, `CheckDialog` shows "The chair is close." before the roll.
- Save version is 2. The key is `saint-shard-3055-v1`. Sound is `saint-shard-sound`. Text size is `saint-shard-text` (`html[data-text]` 0, 1, or 2). Codex is `saint-shard-codex`.

## Screens

Desktop, wider than 1100px: the sheet is a 320px column, and the portrait is 220px. Tablet, 1100px and under: the sheet is a drawer, and the portrait is 160px. Phone, 700px and under: the portrait is 112px, and district cards stack. `viewportFit` is `cover`. The goal element is `data-testid="goal"`. Play a changed screen at 390px and at desktop, and confirm the goal is visible without opening the sheet.

## Sound

`lib/sound.ts` plays the theme and the rain through the Web Audio API. The rain is drips plus a quiet tone, not a noise bed. `scripts/generate-audio.mjs` writes `public/audio/*.wav`. `lib/audio.test.ts` checks the theme seam and the rain level. Sound off suspends the audio context.

## Deploy

`.github/workflows/ci.yml` jobs must stay named `Test` and `Build`. Build needs Test. `vercel.json` `ignoreCommand` runs `node scripts/wait-for-ci.mjs`. Exit 1 continues the Vercel build. Exit 0 skips it. Production waits until the latest Test and Build checks have both succeeded. A failed, skipped, or cancelled check skips production. A timeout or an unreadable status skips too. Previews, where `VERCEL_ENV` is not `production`, build immediately. Do not rename the jobs without updating `scripts/ci-gate.mjs` and `lib/ci-gate.test.ts`.
