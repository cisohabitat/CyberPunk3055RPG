# Witness protection alongside clinic work

This cycle extends the [goal-driven economy study](CAMPAIGN_ECONOMY.md) to Nia’s transfer/account, the coolant emergency and owed return work in different orders. It improves the existing commitments panel using those observed decision points. The provisional internal grade remains 8.2.

## Scope and reproducibility

Run `npm run balance:overlap`. It writes ignored JSON/Markdown under `qa/production/reports/balance/`, validates complete evidence and compares exact results with [the reviewed aggregate](../qa/balance/clinic-overlap.json). The [readable summary](../qa/balance/clinic-overlap.md) groups the eight scheduling policies; the JSON retains all 576 cells. CI requires this after the preceding three audits and includes the evidence in the same thirty-day artifact. No existing check is removed or relaxed.

There are **14,400 natural-dice full campaigns**: three origins × four two-point specializations × three current UI complications × two spending policies × two mission orders × two recovery timings × two transport preferences × 25 seeds. Every campaign starts at character creation and plays the prologue. There is no injected cash, state, equipment, training, mission entry or directed-success setup. `ClinicSchedule` is an explicit optional policy in the existing offline runner; omission preserves the preceding 43,200-campaign audit and its baseline.

The study uses no-sale play to stress limited income. Existing care-first and kit-first purchasing remain as defined in the earlier study. Each runner answers a district call, attempts the coolant repair with their trained stat, and keeps a successful repair’s receipt local. Failed repairs use the 35-creds courier only if funds also preserve a still-outstanding room benchmark; otherwise the runner carries medicines for the actual bounded Strain. An owned clinic marker reduces the benchmark to zero. No repair rebate is assumed. No historical evidence, patient attendance or treatment is inferred from coolant work.

Clinic-first finishes coolant work before arranging Nia’s move. Witness-first arranges the transfer, defers the account when a safe arrival is reached, completes clinic work, keeps owed shifts and returns for separate review and filing. A failed transfer retains the existing outcome. The volunteer policy tries an escort preparation regardless of specialization, then promises the runner’s own shift if the escort agreed; a failed preparation uses existing legal trained/funded/hatch/checkpoint alternatives. Trained play uses the earlier specialization policy. Neither policy invents an escort after a failed check.

Early recovery uses the first canal visit/return with Strain at least 3 and an unused recovery visit. Late recovery waits until both jobs, owed work and deferred review are handled, then uses the visit if Strain remains. Both prefer a legal clinic favor, then affordable paid care while preserving an outstanding room benchmark, then free rest. Actual standing, betrayal and once-only limits apply. Strain does not secretly reduce check bonuses; these timing comparisons concern resource trajectories, bounded relief and remaining pressure.

Streams are paired across policies within origin/complication/seed. Different decisions shift later encounters and dice consumption. These source-aware strategies are the available development proxy, not independent participants, player averages, a significance test or exhaustive legal play. Selected sampled runs can be replayed through saved dice; their UI replays use recorded faces.

## Findings and interpretation

All **14,400** campaigns reached an original finale, with zero exceptions or decision-budget overruns. **13,248** started both jobs; **13,232** met both defined goals: an unexposed protected Nia account, and either restored clinic cooling or medicines preserved in another cold cabinet. **1,152** lacked the prepared source packet after opening outcomes. A finale is counted separately from those objectives.

All 13,248 started clinic jobs preserved medicines: **10,992 repairs**, **1,774 funded transfers**, **482 carrying transfers**. The original pump remains broken after a transfer. The **4,072** actually accepted volunteer shifts were kept; Chapel work was also completed. This is a policy that explicitly returns for owed work, rather than evidence that players cannot forget it.

**Sixteen** volunteer-policy campaigns retained an exposed location after failed escort/fallback attempts with insufficient funds for a private room. Eight small build/policy cells each contain one such seed, duplicated across the paired recovery timings. These are adverse source-aware outcomes, not sixteen independent people. They remain in the baseline; no exposure flag or failed die is erased and no automatic free private transfer is added. The existing registered-room continuation remains playable. The four trained-policy groups met both goals in all their started campaigns.

High pressure is exercised: **3,645** runs reached Strain 4 or 5, including **991 clinic entries** and **898 witness entries** at that pressure. **2,088** runs were broke at some point. Late recovery generally left less final Strain in these policies; it did not improve these sampled goal counts. Kit-first spending and a low-Face volunteer attempt can still put private fallback out of reach. These findings support clearer costs and return directions; they do not justify a blanket price/reward/difficulty adjustment.

The focused policies sample **60/197 scenes**, complementing the preceding broad audit and 148 authored campaigns. Distribution schedules, simultaneous archive work, extra visits, future coolant inspections, rebates, relocation, every other recovery policy and every possible seed remain outside this new sample.

## Player-facing change

