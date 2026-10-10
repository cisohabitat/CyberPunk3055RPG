# Saint Shard player validation and review checklist

Prepared 10 October 2026 for an AI assistant testing Saint Shard / CyberPunk3055RPG. Reference revision: `022f4ea`; reconfirm the candidate before each assessment.

Determine whether a new player can enter the story, understand their choices, complete the campaign, recognize consequences, and comfortably replay with a different build. The current 7.8/10 grade is provisional and internal. Automated success does not demonstrate player comprehension, enjoyment, independent artistic acceptance, or commercial AAA readiness.

Use this checklist alongside the [roadmap](ROADMAP.md), [research protocol](RESEARCH.md), [character playtest protocol](CHARACTER_PLAYTEST.md), [release readiness evidence](RELEASE_READINESS.md), and [production acceptance gates](../qa/production/acceptance.json).

## 1. Instructions for the testing assistant

Test the game as a player first. Investigate implementation details afterward. This is a testing brief; fixes, publishing, outreach, and participant recording follow the authorization for the actual assignment.

- [ ] Record URL, Git revision, date, browser version, device or emulated viewport, and settings.
- [ ] Use a separate QA browser profile so testing does not overwrite existing player progress.
- [ ] Verify that the deployed build matches the revision being assessed.
- [ ] Start the first exploratory campaign from creation without consulting walkthroughs, fixtures, or story source.
- [ ] Use natural dice for exploratory play.
- [ ] Label controlled rolls and imported-state checks as directed testing.
- [ ] Do not count an imported finale as a completed campaign.
- [ ] Do not count AI campaigns as fresh-player research.
- [ ] Record failures, abandoned runs, inaccessible actions, and blocked checks.
- [ ] Separate observed behavior from interpretation and recommendations.
- [ ] Require evidence before marking a check passed.
- [ ] Do not close a production acceptance gate solely because automated checks pass.

| Result | Meaning |
| --- | --- |
| Pass | Observed behavior meets the criterion. |
| Fail | Observed behavior contradicts the criterion. |
| Blocked | Required environment, access, equipment, or participant is unavailable. |
| Not tested | The check has not been attempted. |
| Not applicable | The check does not apply; include a reason. |

For checkbox tracking, check a box only on Pass. Maintain the result and evidence reference separately for every failed, blocked, or inapplicable case.

## 2. Phase A Build health and basic entry

Establish that the candidate is stable enough for meaningful playtesting.

### Technical baseline

- [ ] Run unit tests and TypeScript checking.
- [ ] Build the production application.
- [ ] Run the story replay matrix.
- [ ] Generate the production inventory and budget report.
- [ ] Run browser checks across supported browser configurations.
- [ ] Inspect failures individually; distinguish environment failures from application failures.
- [ ] Check console errors, unhandled exceptions, failed requests, and missing assets.
- [ ] Confirm scene artwork decisions in `qa/media/scene-art.json` are complete.
- [ ] Confirm choices lead to valid scenes or supported outcomes.
- [ ] Confirm title, creation, play, settings, saves, and finale screens are usable.

Repository commands:

```bash
npm test
npx tsc --noEmit
npm run build
npm run story:replay
npm run production:report
npm run test:browser
```

Run these in the QA checkout. Build and test scripts may regenerate audio; inspect the working tree afterward. Record actual results rather than copying previous passing counts.

### Title screen

- [ ] Tone and game type are understandable.
- [ ] Suitable opening artwork establishes setting without obscuring controls.
- [ ] New players can identify how to start.
- [ ] Returning players can identify how to continue.
- [ ] Continue reflects a valid saved run.
- [ ] Undiscovered ending information is not unnecessarily spoiled.
- [ ] Text-only mode remains complete and understandable.
- [ ] Missing artwork does not prevent starting or continuing.
- [ ] Audio follows activation and sound preferences.

Exit: no blocker prevents entry, continuation, or basic interface understanding.

