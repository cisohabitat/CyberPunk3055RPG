# Touch story scrolling

A player reported difficulty scrolling the story in Chrome on iPhone. They identified the story screen; the exact freeze/jump/stutter symptom has not yet been confirmed. This correction addresses reproduced scroll jumps and removes two potential sources of touch-scroll interference, without claiming a physical-device reproduction.

On the preceding 4176f38 build, changing Motion while scrolled down reruns PlayScreen's scene-entry effect and scrolls back to the beginning. Both Chromium and Linux WebKit reproduce this. Touch scene entry also explicitly requests smooth scrolling. The initial regression run has four expected failures for these two behaviors, and two passing ordinary down/up scrolling checks.

The correction guards scene-entry work by scene id, while remounting a restored play session still performs initial navigation. Coarse-pointer devices position the new scene immediately; fine-pointer devices retain the existing smooth motion preference. Dialog closure restores focus with preventScroll. The coarse-pointer, no-hover sticky header retains its size and actions but replaces backdrop blur with a solid background. No touch event cancellation, disabled zoom, body lock or nested story scroll container is introduced.

Art, dialogue, voice delivery, mechanics and saves are unchanged. No new scene or asset is needed. Existing explicit scene-art decisions remain applicable.

## Verification

Validation passed: 667 source tests, TypeScript checking, production build, and 67 unique browser cases (64 across Chromium and phone profiles covering scrolling, reading, choice feedback, saved dice and finales, plus three Linux WebKit scrolling cases). Before correction, the Motion change moved scrollY from 550 to 8 in both Chromium and WebKit; afterward the reading position is preserved.

The initial Chromium gesture helper produced negligible movement and was replaced with explicit native touch events; the corrected scrolling suite passed all nine cases across Chromium, phone and WebKit. An initial broader run lost its shared test server; all 64 cases passed when rerun against a dedicated server. Local Firefox could not launch because its profile folder was unavailable, so no local Firefox success is claimed. The unchanged full hosted four-profile CI and exact-commit publication gates remain required.

Evidence from this workspace: `/tmp/ios-scroll-source.log`, `/tmp/ios-scroll-tsc.log`, `/tmp/ios-scroll-build.log`, `/tmp/ios-scroll-before.log`, `/tmp/ios-scroll-touch.log` and `/tmp/ios-scroll-regression-final.log`. These temporary logs are local execution evidence, not committed artifacts. Chromium touch gestures are dispatched through its native browser protocol. Other engine checks use wheel input with a touch-capable 390px context. Linux WebKit is relevant browser-engine coverage, not iOS Chrome running on a physical phone. A physical iPhone retest is still needed to confirm the player's exact symptom is resolved.
