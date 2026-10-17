# Saint Shard — agent guide

This file is for anyone changing the code. [README.md](README.md) is for players and for the deploy. Keep the two on the same game.

`docs/PROJECT_DESCRIPTION.md` provides the short GitHub About description, a game overview and links to the latest feature report. Keep its player-facing claims consistent with the implemented game and media credits. The README links to it near the introduction; detailed test evidence remains in the corresponding phase report.

## Keep both docs current

For every repository change, update `README.md` and `AGENTS.md` in the same change. Always review both for accuracy before committing or deploying, including changes to gameplay, art, audio, saves, configuration, tests, tooling and documentation. Explain the actual change; do not use timestamp-only or whitespace-only edits to satisfy the rule. Quote the four goal sentences from `lib/story/goal.ts` in both files, and keep the save key `saint-shard-3055-v1` in both. `lib/docs.test.ts` fails if either file drops them.

CI's Test job runs `scripts/docs-freshness.mjs` before installing dependencies or running source tests. It compares the full before/after push range, or the pull request head against its merge base, and requires changed committed content in both documents. Missing documents, mode-only changes and unavailable history cannot bypass the check. An identical repository tree needs no artificial edit. The first branch snapshot must contain both files. There is no skip flag. This enforces content updates; the author must still verify their completeness and factual accuracy. Production remains gated on successful exact-commit Test and every existing Browser/Build check. Cursor loads `.cursor/rules/keep-docs.mdc` on every turn so this rule stays in front of an agent.

Do not add accounts, a database, a 3D city, multiplayer, or a new dice system unless the task asks for it. The fiction is original.

## Accompanying scene art — standing rule

Every new scene must include an explicit art decision in `qa/media/scene-art.json` in the same change. If it introduces a distinct place, a character without suitable art, or a major visual moment, ship accompanying art when needed; reuse a fitting asset when it already communicates that moment. Record the rationale for `illustration`, `portrait`, `background` or `text`, including deliberate text-only treatment. Enumerate scene ids: no wildcard or automatic fallback decisions for future scenes. Revisit the decision when the scene’s setting, speaker or visual meaning changes.

Add framed art through `lib/art.ts` with a description, caption and responsive sources. Art must match the scene’s actual knowledge and outcomes: do not depict unearned closure, payment, witness safety, evidence or consent. Neutral setting art can span unresolved and completed states; use state-specific art only when the corresponding outcome is known. Record new assets’ provenance and update the media audition and credits. Preserve text-only preferences, the visible goal, missing-art tolerance and media budgets; play at phone and desktop sizes. `npm test` and the production report reject missing, duplicate, stale or mismatched art decisions and missing files. These checks enforce a documented decision, not independent artistic acceptance. See [AUTHORING.md](docs/AUTHORING.md).

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

`week-after` goes to `card_week` (The Hour, then the street). The street names the origin. `back-to-board` goes to `card_wall`. Open districts get a door scene before the check, and each door has a refusal that changes the check scene. `act2_middle` names Junie Calder before the week ending. `ward_wall` shows Ivo Pell, Junie Calder when the journal has `ward-nine`, Nia Pell when the wards are at 2 or more, and a check for Pell the younger. The ending hub stays at `act3_arrival`. A finale shows three retell lines from `nightRetell` before the coda. Seen codas render on the title screen. Unseen ending titles stay hidden; the catalog groups discovery counts by chapter.

Leaving a scene with a speaker sets `met_quill`, `met_mara`, `met_kerr`, `met_lumen`, `met_ives`, or `met_sera`. `speakerRole` puts the role next to the name. With no speaker, the plate caption is the handle and the origin. The sheet lists who you have met. `commitChoice` appends the choice label to `log`. Old saves migrate with an empty log. Version stays 2. The optional `pendingCheck` records the scene, legal choice, and die face before animation; it must survive saves and imports and be removed only when its outcome is committed.

## Rules that should stay stable

- 1d10. Stats are chrome, nerve, face, and ghost. Two points to spend. Cap is 5. Strain max is 5.
- Origins: gutterwire, spire, dustline. Complications: `debt` (−40 creds, Quill +1), `optic` (Strain 1, Chrome +1, Lumen +1), `on-file` (Helion +2).
- Factions are quill, lumen, helion, and wards, clamped from −3 to 5.
- A choice that changes a faction, an item, or a journal clue says so in `detail` when the consequence is real. `effectPreview` adds the numeric shift (creds, strain, items, factions) before the click. At Strain 4, `CheckDialog` shows "The chair is close." before the roll. `statVoice` in `lib/story/voices.ts` is the one sentence that stat says before the die. It does not change the bonus.
- Save version is 2. The key is `saint-shard-3055-v1`. Sound is `saint-shard-sound`. Text size is `saint-shard-text` (`html[data-text]` 0, 1, or 2). Codex is `saint-shard-codex`. `log` is the recent choice labels.
- Storage access catches blocked getters, failed reads, quota errors, and failed removals. Reads fall back to empty saves/codex and default preferences. Writes return a success boolean. `GameApp` uses the save result to show a session-only progress notice in play and on the title screen; a failed save must not prevent play. Sound and text controls still work without persisted preferences.

## Screens

Desktop, wider than 1100px: the sheet is a 320px column, and the portrait is 220px. Tablet, 1100px and under: the sheet is a drawer with a focus trap, and the portrait is 160px. Phone, 700px and under: the portrait is compact, prose spans the reading width below the scene header, district cards stack, and Settings, Saves, Sheet, and Abandon share one row so the goal stays in the first screen. `viewportFit` is `cover`. The goal element is `data-testid="goal"`. Prose shows the whole scene by default. Players can select paragraph pacing, and an explicit saved paragraph preference remains respected. The live announcement is the place, the act, and the goal. Play a changed screen at 390px and at desktop, and confirm the goal is visible without opening the sheet.

Story number shortcuts are disabled while the sheet is open. Sheet tabs use Left/Right arrows with wrapping, plus Home/End. The drawer and dialogs use native `dialog.showModal()` for background isolation, focus trapping, Escape handling, and focus restoration. All sheet panels retain ids, with inactive panels hidden. Background story shortcuts also ignore form fields and other open dialogs.

## Sound

`lib/sound.ts` plays the theme and the rain through the Web Audio API. The rain is drips plus a quiet tone, not a noise bed. Week-board scenes use `sting-week`. Ward Nine uses `sting-ward`. `scripts/generate-audio.mjs` writes `public/audio/*.wav`. `lib/audio.test.ts` checks the theme seam, the rain level, and the two new stings. Sound off suspends the audio context. `theme-chapel` and `theme-ward` are extended distinct beds, crossfaded by `sceneMood`; `sting-memory` marks the bench. Music, ambience, effects and selected voices use separate mixer buses. Scene effects never clear a pending roll when sound or volume changes. Unmounting play stops the bed.

## Deploy

`.github/workflows/ci.yml` checks must stay named `Test` and `Build`. Test runs source checks. Four `Browser` matrix jobs need Test, install the existing browser/audio dependencies, compile, audit production, and each run its full existing project (chromium, phone, firefox, webkit) with four workers. Chromium also runs the unchanged native permission smoke and performance probe. Keep fail-fast disabled and distinct per-project evidence artifacts. Build runs even after an upstream failure and requires both Test and the entire Browser matrix to succeed through `scripts/require-browser-checks.mjs`; failure, skip, cancellation or unknown status must fail the aggregate. Build directly needs Test and Browser. No browser check is removed, optionalized or replaced by the aggregate. `vercel.json` runs `node scripts/wait-for-ci.mjs`: production publishes only after exact-commit Test and Build succeed. Failed, skipped, canceled, unreadable or expired checks block publication; previews retain their existing behavior. Do not rename Test/Build without updating `scripts/ci-gate.mjs` and `lib/ci-gate.test.ts`.

## Campaign expansion and recovery

The bench is an optional first choice in `mara_why`; the direct `why-signed` route remains valid for legacy jobs. `lib/story/memory.ts` inspects signature/order/roster flags and seals exactly one disposition. `lib/story/missions.ts` supplies earned training, origin contracts, witness transfer, checkpoint recovery, and archive verification. `requireAllFlags`, `requireOrigin`, and `requireFaction` belong to the engine, not just the UI. `commitChoice` uses the canonical scene choice. Keep the 1d10 rules and base stat cap of 5. One earned perk adds a check bonus, never a base-stat increase. Tools explicitly consumed by a choice are removed after resolution.

`aftermath` in `lib/evidence.ts` describes only known consequences. `memoryDisposition` and categorized journal entries expose source quality and promise status. Protecting a roster alone must not claim Nia was moved. Missing verification must not claim a proven command chain. `third_attempted` prevents retry farming at the wall.

`lib/vault.ts` provides three snapshot slots and export/import. The legacy autosave key `saint-shard-3055-v1` and version 2 stay stable. Storage validates stats, numeric values, items, rolls, and pending-choice legality. A previous valid autosave is copied to its `-backup` key before replacement; invalid autosaves fall back to that copy. Failed persistence leaves play usable with a session-only notice. The snapshot checksum is accidental-corruption detection, not authentication. Imports reject files above 1 MB and ask before replacing an active run. Clearing an active run leaves manual slots intact.

`lib/preferences.ts` migrates old sound/text preferences into `saint-shard-preferences`. `SettingsDialog` supports text, contrast, paragraph/all reading, reduced motion, sound channels, and opt-in standard gamepad input. Settings apply during the session even if storage fails. `SaveDialog` is available on title and play. Diagnostics are explicit exports of bounded incident codes; never add names, choices, user identifiers, save contents, or automatic uploads.

Use `npm run story:report -- story-report.json` to inspect the graph and 900 seeded completion simulations. `lib/campaign.test.ts` covers the new consequence paths. `tests/game.spec.ts` covers player flows, portable pending rolls, corrupted imports, and automated accessibility. Match implementation changes in README and this guide. `docs/PRODUCTION.md`, `docs/RELEASE.md`, and `CREDITS.md` describe human review and rights gates without claiming they have passed.

The deterministic score generator runs automatically before development, tests, and production builds. The chapel and ward beds and memory cue are generated assets; keep their source in `scripts/generate-audio.mjs`.

The six-phase status and remaining production milestones are tracked in [docs/ROADMAP.md](docs/ROADMAP.md). The current candidate contains 197 scenes and 598 choices; retain all four original finales.

This review adds a compact commitments panel, contextual next steps, and warnings on week-closing choices when a memory promise remains open. The memory bench places inspection controls in each fragment row and expands inspected source details on request. Archive preservation alone is not independent verification; exposed-location testimony can corroborate an order without protecting its witness. Motion and reading pace are independent settings. Story shortcuts ignore key repeats and focus inside the character sheet. Manual slots reject invalid date metadata. See [the current review and grade](docs/REVIEW.md).

Audio resumes from an explicit player gesture when sound is enabled or a saved sound-enabled run is continued, so browser autoplay restrictions do not strand the score. Unsupported audio remains optional.

Inspecting a memory fragment opens its source text and moves focus to that source summary; the player can revisit or collapse inspected sources.

At Ward Nine, Nia appears in a private witness ledger beside the memorial; she is explicitly a living witness, and her current address is not displayed.

Score and cue loading never wait on `AudioContext.resume()`: browser policy or an unavailable audio device can delay that promise indefinitely. Resume requests are optional and nonblocking; player actions can retry activation.

## Production slice expansion

The memory bench now requires comparing the signature with the later counter-order and labeling the packet before choosing custody. A misleading interpretation receives source-based feedback; no interpretation or public accusation independently authenticates the issuing key. The player can publish a bounded account or an early allegation, then answer a neighborhood challenge with a source, correction, or unresolved question during The Week.

Witness protection now starts with Nia's terms and one preparation: scanner protocol, patrol scouting, a volunteer escort, or a braced chair. Each practiced skill unlocks a corresponding transfer method, as well as a distinct archive method. A direct private-room transfer costs ninety creds. Origin tools and faction favors remain alternatives. A successful new transfer pauses for Nia to review her account; recording can be deferred and resumed before the week closes. A second transfer can protect a new location after a breach without erasing the original exposure.

After a prepared memory account, the return to Ward Nine offers a clinic or records-table visit before the original wall scene. Conversations and aftermath reflect verification, consent, correction, exposure, and relocation. Compromised and unresolved commitments are named in the collapsed summary. Nia is a persistent cast member with a generated character portrait; commissioned art and independent visual review remain future production work.

The state remains version 2 with the autosave key `saint-shard-3055-v1`. Existing transfers already in progress retain their direct route; old bench saves can complete the new comparison. Preserve the four finales, 1d10, base stat cap, strain cap, and saved die outcomes. New operation scenes live in `lib/story/operations.ts`; gameplay and continuity regressions are covered by `lib/investigation.test.ts` and `tests/game.spec.ts`.

The [full production plan](docs/AAA_PRODUCTION_PLAN.md) remains the long-term program. This build advances its gameplay slice; commissioned assets, human listening review, external player research, localization, and physical-device acceptance remain production gates.

### Staged archive investigation

Prepared intact archives now lead through Edda’s access terms, one optional preparation, catalog/source comparison, retrieval, and a separate custody decision. Index, patrol, and hatch preparation modify the corresponding checks; failed retrieval retains the paid or old-employee ledger fallback. A countersigned invoice corroborates cancellation without authenticating a digital issuing key. Named publication requires Edda’s agreement; withholding the circulating name does not remove an existing signed extraction. Her later visit records employment review and offers forty-creds support without erasing exposure. Players who completed custody can visit multiple neighborhood contacts once before proceeding to the wall. Edda appears in the encountered cast. Existing unbriefed archive saves and recorded rolls retain their direct route. Save version and key remain unchanged. See [the production slice record](docs/PRODUCTION_SLICE.md) for verification and open production gates.

Regular gameplay exposes the location and act as a screen-reader heading; finales retain their visible ending heading.


### Public hearing and campaign replay

At the final arrival, prepared memory accounts can enter an optional public hearing. Choose a source-supported scope, ask separately for Nia’s public quotation permission when a safe approved recording is available, answer a source challenge, and file or withdraw the draft. A breached location leaves her public quotation unavailable even after relocation. A public statement never creates corroboration or authenticates a key. Corrections remain beside the challenged claim; withdrawal does not erase what attendees heard. Filing returns to the four original finale choices and cannot be repeated for trust. The source brief distinguishes authorization, corroboration, digital-key authentication, and witness permission. A filed inquiry survives even when the player leaves the memorial silently. Earlier packet corrections now acknowledge corroboration obtained later.

