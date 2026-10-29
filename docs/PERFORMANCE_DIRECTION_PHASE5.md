# AAA craft Phase 5: anchor-scene performance direction

Seven same-word stock-voice alternatives refine the archive, Kerr bargain and two closing performances. Nineteen complete quoted performances receive an authored-scene/context review; twelve are retained. Every original recording remains byte-identical and serves as the actual fallback for its alternative. Story text, actors, dialogue bindings, art, sound levels, saves and game rules remain unchanged. The provisional internal grade stays **8.6/10**; these source-familiar AI observations do not establish independent acting or AAA acceptance.

## Direction and selection

Edda's correction is rendered as a complete first sentence rather than separate “You have” and following fragments. Her movement-page request connects its practical clauses, then gives the limit of help a distinct pause. Kerr's agreement stays attached to his demand. The settlement connects counted facts and distinguishes the later fitting from an achieved treatment. The registered-result reply separates two observations from a refusal to erase their record. Sera's “Wait” has its own attention beat; Ives's caution is one connected practical phrase.

This is selective direction, not a universal speed increase. Unprompted word-time estimates show the movement-page/family transition changing from 0.94s to 0.44s, Kerr's “Fine”/“Put” from 0.56s to 0.38s, a settlement fact transition from 0.88s to 0.78s, and Ives's “edge”/“Keep” from 0.72s to 0.30s. Sera's attention beat grows from 0.42s to 0.54s; Kerr's treatment-boundary pause grows from 0.80s to 0.86s. Word-time estimates are an ASR proxy, not phonetic ground truth, comprehension or acting scores.

The archive introduction remains original. Its first alternative increased spacing; later candidates were transcribed with “asked” in place of “ask.” Retain the stronger established delivery rather than force another replacement. The twelve retained performances include the quieter Edda/Kerr returns and the other two closing beats.

## Retakes, alignment and art

The before pass covers all nineteen deliveries with no authored-text prompt. Seventeen normalized transcripts match; two word-timestamp runs add trailing words. Those observations remain alongside the previous phases' unchanged transcripts and are not treated as proof of audible extra words. The first eight candidates include a “you've” versus “you have” observation and pause regressions. Three same-word Edda retakes produce two matches and an introduction mismatch; a final introduction experiment also mismatches. All iterations, raw transcripts, source hashes and rejection decisions remain in `qa/media/aaa-performance-review.json`. Normalization changes case, punctuation and apostrophes only; it never expands contractions, removes trailing words or changes the story to pass.

The seven accepted transcripts match the exact authored words. Edda retains Kokoro `af_kore`, Kerr `am_adam`, Sera `af_bella` and Ives `am_eric`. Model/style hashes and existing licenses remain pinned. Phrase speed/pause authoring is explicit; conservative model-padding removal uses a threshold 60dB below each phrase peak with 80ms guards and 8ms fades. Decoded 96kbps mono MP3 deliveries target -23.5LUFS and retain at least 1.5dB true-peak headroom. Original phrase PCM, combined masters and normalized intermediates remain outside Git. No synthesis, model download, personalized name or narrator is added to gameplay or build.

Every performance example is derived through an actual authored route, retaining its full prose, actor, goal context, sound plan and original illustration/portrait/person/detail view. The fourteen previously directed stages remain appropriate. All paintings, the explicit scene-art catalog and the 163-entry gallery are unchanged; no new place, actor, quotation, action or source result needs another painting.

## Playback and fallback

`lib/performance-delivery.ts` explicitly enumerates seven alternative paths beneath `/audio/performance-direction-v1/`. Canonical ids and basenames remain stable. The loader tries the selected alternative, then its exact original once if downloading or decoding fails. Other voices, music and effects keep their preceding paths. A successfully decoded buffer enters the existing bounded LRU cache under its logical id. Replay reuses it while it remains cached, including a decoded fallback; a later cold score can evict it under the unchanged memory limit. The replay check settles the actual beds before measuring reuse, and retains the initial cold-cache assertion failure as a QA observation.

Existing queue tickets prevent a stopped or obsolete load from speaking later. A canceled decode may still populate the existing cache; it cannot restart a consumed queue. Missing both versions retains readable prose and canonical choices. Original source gains, player mixer preferences, speech duck, bed focus, inter-line scheduling, actor/quote highlighting, paragraph reveal, manual Listen/Stop, mute, zero voices and menu cancellation remain intact.

