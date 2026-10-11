# Player experience validation — report response phase 2

This phase makes complete keyboard campaigns, natural voice completion and sustained audio checks repeatable. It adds internal technical evidence to the [player validation checklist](PLAYER_VALIDATION_CHECKLIST.md). Fresh-player research, listening review, manual screen-reader checks, physical-device testing and commercial acceptance remain separate. The provisional internal grade remains 7.8 and all six [production gates](../qa/production/acceptance.json) remain pending. The supplied report and its response remain outside this public checkout.

## Flow being verified

A player configures readability and sound, creates a runner, reads and selects story actions, restores recorded checks, reaches a finale and reviews its aftermath. Browser actions update the canonical engine state and local save; optional media requests return static files. There is no gameplay API or remote player database. Sound and settings must never change saved dice, costs, commitments or permission history.

## Complete keyboard campaigns

`npm run production:experience -- URL` starts from the title and uses actual browser Tab/Shift+Tab order, Enter, Space, arrows and typing. It does not click, programmatically focus, fill inputs, select options through an automation API or invoke number shortcuts. Fixtures guide the route and dice; these are directed regressions, not blind-player observations. Earlier controls are reached backwards instead of wrapping through browser chrome, where page-directed automated keys may not return to content in Firefox.

```bash
npm run production:experience -- http://127.0.0.1:PORT \
  --route qa/routes/integration-names.json --width 320 \
  --artwork none --reading paragraph \
  --out qa/production/reports/keyboard-names.json

npm run production:experience -- http://127.0.0.1:PORT \
  --route qa/routes/integration-quiet.json --width 390 \
  --artwork full --reading all --sound \
  --out qa/production/reports/keyboard-quiet.json
```

Run the integrated Witness and Listed fixtures as well for all four finales and all three origins. Every authored reload checkpoint is honored. A recorded die is reloaded before commitment; every committed state must equal the canonical engine result. Paragraph reading reveals text with keyboard controls. Sound-enabled profiles complete selected clips naturally, exercise pagehide/Resume sound twice, compare exact saves and finish with all sources stopped and buffers released.

The first title uses default illustrated preferences. Record its requests separately: after the player selects text-only artwork, the campaign and reloads must make no artwork requests. Silent campaigns must request no audio. Inspecting a source can scroll within the same scene; assess initial goal position on entering a different scene without defeating useful source focus.

The 11 October local baseline checks reached Names at 320px, Quiet at 390px, Witness at 1440px and Listed at 390px: 307 scene visits, 108 reload checkpoints and no observed page exceptions, failed media or horizontal overflow. All used largest text, high contrast, reduced motion and disabled number shortcuts. These observations apply to runtime `4aa40a2`; carrying them to a later QA/documentation-only commit requires unchanged runtime source identity. They are not human completion times or universal accessibility certification.

## Selected voice validation

`npm run production:voices -- URL --out qa/production/reports/voices.json` finds reachable examples for every selected quotation by replaying authored fixtures. Separate disposable contexts restore those directed states; they are not counted as completed campaigns.

Each clip must stay silent before Listen, match visible dialogue and its expanded transcript, complete naturally and release its source while the two beds remain. Cached replay requires a second explicit activation, makes no duplicate file request and stops immediately. Sound off must dispose every source and clear its buffer. Listening leaves saves byte-for-byte unchanged. Failure of all media must still leave readable dialogue, choices and saves usable.

The local baseline passed all fourteen selected clips. This establishes technical activation, transcript parity, completion, cancellation and cleanup. Intelligibility, pronunciation, musical masking, expressive delivery, startling levels and fatigue require independent headphones, speakers and phone sessions. Do not score those qualities from successful playback.

CI starts a PulseAudio virtual null sink before the browser matrix. A device-free Firefox runner can create/start sources without advancing its audio clock, so it cannot verify natural ended cleanup. The null sink provides a clock while discarding output; no speaker, physical hardware or human listening is represented. Do not skip or weaken the ended-cleanup assertions to accommodate an unprovisioned runner.

