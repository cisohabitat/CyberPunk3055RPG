# Saint Shard

A solo story RPG in **Kite City, 3055**. You play it in the browser. The run stays on that browser. There is no account and no server save.

Quill hires you to lift Mara Voss's unedited hour from Glass Chapel before dawn. Helion is about to edit a crime out of her: she signed the Ward Nine coolant dump, and three hundred people died. Kerr is paid to stop you. Sister Lumen may help you leak the hour or break it. A week later the city asks for a buyer or a witness. At Ward Nine, Sera keeps the dead on a wall, and that is the last choice.

The current goal stays under the location while you play, and on the title screen when you continue. The place name sits beside the act: The Hour, The Week, or The Wall. Scene prose shows the whole scene by default. Settings also offers one paragraph at a time, and saved reading choices are respected. A choice that moves creds, strain, an item, or a faction says so before you take it. The sheet keeps a short list of what you already did.

- Lift Mara Voss's hour from Glass Chapel before dawn. Kerr is paid to stop you.
- You know what the hour is. Decide who gets it.
- The week wants a buyer or a witness.
- The wall has the names. Say them, or leave them to the rain.

The first time the shard is in your hand, Mara says the memo, then why she signed. People you have met are listed with their role. A seen ending on the title screen shows its coda. Unseen ending titles stay hidden; the catalog shows discovery counts by chapter. The phone, the tablet, and the desktop each keep that goal on the scene. Longer prose uses the full reading width below the portrait.

This is original fiction. It is not affiliated with any studio or with any existing cyberpunk game.

Read the [project description](docs/PROJECT_DESCRIPTION.md) for a short repository summary, game overview and description of the latest distribution and witness improvements.

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

Pushes and pull requests run `.github/workflows/ci.yml`. Test first checks that both this README and `AGENTS.md` received content updates across the change, then runs `npm test`, `npm run balance:audit`, `npm run balance:missions`, `npm run balance:campaigns` and `npm run balance:overlap`. Missing documentation updates or balance regressions fail Test and block production. Four Browser jobs independently compile the game and run the complete existing desktop Chromium, phone Chromium, Firefox and WebKit projects in parallel, including accessibility checks. Chromium also runs the native autoplay smoke and loading probe. Build requires Test and every Browser job to succeed. The exact-commit production gate still waits for Test and Build; a failed, skipped, canceled or unreadable check blocks publication. Pull request previews retain their existing behavior.

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

Read [AGENTS.md](AGENTS.md) before making a change. For every repository change, review and update this README and `AGENTS.md` together with an accurate explanation, including changes to tests, tooling and documentation. Avoid timestamp-only or whitespace-only edits. `npm test` also checks that both files still quote the four goals and the save key.

`scripts/docs-freshness.mjs` requires changed committed content in both documents across the complete push range or pull request changes since the merge base. Permission changes and deletions do not count; missing comparison history fails the check. Identical repository trees need no artificial edit, and the first branch snapshot must contain both files. To check a committed change locally, run `node scripts/docs-freshness.mjs BASE HEAD` with its actual base and head commit references. CI fetches full history and supplies the event's revisions automatically. The check enforces document updates; authors still review whether the prose accurately covers the implementation.

The deterministic score generator runs automatically before development, tests, and production builds. The chapel and ward beds and memory cue are generated assets; keep their source in `scripts/generate-audio.mjs`.

The six-phase status and remaining production milestones are tracked in [docs/ROADMAP.md](docs/ROADMAP.md). The current candidate contains 197 scenes and 597 choices; retain all four original finales.

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

The playtest reading pass keeps initial memory inspection interactive. On later memory steps, fresh prose and choices come first; “Review the inspected memory” opens the source dossier below them. The keyboard skip link focuses choices in either reading mode. Settings controls fit their grid at narrow widths and with desktop scrollbars. Restores announce the slot, backup, import, or autosave and its chapter/place; restoring a checkpoint does not present resource differences as new gameplay. Check choices preview bounded numeric resource costs before the existing critical adjustment. Lumen distinguishes an offered clinic marker from an existing debt, and leaving the chapel without a promised copy explains the closed copying window. Ending discovery groups the fifteen outcomes into eight Hour outcomes, three Week outcomes, and four Wall finales, with optional spoiler-light replay hints. See [the playtest response](docs/PLAYTEST_RESPONSE.md).

New runners enter through a playable prologue before Quill’s job. It introduces Kite City and memory trading, connects your origin and complication to the night, and lets you choose why you are taking work. A short optional conversation at the noodle counter gives the memory trade a human cost. Your chosen reason and the conversation carry into Quill’s briefing. “Go straight to Quill’s meeting” skips the prologue for returning players. The opening uses no dice and changes no money, items, stats or faction standing; it saves and resumes like other scenes. Existing saves continue from their recorded checkpoint. Before the briefing, your goal is “Find Quill at the Ward Four noodle stall. Hear what he is offering.”

Dustline runners can meet Asa before the freight favor and plan a sealed diagnostic delivery. Inspect the seal, cargo slip and timetable, then choose one preparation. Practiced Chrome, Nerve, Face and Ghost skills unlock different methods; cold carriage costs twenty-five creds, and a free official desk remains available. A failed crossing offers recovery while preserving route exposure. Wait for a clinic stock receipt to earn a passenger clearance from a private route; leaving the batch unobserved earns none. A later visit to Asa can confirm a stock entry or retain an unknown delivery and reflect on your opening motivation. Delivery does not establish patient treatment, historical proof or witness consent. The direct courier route remains available.

### Gutterwire shelter response

Gutterwire runners can plan Sera’s shelter response before taking the direct valve job. Prepare a brace, controller, crew or accessible ramp; repair with a check, a trained method or a forty-creds fitter, or evacuate to the free staffed hall. A failed repair leads to evacuation rather than another roll. A repaired shelter still needs a room allocation: keep all rooms for residents, or arrange a consenting household’s annex move using forty creds, ward trust or donated mattresses carried at Strain +1. Only a confirmed private referral reservation earns one shelter token; it does not move Nia. The later neighbor visit remembers shared hall sleeping, resident rooms or an unobserved move and offers laundry help without replacing the token.

### Illustrated encounters and original stereo score

The start page has dedicated, spoiler-free title art: a lone runner and luminous memory shard against Kite City. Desktop places the live title and menu over its dark left side; phones center the branding above live controls over a portrait city composition. Returning players get Continue first, with the existing new-run replacement confirmation. The first arrival retains its separate Kite City illustration. The memory bench, shelter briefing and freight briefing have dedicated framed scene art, with readable captions and descriptions. The Spire service counter, maintenance alcove and later payroll table also have accompanying illustrations, reused across related steps without claiming an outcome. Nia, Edda and Asa now have distinct generated portraits. Text-only mode omits these images and their requests, including on the title. Narrow screens use 600-pixel scene images; the goal stays above the illustration.

