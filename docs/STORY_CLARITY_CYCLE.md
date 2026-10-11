# Story clarity and pacing cycle — 11 October 2026

This cycle uses simulated play as the primary development validation method because independent participants are unavailable. It continues the six-phase roadmap with a findings-led narrative revision. The current internal review is [8.2/10](REVIEW.md); it is a provisional assessment of the browser narrative RPG, not a participant average or commercial AAA acceptance.

## Comparison and findings

Two baseline keyboard campaigns compared a skipped, minimal-content run with a full-prologue, investigation-heavy run. Four candidate campaigns crossed both opening choices with both content styles. These are source-familiar, authored campaigns with explicit die faces, not blind first-player observation. Each used actual Tab order, Enter, settings and save/reload through the browser. No comprehension percentage or satisfaction rating is inferred from successful automation.

| Finding | Revision | Boundary preserved |
| --- | --- | --- |
| Skipping the prologue retains the contract but omits the concrete personal context supplied by the full opening. | Quill's first meeting supplies one short origin-specific practical possibility: dry sleep, a life without the old badge, or a next crossing. | Possibilities do not assign a motive, accept the job or grant an advance. Legacy checkpoints keep their original treatment. |
| Canal returns repeat Ren's warning and describe the decision through “the week.” | The return briefly recalls Junie's importance and explains street speech versus Helion's money for silence. | Ren's first family introduction remains. Leaving still closes opportunities without completing open commitments. |
| Chapter cards and finale recaps describe “selling the week” without naming the actual bargain. | A shared recap names the forty/eighty-creds silence offer, street speech, failed attempt or unresolved choice. | The recap creates no authenticated source, approved recording, safety, quotation permission or filed hearing. |

These observations establish what text is present and repeated. The editorial judgment is that concrete wording should make the bargain easier to understand; simulated play does not establish how an unfamiliar person interprets it.

## Paired narrative measurement

The [aggregate audit](../qa/editorial/pacing-cycle-summary.json) compares the revised prose against **7,254 identical pre-choice states from 99 complete replay fixtures**. All canonical non-prose scene definitions and all replay final states match the baseline. Three added fixtures cover full/skip minimal campaigns and a skipped investigation campaign, including pending-roll and ordinary save checkpoints.

Sampled scene prose changes from 459,604 to 458,166 words, a **0.31% aggregate reduction**. Canal visits account for 23,805 → 22,119 words across 415 visits, a **7.1% reduction**. The 99 Wall cards grow from 3,370 to 3,639 words to clarify the consequence. All 99 sampled final recaps also use the explicit Week wording; their separate rendered words are excluded from the scene-prose total. Counts are weighted by fixture visits, not unique-script length or measured reading time.

Repeat the audit with a state-bearing baseline kept outside Git:

```bash
npx tsx scripts/narrative-comparison.ts capture /tmp/narrative-baseline.json
# Make the narrative edits, leaving canonical mechanics intact.
npx tsx scripts/narrative-comparison.ts compare /tmp/narrative-baseline.json /tmp/narrative-summary.json
```

Capturing and comparing the same revision is a no-op check; a real paired audit requires capture before editing. Never publish raw saves, study responses or populated participant worksheets.

## Art and audio decisions

No scene, place, speaker, fixed voiced quotation or save field is added. Quill's waiting-at-the-stall illustration still depicts an unaccepted offer; the neutral dry canal still depicts unresolved work; the chapter card deliberately remains text. Their enumerated rationales are updated in `qa/media/scene-art.json`. There is no new visual event requiring generated art or changed quotation requiring regenerated audio. Existing art must decode at phone/desktop sizes; largest-text, high-contrast text-only play retains every decision and goal.

## Candidate verification and handoff

The candidate passes **393 unit/replay checks**, TypeScript, production build and inventory budgets: 185 scenes, 536 choices, 99 routes and 143 assets. Fifteen targeted local browser checks cover all three skipped origins, forty/eighty-creds bargains, reloads and factual finale recaps in desktop Chromium, phone Chromium and WebKit. Exact-revision CI additionally requires Firefox and the complete four-profile browser suite before production.

Four complete candidate UI campaigns pass **182 scene visits, 36 reload checkpoints and 107 paragraph reveals**, with no page errors, overflow, missing requested media or goal outside the first screen. Full/skip minimal routes finish with 390 creds and zero strain; full/skip investigation routes finish with 390 creds and one strain. These matched pairs retain the same authored rolls and canonical outcomes. Profiles cover 320/390/1440 pixels, text-only/illustrated delivery and all/paragraph reading, at largest text and high contrast. A further fifteen saved-state scene checks cover the first offer, first/returned canal and chapter card at all three widths, including image decoding, with zero errors or failed media. This is synthetic viewport evidence.

The next development cycle should test whether builds feel distinct across the Chapel, witness transfer and Kerr collection, using paired source-familiar simulations and recording actual choices, costs, failure recovery and later replies. Revise encounters that still converge on the same decision. Follow that with an audiovisual craft pass tied to the resulting stable scenes. Simulated play remains sufficient to advance development and provisional grading; independent listening, manual assistive technology, physical devices and rights review remain separate production evidence.