## 3. Phase B Opening story and onboarding

Address whether the story begins abruptly and whether the runner has a reason to act.

### Character creation

- [ ] Origins communicate meaningful differences.
- [ ] Chrome, Face, Ghost, and Nerve are understandable before allocating points.
- [ ] Allocation obeys existing rules.
- [ ] Complications communicate immediate effects.
- [ ] Starting resources are understandable.
- [ ] A personal motive connects creation to accepting the job.
- [ ] Creation works with keyboard, large text, and a narrow viewport.

### First scenes

Assess before reading source code.

- [ ] The player understands who they are and where they are.
- [ ] Quill's role and offer are clear.
- [ ] Hearing the offer is distinguishable from accepting the job.
- [ ] Mara Voss's hour receives enough explanation to make the objective understandable.
- [ ] The deadline creates understandable urgency.
- [ ] Kerr's opposition is established.
- [ ] The runner has a personal reason to care.
- [ ] The immediate goal is available without opening the sheet.
- [ ] New terminology receives context.
- [ ] A meaningful decision arrives before the introduction becomes tiring.
- [ ] The opening creates a reason to continue.
- [ ] Artwork supports the situation and setting.
- [ ] The opening remains understandable with sound disabled.

At a natural pause, answer from visible game content:

1. What am I trying to do?
2. Why does my character want to do it?
3. Who hired me?
4. Who is trying to stop me?
5. What could happen if I fail?
6. What remains deliberately unknown?

Label AI answers as AI comprehension observations. Use these questions with fresh players separately.

Exit: objective and motivation are understandable; intentional mystery is distinguishable from missing explanation.

## 4. Phase C Full campaign and replay value

Use exploratory campaigns from creation with natural dice and plausible choices, plus directed campaigns targeting failures, resources, and invariants.

### Coverage matrix

- [ ] Complete campaigns representing Gutterwire, Spire, and Dustline.
- [ ] Exercise Chrome, Face, Ghost, and Nerve across anchor encounters.
- [ ] Reach Names, Quiet, Witness, and Listed finales.
- [ ] Include a campaign skipping substantial optional content.
- [ ] Include unfinished commitments.
- [ ] Include low-credit and high-strain conditions.
- [ ] Include failed checks and imperfect evidence.
- [ ] Include refusal, withdrawal, and changed proposals.
- [ ] Include a silent, text-only campaign.
- [ ] Include complete phone and desktop campaigns.

Dimensions may overlap; every combination need not be a separate campaign. Document uncovered combinations and whether each finale was reached through actual campaign play or a directed import.

### Moment to moment experience

- [ ] Each act has a clear dramatic purpose.
- [ ] Major scenes offer a decision, discovery, emotional development, or useful preparation.
- [ ] Optional content has an understandable reason to engage.
- [ ] Hub returns avoid unnecessary repetition.
- [ ] Choices differ in intent, cost, risk, or consequence.
- [ ] Failure creates a playable consequence rather than an unexplained dead end.
- [ ] Low-resource characters retain a viable path.
- [ ] Recovery opportunities are understandable and bounded.
- [ ] Journal entries help recall important developments.
- [ ] Characters respond to relevant earlier actions.
- [ ] Quiet scenes contrast usefully with tense scenes.
- [ ] Repeated explanations do not overwhelm character voice.
- [ ] The finale follows from the campaign.
- [ ] Aftermath separates resolved outcomes from unfinished work.
- [ ] Another build changes methods, not only roll modifiers.

For each major encounter, record: what did the player do beyond reading, what tradeoff did they make, what changed immediately, and what returned later?

Exit: finales are reachable, failure remains playable, and replay changes recognizable methods or consequences.

## 5. Phase D Encounter specific validation

### Glass Chapel and service window