New scenes must ship an explicit art decision and accompanying art when the setting, character or visual moment calls for it. Appropriate existing art can be reused; a deliberate text-only decision needs a rationale. The scene-art catalog and production checks enforce coverage. See [the authoring workflow](docs/AUTHORING.md).

Enable Sound in Settings to hear four original 32-second stereo chapter arrangements: *Under the Awnings*, *An Hour in Glass*, *The Work Between* and *Names in the Rain*. A recurring memory motif links the felt keys, glass tones, soft bass and bowed textures. Existing channel volume controls, optional rain ambience and scene crossfades remain available. Audio is synthesized, with no actor recordings or third-party samples. Art provenance and an audition page are in `qa/media/`; independent visual, listening and physical-device acceptance remain open.


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

Creation explains when an empty or whitespace-only street handle keeps entry unavailable; the existing character requirements and saved outcomes stay the same. The [study pack](docs/PLAYER_STUDY_PACK.md) provides a five-opening/five-campaign facilitator guide, spoiler-free participant brief, fourteen-clip inventory and blank listening/device records. It is preparation, with no new scene or media asset. Real participants, human listening, manual access/device review and subsequent findings-led revisions remain pending; the provisional grade stays 7.8 and no acceptance gate is closed.

### State-aware scene summaries

A successful second copy now takes precedence over the earlier failed-copy sentence in the Chapel alley, while retaining the missed roll and its cost. Hearing drafts, journal records and factual aftermath distinguish an absent Nia recording from an approved private account. The Week's transfer option asks to arrange Nia's terms rather than asserting a prior relocation promise. Saved-check regressions cover the fail-then-success sequence and the original two-copy payout; recording and quotation permissions still require their own choices. Existing art accompanies these scenes; no new scene or voice quotation is added. Internal simulated play and regression checks supply no human acceptance or higher grade; 7.8 remains provisional.


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

Optional selected dialogue now includes Nia’s arrival, Mara’s present-day request and public refusal, and Kerr’s actual handover terms. Twenty fixed synthetic quotations are available through Listen/Stop only when their words are visible. Quill’s offer, Mara’s revelation and Kerr’s later boundary use deliberate phrase spacing. Clinic, witness-room and stall ambience give these conversations distinct room textures; dialogue ducks the beds without changing story state. Sound off and unavailable clips retain the written scene. See [the audio craft cycle](docs/AUDIO_CRAFT_CYCLE.md) and [local media audition](qa/media/review.html). The provisional internal grade stays 8.2; complete-campaign pacing and consequence rhythm are next.

## Campaign return craft

Returning to the canal or the wall now reflects the job or conversation just completed, using saved conduct and actual evidence. The first meetings keep their introductions. Optional work and the chapter decision have separate headings; a keyboard-accessible link reaches street speech/paid silence or the final wall decision without selecting anything. Choices, numbering, costs and outcomes retain their original order and behavior. Existing canal/Sera art and accompanying sound fit the returns; no new scene or media is needed.

The [campaign craft cycle](docs/CAMPAIGN_CRAFT_CYCLE.md) records paired comparisons across 108 routes and full keyboard play. Preserve save version 2, `saint-shard-3055-v1`, recorded dice, 1d10 and caps, all four finales, visible goals and silent/text-only parity. The internal grade stays 8.2. Next: resource-poor/failure-heavy campaign balance and recovery visibility.


## Resource-poor recovery

A failed Kerr collection can pause for free while the case remains held and the request stays open. Resume through his canal request before the week closes; the original failure, departure fee and recipient registration persist. The twenty-creds courier still requires funds and breaks private terms. Closing the request or leaving the Week keeps the actual unfinished outcome. An exposed but undelivered open request also appears in the chapter's unfinished-work warning.

The [scarce-resource recovery cycle](docs/SCARCE_RECOVERY_CYCLE.md) records zero-credit no-sale campaigns, one-time free rest, successful rebate-funded recovery and repeated failure/unfinished endings. Existing neutral depot/canal art and sound remain suitable; no new scene or media is needed. Preserve save version 2, `saint-shard-3055-v1`, recorded dice, 1d10 and caps, and all four finales. The provisional internal grade remains 8.2. Next: long-investigation navigation and source comprehension, using simulated play as the development proxy.


## Investigation notebook

“Consult acquired sources” opens a read-only notebook during reconstruction, archive comparisons and the public hearing. Search inspected timestamps, source labels or phrases, and filter recorded memory, archive records, witness accounts or interpretations/corrections. Original wording and recorded status stay attached; current corroboration and quotation limits remain visible even when results are filtered. Return to the same decision and reading position without choosing an answer or changing the save. Unacquired fragments stay hidden.

The [investigation navigation cycle](docs/INVESTIGATION_NAVIGATION_CYCLE.md) records baseline lookup, complete campaigns and keyboard/accessibility verification. Existing scene art and audio remain suitable; the notebook needs no new scene, illustration or quotation. Preserve version 2, `saint-shard-3055-v1`, recorded dice, 1d10 and caps, four finales, silent/text-only play and focus restoration. The provisional internal grade remains 8.2. Next: contrasting scarce-budget witness/archive recovery and delayed consequences across origins.


## Archive recovery across origins

A failed archive query can pause for free and resume at the same ledger desk through the canal before the Week closes. Pausing preserves the failed roll, strain, funds, exposure and unverified source record; it adds no authentication attempt or reward. The twenty-five-creds ledger and Spire employee-number routes retain their price or badge trace. Recording the gap closes the search; leaving the Week with it paused keeps an unfinished commitment and an honest factual aftermath. Later ledger corroboration stays separate from digital-key authentication and public quotation permission.

The [scarce-investigation cycle](docs/SCARCE_INVESTIGATION_CYCLE.md) compares no-sale witness and archive campaigns across all three origins. Existing neutral archive setting art and sound accompany the paused desk; no new scene or media is required. Preserve version 2, `saint-shard-3055-v1`, recorded dice, 1d10 and caps, all four finales and text-only/silent play. The internal grade stays 8.2. Next: failure-heavy finale and source-custody continuity before a full-campaign regrade.


## Memorial and hearing outcomes

Speaking the memorial names does not file a public hearing account. All four factual finale recaps distinguish filed, withdrawn and unfiled hearing drafts from the memorial action. Withdrawal retains what attendees may remember; leaving quietly does not erase an earlier disclosure. Acknowledging the earlier leak supplies no new corroboration or witness permission.

Ives takes the memorial page, while Sera keeps the separate private witness ledger. Archive originals and approved recordings retain their recorded custody and publication terms; quotation permission for a withdrawn draft does not open that recording to circulation. The handover preview and both voluntary/failed-interruption endings state this scope. Existing finale art, chapter beds and fixed quotations accompany these outcomes; no new scene or media asset is needed. Preserve version 2, `saint-shard-3055-v1`, recorded dice, 1d10, caps and all four original finales.

