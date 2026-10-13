# Whole-scene reading and campaign dialogue review

The game now displays the complete scene by default. Missing, corrupt or incomplete preferences use this default; players who explicitly saved paragraph pacing keep that choice. Paragraph reveal controls remain available in that mode. Automatic character dialogue stays enabled for new players and follows the displayed conversation in order.

## Campaign review

The review covers the existing 197 scenes, 587 choices and all 140 complete authored replay fixtures. The preceding campaign audit's 1,056 distinct prose variants remain applicable because this cycle changes no story wording, choices, checks or outcome rules. Written messages, advertisements, player questions, custom player addresses and narration remain readable text. They do not acquire an invented speaker.

All 299 bound quotations match the concatenated words and actual actor of their 302 bindings. Each referenced file matches its authored delivery transcript; ordered parts cannot omit or duplicate words. These checks now run in the normal unit suite, alongside conditional quotation selection, explicit secondary attribution and the revealed failed-bluff result. The transcript marks the line currently playing without moving focus or scrolling the scene.

An independent offline English transcription pass checks all 290 active delivered files without supplying the expected text as a prompt. A stronger recognizer rechecks candidates. Numbers, fictional names, homophones and short utterances produce recognition differences; those differences are review candidates, not proof that a different sentence was spoken. Source text, casting, hashes, signal checks and native playback provide separate evidence. No speech recognition library or model ships in the game.

## Improvements

- Ren Calder is explicitly a woman in her canal introduction. Her eight clips now use the reviewed stock `af_jessica` casting; ids, words and branch selection remain unchanged. The nine established principal voice styles remain.
- Six deliveries receive a measured word-clarity pass for past-tense consonants, plurals and word boundaries: Ren's hall response and annex terms, Lumen's invitation to sit, Quill's introduction follow-up, Sera's pause boundary and the orderly's scanned pass. Two belong to Ren's eight recast clips, so twelve distinct active files change overall. Original masters and prior deliveries remain archived outside Git.
- Two new character-focused paintings replace neutral settings during the stallholder's two opening dialogue scenes and Ren's canal introduction/returns. They show no completed payment, evacuation, repair, declaration or source verdict. Explicit scene decisions, responsive JPEGs, alt descriptions, retained originals, provenance, credits and the audition remain together.
- The optional offline generator now considers actor, stock style, speed and phrase segments before retaining an existing clip. A casting or phrasing edit can no longer silently retain an old delivery merely because its words match.

Coverage remains 290 active files across 120 spoken scenes, with 195 illustrated scenes and two deliberate text chapter cards. All 101 earlier WAV files remain unchanged. Complete text, saved mute/manual preferences, independent volume controls, missing-media fallback, cancellation, source disposal and the 24 MiB decoded cache remain required.

## Verification and limits

The normal suite passes 512 unit checks, including all 140 complete replay fixtures, exact word/actor alignment and preference migration. TypeScript and the production build pass. Native browser regressions exercise whole-scene defaults, explicit paragraph reveal, ordered actors, transcript selection, interruptions, saved dice and art at phone/desktop and text-only sizes. Complete keyboard campaigns and whole-file voice playback are recorded separately in private release evidence; exact-commit CI and live checks remain release requirements.

This is internal and simulated validation using the available development proxy. Transcription is not perceptual listening acceptance, and generated art is not commissioned art approval. No higher grade or AAA certification is inferred. Save version 2, `saint-shard-3055-v1`, recorded dice, 1d10/caps, evidence/consent and all four finales remain unchanged.
