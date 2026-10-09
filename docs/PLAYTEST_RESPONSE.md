# Saint Shard playtest response

Source: **Saint_Shard_Playtest_Report.pdf**, version 0.3.0, October 9, 2026. This is one exploratory cloud Chromium playtest: a completed sale/open-street/Said Aloud route and a second route through the first chapter. Its observations are useful; it is not a blind cohort, physical-device test, or whole-game release certification.

| Report finding | Implemented response | Regression evidence |
| --- | --- | --- |
| UX01, P2: repeated memory material pushes new decisions down the page | Preserve interactive first inspection. Later memory scenes put fresh prose and choices before a collapsed source review, with keyboard skip access in either reading mode. | Browser tests at 400 × 605 in both modes, keyboard focus, review disclosure, source attribution, narrow-width accessibility. |
| UX03, P3: Settings grid overflow at 1180 × 756 | Use zero-minimum grid tracks and constrain intrinsic select/range widths. | Desktop, 400 and 320 pixel widths, all text sizes, forced classic scrollbar gutter and reopen. |
| UX02, P3: loading looks like a gameplay resource change | Announce the restored source and precise chapter/place. Start a fresh display session, retaining the actual restored state and recorded die. Add checkpoint labels to slots and confirmation. | Same-scene restore with changed resources, cancellation, existing backup/import and pending-die tests. |
| N01, P3 candidate: Lumen offers a marker, then says she has none | Distinguish offering, existing debt and refusal. Hearing her out does not transfer inventory. | Engine checks for absent/present marker, hearing, refusal and leaving. |
| Fight Kerr success cost is unclear | Preview both bounded resource costs before critical adjustments in choice and check dialog. Explain successful 10 and missed 1 strain adjustments. | Engine normal success, critical success, critical miss, cap and state-purity checks. |
| Promised copy becomes unavailable without clear closure | Explain the closed copying window after leaving the chair room with an unfulfilled copying promise. Do not claim every supply-cage miss closes it. | Promise/no-promise/completed-copy prose regression and all campaign replay fixtures. |
| Fifteen ending placeholders feel disconnected | Group discovery by chapter, count discoveries, keep unseen titles hidden, offer optional spoiler-light replay hints. Four outcomes are final campaign endings. | Unique coverage of all fifteen ids, duplicate/unknown discovery handling, browser counts and opt-in hints. |

The source ledger continues to distinguish attribution, independent corroboration and quotation consent. Forward failures, roll visibility, saved outcomes, save schema and original ending identities remain intact.

## Production follow-through

Repeat the exact phone reading and desktop Settings scenarios with a human reader after delivery. Confirm that fresh decisions are easier to find and that the load notice explains restored inventory. Continue the existing phased production roadmap: independent blind onboarding, mission-depth review, commissioned visual and audio work with rights evidence, physical-device/accessibility testing, performance and release validation. This pass improves reported friction; it does not justify a new 9.0+ grade or mark those gates complete.

## Measured review evidence

Using the same saved publication state at 400 × 605 with default text, the first choice moved from document Y 1693 to 642 in paragraph mode and from 1942 to 892 with the whole scene shown. This is approximately 1050 pixels less repeated material before the decision. It does not imply every prose passage fits one screen. The classic-scrollbar Settings grid was reproduced at a 505-pixel client width; after the intrinsic-width and slider-margin fixes its scroll width also measures 505 pixels.

Full UI campaign replays reached all four original finales without runtime errors: clinic relay on a phone viewport (85 snapshots, 61 scenes, Left to the Rain), a natural-roll contact relay with a critical miss (59 snapshots, 45 scenes, Said Aloud), Already Loose (59 snapshots, 46 scenes), and On the Folio on a phone viewport (59 snapshots, 46 scenes). Directed replays use specified die faces; the natural replay uses ordinary random rolls. These are automated browser sessions, not independent human ratings.

Validation for this change: 172 unit tests, TypeScript checking, and the production build pass. The full local browser sweep passed 150 unaffected cases; the Settings regression exposed the remaining native slider margin and was fixed. All 21 affected cases then passed across desktop Chromium, phone Chromium and WebKit, including new marker/reload and critical-roll regressions. The Lumen test explicitly advances the default paragraph reader before checking the offer. Production replay reports retain 111 scenes, 294 choices and 29 fixtures with no budget violations; the four synthetic performance samples fit the transfer budget without horizontal overflow. CI runs the full final suite with Firefox as well.
