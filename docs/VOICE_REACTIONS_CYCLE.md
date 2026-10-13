# Character reactions and hearing voices

The 13 October cycle adds eighteen fixed quotations, bringing the current inventory from 45 to 63. The goal is to make consequential choices audible without voicing navigation or general narration.

## Coverage and direction

- Mara: five distinct follow-up replies for courier/company, declined company, walking the reply, next-batch dispatch and the still-pending envelope. Warmth, disappointment and unfinished work retain their separate meaning.
- Kerr: understated acknowledgement of private terms and a firm response to breaking them.
- Edda: archive access, public-name permission and private payroll terms, keeping source custody and employment separate.
- Sera: the purpose of the hearing, a correction, the invitation at the wall and ordinary shared laundry work.
- Ives and Nia: the hearing’s evidentiary challenge and the witness’s exact quotation limits.
- Lumen: a relay booking’s limits and the consequences of withdrawing an observed window.

Every clip preserves the existing quotation and actual speaker. All cast styles are unchanged. Sentence segments use bounded delivery speeds and 260ms inter-phrase pauses; each clip retains the established headroom, short fades and silent edges. All 45 earlier WAV hashes are locked in `qa/media/voice-reactions.json`. No previous performance is regenerated.

## Playback and accompanying art

The existing player controls apply: automatic dialogue on for fresh preferences, exact quotation reveal before speech, explicit Listen/Stop, independent voice volume and saved mute/manual mode. Dialogs, departure, page hiding and mute cancel pending or active speech. Audio does not change state or hold choices until completion.

All additions use existing scenes. The current `qa/media/scene-art.json` decisions and Mara window, Kerr stall, Edda archive/records, Sera wall/shelter, hearing table, Nia room and Lumen clinic assets are suitable. No new illustration, scene, outcome, evidence or permission is introduced. Existing room ambience, score and speech ducking accompany the lines.

## Reproduction and audition

Use the pinned Kokoro v1.0 model/style vectors documented in `qa/media/voice-provenance.json` with optional `scripts/generate-voices.py --only` and the eighteen ids in `qa/media/voice-reactions.json`. Retain masters in `/workspace/generated_audio/voice-reactions`. Run optional `scripts/voice-reaction-audition.py` afterward to validate preceding hashes, record source and delivery measurements and assemble the indexed preview. Builds use the checked-in assets; no model or synthesis service ships.

Listen through [the media review page](../qa/media/review.html) or [the indexed preview](../qa/media/voice-reactions-preview.mp3). The audition includes exact delivered clips with one-second gaps; labels and phrase intent are in `voice-reactions-audition.json`.

## Validation and limits

The source/signal check verifies authored-route reachability, actual speaker, exact visible text, unrevealed-quote exclusion, delivery hashes, mono 24kHz PCM16, headroom and edge silence for the complete inventory. Dedicated browser scenarios cover all five Mara alternatives and both Lumen replies without altering saves or replaying stopped lines when dialogs close. `production:voices --automatic` checks native playback, natural completion, cached replay, Stop, transcript parity and full mixer cleanup for every reachable line. Existing automatic-dialogue checks retain mute, manual mode, attribution and delayed-load cancellation coverage. Production remains gated by the complete required CI and transfer budgets.

Raw states and playback reports remain outside Git. These are source-familiar technical/proxy observations, not independent listening, emotional-performance, pronunciation, fatigue or physical-device acceptance. Clip count alone does not change the provisional overall grade of 8.2. Save version 2, the original save key, recorded rolls, consent and evidence boundaries and all four finales remain unchanged.
