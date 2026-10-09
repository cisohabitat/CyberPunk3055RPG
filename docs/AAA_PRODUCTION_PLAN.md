# Saint Shard AAA Level Production Plan

Saint Shard should grow into a premium narrative RPG with exceptional writing, playable memory investigations, distinctive character builds, coherent visual direction, directed sound, and dependable accessibility. The current game is a useful foundation, graded provisionally at **7.0/10**. Reaching the proposed standard requires a sustained production program, a funded team, and repeated independent player testing.

This plan covers six production phases from discovery through launch and continuing support. It supersedes the short-term scope of [ROADMAP.md](ROADMAP.md) for future production; that file remains the record of foundations already implemented. Proposed dates, quantities, thresholds, and budgets below are planning assumptions to validate in preproduction. They do not describe funded commitments or completed work.

Current implementation progress is recorded in the [production slice expansion](PRODUCTION_SLICE.md). Its additional gameplay advances this program without marking the future production-quality, research, asset, or launch gates complete.

## Played baseline and production gaps

On 9 October 2026, three campaigns were played through the local production build at code revision `df1b4bc`. Each started through character creation and continued through all three acts to a finale. Browser-driven play covered 115 choice activations and 41 distinct scenes. Dice were controlled: eight on successful checks and one on the two selected failure checks. These runs establish route behavior and support design observations; they do not measure ordinary completion time, spontaneous player decisions, or satisfaction.

| Campaign | Build and viewport | Played decisions and outcome | Production implication |
| --- | --- | --- | --- |
| Protected witness | Spire, optic, Face investment; 1440 by 900 | Inspect all three fragments; witness chain; Ghost training; revoke Edda's key; pay for Nia's room; attach her account; stand with the wards; read the names. 38 choices, five checks, no browser page errors. | Testimony and safety are correctly separated. Paying 30 from 390 credits makes the safe transfer inexpensive in this route; evaluate whether money creates intended pressure. |
| Exposed witness | Gutterwire, debt, Nerve investment; 390 by 844 | Redact locations; Nerve training; repair the shelter pump; deliberately choose the risky hatch despite having the shelter token; fail transport; accept registered care; record the breach; sell the week; leave the wall. 39 choices, six checks, no page errors. | Failure continues the campaign and accurately preserves both corroboration and privacy loss. Recovery needs more player activity and later character response; the commitment summary still says 0/1 complete rather than naming the compromised result at a glance. |
| Unverified archive | Dustline, on-file, Ghost investment; 1440 by 900 | Preserve the archive; Chrome training; complete the freight favor; refuse Ives; fail authentication; retain the gap despite being able to buy the ledger; stand with the wards; leave the wall. 38 choices, six checks, no page errors. | The finale correctly describes an unverified issuing key. A resource-rich player can avoid the gap cheaply, so challenge balance requires natural-dice play and deliberate resource scarcity tests. |

All three used the choir-door entry and the copy-and-sale route before their evidence branches diverged. They reached two of the four final endings. Other entrances, early failures, and the remaining finales need additional play review. Audio files and browser behavior have existing technical checks; these sessions did not provide a human listening assessment or physical-device measurements.

The code baseline contains 64 scenes, 149 choices, three origins, four stats, one earned skill, origin favors, witness relocation, archive verification, and personalized aftermath. Existing verification records 70 unit tests, 84 browser cases across the CI matrix, and 900 seeded completion simulations. Those are reliability evidence, not proof of entertainment or commercial readiness.

### Strengths to preserve

- A clear dramatic premise: memory becomes evidence, property, and a threat to a living person.
- Specific character motives, strong atmosphere, and a finale concerned with people rather than only rewards.
- Visible check odds and costs, portable saves, recorded pending rolls, and continued play when storage fails.
- Authored recovery from failed checks, source-quality distinctions, and privacy-aware testimony.
- Reading controls and a usable phone layout that can support a broader audience.

### Gaps that determine the roadmap

