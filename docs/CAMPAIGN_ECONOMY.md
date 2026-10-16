# Goal-driven whole-campaign economy

This cycle follows the [matched-mission comparison](MATCHED_MISSION_BALANCE.md) with natural dice from the prologue through the finale. It tests opening losses, actual income, equipment purchases, recovery and earned mission methods, then improves equipment guidance where spending bought no additional benefit under the tested strategies. The internal grade remains 8.2.

## Release checked first

The preceding `362b3b428785d9ab6af12c4f7fb3a9d6a2baabb5` release passed Test, all four Browser jobs and Build. Vercel's production alias resolved to that exact commit with READY deployment `dpl_8yAN6ZgmHDjmLMUtCcmAnaJX9Bos`. Three public WebKit checks passed the funded checkpoint flow at 320, 390 and 1440px, including the held failure, payment, reload and separate consent. This establishes the starting release; it does not assert that the subsequent candidate is already published.

## Run and reproduce

```bash
npm run balance:campaigns
```

The command writes `qa/production/reports/balance/economy-current.json` and `.md`, then compares the result with [the committed aggregate](../qa/balance/campaign-economy.json). The [readable baseline](../qa/balance/campaign-economy.md) shows every build alongside a strategy summary. CI runs it unconditionally in Test after the broad and matched audits; a failure blocks the existing production gate. All three reports share the thirty-day `gameplay-balance` artifact. The established browser, audio, accessibility, performance and build checks remain required.

There are **432 cells / 43,200 campaigns**: three origins × four two-point specializations × three current UI complications × three goals × two income policies × two spending policies × 100 seeds. The engine-only no-complication control from earlier reports is excluded here. Every campaign starts through real character creation, plays the prologue, and commits only enabled canonical choices. No money, items, source flags, training or destinations are injected. A campaign must reach an original finale within 180 committed decisions.

All checks draw ordinary 1–10 pseudorandom dice, including negotiation, Chapel entry, copying and Kerr. There is no directed-success setup. Origin/complication seed streams are shared across builds and policies to help comparison; branching means later rolls may belong to different encounters. Results are source-aware development simulations, not independent player samples or statistical significance estimates.

## Policy definitions

The policies are explicit and limited, rather than an optimal-play solver:

- Each runner negotiates the advance once and uses an origin-independent method suited to their chosen specialization: Chrome's choir door, Ghost's maintenance hatch, Face's service bargain or Nerve's service window. A missed service bargain/window falls back to ordinary doors. Ghost bails from a caught hatch rather than fighting the technician. Runners speak honestly with Lumen, attempt a copy, inspect and label their sources correctly when they reach the bench, and select the custody needed for their chosen goal. At Kerr they select the best visible odds among a short stated set of approaches, with specialization deciding ties; a fight continues through its actual result.
- **Sale** tries the legal original/copy delivery, ordinary sale or damaged-shard sale. A lost shard earns no invented payout. **No-sale** destroys the shard when still held; a clinic marker is received only when that authored outcome earns it. Lost and sainted openings retain their real consequences.
- Every runner earns their chosen training and visits the repair bench once. **Kit-first** buys the matching kit whenever affordable. **Care-first** buys only if the remaining money also covers a goal benchmark plus 45 creds: witness room 90, ledger 25, or anonymous lift 10. An owned clinic marker reduces the witness cash benchmark to zero. These are QA budgeting rules, not game reservations or promises that a person has agreed to anything.
- At the canal, Strain 3 or higher triggers the one available recovery visit: a legal clinic favor first, otherwise paid care if the goal benchmark remains, otherwise the free short rest. Existing standing requirements, caps, betrayal and once-only limits apply. Return shifts accepted earlier are actually completed before closing the Week.
- The witness goal uses matching preparation and the trained transfer, including a purchased harness when applicable. If unavailable, it uses the ordinary funded room or hatch. Checkpoint recovery uses an owned marker, actual room funding or the emergency desk roll. Safe arrival gets separate recording approval and files the account. A later relocation can protect a new room but cannot erase the original breach.
- The archive goal uses the matched trained methods and legitimate preparations, then a paid ledger, Spire employee-number recovery or an honest unresolved search if retrieval fails. Corroboration and digital-key authentication stay separate. Custody withholds Edda's circulating name without erasing a signed extraction or employer trace.
- The delivery goal promises private collection, takes the anonymous coin lift when affordable or public stairs otherwise, plans the matching exit and plays the trained depot task correctly. It records the observed handover and completes any owed return shift. Registration, treatment and private delivery are separate facts.
- After the goal and obligations, the policy closes the Week and speaks the memorial names. That finale is not itself counted as a goal success. These runs do not pursue every optional visit, hearing, origin favor, coolant repair or distribution task.

`eligible` in the JSON means the goal-entry choice was enabled and actually committed. The access rate and success rate among started missions have separate denominators. `missingPacket` records a run that never reached its source-dependent mission because the required prepared packet was missing. Visible unaffordable alternatives are counted once per campaign in `blockedOptions`; a disabled optional purchase is not automatically a failed objective or a softlock.

## Findings

All **43,200 campaigns completed** with zero exceptions or exceeded budgets. **40,920 started their target mission and all 40,920 met the defined goal** in this sample. Witness and archive each started in **13,260 of 14,400 runs (92.1%)**; private delivery started and succeeded in all **14,400**. The **2,280 non-starts** retained opening consequences and missing source access; they were not unaffordable later missions. The focused policies covered **80 of 197 scenes**, complementing the broader random audit and 148 authored complete routes.

Success means a protected, unexposed witness account; archive corroboration actually obtained; or a recorded private handover without recipient registration. It does not mean acquittal, perfect historical evidence, public quotation permission, treatment, every optional objective, or an independently assessed enjoyable campaign.

