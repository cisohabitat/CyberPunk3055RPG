# Four-area polish follow-up review

Reviewed commit: `e41dc6d86236f935e5f48c7c6074fcfc33e899b1`.

## Confirmed findings

1. **High — publication blocked by a UI selector collision.** All four hosted browser profiles failed twelve equipment-training cases each in [run 39432602033](https://github.com/cisohabitat/CyberPunk3055RPG/actions/runs/39432602033). The four new odds disclosures reused `.kit-training`, so the existing assertion received five training disclosures instead of one. Reproduced all twelve failures locally in Chromium. The correction gives odds disclosures their own `.kit-comparison` class while sharing the same accessible summary styling. The existing assertions and CI gates remain unchanged; the new workshop test also checks both separate counts.
2. **Medium — declined work application shown as pending.** The legal `decline-shift-request` choice sets both `edda_shift_declined` and `edda_shift_done`. The new history helper tested only the latter and incorrectly described a signed pending application. It now checks the explicit decline first, preserving the suspended shift and unresolved inquiry. A regression test commits the actual authored choice and checks both character history and ending aftermath.

The hosted WebKit memory-timeline case at 1440px also exceeded its thirty-second timeout once and passed on retry. This is an observed reliability limitation, not an additional deterministic failure or proof of a gameplay defect. Its existing timeout and assertions remain intact; inspect recurrence in the next full hosted run.

## Scope and limits

Local validation after correction: 681 source tests and 40 Chromium/phone browser cases passed, including all original equipment-training cases in both profiles, the workshop comparison, character history, all four endings and viewport-fitting tests. TypeScript, the production build and four synthetic production load samples passed. Maximum measured initial resources were 2,065,533 bytes against the 2,097,152-byte budget, with no observed overflow or layout shift. This leaves only 31,619 bytes of budget headroom. Prior to pushing this correction, the production alias was confirmed READY on `42edd0b8a5a701aec781ed53856d55cf41a2ee4e`; a successful local check does not promote the newer changes.

The review covers the latest equipment, history, ending and viewport changes, their existing tests, and failed hosted logs. No canonical story, art, audio, binding, engine, save or balance rule changes. Both corrections are interface presentation; existing voices and artwork remain suitable. Physical iPhone scrolling and keyboard behavior remain unconfirmed. Local Chromium/phone results do not establish Firefox/WebKit or physical-device acceptance. Publication still requires the complete exact-commit hosted suite.
