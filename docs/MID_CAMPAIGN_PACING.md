# Mid-campaign pacing and choice review

Baseline: published `3276e7d831bc456c290c6209e28d73101c10d908`. Three complete keyboard campaigns were played before application changes. These are source-familiar AI/automation proxy playtests with authored decisions and directed dice, not blind human comprehension or enjoyment measurements.

| Profile | Route and viewport | Baseline result |
| --- | --- | --- |
| Careful investigator | `integration-names`, 390px, enlarged/high-contrast/full art | 63 visits, 426 Tab steps, 16 reloads; Said Aloud; 390 creds / strain 2 |
| Money-first opportunist | Explicit canonical route: sell the hour, give Ives the copy, sell the week, hand over the memorial; 1440px/full art | 31 visits, 264 Tab steps, 30 reloads, 18 natural voice plays and one pagehide/resume interruption; On the Folio; 470 creds / strain 0 |
| Failure-heavy survivor | `witness-known-room`, 320px, enlarged/high-contrast/text-only | 63 visits, 371 Tab steps, 44 reloads; On the Folio; 180 creds / strain 5; exposed witness and withdrawn hearing |

All three reported no script/media failures, horizontal overflow or held-roll mismatches. The money-first route is replayed through legal canonical choices; it is not an invented outcome or a new game path. Baseline reports/captures are under `/tmp/saint-midcampaign/`; compact candidate evidence records their hashes separately from later release evidence.

## Findings and response

The dry canal was the weakest shared mid-campaign decision point. The investigator returned five times and the survivor four times. These runs encountered 9–10 enabled choices and 413–850px between prose and the choice container, including repeated history controls. These are rendered layout measurements at the stated enlarged profiles, not reading times. The shorter opportunist reached the same hub once with five choices and 255px of context. Story paths remained distinct: the investigator gained a public account, the opportunist kept cash and handed over the memorial, and the survivor retained breaches and correction history. There is no evidence here for changing their prices, rewards or source rules.

The focused change improves access to those existing decisions. Campaign history and the most recent choice receipt now follow the choices only at the canal, preserving full records without putting them between the current scene and next action. The current next-step advice stays above the choices. A closed-by-default **Find a thread** guide inside Your next move provides three explicit topics: sources/neighborhood response, witness/clinic care, and people/work/promises. It lists only enabled canonical work. Selecting a Find link moves focus to that actual choice for cost/consequence review; it never commits the choice or spends a resource. Closing the week remains its own visible decision and keeps all unresolved-promise warnings.

No choice is hidden, reordered, relabeled or newly enabled by the guide. Original numbers, metadata, unavailable reasons, numeric shortcuts, partial reading, art preferences and saves remain. No automatic recommendation chooses a faction or moral position for the player. Review links add optional navigation controls; Tab counts and layout results must be measured rather than assumed to improve for every route.

## Art, voice and preservation

There is no new scene or performed character line. All canonical paragraphs, choices, actors, art deliveries, quotations and voice bindings remain unchanged. The existing canal painting and Ren's attributed dialogue still match the scene. Guide labels reuse actual action labels and do not belong in the character transcript. No additional art or recording is needed for this navigation change. Full historical route/media contracts and actual voice completion checks remain required.

## Validation

Source guards enumerate canal actions exactly once, keep the two closing choices separate, and exercise every top-level authored campaign without changing state or choice metadata. Thirty-one independent browser cases per project cover three canonical checkpoints at phone, desktop and enlarged text-only sizes: nine structure/history cases, twenty-one individual-topic navigation cases and one paragraph/number-shortcut case. They verify closed-by-default behavior, every Find link's focus and save invariance, canonical button order/labels/details/disabled state, relocated complete history, accessibility, no overflow, reload and actual choice commitment afterward. The initial eighteen Chromium/WebKit cases passed, but one complete multi-topic case took 30.5 seconds including its fixture lifecycle. Navigation was split into independent topic cases before publication, retaining all assertions, the normal 30-second limit, four workers and zero local retries. All sixty split Chromium/WebKit checks passed; the two additional paragraph/shortcut checks are recorded separately.

## Measured candidate comparison

The same three complete routes were repeated after the layout change. All 157 visits preserved the exact rendered canonical text and actual choice metadata/order. Final resources, recorded dice and endings matched; 90 reloads, 18 natural voice completions and one interruption/resume passed again, with no reported script/media errors or overflow. Prose-to-choice-container distances at the canal changed as follows:

| Profile | Before → after, per canal visit | Baseline → candidate Tab steps |
| --- | --- | --- |
| Investigator | 834→604, 682→547, 593→459, 512→282, 413→184px | 426→469 |
| Survivor | 850→682, 774→606, 802→634, 802→634px | 371→405 |
| Opportunist | 255→143px | 264→278 |

This places the decision container 112–230px closer to the prose in these profiles. It does not measure reading speed or the first button's exact position: the new optional guide is inside that container. The harness deliberately opens campaign history before choosing on every visit; moving history below the choices adds backtracking and Tab steps under that policy. That keyboard cost is retained as a tradeoff, not described as an improvement. Dedicated keyboard cases verify the direct Find links for players who want a specific task. This release reduces repeated context before decisions; it does not remove the repeated canal narrative or claim that every player will prefer the layout.

All 814 source tests, TypeScript, production build, dependency audit (zero known vulnerabilities) and production budgets passed locally. No new story/media bytes were introduced. Full hosted and live results belong in the separate release report.

Source/security/balance/production budgets and all full four-profile browser shards and acceptance checks remain mandatory, followed by exact-commit production readiness and live verification. Candidate results and release observations are recorded separately. No new AAA grade or independent player acceptance is claimed.

Further narrative pacing work should author genuinely changed return conversations, with matching voice/art decisions, rather than merely shortening or replaying the same briefing. That remains separate from this measured hub-navigation change.