1. **Investigation is mostly inspection.** Opening three fragments enables a disposition, but players do little to construct or challenge an explanation. Memory should become the signature activity.
2. **Encounters resolve too quickly.** Many favors and missions are one check followed by a result. Preparation, changing circumstances, resource decisions, and interpersonal consequences need playable space.
3. **Progression changes odds more than tactics.** One +1 skill and origin tools are good beginnings. Specialists need exclusive methods and meaningful tradeoffs across a campaign.
4. **Consequences are often described after the event.** The state is accurate, but changed locations, NPC behavior, opportunities, and subsequent missions should let players experience that state.
5. **The presentation needs a unified production pipeline.** Portraits and environmental plates carry atmosphere, but bespoke staging, expressions, location variation, authored audio, and confirmed rights are missing.
6. **Quality assessment is largely internal.** Comprehension, emotional impact, reading fatigue, build preference, actual device performance, and assistive-technology use require outside participants and named hardware.

## Target experience and scope

The recommended product remains a solo, reading-led, illustrated cyberpunk RPG. Its quality ambition is AAA-level craft within that format. A funded open-world 3D action RPG would require a separate product, engine, staffing, budget, and schedule decision.

**Player promise:** investigate stolen memories, choose whose account becomes public, build a method of operating, and live through the consequences with the people affected.

The recurring loop should be: accept a problem, investigate its sources, prepare a method, act under pressure, negotiate the consequences, and return to a changed community. Conversation, evidence interpretation, and mission decisions carry play; audiovisual staging gives each activity presence.

| Area | Proposed launch scope | Scope control |
| --- | --- | --- |
| Campaign | 10–15 hours for a first campaign, with materially different replay routes | Measure at normal reading speed in the slice; reduce length before sacrificing encounter quality. |
| Structure | Five major chapters retaining The Hour, The Week, and The Wall as the central arc | The current story can form an opening arc; later chapters must expand conflict and relationships rather than repeat the same sale. |
| Locations | Five or six districts with several revisitable interiors and authored state changes | Use an illustrated district hub and staged scenes; count playable uses, not map size. |
| Missions | Approximately 12 substantial main missions and 12–18 optional investigations or character missions | A mission needs a distinct objective, method, complication, and consequence; no filler requirement. |
| Cast | Six to eight major characters, supported by a smaller recurring local cast | Invest in relationship arcs, expressions, and directed performances before increasing cast size. |
| Builds | Three origins, four specializations, roughly six to eight meaningful development decisions per run | Preserve the existing 1d10 system, stat cap, and strain rules; introduce methods and costs through the current rules. |
| Endings | Retain four recognizable finale identities, with substantial state-sensitive scenes and epilogues | Avoid separate fully authored endings for every flag combination. |
| Writing | Initial total-script envelope of 150,000–220,000 words across routes, journal, and interface | The played path is a subset. Calibrate words per minute and production throughput before locking this envelope. |
| Audio | Original adaptive score, location soundscapes, directed performances for principal dialogue | Price selective versus full dialogue voice coverage after the slice; keep narration readable and all information available without sound. |
| Platforms | Browser first, with desktop packaging evaluated after slice validation; responsive mobile web | Support claims require hardware evidence. Console and native mobile ports require separate business and certification gates. |
| Languages | English production master; localization-ready architecture from preproduction | Select launch languages using demand and supplier costs before script lock. |

The scope is a starting envelope. It must fit the measured writer, artist, engineering, voice, localization, and QA capacity. A strong eight-hour campaign is preferable to a fifteen-hour campaign that repeats weak encounters.

## Schedule and dependencies

Plan for **24–30 months to launch**, followed by at least twelve months of support. The example below uses a thirty-month envelope. Phases overlap after their prerequisites pass; their durations must not be added as if every workstream were sequential.

| Phase | Example window | Accountable lead | Deliverable and funding gate |
| --- | --- | --- | --- |
| 1. Discovery and preproduction | Months 1–3 | Game director and producer | Validated audience, product brief, design prototypes, rights inventory, costed backlog |
| 2. Production quality vertical slice | Months 4–7 | Director, narrative lead, art director | A 60–90 minute playable slice proving the target experience and production cost |
| 3. Systems and authoring readiness | Months 6–10 | Technical and design leads | Scalable authoring, progression, consequence tracking, accessibility, and save compatibility |
| 4. Campaign and asset production | Months 9–21 | Producer and discipline leads | Entire campaign playable with finished narrative and staged audiovisual delivery |
| 5. Alpha, beta, and release candidate | Months 20–27 | QA lead and producer | Proven end-to-end quality on supported platforms; content, rights, and accessibility gates closed |
| 6. Launch and continuing production | Months 28–30, then twelve months | Release lead and producer | Controlled launch, support capacity, patches, measured expansion decisions |