The existing collapsed commitments disclosure now includes an explicit open count. **Available here** lists visible canonical witness/account, coolant and owed Chapel/volunteer-shift choices, plus recovery when relevant. Enabled **Find** controls focus and scroll to the actual choice button. Finding spends nothing; the player must separately select that choice to act. Current authored detail, bounded effect previews and disabled requirements remain attached. Hidden alternatives are never turned into new UI actions. A held check suppresses the directions; its saved die still has priority.

At the canal, when an unfinished transfer and coolant work are both available, a written comparison shows the actual 90-creds private-room and 35-creds cold-storage alternatives, carrying Strain, and whether current cash covers both. It reserves no money and retains earned/prepared alternatives. Once the room is safe, this outstanding-room comparison disappears. Deferred accounts receive specific return guidance, including when a shift is also owed. Safe transport, work, recording approval and public quotation remain separate.

The controls keep native keyboard access, minimum 44px targets, normal number-key choice order, whole-scene defaults and existing text-only/silent preferences. No scene, choice, quotation, price, reward, die rule or save schema changes. Existing canal/clinic illustrations and actual speakers remain appropriate; the canal’s explicit scene-art decision documents the new written advice. All fixed voice words, actors, bindings and delivery bytes remain unchanged. Preserve **197 scenes / 598 choices / 148 authored complete fixtures / 302 dialogue bindings / 290 active voices**, four finales, held dice, 1d10/caps, save version 2 and `saint-shard-3055-v1`.

## Maintenance and verification

The new CLI fails on incomplete/invalid counts, duplicate or missing cells, campaign exceptions or any exact per-cell difference from the reviewed baseline. Its strict deterministic comparison is a change-review guard, not a probability confidence interval. To investigate an intentional change: `npm run balance:overlap -- --record-baseline --out=/tmp/clinic-overlap-candidate.json`. A smaller `--seeds=N` candidate is explicit; the normal comparison rejects different sampling. Candidate mode cannot overwrite the committed baseline and claims no historical comparison. Review both files and explain differences before replacing them. Existing broad, matched and single-goal baselines stay intact.

Source regressions cover every policy cell, reproducibility, exact replay through saved checks, cash conservation, real failed/exposed outcomes, completed work versus unfinished recording, bounded costs, source non-starts, invalid evidence and hidden/held-check action suppression. Browser checks exercise actual sampled states with largest text and high contrast at 320/390/1440px, free keyboard focus, separate action commitment, exact saved state/rolls, reload, text-only requests and automated accessibility.

Local verification passed **609 source tests**, TypeScript, the production build and inventory, all four balance commands and **27 focused browser cases** across Chromium, phone Chromium and WebKit. No focused case retried or flaked. The three preceding balance baselines and all 148 authored full-state route contracts remain unchanged. Inventory remains 197 scenes / 598 choices / 559 assets with zero budget violations. The expanded phone commitments disclosure was visually reviewed.

Four sampled engine campaigns were replayed through the complete keyboard UI with their recorded faces:

| Campaign | Sample | Presentation | Final creds / Strain | Scene visits | Reloads |
| --- | --- | --- | --- | ---: | ---: |
| Witness first, volunteer, failed pump and funded transfer, deferred account and both return shifts | Spire Face/debt/care-first, seed 1 | 390px illustrated, sound | 100 / 1 | 61 | 15 |
| Clinic first, restored cooling, trained transfer | Dustline Nerve/debt/care-first, seed 3 | 320px text-only, silent | 90 / 0 | 57 | 18 |
| Clinic first, failed pump and medicine carrying, protected account | Gutterwire Chrome/optic/kit-first, seed 8 | 320px text-only, silent | 10 / 3 | 56 | 16 |
| Clinic first, failed volunteer/fallback, exposed account | Gutterwire Nerve/debt/care-first, seed 24 | 1440px illustrated, silent | 70 / 3 | 56 | 18 |

Together these comprise **230 scene visits / 67 reloads**, with **29 naturally completed selected voice playbacks** and two pagehide/resume interruptions in the first campaign. Every run had zero page errors and failed media; silent/text-only requests respected preferences. These verify recorded sampled routes through the UI, not a separate blind natural-play study, every line’s listening quality, or human participation. Raw saves, replays, screenshots, JSON results and source hashes stay outside Git in the local validation workspace.

Four native first-visit performance samples at 390/1440px with full/none artwork kept the goal visible, with zero overflow and layout shift. Maximum encoded resources plus HTML were **2,010,842 bytes** against the unchanged **2,097,152-byte** budget. Production publication remains subject to exact-commit remote CI after push; local verification alone does not claim a live deployment.

Next: appointment distribution alongside a protected/deferred account, then archive/private-delivery combinations and chapter-close consequences. Preserve separate goals, observed receipts, recording permissions and actual costs while extending policy scope.