The clearest budget difference appears in no-sale play:

| Target goal | Care-first mean final creds | Kit-first mean final creds | Additional kit-first spending reflected in final cash | Goals achieved, each policy |
| --- | ---: | ---: | ---: | ---: |
| Witness | 102.12 | 59.72 | 42.40 | 3,315 / 3,600 |
| Archive | 112.53 | 62.65 | 49.88 | 3,315 / 3,600 |
| Private delivery | 99.91 | 50.24 | 49.67 | 3,600 / 3,600 |

These pooled figures summarize matched policy populations with the same origin mix; the JSON retains every individual cell. They are not an isolated universal kit valuation. Kits can reduce Strain, help rolled methods and serve other missions not pursued here. Care-first often retains more cash while free/earned recovery and trained methods supply the selected goal. Kit-first is a declared purchasing strategy, not a claim about average player behavior.

No tested started goal needed a price, reward or difficulty adjustment. Source-aware policies can still outperform a new player; these results do not establish that every legal choice sequence or future seed is affordable. In particular, short-rest timing, alternative collection rolls, simultaneous side work and spending on extra encounters are outside this cycle's policies.

## Player-facing improvement

At the repair bench, an earned skill now exposes a collapsed **How the [kit] fits your training** disclosure beside that kit. It explains the actual relationship:

- Signal discipline can isolate an intact archive key without a roll at Strain +1; the probe affects its listed checks rather than that method.
- The trained depot carrying task keeps its own cradle/carrying costs. A harness instead supports a no-roll witness move after successful bracing, with earned Steady hands avoiding added Strain.
- Read the room can obtain a countersigned invoice without a roll, with the logged-request consequence retained. The guide still helps escort/checkpoint checks; corroboration is not key authentication.
- The trained patrol-exit depot sequence uses decisions rather than a roll. The shroud still helps its listed scouting, retrieval and rolled crossings.

Only actually earned training supplies a disclosure. They start collapsed, use native keyboard controls with at least 44px targets, and spend nothing or change no save merely by opening. Prices, rule effects and player choice remain as before. The simulations keep their stated purchasing rules, so this UI improvement is not presented as a measured change in player choices or mission success.

The neutral repair-bench art and actual Quill portrait still fit; their explicit art decision records the review. This is written equipment advice, not a new spoken performance. Every canonical quotation, actor, voice binding, art/audio byte, scene and authored route remains unchanged. Preserve **197 scenes / 598 choices / 148 complete fixtures / 302 bindings / 290 active voices**, save version 2 and `saint-shard-3055-v1`, held dice, 1d10/caps, all four finales and evidence/consent boundaries.

## Regression guard and maintenance

The new comparison requires all 432 unique cells, compatible sampling configuration, finite consistent counters and complete ending/Hour-outcome evidence. Any failed or incomplete campaign fails. Per-cell mission access and eligible-goal success drops over five percentage points fail, with at least fifty starts required for the conditional-rate comparison. Mean final cash losses over 25 creds, mean Strain increases over 0.5, exposure or unfinished-work increases over five points, and lost sampled scenes also fail. These are declared initial tolerances, not significance tests. Source-aware branch changes require inspecting the report before approving a new baseline.

For a separate candidate, run `npm run balance:campaigns -- --record-baseline --out=/tmp/economy-candidate.json`. `--seeds=N` can produce a labeled smaller candidate, but the ordinary comparison rejects a sampling mismatch. Recording mode checks integrity and claims no historical regression result; it never overwrites the committed baseline. Review both JSON and Markdown and document any intentional differences before replacing both baseline files. CI always uses the normal 100-seed comparison.

Tests exercise reproducibility, all build/policy combinations, natural opening successes/failures and every die face, paired spending openings, exact cash conservation, complete replay through saved checks, failed-opening classification, malformed evidence and deliberately introduced local regressions. New browser checks cover every earned skill, free keyboard consultation, unchanged costs/roll history, legal purchase/reload, 320/390px layouts, text-only settings and accessibility. The prior broad and matched baselines remain required and are not reset.

The next economy study should add optional coolant/distribution work and different recovery timing to these goal policies, retaining the same separation between player strategy, access, affordability, source truth and promises.

## Candidate validation

Local verification passed **606 source tests**, TypeScript, the production build, all three balance commands and the production inventory with zero budget violations. The existing broad and matched baselines pass unchanged; the 148 authored final-state contracts remain intact. **54 focused browser cases** passed across Chromium, phone Chromium and WebKit, including earned advice for all four skills at 320/390/1440px and the preceding equipment/recovery behavior. The expanded phone disclosure was visually reviewed.

Two selected natural-dice engine runs were replayed through the complete keyboard UI using their recorded faces: Spire Face/debt, archive/no-sale/kit-first seed 3 ended at **35 creds / Strain 0**; Dustline Ghost/debt, witness/no-sale/care-first seed 1 ended at **50 creds / Strain 1**. Together they covered **105 scene visits and 28 reload checkpoints**, with **25 naturally completed selected voice playbacks** and two pagehide/resume interruptions in the illustrated phone run. Both had zero page errors or failed media. The second campaign used 320px text-only play. This verifies recorded campaigns through UI; their replay dice are directed records of sampled engine outcomes, not a separate blind natural-play study.

Four native first-visit loading samples kept the goal visible, with zero overflow/layout shift and a maximum **2,009,925 encoded resource/HTML bytes** against the unchanged **2,097,152-byte** limit. This is synthetic automation evidence, not field percentiles or physical-device acceptance. Exact-commit remote CI and production publication follow the push.