See [the finale continuity cycle](docs/FINALE_CONTINUITY_CYCLE.md) and [current review](docs/REVIEW.md). Seven new authored full campaigns cover failures, corrected/withdrawn hearings and private custody. Source-familiar simulated play remains the available development proxy. The full-game internal grade stays 8.2; the next craft priority is encounter variety and audiovisual direction.


## A chair beside the rain

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

The campaign now has framed illustrations for 195 of its 197 scenes; The Week and The Wall retain deliberate text chapter cards. Ten new neutral setting paintings and 111 explicit additional scene bindings cover the market, Chapel entrances/service passage/chair-room machinery, clinic coolant and relay corners, district board, freight passage and shelter landing/hall. Existing suitable paintings accompany other returns. Portrait conduct, responsive sources, descriptions, missing-art fallback and text-only play remain.

Character dialogue now plays in revealed order, including conditional replies and multiple speakers. The active sequence uses 290 fixed clips: 190 new mono MP3s and 100 earlier WAVs, across fifteen stock voice styles. All 101 preceding WAVs remain byte-identical; the capacity counteroffer's earlier Lumen recording is retired from playback because the authored speaker is the dispatcher. Ren, the stallholder, orderly, dispatcher, mechanic and masked attendant have explicit casting. Narration, written messages/labels, player questions and custom player-name addresses stay readable without speech. No player-text synthesis or speech model runs in the game.

Automatic dialogue and Sound remain on by default. Reveal adds lines without restarting the current actor. Listen replays a selected line; Play all dialogue replays the visible conversation. Stop, scene departure, dialogs, mute, zero voices and pagehide cancel pending/active speech and its queue. Closing a dialog or Resume sound does not replay interrupted visible dialogue. Missing clips cannot block reading, choices or saves. The existing mixer, ducking, 24 MiB decoded cache, all four finales, rules, version 2 and `saint-shard-3055-v1` remain.

See [campaign media coverage and verification](docs/CAMPAIGN_MEDIA.md), [the locked inventory](qa/media/campaign-media.json), [dialogue audit](qa/media/campaign-dialogue-audit.json), [voice provenance](qa/media/campaign-dialogue-provenance.json) and [media audition](qa/media/review.html). `npm run production:voices -- URL --workers 4` verifies every active clip with displayed source examples, natural completion, explicit cached replay, Stop, transcripts and cleanup. Authored/seeded routes and synthetic branch samples are labeled separately. Optional offline generation never runs in CI or in the browser. The provisional internal grade remains 8.2; these checks do not establish commissioned acting or independent listening acceptance.

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

Sixteen revised exact-word stock deliveries make private terms, source limits, late payment and courier uncertainty easier to hear. Their MP3 loudness is matched offline; short 120 ms same-actor and 220 ms speaker-change pauses let sequenced dialogue breathe. Stop, departure, dialogs, mute and pagehide cancel a pending pause. Listen remains immediate, and saved mute/manual/paragraph choices remain respected.

Kerr and Quill have matching terms portraits with existing breach/refusal expressions taking precedence. Edda’s assignment portrait requires an earned paid bench shift and keeps the inquiry reference beside it. Asa’s closer sealed-case illustration accompanies the dispatch briefing before crossing. The complete scene still appears by default; actual audible actors, exact text cues, text-only play and goals remain aligned. All 302 bindings and other active audio files are unchanged. The game keeps 197 scenes / 587 choices, 140 complete replay fixtures, 290 active files, version 2 and `saint-shard-3055-v1`, saved rolls and all four finales. See [the phase report](docs/CHARACTER_MEDIA_CYCLE.md), [reviewed media](qa/media/character-media.json) and [audition](qa/media/review.html). The internal grade stays 8.2.

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

All four final scenes now lead with their canonical words and complete existing paintings: side by side on desktop, prose first on phones. A compact speaker header keeps the goal visible. **What you carry** brings the earned opening motive, work and remembered personal answer forward; no answer is invented for an unvisited conversation. **What remains** keeps factual consequences available, with chapter history and final resources in a separate keyboard-accessible disclosure. Chapter endings keep their existing summaries.

The closing mix uses 65% of the saved Music level and 55% of Ambience alongside existing speech ducking. Voices, Effects and manual/mute/paragraph/text-only preferences retain their own controls. Dialogue, actor, art and audio deliveries remain unchanged. See [the finale phase](docs/FINALE_DIRECTION.md). The provisional internal grade stays 8.2 pending a broader review.

## Archive and hearing direction

Ten archive, Nia account and public-hearing conversations now lead with their full text and matching complete scene art: beside the words on desktop, after the words on phones. New closer Edda/Sera paintings keep sources and draft papers anonymous. Briefings and source tools remain available after the conversation; whole-scene defaults and saved paragraph/text-only preferences remain.

Four exact-word Edda/Nia performances have clearer phrasing, with established voices and manual/automatic playback preferences preserved. The existing quiet score and actual room ambience sit below dialogue. Soft paper handling, chair-brake contact and a closing folio accompany the actual committed actions; they add no evidence, consent or outcome. See [the phase report](docs/ARCHIVE_HEARING_DIRECTION.md).

Compact scene portraits show the actual speaker’s name and Speaking cue without wrapping the repeated role over the face; the complete label remains accessible.


## Random runner names

Each new character-creation screen starts with a randomly suggested street handle and given name. Each field has its own keyboard-accessible Randomise button, which chooses a different suggestion without changing the other field or the build. Both names remain editable, and the given name may still be cleared. Suggestions are generated locally when creation opens; continuing a saved run keeps its recorded identity. Story dialogue, voices and art remain unchanged.

## Automated gameplay balance audit

`npm run balance:audit` compares 19,200 natural-dice campaigns across three origins, four specializations, four complication settings and two choice policies with a committed baseline. CI rejects progression failures, configured success/resource/pacing regressions and lost sampled coverage; it retains aggregate JSON/Markdown evidence for thirty days. Reports flag build disparities for review without declaring one narrative ending a win.

The initial sample completed every campaign, resolved 116,129 checks and reached 190 of 197 scenes and 550 of 597 choices. The largest within-Spire specialization spread is 11.2–13.0 percentage points under the specialist policy, with Chrome ahead; that difference needs matching-objective follow-up, since encounter selection and costs differ. Passing the audit preserves the measured baseline and does not certify ideal balance or change the provisional 8.2 grade. See [the method, findings and regression limits](docs/STATISTICAL_BALANCE.md) and [the readable baseline](qa/balance/baseline.md). Existing directed replays and equipment comparisons remain required; rules, dialogue, matching art/audio and saves retain their current behavior.

## Matched objectives and private checkpoint recovery

At Nia's checkpoint, you can now pay 90 creds for an unregistered clinic room and transport before a tenancy entry is made. The failed approach and Strain stay recorded. Funding is available to every build with enough money, cannot repeat or erase an earlier exposure, and buys no recording or public quotation permission. Existing zero-cash and clinic-marker choices remain.

