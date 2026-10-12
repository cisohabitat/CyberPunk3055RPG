# Automatic dialogue and voice expansion

New players start with Sound enabled, voice volume at 70%, and **Play dialogue automatically** enabled. Starting or continuing the game supplies browser audio activation. The menu theme retains its Play/Stop control.

Returning players retain their saved Sound off and zero voice volume choices, including the legacy `saint-shard-sound` key. Missing automatic-playback preferences adopt the new default; an explicit `autoVoices: false` remains manual. Settings exposes that choice beside Sound and the channel volumes.

## Coverage

There are 45 fixed stock synthetic quotations, up from 22. All 22 earlier delivery files remain byte-identical. The 23 additions cover Quill's advance, negotiation, routes and ownership answer; Lumen's introduction; Mara's reason and recorded interview; Kerr's confrontation; the three origin contracts; archive access; clinic notice work; the Week's Kerr/Lumen conversations; Nia's transfer terms; checkpoint and breach recovery; Nia's later contact boundary; and Lumen's burned-hour response.

These are existing authored quotations, spoken with the established seven character voice identities. They do not introduce new story choices, outcomes or scenes. Existing suitable portraits and illustrations accompany the scenes. A conditional line is selected only when the visible quotation and scene speaker match; a scene's declared speaker is not permission to voice another character's quotation.

## Playback behavior

- Reveal the exact quotation to trigger one automatic attempt per scene visit. Whole-scene reading reveals it immediately.
- Stop interrupts playback; Listen permits a deliberate replay. Automatic playback never waits for the line to finish before making choices available.
- Settings, other dialogs, drawers, pending checks, scene departure, Sound off, zero voice volume and pagehide cancel pending or active speech.
- Closing a dialog or resuming a paused page does not automatically replay a stopped/interrupted line. Continuing a run after a reload is a new scene visit.
- Failed loading leaves the written dialogue and choices available, with a Listen retry. Manual mode requests no voice until Listen.
- Reveal counts belong to the current scene and prose, preventing a new scene from inheriting revealed paragraphs from its predecessor.

The existing separate mixer buses, speech ducking, 24 MiB decoded-cache bound, source disposal and optional audio behavior remain. No runtime speech service, trained model or player-text synthesis ships.

## Assets and reproduction

`qa/media/voice-lines.json` locks the exact words and stock voice settings. `qa/media/voice-provenance.json` records pinned model/style-vector hashes, licenses, retained master paths, source/delivery hashes and signal metrics. The optional `scripts/generate-voices.py --only ...` generates selected authored lines offline; builds and CI use checked-in WAVs.

The complete audition is [voice-expansion-preview.mp3](../qa/media/voice-expansion-preview.mp3), indexed by [voice-expansion-audition.json](../qa/media/voice-expansion-audition.json). The [media audition page](../qa/media/review.html) also provides each new quotation individually. These are stock synthetic voices; no actor session or individual voice clone was commissioned.

## Verification

The initial local candidate passed 485 unit/replay tests, TypeScript, a production build and media budgets (186 public media assets before the lossless bed deliveries). The seven new automatic-dialogue scenarios passed on desktop Chromium, phone Chromium and WebKit (21 checks). Twenty-eight Chromium audio/sound regression checks passed, retaining explicit manual-mode coverage.

`npm run production:voices -- URL --automatic --out PATH` verifies all 45 reachable quotations through automatic start, natural completion, transcript parity, cached replay, Stop and mixer cleanup. Without `--automatic`, it exercises manual playback. `npm run production:experience` retains deliberate manual playback for its keyboard campaign checks. The deployment remains gated by the full four-browser CI suite.

State-bearing browser results stay in private local QA outputs. Source-familiar simulated play remains the available development proxy. Technical playback and signal measurements do not establish pronunciation quality, emotional performance, human listening comfort or physical-device acceptance. The provisional internal grade remains 8.2; clip count alone does not raise it.

Save version 2 and `saint-shard-3055-v1`, recorded pending dice, 1d10, stat/strain caps and all four original finales are unchanged.

### Startup transfer correction

Default Sound exposed an existing uncompressed-bed cost: the first desktop probe measured about 7 MB with illustrations, above the unchanged 2 MiB budget. Fifteen background beds now ship separate lossless FLAC files plus deterministic gzip HTTP transport, preserving every PCM sample and all original WAV masters. Next.js before-file rewrites and Content-Encoding headers serve the compressed transport at the FLAC URLs. Voice WAVs and the supplied title theme are unchanged. `qa/media/bed-delivery.json` records the hashes, encoder options and decoded PCM parity; the optional authoring script never runs in CI or builds. Browser checks exercise the actual FLAC URLs, decode, loop continuity, cancellation and source cleanup. A legacy notebook test explicitly selects manual, initially muted preferences before enabling Sound, preserving its original interruption assertion under the new defaults.

The corrected local candidate passed 486 unit/replay checks, TypeScript and the production build. The four startup probes passed the unchanged 2 MiB budget: illustrated desktop measured 1,954,228 bytes, text-only desktop 1,035,552 bytes, illustrated phone 1,616,012 bytes and text-only phone 370,835 bytes. These are synthetic ready-to-play measurements, not field percentiles; resources still loading at that point are excluded. The public media inventory is 216 assets, with no per-asset budget violations.

### Font build dependency

The first compressed candidate’s CI build failed in Next’s Google-font URL parser before browser testing. The same 23 WOFF2 files from the successful local build are now checked in, retaining all 53 original font-face declarations, Unicode ranges, weights, styles, fallback metrics and five Latin preloads. The typefaces remain Rajdhani and Literata, with SIL Open Font License copies and hashes. Builds no longer depend on a remote font response. This build repair changes no story or voice delivery.
