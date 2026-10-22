# Voice control alignment

Hosted phone checks on `5147439` found two failures in the compact voice-control cases: the 45px playback button and 44px transcript summary had top edges separated by 0.5px under centered flex alignment. The suite passed 706 other cases and skipped two existing cases; publication remained blocked.

The transcript summary now shares the playback button's 45px minimum. This preserves the fractional-layout margin above the existing 44px touch-target requirement and aligns equal-height controls. The original target-size, alignment, transcript, playback, Stop, status, caption-stability, save and accessibility assertions remain unchanged. No story, speech, artwork, engine or save changes accompany this correction. Full hosted browser checks and exact-commit production verification remain required.

Before pushing the correction, all 682 source tests, the production build and 123 composition/visual-polish cases across Chromium, phone and Linux WebKit passed. The browser cases include the previously failing 390px alignment with sound on and off. This local result does not claim hosted Firefox, physical-iPhone acceptance or a live production release.
