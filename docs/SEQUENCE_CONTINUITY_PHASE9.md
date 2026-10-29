# Sequence continuity — Phase 9

This phase reviews the flow from introduction and preparation to commitment, failure, recovery, receipt and personal return. It changes audio presentation and loading, with no new scenes, quotations, artwork, voice recordings, choices or game rules. The provisional internal grade remains **8.8/10**; Phase 10 is the separate fixed-rubric reassessment.

## Findings and changes

Two real cold-load regressions were reproduced against the preceding build. Holding `theme-quiet.flac` prevented available Spire ambience from starting; holding `ambience-spire.flac` prevented available quiet music from starting. Both failed the original five-second assertions with only the location sting audible. `setBed` now starts and crossfades each ready channel independently. The shared generation ticket, actual requested plan, Sound state and channel-volume checks still prevent stale starts. Failure of one channel leaves the other available. Fade lengths, loop points, LRU cache, decoder behavior, voice queues, ducking and native autoplay rules stay intact.

The source audit found quiet → week → quiet score changes during work at the same archive desk, and normal → intimate focus changes between its question and custody screens. It also found quiet ramp scenes returning to week music at the clinic receipt, then quiet → ward → quiet changes around Asa’s optional personal reply. The clinic freight hatch used Chapel ambience despite being a present-day stock intake.

The explicit 27-stage direction in `lib/sequence-continuity.ts` now covers:

- Eleven archive briefing/preparation/comparison/question/retrieval/custody/recovery screens, using quiet score and intimate focus only after the archive briefing. The unbriefed legacy path retains its previous direction.
- Twelve freight planning, ramp, cold recovery, intake and result screens with quiet score and normal focus. The actual intake uses clinic ambience; canal work retains canal ambience.
- Four Asa return/query/reflection screens with quiet score and normal focus.

The checkpoint, actual departures, unrelated rooms, timed pressure and original finales keep their existing direction. A soundtrack decision supplies no authentication, receipt, treatment, permission or fictional outcome. Each channel remains subject to the player's Sound switch, separate sliders and page-away pause. Existing art views and all reading/keyboard controls remain local to their established presentation.

## Art and voice review

All 254 existing scenes retain their explicit art decisions. The inspected route cohort visits 242 scenes; the twelve unvisited scene ids remain disclosed by the campaign acceptance report. The archive paintings and blank question/detail cards remain suitable for unresolved work; they do not depict a retrieved record or a restored shift. Asa’s neutral ramp, dispatch scene, portrait and courier table remain appropriate for actual custody and its separate receipt. The original memorial art and closing actor lines remain fitting when the runner recalls a personal reply privately. No distinct setting, new visible outcome or quotation is introduced, so no additional image or recording is needed.

The independent baseline pins all 231 campaigns and 16,441 visits with exact state, canonical choices, prose, visible dialogue/actor bindings, primary/earned art and portraits. It also pins every one of 827 preceding art/audio deliveries and every preceding media JSON catalog by hash. No old snapshot, script, recording, provenance, scene-art decision, gallery entry, selected voice alternative or matching transcript is rewritten. The 164-entry gallery remains intact.

Earlier visual/performance browser checks now make an explicit admission for the reviewed archive focus (.55 music/.75 ambience), retaining exact source-gain, duck/release math, quotation, actor, art, fallback, cache and Stop assertions. Their original historical focus metadata remains unchanged. The image-view controls themselves still change no bed focus. The new direction is applied by PlayScreen from explicit scope, never inferred from an image view or user’s saved state.

## Measurements and evidence

Across the same authored route edges, music changes decrease from 4,758 to 4,422 (336 fewer), and focus changes from 3,783 to 3,379 (404 fewer). The audit records 935 affected visits. These are deterministic selected-edge counts, not measured perceived smoothness, listening quality, loading bytes, reading speed or player enjoyment. Actual room ambience still changes on location transitions, including the corrected clinic intake.

The focused browser suite records complete legal free-action segments around archive preparation/question/extraction/pause, successful and stopped freight, and Asa’s return at 320/390/1440px. It verifies exact prose, primary art, costs, save/reload, real channel starts and score reuse; separate cases hold each channel, cancel late loads by leaving/muting, fail one channel, interrupt a spoken quote on scene change, and use paragraph/manual/no-art modes. Existing cinematic, visual, performance and audio-lifecycle suites remain required. Keep original case limits, four workers, retry policy and native-policy exclusions.