The seven additional files total **529,652 bytes**. The independent baseline in `qa/media/aaa-performance-direction.json` preserves **219 campaigns, 15,496 full visits and all 807 preceding art/audio files**. Exactly enumerated additive paths are admitted to older preservation checks; historical inventories are never rewritten or automatically extended. Original stock catalogs, their provenance and all scene/art manifests remain byte-identical.

## Complete scene-bed comparison

The [labeled stereo audition](../qa/media/aaa-performance-audition.mp3) contains seven before/directed pairs and twelve retained performances: 26 intervals over 170.33 seconds. Its [interval manifest](../qa/media/aaa-performance-audition.json) supplies actual scene/actor/words, media hashes and offsets. The complete surrounding prose and illustration decisions are retained in the phase manifest.

Both versions use the same delivered stereo music/ambience, centered voice, default sliders, source gains, speech duck and unchanged scene focus. The preview is an offline settled-gain 24kHz approximation; it does not simulate browser ramps/crossfades, network latency, physical speakers, headphones or independent perception. It is an audition artifact, not runtime media or a claim that signal matching establishes expressive quality.

## Validation and publication

Five new source checks preserve every preceding media byte, the 219-route contract and seven historical manifests; validate exact selected paths, canonical actor/text bindings, current/fallback hashes, delivered levels, final ASR and retained negative findings; and bind the audition to its actual sources. No new story fixture or synthetic outcome is required.

Independent browser cases verify actual automatic starts/natural completion at phone/desktop widths, correct quote/actor/art, actual bus gains and duck recovery, artwork changes, each original fallback, decode failures, missing both versions, all four actors' paragraph/manual/text-only controls, saved mute/zero voices, cache/replay and Stop during alternative/fallback loading. Keep the original 30-second limits, four workers and all existing native-policy exclusions and CI retry rules. Full hosted source, dependency, balance, build/budget and four-profile acceptance remain mandatory before exact-commit Vercel/live verification.

Phase 4 publication evidence is preserved separately in `qa/editorial/aaa-visual-direction-release.json`, including one unchanged hosted WebKit retry and twenty subsequent successful diagnostics. Phase 5 candidate and post-publication records remain separate; no status-only push restarts CI. Next is Phase 6: repeat whole campaigns with the unchanged craft rubric and reassess the game from the accumulated evidence.

### Measured candidate

All **881 source checks**, TypeScript, production build, unchanged budgets, all five balance audits and the dependency audit pass, with zero known vulnerabilities. The final five-test phase suite also validates the retained ASR model hashes. The production catalog retains 247 scenes, 751 raw authored choices and 219 complete routes, with 836 delivery assets. All **34 new browser cases pass in Chromium and the local WebKit diagnostic**, with four workers, original 30-second deadlines and zero retries/skips. Fresh full hosted Firefox and all other mandatory profiles remain required.

The first cache run passed 33/34 cases: its replay assertion ran while cold score downloads could evict a voice under the preceding 24MiB LRU limit. Settling both actual beds before testing cache reuse corrects that fixture assumption. No production cache size, eviction policy, deadline, worker or retry was changed. Retain this observation alongside the initial ASR mismatches and rejected introduction.

Four complete keyboard campaigns cover **321 visits, 317 reloads, 2,960 Tab steps and all four finales**. Every matched rendered story paragraph, choice, prose-to-choice gap and final resource/state remains unchanged from Phase 4. Default-policy counts remain 574 for enlarged text-only deferred work, 697 for desktop denied-contact/witness play and 760 for illustrated phone names play. The separate sound/shot-review policy remains 929 Tabs, completing 41 dialogue playbacks, 51 artwork selections and two interruption/resume checks with zero live sources after cleanup. All four report zero script/media failures and no horizontal overflow.

A separate seven-file automatic voice audit passes actual actor/text/gain alignment, natural playback, replay, Stop and cleanup with zero script/media failures. The [candidate record](../qa/editorial/aaa-performance-direction-review.json) retains source fingerprints, observations, negative findings and comparison results. Full exact-commit hosted CI, READY deployment metadata, public playback/fallback and actual public media hashes are checked after committing; their release evidence stays separate without a status-only push.
