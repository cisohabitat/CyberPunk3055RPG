# Playable Production Slice Expansion

The campaign now has **75 scenes and 188 choices**, including eleven new scenes and thirty-nine additional choices. This increment develops the investigation, specialization, and consequence systems proposed in the [full production plan](AAA_PRODUCTION_PLAN.md). It is a gameplay prototype for the production-quality slice; normal reading time and independent reception have not yet established the planned 60–90 minute slice acceptance gate.

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

The current campaign has **81 scenes and 202 choices**. Six new scenes and fourteen net additional choices expand the archive mission into access terms, one preparation, source comparison, retrieval, custody, and an employment consequence visit. The earlier counts and play records above describe the previous milestone.

Edda distinguishes the catalog from the retrieved record and a maintenance countersignature from digital issuing-key authentication. The player can make an incorrect inference and receive a source-based correction without gaining verification. Index preparation gives authentication +2, a watched service interval gives carbon retrieval +2, and a braced hatch gives physical inspection +2. Failed preparation alerts the reader and applies −1 to authentication and carbon retrieval; staffed ledger recovery remains available after failed retrieval.

Custody keeps the original with Sera and chooses a public copy with or without Edda’s name. She authorizes named publication. Signed extractions remain traceable even if the circulating copy withholds the name. The later visit records a suspended shift pending review, rather than inventing proof of dismissal. Forty-creds assistance bridges the lost shift; it does not settle the review. Players can visit the records and Edda once each, then return to the neighborhood hub and proceed to the wall. Legacy archive destinations and existing recorded checks remain usable without requiring the new briefing.

Three automated, directed browser campaigns began at character creation and reached an original finale: Spire authenticated the key after index preparation and corrected a catalog inference; Gutterwire obtained a countersigned invoice, asked for named publication, and supported the suspended shift; Dustline recovered a failed preparation and authentication attempt through the paid ledger and withheld the technician’s public name. These scripts use selected die faces to exercise branches; they are not independent playtests or evidence of natural reading duration. Together they activate 160 choices, with no browser exceptions. Desktop and 390px phone routes were exercised.

Verification passed 85 unit tests, TypeScript, the production build, and 900 seeded completion simulations. All 78 local browser cases passed across desktop Chromium, phone Chromium, and WebKit after updating the affected route and reading-pace fixtures (75 in the full rerun, followed by the three corrected archive cases). Coverage includes source correction, custody reload, source quality, employment cost, and once-only visits. The suite now contains 26 cases per browser project. Source comparison, retrieval, and custody screens passed automated WCAG accessibility checks at desktop and 390px phone widths, and at 320px with enlarged text and high contrast, with no horizontal overflow. Browser testing also identified and repaired a missing regular-scene heading. Real assistive technology and device sessions remain open. Exact revision CI status must be checked after push.

The provisional overall assessment remains **7.0/10**. Mission structure and character consequences improve, but this increment does not establish AAA production quality. The full six-phase plan still requires funded staffing, sustained campaign production, final art with rights verification, recorded performances, audiovisual direction, independent playtests, and release acceptance. No claim is made that those gates have passed.