`npm run balance:missions` compares 384 controlled witness/archive scenarios using legal setup and exact weighted enumeration of every mission die face. It separates primary success from recovery, actual kit affordability/cost, Strain, source exposure and key authentication. CI preserves and compares the aggregate report. The comparison supports different build strengths rather than a blanket Chrome nerf: equipped Nerve can move Nia without added Strain, while Face and equipped Ghost offer different archive costs and exposure. See [the detailed comparison and recovery findings](docs/MATCHED_MISSION_BALANCE.md) and [all matched results](qa/balance/matched-missions.md).

The current game has 197 scenes, 598 choices and 148 complete authored replay fixtures. Existing checkpoint/arrival art remains appropriate with an updated explicit decision; all dialogue words, actors, 302 voice bindings and 290 active deliveries stay matched. The broader 19,200-campaign audit passes against its original baseline. Save version 2, `saint-shard-3055-v1`, held dice, rules/caps and four finales remain compatible; the provisional overall grade stays 8.2.

## Whole-campaign economy and trained equipment advice

At the repair bench, **How the [kit] fits your training** explains how equipment relates to an actually earned skill. Some trained methods use decisions rather than checks, so matching equipment does not automatically improve them. The optional disclosure retains actual costs and source risks; opening it spends nothing, changes no save and buys no outcome or permission. Existing cash comparisons remain.

`npm run balance:campaigns` tests 43,200 goal-driven campaigns with natural dice from the opening through the finale, comparing care-first and kit-first spending on sale/no-sale routes. All sampled campaigns completed; 40,920 started and achieved their target goal, while 2,280 retained opening losses that left their source-dependent mission unavailable. No-sale kit-first runs finished with about 42–50 fewer creds without better goal completion under these stated policies. CI compares every build separately and keeps the original broad and matched audits. See [the policies, findings and limits](docs/CAMPAIGN_ECONOMY.md) and [all economy results](qa/balance/campaign-economy.md).

Prices, rewards, story outcomes, all 148 authored campaigns, canonical dialogue and every art/audio delivery remain unchanged. The repair-bench art decision explicitly covers the written guidance. Current scope remains 197 scenes / 598 choices, 302 voice bindings / 290 voices, save version 2 and `saint-shard-3055-v1`; the provisional grade stays 8.2.


## Witness and clinic commitments

The commitments disclosure now counts open jobs and offers **Find** controls for visible witness/account, coolant and owed-shift choices, plus an available recovery visit. Finding moves keyboard focus to the existing choice without taking it. Current costs and requirements come from the game’s actual choices. A deferred Nia account receives specific return guidance; keeping the runner’s work shift supplies no recording permission.

When both clinic work and an unfinished witness transfer are available at the canal, a written care-budget comparison explains the 90-creds private-room and 35-creds cold-storage fallbacks, the carrying alternative and actual combined affordability. These are optional approaches, with preparation and earned alternatives retained. The disclosure starts collapsed and supports keyboard, narrow layouts and text-only settings.

`npm run balance:overlap` checks 14,400 no-sale, natural-dice campaigns across 576 origin/build/spending/order/recovery/transport cells. All reached a finale; 13,248 started both jobs and 13,232 met both defined goals. Sixteen retained an exposed witness location after failed/underfunded volunteer recovery; 1,152 lacked the prepared source packet. Every owed shift was kept by the explicit tested policy. CI requires exact reviewed per-cell results alongside all three preceding audits. See [the method, findings and validation](docs/CLINIC_OVERLAP.md) and [aggregate results](qa/balance/clinic-overlap.md).

Existing canal/clinic art, actual speakers and exact voice deliveries accompany these unchanged story choices; the canal’s art decision records the review. No scene, quotation, media file, price, reward or save format changes. Preserve 197 scenes / 598 choices / 148 authored complete fixtures, 302 dialogue bindings / 290 active voices, four finales, held dice, 1d10/caps, version 2 and `saint-shard-3055-v1`. The provisional internal grade remains 8.2.


## Distribution, witness accounts and later replies

Saved clinic schedules now show their actual split and whether dispatch has accepted them. The commitments panel can find the existing distribution, work/fare and later reply choices. When a draft and Nia’s deferred account are both open, it names both return tasks. Week-closing warnings list the actual unfinished commitments; the distribution reply due later at Ward Nine stays in the campaign ledger without being described as missed work this week.

After Lumen shows two acknowledged cards, the current commitment and journal status record those two receipts while keeping other receipts and all attendance unknown. Earlier dispatch entries retain their original wording and time. Existing scenes, spoken words, actors and art/audio deliveries stay aligned; the canal and dispatch-desk art decisions document the written advice.

`npm run balance:overlap` now runs the preceding 14,400 coolant/witness campaigns plus 25,920 distribution/witness campaigns: dispatch first, witness first and a saved draft interleaved with Nia’s transfer. All new campaigns completed; 24,228 started both jobs and met their defined goals, while 1,692 lacked the prepared source packet. Eighty-eight requested carriers were unaffordable and used the existing carrying option. These are paired source-aware simulations, not independent participants or universal outcomes. Both comparisons remain required in CI with reviewed per-cell JSON evidence.

The preceding CI failure came from the Available here heading skipping a level. It now uses the correct heading level; focused checks apply the full accessibility rule set, including the existing archive-pause flow. All previous browser and production checks remain required. See [the phase method, findings and verification](docs/DISTRIBUTION_OVERLAP.md). Scope remains 197 scenes / 598 choices / 148 authored complete fixtures, 302 bindings / 290 voices, four finales, 1d10/caps, held dice, save version 2 and `saint-shard-3055-v1`. The provisional grade stays 8.2.


## Security review and maintenance

The security review patches Next.js to 15.5.28 and overrides its vulnerable PostCSS dependency with 8.5.30. `npm run security:audit` checks production and development dependencies; CI blocks moderate, high and critical advisories. The current locked tree reports zero known vulnerabilities, which is a point-in-time result.

Imported journal ids now use own-property lookups, preventing a crafted save from crashing the journal. Nested save metadata is copied through a schema allowlist, reserved flag keys are discarded, and codex, preferences and manual slots have size limits before JSON parsing. Existing saves, corruption checksums and held dice remain compatible. Save text stays ordinary escaped text; saves remain local, editable and unencrypted.

Production adds browser security headers, disables the unused image optimizer and restricts resource loading to local assets. Static Next.js hydration still requires inline scripts, so the CSP does not provide strict inline-script protection. CI actions use immutable revisions without persisted checkout credentials, and only GitHub Actions checks can satisfy the deployment gate. See [the detailed findings, verification and remaining limits](docs/SECURITY_REVIEW.md).


## Restored multiline speeches

The missing-voice review found two silent speeches: Quill explaining the Chapel’s memory business (`chapel`) and Lumen explaining the shard’s fate (`lumen_deal`). Their quotations span paragraphs, which the previous parser skipped. The parser now recognizes complete multiline quotations, and four new exact-word recordings use the established Quill/Lumen voices with matching transcripts, portraits and existing scene art.

