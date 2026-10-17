# Speech progress and delivery review

Dialogue controls now show the selected or playing part as “Line X of Y.” A delivery review also produced one clearer orderly recording. This cycle keeps all authored words, actors, bindings, scene art, rules and saves intact.

## Player behavior

The existing polite status identifies the current line during loading and playback. When idle, it identifies the selected line without claiming the conversation has completed. Stop retains its existing behavior: it consumes the visible queue and returns to the preferred selection. Listen replays that selection; Play all dialogue explicitly restarts the visible conversation.

The total comes from revealed dialogue only. For example, Mara’s first visible reply shows “Line 1 of 1”; revealing Lumen’s reply changes it to “Line 1 of 2” without restarting Mara. A multiline quotation waits for its closing quotation mark before entering the queue. Status updates neither move focus nor scroll the scene. Saved sound, voice volume, manual playback and paragraph settings remain respected.

The flow is local: revealed authored text → reviewed dialogue bindings → selected delivery and playback status → matching quotation highlight and actual-speaker portrait. There is no API, database, runtime speech model or additional environment variable.

## Release baseline

The preceding correction, `3d9349242add35dfdd45995a692fa38b1212a0e4`, passed Test, all four Browser projects and Build in [CI run 39038619897](https://github.com/cisohabitat/CyberPunk3055RPG/actions/runs/39038619897). Production was verified READY on that exact commit as deployment `dpl_9mjZeuG5WkbPp2GFzsbLeVargdmi`. The earlier restored Quill/Lumen speeches are therefore live. This does not establish publication of the current progress/clarity change; its own exact-commit CI must pass.

## Delivery findings

Fresh FFmpeg decoding and post-runtime-trim EBU-R128 measurements covered all **294 active files**. Playback levels ranged from **−23.53 to −23.35 LUFS**, with a maximum true peak of **−1.54 dBTP**, within the established target/tolerance and ceiling. Exact hashes and gains matched the reviewed inventory. These are technical measurements, not a judgment of emotional delivery.

A **24-clip sample** covers all **15 voice roles**, including all nine conditional examples currently found only through branch sampling. Unprompted Whisper small.en transcription matched 18 samples after case/punctuation normalization. Three further differences were written numbers or the spelling “canceled/cancelled.” Three samples received follow-up rather than silently treating recognition differences as delivery defects:

| Delivery | Finding and action |
| --- | --- |
| Quill’s conditional ninety-creds offer | Medium.en resolves “He is paid” correctly; written numbers and the name/homophone “Kerr/care” remain recognition differences. Original retained. |
| Masked attendant: “This vein is hot,” | Both models read the isolated short clip as “hard.” Medium.en transcribes the original correctly when followed by its actual next delivery, “You are not on the hot list.” A slower candidate offered no demonstrated improvement; original retained. |
| Orderly: “Pass still scans,” | Both models merge the original into “Pastel scans.” A short pause after “Pass,” at the same `am_puck` casting, yields the exact words in independent unprompted medium.en transcription. This is the only retained replacement. |

The orderly retake remains restrained and matter-of-fact. Its words, actor, binding key and portrait are unchanged. The existing district-board painting and orderly portrait remain suitable; no new setting, outcome or permission is depicted. Source PCM is retained outside Git. The preceding MP3 remains in `qa/media/speech-clarity-baseline/`, and the media review page offers both takes. Active audio grows by **6,336 bytes**; retaining the preceding take adds **18,476 bytes** outside the shipped public assets.

The independently measured orderly playback is **−23.48 LUFS / −6.95 dBTP**. Other 293 active deliveries, their level entries and every dialogue binding remain byte-identical. `qa/media/speech-clarity.json` records all preceding active hashes, the explicit replacement, source/provenance, transcripts and art decision. Historical tests verify the retained preceding bytes through the explicit replacement record rather than regenerating older baselines.

## Branch and player checks

The new conditional-dialogue browser checks cover nine fixed examples at **390px and 1440px**: Quill’s alternate offer and later introductions, Nia’s contact pause and shift reply, Kerr’s pump/collection responses, and Sera’s two interpretation challenges. They check the selected part count, exact highlighted words, actual actor, loaded portrait, chosen MP3, Stop/source disposal, no horizontal overflow, no page/media failures and unchanged save bytes.

These cases use labeled source checkpoints. They do not claim nine newly completed UI campaigns or independent participants. Existing 148 authored full-route fixtures, the full browser matrix and all balance comparisons remain required.

The initial **58 focused desktop/phone browser cases passed**, covering the nine branch samples, natural multiline completion, two-character queues, paragraph expansion, manual replay, mute/zero-volume settings, missing audio, cancellation and held dice. A separate **24-clip natural-playback run** passed across every role with no page/audio-request failures; it verified transcripts, gain selection, natural disposal, explicit replay, Stop and unchanged saves. That run preceded the orderly replacement.

Final production-player checks passed for both the revised orderly and unchanged attendant in **manual and automatic modes**, including the attendant’s complete two-line queue. Correct measured gains, natural completion, replay, Stop, source disposal and unchanged saves were verified without page/audio-request failures. An additional **12 Chromium speaker-presentation cases passed**, covering all 15 roles at 390px, 1440px and 320px text-only widths, loading/focus/scroll, missing art and accessibility. Total focused browser coverage is **70 passing cases**. A final fresh decode/measurement pass over all 294 active files retains the same stated level/peak range.

The final source suite passes **625 tests**, and TypeScript, the production build and production report pass with no asset-budget violations. Local Firefox/WebKit launch setup remains unavailable; their complete remote projects remain mandatory release gates. The graph remains **197 scenes / 598 choices / 148 authored routes / 306 bindings / 294 active voices**. No higher overall grade or independent listening acceptance is claimed; the provisional grade remains 8.2.

## Evidence and limits

Committed evidence: `qa/media/speech-clarity.json`, the retained preceding recording, campaign authoring/provenance, current mastering data, credits, the media review page, and the focused browser/source tests. Source PCM lives under `/workspace/saint-shard-validation/speech-progress/masters`.

Temporary raw evidence uses `/tmp/saint-shard-speech-*`, including baseline levels, 24-clip transcriptions/playback, medium.en confirmations, full attendant conversation, browser traces and final source/build logs. Model snapshots are pinned in the transcription evidence; decoding uses FFmpeg at 16 kHz mono without an expected-text prompt. No real player save or personal recording was used. Synthetic viewports and source-aware automation remain the available review proxy; emotional quality and every possible reachable state are not certified by these checks.