The preceding [Phase 8 live release](../qa/editorial/freight-craft-release.json) is separately preserved, including its first canceled CI-status-request deployment, team-access blocker and successful same-commit redeployment. Candidate and exact-commit public evidence for this phase are recorded separately. Do not create status-only commits to repush or label a candidate as live.

## Validation and next phase

Source preservation, TypeScript and production build pass before publication. Full source, security, balance, media budget and four-profile hosted checks, complete campaign comparisons and real public verification remain mandatory. Recorded timings and raw candidate observations retain their actual revision/dirty/source fingerprints. Passing automation does not establish human, physical-iPhone, blind or independent acting acceptance; the accepted source-familiar AI proxy remains labeled.

After publication, Phase 10 should repeat the unchanged weighted craft rubric, compare complete-campaign decision travel, inspect remaining long workspaces, and review enjoyment/accessibility risks against actual evidence. Preserve fixed dice, version 2/key `saint-shard-3055-v1`, original four finales and the current grade until that review supports a change.

The first full Chromium regression run passed all 186 preceding cinematic/visual/performance/lifecycle cases and 25 of 31 new cases. Six new cases incorrectly expected a top-of-scene goal to stay in view while an inspection kept keyboard focus near its control. The corrected harness retains the goal assertion on scene entry and all exact text/art/resource/bed assertions. All 31 new cases then passed in Chromium and the local WebKit diagnostic. A 29.5-second WebKit segment prompted a further split at the real question/lift commitment boundaries, preserving every action and the original 30-second/four-worker policy. The final focused cohort therefore has 37 cases; hosted normal WebKit validation remains mandatory. The original observations remain in qa/editorial/sequence-continuity-diagnostics.json.

## Measured candidate

The [candidate review](../qa/editorial/sequence-continuity-review.json), [source-bound acceptance](../qa/editorial/sequence-continuity-acceptance.json), [edge measurement](../qa/editorial/sequence-continuity-measurement.json) and twelve retained raw reports record the current UI. Ten established profiles preserve **768 visits, 571 reloads and 6,489 Tab steps**; their prose, choices/metadata, visible summary order, measured gaps, final resources and dice match Phase 8 exactly. The sound profile retains 41 natural voice completions, 51 selected artwork views and two interruption/resume cycles. Two additional freight campaigns preserve **167 visits, 165 reloads and 1,322 Tab steps**, including the zero-credit enlarged paragraph/no-art run. No campaign reports a script/media error, horizontal overflow or live audio left at completion. Bed delivery/focus changes are intentional and are not falsely required to match old audio-node counts.

All **901 source tests**, TypeScript, production build, zero known dependency vulnerabilities, all five balance audits and unchanged media budgets pass. The final focused 37-case suite passes in Chromium and local WebKit with four workers and zero retries/skips. The 186 preceding cinematic/visual/performance/audio-lifecycle Chromium cases also pass. Local WebKit disables host validation only for that diagnostic; hosted normal validation and the complete four-profile suite remain required. Catalog totals remain 254 scenes, 771 raw choices, 231 routes, 849 production assets and 164 primary artworks.

Reproduce selected-edge counts with `node --import tsx scripts/sequence-continuity-audit.ts`; provide an optional output JSON path to retain a separate observation. Reproduce complete current-UI acceptance with `npm run production:acceptance -- qa/editorial/sequence-continuity-runs qa/production/reports/sequence-continuity-acceptance.json 9`. Runtime/source fingerprints reject stale evidence; retain earlier records rather than rewriting them after code changes. Exact-commit hosted CI and public release evidence follow the implementation commit separately.

The offline audit now explicitly rejects missing authored check rolls. Its initial TypeScript optional-roll error was caught after the first implementation commit had started pushing; the follow-up corrects the tool, retains the observation, passes strict TypeScript and reproduces identical edge counts. Runtime, UI, story and media do not change in that correction. Only the final exact-commit full hosted run is release evidence.
