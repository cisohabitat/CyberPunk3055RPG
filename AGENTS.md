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

The six-phase status and remaining production milestones are tracked in [docs/ROADMAP.md](docs/ROADMAP.md). The candidate contains 107 scenes and 281 choices; retain all four original finales.

This review adds a compact commitments panel, contextual next steps, and warnings on week-closing choices when a memory promise remains open. The memory bench places inspection controls in each fragment row and expands inspected source details on request. Archive preservation alone is not independent verification; exposed-location testimony can corroborate an order without protecting its witness. Motion and reading pace are independent settings. Story shortcuts ignore key repeats and focus inside the character sheet. Manual slots reject invalid date metadata. See [the current review and grade](docs/REVIEW.md).

Audio resumes from an explicit player gesture when sound is enabled or a saved sound-enabled run is continued, so browser autoplay restrictions do not strand the score. Unsupported audio remains optional.

Inspecting a memory fragment opens its source text and moves focus to that source summary; the player can revisit or collapse inspected sources.

At Ward Nine, Nia appears in a private witness ledger beside the memorial; she is explicitly a living witness, and her current address is not displayed.

Score and cue loading never wait on `AudioContext.resume()`: browser policy or an unavailable audio device can delay that promise indefinitely. Resume requests are optional and nonblocking; player actions can retry activation.

## Production slice expansion

The memory bench now requires comparing the signature with the later counter-order and labeling the packet before choosing custody. A misleading interpretation receives source-based feedback; no interpretation or public accusation independently authenticates the issuing key. The player can publish a bounded account or an early allegation, then answer a neighborhood challenge with a source, correction, or unresolved question during The Week.

Witness protection now starts with Nia's terms and one preparation: scanner protocol, patrol scouting, a volunteer escort, or a braced chair. Each practiced skill unlocks a corresponding transfer method, as well as a distinct archive method. A direct private-room transfer costs ninety creds. Origin tools and faction favors remain alternatives. A successful new transfer pauses for Nia to review her account; recording can be deferred and resumed before the week closes. A second transfer can protect a new location after a breach without erasing the original exposure.

After a prepared memory account, the return to Ward Nine offers a clinic or records-table visit before the original wall scene. Conversations and aftermath reflect verification, consent, correction, exposure, and relocation. Compromised and unresolved commitments are named in the collapsed summary. Nia is a persistent cast member; the current portrait uses a location plate pending commissioned character art.

The state remains version 2 with the autosave key `saint-shard-3055-v1`. Existing transfers already in progress retain their direct route; old bench saves can complete the new comparison. Preserve the four finales, 1d10, base stat cap, strain cap, and saved die outcomes. New operation scenes live in `lib/story/operations.ts`; gameplay and continuity regressions are covered by `lib/investigation.test.ts` and `tests/game.spec.ts`.

The [full production plan](docs/AAA_PRODUCTION_PLAN.md) remains the long-term program. This build advances its gameplay slice; commissioned assets, human listening review, external player research, localization, and physical-device acceptance remain production gates.

### Staged archive investigation

Prepared intact archives now lead through Edda’s access terms, one optional preparation, catalog/source comparison, retrieval, and a separate custody decision. Index, patrol, and hatch preparation modify the corresponding checks; failed retrieval retains the paid or old-employee ledger fallback. A countersigned invoice corroborates cancellation without authenticating a digital issuing key. Named publication requires Edda’s agreement; withholding the circulating name does not remove an existing signed extraction. Her later visit records employment review and offers forty-creds support without erasing exposure. Players who completed custody can visit multiple neighborhood contacts once before proceeding to the wall. Edda appears in the encountered cast. Existing unbriefed archive saves and recorded rolls retain their direct route. Save version and key remain unchanged. See [the production slice record](docs/PRODUCTION_SLICE.md) for verification and open production gates.

Regular gameplay exposes the location and act as a screen-reader heading; finales retain their visible ending heading.


### Public hearing and campaign replay

At the final arrival, prepared memory accounts can enter an optional public hearing. Choose a source-supported scope, ask separately for Nia’s public quotation permission when a safe approved recording is available, answer a source challenge, and file or withdraw the draft. A breached location leaves her public quotation unavailable even after relocation. A public statement never creates corroboration or authenticates a key. Corrections remain beside the challenged claim; withdrawal does not erase what attendees heard. Filing returns to the four original finale choices and cannot be repeated for trust. The source brief distinguishes authorization, corroboration, digital-key authentication, and witness permission. A filed inquiry survives even when the player leaves the memorial silently. Earlier packet corrections now acknowledge corroboration obtained later.

Run `npm run story:replay` for twenty-four deterministic full-campaign fixtures in `qa/routes/`, or pass a fixture path. Each fixture defines character creation, stable choice ids, explicit die faces, save/reload checkpoints, and expected ending, evidence flags, and journal entries. The runner reports the exact scene and step on illegal choices, omitted dice, or incorrect outcomes. It is a development command with no production debug interface or automatic uploads. The normal unit suite runs these fixtures. State version 2 and `saint-shard-3055-v1` remain unchanged; existing final-arrival saves retain all original ending options.


### Field equipment and recovery

The district repair bench offers one field kit per week: Archive Probe (140 creds), Chair Harness (120), Clinic Desk Guide (100), or Route Shroud (140). Each adds +2 only to the mission checks listed in its description. Kits persist in inventory and need no matching perk; they complement an earned skill without increasing base stats. The shop compares these prices with ninety-creds private witness care and forty-five-creds staffed recovery. Buying equipment supplies no room, evidence, or consent. Old rolls without the new equipment retain their existing modifiers.

