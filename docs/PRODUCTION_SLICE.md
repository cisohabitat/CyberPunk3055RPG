# Playable Production Slice Expansion

The first interpretation and witness milestone brought the campaign to **75 scenes and 188 choices**, including eleven new scenes and thirty-nine additional choices. This increment develops the investigation, specialization, and consequence systems proposed in the [full production plan](AAA_PRODUCTION_PLAN.md). It is a gameplay prototype for the production-quality slice; normal reading time and independent reception have not yet established the planned 60–90 minute slice acceptance gate.

## Player experience

Memory inspection now leads to comparing Mara's signature with the later evacuation cancellation. Players can test a misleading interpretation and receive feedback from the source instead of losing a roll. They then choose a bounded packet or an early allegation before deciding custody. An allegation cannot independently verify its own issuer. During The Week, the neighborhood can challenge the account; players answer with corroboration, correct its certainty, or repeat the unsupported allegation at a reputation cost.

Witness protection begins with Nia's conditions. Players choose one preparation before transport: scanner protocol, patrol scouting, a volunteer escort, or bracing the chair. Successful preparation improves an existing check or enables a method associated with the earned skill. A detected request can worsen later checks. The transfer summary exposes those advantages and warnings.

The four learned skills now enable different witness and archive methods. Chrome uses a local issuing-key reader or a clinic-only transfer. Face obtains a countersigned invoice or a volunteer-backed room. Ghost recovers a carbon ledger or uses a scouted patrol gap. Nerve holds an archive inspection hatch or carries a prepared transport chair. Methods have requirements, costs, exposure, or failure recovery; none increases the base stat cap.

A direct unregistered room and transport now cost ninety credits rather than thirty. Origin tools, clinic markers, faction favors, and prepared methods remain alternatives. This raises the route's cost without forcing every build through the same method. Broader economy balance still needs observed player decisions.

A successful new transfer pauses for Nia's review of her account. Players may defer recording, save, return before the week closes, and obtain her approval. A room alone does not complete the evidence promise. A registered transfer can be followed by a second private move, but the original privacy breach remains in objectives, the revisit, and aftermath.

Returning to Ward Nine offers a clinic or records-table visit before the original wall scene. Characters respond to the actual account, uncertainty, correction, exposure, and relocation. Compromised and unresolved commitments are now named in the collapsed summary.

## Played campaigns

Four browser-driven campaigns started through character creation and reached a finale. They exercised 192 choice activations across 53 distinct scenes with no browser page errors.

| Campaign | Decisions and observations |
| --- | --- |
| Prepared Ghost transfer | Spire/optic; compare both decisions; bounded packet; witness chain; Ghost training; successful patrol scouting; specialist transfer; defer recording; return for approval; answer with the source; visit Nia; read the names. Fifty choices. |
| Privacy repair | Gutterwire/debt; initially interpret the later order as clearing Mara, then revise; redact locations; Nerve training; prepare the chair; deliberately choose the risky hatch and fail; accept registered care; record the breach; fund a second room; answer with the source; revisit Nia; read the names. Fifty-one choices. |
| Corrected allegation | Dustline/on-file; initially omit the counter-order, then revise; accuse Helion before authentication; preserve the archive; fail authentication; retain the gap; correct the public allegation; revisit the records table; leave the wall. Forty-six choices. |
| Natural dice and paid recovery | Spire/optic; buy the front pass; take and sell the original; bounded witness account; Face training; attempt an escort; naturally roll one and fail; pay ninety credits for care; obtain approval; answer with the source; visit Nia; read the names. Forty-five choices. The run finished with 200 credits and strain 2. |

The first three campaigns used controlled dice to exercise specific consequences. The fourth used normal browser randomness: haggle 8, basin 9, Kerr 9, escort 1. The completed controlled witness runs deliberately selected risky methods despite having earned alternatives; they demonstrate consequences, not likely player preferences.

Play review corrected two continuity problems before delivery: an archive-only return could imply a witness-protection promise, and an uncorrected allegation could be described as a bounded account. The archive verification prose also no longer contradicts the bench timestamps with a specific sixteen-second interval.

## Verification and compatibility

Local verification passed 82 unit tests, TypeScript checking, the production build, and 75 browser cases across desktop Chromium, phone Chromium, and WebKit. The unit suite includes source-quality gates, misleading interpretations, specialist requirements, deferred approval across an exported save, price requirements, preparation modifiers, privacy repair, legacy transfers, and 900 seeded completion simulations. The browser suite has 25 cases per configured project: desktop Chromium, phone Chromium, Firefox, and WebKit. CI must pass Test and Build for the exact release revision before production can proceed.

Preview review covers the evidence comparison and transfer preparation at phone and desktop widths, plus expanded text and high contrast at a 320-pixel viewport. These views had no horizontal overflow or automated accessibility violations; the goal remained visible in the initial phone and desktop view. These are automated viewport and accessibility checks; manual assistive-technology review and physical-device measurements remain open.

