# Campaign pacing and media continuity — 20 October 2026

This pass reviews baseline `42edd0b8a5a701aec781ed53856d55cf41a2ee4e`. It implements the requested campaign-pacing and art/voice-continuity review using source inspection, complete authored routes, browser play and media checks. The results are development proxies, not fresh-player reading-time or independent listening/art acceptance.

## Findings and improvements

The 148 complete authored routes supply 10,477 pre-choice visits, covering 182 of 197 scenes and 432 of 598 choices. The longest reviewed routes have 95 visits; these are directed paths, not measured player session lengths. A baseline complete catalog campaign was played through the actual keyboard UI: 72 visits, 23 reloads, no page/media errors.

Kerr's entry and exit planning pauses occur before departure sets kerr_route_started. Both the canal return detector and its selected return beats incorrectly required that later state. Nineteen routes repeated Ren's family introduction, including a late-payment return. The correction recognizes an earned promise and actual saved crossings, retaining Ren's first introduction and its voice. Saved labels without corresponding flags cannot manufacture a completed plan or result. Other briefed/paused work and a settled tab also retain the short return rather than reintroducing the canal.

At the archive, the full 58-word comparison repeated after each catalog action, up to eleven visits in one route. Keep that first explanation; an open drawer now has 24 words of narration above its existing descriptions and results. Closing an inspected drawer retains a concise reminder. No description, query cost, retrieval method, evidence limitation or source-custody decision is removed.

Twenty-two scenes receive written task directions for archive work, witness transfer and the hearing. The original chapter goals remain elsewhere. Catalog directions distinguish searching, a found locator and actual retrieval. The hearing never suggests asking Nia for public quotation when her account, consent, safety or contact terms disallow that action. These directions are UI text, not invented voiced narration.

A paired comparison of all 10,477 visits finds identical saved state, selected choices, available choice definitions and artwork selections. Only two scene-prose functions change. Across repeated visits, 2,262 words and 39 duplicate Ren dialogue queues are removed; 1,502 visits receive the local task direction. These aggregate counts do not claim faster human reading or a higher game grade.

## Art and voice

The explicit scene-art manifest still covers all 197 scenes: 195 have illustrations and two chapter cards intentionally use text. Update the archive/canal rationales in the same change. Their neutral desk and resident setting fit the shortened returns; neither depicts retrieval, departure, handover, witness safety or consent. No new scene, character, quotation or visual moment requires a new asset.

Every changed passage is narration or written direction. Existing spoken quotations, actors, bindings, audio files and art deliveries remain intact. Removing a repeated introduction on a later visit intentionally removes its duplicate queue; the first introduction and its delivery remain available. Validate the current conditional plates and actual speaker portraits alongside text; a successful lookup cannot acquire an outcome painting intended for a retrieved source.

## Verification

- 675 source tests, TypeScript and the production build pass. Production reports 197 scenes / 598 choices / 148 fixtures with zero media-budget violations. All six independent commercial-acceptance gates remain pending.
- 96 unique targeted Chromium/phone cases pass across campaign reading, catalog investigation, automatic speech, conditional actors, conversation direction and campaign art. This includes the corrected-test reruns described below; overlapping reruns are not counted twice. Largest text, 320/390/1440px layouts, missing/text-only art, focus, axe checks, saved query history and correct speaker/text presentation are covered.
- Four complete keyboard campaigns pass: Names (390px, full art, whole scene: 63 visits / 16 reloads), Quiet (320px, text only, whole scene: 81 / 32), Witness (390px, full art, whole scene: 63 / 12), Listed (1440px, full art, paragraph pacing: 96 / 43). Total: 303 UI visits and 103 reloads, with no page/media failures. These campaigns are silent; voice playback is verified separately.
- The remaining 15 older/alternate scenes outside the authored-fixture coverage receive 90 explicit source/conditional samples across three origins. Their fixed quoted speech is covered. These samples are not claimed as completed legal UI routes.
- All 294 active voice files pass their existing delivery hashes and native browser audio decoding, duration and non-silent signal checks. All 306 bindings retain the expected words and actual actors. All 315 current art deliveries, including cast subdirectories and transparent branding, decode in the native browser.
- Eighteen selected clips across all 15 speaking actors complete naturally in the actual voice UI, then replay, stop and release sources correctly. Fifteen examples come from authored routes and three from seeded routes. They include exposed/relocated Nia and Lumen's revealed failed-bluff response. Transcript words, speaking portrait, playback trim, no progress mutation and cleanup pass. This is a representative runtime audition, not natural-completion playback of all 294 files.
- Visually inspected 14 current scene/conditional/finale paintings on a contact sheet and Edda's custody painting at full resolution. Their depicted situations fit the reviewed prose: a closed ledger is not authentication; receipts, repaired machinery and filing plates appear only under their authored outcome conditions. No additional continuity defect was confirmed. File decoding and these visual samples do not establish independent whole-campaign anatomical or artistic acceptance.

The initial targeted run passed 87 cases and failed nine assertions: six expected unchanged catalog prose that this phase deliberately shortens, and three new selectors confused a scene plate with a portrait. The updated catalog assertions preserve source distinctions, saved costs/history, accessibility and retrieval checks. Targeted reruns cover all nine cases successfully. A second test-only custody expectation was also corrected to the existing Edda archive plate. No rendering, permission or gameplay behavior was changed to satisfy these test mistakes.

The voice-audition script also needed to scope its controls to the active restored-check dialog, because its background scene voice widget stays mounted. Before that correction the Lumen check-result audition selected two transcript summaries; afterward all 18 selected clips passed. The initial launch without the local Chromium executable failed before playback and was rerun with the installed browser path.

The [committed aggregate evidence](../qa/editorial/campaign-media-review-2026-10-20.json) records the tested source hashes, paired counts, route profiles, clip ids and limitations. Raw synthetic states, logs and screenshots remain outside Git under `/tmp/campaign-*`. Existing exact-commit hosted Test, all four Browser profiles and Build remain required for publication. All previous media provenance and historical review snapshots are preserved.

Save version 2, saint-shard-3055-v1, 1d10/stat/strain caps, costs, failure recovery, held rolls, journals, source custody, recording/public consent and all four finales are unchanged.
