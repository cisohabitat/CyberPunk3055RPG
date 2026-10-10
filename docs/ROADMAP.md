# Saint Shard roadmap: 7.8 to a supported 9+

Updated 10 October 2026. Baseline: `091403c`, 171 scenes / 477 choices, 75 deterministic replay routes, 276 unit tests and 460 browser checks. Five complete internal UI campaigns reached the original finales without exceptions. The latest **internal weighted grade is 7.8/10**; the earlier documented baseline was 7.0. Neither is an independent player-study result. See [the current assessment](REVIEW.md).

This roadmap improves the existing browser narrative RPG. The [funded AAA production program](AAA_PRODUCTION_PLAN.md) remains the separate 24–30 month proposal for staffing, expanded campaign scope, commissions, localization and launch support. Completing these ten development cycles does not complete that larger program or guarantee a review score.

## Quality targets and priorities

Use the existing review weights. Targets guide review; they are not predicted increases after shipping a feature.

| Area | Weight | Current internal grade | Review target | Required improvement |
| --- | --- | --- | --- | --- |
| Narrative and consequence | 20% | 8.0 | 9.5 | Strong dramatic throughline, distinct voices, less repeated explanation, satisfying delayed responses |
| RPG depth and replay | 20% | 7.0 | 9.5 | Different build methods and outcomes, legible tradeoffs, varied interactive encounters |
| Visual presentation | 15% | 7.5 | 9.3 | Consistent cast, expressive staging, deliberate shot selection and complete asset review |
| Audio production | 10% | 6.8 | 9.2 | Directed principal dialogue, varied score states, location identity and independent mix review |
| Usability and accessibility | 15% | 8.0 | 9.3 | Clear decisions and journal, real-device play, manual assistive-technology acceptance |
| Engineering and release | 20% | 8.8 | 9.2 | Preserve reliability, improve release predictability, prove long-session and device behavior |

Current weighted total: **7.765**, rounded to 7.8. Target weighted total: **9.35**, with every area at least 9.0. Gameplay has the largest weighted shortfall (0.50 points), followed by narrative (0.30), visual presentation (0.27), audio (0.24), usability (0.195) and engineering (0.08). Prioritize experience improvements; more scenes and more automated checks do not themselves raise these grades.

## Delivery order and capacity

| Phase | Cycles | Lead responsibility | Dependency | Planning effort |
| --- | --- | --- | --- | --- |
| 1. Campaign editorial and pacing | 1 | Narrative editor / designer | Current campaign audit | 1–2 weeks |
| 2. Build identity and encounter variety | 2–4 | Systems designer / engineer / writer | Phase 1 stakes and encounter briefs | 4–6 weeks |
| 3. Campaign integration and consequence | 5 | Narrative lead / QA | Phase 2 playable prototypes | 1–2 weeks |
| 4. Visual and audio production | 6–7 | Art and audio leads / engineer | Stable scenes and approved style/rights briefs | 3–5 weeks |
| 5. Fresh-player, accessibility and device revisions | 8–9 | Research / QA / UX | Integrated candidate; recruitment can be prepared earlier | 3–5 weeks, including revision |
| 6. Independent review and release | 10 | Producer / release lead | Previous phase evidence and resolved severe findings | 1–2 weeks |

These are rough discipline-effort estimates for a small team with writing, engineering, art/audio and QA availability. Sequential effort is 13–22 weeks; supplier availability, research recruiting, rework and commissioning can extend calendar time. Estimate again after cycle 1 using actual throughput. No team, supplier booking, expenditure or research participant is assumed to have been secured. Prototype audiovisual direction early; final dialogue recording follows script stability. Do not expand campaign hours before the improved slice demonstrates value.

## Phase 1 — Campaign editorial and pacing

Cycle 1 implementation and internal verification are recorded in [NARRATIVE_PACING.md](NARRATIVE_PACING.md), with a 171-scene audit and paired route measurements. The independent editor exit remains pending. Complete and hand back this phase before beginning Phase 2; do not infer a new grade from shorter prose or passing checks.

**Problem:** strong consequences are often expressed through repeated limits, receipts and procedural explanation. The dramatic experience needs to remain clear without making every conversation sound like a rules summary.