- [ ] Preparation changes available approaches.
- [ ] Methods differ in action, preparation, cost, or exposure.
- [ ] Unavailable approaches explain requirements.
- [ ] Information gathering competes with progress.
- [ ] Remaining service-window opportunities are visible and saved.
- [ ] Inspection cannot repeatedly generate free advantages.
- [ ] Reloading does not replenish opportunities.
- [ ] A committed action consumes its opportunity exactly once.
- [ ] Expiry changes the situation without trapping progression.
- [ ] A free exit or recovery route remains available.

### Memory reconstruction

- [ ] Signature, counter-order, and roster are distinguishable sources.
- [ ] Timeline interaction and revision work.
- [ ] Contradiction differs from missing proof.
- [ ] Correct chronology does not automatically authenticate the issuing key.
- [ ] Source correction has a visible consequence.
- [ ] Opting out or leaving uncertainty unresolved is accurately recorded.
- [ ] Mara's recorded testimony differs from present-day voluntary conversation.

### Nia transfer and testimony

- [ ] Methods differ in preparation, strain, obligation, or exposure.
- [ ] Nia's terms are visible and meaningful.
- [ ] Relocation does not grant recording permission.
- [ ] Recording permission does not grant public quotation permission.
- [ ] A successful roll cannot override refusal.
- [ ] Later dialogue remembers the transfer method.
- [ ] Relationship repair does not erase earlier exposure or breaches.

### Edda and archive

- [ ] Preparation, comparison, retrieval, and custody remain distinct.
- [ ] Corroborating cancellation does not authenticate its issuer.
- [ ] Public naming requires appropriate permission.
- [ ] An acknowledged form or booked appointment is not described as restored wages.
- [ ] Outstanding inquiries remain outstanding.

### Kerr and collection

- [ ] Deposit and work arrangements are understandable.
- [ ] Refund requires the relevant observed handover.
- [ ] Reload cannot duplicate refunds or rewards.
- [ ] Later help does not erase betrayal or privacy breaches.

### Clinic allocation and hearing

- [ ] Capacity and scheduling constraints are readable.
- [ ] Different feasible allocations have different practical costs.
- [ ] Overload differs from explicit refusal.
- [ ] Revision does not erase prior refusal.
- [ ] Dispatch acceptance does not imply attendance or successful care.
- [ ] Hearing scope and quotation permission are separate.
- [ ] Filing occurs once.
- [ ] Correction and withdrawal are reflected accurately.
- [ ] Withdrawal does not erase what has already been heard.

Exit: no route invents consent, proof, completed work, payment, or restored trust.

## 6. Phase E Choice clarity and consequence integrity

For representative choices in every act:

- [ ] The label explains the runner's action.
- [ ] Known costs appear before commitment.
- [ ] Numerical previews match actual changes.
- [ ] Difficulty and relevant modifiers are understandable.
- [ ] Consequence descriptions remain accessible without confusing the action name.
- [ ] Visible unavailable approaches explain requirements.
- [ ] Hidden routes are not unnecessarily spoiled.
- [ ] Cancelling a dialog spends no resources.
- [ ] Double activation cannot duplicate reward or cost.
- [ ] Journal entries agree with the outcome.
- [ ] Art, dialogue, responses, and aftermath agree with the same state.
- [ ] Faction score alone does not imply forgiveness, consent, or completed work.
- [ ] Intention, promise, accepted offer, and completed action remain distinct.

Capture before state, displayed preview, committed action, and after state for each mismatch.

Exit: information before commitment is reliable and outcomes record what occurred.

## 7. Phase F Saves recovery and interrupted play

Use disposable QA saves; preserve copies before destructive tests.

### Normal saves

- [ ] Autosave resumes the exact run.
- [ ] All three manual slots work.
- [ ] Replacement requires expected confirmation.
- [ ] Cancelling replacement leaves storage unchanged.
- [ ] Export/import preserves supported state.
- [ ] Importing and reloading each finale preserves aftermath.
- [ ] Preferences and ending discoveries behave as intended.
- [ ] Supported older saves migrate correctly.