The save schema remains version 2 and the autosave key remains `saint-shard-3055-v1`. In-progress transfers without the new briefing state keep their existing direct arrival route. Old bench saves can inspect, compare, label, and continue. Existing scene identifiers, recorded pending outcomes, and all four finales remain available.

## Remaining production acceptance

The provisional overall grade remains **7.0/10** until a broader assessment supplies evidence for a new grade. This increment adds playable agency; passing regression checks does not establish the complete AAA production target.

Next production acceptance work is fresh-player interpretation and replay research, economy/specialization tuning, a complete editorial pass, representative final art and directed audio, authoring throughput measurement, and named-device/manual-accessibility review. Nia currently uses a location plate; her commissioned portrait and expressions remain an art task. The six-phase production program remains open beyond this increment.


## Archive investigation increment — 9 October 2026

The archive milestone brought the campaign to **81 scenes and 202 choices**. Six new scenes and fourteen net additional choices expand the archive mission into access terms, one preparation, source comparison, retrieval, custody, and an employment consequence visit. The earlier counts and play records above describe the previous milestone.

Edda distinguishes the catalog from the retrieved record and a maintenance countersignature from digital issuing-key authentication. The player can make an incorrect inference and receive a source-based correction without gaining verification. Index preparation gives authentication +2, a watched service interval gives carbon retrieval +2, and a braced hatch gives physical inspection +2. Failed preparation alerts the reader and applies −1 to authentication and carbon retrieval; staffed ledger recovery remains available after failed retrieval.

Custody keeps the original with Sera and chooses a public copy with or without Edda’s name. She authorizes named publication. Signed extractions remain traceable even if the circulating copy withholds the name. The later visit records a suspended shift pending review, rather than inventing proof of dismissal. Forty-creds assistance bridges the lost shift; it does not settle the review. Players can visit the records and Edda once each, then return to the neighborhood hub and proceed to the wall. Legacy archive destinations and existing recorded checks remain usable without requiring the new briefing.

Three automated, directed browser campaigns began at character creation and reached an original finale: Spire authenticated the key after index preparation and corrected a catalog inference; Gutterwire obtained a countersigned invoice, asked for named publication, and supported the suspended shift; Dustline recovered a failed preparation and authentication attempt through the paid ledger and withheld the technician’s public name. These scripts use selected die faces to exercise branches; they are not independent playtests or evidence of natural reading duration. Together they activate 160 choices, with no browser exceptions. Desktop and 390px phone routes were exercised.

Verification passed 85 unit tests, TypeScript, the production build, and 900 seeded completion simulations. All 78 local browser cases passed across desktop Chromium, phone Chromium, and WebKit after updating the affected route and reading-pace fixtures (75 in the full rerun, followed by the three corrected archive cases). Coverage includes source correction, custody reload, source quality, employment cost, and once-only visits. The suite now contains 26 cases per browser project. Source comparison, retrieval, and custody screens passed automated WCAG accessibility checks at desktop and 390px phone widths, and at 320px with enlarged text and high contrast, with no horizontal overflow. Browser testing also identified and repaired a missing regular-scene heading. Real assistive technology and device sessions remain open. Exact revision CI status must be checked after push.

The provisional overall assessment remains **7.0/10**. Mission structure and character consequences improve, but this increment does not establish AAA production quality. The full six-phase plan still requires funded staffing, sustained campaign production, final art with rights verification, recorded performances, audiovisual direction, independent playtests, and release acceptance. No claim is made that those gates have passed.


## Public testimony and QA reproducibility — 9 October 2026

The public-testimony milestone brought the campaign to **87 scenes and 217 choices**, adding six scenes and fifteen net choices. The optional hearing connects the expanded investigation to the final chapter: a player scopes the account to the available evidence, handles witness publication permission, answers a source challenge, then files or withdraws the draft before returning to the four original finale choices.

The hearing distinguishes a reader-authenticated issuing key from independent corroboration and an unanswered question. A persuasive statement supplies no evidence. An unsupported key claim loses ward trust, increases Helion scrutiny, and receives a correction that remains beside the first statement. Filing corroborated evidence earns one step of trust once. Filing an unresolved question leaves verification unchanged. A filed public inquiry survives a silent memorial ending. Older neighborhood packet corrections now acknowledge independent corroboration obtained later rather than falsely describing an unchanged evidence state.

Nia’s consent to record does not authorize public quotation. A safe approved recording can be brought to her for permission to quote her approved words through Sera without an address. After a location breach she withholds public quotation, including after a second relocation. Players can keep her words private, or withdraw an authorized draft without opening the recording to public circulation. Withdrawal acknowledges that attendees may remember the hearing. Existing saves at final arrival retain their original endings; no new state version or save key is required.

`npm run story:replay` runs three version-controlled JSON routes from character creation through original finales, with explicit die faces, eight save/reload checkpoints per route, and ending/evidence/journal assertions. The runner identifies illegal choices, missing dice, and outcome mismatches with a scene and step. It restores a staged die before committing its result. The unit suite exercises these fixtures, including negative cases and deterministic repeatability. This is a QA production tool, not a finished writer authoring interface. No production debug interface or player telemetry is added.