Run `npm run story:replay` for sixty-eight deterministic full-campaign fixtures in `qa/routes/`, or pass a fixture path. Each fixture defines character creation, stable choice ids, explicit die faces, save/reload checkpoints, and expected ending, evidence flags, and journal entries. The runner reports the exact scene and step on illegal choices, omitted dice, or incorrect outcomes. It is a development command with no production debug interface or automatic uploads. The normal unit suite runs these fixtures. State version 2 and `saint-shard-3055-v1` remain unchanged; existing final-arrival saves retain all original ending options.


### Field equipment and recovery

The district repair bench offers one field kit per week: Archive Probe (140 creds), Chair Harness (120), Clinic Desk Guide (100), or Route Shroud (140). Each adds +2 only to the mission checks listed in its description. Kits persist in inventory and need no matching perk; they complement an earned skill without increasing base stats. The shop compares these prices with ninety-creds private witness care and forty-five-creds staffed recovery. Buying equipment supplies no room, evidence, or consent. Old rolls without the new equipment retain their existing modifiers.

From the dry canal, a runner with strain can use one recovery visit this week: forty-five creds removes up to 3 strain, clinic standing 2 can be spent down by one step for up to 2 strain, or a free short rest removes 1 strain. Betrayal blocks the clinic favor, while paid care and a short rest remain available. Previews show actual bounded relief, not more than the current strain. No-strain care and repeated use are blocked by the canonical engine choice. The quiet follow-up preserves witness exposure, source gaps, and unfinished promises. Stat cap 5, strain cap 5, 1d10, save version 2, and `saint-shard-3055-v1` stay unchanged.

`npm run story:replay` now checks sixty-eight full routes, including all four kits with weak secondary skills. Fixtures can assert ending, flags, journal, inventory, credits, and strain; the command reports final resources and restored checkpoints. The normal unit suite runs these routes. The latest production record includes directed browser campaigns and remaining acceptance gates.


### Neighborhood coolant emergency

A prepared memory account unlocks an optional clinic coolant emergency from the dry canal. Choose one Chrome, Face, Ghost, or Nerve repair attempt. Kerr grants +1 only if he previously heard the names and did not sell your confession. Investigation kits do not modify pump checks. A failed attempt offers a thirty-five-creds cold-storage courier, carrying the medicines for 2 strain, or leaving staff to handle an unobserved transfer at a cost of one clinic-trust step. A successful repair can remain in the neighborhood record (wards +1) or earn a forty-creds Helion rebate (Helion +1, wards −1) that exposes the contractor handle and station number without patient names. Neither repairing nor transferring creates historical evidence, witness safety, or publication consent.

One attempt and one final disposition prevent retries and reward farming. A later optional service-door visit reflects cooling, transferred supplies, the receipt, and Kerr's earlier conduct. Completing this emergency allows other neighborhood visits to return to the neighborhood hub before the wall. Existing saves and routes stay valid; save version 2, `saint-shard-3055-v1`, 1d10, and the four original finales remain. Nineteen deterministic campaign fixtures include four emergency routes with saved checks and explicit resource expectations. See the production slice record for play and acceptance evidence.


### Edda’s private employment request

After a signed extraction or named source exposes Edda and suspends her archive shift, the neighborhood visit offers an optional request for temporary paid work. Players who already contributed forty creds or recorded her limits can return from the neighborhood hub. Edda separately authorizes her name on a private payroll application; that changes no public source permission and includes no witness recording or patient list. She can decline, leaving the original source and inquiry intact.

A successful Spire old-key favor supplies an earned closure receipt. Otherwise reconcile the payroll ledger (Chrome DC 9), negotiate a supervised assignment (Face DC 8; Helion standing 2 adds +1), fund a sixty-creds worker-representation appointment, or leave the signed request pending. There is one desk attempt. Successful assistance secures one paid bench assignment while archive access remains suspended and the records inquiry continues. A failed check leaves the application pending; representation guarantees an appointment, not a wage or inquiry decision. Record the actual reply before returning to the neighborhood. The earlier forty-creds bridge is separate and stays spent.

The commitments panel and journal distinguish an open application, temporary paid work, and unresolved review. The ending preserves exposure and the inquiry alongside the actual payroll response. New scenes live in `lib/story/employment.ts`; four full-campaign replay fixtures assert resources, permission, and outcomes through saved checkpoints. The current graph contains 171 scenes / 477 choices. All four original finales, base-stat and strain caps, 1d10, save version 2, and `saint-shard-3055-v1` remain unchanged.


### Six-phase production implementation

Settings now offers illustrated or text-only artwork. Text-only play omits portrait, scene-background, district-card, and check-result artwork requests while retaining speaker labels, choices, goals, and all story content. The setting persists with other preferences; older preferences default to illustrated play. Audio remains separately optional. The Week has a distinct procedural score, with chapel/ward location identity preserved.

The repaired clinic circuit offers a later maintenance appointment: twenty creds or neighborhood standing 2 with a cost of one step of trust. The journal and ending record a future appointment, not a completed inspection or permanent cure. Campaign commitments track the emergency, including failed pumps whose medicines were saved elsewhere.

The six-scene pump mission is authored in `content/community.json` and compiled through validated choices, effects, and conditional prose. Global scene merging rejects duplicate ids. See [the authoring workflow](docs/AUTHORING.md). All original scene/choice ids, pending dice, 1d10 rules, and save version 2 with `saint-shard-3055-v1` remain compatible. Nineteen replay routes include all three origins.

After building, `npm run production:report` produces a source catalog, searchable offline review HTML, route-coverage gaps, hashed asset inventory, budget results, and six-phase acceptance status under `qa/production/reports/`. CI retains these artifacts for thirty days and fails technical budget or replay violations. `npm run production:report -- --release` rejects a commercial acceptance claim while human gates remain pending. `npm run production:probe -- URL` compares illustrated/text-only production loads with synthetic browser profiles; it installs no player telemetry. See [the six-phase execution record](docs/PHASE_EXECUTION.md) for exact scope, limits, and external work still needed.

### Attributed cross-examination

At the reconstruction bench, an optional question sequence asks what Mara knew before signing and whose assurance she accepted. Her answers enter the journal as claims; no question authenticates an issuing key, clears her signature, or changes witness consent. Existing direct interpretation choices and old saves remain usable. The three new scenes preserve the four finales, save version 2, `saint-shard-3055-v1`, 1d10 and caps. See docs/DEVELOPMENT_CYCLES.md.

### Clinic distribution dispute

An optional second JSON-authored encounter at the canal compares housing slips, a public bus map and appointment cards. Private courier funding, one negotiated desk attempt, carrying sealed cards, or posting a stop/window supply distinct costs and visibility. Failed checks retain paid/public recovery; a public notice contains no home list, and dispatch acceptance guarantees no delivery or attendance. Existing goals, finales, 1d10 caps, save version 2 and `saint-shard-3055-v1` stay stable.

### Delayed distribution and character boundaries

At Ward Nine, the clinic notice gets a separate reply: two private receipt acknowledgements, an observed public window with callback requests, or unresolved staff dispatch. Public-window replies allow a ten-creds private reply channel or free withdrawal; neither confirms replacement appointments nor erases earlier observation. Nia’s optional contact conversation distinguishes a clinic relay from a pause in questions, with no new recording/public consent. Original visits remain usable. Save version 2, `saint-shard-3055-v1`, four finales and rules stay stable.

### Acquired-source review

The reconstruction/publication bench, archive comparison, district challenge, records visit and public hearing expose a keyboard-accessible acquired-source disclosure. It retains journal attribution, original claims/corrections and current corroboration/quotation status without supplying new evidence. The public hearing still shows its source-strength summary. A private contact relay is not public quotation; a prior location breach still withholds it. No player data is uploaded.

## Playtest response invariants

Keep initial memory inspection interactive; on later memory steps place fresh prose and choices before the collapsed “Review the inspected memory” dossier. The keyboard skip link must focus choices in both reading modes. Constrain Settings grid tracks and native controls, including classic desktop scrollbars and largest text. Restores announce source and chapter/place and remount the play session so restoring never shows gameplay resource deltas; retain recorded pending dice. Check previews show bounded numeric costs before the existing critical adjustment without granting effects or revealing new evidence. Lumen’s offer does not hand over a marker; existing markers remain after refusal. Explain the closed copying window only for an unfulfilled promise after leaving the chapel. Ending discovery partitions existing ids into eight Hour outcomes, three Week outcomes and four Wall finales; unseen titles stay hidden and replay hints require opting in. See `docs/PLAYTEST_RESPONSE.md`; these changes do not complete independent production acceptance gates.

## Playable prologue

`CreateScreen` calls `createCharacter` with `startWithPrologue: true`; the low-level factory retains its legacy job entry by default for existing callers. New UI runs start at `opening_city`, then `opening_self`, `opening_approach` and the optional `opening_neighbor` before `stall`. QA campaign fixtures explicitly include the prologue. Use the arrival goal “Find Quill at the Ward Four noodle stall. Hear what he is offering.” until the briefing; keep the original four goals above. Origins and complications change the personal context. One `opening_survival`, `opening_identity` or `opening_exit` flag records motivation and echoes in Quill’s text; `opening_neighbor_heard` echoes listening to the stallholder. These are roleplaying choices, not source proof or stat bonuses. `skip-opening` enters the existing job without assigning a reason. Do not force the prologue into existing saves or reveal the memo’s truth before discovery. All opening scenes remain within the existing save version/key, reading settings, keyboard controls and recovery flows. The production probe measures the first playable prologue scene and records its scene id.

## Asa’s staged freight favor

`lib/story/freight.ts` expands the optional Dustline origin favor through terms, three source checks, one preparation, crossing, recovery, intake and result. The old direct courier route remains compatible, but cannot repeat after `origin_done`. Skill/preparation pairs unlock distinct methods without increasing the existing skill bonus or stat cap. A paid route costs 25; zero-fund recovery uses the official desk. Exposure persists through paid recovery. Only an observed private receipt earns `burner-route` once; late clinic confirmation never grants a retroactive clearance. Freight records supply neither evacuation proof nor patient treatment nor witness consent. Asa’s visit is available from the neighborhood or wall and returns to its entry hub. Preserve opening motivation in the reflection, source uncertainty, pending rolls and the existing save schema/key. Asa has a generated character portrait; commissioned art and independent visual review remain production work.

## Gutterwire staged shelter favor

`lib/story/shelter.ts` separates response terms, one preparation, valve repair, accessible evacuation, observed hall arrival, consenting room allocation and delayed neighbor response. Keep the direct `move-valve` route for existing play; both favor entries hide after `origin_done`. A DC 10 Nerve valve check has a +1 brace bonus; a maximum unequipped trained Gutterwire build still risks one die face. Chrome/controller and Face/crew methods have explicit strain/trust costs; Ghost/ramp evacuates without repairing the valve. A failed attempt cannot reroll; zero-fund evacuation remains available. Forty-creds fitting repairs capacity but grants no token until beds are assigned. Private referral capacity requires the household’s stated agreement and annex support (40 creds, ward standing 2 spent down by one, or carrying donations at Strain +1). Only that assignment grants one `witness-token`; resident rooms and shared hall arrival grant none. Later laundry help preserves uncertainty, valve condition, prior capacity and token consumption. Visits return to their entry hub. Never grant historical evidence, Nia’s transfer or testimony from shelter work. Save version 2, `saint-shard-3055-v1`, pending dice and the original four finales remain stable. Story changes have engine, browser and full-campaign checkpoint coverage.

## Generated media treatment

`lib/art.ts` owns the speaker portrait registry and thirteen illustrated encounter scenes using seven environment plates. `SceneIllustration` displays semantic framed art after the goal/restore notice with fixed layout dimensions, responsive 600/1200-pixel sources and lazy decoding. `TITLE_ART` is separate symbolic key art for the start page; `OPENING_ART` remains the literal arrival scene. `TitleScreen` uses an eager, high-priority responsive image with live title/menu controls: desktop overlay, phone stack, opaque high-contrast reading area. Continue is first for a saved run; new-run replacement confirmation and dialog focus restoration remain mandatory. The title receives the artwork preference explicitly; text-only mode never mounts these images. Preserve the goal position, paragraph pacing, source controls and missing-art tolerance. Nia, Edda and Asa now use generated portraits; existing seven portraits remain unchanged. Do not reuse a pre-resolution shelter image as proof of a successful evacuation. `qa/media/art-provenance.json` identifies eleven image-generation masters and nineteen optimized JPEGs; tests check delivered asset integrity and explicit art decisions for all current scenes. The Spire counter, maintenance alcove and later payroll table use three neutral setting illustrations; adjacent steps reuse the appropriate plate, while the exit reflection keeps Edda’s portrait.

`scripts/score.mjs` contains the original 60-BPM, eight-bar stereo arrangements. Event tails and finite room reflections wrap cyclically; both channels must retain low seam jumps, headroom and distinct musical voicings. Scores use 22050 Hz/16-bit stereo PCM (32 seconds, below the 3 MiB per-file envelope); legacy ambience and cues remain 44100 Hz mono. `generate-audio.mjs` writes both formats before dev/test/build, and memory chimes echo E–C–B–A. Keep independent mixer buses, gesture activation, nonblocking resumes, scene crossfades and optional audio failure handling. No save, check or evidence behavior changes with media. Independent listening, visual craft and commercial rights gates remain pending; generation is not commissioned production or a regrade.


## Spire staged key retirement

Edda’s optional Spire favor now offers terms, three current-record inspections, one preparation, distinct Chrome/Face/Ghost/Nerve approaches, paid closure and staffed recovery. The original `clear-key` route remains compatible and cannot repeat after the origin favor ends. Retiring an obsolete maintenance key keeps her current account open; earlier charges and any archive inquiry remain separate. Only a checked, untraced closure earns one signal baffle. A failed roll keeps the old-badge trace through paid recovery; a free signed request remains pending until a later payroll reply is actually observed. Late closure can support Edda’s separately authorized private work application but earns no retroactive receiver, wage or historical authentication. The journal, commitments and ending preserve those distinctions. Both neighborhood and wall visits return to their entry hub. Save version 2, `saint-shard-3055-v1`, pending rolls, 1d10 rules, caps and all four original finales remain unchanged.

## Opening pacing and job acceptance

The arrival introduces the runner and memory trade in three paragraphs. Each origin names a concrete hope for tomorrow before choosing a reason for working. Quill states the target, deadline, advance, delivery payment and bodyguard in the first paragraph of the meeting; returning from a question uses a short terms recap. An optional ownership question follows the stallholder’s warning, identifies Mara as the owner of the hour and leaves Quill’s buyer unanswered. It grants no payment, proof or accepted contract and uses his existing portrait.