**Cycle 1: edit and play the whole campaign.**

- Audit the opening, Glass Chapel, reconstruction, Week hub, optional missions and all four finales. Record scene purpose, word count, active decision, repetition, emotional beat and the later consequence it supports.
- Define one dramatic question per act: why this runner takes the job; what their use of the hour costs other people; what they can honestly say at the wall.
- Keep costs and immediate consequences visible before choices. Put detailed repeated evidence limits in optional journal/source disclosures when the scene remains accurate without repeating them.
- Give Quill, Kerr, Mara, Lumen, Nia, Edda and Sera distinct speaking habits and wants. Preserve Mara's recorded testimony versus current voluntary conversation.
- Remove redundant hub returns and duplicate recap text without cutting necessary warnings. Balance tense decisions with short human scenes; preserve voluntary skipping and existing direct routes.
- Establish a scene-length baseline before setting reductions. Aim to shorten the longest repetitive sequences by 15–25% only where clarity survives; this is an editorial experiment, not a universal word quota.

**Exit:** an independent editor can explain each act's conflict and each principal character's want. Internally play all four finales plus low-resource/failure/unfinished routes; opening goals remain visible at phone/desktop sizes. All permission, evidence and betrayal invariants survive. Record editorial and internal-play evidence separately from later fresh-player results.

## Phase 2 — Build identity and encounter variety

Cycles 2–4 implementation, verification and the Phase 3 handoff are recorded in [ENCOUNTER_VARIETY.md](ENCOUNTER_VARIETY.md). The following cycles remain ordered; fresh-player recognition and independent acceptance are pending.

**Problem:** choosing a different stat too often leads to essentially the same interaction. Replay should change the plan, risk and observed response.

**Cycle 2: specialization in existing missions.**

- Upgrade Glass Chapel entry, witness transfer and Kerr collection first, using existing Chrome, Face, Ghost and Nerve rules.
- Chrome changes what can be disabled or inspected; Face changes the offered bargain and what the runner must promise; Ghost changes access and visibility; Nerve changes physical handling and strain exposure.
- For each anchor mission, author at least two methods that differ in preparation, cost/risk and later response, beyond changing a modifier or choice label. Extend coverage to all four specializations across the anchors without forcing four methods into every scene.
- Integrate existing origin favors, earned skill and equipment into those methods. Keep benefits bounded; do not add a new progression system or make any build unable to finish.
- Explain why a method is unavailable and supply a viable low-resource fallback. Check successful, failed, unprepared and deferred versions. Never use a skill roll to grant another person's consent or historical truth.

**Cycle 3: a local deadline encounter.**

- Prototype a Chapel patrol/service-window sequence with a displayed, saved action allowance. Choices consume a local opportunity; no real-time timer or new global dice system.
- Let the runner gather route information, commit to an access method and choose an exit. Information and progress compete for the same local allowance.
- Every committed action has a concrete, previewed effect. Save/reload preserves remaining opportunities and any pending die; inspection cannot farm free attempts.
- Expiry changes the route, cost or visibility rather than creating a hard campaign dead end. Preserve a free recovery method.
- Supply native list/button controls, text-only play and keyboard/controller parity. New scenes get explicit art decisions and suitable accompanying art before release.

**Cycle 4: a negotiation and practical investigation.**

- Upgrade the Week distribution dispute into competing feasible offers: compare a small set of capacity/window constraints, then present one plan whose practical consequence differs from another viable plan.
- Give each counterpart a specific want and limit. Negotiation changes resource allocation or scheduling; repeated pressure cannot override a stated refusal.
- Require a useful player action between reading and dispatch: identify the conflict, choose a tradeoff, revise or keep an unresolved proposal. Avoid another sequence of equivalent four-stat checks.
- Distinguish a flawed plan, an unaccepted offer and a failed delivery. Preserve once-only costs and later observed replies.
- Keep memory reconstruction, routing, practical allocation and relationship conversation as distinct encounter patterns. Replace weak repetitive content rather than simply adding more optional missions.

**Exit:** matched internal playthroughs with different builds show different preparations, resource paths and later responses in the anchors. All origins retain viable completion; zero-fund failure chains recover. The new encounter interfaces survive interrupted play, imports, text expansion and no-art/no-audio use. Player recognition of build differences is tested in phase 5, not inferred from branch count.

