# Clinic distribution alongside Nia’s witness account

This phase follows [coolant/witness overlap](CLINIC_OVERLAP.md). It improves saved-draft navigation, unfinished-work warnings and the distinction between dispatch and later card acknowledgements. The provisional internal grade stays 8.2.

## Release diagnosis

The preceding 61dc736 CI run 38850898704 passed Test but failed three archive-pause widths in each of the four Browser jobs. Every failure reported `heading-order` on `<h3>Available here</h3>`; the other cases passed. The earlier focused WCAG-tagged tests omitted this best-practice rule. This phase changes that heading to h2, retains all archive regressions, and applies full Axe rules in the new and preceding commitment tests. No rule or gate is disabled. Build correctly rejected the failed matrix, and the public production alias still resolved to the verified 362b3b4 deployment when work started.

## Reproduce and interpret

`npm run balance:overlap` runs the existing coolant comparison followed by the new distribution comparison. Both write JSON/Markdown into the existing ignored balance artifact directory, retained by CI for thirty days. The new report compares exact results with [the reviewed aggregate](../qa/balance/distribution-overlap.json); [the readable summary](../qa/balance/distribution-overlap.md) groups sequence and channel while retaining all individual build cells in JSON.

The new audit contains **1,296 cells / 25,920 campaigns**: three origins × four specializations × three current UI complications × two spending policies × two recovery timings × three channels × three sequences × twenty seeds. Every run starts at real character creation with natural dice through the prologue and finale. No cash, source flags, mission entries, training or equipment are injected. Maximum length remains 180 committed choices. Baseline checks keep the preceding broad, matched, single-goal and coolant evidence unchanged.

The existing no-sale, care-first/kit-first, matching trained witness and early/late recovery policies supply the common setup. Distribution uses four early/two later with one Strain, three/three with two Strain, or three/three requesting the ten-creds carrier. An unaffordable carrier request falls back to the authored carrying option; the report records it explicitly. Capacity, faction gates, costs and Strain caps retain canonical authority. No private home list is offered and no repair rebate or extra income is assumed.

All schedules are first drafted and paused without acceptance. Selected full UI and source replays exercise saved drafts and recorded dice through reload checkpoints. **Dispatch-first** resumes and accepts the plan before arranging Nia’s transfer. **Witness-first** secures the room, defers recording while handling distribution and returns for separate review. **Interleaved** starts the draft, pauses to move Nia, then resumes dispatch and her separate account. Owed Chapel work is actually kept. After closing the Week, every completed distribution gets a Ward Nine visit to record the two actual receipt acknowledgements, then reaches an original finale.

Paired streams share origin/complication/seed, while branching can change later encounter/die alignment. These are source-aware development simulations, not independent people, blind play, significance estimates or exhaustive legal sequences. The selected UI runs replay their recorded sampled faces. They do not become fresh independent natural-dice trials.

## Findings

All **25,920** reached a finale without exceptions or budget overruns. **24,228** started both jobs and met the defined goals: Nia’s unexposed approved account plus accepted/recorded private dispatch and the later two acknowledged cards. **1,692** lacked the prepared source packet after opening outcomes; they did not receive invented mission access.

Accepted plans comprised **8,076 standard splits**, **8,164 extra carrying trips** and **7,988 paid carriers**. **88** requested carriers became unaffordable after witness spending and used actual carrying. No accepted work/fare repeated, no card acceptance was inferred from a draft, and no public quotation/key authentication was created. **9,473** campaigns reached Strain 4 or 5 and **3,826** were broke at some point. Owed work was kept by an explicit policy; this does not show that players cannot overlook it.

All three sequences completed their started goals in this sample, with actual cash/Strain differences retained per cell. This supports clearer priorities and payment visibility, without a price/reward/difficulty change. Sixty-four of 197 scenes were sampled; the previous audits and 148 authored full campaigns supply complementary coverage. Public-window monitoring/repair, failed legacy distribution rolls, home-list refusal, other simultaneous missions, every seed and independent acceptance remain outside these new policies; their existing source/browser coverage remains required.

## Player-facing improvements

The main commitment shows the saved allocation and whether it is still unaccepted. The existing **Find** controls now cover visible distribution continuation, offers, actual work/fare choices and acceptance records. At Ward Nine, they can find the later reply choice. They only move focus to a canonical button; a second explicit selection commits it. Actual disabled requirements and bounded effect previews remain visible. No new scene or gameplay shortcut is added.

A paused schedule alongside Nia’s deferred account receives combined return guidance. Week-closing choices list the names of remaining commitments. The future Ward Nine reply remains open in the full campaign ledger, but does not falsely warn that it should have been completed during the Week. Guidance tells the player when it becomes available.