Goals distinguish finding Quill, choosing a personal reason, considering his offer and the accepted job. The original mission goal appears after acceptance; investigation, week and wall goals keep their existing precedence. Quill responds to the chosen reason in the departure, and the Chapel undercroft recalls it when the risk becomes real. Existing saves, prologue skipping, payment amounts, dice, four finales and `saint-shard-3055-v1` remain compatible. The scene-art catalog documents the new conversation. This is an internal pacing revision, with blind-player acceptance still pending.


## Playable memory timeline

At the reconstruction bench, an optional timeline lets you place three inspected sources into chronological slots, clear a draft and check timestamps. Partial arrangements survive reload/export with the existing version 2 save and `saint-shard-3055-v1` key. Native numbered choices support touch, keyboard and the existing controller interface; drag gestures are unnecessary. A mistaken order can be rebuilt or retained as unresolved.

Choose a claim, compare its source and decide whether it is supported, contradicted or unresolved. A wrong verdict offers a correction that retains the first attempt, or a disputed account with Lumen’s challenge attached. The district board separately resolves that challenge: correction costs one step of ward trust; repetition costs two and a neighbor withholds their name. Replies cannot repeat for rewards or penalties. The later records table, journal and finale retain the interpretation and correction independently of acquired corroboration. No timeline or verdict authenticates a key, clears a signature, moves a witness or supplies consent. Original direct interpretations, pending rolls, 1d10 caps and all four finales remain usable.

The same neutral three-fragment bench illustration accompanies the timeline; Mara and Lumen’s restrained expression variants accompany source feedback. All five new scenes have explicit art decisions. Sixty-eight full-campaign replay fixtures include supported, corrected and repeated investigation paths with save checkpoints. Independent player and artistic acceptance remain pending.


### Memory media and selected dialogue

Opened signature, command-receipt and roster cards now show matching illustrative close-ups. They contain no readable identities, addresses or authentication indicators; the written sources remain authoritative. Placed cards have compact thumbnails and a brief seating animation, suppressed by reduced-motion preferences and never replayed on save restoration. Missing close-ups leave the source and controls usable. Text-only mode omits these images and the Mara/Lumen expression variants.

Five quiet synthesized cues distinguish placement, clearing, aligned timestamps, mismatches and corrections. Location stings play on arrival or Sound activation rather than every bench question. Four fixed Mara/Lumen quotations offer explicit Listen and Stop controls after their text is visible. These are stock synthetic voices generated offline with Kokoro, not actor performances. There is no speech service, model or player-text processing in the browser. Sound is enabled by default for new players; a separate voice volume migrates older preferences to 70%. Music and ambience duck while a line plays, then return to the chosen levels. Scene changes, dialogs, Sound off and zero voice volume stop the line and cancel late starts; failed audio leaves dialogue readable.

`scripts/generate-voices.py` is an optional offline authoring tool with pinned model/style-vector hashes. CI and builds use the checked-in PCM WAVs and never download voice weights. Source quotations, generation settings, delivery hashes, model attribution and license copies are in `qa/media/voice-lines.json`, `qa/media/voice-provenance.json` and `qa/media/voice-sources/`; the offline audition includes all new media. Save version 2, recorded dice, the four finales and `saint-shard-3055-v1` stay unchanged. Independent visual, listening, rights and physical-device acceptance remain pending.


### Kerr’s collection and character conduct

The Week’s dry canal offers Kerr’s optional personal brace collection. Accept private terms, agree to recipient registration or decline before promising. Plan one entry and one exit on a native, keyboard-accessible route board; drafts save without charges. Departure commits the fare and physical effort once. Chrome, Ghost and Nerve use their matching exits; Face can negotiate any plan. Matching field-kit descriptions include depot uses. Quill’s introduction adds +2 only to Face; a previously postponed tab requires one forty-creds late repayment without erasing refusal or strain.

A failed approach allows a twenty-creds registered courier or an unresolved held case, without another roll. Entry registration persists through an anonymous exit. A separate observed handover completes delivery, which supplies no treatment, evidence or witness permission. At the final arrival, Kerr responds to actual terms; acknowledgement of a breach keeps the trace and opens one personal question, while denial closes contact. Quill has a separate later response. The cast sheet derives conduct from recorded choices and retains Kerr’s earlier betrayal. All four finales append these outcomes. Twelve scenes have explicit art decisions, including a neutral canal dispatch illustration and existing conversation portraits; text-only mode omits the artwork.

See [the execution and following-cycle plan](docs/RELATIONSHIP_SLICE.md). Sixty-eight full-campaign replay fixtures cover all four original finales and ten new relationship routes. Keep version 2, `saint-shard-3055-v1`, original choice ids, pending dice, 1d10 and stat/strain caps unchanged. Independent production acceptance and the 9+ target remain open.


### Mara’s current reply and Lumen’s own terms

At the Week’s dry canal, runners who heard the memo can visit Mara’s voluntary present-day conversation. Her new statement is separate from the recorded hour: she wants her own name on a private reply to the Ward Nine records desk. She refuses public release this week; Lumen refuses clinic sponsorship regardless of faction standing. Revise a refused proposal to private terms or leave it pending; refusal stays recorded. One optional quiet question can go to Mara or Lumen. Dispatch by walking (one strain) or courier (fifteen creds), or defer with terms saved. Costs cannot repeat.

A later visit records the desk’s intake into an unanswered queue, not an inquiry finding. Lumen chooses private desk contact without automatic quotation, endorsement or partnership; earlier betrayal remains. All four finales open their aftermath with a distinct character beat and retain the factual recap. A neutral clinic conversation illustration accompanies the room’s introductions; other steps use fitting existing portraits. Two additional fixed synthetic quiet lines offer Listen/Stop controls, using the existing optional voice mixer. They are generated offline; models and speech services never ship. The authoring generator supports `--only` to preserve existing clips.

See [the phased execution and following production work](docs/CHARACTER_ARCS.md) and [prepared fresh-player protocol](docs/CHARACTER_PLAYTEST.md). The protocol and blank local observation worksheet are preparation; independent sessions have not been performed. Preserve all original routes, 1d10 and caps, version 2 and `saint-shard-3055-v1`, recorded dice, evidence and consent. The 9+ target and six human acceptance gates remain open.

### Campaign pacing — roadmap phase 1

Briefings and return visits are shorter, with existing visit/completion flags preserving unfinished work and once-only outcomes. A brief personal-motive reminder remains visible in the opening’s first paragraph after reload. Mara's bench interview is explicitly a replay embedded in the hour; the voluntary Week reply remains a separate current conversation. Thirty-three scenes receive prose edits, while canonical choice effects, gates, destinations, costs and saved outcomes stay the same. Two interview buttons now say Replay. Existing suitable art accompanies the scenes, with recorded-speaker/return rationales updated; all six fixed voice quotations retain their matching audio.

See [the detailed phase execution and editorial evidence](docs/NARRATIVE_PACING.md) and [six-phase roadmap](docs/ROADMAP.md). The graph remains 171 scenes / 477 choices with 75 full-campaign replay fixtures. Preserve version 2 and `saint-shard-3055-v1`. Internal implementation does not complete the independent editor gate or raise the provisional 7.8 grade.


### Encounter variety — roadmap phase 2, cycle 2

Chapel entry now offers machinery isolation or a service bargain with a paid tool reservation, a watched work docket and a once-only return shift. Nia can travel with an arranged volunteer against the runner’s own work, a prepared harness against physical strain, or a prepared scanner using Edda’s earned baffle. Her later reply remembers the transport; recording still needs separate permission. Kerr’s collection offers a refundable carrying-rig deposit or an accepted depot-work bargain; observed handover refunds the rig, while earlier registration and betrayal remain. Four scenes have explicit suitable reused-art decisions.

See [the detailed Phase 2 cycle plan and internal evidence](docs/ENCOUNTER_VARIETY.md). Preserve version 2, `saint-shard-3055-v1`, 1d10, caps, recorded dice and original routes. Internal verification does not complete independent acceptance or change the provisional 7.8 grade.


### Encounter variety — roadmap phase 2, cycle 3

An optional Chapel service window shares three saved action opportunities between information, access and a quiet exit. The remaining count stays in the visible goal. Pausing, reloading or exporting a pending die never resets the allowance; repeating a used inspection is unavailable. Expiry changes the patrol attention and strain cost, with a free staffed exit or a return to ordinary doors. Chrome reader inspection, Ghost patrol timing and Nerve physical entry retain distinct preparation and consequences. Three new scenes have explicit reused Chapel/Quill art decisions.

See [Phase 2 execution and acceptance evidence](docs/ENCOUNTER_VARIETY.md). Version 2, `saint-shard-3055-v1`, the original dice, caps, routes, evidence and permission boundaries remain. The saved-window implementation does not complete independent player or production acceptance.


### Encounter variety — roadmap phase 2, cycle 4

Clinic notice distribution now offers a saved six-card schedule with separate clinic and dispatch limits. Four early/two later commits one strain of return work; three/three needs an extra trip at two strain or a ten-creds carrier. An overloaded window and a refused home-list contact are separate outcomes. Revise freely without erasing refusal; dispatch acceptance and later acknowledgements supply no attendance, care, evidence or recording permission. Existing channels and free unresolved recovery remain. Six scenes have explicit suitable Lumen portrait decisions.

[Phase 2 implementation and handoff](docs/ENCOUNTER_VARIETY.md) records three cycles, 184 scenes / 534 choices, 92 complete replay fixtures, 320 unit checks and 18 primary complete internal UI campaigns. Native keyboard/controller, saved costs/dice, narrow text-only play and matching art remain required. Preserve version 2 and `saint-shard-3055-v1`. The independent production gates and 9+ target remain open; Phase 3 has not started.

### Campaign integration — roadmap phase 3, cycle 5

Chapel and volunteer return work now appear as separate commitments and closing warnings. Kept shifts remain in history; unfinished work stays the runner’s responsibility. A short optional Ward Nine desk visit lets Lumen answer the actual Chapel method, expiry or refusal without completing work or forgiving betrayal. Nia’s later reply distinguishes a kept shift, and the cast records all supported transfer methods, depot work/deposits and clinic proposals. Controller navigation includes native disclosures, so the recap remains reachable. Each original finale recalls the selected opening motive and keeps a keyboard-expandable factual aftermath with exact costs, accepted schedules, observed replies and unresolved work.

One new conversation reuses Lumen’s suitable neutral portrait with an explicit art decision. There are 185 scenes / 536 choices and 96 full-campaign replay fixtures; no new media asset or fixed voice quotation is needed. Preserve version 2, `saint-shard-3055-v1`, recorded dice, original rules and all four finale identities. See [Phase 3 implementation, review and media handoff](docs/CAMPAIGN_INTEGRATION.md). Internal verification does not close the independent production gates or establish a 9+ grade. Phase 4 art/audio work follows this phase handoff.


### Phase 4, cycle 6 — directed character and scene art

Five new cast-continuity expressions respond to recorded refusal, betrayal, broken private terms, a postponed tab and an admitted leak. Faction scores do not select an expression, useful help does not erase prior conduct, and neutral portraits remain valid for unresolved/imported states. Seven new plates deliberately stage Quill’s offer, Mara’s recorded revelation, the Chapel maintenance landing and each of the four original finales. Eleven scene decisions and the explicit conditional-portrait catalog document the selection. Existing neutral encounter art remains appropriate for unresolved commitments and quiet rooms.

Responsive JPEGs have retained generated PNG masters, hashed provenance, credit disclosure and an offline audition. Unavailable framed art falls back to its description; unavailable portraits retain their speaker caption. Text-only mode makes no artwork requests. Visible goals, high contrast, reduced motion, silent play, version 2, `saint-shard-3055-v1`, recorded dice and all original rules remain unchanged. See [the continuity, shot and audio brief](docs/ART_AUDIO_DIRECTION.md). These are internally reviewed generated candidates; independent art, physical-device and distribution-rights acceptance remain pending.


### Phase 4, cycle 7 — directed audio candidates

Three 64-second mono beds distinguish recorded testimony, quiet conversations and an active saved Chapel allowance. Five 64-second district textures establish street, Chapel/clinic, Spire, canal and Ward Nine ambience. Music and ambience crossfade independently; repeated questions retain a playing bed, and obsolete loading transitions cannot start after returning to an active scene. Loading is deduplicated and the decoded-buffer cache is bounded to 24 MiB, with active sources retaining their own buffers. Unavailable music can leave available ambience playing.

Eight additional fixed stock synthetic quotations cover Quill’s initial offer, Mara’s recorded revelation, selected Kerr/Lumen boundaries and all four original finales. The six earlier clips remain unchanged. Finale dialogue preserves the existing action, known consequences and optional factual recap. Full readable text, Listen/Stop controls, independent mixer buses, voice ducking, dialog/scene/off cancellation, silent parity, version 2, `saint-shard-3055-v1`, recorded dice and original rules remain required.

Source and PCM masters, hashes, styles, pronunciation/direction briefs, measured headroom/seams and a 72-second default-mix audition are recorded in `qa/media/` and [ART_AUDIO_DIRECTION.md](docs/ART_AUDIO_DIRECTION.md). The music/ambience candidates fit the 3 MiB per-file limit. Internal measurements and browser playback do not certify intelligibility, expressive performance, fatigue, physical-device behavior or distribution rights; independent acceptance remains pending.


### Phase 5, cycle 8 — accessible reading and decisions

Settings can disable Number-key choices while preserving Tab/Enter selection and existing preference defaults. Revealing a paragraph or the rest of a scene focuses the first newly shown text, with a short shown/total status. Choices have concise action names and separate descriptions for odds and consequences; a next-move brief distinguishes committing an option from reviewing an unrolled check. A keyboard-expandable review exposes requirements for visible unavailable approaches without revealing hidden routes. Active sheet panels are Tab stops; abandon initially focuses Keep going.

No story, scene, art/audio asset, outcome or rule changes. Preserve visible goals, silent/text-only play, recorded dice, 1d10 and caps, version 2 and `saint-shard-3055-v1`. The fresh-player session and findings worksheets remain blank preparation; independent sessions, assistive-technology review and physical-device acceptance are pending. See [PLAYER_EXPERIENCE.md](docs/PLAYER_EXPERIENCE.md) for Cycle 8 findings, verification and the Cycle 9 handoff. No new grade is claimed.