## Phase 3 — Campaign integration and emotional consequence

Cycle 5 implementation and internal evidence are recorded in [CAMPAIGN_INTEGRATION.md](CAMPAIGN_INTEGRATION.md). Complete this phase before beginning Phase 4. Independent narrative/consequence acceptance remains pending.

**Cycle 5: integrate and replay.**

- Reconcile opening motivation, major methods, promises, refusals and failures through the Week and Wall. Prefer a short scene in which someone responds over another journal paragraph describing a response.
- Give each principal relationship one intelligible turning point and one delayed answer when the runner actually participates. Skipping an optional arc must not invent a conversation or resolution.
- Lead each finale with its own dramatic action and personal cost, then retain a concise optional factual aftermath. Silence, public witness, naming and corporate alignment remain distinct original finale identities.
- Check that a successful helpful act cannot erase prior betrayal, exposure or a refused proposal. Dispatch, receipt, inquiry decision and treatment remain separate.
- Play four full directed campaigns, at least two natural-dice campaigns with different origins, and targeted low-resource/unfinished combinations. Record optional-content fatigue and repeated transitions as internal observations.

**Exit:** no contradictory outcome or progress blocker in the expanded route matrix. Major decisions have reviewed later responses and alternate-build replay has visible differences. Freeze the scripts and shot list chosen for final media; revisions after recording need an explicit pickup list.

## Phase 4 — Visual and audio production

**Cycle 6: coherent character and scene staging.**

- Approve cast model sheets, district palette, lighting and composition rules. Start with Mara, Lumen, Kerr, Quill and Sera; keep existing suitable assets during the transition.
- Build small expression sets for emotionally important moments. Select expressions from actual conduct, not merely faction score; neutral art remains valid for unresolved states.
- Stage the opening offer, Chapel reveal, new encounter commitments, quiet conversations and four finales with deliberate close/medium/environment compositions. Establish a shot list instead of an image quota.
- Ensure every new scene has an enumerated `qa/media/scene-art.json` decision and ships matching art when needed. Reuse is acceptable when the image fits the actual scene and knowledge.
- Deliver responsive assets, source/master records, credits, audition and approved rights evidence. No readable private identities or unearned success in illustrative evidence objects.
- Preserve visible goals, high contrast, reduced motion, text-only omission, unavailable-art recovery and transfer budgets.

**Cycle 7: directed audio and scene identity.**

- Lock a selective principal-dialogue coverage list: opening offer, revelation, relationship turning points and finales. Existing six synthetic clips remain clearly labeled candidates until reviewed or replaced.
- Prepare character voice, pronunciation and direction briefs. Acquire required performer/asset permissions before paid commissions; no spending or outreach is performed by this roadmap.
- Add tension/quiet variants and district soundscapes driven by meaningful scene states, with restrained cues and fewer obvious short-loop repetitions during long reading.
- Review dialogue intelligibility, music masking, transitions, interruptions and fatigue on headphones, speakers and phones. Set mix targets with the audio reviewer using measured delivery samples.
- Retain explicit voice activation, complete readable dialogue, independent mixer buses and silent-play parity. Final assets never gate gameplay or alter saved outcomes.

**Exit:** independent art/audio reviewers assess an entire chapter and finale, including quieter scenes, not just a highlight reel. All shipped assets have reviewed distribution rights and attribution. Media budgets and real-device behavior pass; commissions and review remain external production work until completed.

## Phase 5 — Fresh-player, accessibility and device revisions

**Cycle 8: first observations and revisions.**

- Begin with the prepared [character sessions](CHARACTER_PLAYTEST.md): five opening/encounter players and five different full-campaign players as an exploratory starting point. Recruitment, consent and recordings require the research workflow; no contacts or participant sessions exist yet.
- Use natural dice and let players skip optional content. Observe where they stop, misunderstand a choice, expect their build to act differently or become tired of reading.
- Test job ownership/acceptance, immediate goals, evidence versus claims, named private response versus public permission, and delayed outcomes. Ask which choices felt consequential and why.
- Fix repeated confusion, weak encounter interaction and inaccessible actions before expanding content. Document observed behavior separately from quotes and reviewer interpretation.