From the dry canal, a runner with strain can use one recovery visit this week: forty-five creds removes up to 3 strain, clinic standing 2 can be spent down by one step for up to 2 strain, or a free short rest removes 1 strain. Betrayal blocks the clinic favor, while paid care and a short rest remain available. Previews show actual bounded relief, not more than the current strain. No-strain care and repeated use are blocked by the canonical engine choice. The quiet follow-up preserves witness exposure, source gaps, and unfinished promises. Stat cap 5, strain cap 5, 1d10, save version 2, and `saint-shard-3055-v1` stay unchanged.

`npm run story:replay` now checks twenty-four full routes, including all four kits with weak secondary skills. Fixtures can assert ending, flags, journal, inventory, credits, and strain; the command reports final resources and restored checkpoints. The normal unit suite runs these routes. The latest production record includes directed browser campaigns and remaining acceptance gates.


### Neighborhood coolant emergency

A prepared memory account unlocks an optional clinic coolant emergency from the dry canal. Choose one Chrome, Face, Ghost, or Nerve repair attempt. Kerr grants +1 only if he previously heard the names and did not sell your confession. Investigation kits do not modify pump checks. A failed attempt offers a thirty-five-creds cold-storage courier, carrying the medicines for 2 strain, or leaving staff to handle an unobserved transfer at a cost of one clinic-trust step. A successful repair can remain in the neighborhood record (wards +1) or earn a forty-creds Helion rebate (Helion +1, wards −1) that exposes the contractor handle and station number without patient names. Neither repairing nor transferring creates historical evidence, witness safety, or publication consent.

One attempt and one final disposition prevent retries and reward farming. A later optional service-door visit reflects cooling, transferred supplies, the receipt, and Kerr's earlier conduct. Completing this emergency allows other neighborhood visits to return to the neighborhood hub before the wall. Existing saves and routes stay valid; save version 2, `saint-shard-3055-v1`, 1d10, and the four original finales remain. Nineteen deterministic campaign fixtures include four emergency routes with saved checks and explicit resource expectations. See the production slice record for play and acceptance evidence.


### Edda’s private employment request

After a signed extraction or named source exposes Edda and suspends her archive shift, the neighborhood visit offers an optional request for temporary paid work. Players who already contributed forty creds or recorded her limits can return from the neighborhood hub. Edda separately authorizes her name on a private payroll application; that changes no public source permission and includes no witness recording or patient list. She can decline, leaving the original source and inquiry intact.

A successful Spire old-key favor supplies an earned closure receipt. Otherwise reconcile the payroll ledger (Chrome DC 9), negotiate a supervised assignment (Face DC 8; Helion standing 2 adds +1), fund a sixty-creds worker-representation appointment, or leave the signed request pending. There is one desk attempt. Successful assistance secures one paid bench assignment while archive access remains suspended and the records inquiry continues. A failed check leaves the application pending; representation guarantees an appointment, not a wage or inquiry decision. Record the actual reply before returning to the neighborhood. The earlier forty-creds bridge is separate and stays spent.

The commitments panel and journal distinguish an open application, temporary paid work, and unresolved review. The ending preserves exposure and the inquiry alongside the actual payroll response. New scenes live in `lib/story/employment.ts`; four full-campaign replay fixtures assert resources, permission, and outcomes through saved checkpoints. The graph contains 99 scenes / 258 choices. All four original finales, base-stat and strain caps, 1d10, save version 2, and `saint-shard-3055-v1` remain unchanged.


### Six-phase production implementation

Settings now offers illustrated or text-only artwork. Text-only play omits portrait, scene-background, district-card, and check-result artwork requests while retaining speaker labels, choices, goals, and all story content. The setting persists with other preferences; older preferences default to illustrated play. Audio remains separately optional. The Week has a distinct procedural score, with chapel/ward location identity preserved.

The repaired clinic circuit offers a later maintenance appointment: twenty creds or neighborhood standing 2 with a cost of one step of trust. The journal and ending record a future appointment, not a completed inspection or permanent cure. Campaign commitments track the emergency, including failed pumps whose medicines were saved elsewhere.

The six-scene pump mission is authored in `content/community.json` and compiled through validated choices, effects, and conditional prose. Global scene merging rejects duplicate ids. See [the authoring workflow](docs/AUTHORING.md). All original scene/choice ids, pending dice, 1d10 rules, and save version 2 with `saint-shard-3055-v1` remain compatible. Nineteen replay routes include all three origins.

After building, `npm run production:report` produces a source catalog, searchable offline review HTML, route-coverage gaps, hashed asset inventory, budget results, and six-phase acceptance status under `qa/production/reports/`. CI retains these artifacts for thirty days and fails technical budget or replay violations. `npm run production:report -- --release` rejects a commercial acceptance claim while human gates remain pending. `npm run production:probe -- URL` compares illustrated/text-only production loads with synthetic browser profiles; it installs no player telemetry. See [the six-phase execution record](docs/PHASE_EXECUTION.md) for exact scope, limits, and external work still needed.

### Attributed cross-examination

At the reconstruction bench, an optional question sequence asks what Mara knew before signing and whose assurance she accepted. Her answers enter the journal as claims; no question authenticates an issuing key, clears her signature, or changes witness consent. Existing direct interpretation choices and old saves remain usable. The three new scenes preserve the four finales, save version 2, `saint-shard-3055-v1`, 1d10 and caps. See docs/DEVELOPMENT_CYCLES.md.

### Clinic distribution dispute

An optional second JSON-authored encounter at the canal compares housing slips, a public bus map and appointment cards. Private courier funding, one negotiated desk attempt, carrying sealed cards, or posting a stop/window supply distinct costs and visibility. Failed checks retain paid/public recovery; a public notice contains no home list, and dispatch acceptance guarantees no delivery or attendance. Existing goals, finales, 1d10 caps, save version 2 and `saint-shard-3055-v1` stay stable.