Critical dependencies: scope and style approval precede bulk asset orders; the slice precedes campaign scaling; authoring and state validation precede complex branching; script and pronunciation lock precede final voice recording; source text stabilizes before final localization; supported-platform decisions precede device certification; complete rights and release evidence precede commercial promotion.

## Phase 1 Discovery and preproduction

**Purpose:** establish what this game can excel at, who will buy it, and what the team can afford to produce.

### Work packages

- Define target players, age/content positioning, session length, distribution approach, price hypothesis, and the emotional promise. Compare several narrative RPGs and illustrated adventures on encounter design, staging, accessibility, and replay value using an agreed rubric.
- Play the current campaign systematically: all three entrances, every origin, high- and low-resource builds, debt pressure, successes, failures, unfinished promises, and all four finales. Maintain a route matrix with observed decisions and consequences.
- Run two fresh-player discovery rounds of roughly 8–12 participants each. Observe onboarding and evidence interpretation before asking questions. Include both genre enthusiasts and less experienced players. Treat this as qualitative research, not a population estimate.
- Prototype three memory activities: reconstructing an event sequence; comparing contradictory sources; preparing a public evidence packet with informed redaction. Give every activity an accessible list-based alternative.
- Prototype a multi-stage negotiation and a mission with preparation, intrusion, and escape. Test whether additional mechanics deepen the fiction or interrupt reading.
- Create a setting bible, character motives and voice guide, evidence truth ledger, campaign outline, and branching policy. Record which facts are objectively true, claimed, independently corroborated, or unknown.
- Audit existing art, audio, fonts, dependencies, and title/branding. Obtain documented commercial rights or plan replacements. Prepare contributor agreements and a rights ledger for new work.
- Establish art model sheets, palette, composition rules, typography, interface hierarchy, portrait expressions, and a small location concept set. Record accessibility constraints in the art brief.
- Cost the scope by mission complexity, word count, asset type, voice line, localization volume, and test-path growth. Assign owners, dependencies, estimates, and acceptance criteria to the backlog.

**Exit gate:** the team agrees on the player promise, supported product format, provisional scope and budget; two prototype investigations and one multi-stage encounter show value in player sessions; severe onboarding confusion has a tested remedy; asset rights have a credible resolution plan. If the loop is weak, revise it before hiring for mass production.

## Phase 2 Production quality vertical slice

**Purpose:** prove both the finished experience and the team's ability to make it repeatedly.

Build a polished 60–90 minute chapter around Glass Chapel and its immediate consequences. It must contain a conversation with competing aims, three viable infiltration methods, one substantial memory reconstruction, one witness/archive mission, a failure recovery route, a quiet character beat, and a delayed reaction on returning to a location. At least two different builds must produce meaningfully different approaches.

### Work packages

- Replace the three-fragment checklist with an investigation that asks the player to interpret sources. The interface allows revisiting information, comparing testimony, flagging uncertainty, and seeing what a proposed public packet reveals about a witness.
- Stage missions in several decisions. For the witness transfer, let players assess the route, choose transport and cover, respond to checkpoint behavior, negotiate consent, and handle the immediate aftermath. Use costs and information, not a row of unrelated dice rolls.
- Give an unsuccessful outcome its own playable complication. Preserve forward motion while changing access, obligations, relationships, or resources. Avoid simply repeating the successful scene with an added strain point.
- Demonstrate specialization methods: a Chrome investigator authenticates a source; a Face specialist obtains voluntary testimony; a Ghost operator secures an extraction route; a Nerve specialist manages a dangerous physical interruption. Every method needs a downside or opportunity cost.
- Produce representative final art: several character expression sets, two finished locations with state variants, evidence objects, and a small set of staged compositions. Test phone readability and high contrast with those final assets.
- Commission a representative music set and directed dialogue sequence. Test layering, transitions, speech intelligibility, subtitle behavior, volume controls, silent play, and interruption/resume behavior with human listeners.
- Integrate final-quality saves, controller flow, keyboard access, text scaling, reduced motion, screen-reader semantics, and diagnostics. Accessibility cannot be deferred to a final skin pass.
- Measure actual production cost: finished words and scenes per week, art revisions per asset, implementation and QA time per mission, voice retakes, and slice memory/load budgets.