### Phase 5, cycle 9 — audio interruption and device readiness

Zero-volume channels avoid new media requests. Muting a channel stops its active sources; stopped nodes disconnect and release buffers immediately, including while ended callbacks are delayed. Hiding/leaving the page stops sound and cancels pending speech. Returning shows an explicit Resume sound control, which restarts the current beds without replaying the entry cue or cancelled voice. Saved preferences remain enabled; progress, costs, local allowances and recorded dice are unchanged.

Memory inspection/timeline controls respect the number-shortcut opt-out in their accessible labels. Controller navigation reaches active sheet panels. No new scene or asset is needed; existing accompanying art remains suitable. Preserve version 2, `saint-shard-3055-v1`, readable/silent/text-only play, visible goals, 1d10 and caps, all four finales and the 24 MiB decoded cache.

`npm run production:audio-probe -- URL --minutes 10` exercises actual replay-generated states through native save import, voice cancellation, pagehide/resume and Sound off. Its bounded QA instrumentation is never imported by the game. Source cleanup and forced-GC JS heap samples support internal diagnosis; native audio memory, physical devices, two-hour endurance and human listening remain separate. The blank `qa/research/device-access-sessions.csv` records actual device/access reviews. See [PLAYER_EXPERIENCE.md](docs/PLAYER_EXPERIENCE.md) for verification and pending acceptance; no new grade is claimed.


### Phase 6, cycle 10 — internal release readiness

The endurance probe now releases its native file-input debugger handles, avoiding Playwright 1.64's retained closed save dialogs. It records forced-GC heap, DOM/listener counts, audio cleanup, source hashes and elapsed duration; `--workload idle` provides a control and `--snapshots PATH` saves local heap snapshots. Keep snapshots local because they can contain run data. This diagnosis does not imply a game memory-leak fix or physical-device acceptance.

`npm run production:rehearse -- --previous PATH` compares separate built worktrees through one temporary local browser origin. Native previous-release exports cover a pending eight and all four finales; candidate/rollback/re-promotion preserve saves, slots, preferences and codex. Corruption recovery, cancelled replacement and once-only pending costs are rehearsed without switching the live site. Version 1 is tested with a labeled synthetic fixture.

Production waits up to thirty minutes for exact-commit Test/Build success, with ten-second status-request limits and thirty-second polling (at most sixty requests). Failed, unreadable, late or timed-out checks still skip publication. No scene or asset is added; existing art remains suitable. Preserve version 2, `saint-shard-3055-v1`, 1d10, caps, four finales and the 24 MiB decoded cache. See [the implementation, repeatable checks and pending review](docs/RELEASE_READINESS.md). The provisional 7.8 grade and all six human acceptance gates remain unchanged.


### Player validation response on 11 October 2026

Numerical choice previews show effective faction, strain and credit changes after existing bounds; a fully bounded change explicitly says unchanged. Check modifiers use a single sign. An exhausted Chapel window points to the viable staffed stair or ordinary-door recovery instead of asking the runner to save a nonexistent opportunity.

Pausing Nia’s contact prevents a new hearing quotation request and keeps her approved recording private. An older save already at her explicit reply can continue under stated one-answer terms without reopening ongoing contact. Previous permissions, breaches and commitments remain recorded. Existing suitable Sera/Nia art is retained with updated scene-art rationales; no new scene or media asset is required.

Preserve save version 2, `saint-shard-3055-v1`, recorded dice, 1d10 and caps, all four finales, visible goals and silent/text-only parity. Use [the player validation checklist](docs/PLAYER_VALIDATION_CHECKLIST.md) for subsequent assessment. The provisional 7.8 grade and six production acceptance gates remain open; this increment does not supply fresh-player, rights, physical-device or independent acceptance.

### Player experience validation — report response phase 2

`npm run production:experience -- URL` plays authored full campaigns through real Tab order, Enter, Space, arrows and typing, including paragraph reveal and every fixture reload checkpoint. `npm run production:voices -- URL` verifies all fourteen selected quotations through natural completion, explicit cached replay, transcript parity, Stop and source cleanup. Reports record revision, source hashes, scope and limitations in ignored local QA outputs.

Run active and idle audio probes with `--minutes 120` against an immutable build; only their recorded completed durations establish internal two-hour evidence. See [the repeatable protocol and coverage reconciliation](docs/EXPERIENCE_VALIDATION.md). No scene, asset or gameplay rule changes; preserve existing art, saves, goals, silent/text-only parity and the 24 MiB decoded cache. Human listening, fresh players, assistive technology, physical devices, rights and all six acceptance gates remain pending; the provisional grade stays 7.8.

Keyboard QA uses Shift+Tab to reach earlier controls without relying on browser-chrome wrapping. CI provisions a virtual PulseAudio null sink so Firefox’s audio clock can verify natural source completion; output is discarded and this supplies no listening or physical-device acceptance. Test/Build names and the fail-closed exact-commit production gate remain unchanged.

### Player-validation response phase 3 — study preparation

Creation explains when an empty or whitespace-only street handle keeps entry unavailable; the existing character requirements and saved outcomes stay the same. The [study pack](docs/PLAYER_STUDY_PACK.md) provides a five-opening/five-campaign facilitator guide, spoiler-free participant brief, fourteen-clip inventory and blank listening/device records. It is preparation, with no new scene or media asset. Real participants, human listening, manual access/device review and subsequent findings-led revisions remain pending; the provisional grade stays 7.8 and no acceptance gate is closed. Keep populated research sheets, identities, recordings and raw saves outside Git; only reviewed redacted aggregates can become acceptance evidence.

### State-aware scene summaries

A successful second copy now takes precedence over the earlier failed-copy sentence in the Chapel alley, while retaining the missed roll and its cost. Hearing drafts, journal records and factual aftermath distinguish an absent Nia recording from an approved private account. The Week's transfer option asks to arrange Nia's terms rather than asserting a prior relocation promise. Saved-check regressions cover the fail-then-success sequence and the original two-copy payout; recording and quotation permissions still require their own choices. Existing art accompanies these scenes; no new scene or voice quotation is added. Internal simulated play and regression checks supply no human acceptance or higher grade; 7.8 remains provisional. Preserve version 2, `saint-shard-3055-v1`, recorded dice, 1d10, caps and all four original finales.


### Story clarity and simulated development validation

Skipping the prologue now keeps a brief origin-specific practical stake at Quill’s first meeting without choosing a motive, accepting the contract or paying the advance. Canal returns avoid repeating Ren’s warning and explain street speech versus paid silence. Leaving the canal for optional work does not close the week. Chapter cards and all four finale recaps name the actual forty/eighty-creds offer, street speech, failed attempt or unresolved Week; they grant no source authentication, witness safety, recording or public quotation permission.

The [story clarity cycle](docs/STORY_CLARITY_CYCLE.md) records paired prose measurements and full/skip minimal/investigation campaigns. Simulated play is the primary development proxy while independent participants are unavailable; it can drive revisions and provisional grades without claiming human participation or closing separate production gates. The [current internal review](docs/REVIEW.md) is 8.2/10. Existing suitable art is retained with explicit updated rationales; no new scene or fixed voice quotation is added. Preserve version 2, `saint-shard-3055-v1`, recorded dice, 1d10, caps and all four finales.


### Trained depot tasks and build variety

Kerr’s collection now offers four saved trained tasks alongside the original rolls, rig and immediate sorting shift. Chrome repairs the recipient circuit while preserving the depot return address; Ghost watches a saved patrol sequence; Nerve chooses a cradle or direct carry and keeps the sealed load low; Face negotiates paid liability, own return work or explicit recipient registration. Train the matching method in the Week; physical methods also require the matching exit.

One attempt persists through canal returns and reloads. Fees and waiting cannot repeat; failure or abandonment keeps registered-courier/unresolved recovery available. Handover remains separately observed. Entry registration, failed attempts, unpaid work and historical betrayal survive into Kerr’s response and finale records; no care, evidence or witness permission is granted. All ten new scenes have an explicit art decision and reuse the suitable neutral depot illustration with existing canal ambience; fixed voice quotations are unchanged.

The [build comparison and phase validation](docs/DEPOT_BUILD_VARIETY.md) records 24 synthetic eligible-state comparisons, four distinct full campaigns and repeatable engine/browser checks. Preserve save version 2, `saint-shard-3055-v1`, recorded dice, 1d10, caps and all original finales. Simulated play remains the primary development proxy; the provisional internal grade stays 8.2 and separate production gates remain pending. The next phase improves visual staging and expressive audio for stable scenes.


### Present-day scene staging

Quill’s opening offer has a closer counter composition. Mara’s voluntary clinic conversation, Nia’s arrival before account approval and Kerr’s closed-case handover now have character-led scene plates. Frames retain their complete 3:2 composition on phone and desktop, keeping hands and significant objects visible. Refusal and privacy-breach portraits still reflect saved conduct; the pictures grant no additional permission or treatment outcome.

The [visual staging cycle](docs/VISUAL_STAGING_CYCLE.md) records source references, responsive delivery and validation. Text-only play omits artwork, and unavailable plates retain descriptions and choices. Save version 2, `saint-shard-3055-v1`, recorded dice and all four finales are preserved. The internal grade remains 8.2; expressive audio is the next cycle.


### Browser CI throughput

The release pipeline runs the complete browser suite with four workers. All desktop/phone Chromium, Firefox and WebKit checks remain required, as do exact-commit Test/Build success and the fail-closed thirty-minute production gate. Four workers improve throughput; the bounded wait is now thirty minutes because a later complete four-profile run exceeded the previous twenty-minute window. Failed, unreadable or timed-out checks still skip publication. Existing accompanying art remains suitable; gameplay, audio, saves and goals are unchanged.

## Audio craft follow-through

The candidate has twenty fixed synthetic quotations: six new visible lines for Nia, Mara and Kerr, plus phrased replacement deliveries for Quill’s offer, Mara’s revelation and Kerr’s later boundary. Keep exact visible-quotation selection and Listen/Stop controls; the public refusal must not play on Lumen’s clinic-refusal branch, and handover clips must reflect private, breached or agreed-registration text. Source generation is offline only. Three deterministic 64-second room textures live in `scripts/room-textures.mjs`; explicit scene sets select clinic/witness/stall beds while retaining saved pressure and four ending identities. Preserve cancellation, mixer ducking, cache limits, silent play and unchanged save bytes. Update provenance, auditions and credits together. [Audio craft evidence](docs/AUDIO_CRAFT_CYCLE.md) distinguishes source/signal/browser checks from listening acceptance. The internal grade remains 8.2 and campaign craft is next.

## Campaign return craft

The last saved choice label selects return emphasis at the canal/wall; earned flags and journal custody must supply every claimed fact. Retain neutral fallbacks for empty/unknown legacy logs. Do not infer care, authentication, publication, forgiveness or private knowledge from a log label. Initial Ren/Sera introductions remain. Chapter-decision links only focus/scroll; keep optional work, canonical choice order, numerical indices, global shortcuts and check previews intact. Existing neutral canal/Sera art has updated rationales; existing beds/visible quotations remain suitable.

The [campaign craft cycle](docs/CAMPAIGN_CRAFT_CYCLE.md) records 108 paired routes and keyboard campaigns. Preserve version 2, `saint-shard-3055-v1`, recorded dice, 1d10 and caps, four finales, goals and silent/text-only parity. Keep raw state-bearing baselines/reports/screenshots outside Git; the reviewed prose-count aggregate is suitable for `qa/editorial/`. Grade remains 8.2. Next: resource-poor/failure-heavy campaign balance and recovery visibility.


## Resource-poor recovery

A failed Kerr collection can pause for free while the case remains held and the request stays open. Resume through his canal request before the week closes; the original failure, departure fee and recipient registration persist. The twenty-creds courier still requires funds and breaks private terms. Closing the request or leaving the Week keeps the actual unfinished outcome. An exposed but undelivered open request also appears in the chapter's unfinished-work warning.

The [scarce-resource recovery cycle](docs/SCARCE_RECOVERY_CYCLE.md) records zero-credit no-sale campaigns, one-time free rest, successful rebate-funded recovery and repeated failure/unfinished endings. Existing neutral depot/canal art and sound remain suitable; no new scene or media is needed. Preserve save version 2, `saint-shard-3055-v1`, recorded dice, 1d10 and caps, and all four finales. The provisional internal grade remains 8.2. Next: long-investigation navigation and source comprehension, using simulated play as the development proxy.


## Investigation notebook

“Consult acquired sources” opens a read-only notebook during reconstruction, archive comparisons and the public hearing. Search inspected timestamps, source labels or phrases, and filter recorded memory, archive records, witness accounts or interpretations/corrections. Original wording and recorded status stay attached; current corroboration and quotation limits remain visible even when results are filtered. Return to the same decision and reading position without choosing an answer or changing the save. Unacquired fragments stay hidden.

The [investigation navigation cycle](docs/INVESTIGATION_NAVIGATION_CYCLE.md) records baseline lookup, complete campaigns and keyboard/accessibility verification. Existing scene art and audio remain suitable; the notebook needs no new scene, illustration or quotation. Preserve version 2, `saint-shard-3055-v1`, recorded dice, 1d10 and caps, four finales, silent/text-only play and focus restoration. The provisional internal grade remains 8.2. Next: contrasting scarce-budget witness/archive recovery and delayed consequences across origins.


## Archive recovery across origins

A failed archive query can pause for free and resume at the same ledger desk through the canal before the Week closes. Pausing preserves the failed roll, strain, funds, exposure and unverified source record; it adds no authentication attempt or reward. The twenty-five-creds ledger and Spire employee-number routes retain their price or badge trace. Recording the gap closes the search; leaving the Week with it paused keeps an unfinished commitment and an honest factual aftermath. Later ledger corroboration stays separate from digital-key authentication and public quotation permission.

The [scarce-investigation cycle](docs/SCARCE_INVESTIGATION_CYCLE.md) compares no-sale witness and archive campaigns across all three origins. Existing neutral archive setting art and sound accompany the paused desk; no new scene or media is required. Preserve version 2, `saint-shard-3055-v1`, recorded dice, 1d10 and caps, all four finales and text-only/silent play. The internal grade stays 8.2. Next: failure-heavy finale and source-custody continuity before a full-campaign regrade.


## Failure-heavy finale continuity

Speaking the memorial names does not file a public hearing account. All four factual finale recaps distinguish filed, withdrawn and unfiled hearing drafts from the memorial action. Withdrawal retains what attendees may remember; leaving quietly does not erase an earlier disclosure. Acknowledging the earlier leak supplies no new corroboration or witness permission.

