# Opening revision

The previous new-run flow moved from a character form straight to Quill’s job offer. Its first goal already named Mara and Kerr before either had been introduced. Origin flavor existed, but the player had no scene establishing the city, their role, or why they were taking work.

The revised opening gives the player four short playable beats:

1. **Kite City at night:** a concrete invitation from Quill, the runner’s role, the dome and towers, and memory editing explained through an advertisement. The job’s central revelation is not disclosed.
2. **Your life tonight:** origin and complication supply personal circumstances. The player chooses survival, ownership of their life, or a way out as their reason to hear the offer.
3. **The approach:** reach the night market and choose whether to listen to the stallholder before meeting Quill.
4. **An ordinary person’s memory:** an optional account of someone selling an evening to pay rent makes the premise human before it becomes a mission objective.

The chosen reason and conversation echo in the job briefing. No opening choice changes resources or grants evidence. The arrival goal changes to the original job goal at the meeting. Returning players can go straight to Quill; old saves stay where they were. The existing paragraph reader, whole-scene setting, saves, keyboard access and text-only mode all apply.

All 29 deterministic campaign fixtures now cover a new-run opening or its explicit skip; their existing campaign outcomes remain the same. Engine regression covers all 27 origin/complication/motivation combinations, checkpoints, optional conversation, skip and old saves. Browser regression starts actual new characters and follows the introduction into accepting the job.

Human follow-up: have first-time readers play without explanation. Ask who they are, how memories work, why they are meeting Quill, and whether the stallholder made the job more interesting. Observe early abandonment and comprehension before extending the prologue further. Authored setup and passing automation improve the opening but do not establish an independent experience grade.

Validation: 176 unit tests, TypeScript checking and the production build pass. The full local browser sweep passed 171 cases across desktop Chromium, phone Chromium and WebKit; after removing redundant opening guidance, all twelve opening cases passed again. The production report covers all eight opening choices within 115 scenes, 302 choices and 29 full campaign fixtures, without budget violations. A phone UI replay reached Left to the Rain after 89 snapshots across 65 scenes; a desktop replay reached Already Loose after 63 snapshots across 50 scenes, both without runtime errors. Each opening scene also fit 320 pixels with largest text and high contrast, with the arrival goal visible. Four synthetic production samples of the first prologue scene fit the transfer budget and had no horizontal overflow. CI includes the full Firefox matrix as well; these checks remain separate from the proposed independent reader study.