**Play gate:** two fresh cohorts of approximately 12–20 participants, separated by a revision. Proposed criteria: at least 80% explain the immediate goal and distinguish testimony from independent corroboration without prompting; at least 75% identify one consequence they personally caused; median agency rating at least 4/5; no recurring blocker. Collect reasons behind ratings. Small samples justify design decisions, not market predictions.

**Production gate:** art, audio, narrative, UX, and engineering leads independently accept the slice against reference work; a second encounter can be produced with the same pipeline at an affordable cost. If the slice needs constant bespoke engineering or exceeds the cost envelope, simplify the system or scope before scaling.

## Phase 3 Systems and authoring readiness

**Purpose:** make the slice's quality repeatable across a branching campaign.

### RPG systems

- Expand development from one numerical bonus into a compact specialization structure. A player chooses techniques, contacts, or equipment that unlock different methods. Make expensive equipment compete with witness care, favors, and preparation resources.
- Tune cumulative bonuses so strong builds earn certainty in some situations without trivializing every important check. Measure success chances and available approaches across weak and strong builds using the existing dice rules.
- Track what a character knows, believes, and remembers separately from a global reputation number. Relationships should alter terms, willingness, dialogue, and opportunities. Trust recovery needs authored actions.
- Give strain narrative and practical meaning through contextual complications and recovery choices. Ensure a struggling build has a credible route forward.
- Introduce explicit mission conditions such as suspicion, access, evidence custody, and consent only when each supports a decision. Prefer a few understandable states to many decorative meters.
- Model consequence chains at three horizons: immediate response, next mission or visit, and later chapter/finale. Major decisions require at least one playable delayed consequence.
- Make journals and objectives explain compromised, fulfilled, abandoned, and unknown states directly. A corroborated account with exposed location must never become a generic completed rescue.

### Production architecture

- Keep the reliable engine while separating authored content from presentation. Prototype an authoring interface or structured content workflow that writers can use without editing a large interconnected TypeScript file.
- Provide scene and branch previews, condition explanations, consequence previews, source links, and a graph showing unreachable states and mandatory dependencies. Every tool investment should remove a measured production bottleneck.
- Add schema validation for evidence provenance, witness status, speaker identity, required assets, localization keys, choice legality, and finale assertions. Include contradictory-state checks and spoiler-aware UI review.
- Preserve stable scene and content identifiers. Establish save migrations and compatibility fixtures before changing state shape; retain legacy imports and the autosave key. Document how removed content is redirected safely.
- Add deterministic campaign replay, state inspection, and a QA route runner. Keep debug interfaces out of production builds. Preserve a repro seed with each reported state bug.
- Externalize player-facing strings, handle plurals and variable names, test text expansion, and prepare font/fallback requirements. Support reading layouts before selecting launch languages.
- Expand input abstraction and verify every flow, including naming a character, import confirmation, evidence inspection, and ending navigation. Test physical controllers and assistive technology, not only simulated input.
- Establish asset manifests, quality tiers, progressive loading, audio interruption handling, and performance budgets. New large assets must have a budget owner.

**Exit gate:** writers can author and revise a representative mission through the pipeline; its branches validate automatically; all four specializations have useful methods; an old save can complete the revised campaign; a complete slice can be played using keyboard and the supported assistive-technology flow. These gates precede complex campaign production.

## Phase 4 Campaign and audiovisual production

**Purpose:** build a full campaign with the proven experience throughout.

### Narrative and mission production

- Outline the campaign's reversals, escalation, quiet intervals, and resolution. New chapters should challenge earlier decisions: disputed evidence, a witness who changes their conditions, corporate counterclaims, and communities bearing different costs.
- Design a mission mix covering infiltration, negotiation, forensics, protection, public testimony, ethical triage, and a systemic climax. Include smaller character scenes that reveal something beyond the mission transaction.
- Give each district a recurring contact, local problem, visual identity, sound identity, and several state changes. Revisit locations to show consequences rather than spending all art budget on one-time backgrounds.
- Build character arcs for Quill, Mara, Kerr, Lumen, Ives, Sera, and Nia before expanding the cast. Preserve Nia's control over her account and distinguish culpability, explanation, and absolution.
- Use branches with controlled reconvergence. Track required scenes and optional variations per mission, with a fixed branch budget. Save bespoke branch production for decisions players recognize as major.
- Preserve the four finale identities and expand the scenes leading to them. Resolve character, faction, evidence, privacy, and community threads; epilogues should not contradict actions taken earlier.
- Apply developmental editing, continuity editing, line editing, sensitivity review where appropriate, and proofing as distinct passes. Authors must not be the sole reviewers of their branches.

