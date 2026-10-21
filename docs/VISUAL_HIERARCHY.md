# Story and guide hierarchy

The visual review found that interface furniture displaced the story. In sampled restored phone views, workshop prose began around 2,611px and Edda's around 781px; the opening began around 880px. Desktop story headers left empty space beside tall portrait cards. The guide's chapter navigation followed a large painting.

## Changes

- Non-finale headers use a horizontal identity nameplate on desktop and phone. Phone headers place the goal above the full-width nameplate. Full actor artwork, accessible labels and speaking state remain. Single-speaker context avoids repeating the name; mixed-speaker context still names the scene's person separately from the active voice.
- Chapter strips retain their number, title and motif with less padding. Chapter paintings use the same uncropped reading composition and artwork viewer as regular scenes.
- Detailed commitments, transfer/archive/testimony advice and equipment comparisons follow the narrative and playback, before choices. The visible chapter goal stays above the story. No advice or game state is duplicated or removed.
- Equipment comparisons use two columns on desktop and one on phone. Existing odds, ceiling warnings, training methods, purchase costs and care budgets remain. Available credits stay inline with their sentence rather than leaving punctuation on a separate line.
- Commitments use quieter dividers, while actionable comparison cards retain their boundaries. Prose size and canonical words remain unchanged.
- The guide starts with four practical steps and its existing chapter links before the optional opening art. Complete lore, dice practice, comfort settings and save guidance remain available.

## Media and verification scope

This is written interface and layout work, with no new scenes or creative assets. Existing paintings, captions, actors, dialogue bindings and audio remain matched and byte-identical. Scene settings, source knowledge and consent do not change, so existing scene-art decisions remain suitable. Historical QA snapshots are preserved. No engine, balance or save-schema change.

Baseline screenshots sampled seven screens at 390px and 1440px. The first updated render moved workshop prose to about 523px on phone and 503px on desktop, Edda to 523px/503px, and the opening to 615px/572px. Final verification also checks enlarged text, text-only and missing art, guide keyboard navigation, existing training/purchase checks, voices and finale layouts. Synthetic browser results do not establish physical-iPhone acceptance. Publication requires the full exact-commit hosted suite.

Validation passed: 682 source tests; 180 unique targeted browser cases through the cycle, plus 33 repeated checks after the final text-scaling refinement; TypeScript; production build; and four production load samples. Local browser coverage includes Chromium, phone Chromium and Linux WebKit. Three composition cases additionally inspected regular scenes at tablet/wide widths of 768, 1440 and 1920px. Existing assertions and mandatory hosted profiles remain unchanged. The complete keyboard-only Names campaign reached `ending_names` across 63 visits and 16 reloads, with no script or media failures; this campaign was muted, with voice playback checked separately in browser cases.

The final maximum measured initial transfer, including HTML, was 1,616,033 bytes against the unchanged 2,097,152-byte budget. Goals remained visible, no overflow or layout shift was observed, and text-only samples fetched no art. The smaller chapter composition selects an existing responsive image delivery; no art bytes or audio were replaced. Nameplate heights scale with enlarged text and remain stable when speaking changes. The factual metric/source hashes and limitations are recorded in `qa/editorial/visual-hierarchy.json`.

## Speaker-header CI correction

Hosted run 39694868616 failed the all-actor caption preflight in every browser profile. The first implementation styled non-compact desktop portraits horizontally and compact phone portraits vertically, contradicting the existing `data-layout` contract and assertions. Source tests passed; the aggregate correctly blocked publication. The earlier targeted passes did not include this complete all-actor geometry suite.

The correction explicitly requests compact portraits for every non-finale story header and keeps their captions beside the face at all widths. On phone, the full-width nameplate follows the goal; final and check-result layouts remain separate. The all-actor tests, their geometry limits, speech/word/actor checks, save checks, caption-fit checks and release gates remain unchanged. Existing art and voice bytes remain matched. Historical QA evidence is preserved rather than rewritten as a pass.

Correction validation: 682 source tests, 66 browser cases across Chromium/phone/Linux WebKit, TypeScript, build and four load samples passed. This includes every existing all-actor speaker-presentation case and the new hierarchy suite. The sampled phone opening remains at about 676px and workshop prose at 538px; no overflow was observed. Maximum initial transfer including HTML was 1,616,008 bytes. Local Firefox could not launch its temporary profile, so only the mandatory hosted run can establish its result. See `qa/editorial/speaker-header-ci-correction.json` for source hashes, measurements and limits. Full hosted CI must pass before publication.
