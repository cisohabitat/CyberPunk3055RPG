# Phase 1: campaign editorial and pacing

10 October 2026. This is cycle 1 of the [six-phase, ten-cycle roadmap](ROADMAP.md). Implementation begins from `eafdf6f`; the gameplay baseline is `091403c`. The provisional internal grade remains **7.8/10**. This pass does not establish an independent score or AAA acceptance.

## Execution order

Each phase gets its own implementation, internal play, regression checks, pushed revision and production verification. Hand back the completed phase before starting the next. Keep external acceptance evidence separate from implementation progress.

| Phase | Work and deliverables | Internal completion check | External exit evidence | Planning effort |
| --- | --- | --- | --- | --- |
| 1 — Narrative and pacing, cycle 1 | Audit the full campaign; edit redundant briefings and returns; distinguish recorded/current speech; preserve character wants, evidence and commitments. Ship the audit and edited script. | Four finales, failures, unfinished work, all origins, saved returns and constrained layouts; unchanged canonical outcomes. | Independent editor explains each act's conflict and each principal character's want. | 1–2 weeks |
| 2 — Encounter variety, cycles 2–4 | First improve build-specific preparations and consequences in Chapel entry, witness transfer and Kerr collection. Then add a saved local action allowance at the Chapel. Finally replace repetitive distribution checks with a practical allocation/negotiation problem. | Matched build routes differ in preparation, cost/risk and later response; expiry and zero-fund failures remain recoverable; reload cannot reset costs or opportunities. | Player recognition of those differences is measured in phase 5. | 4–6 weeks |
| 3 — Campaign integration, cycle 5 | Carry methods, motives, promises, refusals and failures into later conversations and four distinct final actions. Lock scripts and the final media shot list. | Four directed finales, two natural-dice campaigns and targeted unfinished combinations; skipped arcs invent no resolution. | Narrative review of the integrated candidate. | 1–2 weeks |
| 4 — Art and audio, cycles 6–7 | Approve character/palette/composition briefs, state-appropriate expressions and scene shots. Direct selected dialogue and meaningful tension/quiet score changes. Deliver responsive assets, masters, provenance and auditions. | Matching enumerated art decisions, readable silent/text-only play, optional voices, mixer/interruptions and media budgets. | Independent whole-chapter art/listening review and distribution-rights acceptance. | 3–5 weeks |
| 5 — Observed play and access, cycles 8–9 | Conduct the prepared exploratory opening/full-campaign study; revise repeated findings; repeat with fresh cohorts. Test actual supported assistive technology, controllers and physical devices. | Fix and retest recurring confusion, progress loss and inaccessible mandatory actions; report actual denominators and device samples. | Fresh-player, accessibility and device evidence attached to the tested revision. | 3–5 weeks |
| 6 — Review and release, cycle 10 | Obtain category reviews, address the weakest scores, close evidenced production gates, rehearse rollback/save recovery and verify public delivery. Resolve the bounded CI/deploy wait mismatch without weakening exact-revision checks. | Full regression, replay matrix, asset budgets and clean exact-revision production verification. | Weighted score above 9.0, every category at least 9.0, and documented human/rights/support acceptance. | 1–2 weeks |

These are planning-effort ranges, totaling 13–22 weeks; they are not a promise of elapsed delivery or secured personnel. The roadmap specifies each cycle's implementation and acceptance criteria. Technical development can continue while external reviews are pending, but a pending gate cannot be declared passed.

## Campaign questions and character direction

The Hour asks why this runner accepts the job and what the stolen hour actually contains. The Week asks what their use of it costs other people. The Wall asks what they can honestly say, and which promises remain unfinished. Keep personal motives at meaningful commitments; repeating a whole motive on every transition dilutes it.