Coverage is now 306 bindings, 301 quoted speeches and 294 active files across 121 voiced scenes. The preceding 290 active voice files and all earlier bindings remain unchanged. An independent character-scanning regression checks multiline speech without reusing the playback parser. Custom player-name addresses, the player’s question to Quill, narration and quoted written material/advertising remain deliberately silent.

The playback audit also correctly handles explicit replay after bounded-cache eviction. See [the findings, silent exceptions and validation](docs/VOICE_COVERAGE_REVIEW.md).

The restored Lumen scene speech also required correcting the check-dialogue browser tests: opening a dice check must stop the scene queue, and the separate check-result line must remain hidden and silent until the roll. The tests now distinguish those two voice controls while retaining mute, manual replay, saved-die and late-loading cancellation checks. Production still requires every browser project to pass.

Dialogue controls now show the selected or playing line and total, such as “Line 2 of 4,” in their accessible status. Paragraph mode counts only revealed dialogue; revealing another reply expands the total without restarting the current voice. Listen, Play all dialogue and Stop retain their existing behavior. Nine rare conditional replies have additional desktop/phone checks for exact text, actual-speaker portraits, playback, progress and unchanged saves. See [the progress and delivery review](docs/SPEECH_PROGRESS_REVIEW.md).

The delivery review remeasured all 294 active recordings and sampled every voice role. A clearer orderly take separates “Pass” from “still scans” using the same stock voice and exact words; its preceding recording is retained for comparison. The attendant’s original “This vein is hot” remains after the complete conversation resolved an isolated transcription ambiguity. Existing scene art and actual-speaker portraits remain matched.


## Visual polish

The [five-stage visual polish program](docs/VISUAL_POLISH_CYCLE.md) begins with a calmer reading layout: more paragraph space, bounded line length and quieter dialogue controls with the same visible playback actions and transcript. Goals, choices, saved settings and recorded speech remain intact.

Artwork now requests a size appropriate to its full-width or paired composition. Scene plates and character portraits retain their full frame, captions are easier to read, and an unavailable scene image keeps its space while showing the description.

Two new paintings vary the campaign’s compositions: the incinerator approach uses a wide view looking up toward the closed hatch; archive preparation uses a close view of the unused reader and closed folio. Both retain the established setting and show the situation before any result is earned. Matching dialogue and actors are unchanged.

All fifteen cast identities and their expressions have a documented consistency pass. Portraits, character cards and profiles share neutral frames; readable nameplates sit below the picture instead of covering it. The speaking cue uses a restrained amber border and stable caption space. Existing identities, expression choices and voice recordings are retained.

The Hour, The Week and The Wall now have distinct chapter entrances: an amber clock, cyan cards and quiet green memorial lines. Text and choices appear immediately; the brief decorative motion respects both system and saved reduced-motion settings. Chapter cards keep their actual run-specific retelling and require no new artwork or narration. A chapter name appears once when it is also the location name.


## Story-first visual improvements

The sidebar now keeps stat values and faction standings visible while origin details, rules explanations and recent actions expand on request. The finale layout also restores early story visibility with readable portrait captions. See [the staged record](docs/STORY_FIRST_VISUALS.md).

Selected conversations and mission doors now separate questions, preparations, approaches and departure with quiet headings. Choice order, keyboard numbers and visible consequences stay canonical; existing chapter-closing groups remain.

The Week and The Wall now have distinct dawn-street and rain-worn memorial backdrops. Both remain neutral across every entry route, with opaque reading panels and unchanged chapter text.

The hatch confrontation and failed canal collection now have their own paintings: the masked attendant with wrench and mic, and the closed case held on its shelf. Existing dialogue, voice recordings and outcome-specific prose remain aligned.

Four selected setting paintings now have a restrained rain, reflection or lamp settling effect lasting 3.8 seconds, then become still. Faces, prose and controls stay still; saved and system reduced motion disable the effects.

Chapter restore notices now show the chapter name once when it is also the location; precise place and finale labels remain.

All five story-first visual stages are implemented. Validation includes 633 source tests, 184 combined Chromium/phone checks, six overlapping chapter rechecks and four first-visit transfer samples under 2 MiB. Full exact-commit CI remains required; the staged report records scope and limits.

A Firefox follow-up gives desktop portrait captions more space at the largest text size, so a wrapped name, role and speaking cue fit without shrinking the text or moving during playback.

CI now checks all speaker captions on every browser before the full campaign suite, providing earlier feedback on clipped text. All existing full browser and release checks remain required.

## Equipment and artwork viewer

Painted conversations now use a compact actor strip when the painting already shows the scene's character. Gear illustrates all fourteen inventory items, including a separate damaged-shard appearance; equipment art loads only when Gear is opened. Scene paintings, guide art and owned equipment have a keyboard-accessible viewer with 100–300% zoom, scrolling, Escape and focus return. Opening it stops the current dialogue queue; closing it does not repeat speech.

Two earned paintings show Mara turning her chipped cup after you stay, and the separately held archive original on Edda's return after custody is agreed. Artwork remains optional and descriptive text remains available if images fail. The story, voices, rules and saves retain their existing meaning. See [the visual library cycle](docs/VISUAL_LIBRARY_CYCLE.md) for asset provenance and verification.

## Journal, map and campaign keepsakes

Journal and investigation entries now use distinct fact, claim and promise cards, with the original wording and permission limits intact. Shared symbols accompany stat, faction, resource and evidence labels.

Open **City map** from the character sheet to see known places and the current checkpoint on an illustrated schematic. **Find** locates an existing legal choice for review without committing it. Future places stay hidden. Save slots show their own checkpoint artwork and runner identity; opening **Three moments from your run** at a finale reveals an illustrated recap of recorded events. Artwork-none and missing-image fallbacks preserve every text flow. Map and artwork dialogs stop consumed speech from restarting. See [the player screens cycle](docs/PLAYER_SCREENS_CYCLE.md).

Ending skip links now target the focusable scene when there is no choice list, preserving a usable keyboard shortcut through the finale.

## Landmark and close-up refinements

The investigation notebook places its first record higher on phone screens, with compact filters and both source-permission summaries still visible. Known map places now have neutral landmark paintings; connection marks accompany only currently available Find actions.

Inspecting the Saint Shard (intact or damaged), Archive Probe or Shelter Token opens an individual 1536×1024 object painting. Gear keeps its lightweight atlas thumbnails until inspection. Two shared scene paintings pair Mara with Lumen at the chapel and Sera with Ives at the wall only when the authored scene places both there. Existing voices still follow the actual speaker and exact text.

Signed indicators beside creds, strain and faction values show the last committed choice’s actual change, including capped values. They remain until the next choice; loading a run or staging a die creates no receipt. See [the refinement report](docs/VISUAL_REFINEMENT_CYCLE.md) for scope, provenance and verification.

## Complete equipment art and quicker visual access