**Cycle 9: fresh repeat and supported-device acceptance.**

- Repeat the revised slice and full campaign with fresh participants. For the production slice gate, use the existing broader proposal of two fresh cohorts of approximately 12–20 participants, a revision between them and declared recruitment limits. The exploratory ten-player starting study does not automatically satisfy that gate.
- Proposed slice criteria: at least 80% explain the goal and testimony/corroboration distinction, at least 75% identify a personal consequence, median agency at least 4/5 and no recurring severe blocker. Add a prompted post-play question on how the selected build changed available methods; do not count a prompted answer as spontaneous recognition.
- Report actual denominators, completions, abandonments, device/access setup and prompted versus unprompted answers. Small cohorts inform revisions; they cannot establish population review grades or device percentiles.
- Complete NVDA/Firefox, VoiceOver/Safari, keyboard-only and physical-controller sessions with supported participants/reviewers. Check large text, high contrast, reduced motion, muted audio and text-only delivery throughout the campaign.
- Record model/OS/browser for a midrange Android, older supported iPhone and laptop/desktop. Measure cold loading, choice response, layout stability, interruptions and long-session memory rather than extrapolating from automation-host samples.
- Proposed approved-profile budgets: initial compressed transfer at most 2 MiB excluding optional audio, LCP p75 at most 2.5 seconds, INP p75 at most 200 ms and CLS at most 0.1. Percentile claims require an adequate measurement design; a few manual sessions only establish those samples. Investigate any sustained leak during a two-hour replay.

**Exit:** revise and retest every recurring severe finding; no mandatory flow remains inaccessible on the declared support matrix. Fresh-player results support agency/comprehension claims. Device, access and rights evidence is attached to the actual candidate rather than marked complete by automated checks.

## Phase 6 — Independent review and release

**Cycle 10: assess the complete candidate and release readiness.**

- Obtain separate narrative, systems, art/audio and accessibility reviews using the six weighted categories above. Review representative core, optional, weak-build, failure and finale paths; do not score only the best slice.
- Publish assessed category scores, rationale, build revision and limitations. A supported 9+ claim requires weighted overall above 9.0 and no category below 9.0; the stretch target remains 9.35. If it falls short, return to the weakest category and revise.
- Close `qa/production/acceptance.json` gates only when their exact evidence exists. Discovery/funding, writer-authored content, rights, native-language claims and support staffing are not covered merely by good player ratings.
- Keep exact-revision Test/Build, full browser regression, asset inventory/budgets and full replay matrix green. Rehearse rollback and old-save recovery on a release candidate.
- Address the current CI/deploy timing mismatch: 460 browser checks take about ten minutes before other jobs finish, longer than the existing ten-minute production wait. Measure options to shard the suite or use a reviewed, bounded longer wait/CI-triggered promotion. Retain fail-closed exact-SHA requirements; until improved, retry the same revision after CI passes, as in the current release.
- Verify the public alias, actual media hashes, resumed saves, accessible mandatory flow and all four finales. Record known lower-severity issues, owners, supported platforms and support/incident arrangements.

**Exit:** zero known severe progress-loss, incorrect-outcome or mandatory-access blockers; required manual, rights and production gates are supported by evidence. A high internal grade alone is insufficient for commercial AAA release acceptance.

## Rules for every implementation cycle

1. Specify the player problem, changed scenes/systems, cost and consequence invariants, art decision, fallback and acceptance check before coding.
2. Implement a complete reviewable increment. Keep existing compatible routes and test only the behaviors the increment puts at risk, then run required release checks.
3. Play from character creation through a finale with the changed encounter, using phone and desktop. Include failure/unfinished routes and periodic natural-dice play; label internal and directed evidence accurately.
4. Update README/AGENTS together whenever play, look, sound, saves or deploy changes. Keep 1d10, caps, version 2, `saint-shard-3055-v1`, pending dice and all four finale identities.
5. Push each completed implementation cycle to main under the standing instruction, await exact-revision CI, deploy through the production gate and verify live. Record the revision and findings. This roadmap revision changes documentation only.
6. Reassess against the same rubric after reviewable experience changes. Never add fixed score increments for content, test count, generated assets or phase completion.

