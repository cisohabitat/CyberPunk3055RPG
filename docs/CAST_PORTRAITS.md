# Full-cast portrait phase

The character sheet previously listed nine recurring contacts as text and omitted six supporting portrait identities. This phase supplies illustrated met-character cards for all fifteen and fills eight expression gaps while preserving established faces, clothing and actor casting.

## Player experience

Open **People** in the character sheet. Each encountered character has a neutral portrait, name, role and the existing factual shared history where available. The native disclosure starts collapsed, works with Enter/Space and does not download thumbnails until expanded. Small 160 × 213 JPEGs serve the roster; names and roles survive disabled artwork or a missing file. The current scene retains its separate actual-speaker portrait and speaking cue.

New scene expressions cover Asa's practical terms, Edda's archive scrutiny, Ren's attentive conversation, the Orderly's practiced courtesy, the Stallholder's memory-trade reflection, the Dispatcher's consideration, the Mechanic's explanation and the Masked attendant's alert eyes. The other seven leads retain their reviewed expression sets. No expression establishes payment, permission, repair, delivery, authentication, forgiveness or safety.

## Integration and compatibility

- `lib/story/cast.ts` enumerates all fifteen identities, safe roles, neutral thumbnail paths and encounter flags. Actual attributed dialogue identifies secondary speakers; a mere name in prose does not.
- The current roster uses actually revealed text, respecting paragraph reading. On scene departure, the engine records actors present in the authored conversation using the existing fixed dialogue bindings. This carries encounters through compatible version-2 saves; it does not infer unobserved actors from old saves.
- Explicit scene/actor expression lists are in `lib/art.ts` and `qa/media/cast-portraits.json`. Existing earned refusal/breach expressions keep precedence. Primary scene art decisions remain aligned; secondary expressions follow the actor who is actually speaking.
- Cards are passive. Opening them changes no stats, credits, faction standing, items, promises, evidence, consent or held die. Save key `saint-shard-3055-v1`, 1d10 rules, caps and all four endings remain.
- Existing campaign words, 302 voice bindings, 290 active deliveries and archived recordings are unchanged. The preservation inventory also locks every preceding art and sound file. New thumbnails do not load on the title or guide.
- README and AGENTS describe the same behavior. Credits, audition and source/reference/delivery provenance accompany all new assets.

## Verification

Source checks cover fifteen unique identities, matching thumbnails, explicit expressions, unchanged media, revealed secondary actors, saved encounter flags and recorded-die preservation. Browser checks cover phone/desktop/largest-text text-only cards, all new audible actor expressions, missing-thumbnail fallback, paragraph revelation and actual reload. Complete keyboard campaign play, source/type/build checks, the required full browser matrix and public deployment verification form the release evidence; results are recorded after execution.

Pre-push checks passed: 545 source tests, TypeScript, the production build and all 140 authored replay fixtures. Nine gallery profile checks and three missing-actor fallback checks passed across local Chromium, phone Chromium and WebKit. Four native-policy first-visit probes stayed below the unchanged 2,097,152-byte transfer budget (maximum 1,999,185 bytes), with visible goals, zero measured layout shift and no horizontal overflow. The new deliveries total 892,216 bytes; every individual media file and compressed script/style inventory remains within its budget. The final combined browser pass, full exact-revision CI, voiced campaign play and public checks are release evidence, rather than an automatic grade increase.

This is presentation and recognition work. It introduces no new campaign scene or actor dialogue and does not establish a higher grade. The provisional internal whole-game grade remains 8.2; current scope remains 197 scenes, 587 choices and 140 authored complete replay routes.