Ives takes the memorial page, while Sera keeps the separate private witness ledger. Archive originals and approved recordings retain their recorded custody and publication terms; quotation permission for a withdrawn draft does not open that recording to circulation. The handover preview and both voluntary/failed-interruption endings state this scope. Existing finale art, chapter beds and fixed quotations accompany these outcomes; no new scene or media asset is needed. Preserve version 2, `saint-shard-3055-v1`, recorded dice, 1d10, caps and all four original finales.

See [the finale continuity cycle](docs/FINALE_CONTINUITY_CYCLE.md) and [current review](docs/REVIEW.md). Seven new authored full campaigns cover failures, corrected/withdrawn hearings and private custody. Source-familiar simulated play remains the available development proxy. The full-game internal grade stays 8.2; the next craft priority is encounter variety and audiovisual direction.


## Character-led presence and delayed dispatch

After Mara’s quiet answer, an optional window invitation gives company and private dispatch separate outcomes. Pay the existing fifteen-creds courier fee and stay, walk the reply at its ordinary one-strain cost and leave her hour alone, stay while the sealed reply misses the current intake batch, or decline company and arrange dispatch separately. Staying pending remains free; later dispatch can resume before the Week closes, and the subsequent intake slip records the next batch. These are authored scene events, with no real-time countdown.

Mara’s later personal response, cast conduct and all four relationship codas remember the actual choice. The shared hour supplies no faction reward, treatment, acquittal, evidence or new witness permission. Original refusal, betrayal and exposure remain. Company outcomes and costs cannot be repeated; dispatch and receipt retain their separate commitments. Original acknowledgement/dispatch paths and existing saved rolls remain valid.

Both new scenes have explicit art decisions and a new responsive clinic-window illustration with retained generation provenance. Existing quiet music and clinic ambience accompany them continuously, without voice autoplay; the fixed dialogue inventory is unchanged. Preserve silent/text-only play, visible goals, version 2, `saint-shard-3055-v1`, 1d10, caps and all four finales. The corpus now has 133 authored complete replay fixtures. See [the phase report](docs/CHARACTER_PRESENCE_CYCLE.md) and [updated review](docs/REVIEW.md). The rounded internal grade remains 8.2; performance/mix direction is next.


## Personal voice and room mixing

Mara’s window invitation and Kerr’s hoped-for walk now have optional fixed stock synthetic quotations. Lumen’s existing cup-and-case-file answer receives explicit phrase spacing. The established voice identities and all visible words remain. There are twenty-two fixed quotations; nineteen earlier deliveries are unchanged. Speech lowers music to 28% and ambience to 55% of each player-selected bus level, with a 40ms attack and a smoother 180ms release time constant. Kerr’s personal question uses the existing closer stall texture beside the quiet score.

Automatic dialogue waits for the quotation to be revealed; Listen/Stop remains available for replay and interruption. Complete text, separate channel preferences, natural-end/Stop/scene/off cancellation and silent/text-only play retain the same choices and costs. Existing Mara-window, Lumen and Kerr art fits these unchanged scenes; no new illustration or story scene is needed. Preserve version 2, `saint-shard-3055-v1`, recorded dice, 1d10, caps and all four finales.

See [the performance and mix cycle](docs/VOICE_PERFORMANCE_CYCLE.md), retained model/delivery provenance and the twelve-interval audition in `qa/media/`. The corpus has 135 authored complete replay fixtures. Source-familiar simulated play remains the available development proxy; this work does not claim a commissioned actor session or perceptual listening acceptance. The provisional overall grade stays 8.2 and audio stays 7.5. Next: campaign-wide pacing and build balance.


## Whole-campaign pacing and Edda’s actual shift

Briefed archive visits now continue from the compared record number; legacy direct visits retain their first introduction. Custody keeps Edda’s employer trace and public naming separate, while the exit remembers the person behind the source. Edda’s unexposed visit retains posted shifts without asking to bridge an invented lost shift. A named copy or signed extraction still produces her reported suspension, even when the public copy withholds her name.

The neutral source choice now says “Record her limits and keep the source available.” Its id, gates, effects and destination remain; old saved log labels still select the earned reply. Five neighborhood return selectors remember actual Lumen/Edda/Nia conduct with guarded flags and account custody. Empty or unknown logs retain a short neutral return. Hearing prose focuses on the source challenge and filing decision; quotation permission, earlier corrections and the independent memorial choices remain.

All nine edited scenes retain explicit suitable art decisions and existing room/score plans. No new scene or media is needed; all twenty-two fixed quotations remain unchanged. The corpus now has 137 authored complete fixtures, including earned Face/Nerve signed-source routes. Preserve version 2, `saint-shard-3055-v1`, recorded pending checks, 1d10, caps and all four finales. The [phase record](docs/CAMPAIGN_PACING_CYCLE.md) compares the original 135 campaigns, allowing only the one declared display/log-label substitution. Raw state-bearing evidence remains outside Git. Source-familiar simulated play remains the available development proxy. Next: origin/stat build balance and meaningful opportunity costs.

This pacing review provisionally grades narrative 8.4; the weighted total is 8.22, rounded to 8.2. It is an editorial assessment of the complete proxy campaigns, not a reading-speed, participant-average or feature-count result.


## Starting-page music

The supplied “Under the Awning” now accompanies the title screen through Play/Stop menu music. Playback is enabled by default on a fresh visit. An ordinary pointer or Enter/Space menu interaction starts the enabled theme without requiring Play. Direct New run/Continue navigation avoids downloading a menu-only track. Saved Sound off and zero Music volume remain respected; enabling Sound in title Settings also activates it. Music volume and Sound off apply, a hidden page pauses it until Resume, and character creation stops it. Continuing a saved run stops the menu track immediately and hands off to the existing scene score and ambience without changing saved state. Menu sources release without waiting for an ended callback. Returning to the title resumes the requested theme unless paused, stopped or muted; a pending suspension must settle before the current request resumes. Missing audio leaves all menu actions usable and supports retry.

The original MP3 is retained unchanged in `qa/media/title-music-source/`. The separate stereo FLAC title delivery lowers the source by 12 dB and overlaps its final four seconds with the opening; the intro plays once and repeats begin at four seconds. It uses the existing bounded Web Audio mixer/cache and is fetched only after activation. Builds use the checked-in delivery and never run the optional ffmpeg/numpy authoring script. Provenance, source/delivery hashes, processing and measured seams are in `qa/media/title-music.json`; the offline audition and credits include it. Existing title art, all scene scores, 101 voiced quotations, rules, finales and version 2 with `saint-shard-3055-v1` remain. No new scene or illustration is needed. See [the integration record](docs/TITLE_MUSIC.md).


## Automatic dialogue and expanded voice coverage

Sound and automatic dialogue are enabled for new players. One hundred and one fixed stock synthetic quotations cover the opening job, Mara’s recorded reason, memory interview, district work, witness terms, repairs and later character boundaries. A quotation plays once when its text is revealed after starting or continuing a run. Stop and Listen permit interruption and replay; Settings offers Play dialogue automatically and separate voice volume. Existing saved Sound off, zero voice volume and manual-playback choices are preserved. Dialogs, scene departure, muting and pagehide cancel pending or active lines; closing a dialog or Resume sound does not replay an interrupted line. Missing audio leaves the full text and choices usable. The title theme is enabled by default, starting when the browser permits sound; Play menu music remains a manual fallback. No speech model or player-text synthesis runs in the browser.

The 23 new deliveries retain the existing character voice identities and all 22 earlier clip hashes. Existing scene art remains appropriate; no story scene or visual outcome is added. Save version 2, `saint-shard-3055-v1`, recorded dice, 1d10, caps and all four finales remain unchanged. See [the implementation and validation record](docs/AUTOMATIC_VOICES.md), [full audition index](qa/media/voice-expansion-audition.json) and [media audition](qa/media/review.html). Historical cycle sections describe their original inventories; this section defines current playback behavior.

Background scores and ambience now use lossless FLAC with gzip HTTP delivery so default Sound does not exceed the existing 2 MiB opening-transfer budget. All 15 WAV masters and decoded PCM samples remain unchanged. `qa/media/bed-delivery.json` records source/delivery/transport and PCM hashes; `scripts/prepare-bed-delivery.py` is optional offline authoring only. Next.js before-file rewrites serve checked-in gzip bodies at the FLAC URLs. Preserve those headers and rewrites together, the title theme’s existing delivery, and the voice WAVs.

The same Rajdhani and Literata WOFF2 subsets now live in `public/fonts/`, with their existing weights, styles, fallback metrics and Latin preloads in `app/fonts.css` and the layout. Builds no longer fetch Google Fonts. Preserve font hashes and SIL Open Font License copies in `qa/media/font-provenance.json` and `qa/media/font-sources/`; the files are unchanged from the successful local candidate.

In a multi-character scene, a fixed line may name its actual speaker separately from `sceneSpeaker` (the canonical primary portrait), but must provide an exact visible `attribution` marker. Both the quotation and attribution must be revealed, and the primary scene speaker must still match. Edda’s Spire service-desk line uses this authored binding while Ives remains at the queue; no met-character, consent or game-state flag changes. The 101-clip inventory includes nine stock voice identities.

Production now waits up to 45 minutes for the same exact-commit Test and Build checks, polling once per minute (at most 45 requests). This accommodates the full browser suite and setup without the former 30-minute expiry, while reducing status requests. Failed, skipped, canceled, unreadable and expired checks still block production; previews retain their existing behavior.


## Character reactions and hearing voices

Eighteen additional fixed authored quotations give voice to Mara’s five earned company/dispatch responses, Kerr’s kept and broken private terms, Edda’s archive access and private work limits, the public hearing and Nia’s quotation terms, Lumen’s relay/withdrawal answers and Sera’s wall and laundry invitations. All forty-five preceding clips remain byte-identical. Exact visible text and the actual scene speaker select each line; conditional alternatives cannot play before their quotation is revealed. Established stock voice identities and bounded phrase pauses are retained. Automatic dialogue remains on by default with saved Sound off, zero voices and manual mode respected.

Existing explicit scene art decisions, portraits and illustrations suit every unchanged scene; no new scene or visual outcome is introduced. Save version 2, `saint-shard-3055-v1`, recorded dice, consent, evidence, 1d10, caps and all four finales remain. See [the reaction voice cycle](docs/VOICE_REACTIONS_CYCLE.md), [locked additions and retained hashes](qa/media/voice-reactions.json) and [indexed audition](qa/media/voice-reactions-audition.json). Optional offline generation and audition scripts never run in the game or build. The internal grade remains 8.2 pending a broader craft review; technical checks do not establish independent listening acceptance.


## Courier voices and scene illustrations

Four new neutral scene plates accompany the public hearing, Helion archive desk, Asa’s later courier conversations and Sera’s laundry visit. All fifteen scene bindings have explicit decisions, 1200px/600px responsive JPEGs, descriptive alt text and retained generation provenance. The art establishes no completed hearing, authenticated source, cargo arrival, restored route, completed wash or new permission. Existing speaker portraits, text-only mode and missing-art fallback remain.

Twelve fixed quotations bring the inventory to seventy-five: ten for Asa, one for Nia and one for Ives. Asa’s distinct stock `af_alloy` style uses practical, measured phrasing; established voices and all sixty-three preceding WAV hashes remain unchanged. Exact visible text selects actual delivery outcomes and identity, survival or exit reflections. Automatic dialogue stays enabled by default, preserving saved Sound off, zero voices and manual mode. No model, runtime synthesis or player-text speech ships.

Two additional full authored replay fixtures cover Asa’s survival and exit reflections, bringing the corpus to 139; scenes/choices remain 197/587. Preserve save version 2, `saint-shard-3055-v1`, recorded rolls, 1d10, caps, consent/evidence boundaries and all four finales. See [the illustrated courier cycle](docs/COURIER_ART_VOICE_CYCLE.md), [locked additions and hashes](qa/media/courier-art-voice.json), [voice audition](qa/media/courier-voice-audition.json) and [media review](qa/media/review.html). Historical sections retain their original inventories. The provisional overall grade remains 8.2; technical/source-familiar checks do not establish independent visual or listening acceptance.


## Neighborhood art and character replies

Four new responsive illustrations accompany the clinic dispatch desk (ten decisions), Quill’s repair bench, the unresolved shelter pump and Kerr’s witness checkpoint. All thirteen scene bindings have explicit art decisions, descriptions, 1200px/600px JPEGs and retained generated originals. The stationery represents the setting rather than a committed card allocation; the pump appears only before its repair outcome. Speaker portraits, visible goals, text-only mode and missing-art fallback remain.

Fourteen fixed stock synthetic quotations bring current coverage to 89: eight for Lumen, three for Edda, and one each for Quill, Sera and Mara. Existing nine cast styles and all preceding 75 WAV hashes remain. Exact visible dialogue selects funded-carrier, extra-trip and clinic-bundle replies and Edda’s traced/untraced recovery. Automatic dialogue stays on by default; saved mute, zero volume and manual mode are respected. No runtime model or player-text synthesis ships.

See [the neighborhood cycle](docs/NEIGHBORHOOD_ART_VOICE_CYCLE.md), [locked additions and art bindings](qa/media/neighborhood-art-voice.json), [indexed audition](qa/media/neighborhood-voice-audition.json) and [media review](qa/media/review.html). The graph remains 197 scenes / 587 choices and 139 full authored replay fixtures. Preserve version 2, `saint-shard-3055-v1`, recorded dice, 1d10, caps, consent/evidence boundaries and all four finales. The internal grade remains 8.2; technical playtests do not establish independent visual or listening acceptance.


## Private terms and the memorial — art and voice

Four more responsive illustrations accompany Nia’s pre-transfer briefing/support, the ordinary recovery seat, four private-reply steps and the memorial wall/arrival. Nine explicit scene decisions preserve actual chronology: Nia holds her own brake before moving; rest is not extraction; correspondence supplies no dispatch or inquiry outcome; the weathered memorial displays no private witness address or completed declaration. Nia’s existing generated portrait and arrival art supply continuity references. JPEGs only resize/encode retained PNGs; speaker portraits, text-only mode, goals and missing-art fallback remain.

Twelve fixed quotations bring current coverage to 101: three for Nia, four for Kerr, four for Mara and one for Sera. All preceding 89 WAVs and all nine stock cast identities remain. Conditional Nia known-room/second-room and Mara received/declined/pending replies follow exact visible authored text. Sound and automatic dialogue stay on by default while saved mute, zero voices and manual mode are honored. No model or runtime player-text synthesis ships.