## Endurance protocol and evidence identity

Run active and idle controls against the same immutable production build in separate profiles:

```bash
npm run production:audio-probe -- http://127.0.0.1:PORT \
  --minutes 120 --out qa/production/reports/audio-active-120.json
npm run production:audio-probe -- http://127.0.0.1:PORT \
  --minutes 120 --workload idle \
  --out qa/production/reports/audio-idle-120.json
```

Do not rebuild the serving checkout during either probe; build verification can use a separate worktree. Preserve URL, revision, dirty flag, source hashes, requested and actual duration, rounds, restores, heap/DOM/listener series and cleanup counts. A duration flag alone is not completed endurance evidence.

The active workload cycles nine real authored sound plans through native save import, applicable voice cancellation, pagehide and explicit resume. Idle restores once and leaves the beds running between samples. Both end with Sound off, zero live sources and matching created/disposed/buffer-cleared counts. Native file-input debugger handles are explicitly released so automation retention does not resemble an application leak.

Compare warmed and late samples with the idle control; initial JIT/cache growth alone is not a leak. Investigate sustained growth, detached dialogs, increasing listeners, failed saves or response failures. Forced-GC JS heap excludes native audio allocations and resident memory. A two-hour cloud run does not establish physical-device, human-fatigue or population-percentile acceptance. Keep raw saves and heap snapshots local. Scripts do not upload their ignored `qa/production/reports/` outputs; CI artifact publication is a separate workflow.

## Coverage and remaining evidence

`tests/experience-validation.spec.ts` adds four cases to the browser matrix: natural voice-ended cleanup, total media failure, actual-Tab narrow creation/entry, and expanded sources/native dialogs at 320/390/768/1440. Twelve focused local Chromium/phone/WebKit checks pass. Existing mixer and interruption regressions remain required.

Reconcile coverage without rewriting historical observations:

| Checklist area | Internal evidence | Still required |
| --- | --- | --- |
| B-07, G-01–09, G-12, G-14 | Keyboard creation/full campaigns, narrow layouts, expanded sources and native isolation | Hardware/manual access review; routes outside tested campaigns |
| G-10–11, G-23–25 | DOM order, goal position and representative automated scans support review | Complete reading-order and manual announcement/description assessment |
| H-12–23 | Mixer/interruption regressions, natural clips, media failures and full audio campaigns | Actual app/tab switching and device-specific behavior |
| H-24–30 | Technical playback only | Human listening and independent craft review |
| I-06–12 | Candidate-bound active/idle reports after actual two-hour completion | Native memory and long physical-device sessions |
| F-23, K-12 | Local previous-release/candidate/rollback rehearsal passed 34 checks for `4aa40a2` | Hosting/support sign-off; identity reconciliation after runtime changes |
| H-11, J, production gates | No new rights or participant evidence | Permission records, consented fresh cohorts, independent reviews and launch responsibilities |

Partial coverage is not a global pass or automatic grade increase. Keep the source report unchanged, record current identity/evidence separately and preserve unassessed or blocked human/device criteria.

## Next phase

Use prepared research materials for five fresh opening/encounter players and five different full-campaign players. Observe before explaining; record denominators, assistance, abandonment, spontaneous versus prompted build recognition and consequence understanding. Revise recurring confusion, weak agency or fatigue, then repeat with fresh participants. The larger slice gate still proposes two fresh cohorts of approximately 12–20 with a revision between them.

Gameplay depth and audio remain the largest weighted craft gaps. Prioritize observed weak build differences and repetitive decisions, plus independent listening direction, before more content. NVDA/Firefox, VoiceOver/Safari, controllers, Android/iPhone reviews and source/permission records for twelve supplied artworks remain separate work. No scene or asset is added in this phase; existing accompanying art remains suitable.
