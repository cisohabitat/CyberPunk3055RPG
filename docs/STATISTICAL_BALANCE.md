# Repeatable gameplay balance audit

The game now has a required natural-dice balance regression audit in addition to the 900 seeded completion checks, 148 authored full-campaign fixtures and [36 directed build comparisons](BUILD_BALANCE.md). It establishes an initial measured baseline; passing it means the sampled behavior has not regressed beyond the stated limits. It does not certify that the baseline is ideally balanced or raise the provisional 8.2 grade.

## Run and inspect

```bash
npm run balance:audit
```

The command compares the current engine with committed `qa/balance/baseline.json`. It writes aggregate JSON and a readable Markdown report to `qa/production/reports/balance/current.json` and `current.md`. An alternative destination is supported with `--out=/tmp/balance.json`; a reviewed alternative baseline can be selected with `--baseline=PATH`. Unknown arguments, unavailable/malformed evidence and incompatible sampling configurations fail the command. It never replaces the baseline automatically.

CI runs the command unconditionally in **Test**, after source tests and before the existing Browser jobs. An audit failure fails Test and blocks the existing production gate. JSON/Markdown evidence is uploaded as **gameplay-balance** for thirty days, including failed runs when a report was produced. Every existing browser, performance, audio and build requirement remains in place.

## Sampling method

- Three origins × four two-point specializations × four complication settings (none, debt, optic, on-file) × two policies × 200 seeds = **19,200 campaigns / 96 cells**.
- No complication is an engine-supported control; the current creation screen requires an explicit complication. Those control rows do not represent that screen's new-player build selection.
- Each campaign starts through real character creation at the prologue with its actual initial money and Strain. Every action is an enabled canonical engine choice. No money, gear, training, permission or evidence is injected; no state is loaded from a directed successful fixture.
- **Uniform** selects among enabled choices with equal probability. **Specialist** gives a matching-stat check or matching training choice weight four, and every other enabled choice weight one. It sees the currently available check stat, not future outcome/effect information. It does not optimize purchases, preparation, source interpretation or recovery, and may leave optional work unfinished.
- Selection and dice use separate seeded Mulberry32 streams. Origins, complications and policies have different stream salts. Within a stratum, all four specializations share streams to aid comparison. Branches can diverge, so the nth roll need not occur at the same encounter. Related campaigns and repeated checks are not independent participant samples.
- Each checked action draws a uniform pseudorandom integer from 1 through 10, then calls the real resolver. A 1 may succeed when the total meets the difficulty; a 10 is not an automatic success. Critical Strain adjustments retain their normal rules.
- A campaign must reach one of the four original finales within 300 committed decisions. A missing continuation, exception, invalid resources or exceeded budget is reported with build, policy, seed and last scene. A budget overrun signals investigation, rather than proving a softlock.

The JSON records per-cell check counts, successes, expected successes from actual check previews, final resource totals, decision counts, zero-cash/high-Strain decision counts, money-blocked options, ending distributions and three separately earned outcome flags. `publicAccount` means `testimony_published`; `orderVerified` means corroboration, not digital-key authentication. Encounter-level counts and the ten-face histogram support diagnosis. Reports contain aggregates, no player identifiers, save states, telemetry or automatic uploads from the game.

## Required regression limits

Each cell is compared only with its own recorded origin/specialization/complication/policy. Rates use their explicit denominators; final-resource and pacing means use completed campaigns. Different origin starting balances are never treated as equivalent.