After two acknowledged cards are actually recorded, the main commitment and current journal promise status name those two receipts. Other receipts and all attendance remain unknown. The original dispatch journal entry keeps its historically accurate wording; later observation does not rewrite it. Nia’s safety, approved recording and public quotation permission remain distinct.

Existing neutral dispatch and canal illustrations remain appropriate for drafts and unresolved/accepted outcomes. Three explicit art rationales cover the written advice; all actual actors, exact quoted words, ordered voice bindings and media bytes remain unchanged. No new scene or voice performance is required. Preserve 197 scenes / 598 choices / 148 authored complete fixtures, 302 bindings / 290 active voices, four finales, held dice, 1d10/caps, save version 2 and `saint-shard-3055-v1`.

## Evidence and maintenance

Normal CI requires the full deterministic comparison, rejecting missing/duplicate cells, malformed/inconsistent counts, exceptions or any per-cell difference. For an intentional candidate: `node --import tsx scripts/distribution-overlap.ts --record-baseline --out=/tmp/distribution-candidate.json`. Smaller `--seeds=N` candidates are explicit; the regular comparison rejects different sampling. Candidate mode validates integrity and never overwrites the committed baseline or claims historical regression success. Review JSON and Markdown before replacing them, documenting any intended difference. Reports are written before validation so failures retain evidence.

Source tests exercise all policies, reproducibility, exact replay through saved checks, absent packets, real carrying fallback, mixed open commitments, closing with missing work, future follow-up timing, partial receipts and malformed evidence. Browser checks use actual legally played sample states at 320/390/1440px with largest text/high contrast. They verify keyboard focus without commitment, named close warnings, preserved saved costs/rolls/consent, later partial receipts, reload, text-only requests and full Axe rules. The existing archive-pause flow verifies the actual CI regression.

Local verification passed **612 source tests**, TypeScript, the production build/inventory, all four balance commands (five report comparisons), and **72 distinct focused browser cases** across Chromium, phone Chromium and WebKit. The first 63 include all previously failing archive-pause widths and the new paused/dispatch/reply states; nine final-build cases add the draft-to-courier edge case. Full Axe rules are retained, with no local failures, retries or flakes. The three prior statistical/matched baselines and coolant baseline remain unchanged, as do all 148 authored full-state contracts. Inventory remains 197 scenes / 598 choices / 559 assets with zero budget violations. The expanded phone panel was visually reviewed.

Four complete keyboard UI campaigns replayed sampled natural-dice records or a clearly authored early-closing variant:

| Sequence | Sample | Presentation | Final creds / Strain | Visits | Reloads |
| --- | --- | --- | --- | ---: | ---: |
| Draft, Nia, paid dispatch, separate account and two receipts | Spire Face/debt/care-first, interleaved, seed 1 | 390px illustrated, sound | 125 / 0 | 75 | 17 |
| Dispatch first, carrying three/three, trained witness | Dustline Nerve/debt/care-first, seed 3 | 320px text-only, silent | 90 / 2 | 73 | 20 |
| Witness first, unaffordable carrier, actual carrying fallback | Gutterwire Face/debt/care-first, seed 6 | 320px text-only, silent | 5 / 3 | 77 | 19 |
| Close with draft and Nia review unfinished | Authored early-close variant of interleaved seed 1 | 1440px illustrated, silent | 135 / 0 | 58 | 19 |

Together these covered **283 scene visits / 75 reloads**, **32 naturally completed selected voice playbacks** and two pagehide/resume interruptions. All had zero page errors or failed media and preserved exact canonical state after each choice. Text-only/silent requests respected preferences. The final written legacy-channel correction affects none of these played states; all 279 transitions were checked for that branch, and nine final-build browser cases cover it separately. Both existing courier acceptance and public posting are tested in source alongside the unused saved draft. No dialogue, actor or audio byte changed between builds.

Four final-build native first-visit loading samples at 390/1440px with full/none artwork kept goals visible with zero overflow and layout shift. Maximum encoded resources plus HTML were **2,011,457 bytes**, below the unchanged **2,097,152-byte** limit. These are synthetic automation measurements, not field percentiles or physical-device acceptance. Raw replays, saves, screenshots, browser JSON, source hashes and voice records stay outside Git in the local validation workspace. Production remains subject to exact-commit remote CI after push.

Next phase: archive investigation combined with Kerr’s private delivery, followed by chapter-close consequence review and a whole-game reassessment. Distribution’s accepted work, actual receipts and unknown attendance must remain distinct as policy scope expands.
