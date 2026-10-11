# Visual staging cycle — 11 October 2026

This cycle improves four stable character moments after the depot build-variety work. It replaces one composition, adds three scene plates and fixes the shallow crop used by all framed scene art. The provisional internal grade remains **8.2/10**; visual presentation remains **7.8** pending a broader craft reassessment. Asset counts and passing automation do not establish a higher grade.

## Shot decisions

| Moment | Composition and delivery | State limits |
| --- | --- | --- |
| Quill’s opening offer | Closer face, hand, untouched bowl and open counter space; amber steam against a blue rainy alley. Replaces `quill-offer` at 1200×800 and 600×400. | Shared by `stall`, `pay`, `job_owner`. No advance, accepted motive or successful job is pictured. |
| Mara’s present-day response | The living Mara beside an ordinary clinic window, envelope and cup, with an empty chair across the table. New `mara-present` pair. | `act2_response_invitation`, `act2_response_agenda`, `act3_response_visit` physically place her in the room. Her recorded-hour plate stays distinct. The image makes no dispatch, endorsement, public permission or finding claim. |
| Nia’s arrival | Seated Nia controls her chair and rests a hand beside a closed notebook. New `nia-arrival` pair. | Only `act2_witness_arrival`; no active recording, identifiable photograph, address, public quotation or treatment outcome is pictured. Transport and account approval retain separate choices. |
| Kerr’s handover | Kerr checks the tag beside the closed case strap at the sheltered stall. New `kerr-handover` pair. | Only `act2_route_receipt`, whose prose observes this handover. The case stays closed; registration, privacy breaches and treatment uncertainty remain in the story. |

Saved-conduct portraits remain separately visible: Mara’s public refusal and Kerr’s breached private terms are retained even after a revised proposal or acknowledgment. No new conditional state rule, story choice, cost, die face, voice quotation or audio file is introduced.

## Rendering and provenance

The old `object-fit: cover` with a 280-pixel desktop cap cropped 3:2 plates into shallow strips. Scene images now retain their full 3:2 frame with `object-fit: contain`, so hands, notebook, envelope and case remain visible. Goals stay above the frame; captions, descriptive alternatives, missing-image descriptions, lazy loading and text-only omission remain in place. This increases desktop scrolling before choices; keyboard skip-to-choices and both reading modes remain available. The plate is static illustration, not evidence.

Four generated PNG masters remain in `/workspace/generated_images`. `qa/media/art-provenance.json` records exact prompts, source hashes, reference hashes and revision, eight responsive delivery hashes, resize/encoding processing and the superseded Quill source. Delivered files are under the existing 1 MiB per-image budget. The offline `qa/media/review.html` includes both sizes of each composition. Credits retain the supplied-reference provenance caveat. Internal inspection found consistent cast identifiers and clear principal objects; generated surface treatment still varies between textured realism and the inherited painted portraits. A complete cast model-sheet/style pass remains future work.

## Internal validation

- **413 unit/replay checks**, TypeScript and production build pass. Documentation/media checks pass after the final documentation update.
- **45 focused browser checks** across desktop Chromium, phone Chromium and WebKit cover eight scene/conduct states at 390px, 1440px and 320px text-only, missing new artwork, older scene plates and all four finale plates. WebKit initially selected the 1200px phone candidate; the test was corrected to accept either documented responsive source and verify the complete frame. The affected check then passed.
- **Six complete authored keyboard campaigns** contain **448 visits, 137 reloads and 400 paragraph reveals**. They cover Mara’s private response, revised public refusal, revised clinic refusal, unfinished public proposal, Nia arrival, failed depot recovery and all four finales. Each choice is compared with the canonical engine state; recorded checks survive reload. No runtime or failed-media errors were recorded. These are source-familiar, directed-dice simulated play, not human participants or independent ratings.
- Four synthetic initial-load probes transfer **939,339 / 1,277,555 bytes** in illustrated phone/desktop play and **358,879 bytes** in each text-only profile. All remain under 2 MiB, with visible goals, no overflow, zero measured layout shift and zero post-preference artwork requests in text-only play. These are automation-host samples, not physical-device or percentile measurements.
- Production catalog retains **195 scenes, 578 choices and 107 replay routes**, with **149 inventoried assets**, zero budget violations and six separately pending production gates. Exact-commit CI and live verification are required after pushing this candidate.

The redacted aggregate is `qa/editorial/visual-cycle-summary.json`. Raw campaign reports and screenshots are outside Git in `/workspace/saint-shard-validation/visual-cycle/`.

## Following cycle

Audition all fourteen existing clips against these stable scenes, then revise delivery, ambience and dialogue dynamics where actual listening finds a weakness. Keep fixed transcripts, provenance, interruption cleanup, natural completion and cache/transfer budgets together. Repeat sounding and silent campaigns before reassessing audio or the overall grade. This visual cycle supplies no human listening or commercial-production acceptance claim.
