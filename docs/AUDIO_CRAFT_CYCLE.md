# Audio craft cycle — 11 October 2026

## Player problem and scope

The visual staging pass brought present-day Mara, Nia’s arrival and Kerr’s handover closer to the player. Their sound coverage lagged behind it: Nia had no fixed voice quotation, Mara’s current request and public refusal were silent, and Kerr’s handover needed three different lines to reflect the actual receipt. The clinic and witness room reused broader district ambience. The source audit covered all fourteen existing clips and scene mappings; it identified coverage and phrasing gaps, rather than claiming a perceptual listening session.

This increment adds six fixed synthetic quotations, replaces three existing deliveries with explicit phrase spacing, and stages three room textures. There are twenty voice candidates in total. No scene, written quotation, story consequence or art meaning changes. Existing character-led plates remain appropriate: the clinic envelope remains unsealed, Nia’s account has not been approved, and Kerr’s case remains closed.

## Voice direction and reproducibility

Nia uses the stock `af_nova` style; Mara retains `af_sarah`, Kerr `am_adam`, and Quill his existing style. Nia’s continuous quotation starts at “Now I want to hear the words…” because the earlier sentence is interrupted by narration. Mara’s public refusal only matches the public-refusal prose; Lumen’s clinic refusal does not play Mara’s clip. Kerr has separate private, breached-private and agreed-registration deliveries, selected from the exact visible text. Paragraph reading only exposes Listen once that quotation is visible.

Quill’s offer separates the identity, dawn deadline and intact-hour instruction. Mara’s revelation leaves space after the signed dump and the night-shift count. Kerr’s later boundary separates historical damage, acknowledgement and future contact. The manifest locks the exact words, phrase speeds and pauses. Six quotations have phrase segmentation; the other eleven original deliveries remain byte-for-byte unchanged. These are development delivery candidates, not a claim of professional actor performance or improved artistic acceptance.

`scripts/generate-voices.py` runs offline with the hashed Kokoro weights/style vectors recorded in `qa/media/voice-provenance.json`. It retains PCM masters outside the repository, bounds phrase speeds and pauses, applies edge fades and normalizes delivery to 0.72 peak with 80ms silence at either end. Builds and gameplay perform no synthesis. Superseded delivery/master hashes are retained for the three replacements. Model card and license texts remain in `qa/media/voice-sources/`.

## Room and mixer direction

| Room | Treatment | Staging |
| --- | --- | --- |
| Present-day clinic | Soft filtered room air, low hum, restrained outside drops | The voluntary request, refusal, reply and subsequent clinic conversations use quiet music |
| Witness arrival | Sheltered broadband rain and room air | Nia can review or defer her account; the bed adds no recording or consent cue |
| Ward Four stall | Closer awning rain and diffuse counter hum | Quill’s offer retains opening music; Kerr’s closed-case receipt uses quiet music |

`scripts/room-textures.mjs` produces deterministic original mono 64-second loops at 22050Hz. Periodic filter warmup, wrapped drop envelopes and a short endpoint correction keep the loop continuous. Each delivery is 2,822,444 bytes, below the existing 3MiB asset budget. The room is a replacement ambience bed, not an extra simultaneous layer. Existing district textures, scores, saved Chapel allowance and four finale identities stay distinct.

The runtime keeps its existing independent buses, 0.4 bed ducking during speech, crossfades, cancellation tickets and 24MiB decoded-buffer cache. Speech remains explicit Listen/Stop. Audio failure, zero voice volume and Sound off retain the prose and choices. No audio action spends currency, changes permission, resolves a die or writes story state.

## Audition and acceptance evidence

Open [the media audition](../qa/media/review.html) locally for before/after clips, six new voices and full looping room beds. [The 15-interval preview](../qa/media/audio-cycle-preview.mp3) includes paired old/new deliveries, room excerpts and the six new clips over settled default ducked buses. [Its manifest](../qa/media/audio-cycle-audition.json) records times, source hashes, gains and limits. Regenerate it with `python scripts/audio-cycle-audition.py` using NumPy and ffmpeg. The previous PCM deliveries come from the recorded released Git revision; compressed copies are retained for offline comparison.

Signal, hash, exact-quotation and read-only staging checks are automated. The new full `kerr-registered-handover` replay follows legal choices from creation through an original finale and saved checkpoints. Targeted browser checks exercise all six new quotations, non-autoplay, refusal exclusion, observed handover terms and late clinic-load cancellation. The twenty-clip production probe checks natural completion, explicit cached replay, Stop, disposal and unchanged save bytes on authored reachable states.

Simulated play remains the primary development proxy. Source/signal inspection and browser playback do not establish perceptual pronunciation, emotional performance, fatigue or physical-device acceptance. The internal overall grade stays **8.2/10**, with audio **7.5/10**, until an experience review supports a changed assessment. The next cycle is campaign craft: opening-to-finale pacing, optional-work density, consequence rhythm and build comparison across complete runs, followed by focused revisions to measured weak stretches.

## Candidate results

416 unit checks and the production build pass. Twelve targeted checks passed across desktop/phone Chromium and WebKit. All twenty clips completed naturally, replayed explicitly from cache and stopped cleanly; no voice error or failed media request was observed. Four full keyboard campaigns paired sounding/illustrated and silent/text-only play across 304 scene visits and 98 reloads, with 15 natural voice completions. The two route pairs reached identical scene sequences and final summaries, and each choice was checked against canonical complete state. No campaign page errors or failed media requests occurred; all four final audio inventories had zero live sources. These runs preceded the final extension that keeps stall ambience through all opening counter replies; final-code CI and public checks remain required. [The aggregate](../qa/editorial/audio-cycle-summary.json) records scope and limits without player saves.
