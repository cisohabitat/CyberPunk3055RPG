# Code refactor before Phase 22

The play screen combined paragraph progress/focus, quote rendering, audio-bed effects and campaign decisions. Audio direction also shared a module with the Web Audio cache and sources, and pure resource effects lived beside choice authorization. Separate these responsibilities so subsequent performance and story work has a smaller area to change.

| Responsibility | Owner after refactor |
| --- | --- |
| Local paragraph progress, reveal and reading focus | `components/useSceneReading.ts` |
| Exact paragraph nodes, quote offsets and spoken highlighting | `components/SceneNarrative.tsx` |
| Bed activation, location cue and unmount cleanup | `components/useSceneBed.ts` |
| Read-only scene mood, district and location-cue selection | `lib/scene-sound.ts` |
| Pure resource, inventory, flag, journal and faction effects | `lib/state-effects.ts` |
| Canonical legal choices, held checks and commitment | `lib/engine.ts` |
| Audio buffers, cache, gains, cancellation and playback | `lib/sound.ts` |

Existing `sound` and `engine` exports remain available. The effects and scene-direction functions move without rewriting their bodies. React hooks retain local state and independent lifetimes; no new shared store, provider, dependency, deferred start or timer is introduced. The narrative component adds no HTML wrapper and preserves paragraph ids, keys, text, classes, highlighting and focus targets. Scene entry scrolling and modal/choice ownership remain in the play screen.

No scene, quotation, actor, painting, recording, style, economy rule, save field, media preference, default volume or reading default changes. Existing artwork and voice remain aligned; this phase needs no replacement media. The provisional editorial grade stays 9.0 (8.975 weighted); code organization earns no automatic craft increase. Phase 22 remains the bounded Mara/Edda performance pilot.

## Before/after contract

Before editing runtime code, capture [the independent baseline](../qa/editorial/refactor-baseline.json) from main `dfe0948`. Its actual dirty flag includes the newly added offline capture tool, not a runtime change. It exercises all 289 route fixtures / 20,681 visits / 12,944 requested save round trips, including exact state, text, choice metadata, dialogue/actor, illustration/portrait, scene sound plan and location cue. It also hashes all 874 art/audio files and every historical media manifest. The [candidate preservation result](../qa/editorial/refactor-preservation.json) must match the complete contract exactly. Source trees recorded there identify the actual invocation HEAD; candidate working-tree edits are represented by its dirty flag, not relabeled as a future commit.

```bash
node --import tsx qa/production/refactor-contract.ts /tmp/fresh-before.json
# Make the refactor, then capture into a different, unused path:
node --import tsx qa/production/refactor-contract.ts /tmp/fresh-after.json /tmp/fresh-before.json
```

The tool rejects overwriting prior evidence. Its recursive route replay complements continuous browser campaigns; 255/264 source scenes and the previous 209-id browser union remain distinct coverage measures. It does not prove every scene is currently reachable, acting quality or physical-iPhone behavior.

## Verification and publication

Require all 1,002 existing source tests, TypeScript, the production build, dependency audit, all five original balance audits, catalog/media budgets and four first-visit loading samples. Run the existing focused reading, scroll, highlighting, audio-lifecycle and performance suites with original deadlines and assertions, plus all 74 continuous campaign profiles with their current-creation versus supported-save setup labels intact. Fingerprint the five extracted runtime modules in the campaign driver as well as the existing source files.

Keep the complete 7,312-case hosted inventory / 1,828 per project, six original native-policy skips, four workers, existing one CI retry, exact-commit release gate and both READY production aliases. Failed attempts must remain separately recorded; do not relax assertions, timeouts, retries, skips, budgets or save validation to admit this refactor. Update README and AGENTS in the same substantive change. Fresh public checks and campaign evidence follow the final tested commit; do not represent candidate observations as post-deployment proof.

The preceding Phase 21 final ignored release proof and 25 final raw public reports were outside Git and are absent from the restored workspace. Its committed 74-profile review and original diagnostic archives remain intact. The earlier final summary is not a replacement for those missing raw files; any recovered provider metadata must be labeled separately. Fresh refactor evidence is recorded under its own namespace.

## Candidate checks recorded before publication

All 1,002 source tests, TypeScript, the production build, zero-known-vulnerability audit, five balance audits and production catalog/budgets pass. The 126 focused Chromium cases pass at four workers with zero retries. Four native first-visit loading samples remain below 2 MiB, with zero layout shift/overflow, visible goals and no artwork requests in text-only mode. These are synthetic host measurements, not field performance or physical-device acceptance.

The complete inventory remains 7,312 / 1,828 per project; every existing browser test and workflow is unchanged. Local browser installation reports missing native WebKit host libraries, retained in the [lossless check logs](../qa/editorial/code-refactor-checks/index.json); no local WebKit result is claimed. Hosted native Firefox/WebKit and full exact-commit publication remain required.

[The final source-bound preservation capture](../qa/editorial/refactor-final-preservation.json) matches the independent baseline. [Moved-code hashes](../qa/editorial/refactor-moved-code.json) verify byte-exact function bodies. [Recovered preceding provider metadata](../qa/editorial/refactor-preceding-provider-metadata.json) confirms the 22 successful preceding jobs and READY production revision; it does not recreate the missing raw live reports. All 74 fresh continuous campaigns and the refactor's hosted/public gates remain separate from these completed candidate checks. Retain their actual raw metadata and final ignored proof with the next substantive change, without a status-only push.

## Complete candidate campaign acceptance

All 74 fresh continuous keyboard campaigns pass [the strict comparison](../qa/editorial/refactor-campaign-acceptance.json): exactly 5,517 visits, 5,103 reloads, 45,716 Tab steps, 531 natural dialogue completions, 51 selected art views, 18 ordinary art views and 28 interruptions. Complete prose, canonical controls/order, measured decision gaps, panels, artwork controls, final resources and all gameplay media remain exact against the accepted Phase 21 reports. The existing native title request-set exception is disclosed individually only when both initial observations contain the theme; no request-count equality is claimed. All runs have zero recorded script/media failures, overflow or live audio after cleanup.

[All 74 raw JSON reports](../qa/editorial/code-refactor-runs) retain their actual `dfe0948`/dirty invocation and extracted-source hashes. [The archive map](../qa/editorial/refactor-campaign-archive.json) binds their original local paths to tracked byte hashes; the diagnostic PNG paths embedded in those reports are local-only and are not claimed to be committed. Browser versions and setup kinds remain recorded separately. The 209-id union still combines 14 current-creation profiles with 60 supported preceding-save profiles; it does not establish 209 current-creation scenes or exhaustive reachability.

The remaining exact-commit hosted and public verification is deliberately separate. Final ignored release proof and fresh public raw reports belong to the next substantive archive, without restarting CI for a status-only commit.