### Pending dice

- [ ] Interrupt after the die is stored but before outcome commitment.
- [ ] Reload preserves that value.
- [ ] Slot recovery preserves that value.
- [ ] Export/import preserves that value.
- [ ] Outcome commits exactly once.
- [ ] Resources, opportunities, journal entries, and roll history are not duplicated.
- [ ] Audio and settings changes do not reset the check.

Include the existing Chapel fixture with pending roll 8. Verify its commitment consumes only the expected remaining opportunity.

### Failure and recovery

- [ ] Corrupt primary autosave recovers from valid backup.
- [ ] Recovery notice is understandable.
- [ ] Invalid imports leave the active run unchanged.
- [ ] Checksum-altered and oversized files are rejected appropriately.
- [ ] Corrupt primary and backup do not offer misleading Continue.
- [ ] A valid manual slot remains recoverable.
- [ ] Blocked storage and quota failures permit session play with a persistence notice.
- [ ] An isolated previous-build to candidate to rollback rehearsal preserves compatible progress.

Exit: no known progress loss, reroll exploit, duplicate commitment, or misleading recovery behavior.

## 8. Phase G Accessibility and device usability

### Layout

- [ ] Test a 320px narrow phone.
- [ ] Test a 390px phone.
- [ ] Test tablet and 1440px desktop layouts.
- [ ] Test largest text, high contrast, and reduced motion.
- [ ] Test text-only and silent presentation.

At relevant combinations:

- [ ] No horizontal overflow obscures content.
- [ ] Goal is available without opening the sheet.
- [ ] Choices and dialog controls remain readable and reachable.
- [ ] Expanded disclosures preserve layout.
- [ ] Reading order remains logical.
- [ ] Artwork does not crowd out mandatory information.

### Keyboard and controller

- [ ] Complete mandatory flows without a mouse.
- [ ] Focus is visible.
- [ ] Dialogs isolate background interaction.
- [ ] Escape closes appropriate dialogs.
- [ ] Closing restores useful focus.
- [ ] Sheet tabs support documented arrow/Home/End behavior.
- [ ] Revealing prose focuses useful new content.
- [ ] Number shortcuts do not activate choices while typing or using dialogs.
- [ ] Number-shortcut opt-out works.
- [ ] Controller reaches mandatory controls and expanded content.
- [ ] Disconnection or input changes do not trap the interface.

### Assistive technology

- [ ] Run automated accessibility scans on representative screens.
- [ ] Check accessible names, headings, descriptions, and announcements.
- [ ] Unavailable-action explanations are accessible.
- [ ] Full dialogue is readable without listening.
- [ ] Complete manual NVDA/Firefox validation.
- [ ] Complete manual VoiceOver/Safari validation.
- [ ] Validate supported physical-controller behavior.

Exit: no mandatory flow is inaccessible on the declared support matrix. Automated scans do not close manual screen-reader acceptance.

## 9. Phase H Art and audio review

### Art

- [ ] Start page has suitable art.
- [ ] New scenes have explicit art decisions.
- [ ] Distinct places and major moments receive appropriate treatment.
- [ ] Character identity is consistent.
- [ ] Composition works on phone and desktop.
- [ ] Captions and descriptions accurately represent images.
- [ ] State-specific imagery reflects earned outcomes.
- [ ] Images do not imply unearned safety, payment, proof, consent, or closure.
- [ ] Missing-image fallback preserves play.
- [ ] Text-only preference prevents unwanted artwork delivery.
- [ ] Provenance, attribution, and distribution rights are documented.

An independent reviewer should assess a complete chapter and finale, including ordinary scenes.

### Audio behavior