### Art and staging

- Commission model sheets and expression libraries for the main cast. Maintain reference poses, lighting, clothing, age, and silhouette consistency.
- Build district and interior kits with weather, time, damage, and occupancy variants. Use deliberate shot composition, foreground objects, and restrained movement to distinguish encounters.
- Reserve bespoke illustrations for major revelations, reversals, intimate scenes, and finales. Establish a shot list tied to player experience, not an arbitrary image quota.
- Make evidence objects legible and manipulable in accessible formats. Information must survive image failure, high contrast, enlarged text, and reduced motion.
- Maintain source files, creator records, contracts, allowed uses, localization variants, optimization settings, and delivery approvals in the asset ledger.

### Music, sound, voice, and localization

- Compose recurring character and faction themes, district soundscapes, and tension/resolution variants. Drive transitions from meaningful states and avoid musical repetition during long reading sessions.
- Record final dialogue only after script, pronunciation, casting, rights, and direction are approved. Budget retakes and pickups; connect voice files to stable line identifiers.
- Decide voice coverage from slice cost and reception. Prioritize principal dialogue and key scenes; budget full coverage explicitly if selected. Avoid locking a promise the production cannot sustain.
- Review mixes on headphones, speakers, phones, and silent/subtitle-only play. Set approved dialogue/music loudness and headroom targets with the audio lead using actual measurements.
- Translate stabilized content with a glossary, character voice briefs, contextual screenshots, variable handling, and native-language editorial review. Perform localization QA on actual branches.

### Delivery milestones

| Milestone | Required evidence |
| --- | --- |
| First campaign draft | Every chapter has a playable start-to-finish route; no unfinished transition prevents completion. |
| Mid-production review | Roughly half of intended encounters meet the slice standard; forecast uses measured throughput and remaining asset costs. |
| Feature complete | All launch systems exist; new features require replacing comparable scope. |
| Content complete | Every supported route, finale, journal entry, principal performance, and required location exists; remaining work is revision and polish. |

Run a fresh-player session on each finished mission batch and full-campaign tests each quarter. Compare normal builds, low resources, intentional failures, and missed optional missions. Cut weak encounters, unnecessary languages, or secondary ports before cutting clarity, save reliability, rights, or accessible play.

## Phase 5 Alpha beta and release candidate

**Purpose:** prove the whole game, including combinations that isolated scenes conceal.

### Alpha

- Play every chapter and ending with a matrix of origins, specializations, evidence dispositions, privacy outcomes, faction states, resource scarcity, and failure chains. Cover consequential combinations; random simulations alone are insufficient.
- Review delayed consequences, character memory, consent, attribution, source quality, and epilogue consistency against the truth ledger.
- Test imports and migrations from every released save schema, interrupted rolls, overwritten slots, failed storage, refreshes, damaged data, and replacement of content.
- Conduct professional accessibility review with NVDA/Firefox and VoiceOver/Safari, keyboard-only navigation, physical controller use, text expansion, color/contrast needs, reduced motion, and deaf/hard-of-hearing participants.
- Rebalance economy, advancement, fatigue, check frequency, and mission length using observed behavior and participant explanations. Replay without deterministic dice.

### Beta

- Run several fresh cohorts, approximately 30–50 participants per revision where budget allows, with varied genre experience, access needs, and devices. Keep exploratory and usability cohorts distinct when their questions differ.
- Test a full campaign at a natural pace, then a different origin/build. Measure where players stop, which consequences they recall, why they replay, and whether they understand uncertainty.
- Use opt-in research forms and consented observation. Existing local diagnostics contain incident codes, not player story data; any new telemetry requires a separate privacy design and explicit approval.
- Complete native-language QA and content warning review. Check long translated labels and variable names in all layouts.
- Commission independent editorial, visual, audio, and systems reviews. Compare the campaign's weaker sections against the slice instead of judging only the best scene.

### Proposed performance acceptance budgets

Validate these budgets against named devices during the slice, then publish the supported matrix. Suggested initial profiles: a representative midrange Android phone, an older supported iPhone, an integrated-graphics laptop, and a current desktop. Record model, OS, browser version, network profile, and build hash.

