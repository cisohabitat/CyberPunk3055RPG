# Complete campaign art and character dialogue

The user selected character dialogue only. This release covers the authored campaign rather than another small excerpt batch: every scene has an explicit art decision, 195 scenes have framed illustrations, and the two chapter cards remain text-led. The dialogue catalog covers every fixed spoken quotation found by the campaign/source audit. Written messages, advertising, source labels, player questions and arbitrary player-name addresses remain text-only.

## Coverage and authoring

| Item | Coverage |
| --- | --- |
| Story | 197 scenes, 587 choices; unchanged |
| Campaign fixtures | 140 complete authored replays; unchanged |
| Source audit | All 197 scenes; 859 reachable text variants plus conditional samples, 1,056 distinct variants total |
| Quotation review | 310 candidates, each with an explicit spoken/text decision and actual actor |
| Dialogue | 301 bindings in 119 scenes with spoken lines |
| Active voice files | 289: 100 preceding WAVs and 189 new MP3s |
| Retained files | All 101 preceding WAV hashes unchanged; the earlier Lumen capacity counteroffer is archived |
| Cast | Nine established styles plus six explicitly cast minor roles |
| Framed art | 195 scenes; 111 additional explicit bindings and ten new setting paintings |
| Chapter cards | `card_week`, `card_wall`; deliberate text treatment |

The dispatcher speaks the capacity counteroffer. Nia speaks her own witness-room words while Lumen/Sera remain canonical primary portraits where authored. Edda speaks the old-key request while Ives remains at the Spire queue. Ren speaks shelter/family lines, Lumen speaks her own sponsorship refusal and chair-room answers, and minor attendants and workers have their own voices. These changes grant no permission, evidence, safety, forgiveness, treatment or game reward.

The new settings establish architecture and objects without selecting an outcome. Clinic gauges do not assert a working pump, an empty freight passage supplies no receipt, relay art exposes no home, and the shelter stair/hall avoids depicting a leaking pump after repair or a private room before reservation. Existing appropriate paintings are reused for later conversations. Portrait conduct, four original finale compositions, alt descriptions, 1200/600px delivery and text-only/missing-art behavior remain.

## Playback

Revealed fixed dialogue is queued in reading order. Additional paragraphs append without restarting the current actor. One voice plays at a time. Listen replays the selected entry; Play all dialogue replays the visible conversation. The transcript and line selector contain only revealed dialogue.

Stop consumes the visible queue. Dialogs, notebooks, sheets, scene departure, mute, zero voice volume and pagehide cancel playing/pending sources and prevent late fetches from starting. Closing an overlay or Resume sound does not restart interrupted visible lines. Newly revealed later dialogue can play normally. Manual mode fetches no speech automatically. An unavailable file leaves text and choices intact and allows later actors to play.

Sound and automatic character dialogue stay enabled by default, with saved preferences honored. The existing independent buses, speech ducking and 24 MiB decoded-buffer cache remain. New 96kbps mono MP3 deliveries reduce whole-campaign payload; faithful PCM masters and normalized intermediates are retained outside Git. No speech model, service or player-text synthesis ships.

## Repeatable checks

```bash
npm test
npx tsc --noEmit
npm run build
npm run story:replay
npm run production:report
npm run test:browser
npm run production:voices -- http://127.0.0.1:3101 --workers 4
```

The voice verifier selects displayed source examples, plays each active file to its native natural end, checks transcript parity, replays from the bounded cache, stops it, confirms unchanged saves and checks disposal after mute. Source examples are explicitly separated: 239 files have authored-route examples, 41 use seeded legal-route examples and nine use synthetic conditional branch samples. Branch samples are rendering checks, not completed legal player routes.

New regression coverage verifies actor attribution, quotation delimiters, conditional alternatives, arbitrary handles, source hashes, ordered playback, reveal while speaking, unavailable files, Stop/overlay/pagehide cancellation, manual playback and responsive/text-only art. Raw states, captures and local reports stay outside Git at `/workspace/saint-shard-validation/full-campaign-media/`.

## Verification record

The candidate passed 508 unit checks, TypeScript and the production build. All 140 authored routes remain valid. The production inventory has no static media/script/style budget violations. Focused desktop/phone Chromium and WebKit checks passed 78 campaign/automatic-voice/art cases and 75 existing audio/voice regression cases. The preceding attributed-reaction run passed 138 cases; its three outdated single-excerpt natural-end assertions were updated and passed in the 78-case rebuilt run. The newly added line selector's native label was corrected after its accessibility test exposed option text being included in the label.

Whole-file native voice playback, complete keyboard campaigns, opening transfer measurements and exact-commit Test/Build/production publication are checked as separate release evidence. Their machine reports are private; completion is recorded only after each check actually finishes. These technical/source-familiar checks supply the available development proxy, not independent human participation, physical devices, commissioned acting or listening acceptance. The provisional overall grade remains 8.2.

The local native Chromium clip verifier completed all 289 active files in 586.786 seconds with four QA workers. Every file fetched once, played to its natural end, replayed from cache, stopped and released all sources after mute; page errors and failed audio requests were empty. The 101 original WAV hashes stayed unchanged.

Four complete native WebKit keyboard campaigns finished at Names, Listed, Witness and Quiet. Together they visited 307 scene steps. The three illustrated/sound campaigns completed 165 dialogue entries naturally; the 320px text-only/silent campaign made no post-preference artwork or audio requests. Every fixture reload checkpoint, canonical outcome and final source cleanup passed, with no page errors or failed media. This is internal directed play rather than human participation.

The opening probe kept goals visible without overflow at 390px and 1440px. Its largest measured encoded-resource-plus-HTML transfer was 1,982,410 bytes, below the unchanged 2,097,152-byte limit. These four synthetic loads establish the transfer bound only, not field performance percentiles.