- [ ] Music, ambience, effects, and voices respect separate controls.
- [ ] Voice requires intended explicit activation.
- [ ] Stop ends voice reliably.
- [ ] Complete dialogue remains text-accessible.
- [ ] Muting stops active channel sources.
- [ ] Muted channels avoid unnecessary new requests.
- [ ] Crossfades leave no orphaned sources.
- [ ] Scene exit stops inappropriate previous audio.
- [ ] Backgrounding pauses or cancels audio correctly.
- [ ] Resume sound does not replay prior voice or cues.
- [ ] Resume preserves exact game state.
- [ ] Failed requests do not block choices or saves.

### Human listening quality

Use headphones, speakers, and phones:

- [ ] Dialogue is intelligible.
- [ ] Music does not mask speech.
- [ ] Transitions avoid startling level changes.
- [ ] Repetition remains tolerable through a full session.
- [ ] Locations and dramatic states have recognizable identities.
- [ ] Delivery supports character and emotion.
- [ ] Quiet scenes receive appropriate restraint.

Exit: playback checks pass; artistic, listening, and rights acceptance have separate evidence.

## 10. Phase I Performance and endurance

- [ ] Record cold-cache and warm-cache loads separately.
- [ ] Record network conditions and optional audio requests.
- [ ] Check initial transfer against current production budget.
- [ ] Check script, style, artwork, and audio budgets.
- [ ] Measure choice response and layout shifts.
- [ ] Exercise repeated navigation, dialogs, saves, imports, and audio transitions.
- [ ] Run sustained active-session and idle-control probes.
- [ ] Stopped audio returns active source count to zero.
- [ ] Check detached dialogs, nodes, and listeners for sustained growth.
- [ ] Distinguish automation-tool retention from application retention.
- [ ] Record actual duration.
- [ ] Conduct planned two-hour endurance assessment.
- [ ] Repeat representative checks on named physical Android, iPhone, and desktop hardware.

| Measure | Proposed target |
| --- | --- |
| Initial compressed transfer excluding optional audio | At most 2 MiB |
| LCP p75 | At most 2.5 seconds |
| INP p75 | At most 200 ms |
| CLS | At most 0.1 |

Use current [budget definitions](../qa/production/budgets.json). A few laboratory samples cannot establish population percentiles. JavaScript heap is not total device memory.

Exit: no unexplained sustained growth or response failure; physical-device claims have physical-device evidence.

## 11. Phase J Fresh player validation

The assistant can prepare materials and analyze authorized, consented observations. Real-player findings require actual sessions.

### Study sequence

1. Begin with five opening/encounter players and five different full-campaign players.
2. Revise recurring problems.
3. For the broader production slice, conduct the proposed two fresh cohorts of approximately 12–20 participants, with a revision between them.
4. Retest severe findings with fresh participants.

### Session checks

- [ ] Obtain observation agreement and separate recording consent.
- [ ] Record exact build and device/access setup.
- [ ] Use study-local participant codes.
- [ ] Let participants choose pace, preferences, routes, and optional content.
- [ ] Observe before explaining.
- [ ] Separate prompted and spontaneous understanding.
- [ ] Record completions, abandonments, withdrawals, and assistance.
- [ ] Separate behavior, quotations, and interpretation.
- [ ] Report recruitment limitations and actual denominators.

Ask neutrally at natural pauses:

- What are you trying to do now?
- Why did your character take this job?
- What does this source establish? What remains uncertain?
- Which permissions were given?
- What changed because of your decision?
- What did your build change?
- Where did reading become tiring?
- What would you do differently on another run?
- How much agency did you feel, from 1 to 5?

### Proposed comprehension gates

- [ ] At least 80% explain the goal and distinguish testimony from corroboration.
- [ ] At least 75% identify a personal consequence.
- [ ] Median agency is at least 4/5.
- [ ] No recurring severe blocker remains.
- [ ] Prompted build recognition is reported separately from spontaneous recognition.

