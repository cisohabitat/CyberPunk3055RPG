# Phase 6: campaign integration and payoff

Baseline: published `dcf728a3ea113c2e488fb06f9bdebe9c0ed096e3`. This phase connects existing investigation systems and their consequences without adding another sequence of errands. It preserves all four finales, scene scripts, cast bindings, media, rules, resources, dice and version-2 saves (`saint-shard-3055-v1`). It promises no review score.

## Cycle 1: one causal record

`lib/campaign-thread.ts` derives a bounded, read-only record from the current save. It connects:

| Thread | What the player can explain | Boundary retained |
| --- | --- | --- |
| The hour | Archive custody or bounded account and current corroboration | Authorization, cancellation and authenticated issuer differ |
| Case | The chosen claim, current source test and retained earlier reviews | A changed draft is untested; old reviews supply no new truth |
| Archive plan | Objective, approach, contingency and actual stage | Carbon/recovery records corroborate; an objective does not authenticate |
| Disclosure | What Edda received, how the depot changed, what Kerr was told and answered | No assumed private knowledge, forgiveness, restored shift or inquiry finding |
| Specialist method | Actual method, signatures, effort, wage waiver, intake or failure | Review intake is not acceptance or authentication |
| Witness | Transfer, exposure, deferral, approved account and quotation terms | A room, recording and permission to publish are separate |
| Hearing | Filed or withdrawn account and retained correction | Memorial speech does not publish a withdrawn hearing draft |

Only acquired/reached systems produce rows. No source is invented for a legacy run without a case file, plan or specialist method. There is no relationship-score inference, automatic disclosure, new telemetry or export field. A failed paused request switches to closed-week wording when `act2_done` is recorded. Source tests are recomputed against current acquired records; saved reviews retain their historical labels.

## Cycle 2: review at the decision and at the ending

`components/CampaignThread.tsx` appears at exactly `card_week`, `act2_middle`, `card_wall`, `act3_neighborhood`, `act3_arrival` and the four explicit original finales. Native details keep the review optional. Its scene key closes it between checkpoints. The existing scene, goal, art, voice, commitments, factual aftermath and illustrated chapter recap remain available.

At playable checkpoints, a deliberately bounded set of follow-up links is intersected with the actual enabled canonical choices. Enter on a link focuses and scrolls to that existing choice for review; it never calls the engine or resolves a roll. A second explicit selection is required to act. Unavailable and future unknown choices produce no link. No terminal choice, new ending or guessed future route is suggested.

This is written review UI, with no character quotations. There are no new scenes or new visual moments, so existing matching artwork and recordings are reused unchanged; the standing scene-art inventory receives no fabricated new scene. Text-only, enlarged text, reduced motion, whole-scene and paragraph pacing remain independent. Controls have at least 45px targets and native keyboard interaction. No hooks, effects, timers, fetched data or external state are added to the review.

## Preservation and validation

Before implementation testing, the full preceding engine/content/routes/media catalogs were archived from Git at `dcf728a` to `/tmp/saint-thread-baseline`. The QA-only collector then recorded every initial, decision and final visit across all 164 existing routes, including native restore on authored reload steps:

- 11,924 visits, full state, serialized available-choice metadata, prose, visible actor/text bindings and selected default/earned artwork.
- SHA-256 `9e00acca95f3234b5721a55f05ab68af1937ff26be95d653e6068e6de173d7cc` over ordered JSON lines.
- `lib/campaign-thread.test.ts` independently reruns that contract against current code. Existing Phase 1–5 state/media snapshots remain unchanged and required.

Four extra integrated campaigns use an actual zero-creds checkpoint from `scarce-archive-open`: challenge an unsupported issuer claim, correct it to a source limit, test it, follow its canonical archive lead, save a plan, commit setup and execute a real reader/carbon method. Outcomes cover reader authentication, carbon corroboration, failed withdrawal and failed paused recovery. Each continues through the week and wall to the original quiet finale. Every committed step round-trips through native export/import; no flag, resource, stat or source is fabricated to unlock a path. These are QA compositions over an existing route, not replacements or edits to the 164 fixtures.

Other checks cover deferred recording when the week closes, specialist abandonment and failure, Face wage waiver, Kerr's denied introduction, changing an already-tested draft, public permission and held dice. Browser checks cover twelve checkpoint/ending profiles at 390px, 1440px and 320px enlarged/text-only, actual keyboard follow-up focus and subsequent explicit selection, accessibility, source/prose/save immutability, and natural voice continuity while the review is open. The keyboard campaign harness now opens/closes each reached review and checks that it does not mutate the run.

## Release procedure and limits

Local validation evidence is recorded in `qa/editorial/player-led-phase6.json` after checks finish. Publishing requires the unchanged full hosted Test, four Browser jobs and Build for the exact commit, Vercel READY for that commit, public feature checks and delivery verification. Record post-publication evidence separately under `qa/production/reports/player-led-phase6-release.json`; carry it into the next substantive change rather than creating a status-only CI restart. Earlier Phase 5 publication evidence is preserved in `qa/editorial/player-led-phase5-release.json`.

The tests are internal authored AI/automation proxies. They do not establish blind-player comprehension, physical iPhone acceptance, independent listening quality or a 9/10 production grade. This phase makes the campaign's existing choices easier to connect and explain; it does not claim new character performances or resolved fictional inquiries. Further production work should be driven by observed comprehension and interaction problems, with broader new content scoped as a new roadmap rather than silently extending this six-phase program.

## Local candidate result

All 765 source tests passed, including twelve new integration/contract checks. The final production build and TypeScript check passed. All 39 new browser checks and 50 existing archive/depot/build/finale checks passed. The first local browser run identified a missing intermediate heading and a premature-permission test assumption; both were corrected with the original assertions and release limits retained. Six final viewport/state reviews passed with no overflow or save change.

All required balance audits passed and the dependency audit reported zero known vulnerabilities. Four first-visit production samples remained below the unchanged 2,097,152-byte budget (maximum 1,642,446 bytes), with visible goals and no overflow. These are synthetic resource measurements, not field performance percentiles.

Two complete keyboard campaigns passed: Face/cosign build (83 visits, 577 Tab steps, 32 reloads, silent) and witness permission (61 visits, 410 Tab steps, 12 reloads, 33 natural voice plays and two interruption/resume checks). Neither reported script or media failures. They used candidate source before the final review-label/cost wording; the final browser run and screenshots cover that wording. Hosted exact-commit checks and public verification still gate publication, recorded separately as described above.
