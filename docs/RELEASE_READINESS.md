# Phase 6, Cycle 10 — internal release readiness

The player risk is lost progress or an unexpected recorded outcome after an update. Cycle 9 also showed rising forced-GC JS heap during repeated save imports, and its first production deployment timed out before the full CI suite finished. This cycle investigates the retained objects, makes the diagnostic repeatable and rehearses recovery against two built releases.

## Evidence and implementation

Heap snapshots from the unchanged Cycle 9 game locate detached Saves dialogs behind input elements held by DevTools global handles. The [hashed diagnostic summary](../qa/release/cycle10-memory-diagnosis.json) records six controlled arms. Playwright 1.64's `_setInputFiles` creates a retargeted element handle without disposing it. Twenty-four rounds of nine imports retain 216 dialogs; DOM nodes and listeners increase by approximately 729 and 153 per round. Clearing console entries or disposing emitted console arguments does not release those handles. Selecting an on-disk file through Playwright also retains them.

Two controls exercise the same game import handler: a browser-local File/change event and actual native file input through a separately owned CDP handle. Both remove detached-dialog accumulation. The latter preserves the real file-input path and is used by the revised endurance command; its object group is released in a `finally` block. No game storage, React component or audio lifecycle fix is inferred from this debugger retention. Residual JS heap changes are measured separately; stable DOM counts do not establish a total-memory bound.

`production:audio-probe` reports nodes, listeners and document count alongside forced-GC heap and audio source cleanup. It supports sustained `imports` and an `idle` control, with optional local warm/end heap snapshots. Reports record source hashes, revision, dirty status and elapsed duration. Raw snapshots can include saved run data; keep them local and do not attach them to CI uploads. QA hooks and browser protocol code are not imported by the game.

Five immutable fixtures in `qa/release/cycle9/` are native Export run downloads from the previous public release, commit `c0b4895c3581810c9dce84c1393cd7637663a737`, deployment `dpl_5fe2MCQvkvywHWBADVhaKWXyvwUA`. They contain internal directed states imported before export: a recorded eight in the earned Chapel window and all four fully played campaign finales. They contain no participant data. Provenance records the method, capture time and SHA-256 for each download. The directed pending eight is not claimed as a naturally rolled public campaign.

`production:rehearse` starts two isolated production builds and switches an ephemeral local proxy between them. One browser context and origin retain their own storage throughout previous → candidate → rollback → candidate. No production alias or real player save is modified. At 390px and 320px/largest-text/text-only it checks:

- Every finale's complete state, costs, flags, journal, recorded dice and expandable aftermath across three switches.
- Pending eight restoration, no reroll, one committed roll/cost/allowance and a readable committed result after rollback.
- Preferences, codex and manual slots across switches.
- Corrupted autosave recovery from the valid automatic backup; recovery from a manual slot when both autosaves are invalid.
- Cancellation of slot replacement and run replacement; corrupt checksummed import leaves storage unchanged.
- Native export/import round trip and a separately labeled synthetic version 1 migration.

Previous/candidate git revisions, dirty status, build ids, relevant runtime source hashes, fixture hashes and rehearsal-tool hash are recorded. The previous worktree must match the recorded public release and be clean. Future releases should capture their preceding release into a new fixture directory and supply `--fixtures PATH`; retain Cycle 9 exports as regressions.

Production waiting now has a thirty-minute overall deadline and a ten-second status-request limit. Thirty-second polling bounds a complete wait to sixty requests, rather than 120 at the earlier ten-second interval. The release-readiness cycle measured about fourteen minutes with 648 browser checks. The investigation-navigation revision later passed 856 browser checks in 20.1 minutes and completed CI in 22.9 minutes, so the wait now accommodates the measured complete matrix. The gate still requires the exact commit's latest Test and Build to succeed; failure, cancellation, invalid/unreadable status, stalled requests and overall expiry skip publication. A response arriving after the deadline cannot authorize a build. Eight new wait tests cover that bounded behavior, including the full polling budget, stalled requests and late success. A separate regression prevents an older successful check from overriding a newer queued rerun with no start timestamp; GitHub run ids determine recency. Previews retain their existing behavior.

## Repeatable checks

Build both worktrees before rehearsing. Do not reuse a server whose `.next` directory was subsequently rebuilt.

```sh
npm test
npx tsc --noEmit
npm run build
npm run production:audio-probe -- http://127.0.0.1:PORT --minutes 10 --out qa/production/reports/imports.json
npm run production:audio-probe -- http://127.0.0.1:PORT --minutes 10 --workload idle --out qa/production/reports/idle.json
npm run production:rehearse -- --previous /path/to/built-previous-worktree --candidate . --out qa/production/reports/rehearsal.json
```

For local heap inspection, add `--snapshots /tmp/saint-shard-heap-imports` to the audio probe. Longer automated probes accept up to 120 minutes. Record actual duration and workload; an automated two-hour run still does not complete physical-device or human-fatigue acceptance. The game is a static browser application: the verified flow is native UI → engine/state → local storage/export → reload/import/render, without a server API or database.

## Internal verification and handoff

The isolated rehearsal passes 34 checks with no browser errors. Local verification passes 361 unit/replay checks, TypeScript, production build, all media/transfer budgets and six complete internal UI campaigns (465 visits, every finale and all three origins). The four directed finales exactly match the preceding campaigns. Six new browser regressions pass locally in desktop/phone Chromium and WebKit; local Firefox cannot launch its temporary profile, so the two Firefox cases remain required in exact-revision CI. Unit coverage includes immutable export hashes, all four saved finales and the old pending eight. Two browser regressions run in all four CI projects for previous-release pending recovery and exact finale import/reload. Full required Test/Build, production budgets, complete internal campaigns and public checks are required before this cycle is released. The corrected 600-second import run restores 171 states: nodes remain 158, listeners 312 and warm/end snapshots contain zero detached dialogs. All 703 sources/buffers release, peak live sources is three and final live count is zero. Forced-GC heap changes from 5,419,564 bytes after round-three warm-up to 5,620,896 at the end (201,332 bytes, about 0.19 MiB); residual growth is not a proved total-memory bound. The separate 600-second idle control stays at 138 nodes / 310 listeners and approximately 4.30 MB heap, with no browser errors. Both reports' tested source hashes match the candidate.

Final release evidence is retained in ignored `qa/production/reports/` and hosting/CI records; do not rewrite source history to insert its own commit id.

There are no new scenes, media assets, rules, outcomes or save fields in this cycle. Existing accompanying art remains suitable. Preserve the 185 scenes / 536 choices, 96 replay fixtures, four finales, 1d10, caps, version 2 and `saint-shard-3055-v1`.

The provisional weighted grade remains **7.8**, not an independently reassessed score. All six human production gates remain pending. Phase 6 internal engineering preparation is implemented; independent review and commercial release acceptance are not completed. The next quality-changing work is fresh opening/full-campaign observation and independent narrative/systems review, then revisions to evidenced pacing or build-identity problems. Directed performances, art/rights review, physical devices and manual assistive-technology review remain in the full roadmap; none is inferred from automated success.