A complete `witness-known-room` fixture follows a registered transfer without a later relocation, bringing the authored replay corpus to 140. The game remains 197 scenes / 587 choices. Preserve version 2, `saint-shard-3055-v1`, recorded rolls, 1d10, caps, evidence, consent and all four finales. See [the phase report](docs/THRESHOLD_ART_VOICE_CYCLE.md), [locked additions and art bindings](qa/media/threshold-art-voice.json), [voice audition](qa/media/threshold-voice-audition.json) and [media review](qa/media/review.html). Historical cycle inventories remain historical. The internal grade remains 8.2; automated/source-familiar checks do not establish independent artistic or listening acceptance.

## Complete campaign character dialogue and art

Current framed art covers 195 of 197 scenes; `card_week` and `card_wall` retain deliberate text chapter cards. Ten new neutral setting paintings and 111 explicit additional bindings live in `qa/media/campaign-art-bindings.json`; `lib/art.ts` enumerates their scene ids. Keep `qa/media/scene-art.json` consistent, preserve actual chronology and conditional portraits, and require a fresh explicit decision for future scenes. Art never supplies an outcome that the state has not earned. Responsive delivery, text-only mode, missing-art fallback, visible goals and budgets remain required.

The active character sequence has 302 bindings across 120 spoken scenes and 290 fixed files: 190 new MP3s plus 100 earlier WAVs. All 101 preceding WAVs remain unchanged; the previous Lumen capacity-counteroffer clip is archival because the authored speaker is Dispatcher. Nine established stock styles remain; six minor roles have distinct explicit casting. Narration, written messages/labels, player questions and custom player addresses remain text-only. Match actual quoted wording, canonical primary speaker and explicit secondary attribution in `lib/campaign-dialogue.ts`. Do not infer actors from the primary portrait or synthesize player text. Keep the audit, bindings, offline authoring lines, provenance and audition together.

`DialoguePlayback` distinguishes natural completion/unavailable audio from cancellation. Revealing additional lines appends to the queue without cancelling the playing actor. Stop consumes all visible queued lines; scene change, dialogs, mute, zero voices and pagehide cancel current/pending playback. Returning from a dialog or Resume sound must not replay interrupted visible lines. Manual mode fetches nothing automatically; Listen and Play all dialogue remain explicit. `playVoice` only calls sequence completion after natural end or an unavailable file, never after cancellation. Preserve source disposal, music/ambience ducking and the 24 MiB decoded cache.

`npm run production:voices -- URL --workers 4` audits all 290 active files; `--automatic` verifies whole displayed queues and `--only-new` narrows to additions. `qa/production/dialogue-examples.ts` labels authored routes, seeded routes and synthetic branch samples separately. Neither raw states nor these QA tools ship in the application. `scripts/generate-campaign-voices.py` is optional offline authoring with pinned model hashes, faithful wording and retained PCM masters; it never rewrites previous WAVs. See [CAMPAIGN_MEDIA.md](docs/CAMPAIGN_MEDIA.md), locked [campaign inventory](qa/media/campaign-media.json), voice provenance and media audition. Preserve the graph (197 scenes / 587 choices), all 140 authored replay fixtures, version 2, `saint-shard-3055-v1`, recorded dice, 1d10/caps, evidence/consent and all four finales. Internal verification does not establish independent artistic acceptance or a higher grade.

A final cross-check includes Lumen’s fixed “Kerr” call in the failed bluff result. It appears only with the revealed miss, honors saved automatic/mute/voice settings, cancels on departure and does not commit or reroll the held die.

## Whole-scene reading and dialogue review

New or incomplete reading preferences show the whole scene immediately; an explicit saved paragraph preference remains. Sound and automatic dialogue stay enabled by default with saved mute/manual choices honored. The full quoted conversation queues in display order, and the transcript marks the line currently playing. No narration or player-name synthesis is added.

The campaign’s 299 bound quotations match the concatenated words and actor of all 302 bindings and 290 active deliveries. Ren Calder’s eight lines use the reviewed stock `af_jessica` casting, matching her authored identity; six deliveries receive a slower consonant/word-boundary clarity pass, including two of Ren’s recast lines. All 101 earlier WAVs remain unchanged. Two new responsive character paintings accompany the stallholder’s opening dialogue and Ren’s canal introduction/returns. The 195 illustrated scenes, two text chapter cards, 197 scenes / 587 choices and 140 full replay fixtures remain.

See [the whole-scene review](docs/WHOLE_SCENE_REVIEW.md) and [locked media changes](qa/media/whole-scene-review.json). Keep voice wording, actual actor, ordered parts and provenance aligned; the offline generator now checks voice, speed and segments before retaining a delivery. Preserve version 2, `saint-shard-3055-v1`, recorded dice, 1d10/caps, evidence/consent and all four finales. Independent transcription and internal play provide development evidence, not human listening acceptance or a higher grade.

## Audible speaker presentation

While a revealed dialogue clip plays, its exact quotation part is underlined in the scene text and the portrait identifies the actual speaking actor. The cue clears on natural completion, Stop, dialogs, muting, zero voice volume, pagehide and departure. Loading or unavailable audio keeps the scene context. Portrait space stays fixed; playback does not scroll the page or move focus. Primary story speakers, choices, knowledge, consent and saves do not change with audio. Text-only play keeps the named speaker and quotation cue without artwork requests.

Five new generated portraits cover Ren, the stallholder, the dispatcher, the mechanic and the masked attendant; all fifteen voiced roles have reviewed portrait mappings. Existing conditional expressions apply to the actual actor using the scene and earned flags. Ren and the stallholder retain their established illustration identities. Source text, all 302 dialogue bindings and every one of the 290 active voice files remain unchanged.

See [the speaker presentation record](docs/SPEAKER_PRESENTATION.md) and [speaker/scene mappings and voice locks](qa/media/speaker-presentation.json). Whenever dialogue or speaker presentation changes, keep the exact visible words, actual actor, fixed audio transcript/delivery and reviewed portrait together. New speakers or binding scenes require explicit portrait entries and accompanying art when needed; update provenance, audition and credits. Quotation highlighting must fail closed for changed words, unquoted narration or unknown bindings, and must omit custom player addresses. Preserve whole-scene defaults and saved paragraph/mute/manual preferences, version 2, `saint-shard-3055-v1`, recorded dice, 1d10/caps and all four finales.

## Pivotal dialogue performance and expression staging

Fourteen exact-word stock synthetic deliveries now use deliberate phrase pacing and pauses for Mara’s admission, Lumen’s limits, Nia’s testimony/contact terms, Ren’s shelter concern and Sera’s memorial/hearing replies. Five preceding WAV performances have new MP3 deliveries; their WAV files remain unchanged. Nine existing MP3 deliveries are revised, with preceding copies and source hashes retained for comparison. Active dialogue remains 290 files and 302 bindings across 120 scenes: 195 MP3s and 95 WAVs. Actor identities, quotation words and ordered binding keys remain stable.

Four identity-preserving generated expression portraits accompany Mara’s recorded confession, Nia’s terms, Ren’s shelter statement and Sera’s final attention. Explicit scene lists live in `qa/media/scene-art.json`; earned refusal/breach expressions take precedence. Lumen’s guarded portrait is retained. Neutral setting illustrations, chapter cards, text-only mode, missing-art fallback and goals remain.

Music remains enabled by default. A fresh title starts it on an ordinary pointer or Enter/Space menu interaction, without requiring Play; direct New run/Continue navigation avoids a menu-only download. Returning from an activated run resumes the requested theme. Hidden-page/pagehide handling aborts a pending menu request before teardown, and Resume can fetch a fresh track; it never replays cancelled dialogue. Saved mute/manual/paragraph preferences remain respected. Keep automatic track loading gated on a running AudioContext, with a gesture fallback, to protect blocked and rapidly reloaded pages.

See [the performance/staging record](docs/DIALOGUE_STAGING.md), [reviewed deliveries and preceding bindings](qa/media/dialogue-staging.json), [current audition](qa/media/campaign-dialogue-audition.json) and [media review](qa/media/review.html). Every future change must keep exact quotation words, actual actor, audio provenance and scene/flag-specific art together. Preserve 197 scenes / 587 choices, all 140 complete replay fixtures, 1d10/caps, version 2, `saint-shard-3055-v1`, saved dice, evidence/consent and all four finales.
## Kerr, Edda, Quill and Asa — campaign performance

Sixteen existing MP3 deliveries use exact phrase direction and offline delivered loudness matching for the established four stock voices. Keep their current/preceding hashes, independent transcripts, source PCM, audition and `qa/media/character-media.json` together. Other active clips, all 101 preceding WAVs and every binding row remain unchanged. The optional generator’s per-line `loudnessLufs` setting checks the delivered MP3 after two-pass mastering and codec correction; it never runs in the game or build.

Natural sequence completion inserts 120 ms within an actor or 220 ms across actors. First/manual lines and missing-file recovery remain immediate. A pending pause keeps Stop available without claiming audible speech; Stop, mute, modal, pagehide and departure cancel it, and Resume does not replay consumed lines. Keep actual actor/text cues and saved automatic/manual preferences aligned.

Kerr and Quill’s explicit terms portraits defer to earned breach/refusal expressions. Edda’s two-paper portrait requires `edda_shift_paid` only at `act3_edda_reply`; pending/representation replies retain her base portrait, and archive suspension/inquiry remain. Asa’s closer sealed-case plate is restricted to `act2_freight_brief`, before acceptance/crossing. Preserve explicit scene/state decisions, provenance, credits, responsive/text-only delivery, missing-art tolerance and goals. See [the phase report](docs/CHARACTER_MEDIA_CYCLE.md). Preserve 197 scenes / 587 choices, 140 complete replay fixtures, 302 bindings, 290 active clips, version 2, `saint-shard-3055-v1`, recorded dice, 1d10/caps, evidence/consent and all four finales. Internal grade remains 8.2.

## Campaign voice balance and Ives

Every one of the 290 active deliveries now has an offline measured playback trim targeting −23.5 LUFS, with at least 1.5 dB true-peak headroom before the separate user voice slider. Constant gain preserves each performance’s dynamics and pauses; no speech synthesis or loudness analysis runs in the game. Music/ambience duck to 22%/44% of their selected levels during speech and restore afterward. Saved mute, zero voice volume, manual playback and paragraph reading remain respected. Keep `qa/media/voice-levels.json`, its measured `voice-mastering.json` provenance and exact delivery hashes aligned whenever audio changes. The optional `scripts/measure-voice-levels.py` must be rerun after a changed delivery; it never runs in build or gameplay.

Thirteen revised exact-word Ives deliveries retain the established stock `am_eric` identity. Four new MP3s replace active WAV performances; all 101 preceding WAV files remain unchanged. Nine existing MP3s are revised with preceding copies/hashes retained. Active coverage remains 302 bindings across 120 scenes and 290 files (199 MP3s / 91 WAVs); binding keys, words, actors and order remain stable. A narrowly checked offline pronunciation articulates the /t/ in “writing” instead of the ambiguous American flap; the authored words remain exact. Historical phase locks retain their baselines and explicitly account for these four delivery replacements.

Two identity-preserving Ives portraits accompany Helion terms and archive/hearing scrutiny. A closer hearing illustration appears only at `act3_testimony_hearing`, before the answer; neighboring record/correction scenes retain the neutral table. Closed folio, blank covers and recorder supply no authentication, filed account or private-source transfer. Maintain explicit scene lists, actual actor/text cues, art provenance, audition, text-only play, missing-art fallback and visible goals. See [the phase report](docs/IVES_MASTERING_CYCLE.md). Preserve 197 scenes / 587 choices, all 140 authored complete replay fixtures, version 2, `saint-shard-3055-v1`, recorded dice, 1d10/caps, evidence/consent and all four finales. Internal grade remains 8.2.

## Action-specific scene sounds

Four short original procedural cues accompany newly inspected Chapel fragments, committed archive index/key queries, inspection of the intact courier-case seal, and entry into the already-running public hearing recorder. The same reader texture accompanies successful and rejected queries. Case contact supplies no opened seal, delivery or receipt; recorder transport supplies no witness permission, publication or verdict. Cues are selected from the actual committed action and destination, after a held die is accepted.

These effects are fetched only for their action, use the separate Effects slider and duck during audible dialogue. Dialogs, departure, another action, mute, zero effects and pagehide cancel active or pending starts. Reload, dialog close and Resume sound do not repeat an action cue. Downloads may finish into the bounded cache after playback cancellation. Missing sound cannot block text, choices or saves. Existing scene illustrations, portraits and all exact voiced words remain matched; no new scene or art outcome is introduced.

`scripts/scene-foley.mjs` and `scripts/author-scene-foley.mjs` provide optional offline seeded synthesis; builds serve four checked-in PCM16 WAVs and never invoke that authoring. Source hashes, measured delivery signals, neutral meanings and art review are in `qa/media/scene-foley.json`, with the audition and credits updated. All preceding audio deliveries remain byte-identical. See [the phase report](docs/SCENE_SOUND_CYCLE.md). Preserve whole-scene defaults, saved paragraph/mute/manual settings, 197 scenes / 587 choices, all 140 authored complete replay fixtures, 302 dialogue bindings, 290 active voices, version 2, `saint-shard-3055-v1`, recorded dice, 1d10/caps, evidence/consent and all four finales. Internal grade remains 8.2.


## Earned consequence art and Lumen, Mara and Nia

Three explicit outcome illustrations respond to confirmed shelter repair, recorded courier stock receipt and completed public-account filing. Unrepaired evacuation, an intake drop-off, unresolved stock queries, drafts and withdrawal retain their neutral settings. Late or exposed stock receipt grants no passenger clearance or treatment; repair grants no beds or witness transfer; filing grants no authentication or witness permission. The four finale paintings remain. `sceneIllustration` accepts the actual saved flags, with a neutral default for legacy/unsupported states. `qa/media/scene-art.json` enumerates and audits every variant and its rationale.

Nine existing MP3 deliveries retain exact words, actors and binding order, with phrase pacing for Lumen's practical care, Mara's current agency/recorded accountability and Nia's personal boundaries. All 101 original WAVs and every other preceding voice remain unchanged. Two generated portraits accompany Lumen's consideration and Nia's boundary-setting; earned guarded conduct takes precedence. Existing Mara questioning/window/boundary art remains suitable and grants no public permission. Whole-scene reading, default sound/automatic dialogue and saved paragraph/mute/manual preferences remain.