Report counts such as 8/10 with denominator definitions. These are proposed design criteria, not a universal review grade. Use the existing blank [session worksheet](../qa/research/cycle8-sessions.csv) and [device/access worksheet](../qa/research/device-access-sessions.csv).

Exit: fresh-player evidence supports comprehension and agency, and recurring severe findings are revised and retested.

## 12. Phase K Grade and release recommendation

Use existing roadmap weights:

| Category | Weight | Internal baseline | Review target |
| --- | --- | --- | --- |
| Narrative and consequence | 20% | 8.0 | 9.5 |
| RPG depth and replay | 20% | 7.0 | 9.5 |
| Visual presentation | 15% | 7.5 | 9.3 |
| Audio production | 10% | 6.8 | 9.2 |
| Usability and accessibility | 15% | 8.0 | 9.3 |
| Engineering and release | 20% | 8.8 | 9.2 |

Weighted grade equals the sum of each category score multiplied by its weight as a decimal. Current baseline is 7.765, rounded to 7.8.

For each category:

- [ ] Supply a score with concrete examples.
- [ ] Explain strengths and weaknesses.
- [ ] List representative routes reviewed.
- [ ] Link evidence and unresolved limitations.
- [ ] Specify changes required to reach target.
- [ ] Identify AI/internal versus independent assessment.

A supported 9+ assessment requires weighted overall above 9.0, every category at least 9.0, no severe progress-loss/incorrect-outcome/mandatory-access blocker, and independent review plus required player/device evidence. Stretch target is 9.35. Do not award score increases for asset count, scene count, test count, or phase completion.

Before recommending release:

- [ ] Exact-revision CI is green.
- [ ] Public alias serves the intended revision.
- [ ] Representative assets match inventory.
- [ ] Live save recovery and all finales are verified.
- [ ] Known issues and support responsibilities are documented.
- [ ] Rollback evidence applies to the candidate.
- [ ] Human, rights, localization, and production gates are accurately recorded.

The six [production acceptance gates](../qa/production/acceptance.json) require their stated evidence. This checklist does not automatically close them.

## 13. Issue and evidence format

Create one record per finding:

```text
ID:
Title:
Test type: automated / AI exploratory / directed / human / physical-device
Revision and URL:
Browser, device, viewport, and preferences:
Origin, build, scene, and choice:
Preconditions:
Reproduction steps:
Expected behavior:
Observed behavior:
Result:
Severity:
Evidence location:
Player impact:
Recommended correction:
Retest revision and result:
```

| Priority | Examples | Response |
| --- | --- | --- |
| Critical | Lost progress, unreachable mandatory progression, corrupted outcomes | Stop release recommendation and investigate. |
| High | Inaccessible mandatory action, duplicated cost, consent/proof contradiction, recurring severe confusion | Fix before acceptance. |
| Medium | Repetitive pacing, confusing optional flow, weak build distinction, distracting presentation | Prioritize by frequency and impact. |
| Low | Minor cosmetic or wording defect | Track for polish. |

Evidence may include screenshots, relevant console output, state comparisons, and redacted session notes. Keep participant identifiers, recordings, full saves, and heap snapshots within the agreed evidence-access policy.

## 14. Final report requirements

1. Candidate identity: revision, URL, environments, and dates.
2. Coverage: campaigns, origins, builds, finales, devices, and settings.
3. Results: passed, failed, blocked, and untested checks.
4. Player experience: opening clarity, engagement, agency, fatigue, and consequence recognition.
5. Defects: prioritized findings with reproducible evidence.
6. Grade: weighted categories; separate internal and independent scores.
7. Remaining acceptance: human research, manual accessibility, devices, artistic review, rights, and production requirements.
8. Next phase: specific fixes, expected player benefit, and retest criteria.
9. Recommendation: release candidate, revise and retest, or insufficient evidence.

Retest each fix against its reproduction and affected neighboring behaviors, then run required candidate-wide release checks. Keep the final report tied to the revision actually tested.
