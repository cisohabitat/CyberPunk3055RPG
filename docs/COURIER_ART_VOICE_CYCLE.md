# Courier voices and illustrated conversation settings

Four scene illustrations and twelve fixed synthetic quotations give existing conversations a distinct place and make Asa an audible character.

## Illustration decisions

| Plate | Existing scenes | What the image establishes |
| --- | --- | --- |
| Hearing table | Scope, quotation limits, challenge, correction and filing decision | An unfiled table with blank cover sheets, a recorder and a closed sleeve. |
| Archive desk | Access, preparation, comparison, challenge, retrieval and custody | A neutral service desk, closed maintenance ledger and dark reader. |
| Courier table | Asa’s later visit, stock-book query and reflection | The neighborhood workshop, courier satchel and routing slips. |
| Laundry cart | Sera’s neighborhood laundry visit | Damp clothes awaiting the next ordinary job. |

All fifteen scene ids are explicit in `qa/media/scene-art.json` and `lib/art.ts`. No image establishes authenticated evidence, consent, publication, cargo arrival, an earned clearance, a completed wash or patient treatment. The hearing plate does not accompany Nia’s separate-room relay reply. Existing actual-speaker portraits remain. Silent/text-only preferences, visible goals, lazy loading and unavailable-image fallback remain supported.

The new plates match the painted noir palette: worn metal, practical amber lights, petroleum-blue rainlight and ordinary objects. No new character likeness is introduced. Original generated PNGs are retained at their recorded source paths; 1200×800 and 600×400 JPEG deliveries are resize/encode only. Full prompts, source/delivery hashes and dimensions are in `qa/media/art-provenance.json`.

## Voice coverage

Asa gains the distinct stock `af_alloy` style with practical, measured phrasing. Ten quotations cover freight terms, exposure, earned/unconfirmed results, private/exposed/late receipts and identity/survival/exit reflections. Nia’s additional line asserts ownership of her room; Ives’s line recalls the file behind the old badge. Their existing voices remain.

There are now 75 clips across nine stock cast styles. All 63 preceding WAVs are hash-locked in `qa/media/courier-art-voice.json`. Every new line preserves exact visible authored text and its actual speaker. Conditional selection cannot invent delivery, clearance, source proof or permission. The written text and choices remain available during speech and in silent play. Automatic dialogue remains on by default; saved mute, zero voice volume and manual mode remain respected. Listen/Stop, natural-end cleanup and cancellation retain their existing behavior.

No model, runtime speech service or player-text synthesis ships. Optional `scripts/generate-voices.py --only` uses the pinned Kokoro v1.0 model/style vectors. New masters are retained under `/workspace/generated_audio/courier-art-voice`. Optional `scripts/courier-voice-audition.py` validates preservation and signal measurements and creates [the indexed preview](../qa/media/courier-voice-audition.json). The [media review page](../qa/media/review.html) includes every new image and voice.

## Verification scope and limits

Two additional complete replay fixtures exercise the existing survival and exit motives through Asa’s reflection while retaining registered delivery consequences. The corpus now has 139 authored full fixtures; the graph remains 197 scenes and 587 choices. Source/signal checks cover reachable alternatives, actual speakers, exact words, hashes, edge silence and headroom. Browser verification covers responsive art, visible goals, text-only and missing-art play, conditional reveal, native playback, natural completion, replay and cancellation. Production remains gated by the full four-browser CI and unchanged media/transfer budgets.

Raw state-bearing reports stay outside Git. Source-familiar simulated play remains the available development proxy. Technical measurements do not establish independent visual, pronunciation, emotional-performance, listening-fatigue or physical-device acceptance. The provisional overall grade remains 8.2. Save version 2, `saint-shard-3055-v1`, recorded dice, 1d10, stat/strain caps, consent/evidence boundaries and all four original finales remain unchanged.