Keep the nine previous/current delivery hashes, independent transcripts, retained PCM masters, art provenance, credits, audition and `qa/media/consequence-media.json` together. Every changed delivery is remeasured in the all-290 playback mastering map. `production:voices -- URL --ids ID,ID` can verify an explicit reviewed subset without silently accepting unknown or inactive ids. This QA selection never ships as gameplay logic. See [the combined cycle record](docs/CONSEQUENCE_MEDIA_CYCLE.md). Preserve 197 scenes / 587 choices, all 140 authored complete replay fixtures, 302 bindings, 290 active voices (199 MP3 / 91 WAV), version 2, `saint-shard-3055-v1`, recorded dice, 1d10/caps, evidence/consent and all four finales. Internal grade remains 8.2.


## Runner’s field guide and default menu music

The main page’s **Field guide** opens the bookmarkable `/guide` page. It introduces Kite City, memory shards, the runner’s meeting and four public contacts without exposing the hour’s contents or undiscovered finales. Five chapters teach character creation/origins, choices and check previews, saved dice, Strain, sources/permissions, commitments, controls, accessibility and three-slot/export saves. The practice check uses the actual read-only resolver with a fictional Nerve-3 runner; it commits no choice, roll, cost, flag or storage write.

The home and guide routes share `app/(game)/layout.tsx` and one `GameApp`, so visiting the guide preserves progress/preferences and the existing title loop. Responsive opening-city art is reused explicitly in `qa/media/guide.json`; text-only and missing-art behavior remain. There is no new gameplay scene, discovery, voiced narrator or media delivery. All existing dialogue and artwork/audio bytes remain matched.

Under the Awning is requested automatically on the main page (and guide) when sound/music are enabled. `prepareMenuAutoplay` observes the native AudioContext and fetches only when it is running. Browser-blocked autoplay stays silent with a clear first-interaction hint; an ordinary pointer or Enter/Space gesture unlocks the requested theme without requiring Play. Saved sound off/zero music, explicit Stop, hidden-page/pagehide cancellation, manual dialogue and navigation remain respected. Resume requests stay nonblocking. Never bypass browser permission, silently unmute saved preferences or start pending menu audio after departure.

See [the guide and autoplay cycle](docs/GUIDE_AND_AUTOPLAY.md). Preserve the four original goal sentences, 197 scenes / 587 choices, 140 authored complete replay fixtures, 302 voice bindings / 290 active deliveries, version 2, `saint-shard-3055-v1`, held dice, 1d10/stat/strain caps, sources, consent and four finales. The internal grade remains 8.2.

Policy and first-visit transfer probes use full Chromium with native document activation and media-engagement bypass disabled. They inspect through CDP with userGesture false before using ordinary Playwright checks, which can supply activation and turn a blocked visit into an allowed one. The two native policy cases also disable DOM snapshot tracing, which performs activating inspection, and attach their native state as JSON evidence. Every other regression retains its usual failure tracing. Ordinary menu tests cover either native permission outcome and still require one playable, stoppable loop. A permitted return visit can fetch the separate 2.6 MB title track automatically; first-visit measurements identify their policy and keep the existing transfer budget. CI checks this permission smoke and the same performance gate before the expensive full campaign/audio suite; every full regression remains required.


## Full-cast portrait cards and expressions

Open **People** in the character sheet to see illustrated cards for characters you have encountered. All fifteen portrait identities are covered, including Ren, the Orderly, Stallholder, Dispatcher, Mechanic and Masked attendant. Cards use small neutral portraits and retain established shared-history text. The list starts collapsed; thumbnails load when opened. Text-only settings and unavailable-image fallbacks preserve names, roles and play.

Eight new identity-preserving expressions cover Asa, Edda, Ren and the five remaining supporting speakers. Existing lead expressions and earned boundary/breach portraits retain precedence. The current actual voice actor selects their matching scene expression; fixed dialogue words, bindings and every voice delivery remain unchanged. Secondary actors enter the current list only through their actually revealed attributed dialogue; committing departure records encounter flags for later saves. Existing saves retain their facts and recorded dice without inventing earlier encounters.

See [the full-cast phase](docs/CAST_PORTRAITS.md), [explicit character/art decisions](qa/media/cast-portraits.json) and [media audition](qa/media/review.html). Preserve 197 scenes / 587 choices, 140 complete replay fixtures, 302 voice bindings / 290 active deliveries, 1d10/caps, all four finales, save version 2 and `saint-shard-3055-v1`. The provisional internal grade remains 8.2.


## Build balance and equipment cash comparisons

Steady hands now makes the successfully braced, equipped harness transfer add no Strain. Untrained carriers still add two; the reusable harness still costs 120, training and chair preparation remain earned, and no recording/publication permission or historical evidence is granted. Existing unassisted methods, prices, failed preparations, zero-cash continuations and previously spent Strain remain. At the repair bench, each kit compares the actual remaining cash with a combined 90-creds room, 45-creds staffed rest and optional 15-creds private courier; the comparison reserves nothing.

Thirty-six complete directed proxy campaigns compare three origins, four specializations and prepared/equipped/scarce profiles with legally acquired resources. Three new complete equipped-Nerve replay fixtures bring the route catalog to 143. Story scope stays 197 scenes / 587 choices. Existing matching paintings and every spoken quotation, voice delivery and sound file are retained. See [the phase record](docs/BUILD_BALANCE.md), [before/after comparison](qa/editorial/build-balance.json) and [media decision](qa/media/build-balance.json). Keep 1d10/caps, all four finales, version 2, `saint-shard-3055-v1`, held dice and saved audio/reading/art preferences. The internal grade remains 8.2.

The four unchanged browser projects now run on separate CI jobs to avoid serial suite duration exceeding Vercel's 45-minute waiting window. All checks, native permission/performance probes, evidence and fail-closed exact-commit Test/Build gates remain required; the final Build aggregate rejects unsuccessful or missing matrix results.

The production decision also checks the latest four named Browser results directly and rejects older browser/build check IDs after a fresh Test rerun. An earlier successful aggregate cannot publish while a newer required project is missing or pending. All required checks must belong to the current source-check cohort on the exact commit.


## Expanded character profiles

In the character sheet’s **People** list, **About [name]** opens a larger neutral portrait and a short biography for each of the fifteen encountered characters. Optional **Encounter notes** grow from selected entries already earned in your journal, retaining their exact text, fact/claim/promise labels and current promise status. Shared history remains beside the compact card. Unknown people and unrevealed paragraph dialogue stay hidden; legacy outcome flags never invent missing conversations or notes.

The existing neutral identity paintings are reused with explicit decisions in `qa/media/character-profiles.json`; scene expressions still follow the actual speaker and earned conduct. Larger images mount only for an expanded profile with artwork enabled. People starts collapsed, text-only remains image-free, and a missing portrait leaves the biography and controls usable. Native disclosures preserve keyboard access within the existing sheet; consulting them spends nothing, changes no save or held die, and starts no voice playback. No scene quotation, actor, audio delivery or art file changes.

See [the profile phase](docs/CHARACTER_PROFILES.md). Preserve 197 scenes / 587 choices, 143 complete campaign fixtures, 302 dialogue bindings / 290 active voice deliveries, all four finales, 1d10/caps, save version 2 and `saint-shard-3055-v1`. The provisional internal grade remains 8.2.


## Pivotal Mara and Nia scenes

Mara’s recorded admission/explanation and Nia’s terms, transfer preparation and arrival now pair the complete existing painting with canonical prose on desktop and put prose first on phones. Compact speaker headers keep the goal prominent. Recording/conversation labels and restrained quote rules guide reading; only the actual audible words receive the existing speaker highlight. Paragraph pacing, whole-scene defaults, text-only and missing-image play remain. No forced delay, camera motion, scroll or automatic choice is added.

These five frames use a quieter music/ambience mix, multiplying the saved sliders by 55%/75% alongside existing speech ducking. Nia’s pre-transfer room uses quiet Glass Chapel clinic ambience; arrival keeps the private witness room. Voice/Effects levels stay independent, mixer restarts retain focus, and departure restores normal scene levels. Exact dialogue, actors, binding order and every art/audio delivery remain unchanged. Maintain `lib/pivotal-scenes.ts`, the per-scene art decisions and `qa/media/pivotal-scenes.json` together. See [the phase record](docs/PIVOTAL_SCENE_DIRECTION.md). Preserve 197 scenes / 587 choices, 143 complete fixtures, 302 bindings / 290 voices, four finales, 1d10/caps, evidence/consent, held dice, version 2 and `saint-shard-3055-v1`. The provisional internal grade remains 8.2.


## Archive catalog investigation

At the archive comparison, an optional catalog drawer lets you inspect three written records and submit a locator for the later evacuation revision. Inspections and close/reopen are free and survive saves. Each submitted locator logs Helion +1; a mismatch also alerts the existing reader. A correct locator supplies no evidence but opens staffed extraction for 25 creds, or Spire employee billing with another badge trace. Actual retrieval supplies corroboration and leads to the original custody choice; it never authenticates the digital key or grants witness/source-name permission. The original comparison answers and all original methods remain available.

`lib/archive-catalog.ts` supplies canonical engine choices and written records; `ArchiveCatalog` presents those choices without separate authority. Notebook claims, mismatch history and the actual extraction receipt retain their scope. Reuse the existing neutral desk painting, Edda portrait and exact unchanged voice deliveries. The existing reader cue accompanies submitted queries only; free inspection and reload are silent. Maintain the explicit art decision and `qa/media/archive-catalog.json`. See [the phased delivery record](docs/ARCHIVE_CATALOG_CYCLE.md). Four new complete routes bring the catalog to 147 fixtures with 197 scenes / 597 choices, while 302 dialogue bindings / 290 voices, all four finales, 1d10/caps, evidence/consent, held dice, version 2 and `saint-shard-3055-v1` remain. The provisional internal grade stays 8.2.

## Finale direction

`lib/finale-direction.ts` explicitly enumerates the four original finales; keep chapter endings outside these frames. `PivotalScene` presents canonical prose exactly once beside the existing full painting on desktop and before it on phones. A compact header keeps the goal visible. `FinaleReflection` places earned campaign/personal codas after the scene and separates factual aftermath from collapsed chapter/resource history. Remembered Nia/Kerr answers require their actual journal and flags; contact pause wins over a stale relay. Mara's existing relationship coda retains priority. No invented treatment, forgiveness, evidence, permission or promise completion.

Closing bus focus multiplies saved music/ambience by 65%/55% alongside existing speech ducking; Voice/Effects stay independent. Existing Ward/quiet scores and all exact dialogue, actors, binding order, art and audio bytes remain unchanged. Preserve whole-scene defaults, saved paragraph/manual/mute/zero-channel/art preferences, missing-art play and native disclosures. Keep explicit art decisions and `qa/media/finale-direction.json` aligned. See [the phase record](docs/FINALE_DIRECTION.md). Preserve 197 scenes / 597 choices, 147 full authored fixtures, 302 bindings / 290 voices, four finales, held dice, evidence/consent, 1d10/caps, version 2 and `saint-shard-3055-v1`. The provisional internal grade remains 8.2.

## Archive and hearing direction

`lib/investigation-scenes.ts` enumerates ten archive/account/hearing frames without extending the historical pivotal or finale registries. Canonical prose renders once before briefing panels; desktop pairs the complete painting with prose, phones place prose first. Two new neutral Edda/Sera plates accompany explicit scene decisions, with existing Nia/relay and Ives art retained. Actual audible actors keep their own portraits, including Nia's approved-account scene with canonical primary speaker Sera.

Four Edda/Nia MP3 performances retain exact quotations, actors, binding keys and stock styles. Their preceding bytes are committed in `qa/media/archive-hearing-baseline`; `qa/production/delivery-history.ts` reconciles historical locks only for these explicit reviewed replacements and rejects an unknown change, corrupt current file or corrupt preceding file. Current provenance/mastering and new phase tests still validate every delivered byte. Maintain the independent transcript, PCM sources, global audition and all-290 mastering map. No runtime/build synthesis.

New paper/chair/folio cues follow committed custody, chair preparation or actual memorial handover; paper handling is identical for filing/withdrawal and chair contact identical for a hit/miss. Original four cues and their authoring remain unchanged. Reuse cancellation, independent Effects, speech ducking, reload silence and zero-channel request suppression. `scripts/author-investigation-foley.mjs` is offline only. Ten scenes use existing quiet music at 55% saved Music/75% Ambience with actual locations; Nia account/permission scenes use witness-room ambience.

See [the phase report](docs/ARCHIVE_HEARING_DIRECTION.md) and `qa/media/archive-hearing.json`. Preserve 197 scenes / 597 choices, 147 authored complete routes, 302 bindings / 290 voices, four finales, canonical prose, evidence/consent, pending dice, 1d10/caps, version 2 and `saint-shard-3055-v1`. The provisional overall grade stays 8.2 pending broader reassessment.

Compact scene portraits show the actual speaker’s name and Speaking cue without wrapping the repeated role over the face; the complete label remains accessible.


## Random runner names

Each new character-creation screen starts with a randomly suggested street handle and given name. Each field has its own keyboard-accessible Randomise button, which chooses a different suggestion without changing the other field or the build. Both names remain editable, and the given name may still be cleared. Suggestions are generated locally when creation opens; continuing a saved run keeps its recorded identity. Story dialogue, voices and art remain unchanged.

## Required gameplay balance audit

Test now runs `npm run balance:audit` unconditionally after `npm test`, retaining the `gameplay-balance` JSON/Markdown artifact for thirty days even on failure when evidence exists. Keep every existing Browser and Build gate. The audit executes 19,200 legal natural-dice campaigns: three origins, four two-point specializations, four complication settings including none, two policies, 200 seeds per cell. `lib/balance-audit.ts` and `scripts/balance-audit.ts` are offline QA and must never be imported by application components. Selection and dice use separate Mulberry32 streams, salted by origin/complication/policy, with shared streams across specializations in each stratum.

Compare each cell only with its own `qa/balance/baseline.json` entry. Enforce completion, valid evidence, success/expected-odds loss, resource pressure, pacing and sampled coverage limits from [STATISTICAL_BALANCE.md](docs/STATISTICAL_BALANCE.md). Keep low-sample checks and unsampled scenes/choices visible. Disparity flags are review signals, not proof of dominance or a universal good ending. Fail closed on unreadable/malformed baselines; CI never records or replaces one. Diagnose an intentional change before explicitly recording a separate candidate and reviewing both aggregate JSON and readable Markdown against the previous baseline. Update both committed baseline files and explain approved differences; never reset a baseline to hide an unexplained regression.