Three directed browser campaigns also began at character creation: authenticated archive with a filed account and silent ending; protected witness with explicit public quotation permission and the names ending; unresolved archive with corrected certainty and a silent ending. They activate **169 choices across 60 distinct scenes** with no browser exceptions. Selected die faces exercise authored branches; these are not independent player studies or natural reading-time evidence.

Verification passed 95 unit tests, TypeScript, the production build, 900 seeded completion simulations, the three deterministic routes, and 84 local browser cases across desktop Chromium, phone Chromium, and WebKit. Coverage includes saved hearing state, quotation gating, withdrawal, and all four finales. The browser suite now has 28 cases per project, including quotation permission across reload and refusal after exposure. All six hearing screens passed automated WCAG checks at their reviewed desktop or 390px phone widths and again at 320px with enlarged text and high contrast. No horizontal overflow appeared, and the goal remained visible in the first screen. Exact revision CI must pass Test and Build, including all 112 cases across four browser projects, before handoff.

The provisional overall grade remains **7.0/10**. This increment advances phases 2–4 of the full production program through chapter structure, evidence continuity, and repeatable QA. Full campaign scale, a writer content pipeline, final commissioned assets and performances, independent playtests, physical devices, manual assistive-technology review, localization acceptance, and release rights checks remain open.


## Field loadouts and bounded recovery — 9 October 2026

The current campaign has **90 scenes and 229 choices**, adding three scenes and twelve choices. This increment develops the full production plan's systems phase through equipment with specific uses, care budgets, clinic trust costs, recovery timing, and a quiet follow-up. It preserves base stats, the earned perk, existing dice and critical outcomes, strain cap, original finales, and save format.

| Field kit | Price | Targeted benefit |
| --- | --- | --- |
| Archive Probe | 140 creds | +2 to scanner inspection, archive index preparation, and receipt authentication |
| Chair Harness | 120 creds | +2 to chair preparation, physical witness transfer, archive hatch preparation, and physical ledger inspection |
| Clinic Desk Guide | 100 creds | +2 to volunteer escort preparation and checkpoint negotiation; supplies procedure, not a forged signature |
| Route Shroud | 140 creds | +2 to patrol scouting, service-hatch witness transfer, archive interval preparation, and carbon retrieval |

Quill supplies one purchased kit per week. The tool stays in inventory and works without matching training; it cannot reserve a room, create evidence, or authorize publication. Shop and mission summaries expose its limits. Affordability remains enforced by the engine, including when an altered choice object is submitted. Buying a kit can leave the ninety-creds private-room route unaffordable; earned favors, tools, risky routes, and leaving the move open remain available.

A runner with strain can take one recovery visit before the week closes. Paid staffed recovery costs forty-five creds for up to 3 strain; clinic standing 2 permits a favor costing one trust step for up to 2 strain; a free short rest recovers 1 strain. A betrayed clinic still offers paid care but withholds the favor. Previewed relief is bounded by current strain. Zero-strain care and repeated recovery are rejected. Spending clinic standing can also remove an existing negotiation bonus at its threshold. Recovery preserves exposure, source uncertainty, and unfinished witness work; the quiet follow-up makes those limits explicit.

The replay tool now asserts credits, strain, and retained equipment as well as finale, flags, and journal. Seven routes run from creation through saved checkpoints in the normal unit suite. Four new directed browser campaigns exercise weak secondary skills with the purchased kit: a Dustline Chrome investigator authenticates the archive and ends with 190 creds/strain 0; a Dustline Face runner recovers a failed crossing at the desk with 185 creds/strain 2; a Spire Nerve runner uses the harness with 270 creds/strain 1; a Spire Ghost runner prepares a silent route with 250 creds/strain 1. These are selected die faces for branch coverage, not measured player behavior. The failed crossing retains its normal critical-failure strain cost.

The four browser campaigns activate **245 choices across 60 distinct scenes**, reach original finales, and report no browser exceptions. Verification passed 105 unit tests, seven deterministic routes, TypeScript, the production build, 900 seeded completion simulations, and all 90 local browser cases across desktop Chromium, phone Chromium, and WebKit. Coverage includes purchase/recovery reloads, affordability, actual check modifiers, and legacy pending-roll compatibility. The browser suite now contains 30 cases per project. Shop, recovery, and recovery follow-up were reviewed at both desktop and 390px phone widths, alongside equipped archive and checkpoint summaries. All eight reviewed screens passed automated WCAG checks and again passed at 320px with enlarged text and high contrast; there was no horizontal overflow, and the goal remained in the first screen. Exact revision CI must pass Test and Build, including all 120 cases across four browser projects, before handoff.

The provisional grade remains **7.0/10**. This is a playable systems increment, not external acceptance of balance or AAA production. Fresh-player balancing, full campaign scale, a writer pipeline, final commissioned audiovisual assets, manual assistive-technology and physical-device sessions, localization, rights verification, and launch acceptance remain open.