| Measurement | Fails when |
| --- | --- |
| Campaign integrity | Any campaign fails or any cell is incomplete |
| Evidence integrity | Missing/duplicate cells, incompatible configuration, invalid/nonfinite counts, inconsistent roll/check totals or incomplete baseline |
| Observed check success | Drops by more than 5 percentage points in a cell with at least 100 checks in both runs |
| Expected check success | Same 5-point limit using preview odds for the sampled states |
| Frequently sampled encounter odds | Expected success drops by more than 5 points, with at least 200 attempts in both runs |
| Zero-money decision share | Increases by more than 10 percentage points |
| Strain 4–5 decision share | Increases by more than 10 percentage points |
| Money-blocked option share | Increases by more than 10 percentage points of visible options |
| Mean final money | Falls by more than 25 creds |
| Mean final Strain | Rises by more than 0.5 |
| Mean campaign decisions | Rises by more than 25% |
| Check sample size | Falls by more than 20% in any cell |
| Previously sampled coverage | Any previously sampled scene or choice disappears |

These are deliberate initial regression tolerances, not statistical significance tests or independently validated fairness targets. Fixed seeds make unchanged code reproducible without random CI flakes. A changed branch can alter subsequent samples; diagnose the report before changing a baseline. Improvements in one build cannot average away a regression in another. Per-encounter odds checks reduce masking by easier checks elsewhere, but sparse encounters remain explicitly listed without a rate gate.

The Markdown report flags check-success spreads over ten percentage points between specializations within one origin/complication/policy. These flags require review and do not fail CI: builds encounter different checks and costs. Success rate alone cannot establish a dominant strategy. Neither a particular finale nor a witness/publication choice is universally scored as winning.

## Initial findings

The [recorded baseline](../qa/balance/baseline.md) completed **19,200/19,200 campaigns**, resolving **116,129 checks**, with **76,448 successes (65.8%)**, no progression failures, and all four original finales reached. It sampled **190/197 scenes and 550/597 choices**. The seven scenes, 47 choices and low-sample checks outside rate protection are listed in the report; completing a random campaign does not exercise every optional mission.

Spire specialists show an **11.2–13.0 percentage-point** success spread, with Chrome ahead under this policy. Spire's Chrome base/perk, chosen encounters and differing check mix all contribute. This is the first focused follow-up target, rather than evidence to immediately weaken Chrome or inflate other stats. A fair follow-up should compare the same mission objectives, trained methods, actual equipment costs and failure recovery across builds with natural dice.

Only 543 runs ended with `witness_safe`, 683 with `order_verified`, and 669 with a filed hearing account. These are observed optional outcomes under non-goal-directed policies, not objective-attempt success rates. Do not report the remaining campaigns as failed witness or investigation attempts. Separate directed campaigns continue to cover deliberate investigation, resource-poor recovery, purchases and permission-sensitive paths.

## Baseline review and maintenance

For an intentional rules/content change, first run the ordinary audit and inspect every regression and coverage loss. Produce a separate candidate only after understanding the differences:

```bash
npm run balance:audit -- --record-baseline --out=/tmp/balance-candidate.json
```

This mode checks campaign/evidence integrity but makes no historical regression claim. Review its JSON/Markdown against the preceding committed baseline, record the gameplay reason in the change, and explicitly copy the reviewed JSON and readable report to `qa/balance/baseline.json` and `baseline.md`. Never use it to hide an unexplained failure. CI uses only the normal comparison command. Sampling algorithm, policy, population or budget changes require a documented baseline review, rather than silently comparing incompatible measurements.

The automated tests exercise deterministic/legal sampling, every build/policy cell, random-stream distribution, malformed evidence, seeded progression failures, localized success loss, per-encounter odds loss, cash/Strain pressure, pacing and lost coverage. They deliberately corrupt aggregate samples to show that the gate fails.

No campaign rule, story line, actor, quotation, art binding, audio delivery or save format changed in the initial audit cycle. The subsequent [matched-objective comparison](MATCHED_MISSION_BALANCE.md) adds exact weighted mission checks and a ninety-creds checkpoint recovery choice. The original broad baseline remains; the new 19,200-run sample still passes its limits with 190 scenes / 551 choices sampled. Existing artwork and voices continue to match their scenes. Preserve the four finales, 1d10, stat/Strain caps, save version 2 and `saint-shard-3055-v1`.