The phone City map uses compact landmark thumbnails and lists the current place first, followed by known destinations with available choices. Find still takes you to the existing decision without committing it. Desktop retains the larger landmark cards.

Scene paintings and artwork inspections show a tiny version of the same painting while the responsive detail decodes, within a fixed 3:2 frame. The brief fade respects saved and system reduced motion; missing images retain their descriptions and controls. Artwork-none requests neither paintings nor previews.

All fourteen inventory items now have individual close-up paintings, with a separate damaged-shard version. Gear keeps atlas thumbnails and loads the detailed painting only on inspection. Three new literal scene paintings show Sera and Ren before the shelter repair, Edda reviewing service documents, and Lumen wiping beneath Mara’s cup. Exact dialogue, voice casting and recorded outcomes remain unchanged. See [the complete art cycle](docs/COMPLETE_ART_CYCLE.md).

## Reading flow and clearer decisions

Regular scene paintings use a compact, uncropped art-and-caption layout on phones, with full detail still available in the existing viewer. Desktop, pivotal conversations, chapter cards and finales retain their established compositions. Restore messages keep their complete checkpoint text in a quieter status row.

Choice cards separate the action, stat/DC and odds, authored detail, open-promise warning, effects and possible check costs into readable rows. Wording, order, shortcuts and disabled reasons stay intact. Resolved checks place the recorded die beside the total, DC and Success/Miss label, with actual resource changes listed under **On Continue**. Rolls, critical adjustments, voice/text alignment and saves retain their existing behavior. See [the reading flow cycle](docs/READING_FLOW_CYCLE.md).

## Desktop composition and dialogue finish

Regular tablet and desktop paintings now sit beside their captions in a smaller, uncropped frame, bringing the opening prose higher while retaining the full artwork viewer. Chapter, pivotal, investigation and finale compositions keep their existing treatment. Check results give the speaker a wide identity strip so enlarged names stay readable.

Playback and closed transcript controls sit closer together, with complete live status and muted-state guidance underneath. Opening the transcript places its full text and line selector below the controls. Listen, Stop, replay, automatic voices and reading preferences retain their existing behavior. See [the composition finish report](docs/COMPOSITION_FINISH_CYCLE.md) for layout validation. Its initial art acceptance missed Edda’s faulty arm anatomy; the correction below supersedes that finding.

## Artwork anatomy correction

Edda’s service-counter painting now has two separate arms and two hands resting on the counter. The confusing chest-hand/book pose is removed; her identity, three review documents and unresolved scene meaning are preserved. The full image, phone image and loading preview use the corrected painting together.

A second visual pass covered all 146 primary/portrait/cast images and 165 smaller versions, including an additional arm-and-hand detail pass over 22 character paintings. One faulty composition was corrected; no further defect was confirmed by this AI review. The [art anatomy report](docs/ART_ANATOMY_REVIEW.md) records findings and limits. Previous image bytes and audit records remain available offline for comparison; story and voice recordings are unchanged.

## Districts, decisions and source documents

Regular scene headers group the speaker, place and goal more tightly on tablet and desktop. Artwork captions and viewer buttons sit together beside the framed painting. Eight known districts have restrained accent colors and distinct emblems, including Chapel arches, Helion’s tower and the canal’s waterways; the exact location remains written out.

Choices distinguish actions, checks and static departures with symbols and border shapes. A small legend explains mixed choices, while hover, keyboard focus, pressing and unavailable approaches have distinct treatments. Labels, numbering, requirements and committed outcomes stay the same.

Acquired evidence uses readable document layouts for memory, archive, witness and interpretation records. Each retains its original words and any existing timestamp/provenance; stamps state only whether it was recorded as a fact, claim or promise. Source authentication and quotation permission remain separate.

Portraits and paintings share a quieter matte/frame finish. Fourteen older portrait exports receive mild display exposure compensation, including their cast views; high contrast and the full artwork viewer retain original exposure. All 311 art deliveries and voice recordings remain unchanged, including Edda’s corrected pose. See the [five-stage visual direction report](docs/VISUAL_DIRECTION_CYCLE.md).

## Start-page identity

The start page now uses the approved silver Saint Shard wordmark, a broken halo and cyan memory shard. Desktop keeps the original city painting; tablet and phone receive a portrait composition with the same symbolic runner and city. Real menu controls retain Continue, New run, Field guide, Saves and Settings, plus the existing theme playback controls. Artwork-off mode fetches no logo or background; missing branding and high-contrast/forced-color modes retain a readable text title. See [the title branding record](docs/TITLE_BRANDING.md).

## Faceted dice presentation

Checks now show a shaded geometric die with a brief tumble during the existing roll, a clearly readable final face and restrained success/miss accents. Saved and system reduced-motion settings reveal the result immediately. A restored die stays still and keeps its recorded face; Continue still commits the outcome. The die geometry is drawn locally without an artwork download; the later shared-brand cycle adds short optional dice audio. See [the dice presentation record](docs/DICE_PRESENTATION.md).

## Ending layout CI correction

The district emblem and top spacing are more compact in finale headers, keeping the opening prose within the existing phone reading budget. All district labels, full portraits, goals, ending text and history remain available. This fixes the shared browser-check failure that blocked publication of the logo and dice updates; those updates remain on main. See [the CI correction record](docs/FINALE_CI_CORRECTION.md).

## Shared branding, dice sound and menu feedback

The game header, character-creation cards and loading screen now use the silver broken-halo/cyan-shard emblem, with a matching browser icon. The character origin still supplies a small outline accent. Loading stays static and readable.

Fresh rolls have one short decelerating rattle and a quiet landing; a successful ten and missed one have restrained distinct accents. Effects volume and Sound off remain respected. Reduced motion skips the rattle, restored dice stay silent, and leaving/muting cancels active or delayed check audio. The existing 700ms roll and Continue-only commitment remain.

Main-menu buttons and links have silver/cyan hover, keyboard-focus and pressed feedback with 44px targets. Both reduced-motion settings remove transitions and movement, and disabled music controls remain disabled. See [the shared branding and feedback record](docs/BRAND_MENU_FEEDBACK.md).

### Choice feedback and returning to your run

Committed choices now leave a collapsible receipt near the next choices, including actual bounded resource/faction changes, newly acquired journal entries and changed objectives—even when an action stays in the same scene. Loading a save or holding a die never creates a new receipt. The title page and occupied manual slots offer “Where you left off,” with the saved chapter/location, the last three chosen actions and any uncommitted held roll. Existing objective text stays visible.

Dialogue controls show which recorded line is playing; portraits reveal only the current loaded image with a short fade, and location headings receive a brief arrival accent. Saved and system reduced motion disable those effects. Existing canonical dialogue, actor art and recordings remain aligned. See [the five-stage feedback and campaign review](docs/PLAY_FEEDBACK_CYCLE.md) for validation scope and limits.

### Touch scrolling

