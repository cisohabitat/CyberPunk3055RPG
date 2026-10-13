# Neighborhood art and voice cycle

This cycle makes district work and later replies more present without changing story choices, consent, evidence or earned outcomes. Four setting illustrations accompany thirteen existing scenes. Fourteen authored quotations expand the current inventory from 75 to 89 while preserving every preceding WAV and the established nine stock cast voices.

## Art decisions

| Plate | Binding | Continuity |
| --- | --- | --- |
| Clinic dispatch desk | Ten briefing, source, method, allocation, offer, counter, capacity, privacy and receipt scenes | Loose blank stationery describes a workspace, not a literal committed schedule. No patient identity, address, attendance or accepted contact is depicted. |
| Repair bench | `act2_workshop` | Four unclaimed tool types describe available equipment. No purchase, ownership or care result is shown. |
| Shelter pump | `act2_shelter_methods` only | Visible dripping belongs to the unresolved repair decision. Completed repair, hall arrival and room allocation do not reuse this plate. |
| Witness checkpoint | `act2_witness_checkpoint` | Empty scanner corridor describes the inspection setting. Kerr’s portrait remains. No crossing clearance, exposed identity or protected destination is implied. |

Each plate retains the image-generation PNG, complete prompt and hashes. JPEG deliveries only resize and encode at 1200×800 and 600×400. `qa/media/scene-art.json` enumerates every binding; `lib/art.ts` supplies descriptions and captions. Silent/text-only preferences and missing-file fallback remain required.

## Voice direction and bindings

Lumen has eight additions: three clinic capacity/privacy/counteroffer limits, three distinct accepted-work replies, and two recovery lines. Edda has three additions: a clean receipt handover and separate traced/untraced recovery answers. Quill reminds the runner to retain a care budget; Sera invites a daylight return after any shelter outcome; Mara waits for the desk’s answer in her present-day conversation.

All lines quote existing visible authored words. Lumen’s three work replies are mutually exclusive; Edda’s recovery alternatives follow the actual badge trace. Existing clips are never shadowed by an earlier generic addition. The preceding 75 deliveries are locked by SHA-256 in `qa/media/neighborhood-art-voice.json`. Stock Kokoro v1.0 styles remain `af_heart`, `af_kore`, `am_michael`, `af_bella` and `af_sarah`; no actor or individual voice clone is claimed.

Optional offline generation retains PCM masters and pinned model/style hashes. Delivered WAVs are mono 24 kHz PCM16, normalized to 0.72 peak with short silent edges and bounded sentence pauses. The optional audition script records measurements and a fourteen-interval MP3 preview. Neither generation nor the speech model runs in production.

## Verification and release scope

Unit coverage checks route reachability, exact visible speaker/text selection, delivery provenance and all retained hashes. Four additional composition cases exercise phone, desktop and 320px text-only play, unchanged saves, visible goals, responsive image decoding and missing-art fallback. Fourteen actual-route voice cases check automatic revelation, exact selected playback, Stop cleanup, unchanged save contents and no replay after closing Settings.

Native playback checks exercise all new lines using full authored replay states: natural completion, cached manual replay, Stop, source disposal and media errors. Phone and desktop screenshots inspect each new setting. Production media reports and the existing opening-transfer budget remain required. Remote CI verifies the exact pushed commit before the existing production gate permits deployment; public asset hashes and live checks confirm release delivery. Raw states and temporary release proof remain outside Git.

The campaign remains 197 scenes, 587 choices and 139 authored complete replay fixtures. Version 2, `saint-shard-3055-v1`, pending rolls, 1d10, stat/strain caps and all four original finales remain unchanged. Source-familiar simulated play remains the available development proxy. The provisional internal grade remains 8.2; technical checks are not independent listening, artistic, rights or physical-device acceptance.

Local release checks: 492 unit checks pass, TypeScript and the production build succeed, and all eight phone/desktop setting screenshots show visible goals without overflow or browser errors. The report lists 253 media assets with zero budget violations. Four opening-transfer probes retain the 2 MiB budget; maximum measured HTML plus encoded resources is 1,958,653 bytes. These are synthetic local measurements, not field latency claims.

The focused local browser suite passes all 156 checks across desktop Chromium, phone, autoplay-permitted Chromium and WebKit with no retries. All fourteen new quotations pass native WebKit automatic playback, natural completion, one-request cached replay, explicit Stop and full source disposal, with no page or media failures.