| Measure | Initial proposed requirement |
| --- | --- |
| Cold loading | Largest Contentful Paint at or below 2.5 seconds at the 75th percentile on the defined supported profile; include a 5 Mbps, 150 ms latency network test. |
| Interaction | Interaction to Next Paint at or below 200 ms at the 75th percentile; ordinary local choice feedback below 100 ms at the 95th percentile. |
| Stability | Cumulative Layout Shift at or below 0.1; no image/font/audio arrival moves active choices unexpectedly. |
| Initial transfer | Aim for no more than 2 MB compressed before play is usable, excluding optional audio; progressively load large assets. |
| Long sessions | No growing source, listener, or decoded-asset leak in a two-hour replay; establish a measured memory cap for the weakest supported device. |
| Audio and lifecycle | No blocked progression when audio is unavailable; recover appropriately from interruptions, tab suspension, and resumed sessions. |

If a network/device profile cannot meet a budget, optimize, supply a reduced asset mode, or narrow the support claim based on evidence. Test battery/thermal behavior on physical mobile hardware before long-session support claims.

### Release candidate gate

- Zero known launch-blocking or severe defects involving progress loss, incorrect outcomes, inaccessible mandatory interaction, or crash loops. Record every accepted lower-severity issue with its owner and player impact.
- Every major consequence has a reviewed delayed response; all four finales pass continuity review across their principal state combinations.
- Proposed final research targets: at least 90% task completion for core onboarding/save/evidence actions without facilitator help; median agency and presentation ratings at least 4/5; no repeated severe misunderstanding in two successive rounds. Set full-campaign retention expectations after natural-time alpha data rather than inventing a completion percentage now.
- Supported hardware meets approved performance and input budgets. Manual accessibility and localization defects have evidence of resolution.
- All shipped assets have documented rights, credits, and distribution terms. Store claims match implemented behavior and measured support.
- CI Test and Build pass for the exact release revision; rollback, save compatibility, and support response are rehearsed.

Dates do not override these gates. Regrade using the same weighted rubric as [REVIEW.md](REVIEW.md), supported by independent reviews and player observations. An internal target of at least 8.5/10 overall with no area below 8 can guide decisions; it does not predict review scores or establish AAA status.

## Phase 6 Launch and continuing production

**Purpose:** deliver the approved experience and maintain it responsibly.

### Before launch

- Validate storefront positioning, screenshots, trailer, accessible demo, system requirements, content warnings, pricing, and localization claims. Use the proven slice as the basis for a public demo after it passes demo-specific testing.
- Develop press/creator outreach and community plans with an assigned owner and approved spending. Track demo response, wishlist conversion, and audience fit; set commercial targets after discovery data.
- Rehearse production release and rollback on a candidate. Maintain a known-good artifact, release notes, save migration notes, and a support playbook.
- Verify hosting capacity, CDN behavior, asset delivery, error handling, and the fail-closed CI deployment gate. Desktop packaging, if selected, adds installer/update/security and offline-save validation.
- Assign launch coverage, escalation contacts, incident priorities, and backup owners. Customer support needs a reproducible save-import workflow that respects player privacy.

### Continuing schedule

| Period | Work and evidence |
| --- | --- |
| First 72 hours | Triage blockers, crashes, save problems, device/audio failures, and inaccessible flows. Patch against repro cases and regression checks; keep rollback ready. |
| First 30 days | Address high-impact defects, confusing objectives, economy outliers, and performance hotspots. Publish known issues and patch notes. |
| Days 30–90 | Conduct postlaunch interviews, review actual branch use where consented data exists, and improve weak encounters and relationship responses. Recheck compatibility for every patch. |
| Months 3–6 | Decide whether an expansion has audience demand, funding, and capacity. Prototype one new investigation arc before committing a campaign. |
| Months 6–12 | Deliver approved content or platform additions through the same slice, rights, accessibility, localization, and QA gates. Maintain the base game throughout. |

Do not announce new chapters, ports, languages, or full voice coverage before their scope and funding gates pass. Avoid making a roadmap promise that reduces the quality of the shipped campaign.

## Team capacity and budget model

A plausible team for the proposed illustrated narrative scope averages **12–18 full-time equivalents**, with additional specialists and a possible production peak of 18–24. Staffing is staged: a smaller senior preproduction team, expanded content/art production after slice approval, and increased QA/localization capacity toward release.