Story navigation now settles immediately on touch devices so it does not compete with a swipe. Changing Motion in Settings keeps your reading position; closing a dialog returns keyboard focus without scrolling the page. Touch headers use a solid background instead of live blur. See [the scrolling correction](docs/TOUCH_SCROLLING.md) for reproduction and verification limits.

### Security follow-up (20 October 2026)

Save imports now clear earlier confirmations and ignore file reads superseded by another import, a slot operation or closing Saves. This prevents loading an older file or starting a run after the dialog has closed. Production CI checks must come from the same GitHub Actions workflow suite, and incomplete check responses block publication. The fresh dependency audit reports zero known vulnerabilities; production security headers remain present. See [the follow-up review and verification](docs/SECURITY_FOLLOWUP_2026_10_20.md).

### Campaign pacing and media continuity (20 October 2026)

Paused depot plans now return to the saved crossing instead of repeating Ren's introduction. The archive keeps its full first briefing, then uses shorter narration while catalog descriptions and query history remain available. Written task directions now follow archive work, Nia's transfer and the public hearing; permission requests appear only when her terms allow them. Existing artwork and exact spoken wording remain matched. See [the campaign and media review](docs/CAMPAIGN_MEDIA_REVIEW_2026_10_20.md).

### Build choices, character history, endings and mobile dialogs

The workshop compares example check odds before and after each kit, including cases where current modifiers already reach 100%; existing care-budget and training trade-offs remain visible. Later character visits offer an optional shared-history reminder, and endings show all recorded commitment statuses with their actual limits, including Edda's temporary work and continuing inquiry. The counter-order source status now distinguishes corroboration from an authenticated issuing key. Dialogs fit the available visual viewport when the keyboard reduces it, contain scroll at their edges, and leave pinch zoom available. These additions are written interface information; existing spoken lines and art stay matched. See [the four-area polish review](docs/FOUR_AREA_POLISH.md).

The follow-up review separates odds panels from earned training advice so both remain independently checked. Edda's history and ending record now preserve a declined payroll application instead of describing it as submitted and pending. See [the follow-up findings and verification](docs/POLISH_FOLLOWUP_REVIEW.md).

Origin setting portraits now use smaller WebP encodes of the same paintings at their original dimensions. The original JPEGs remain available for other scene presentations; no actor, voice or story changes accompany this download reduction. Delivery hashes and original-source checks are in `qa/media/origin-deliveries.json`.

Browser checks also cover scrolling after rotation and reopening Settings. Timeline validation now brings lazy source artwork into view before decoding and leaves audio to its dedicated checks. Physical iPhone confirmation remains outstanding; see [the reliability and download review](docs/RELIABILITY_DOWNLOAD_REVIEW.md).

Story layouts now lead with the narrative: compact character introductions and chapter artwork leave room to read, while detailed commitments, mission advice and equipment comparisons sit below the scene beside the decisions. The workshop uses comparison cards with its existing prices, training advice and care budgets. The field guide begins with a four-step quick start and links to every chapter before its opening painting. Existing art, spoken lines, reading preferences and game rules remain unchanged. See [the visual hierarchy improvements](docs/VISUAL_HIERARCHY.md).

The speaker-header CI correction keeps every compact portrait beside its name, role and Speaking cue at every screen size. Phone headers place the goal above this horizontal identity strip; finale portraits retain their separate layout. The original all-actor geometry, transcript, audio and save checks remain mandatory.

Workshop cards now offer a review shortcut to the actual purchase choice; using it spends nothing. Choice facts separate checks, details, changes and success/miss resource outcomes without changing their values. Recorded revelations use a quieter testimony frame, and their artwork remains alongside the reading on desktop. Closing reflections have clearer spacing while preserving whole-scene and paragraph pacing. Dialogue controls reserve 45px to keep Firefox's fractional layout above the existing 44px touch-target requirement. See [the release and decision-clarity cycle](docs/RELEASE_DECISION_CLARITY.md).

Playback buttons and the adjacent voice-transcript control share that 45px minimum, keeping their top edges aligned on phones while retaining full transcript access, playback status and Stop. The original touch-target and alignment checks remain required.

### Local generated-file cleanup

Stop local development/test servers, then run `npm run clean` to remove the ignored Next.js build/cache, static export, Playwright output and TypeScript incremental cache. Run `npm run build` before the next `npm start`. The command uses fixed repository-relative paths and accepts no path arguments; it preserves dependencies, saves, configuration, source media, licenses and QA evidence. The file review found no unreferenced component/library modules or public assets without a documented use. Superseded local heap captures were removed separately; tracked historical review records remain.

Save imports and stored JSON now have structural limits alongside their existing size limits. Excessive nesting and very large collections are rejected before parsing or snapshot serialization, with a clear import error that preserves the active run and manual slots. Quoted text, ordinary saves, legacy migration and held dice retain their existing behavior. See [the security review](docs/SECURITY_REVIEW.md).

### Player-led investigation: Phase 1

The [approved six-phase roadmap](docs/REVOLUTION_ROADMAP.md) develops connected cases, mission plans, reactive characters/districts, distinct builds, audiovisual direction and campaign payoff. In the investigation notebook, open **Build a Ward Nine case**, choose a claim, connect acquired sources as support or limits, and test the account. Drafts and the last four reviews travel with saves and exports. Unsupported support is challenged; correcting a case keeps its previous review. A tested archive lead can bypass the comparison quiz, and a bounded or corroborated case can enter the hearing with its actual limits. Testing grants no money, evidence, authentication or witness permission. Existing campaign paths, spoken lines and source artwork remain suitable and unchanged.

### Archive mission plans: Phase 2

After Edda's archive briefing, open **Archive mission plan** to choose corroboration/authentication, reader/carbon access and staffed recovery/withdrawal. Saving a plan spends nothing. At the reader, commit one setup: logged priority, receipt preflight, a service window, registered sleeve access, or matching preparation/training already earned. The original rolled methods and trained local reader retain their spoken results. Prepared carbon access applies only to this attempt and grants no skill; preparation accuracy does not stack with the same earned index/interval benefit.

Failure follows the chosen contingency. Staffed recovery retains the paid ledger, free pause and unresolved exit. Withdrawal closes the archive search as unresolved and returns to the canal, retaining failure costs and other acquired evidence. Abandoning restores ordinary methods without refunds. Setup, outcome and held rolls survive saves/exports; alternate catalog retrieval sets an unused plan aside safely. The guide teaches cases/plans, and case-source labels distinguish corroboration from key authentication. Existing neutral archive art, actors, transcripts and audio remain matched; no new speech or scene is introduced.

CI retains the four full browser suites, virtual audio, all Chromium production probes and exact-commit release gates. Each job installs Chromium plus its own required engine, avoiding unnecessary WebKit OS downloads in the Firefox job. The [roadmap](docs/REVOLUTION_ROADMAP.md) records implementation and publication status.

Planner option labels stay short enough to identify the selected objective, approach and contingency at narrow enlarged text; the full costs and consequences remain below.