| Character | Want in the current campaign | Speaking direction |
| --- | --- | --- |
| Quill | A completed transaction with his buyer left unnamed; later, an answer about his tab. | Short offers, prices and evasions. Let the ownership question expose his limit. |
| Mara | Her explanation heard without acquittal; later, her own name on a private reply. | First-person responsibility and specific remembered details. Label the recorded interview; present-day speech cannot revise the old source. |
| Lumen | Practical help with her own limits on publicity and sponsorship. | Concrete questions and refusals; her quiet reason is personal, not automatic partnership. |
| Kerr | Protect Mara, collect his brace under agreed trace terms, retain control over contact. | Direct terms and terse acknowledgement; a favor cannot erase earlier betrayal. |
| Edda | Keep a working account/job while handling records and private custody precisely. | Identify the broken practical thing before explaining its limits; distinguish old charges from current work. |
| Nia | Choose her own account, contact and visibility. | Personal boundaries remain explicit; helpful work cannot supply her consent. Her existing dialogue is retained in this pass. |
| Sera | Keep names and living people from being converted into someone else's convenient ending. | Concrete names, questions and small observed details; final choice belongs to the runner. |
| Asa / Ren | A real stock receipt / usable rooms for people they know. | Practical objects and observed arrivals; no invented treatment or witness transfer. |

## Implemented editorial decisions

The [171-scene audit](../qa/editorial/phase1-audit.csv) lists active choices, the act's emotional question, retain/edit decisions, lengths, continuity checks and accompanying art decisions. The baseline includes 304 representative text samples: 151 scenes observed through fixtures, plus source previews for 20 scenes not reached by those fixtures. These are internal editorial/replay samples, not exhaustive conditional coverage or an independent editor's approval.

Thirty-three scenes have authored prose changes. The pass shortens the stallholder anecdote and departure repetition, Edda/Asa/Kerr briefings, successful bench feedback and the Wall's surrounding recap. Return visits use existing completion/visit flags to give a shorter answer rather than replaying the entire briefing or journal outcome. Unfinished work, private custody, exposure, old betrayal, once-only referrals and unsettled commitments still have explicit warnings where they matter.

Mara's bench cross-examination is an interview embedded in the recorded hour. Its controls now say **Replay**, and its narration says she cannot hear the runner now. Adjacent recorded gestures and testimony use the same framing. The voluntary Week conversation remains current speech. The six fixed synthetic voice quotations are unchanged, so their matching audio needs no regeneration.

Canonical scene ids, choice ids, effects, gates, destinations, rolls, costs and journal entries match the baseline. Only two replay button labels change. No new scene or save schema is introduced. Four finale texts remain distinct; the preceding Wall visits are shorter.

Every edited scene has an explicit art decision. The same people and places use suitable existing illustrations or portraits; the recorded-speaker and shorter-return rationales are updated in `qa/media/scene-art.json`. No new visual moment requires a new image. Neutral illustrations still cannot depict unearned delivery, safety, permission or authentication. Phone/desktop play checks image decoding, and narrow text-only play checks that artwork is not requested.

## Measured scope and verification

The [paired measurement](../qa/editorial/phase1-summary.json) evaluates new prose against the identical pre-choice states captured from all 75 baseline routes: **5,462 scene visits**, 396,104 words before and 343,129 after, a **13.4% aggregate reduction**. It is not a unique-script word count, a measured reading-time improvement or a grade increase. Cuts are selective: the longest repetitive returns shrink substantially, while the interview framing becomes slightly longer where clarity requires it.

Examples of maximum sampled scene lengths: Spire return 109 → 56 words; shelter return 95 → 70; freight return 69 → 58; Edda's shift terms 96 → 59; first Wall introduction 125 → 95; Wall ledger 187 → 140. Conditional state and visit counts affect these maxima; they are not participant observations.

Final internal play and CI evidence is recorded in [DEVELOPMENT_CYCLES.md](DEVELOPMENT_CYCLES.md). Automated structural comparison verifies all 171 canonical scene/choice definitions, allowing only the two recorded-interview labels. Replay tests retain failure, consent, source, cost and save invariants. Browser verification includes the recorded interview's optional voice/reload and a visited neighborhood at 320 pixels with largest text, high contrast and no artwork.

The independent editor exit remains **pending**. This phase prepares a reviewable candidate; it does not fabricate human research, accessibility-device acceptance or a higher grade. Phase 2 starts with method-specific encounter design and paired builds, using this shorter script as its baseline.
