# Phase 5 — player experience and acceptance

Cycle 8 implements the internal accessibility and decision-clarity pass. Fresh-player observation, manual assistive-technology review and physical-device acceptance remain pending. This document and the blank research worksheets are preparation, not completed research or a new grade.

## Cycle 8 scope and findings

The internal code audit and expanded browser scans found five interaction problems:

| Problem | Change | Acceptance check |
| --- | --- | --- |
| Global number keys could conflict with assistive-technology navigation | Settings can turn off Number-key choices; older preferences retain the existing enabled default | Disable, reload, press a number without changing the save; Tab/Enter still select a choice |
| Revealing the final paragraph removed the focused reading button | Each reveal focuses the first newly shown paragraph; a short status gives the shown/total count | Next line and Show the rest preserve keyboard focus, reveal the intended text and never commit a choice |
| Disabled choices could not be reached with Tab to read their requirements | A keyboard-expandable unavailable-approaches review repeats only currently visible disabled choices and their actual engine requirements | Expand with Enter, read a funds/standing requirement without spending; hidden routes remain hidden |
| Sheet panels had no keyboard focus target | The active stats, gear or journal panel is a Tab stop | Arrow/Home/End choose a tab, Tab enters its panel, story shortcuts stay isolated, Escape restores the narrow-sheet opener |
| Gear/journal lists replaced native list semantics with a tab-panel role | Separate tab-panel containers preserve the nested native lists | Scan all three active panels; gear/journal list items retain valid list parents |

Choice controls now have a concise action name and a separate accessible description for odds, authored detail, warnings and costs. The next-move section explains that selecting an ordinary choice commits it, while checks permit a review and Back before rolling. The abandon dialog initially focuses Keep going to protect against accidental confirmation.

Preserve the goal above the art, one-paragraph and whole-scene modes, current cost previews, complete readable dialogue, explicit audio controls, text-only/high-contrast/large-text delivery, saved checks, 1d10 and caps, version 2 and `saint-shard-3055-v1`. No new scene, story outcome, economy rule or art/audio asset is required; existing accompanying art remains suitable.

## Fresh-player sessions

Use [CHARACTER_PLAYTEST.md](CHARACTER_PLAYTEST.md) for neutral facilitation. The exploratory starting study remains five fresh opening/encounter participants plus five different full-campaign participants. Recruitment, consent and optional recording are separate research work; this implementation sends no invitations and collects no player data automatically.

Use `qa/research/cycle8-sessions.csv` for one row per consented session, including incomplete/abandoned sessions, and `qa/research/character-observations.csv` for individual observed behaviors. Use anonymous codes, not names or contact details. Record the actual revision and whether the session was fresh/undirected, directed or internal automation. Separate observed behavior, quotations and reviewer interpretation. Do not copy automated runs into participant rows.

The session sheet records completed/abandoned/withdrawn status, actual minutes played, origin and finale if reached. An empty response means not assessed, not a failure or a positive answer. Comprehension fields use `yes`, `no` or `not_assessed` with brief supporting evidence in the observation sheet. Assess job/goal, testimony versus corroboration, a personal consequence, and recorded versus present-day speech. Keep spontaneous recognition of build differences separate from the prompted build question. Agency uses the participant's own 1–5 rating; blank means not assessed. Mark reading fatigue only when observed or reported. Withdrawal excludes that session's findings from reporting; handle retained records according to the participant's agreement.

End with neutral questions: “What were you trying to do?”, “What did this record establish?”, “What changed because of your choices?”, “What did you expect your build to change?” and “Where did you want to act but feel you could only keep reading?” Do not reveal correct interpretations before the player answers. Record skipped missions and unfinished relationships rather than directing everyone to a preferred ending.

Use [the blank findings report](../qa/research/cycle8-findings-template.md) to record actual denominators, completions, abandonment, prompted/unprompted answers, device/access setup, revision, recruitment limits and contradictory findings. Prioritize progress loss and inaccessible mandatory actions, then repeated misunderstanding or weak interaction. Proposed quality targets guide revision; they do not automatically certify a grade from a small sample.

## Cycle 9 handoff and manual acceptance

1. Revise from actual Cycle 8 observations; retest those problems with fresh people, including failure and unfinished paths. The broader slice gate proposes two fresh cohorts of approximately 12–20 with a revision between them; ten exploratory sessions do not satisfy it by themselves.
2. Check NVDA/Firefox, VoiceOver/Safari, keyboard-only and physical-controller play. Record reviewer, actual OS/browser, settings, mandatory flows and any blocker. Automated accessibility scans are supporting evidence, not manual certification.
3. Record actual Android, older supported iPhone and desktop/laptop model/OS/browser. Measure cold load, choice response, layout stability, background/resume audio and a two-hour replay for memory growth. Four synthetic automation-host samples are not physical-device or population percentile evidence.
4. Review an entire chapter and finale for visual continuity, voice pronunciation, intelligibility and loop fatigue on headphones, speakers and phone. Complete the art/audio and distribution-rights review against the actual asset hashes.

Proposed approved-profile targets remain initial compressed transfer at most 2 MiB excluding optional audio, LCP p75 at most 2.5 seconds, INP p75 at most 200 ms and CLS at most 0.1. Percentile claims require adequate measurement design. Recurring severe findings must be revised and retested before closing an acceptance gate. Independent acceptance stays pending until its actual evidence exists.

## Internal verification and release

Verify settings → local preferences → restored controls, reveal → focused readable text, review → actual visible requirements, Tab → active panel, and cancel → intact save. Check phone, desktop and 320px text-only/largest-text/high-contrast layouts; include automated accessibility scans and exact save comparisons. Play complete campaigns from creation through all four finales, including natural dice and disabled-shortcut play. Run required unit/replay, TypeScript, build, production budgets and exact-revision CI; push this cycle, deploy through the fail-closed gate and verify the public revision. Store generated findings under `qa/production/reports/`.

Internal verification: 349 unit/replay cases, TypeScript and the production build pass. Forty-two focused Chromium/phone/WebKit cases cover the new controls and retained reading, memory, sheet and finale behavior. Eighteen additional release-profile checks pass at 390px, 1440px and 320px text-only/largest-text/high-contrast. Expanded scans cover all three active sheet panels, including the corrected native list semantics. These are automated checks, not screen-reader acceptance.

Six complete internal UI campaigns contain 465 scene visits: four directed original finales and two natural-dice origins. Every run has number shortcuts disabled; all three origins complete. The narrow text-only silent campaign requests no art or audio. Each directed finale's entire saved state equals its corresponding previous-release run, preserving dice, costs, history and outcomes. All campaign error arrays are empty. Internal directed/adaptive campaigns are not fresh-player observations or proof of every path.

Four synthetic initial-load profiles measure 931,733 bytes at 390px illustrated, 1,269,949 bytes at 1440px illustrated and 351,273 bytes in either text-only profile. All remain under 2 MiB, with a visible goal, no overflow and zero measured layout shift. These are automation-host samples with Sound off, not physical-device or percentile results. The inventory remains 143 assets, 185 scenes, 536 choices and 96 replay fixtures, with no media/script/style budget violations.

Exact-revision CI and public deployment verification follow the push and are recorded in `qa/production/reports/cycle8-evidence.json`. Human sessions, named assistive-technology review, physical devices, independent media acceptance and the provisional 7.8 grade remain separate. Cycle 9 should revise actual observed problems and collect the required manual/device evidence; this internal increment does not close Phase 5 acceptance.