The initial audit completed 19,200 campaigns with 116,129 checks, sampling 190/197 scenes and 550/597 choices. Spire Chrome's 11.2–13.0pp specialist spread is the next matching-objective investigation target; it alone does not justify changing rules. Source-familiar simulation remains the available development proxy. The provisional grade stays 8.2. No story, media, art decisions, voices, rules or saves change in this cycle; preserve all 147 authored routes, 197 scenes / 597 choices, 302 bindings / 290 voices, four finales, 1d10/caps, version 2 and `saint-shard-3055-v1`.

## Matched mission comparison and checkpoint funding

`lib/matched-balance.ts` is offline QA. It legally plays a controlled setup with directed tens, then enumerates every actual witness/archive check face with probability weights. Keep this scope distinct from the natural-dice whole-campaign audit. Its 384 cases span origin, specialization, complication, sale/no-sale and requested/no kit; all twenty-six unaffordable requests remain unpurchased. Primary-method objectives exclude fallback; corroboration, authenticated keys, signed extraction, exposure, cash, clinic standing and bounded Strain remain separate. Never average unweighted terminal branches or equate mission completion with a campaign win.

Test requires `npm run balance:missions` after the broad audit and retains both reports in the existing balance artifact. Compare exact results with `qa/balance/matched-missions.json`; review candidate changes explicitly alongside its readable `.md`. Preserve the original broad baseline while changes pass its existing tolerances. See [MATCHED_MISSION_BALANCE.md](docs/MATCHED_MISSION_BALANCE.md) for policies, limitations and the eight affected before-change rows. The Spire mixed-check spread alone does not warrant a Chrome stat reduction.

`fund-checkpoint-room` spends ninety actual creds for the same private room/transport at the checkpoint, before registration. It is hidden after a completed, exposed or previously funded transfer. Preserve the failed check/Strain and grant only safe transport, not recording/publication permission or evidence. Do not move the payment into UI-only code. The existing arrival/review step supplies separate agency; exposed states retain the existing relocation route. Zero-cash and marker routes remain. `funded-checkpoint-room` is a complete saved-failure campaign fixture; engine/browser checks cover affordability, once-only spending, recorded rolls, consent and narrow layouts.

Existing neutral checkpoint and earned-safe arrival art remain appropriate; the checkpoint art decision is updated. No quoted words, actors, voice bindings or art/audio delivery bytes change. Keep current scope 197 scenes / 598 choices / 148 complete authored fixtures, 302 voice bindings / 290 active deliveries, all four finales, 1d10/caps, save version 2 and `saint-shard-3055-v1`. Internal grade remains 8.2.

## Goal-driven campaign economy

Test now also requires `npm run balance:campaigns`. Its offline `lib/campaign-economy.ts` / `scripts/campaign-economy.ts` play 43,200 source-aware full campaigns, with natural dice from the prologue and no directed setup or resource injection. Keep 432 cells across origins, specializations, the three current UI complications, witness/archive/private-delivery goals, sale/no-sale and care-first/kit-first strategies. Every campaign reaches a finale; goal access, achievement, missing source packets, actual funds, Strain, equipment, exposure and unpaid work remain separate. A blocked optional purchase is not a failed mission. Never infer universal wins, player averages or independent acceptance from these policies.

Keep paired seed streams and explicit choices, actual canonical engine authority, earned training, owned markers and funded recovery. `missionDecision` is shared with the earlier matched audit without changing its policies or baseline. Current tests also replay sampled natural-dice logs through saved checks and conserve actual money. Fail CI on incompatible/malformed evidence, missing/duplicate cells, failed campaigns, or per-cell access/goal/cash/Strain/privacy/obligation/coverage regressions from [CAMPAIGN_ECONOMY.md](docs/CAMPAIGN_ECONOMY.md). Compare `qa/balance/campaign-economy.json` and retain its readable `.md`; candidate-recording mode is explicit and never silently resets the baseline. Preserve the existing broad/matched baselines and the thirty-day balance artifact.

The first 43,200 runs finished; 40,920 started and achieved their defined goal, with 2,280 opening/source-access non-starts. Kit-first no-sale play spent about 42–50 more creds without additional goal completion in these focused policies. This supports clearer kit guidance, not an unsupported price or reward change. `trainedKitAdvice` must require the actual earned perk. Only shopping exposes the collapsed native disclosure; it does not spend resources or change game state. Preserve the exact trained-method caveats: no-roll archive/typed depot decisions, real effort/fees/exposure, required bracing/harness and source-versus-key distinctions. Unknown/unearned skills supply no advice.

The neutral repair bench and Quill portrait remain suitable, with an updated explicit art decision. The new words are written UI advice, not a new Quill quotation; retain every actor/voice binding and art/audio byte. Scope stays 197 scenes / 598 choices / 148 full authored fixtures, 302 bindings / 290 voices, all four finales, held dice, caps, version 2 and `saint-shard-3055-v1`. Grade stays 8.2. Additional side work and recovery-timing strategies are future comparison scope, not already-tested behavior.


## Clinic and witness overlap

Test additionally requires `npm run balance:overlap`, retaining its JSON/Markdown in the existing thirty-day balance artifact. `lib/clinic-overlap.ts` and its script are offline QA. The optional explicit `ClinicSchedule` in the existing campaign runner must leave its omitted/single-goal behavior and all preceding baselines unchanged. Keep 576 no-sale cells × 25 paired natural seeds, with the actual three UI complications, both spending and mission orders, early/late recovery and trained/volunteer approaches. Witness-first gives Nia time before clinic work and returns for separate review. Volunteer work must actually be kept. Preserve natural failed preparation, exposure, source non-starts, cash conservation, once-only attempts and bounded Strain; a completed finale is not a protected account or repaired pump.

The first 14,400 campaigns completed; 13,248 began both jobs, 13,232 met both goals, and sixteen retained witness exposure. All medicines were preserved in started clinic jobs, sometimes through transfer rather than repair. All owed work was kept by the declared policy. Keep every per-cell result, rather than pooling away small adverse outcomes. The exact reviewed `qa/balance/clinic-overlap.json` comparison is deliberately stricter than a significance claim. Candidate mode is explicit, validates complete evidence, never overwrites that baseline and supplies no historical comparison. Review aggregate JSON and readable Markdown before any intentional replacement. See [CLINIC_OVERLAP.md](docs/CLINIC_OVERLAP.md).

`commitmentActions` derives only currently visible canonical choices for existing open witness/coolant/shift work and recovery. Available **Find** controls move focus to the original button; they never call `commitChoice`, change saves, bypass a disabled requirement or alter choice indices. Suppress directions during a held check; Week actions disappear with their canonical choices, while the later notice reply can be found at Ward Nine. Retain real bounded costs and disabled reasons. The optional collapsed care-budget advice compares actual current cash with the authored room/courier prices, without reserving money or implying those paid routes are mandatory. Deferred accounts and return work remain distinct in `nextStep`, objectives and closing warnings.

This is written UI advice with existing suitable canal/clinic art and actual-actor portraits. The canal art decision records the review. Keep every exact quotation, actor, voice binding, delivery and media byte matched. Scope remains 197 scenes / 598 choices / 148 authored complete fixtures, 302 bindings / 290 voices, four finales, 1d10/caps, held dice, version 2 and `saint-shard-3055-v1`; grade stays 8.2. Distribution, additional mission combinations and independent acceptance remain outside this sample.


## Distribution alongside witness work

`npm run balance:overlap` must run both existing `scripts/clinic-overlap.ts` and new `scripts/distribution-overlap.ts`, sequentially and unconditionally. The latter tests 1,296 cells × 20 paired natural seeds: all origins/specializations/current UI complications, both spending/recovery policies, three distribution channels and three sequences (dispatch-first, witness-first, paused-draft interleaving). Only actual canonical choices supply income, training, kits, acceptance, work, witness protection and two later card acknowledgements. Preserve the prior coolant, single-goal, matched and broad baselines unchanged. The optional distribution/interleave policy must not affect their omitted/default behavior. No offline audit module enters the app bundle.

Keep `qa/balance/distribution-overlap.json` and readable `.md` aligned. Normal CI compares exact complete per-cell results, writes failure evidence before validation/comparison, rejects malformed/missing/duplicate/incompatible evidence and retains the existing thirty-day balance artifact. Explicit candidate mode (`node --import tsx scripts/distribution-overlap.ts --record-baseline --out=/tmp/distribution-candidate.json`) never overwrites the committed baseline or claims a historical comparison. Review evidence and document intentional differences before replacement. Initial 25,920 runs completed, 24,228 started/met both goals and 1,692 had source non-starts; 88 unaffordable carrier requests used actual carrying. These source-aware paired samples do not certify universal affordability or independent player acceptance.

`objectives` and `promiseStatus` must distinguish a saved draft, accepted dispatch, two observed acknowledgements and unknown attendance. Never change the original dispatch journal text after a later observation; update current status instead. `weekClosingPromises` excludes the notice reply only because it becomes available after the Week; `unresolvedPromises` retains the full campaign ledger. Closing warnings name actual remaining commitments, and a deferred Nia account plus paused schedule has combined return guidance. Find controls derive visible canonical actions and bounded prices/effects, preserve consent, require a separate commitment and work at the Ward Nine reply as well as the canal. Saved costs/dice and all 148 historical full-state contracts remain.

Available here is an h2 following the scene h1. Full Axe checks include heading-order best practices; do not hide the rule or remove the failing archive-pause checks. The preceding 61dc736 CI failed only its three archive-pause widths in each browser project on this h3 regression; aggregate Build correctly blocked publication. Preserve all existing tests, project names, failure behavior and exact-commit release gates.

This is written navigation/status advice. Existing neutral canal and dispatch art, actual-actor portraits and every exact quotation remain suitable, with three explicit art rationales updated. No new scene or media file is required. Keep 197 scenes / 598 choices / 148 authored fixtures, 302 bindings / 290 voices, four finales, held dice, 1d10/caps, version 2 and `saint-shard-3055-v1`; grade stays 8.2. See [DISTRIBUTION_OVERLAP.md](docs/DISTRIBUTION_OVERLAP.md). Next: archive investigation with private delivery and chapter-close consequences.


## Security boundaries and dependency maintenance

Read [docs/SECURITY_REVIEW.md](docs/SECURITY_REVIEW.md) when changing storage, rendering, dependencies, browser headers or CI. Treat imported files and browser storage as untrusted. Check size before parsing (save/codex/slot limit 1,048,576 characters; preferences 16,384), validate the schema, and copy only accepted nested fields while preserving existing serialized field order. Never resolve untrusted ids through inherited dictionary members. Ignore reserved flag keys, retain arbitrary journal ids as text, and keep version 1 migration, version 2, native snapshots and held dice compatible. The FNV checksum detects accidental corruption and supplies no authentication or encryption.

Next.js is patched to 15.5.28; `overrides.postcss` pins 8.5.30 because the supported Next.js 15 patch still declares a vulnerable older PostCSS. Keep the override until an upstream version supplies a safe dependency and a clean audit/build verifies removal. Run `npm run security:audit` alongside source/build checks. CI requires the audit and blocks moderate or worse advisories, including development dependencies and audit-service errors. Do not bypass it with `continue-on-error`, omit flags or forced dependency upgrades. Review advisory applicability and compatible fixes.

Production headers cover documents and local assets. The unused image optimizer is disabled. CSP permits inline Next.js hydration and styles, so it is defense in depth and cannot be claimed as strict inline-script XSS prevention. Development omits CSP for its compiler; production browser tests must use a fresh production build and check art, fonts, FLAC gzip delivery, audio, saves/downloads and navigation. Preserve local-only requests and React text escaping; no imported text may become HTML, script, CSS, media paths or navigation URLs.

Keep GitHub Actions pinned to verified full commit SHAs with read-only permissions and `persist-credentials: false`. Update pins through reviewed upstream revisions. Production check ingestion accepts only `app.slug === "github-actions"`; same-name third-party results cannot satisfy or override the existing exact-commit/latest-cohort gate. Keep all browser, balance and aggregate checks mandatory. The tracked-file secret-pattern scan found no matches; it is not a history audit or proof that hosting credentials and account settings are secure. No account credentials or live user saves were accessed.


## Multiline speech and independent voice coverage

[docs/VOICE_COVERAGE_REVIEW.md](docs/VOICE_COVERAGE_REVIEW.md) records a real coverage gap: the former quotation regex excluded newlines in straight quotes and single curly quotes. It skipped Quill’s `chapel` explanation and Lumen’s two-paragraph `lumen_deal` speech; the earlier coverage audit reused that parser and inherited the blind spot. Retain the multiline parser, independent character-scanning audit in `qa/production/multiline-speech.ts`, explicit four-part inventory in `qa/media/multiline-dialogue.json`, and the regression over every scene and full authored route. Do not check completeness solely through known clip targets or the same quotation regex.

Current coverage is 306 bindings / 301 quotations / 294 active files / 121 voiced scenes. Four added MP3s retain `am_michael` for Quill and `af_heart` for Sister Lumen, exact authored words, measured playback trims, actual-speaker portrait mappings and appropriate existing scene art. A whole quotation must be revealed before its parts queue; paragraph mode never speaks hidden text. No story words or game rules changed. `qa/production/binding-history.ts` validates precisely the additive cohort against the exact preceding 302 bindings and immutable historical hashes; do not regenerate old phase expectations. All preceding voice bytes remain preserved.

In `scripts/voice-validation.ts`, automatic mode waits for the expected first voice start rather than an ephemeral source count. Initial playback must request the selected delivery exactly once. Explicit replay may make zero or one further request because the 24 MiB decoded cache can evict an early clip during a long queue; retain `requestsBeforeReplay` and `replayRefetched` in evidence. Continue to require exact queue order, natural completion, transcript and gain alignment, Stop, unchanged saves and complete source disposal. Never apply the replay allowance to initial fetching or remove the cache limit.

`tests/check-dialogue.spec.ts` must distinguish the restored background `lumen_deal` scene speech from its separate `fake-pact` result. Scope pre-roll result controls to the check dialog; assert that the scene control is disabled and any started scene voices are disposed when the modal opens. A global absence of voice controls is no longer valid. Preserve checks for silent pre-roll results, sound/voice/automatic preferences, held dice, replay and departure during loading. Commit 28634ed failed all four remote Browser projects on five outdated assertions each; the release gate correctly retained the preceding production build. Do not bypass that gate or describe the restored recordings as live until the corrected exact commit passes and production is verified.