## Next five implementation cycles

Execute cycles **1–5** first: campaign editorial pass; build differentiation in existing anchors; local deadline encounter; practical negotiation encounter; complete-campaign consequence integration. Matching art ships with each new scene as needed. Use cycles **6–10** to finish presentation, revise from independent observations and prove release readiness. All cycles above are planned, not completed by creating this document.

## Historical foundation record

The sections below retain earlier implementation milestones. Their scene counts and grades describe those increments; the current baseline and forward delivery order are above.

| Phase | Implemented in this candidate | Evidence | Remaining production milestone |
| --- | --- | --- | --- |
| 1. Reliability and accessibility | Durable die outcomes, validated imports, backup recovery, three save slots, native modal isolation, persistent reading/contrast/motion/audio settings | Save/rule tests; interrupted-roll and failed-storage browser flows; automated accessibility scans | Screen-reader review and real-device input testing |
| 2. Memory gameplay vertical slice | Three inspectable evidence fragments, explicit claims/facts, complete archive/redaction/witness dispositions, visible costs and promises | Disposition tests and uninterrupted browser campaign | Observe first-time players explaining the evidence and its costs |
| 3. Build depth | One earned skill, three origin contracts, practical tools, consumable recovery routes, faction favors | Origin/perk/gate tests and seeded builds | Tune opportunities and costs from observed choices and completion rates |
| 4. Campaign consequences | Witness relocation, checkpoint recovery, counter-order authentication, failure routes, journal promise status, personalized aftermath | 64 scenes, 149 choices; graph validation; 900 completed seeded campaigns; all four original finales | Narrative editor pass and fresh-player revisions; expand authored content only where it earns its length |
| 5. Audiovisual direction | Full-width phone prose, evidence timeline, explicit image dimensions, distinct extended chapel/ward scores, crossfades and independent mixer channels | Phone inspection, browser regression, score seam/duration checks | Commission coherent art and recorded performances; confirm rights and measure performance on target devices |
| 6. QA and release | Browser matrix in CI, production blocked on failed checks, retained failure traces, local diagnostics export, story report, release/rollback guidance | Unit tests, TypeScript, production build, browser flows | External playtest rounds, manual accessibility evidence, licensing review, device budgets and localization review before claiming support |

All six foundation phases have implementation work in this candidate. The human production milestones remain open; the game is not certified as AAA. Treat each remaining milestone as an evidence gate, not a marketing claim.

The [production slice expansion](PRODUCTION_SLICE.md) now adds interpretation and packet labeling, public source challenges, prepared witness transfers, four specialist methods, deferred testimony, privacy repair, and consequence visits. The graph at that increment contains 99 scenes and 258 choices. Four played campaigns cover 192 choice activations and 53 distinct scenes. This advances the future program's gameplay slice; it does not complete its full production, external acceptance, or commercial launch gates.

## Order of the next production cycle

1. Complete rights inventory and recruit consented playtest participants with separate authorization.
2. Run two rounds with fresh players. Observe goals, evidence comprehension, reading fatigue, consequential choices, and origin differentiation.
3. Address severe comprehension, progress loss, or accessibility findings before adding content.
4. Lock the narrative and visual model sheets. Commission assets and performances against the locked scope.
5. Establish supported devices and measured budgets for cold loading, input response, layout shifts, and audio behavior.
6. Run the full automated and manual release matrix against a candidate, record evidence, and promote only when its required gates pass.

See [production direction](PRODUCTION.md), [release gates](RELEASE.md), and [credits and rights inventory](../CREDITS.md).

The archive increment staged archive access, preparation, source comparison, retrieval, custody, and Edda’s employment consequence. Neighborhood visits can reconverge at the hub after custody. This supplies another playable mission pattern for phases 2–4 of the production program; staffing, campaign scale, final assets, external acceptance, and launch remain open. See the [slice verification record](PRODUCTION_SLICE.md).

The public-hearing increment adds source-scoped testimony, separate quotation permission, a playable evidence challenge, corrections and withdrawal, and a source brief. Three deterministic JSON campaign routes replay explicit die faces through saved-check checkpoints. These advance campaign consequences and QA reproducibility within the future systems program; they are not a complete writer authoring interface or external slice acceptance. See the [current slice record](PRODUCTION_SLICE.md).