Phase 1 was published on commit `f76924a` after full hosted CI and six live feature checks; see `qa/editorial/player-led-phase1-release.json`. Phase 2 follows that verified publication and must pass its own complete release gates.

### Reactive depot: Phase 3

After source custody and an acquired cancellation receipt, the canal offers a conversation with Edda about the depot. Share a receipt-only summary or its corroborating ledger, then choose a signed public register review or a private service query. Edda retains what she has seen when you revise a packet. Kerr learns only the summary/docket you disclose or an earlier observed handover; acknowledging a known broken promise can permit this introduction, while denial closes it. Existing recipient registration and contact limits remain recorded.

The public response closes the side service hatch and offers a registered sorting shift; the private response offers a short service-room rest. Two saved task actions create a choice between registration/completion, booking/rest, or delivering a separate correction. Reading, conversation, sound, settings and pausing consume none. A wage or recovery requires actual completion, and closing the week leaves unfinished work unfinished. The collapsible depot record shows what each character knows and the actual local response.

Ten new scenes have explicit art decisions, a new public-review depot painting, matching existing portraits/neutral settings, and twelve exact-word stock synthetic voice clips in a separate catalog. Earlier recordings, bindings and historical QA records are retained. The guide teaches the new flow. See [the Phase 3 implementation and validation record](docs/REACTIVE_DISTRICT_PHASE3.md).

### Distinct builds at the filing bench

Earned Chrome, Ghost, Face or Nerve training opens a different correction-review procedure after Edda's depot query. Matching equipment changes diagnostic exposure, courier signature, a voluntary work bargain or handling/recovery effort. Compare freely before committing saved depot actions; a review reference confirms intake, not source truth or witness permission. New bench art and nine matching Dispatcher recordings accompany the ten scenes. See [Phase 4 methods and validation](docs/DISTINCT_BUILDS_PHASE4.md). Prior Phase 3 publication and main-branch redeployment are recorded in [release evidence](qa/editorial/player-led-phase3-release.json).

### Cinematic conversations

Mara's confession, Kerr's threshold confrontation, Nia's witness decisions and the Ward Nine return now have sequence-specific dialogue spacing and quieter background beds. Optional **Scene / Detail** views inspect four new object paintings without advancing the story or interrupting speech. Existing cast, recordings, quotations, earned district art and all campaign outcomes remain aligned. [Phase 5 direction and evidence](docs/CINEMATIC_DIRECTION_PHASE5.md) explains the sixteen stages, technical A/B comparison and accessibility checks. [Phase 4 release evidence](qa/editorial/player-led-phase4-release.json) records its completed CI and public verification.

Phase 5's viewport regression matrix now gives each stage and width its own browser test. This preserves all 48 screen checks and their assertions while keeping the existing 30-second per-test limit and full four-browser release gate. The initial WebKit batch-timeout report is preserved in the phase documentation.


## Campaign integration, Phase 6 (27 October 2026)

The optional **Follow your campaign thread** review connects the hour, tested case, archive plan, deliberate disclosures, specialist method, witness terms and hearing at five explicit chapter checkpoints and the four original finales. It distinguishes saved case reviews from the current source test, objectives from achieved results, intake from accepted findings, and private recording from public quotation. Available follow-up links focus existing canonical choices for review; they never commit actions or spend resources. The thread closes between scenes and changes no save, source, voice or artwork. Failed paused recovery is described as closed once the week ends; deferred recording and unfinished work remain unfinished.

The independent Phase 5 baseline covers all 164 routes and 11,924 full state/choice/prose/actor/art visits. Four additional integrated zero-creds campaigns combine challenged/corrected cases, saved archive plans, real canonical retrieval/failure decisions and native export/import. Source, phone/desktop/enlarged text-only, keyboard, voice continuity and full hosted release checks remain required. New copy is written review UI, with no character quotations or new scene, so existing matching art and recordings remain intact. See [Phase 6 integration and evidence](docs/CAMPAIGN_INTEGRATION_PHASE6.md). Phase 5 publication evidence is separately preserved in qa/editorial/player-led-phase5-release.json. Retain all historical snapshots and all required exact-commit production gates.


## Whole-campaign reassessment and polish (27 October 2026)

Three current-build keyboard campaigns review a prepared specialist, a zero-credit paused search and an exposed-witness/failure-heavy run. The optional `--review` player-experience mode records rendered words, choice metadata, panels and checkpoint captures in local QA reports; it never enters production or uploads player data.

The depot ledger now stays at its twenty explicit depot/specialist contexts; checkpoint and ending campaign threads retain the full Edda/Kerr firsthand, disclosure and response breakdown without a second top-level ledger. Read-only archive plans share the checkpoint thread; actual archive planning and hearing/technician review remain available. Closed-week paused plans cannot advertise free recovery. Crowded ordinary choice lists have a visible focus-only review link after fully revealed prose; memory workspaces and the archive catalog keep their own controls. Costs, unavailable reasons, promises and canonical choice order remain visible and unchanged.

Three earned written ending reflections connect a waived wage, an exposed room or an unfinished archive search to the existing ending. Each requires both recorded flags and the relevant acquired journal entry, grants nothing, and leaves character dialogue, cast, matching art/audio and scene scripts intact. No new scene or quote needs a new recording or painting. Keep the four finales, 1d10/caps, held dice, version 2 and saint-shard-3055-v1.

The cinematic mix fixture now establishes real started music/ambience before releasing automatic dialogue. Preserve its original exact gain/order/word/pause assertions, 5-second numeric checks, 50-second overall deadline, all hosted workers and browser jobs. A separate cold-score test holds the score response while actual speech finishes and verifies choices/save stability and the later unducked bed. Do not change production audio timing or substitute synthetic waveforms. See docs/POST_ROADMAP_REVIEW.md and retain every source/media/balance/security/full-browser/exact-commit release gate.

The latest source-familiar internal reassessment is 8.5/10 (weighted 8.53), documented in docs/POST_ROADMAP_REVIEW.md. It supersedes the older dated 8.2 assessment as an editorial estimate, without treating test counts as enjoyment or independent AAA acceptance. Phase 6 publication observations are separately preserved in qa/editorial/player-led-phase6-release.json.

The reassessment's WebKit follow-up retains native audio-parameter references in the QA mix observer so garbage collection cannot erase a real bus measurement. Directed-performance checks explicitly request collection and retain the original mix assertions. Rotation checks wait for native scrolling to settle before reversing; both original directions, distances, viewport checks and save checks remain required. These changes affect test observation only, with no gameplay, audio playback or scroll behavior change. The failed full run remains recorded in the review; publication requires a fresh complete CI cohort.

Deferred-depot follow-up: the consolidated district record starts when a source was actually shared, even if no request was submitted. Preserve Edda's known receipt/ledger through deferral and the week boundary, while explicitly reporting “No depot request submitted”; infer no action allowance, introduction, inquiry result or source permission. The ordinary standalone ledger remains scoped to depot work. Actual deferred-route source, save and three-width accessibility checks cover this case.
