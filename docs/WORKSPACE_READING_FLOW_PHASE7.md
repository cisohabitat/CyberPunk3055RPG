# AAA craft Phase 7: active-workspace reading flow

Fourteen archive, depot-route and public-hearing scenes now use tighter workspace framing. Record cards give their text more room; briefs, lane cards and section gaps use less padding. Every comparison, source/consent boundary, cost, warning, disclosure and canonical choice stays visible in its preceding order. Font size, line height, touch targets, voice playback and artwork remain intact. The provisional internal grade stays **8.8/10**.

## Scope and design decision

The Phase 6 review identified long active compositions, including 2,090px between prose and the choice section at the enlarged archive desk. Inspection showed that much of this space contains necessary interpretation and commitment terms. Moving controls or adding review/return links would change the existing keyboard path. This phase therefore keeps that path and compacts the existing frames. It is a bounded reading-flow improvement, not a claim to finish workspace usability.

`lib/workspace-flow.ts` explicitly lists four crafted archive scenes, four route-plan stages and six testimony stages. `PlayScreen` adds only a presentation attribute for those ids. Scoped CSS adjusts margins, padding and gaps. It introduces no timer, hidden paragraph, smaller type, forced height, clipping, new control, disclosure state, focus handler, preference or save field. Ordinary conversations, preparation screens outside this cohort, the title and finales retain their preceding styling. Old saves receive the same presentation treatment without changing their content cohort.

The archive retains all three descriptions, inspected labels and count, real free-inspection controls, issuer/ledger distinctions and actual request choices. Route plans retain entry/exit descriptions, selected lanes, departure costs, private-terms warnings and retained recipient registration. Testimony retains its complete visible source-strength and witness-permission packet, acquired-source disclosure, corrections and filing/withdrawal terms. No new scene, character speech, painting or recording is required: existing matching art, exact quotes, actor identities and original-recording fallbacks remain appropriate.

## Matched capture evidence

Four enlarged captures were measured on the preceding production build before the change, then repeated with the same route-derived checkpoints, fonts, preferences and viewport. These are dedicated all-paragraph captures, distinct from the ten complete campaign policies. The committed baseline includes whole-scene rendered text, focusable-control order, computed typography, section heights and decision distance.

| Capture | Before | After | Less vertical travel |
| --- | ---: | ---: | ---: |
| Archive desk, 320px text-only | 2,039px | 1,840px | 199px |
| Archive desk, 390px illustrated | 2,100px | 1,867px | 233px |
| Route exit, 1440px illustrated | 1,181px | 1,107px | 74px |
| Testimony hearing, 390px illustrated | 1,722px | 1,645px | 77px |

All four retain identical whole-scene text, control order, font sizes and line heights. These distances measure the prose-to-choice-section gap, not the nearest interactive control, reading speed or field performance. The remaining gaps are substantial; active comparisons and terms are still present.

Browser regression cases compare the compact view with the preceding layout in the same engine by temporarily removing and restoring only its presentation attribute. This keeps browser-specific font/innerText behavior separate from the Chromium historical captures. They require lower decision distance and identical text, typography, focus order and saves. Other cases exercise all fourteen legal checkpoints, visible source/permission terms, canonical controls and touch targets, route cost summaries, reloads, real exits and free inspection focus after paragraph reveal.

## Preservation and negative findings

The existing independent source/media contracts preserve all 219 historical campaigns, 15,496 visits and every preceding art/audio delivery. New evidence never replaces those inventories. The previous live Phase 6 release is separately retained in `qa/editorial/aaa-campaign-acceptance-release.json`, including its full CI/public results and optional build-log access limitation.

The first local Chromium run passed 18/19 new cases. Its failure assumed that a free archive-inspection button renders the same detail row as an ordinary canonical choice. Existing desk buttons instead use shared free-inspection and no-ledger/no-key terms. The corrected assertion checks those existing terms and keeps individual metadata checks for normal choices. No game text, source, choice or recording was changed to pass.

The production change edits no hook, event handler, state transition, story word, audio gain, queue, image binding, source/consent rule, die, cap or save schema. Version 2 and `saint-shard-3055-v1` remain stable. The existing four-browser gates, original deadlines/workers/native-policy exclusions, dependency/security, five balance audits, media budgets and exact-commit publication checks remain mandatory. The source-familiar proxy remains the available review method; synthetic viewports do not become physical iPhone or assistive-technology acceptance.

## Reproduction and acceptance

Repeat the ten profiles in `qa/editorial/aaa-campaign-profiles.json` with the existing `production:experience` command, keeping its exact settings, keyboard/review policy and directed dice. Compare canonical words, choices, final resources and Tab counts against the retained Phase 6 runs. Record decision-distance changes separately from unchanged behavior and retain any regression.

The acceptance command now takes an optional third positional phase number, defaulting to 6 for its preceding two-argument usage:

```bash
npm run production:acceptance -- REPORT_DIRECTORY OUTPUT_JSON 7
```

It validates fresh source-bound reports against the current code and all historical replays. Earlier raw reports retain their captured hashes; they must not be rewritten to suppress the intended stale-source rejection after a code change. Candidate evidence and hosted/live publication evidence remain separate. The full measured candidate is recorded once the ten campaigns finish; exact-commit CI and public verification follow the implementation commit.

Next is Phase 8: distribute encounter depth to a less developed build sequence, with actual counterpart wants, distinct preparation, viable refusal and failed/unfinished follow-through. Author matching fixed voices and explicit fitting scene-art decisions with any new story content. This phase's spacing savings do not automatically raise the grade.

## Measured candidate

The [candidate review](../qa/editorial/workspace-flow-review.json) and [source-bound acceptance record](../qa/editorial/workspace-flow-acceptance.json) retain ten complete keyboard campaigns: **768 visits, 571 reloads and 6,489 Tab steps**. All canonical prose, actual choices/metadata, visible summary order, final resources, dice, natural dialogue completions and artwork selections match the preceding Phase 6 runs. The sound/shot profile completes 41 dialogue performances, 51 artwork selections and two interruption/resume cycles. No campaign reports a script/media error or horizontal overflow, and every final audio cleanup has zero live sources.

Across the ten profiles, **106 observed workspace gaps decrease**; all gaps outside the explicit cohort remain unchanged. Tab totals stay 574/697/760/929 for the four preceding anchor policies, with all six additional profiles unchanged too. This avoids a new keyboard cost while reducing vertical travel; it does not measure faster reading. Full campaigns retain their remaining long active compositions.

All 881 source tests, TypeScript, production build, zero known dependency vulnerabilities, all five balance audits and unchanged budgets pass. The catalog remains 247 scenes, 751 raw choices, 219 complete authored routes and 836 deliveries. All 53 focused layout/voice cases pass in Chromium and the local WebKit diagnostic with four workers, original 30-second deadlines and zero retries/skips. Local WebKit skips host-requirements validation only; no local Firefox acceptance is claimed, and hosted normal validation remains mandatory.

The [archive before](../qa/editorial/workspace-flow-captures/before-act2_craft_archive-320.png)/[after](../qa/editorial/workspace-flow-captures/after-act2_craft_archive-320.png) and [hearing before](../qa/editorial/workspace-flow-captures/before-act3_testimony_hearing-390.png)/[after](../qa/editorial/workspace-flow-captures/after-act3_testimony_hearing-390.png) captures show the preserved enlarged typography and full information. These are synthetic viewport observations, not hardware tests. Full hosted CI, exact-commit READY metadata and public checks follow publication; preserve their evidence separately without a status-only commit.
