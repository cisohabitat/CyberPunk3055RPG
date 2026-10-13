# Speaker presentation — phase 1

The audible character now receives a named portrait and an underlined quotation cue in the main prose. The same cue follows the revealed failed-bluff check result. It uses the existing playback controller's playing status and the same exact dialogue binding that selected the clip. Loading, unavailable or cancelled speech supplies no playing cue.

## Words, actor and art

`spokenDialogueRange` locates the exact revealed quotation, validates its immutable binding and complete ordered word sequence, then selects only the words in the audible part. Retained clips with typographic punctuation differences still match the same words. Quill's split offer highlights one part at a time, and a custom player address preceding its fixed suffix remains outside the cue. Narration and attribution remain ordinary readable text. The renderer retains every original character and paragraph id.

During playback, `portraitArt` receives the actual actor, scene and earned flags. Conditional boundaries, breaches and refusals therefore remain attached to the correct person. The portrait caption says Speaking; mixed conversations retain the named primary character as scene context. Natural completion or cancellation restores that context. Changing image sources remounts the image node so a loading actor cannot retain the preceding actor's bitmap under a new name. A missing portrait retains the right caption and a fixed-size placeholder.

Five new generated portraits establish Ren, the stallholder, the dispatcher, the mechanic and the masked attendant. Ren and the stallholder retain the identities in their existing scene illustrations; new minor-role images depict neutral work/personality rather than earned outcomes. All fifteen voice roles have explicit actor/scene entries in `speaker-presentation.json` and `scene-art.json`. Existing framed settings and chapter cards retain their decisions.

## Interaction and continuity

- Quotation cues and portrait updates move neither focus nor scroll. Paragraph reveal still focuses the newly requested paragraph.
- Portrait geometry stays fixed. The quotation cue changes decoration and background, not font size or word spacing; it uses an underline as well as color, with no animation.
- Stop, Sound off, zero voice volume, modal/sheet/notebook entry, pagehide and departure clear the cue. Closing an overlay or Resume sound preserves the existing once-per-reveal playback policy.
- Silent/manual mode supplies no playing cue until actual playback. Text-only mode retains names and highlighted words without requesting artwork.
- Source wording, all 302 bindings, all 290 active delivery hashes, 197 scenes / 587 choices, 140 full replay fixtures, saved version 2 and `saint-shard-3055-v1` remain unchanged. Audio never changes resources, knowledge, consent, pending dice or the original four finales.

## Authoring and verification

Every dialogue change must keep visible quotation words, actual actor, authored audio/delivery and reviewed portrait aligned. The normal suite checks all binding parts, actual quotations across all 140 authored routes, explicit actor scene coverage and every locked audio file. A future actor or scene cannot silently inherit an unrelated portrait. New art keeps provenance, retained masters, credits, audition, missing-art fallback and media budgets together.

The candidate passes 515 unit checks, TypeScript and the production build. All 93 focused native browser cases pass across desktop Chromium, phone Chromium and WebKit, covering all fifteen actors at phone/desktop and narrow text-only sizes, split/custom-address quotations, loading, missing art, cancellation, automatic actor succession, source text preservation, saved-state parity and focus/scroll stability. All 290 active clips pass `production:voices`: named actor and highlighted words during playback, cue removal at natural completion and Stop, cached replay and source cleanup, with no browser or media errors. Four opening-load profiles retain a visible goal and no overflow; their largest encoded transfer plus HTML is 1,985,445 bytes, within the 2 MiB budget. The production asset report has no budget violations. Full campaign, exact-commit CI and public deployment evidence are retained separately outside Git.

These are internal and simulated checks using the available development proxy. Generated art and technical playback do not establish independent perceptual listening or visual acceptance. This phase makes no higher grade or AAA certification claim.