The equipment/recovery increment adds one purchased field kit with targeted check benefits, budget comparisons against witness care, a bounded once-per-week recovery visit, a quiet consequence-preserving follow-up, and resource assertions in seven deterministic QA routes. This develops specialization and opportunity costs within the systems phase. External balancing and production acceptance remain open; see [the slice record](PRODUCTION_SLICE.md).

The neighborhood emergency increment adds a practical service task, four skill approaches, earned Kerr assistance, failure triage, maintenance-record custody, and delayed character consequences. The graph at that increment is 95 scenes / 244 choices. This advances the systems and campaign-consequence phases; narrative production, commissioned assets, external balancing, and independent acceptance remain open. See [the slice record](PRODUCTION_SLICE.md).

The employment increment extends Edda’s consequence into a consented private payroll request, an earned Spire-favor method, two skill checks, paid representation, a pending fallback, and an outcome reflected in campaign commitments and the ending. The graph at that increment is 98 scenes / 254 choices, with fifteen deterministic full-campaign fixtures. Temporary paid work does not close the source inquiry; appointments do not count as restored wages. This advances character continuity and failure outcomes within the campaign phase. Full-scale production and independent acceptance remain open.

An earlier pass advances all six workstreams with a reproducible source/coverage baseline, maintenance follow-through, structured JSON authoring, Week music, text-only delivery, static budgets and load probes, and CI production artifacts with explicit human acceptance status. The graph at that increment is 99 scenes / 258 choices; nineteen replay fixtures cover all three origins. See [the six-phase execution record](PHASE_EXECUTION.md). All six independent acceptance gates remain pending; implemented foundations do not complete the funded AAA program.

The five subsequent development cycles are recorded in [DEVELOPMENT_CYCLES.md](DEVELOPMENT_CYCLES.md). They add source cross-examination, a second JSON-authored distribution encounter, playable delayed replies, Nia’s contact boundaries and an acquired-source dossier. The subsequent playable opening and staged Dustline freight, Gutterwire shelter and Spire key-retirement encounters bring that graph to 142 scenes / 391 choices with 55 full replay fixtures. All three optional origin favors now have preparation, recovery and delayed follow-up. The next slice gate is blind opening and full-campaign playtesting, followed by evidence-led pacing and presentation edits. The revised reviewed-quality target is 9.35 with no category below 9.0; the provisional grade at that stage stayed 7.0; independent acceptance remains pending.

The media audition adds seven generated images, dedicated portraits for Nia/Edda/Asa, framed encounter illustrations and four original stereo chapter scores. Source records and a preview are in `qa/media/`. This improves the supplied demo’s presentation; independent art, listening and rights acceptance remain pending, with no automatic quality regrade.

The opening pacing cycle brings the current graph to 143 scenes / 393 choices. It moves the complete offer into Quill’s first paragraph, shortens repeated briefing, adds an optional ownership question and makes goals follow acceptance. Internal phone/desktop play informs these edits; the next independent slice gate remains blind opening and complete-campaign sessions.

The memory gameplay cycle adds a persistent three-slot timeline, claim/source verdicts, corrections and disputed-account consequences across the district, records visit and finale. The graph is 148 scenes / 414 choices with 58 full replay fixtures. This advances the investigation and consequence workstreams. Next implementation priorities are relationship decisions that remember actual conduct, encounter variation beyond source inspection, and character presentation tied to earned outcomes. Blind-player evidence, commissioned performances/art, target-device testing and all six human production gates remain required for the above-9.0 target.


The character and pacing cycle adds Mara’s current private reply, Lumen’s independent clinic/contact terms, distinct refused proposals, quiet questions, saved dispatch and delayed unanswered receipt. It also adds suitable room art, two fixed synthetic lines and character beats before all four factual finale recaps. The current candidate is 171 scenes / 477 choices with 75 full replay routes. This advances relationship agency, encounter variation and pacing, with internal full-campaign play and a neutral independent-session protocol. Following work remains full-campaign narrative editing, evidence-led build balancing, commissioned presentation and two fresh-player cohorts before a supported above-9.0 review. See [the execution phases and following milestones](CHARACTER_ARCS.md).
