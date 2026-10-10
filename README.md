# Saint Shard

A solo story RPG in **Kite City, 3055**. You play it in the browser. The run stays on that browser. There is no account and no server save.

Quill hires you to lift Mara Voss's unedited hour from Glass Chapel before dawn. Helion is about to edit a crime out of her: she signed the Ward Nine coolant dump, and three hundred people died. Kerr is paid to stop you. Sister Lumen may help you leak the hour or break it. A week later the city asks for a buyer or a witness. At Ward Nine, Sera keeps the dead on a wall, and that is the last choice.

The current goal stays under the location while you play, and on the title screen when you continue. The place name sits beside the act: The Hour, The Week, or The Wall. Scene prose arrives one paragraph at a time, and you can show the rest. A choice that moves creds, strain, an item, or a faction says so before you take it. The sheet keeps a short list of what you already did.

- Lift Mara Voss's hour from Glass Chapel before dawn. Kerr is paid to stop you.
- You know what the hour is. Decide who gets it.
- The week wants a buyer or a witness.
- The wall has the names. Say them, or leave them to the rain.

The first time the shard is in your hand, Mara says the memo, then why she signed. People you have met are listed with their role. A seen ending on the title screen shows its coda. Unseen ending titles stay hidden; the catalog shows discovery counts by chapter. The phone, the tablet, and the desktop each keep that goal on the scene. Longer prose uses the full reading width below the portrait.

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

The six-phase status and remaining production milestones are tracked in [docs/ROADMAP.md](docs/ROADMAP.md). The candidate contains 171 scenes and 477 choices; retain all four original finales.

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

The start page has dedicated, spoiler-free title art: a lone runner and luminous memory shard against Kite City. Desktop places the live title and menu over its dark left side; phones show the art above the menu. Returning players get Continue first, with the existing new-run replacement confirmation. The first arrival retains its separate Kite City illustration. The memory bench, shelter briefing and freight briefing have dedicated framed scene art, with readable captions and descriptions. The Spire service counter, maintenance alcove and later payroll table also have accompanying illustrations, reused across related steps without claiming an outcome. Nia, Edda and Asa now have distinct generated portraits. Text-only mode omits these images and their requests, including on the title. Narrow screens use 600-pixel scene images; the goal stays above the illustration.

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

Five quiet synthesized cues distinguish placement, clearing, aligned timestamps, mismatches and corrections. Location stings play on arrival or Sound activation rather than every bench question. Four fixed Mara/Lumen quotations offer explicit Listen and Stop controls after their text is visible. These are stock synthetic voices generated offline with Kokoro, not actor performances. There is no speech service, model or player-text processing in the browser. Sound remains off by default; a separate voice volume migrates older preferences to 70%. Music and ambience duck while a line plays, then return to the chosen levels. Scene changes, dialogs, Sound off and zero voice volume stop the line and cancel late starts; failed audio leaves dialogue readable.

`scripts/generate-voices.py` is an optional offline authoring tool with pinned model/style-vector hashes. CI and builds use the checked-in PCM WAVs and never download voice weights. Source quotations, generation settings, delivery hashes, model attribution and license copies are in `qa/media/voice-lines.json`, `qa/media/voice-provenance.json` and `qa/media/voice-sources/`; the offline audition includes all new media. Save version 2, recorded dice, the four finales and `saint-shard-3055-v1` stay unchanged. Independent visual, listening, rights and physical-device acceptance remain pending.


### Kerr’s collection and character conduct

The Week’s dry canal offers Kerr’s optional personal brace collection. Accept private terms, agree to recipient registration or decline before promising. Plan one entry and one exit on a native, keyboard-accessible route board; drafts save without charges. Departure commits the fare and physical effort once. Chrome, Ghost and Nerve use their matching exits; Face can negotiate any plan. Matching field-kit descriptions include depot uses. Quill’s introduction adds +2 only to Face; a previously postponed tab requires one forty-creds late repayment without erasing refusal or strain.

A failed approach allows a twenty-creds registered courier or an unresolved held case, without another roll. Entry registration persists through an anonymous exit. A separate observed handover completes delivery, which supplies no treatment, evidence or witness permission. At the final arrival, Kerr responds to actual terms; acknowledgement of a breach keeps the trace and opens one personal question, while denial closes contact. Quill has a separate later response. The cast sheet derives conduct from recorded choices and retains Kerr’s earlier betrayal. All four finales append these outcomes. Twelve scenes have explicit art decisions, including a neutral canal dispatch illustration and existing conversation portraits; text-only mode omits the artwork.

See [the execution and following-cycle plan](docs/RELATIONSHIP_SLICE.md). Sixty-eight full-campaign replay fixtures cover all four original finales and ten new relationship routes. Keep version 2, `saint-shard-3055-v1`, original choice ids, pending dice, 1d10 and stat/strain caps unchanged. Independent production acceptance and the 9+ target remain open.


### Mara’s current reply and Lumen’s own terms

At the Week’s dry canal, runners who heard the memo can visit Mara’s voluntary present-day conversation. Her new statement is separate from the recorded hour: she wants her own name on a private reply to the Ward Nine records desk. She refuses public release this week; Lumen refuses clinic sponsorship regardless of faction standing. Revise a refused proposal to private terms or leave it pending; refusal stays recorded. One optional quiet question can go to Mara or Lumen. Dispatch by walking (one strain) or courier (fifteen creds), or defer with terms saved. Costs cannot repeat.

A later visit records the desk’s intake into an unanswered queue, not an inquiry finding. Lumen chooses private desk contact without automatic quotation, endorsement or partnership; earlier betrayal remains. All four finales open their aftermath with a distinct character beat and retain the factual recap. A neutral clinic conversation illustration accompanies the room’s introductions; other steps use fitting existing portraits. Two additional fixed synthetic quiet lines offer explicit Listen/Stop, using the existing optional voice mixer. They are generated offline; models and speech services never ship. The authoring generator supports `--only` to preserve existing clips.

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