| Discipline | Indicative capacity | Responsibilities |
| --- | --- | --- |
| Direction and production | 2 | Product decisions, funding gates, schedule, dependencies, scope control |
| Narrative | 3–4 | Lead, writers/designers, continuity and editorial work |
| Systems and mission design | 1–2 | Builds, mission structure, economy, consequence design |
| Engineering | 3–4 | Engine/state, authoring tools, interface/input, performance and build pipeline |
| Art and UX | 3–4 | Art direction, characters, environments/staging, accessible interface |
| Audio | 1 equivalent plus specialist contracts | Composer/sound design, voice direction, recording/editing/mix |
| QA and research | 1–3, growing near beta | Functional coverage, player research, hardware and accessibility coordination |
| External services | Variable | Actors, editorial specialists, localization, access consultants, legal, marketing |

These ranges are a capacity menu, not simultaneous mandatory hires. Assign named owners and use actual supplier quotes before approving the staffing plan. The peak is not the average.

**Illustrative USD model:** 15 average FTE × 28 months × $12,000 loaded monthly cost = $5.04 million core labor. Add $1.0 million for external art/audio/localization/accessibility services and $0.7 million for research, tools, legal, infrastructure, and launch activity. The subtotal is $6.74 million; 25% contingency adds $1.685 million, for approximately **$8.425 million**. Avoid double-counting contracted work already included in the FTE rate. Taxes, financing, publisher/platform terms, and location-specific employment costs need separate validation.

A rough planning envelope is **$5–12 million** for this scope and schedule, depending on regional costs, staffing, voice coverage, asset ambition, and marketing. This is an estimate, not a quote. Sustained postlaunch staffing requires an explicit reserve beyond the prelaunch example. A conventional large-scale 3D AAA RPG would have a substantially different cost model.

With fewer than about six dedicated staff, first approve a smaller campaign and longer schedule from measured throughput. Preserve the quality bar by reducing chapters, optional missions, voice coverage, and platform breadth. Hiring, commissioning, research recruitment, spending, and external outreach remain future production actions requiring their own authorization.

## Quality governance and risk control

Use two-week production cycles, monthly discipline reviews, and a quarterly full-game review. Maintain one backlog with acceptance criteria, evidence links, dependency owners, scope cost, and unresolved risks. Review the weakest campaign segment as well as the showcase slice.

Every milestone build should be played in four ways: a fresh player without design explanations; a contrasting build; a resource-poor/failure-heavy route; and an accessibility/input route. After revisions, use new participants where possible. Preserve observations, route states, build hashes, device details, and decision rationale. Automated coverage runs continuously; qualitative play determines whether the experience deserves to ship.

| Risk | Early signal | Response and owner |
| --- | --- | --- |
| Branching cost growth | More unique scenes and combinations than the approved mission budget | Narrative lead controls reconvergence and cuts low-value variants; QA estimates change with every branch. |
| Attractive but shallow memory play | Players open fragments mechanically and cannot explain an inference | Systems/narrative leads revise the investigation before producing additional memory missions. |
| Trivial economy or dominant builds | Most players bypass the intended dilemma through the same cheap method | Design lead adjusts opportunities, costs, and consequences using natural-dice and scarcity tests. |
| Repetitive writing or fatigue | Players skip prose or stop between similar encounters | Narrative lead cuts repetition, changes encounter rhythm, and strengthens character beats. |
| Art inconsistency or uncertain ownership | Asset revisions repeatedly miss model sheets, or contracts lack required uses | Art lead enforces reviews and rights records; replace unresolved assets before the release gate. |
| Voice and localization rework | Script edits continue after recording/translation starts | Producer enforces line stability and budgets pickups; reduce coverage before overrunning the campaign. |
| Save/state incompatibility | Old runs resolve to illegal or contradictory states | Technical lead maintains migrations, legacy fixtures, and canonical outcome validation. |
| Late access/performance failure | Final art or dialogue makes mandatory flows unusable on supported devices | UX/technical leads test real assets early and gate asset batches on measured budgets. |
| Funding or schedule pressure | Remaining cost exceeds forecast or throughput falls for two review periods | Producer reforecasts scope; protect core campaign and release gates, reduce optional work. |
| Weak commercial response | Slice/demo appeal does not match positioning | Director revisits audience promise and scope before full-production spending. |

AAA-level production means this discipline continues through the entire campaign and after launch. The next implementation milestone is the preproduction investigation prototype and expanded route review, but that milestone is only the first step in the funded six-phase program above.
