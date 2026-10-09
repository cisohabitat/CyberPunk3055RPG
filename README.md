# Saint Shard

A solo story RPG in **Kite City, 3055**. You play it in the browser. The run stays on that browser. There is no account and no server save.

Quill hires you to lift Mara Voss's unedited hour from Glass Chapel before dawn. Helion is about to edit a crime out of her: she signed the Ward Nine coolant dump, and three hundred people died. Kerr is paid to stop you. Sister Lumen may help you leak the hour or break it. A week later the city asks for a buyer or a witness. At Ward Nine, Sera keeps the dead on a wall, and that is the last choice.

The current goal stays under the location while you play, and on the title screen when you continue. The place name sits beside the act: The Hour, The Week, or The Wall. Scene prose arrives one paragraph at a time, and you can show the rest. A choice that moves creds, strain, an item, or a faction says so before you take it. The sheet keeps a short list of what you already did.

- Lift Mara Voss's hour from Glass Chapel before dawn. Kerr is paid to stop you.
- You know what the hour is. Decide who gets it.
- The week wants a buyer or a witness.
- The wall has the names. Say them, or leave them to the rain.

The first time the shard is in your hand, Mara says the memo, then why she signed. People you have met are listed with their role. A seen ending on the title screen shows its coda. Unseen endings stay blank. The phone, the tablet, and the desktop each keep that goal on the scene. Longer prose uses the full reading width below the portrait.

This is original fiction. It is not affiliated with any studio or with any existing cyberpunk game.

## Play locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test
npm run build
```

## How a check works

Roll **1d10** and add the stat, your origin perk if it matches, one earned skill if it applies, and any gear, clue, or faction standing that applies. A live optic adds to Chrome. Meet or beat the difficulty. A **10** on a success eases Strain. A **1** on a miss adds Strain. Before the die, the stat you are rolling says one sentence. Chrome, Nerve, Face, and Ghost each have their own. The sentence does not change the math.

Four stats: Chrome, Nerve, Face, and Ghost. You spend two points at the start. No stat goes above 5. Origins are Gutterwire, Spire Exile, and Dustline. One complication comes with the name: Quill's tab, a live optic, or a record that is still on file.

At Strain 4, a risky check says the chair is close. At Strain 5, a bad night inside Glass Chapel can end in the chair.

## Screens

The same scene fits a phone, a tablet, and a desktop. On a wide screen the character sheet is a column beside the story. On a narrower screen it is a drawer, and the goal stays on the scene without opening it. Buttons stay large enough to tap.

Settings control text size, contrast, reading pace, motion, sound, separate music/ambience/effect volumes, and optional controller input. Controller D-pad up/down moves focus, left/right adjusts settings or sheet tabs, A selects, and B closes a dismissible dialog. Number keys choose story options while the sheet and other dialogs are closed. In the sheet, Left and Right arrow keys switch between Stats, Gear, and Journal; Home and End select the first and last tabs.

## Deploy on Vercel

Import this repository. The framework preset is Next.js. There are no environment variables and no database. `npm run build` is the production build.

Pushes and pull requests run `.github/workflows/ci.yml`. The Test job runs `npm test`. The Build job runs only after that, builds the game, and runs Playwright on desktop Chromium, phone-sized Chromium, Firefox, and WebKit. Accessibility checks run with the browser suite. A production deploy waits for both checks. If either fails, Vercel skips the production build and the live site stays on the last deploy that passed. Pull request previews still build immediately, with the same checks running beside them.

The active run lives in `localStorage` under `saint-shard-3055-v1`. Its previous valid state is an automatic backup. Three manual slots and JSON export/import keep separate copies. Imported files are validated and exported files carry an integrity checksum. The checksum detects accidental changes; it is not a signature or anti-cheat system. A rolled outcome is saved before its animation and restored after a reload; Continue applies it once. Abandon clears the active run and backup, while manual slots remain.

Settings and the codex use their own keys. Existing version 1 and version 2 runs still load; older sound and text preferences migrate when there is no new settings record.

If the browser blocks storage or cannot save, the game still opens and plays. A failed save shows a notice to keep the page open: that run can continue during the session, but reloading may lose its progress. Sound and text controls still work when their preferences cannot be stored.

## The memory bench and the week

After Mara explains her signature, open the memory bench to inspect three fragments: her account, an exported counter-order awaiting independent verification, and the roster identifying Nia Pell as a living witness. The journal distinguishes claims, facts, and promises. Inspect all three, compare the decisions, and label the packet before deciding which record leaves the room:

- **Complete archive:** preserve the chain and roster, take Strain and surveillance attention, and investigate its issuing key during The Week.
- **Protected roster:** withhold worker locations, lose some public confidence, and move Nia to safety before attaching her account.
- **Witness chain:** entrust the private roster to Lumen and accept the promise to protect its living source.

Your character still remembers what they heard when a public record is redacted. Failed transport opens a checkpoint negotiation. Failed archive authentication opens a ledger search. These jobs can be left unresolved; the final aftermath describes that honestly.

At the beginning of The Week, choose one practiced skill for +1 on its checks. Each origin has a different contact favor: Gutterwire can earn a shelter token, Spire Exile a signal baffle, and Dustline a one-use passenger route. Quill's standing can buy a witness room; the clinic marker can be consumed to recover a stopped transfer. The third-name check at the wall permits one attempt.

Finales retain their codas and add consequences for Ward Nine, Mara, Nia, Lumen, and your origin contact when those stories apply. The chapel, street, and wards have separate musical beds with crossfades. Audio remains optional.

## Verification and authoring

```bash
npm test
npx tsc --noEmit
npm run build
npx playwright install --with-deps chromium firefox webkit
npm run test:browser
npm run story:report -- story-report.json
```

The story report maps choices, gates, destinations, and consumed tools, then runs 900 seeded campaigns. Simulations check completion, not whether players find a build satisfying or balanced. Browser traces and screenshots are retained for failures. Diagnostics can be exported from Settings; the game sends no diagnostics automatically and the report excludes names, choices, and save contents.

See [production direction](docs/PRODUCTION.md), [release gates](docs/RELEASE.md), and [credits and asset provenance](CREDITS.md). External playtests, manual screen-reader review, asset rights confirmation, and recorded voice performances remain production work, not completed certification.

## Changing the game

Read [AGENTS.md](AGENTS.md) before you change the story, the rules, the screens, the sound, the save, or the deploy. Update this README and `AGENTS.md` in the same change when any of those facts move. `npm test` checks that both files still quote the four goals and the save key.

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
