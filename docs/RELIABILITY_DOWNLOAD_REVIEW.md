# Reliability and download review

## Download headroom

The opening origin portrait requested a 448,475-byte JPEG even in its small frame. Three same-dimension WebP encodes now serve origin portraits: stall 190,132 bytes, Spire 99,902 bytes and canal 189,816 bytes. The originals, actor portraits, scene illustrations, CSS framing and all audio remain unchanged. No new fictional image is generated. Source/delivery hashes and settings are in `qa/media/origin-deliveries.json`, global provenance, credits and the offline media audition. All three deliveries were visually inspected; no composition change was observed.

The same four-sample production probe measured a largest total of 1,809,793 bytes including HTML, leaving 287,359 bytes under the unchanged 2,097,152-byte budget. The preceding review left roughly 29 KB when including HTML. All samples kept the goal visible, with no observed overflow or layout shift; text-only samples made no art requests. Measurements are synthetic, not field percentiles. Native first-visit autoplay policy, image decode requirements and the budget remain enforced.

## WebKit test reliability

The preceding hosted timeout was not reproduced in nine clean local WebKit timeline runs across desktop, phone and enlarged text-only widths. Those baseline runs took about 7–15 seconds each. No deterministic gameplay defect is established. The test now explicitly scrolls the expanded lazy source image into view before decoding it: decode alone does not require a browser to fetch an offscreen lazy image. It also disables unrelated sound during this source-art/keyboard/save/accessibility flow. Dedicated voice suites still check default playback, natural completion, cancellation and missing media. The test retains its assertions, both accessibility scans, timeout, retries and mandatory hosted profiles.

After hardening, nine repeated WebKit timeline cases passed with the hosted four-worker setting, in 43.1 seconds total. A separate attempt overlapping four timeline workers with three media-suite workers exceeded the existing per-test limit on several cases; that run was interrupted, not counted as a pass. The clean four-worker rerun retains the unchanged timeout. These results reduce known test hazards but do not prove timeouts impossible under resource contention.

## Mobile and release limits

The added story regression rotates with Settings open, closes and reopens it, scrolls down and back up, checks overflow and verifies the saved scene is unchanged. Existing reduced visual viewport, pinch-zoom release and dialog-control tests remain. Automated WebKit and touch Chromium are useful proxies; they do not establish physical Chrome-on-iPhone acceptance.

The preceding correction `37ae7b8` passed every hosted job in run 39439447235 and was confirmed READY on the production alias during this work. This follow-up requires its own complete exact-commit hosted CI before publication. No release gate is relaxed.

Local validation: 682 source tests; 51 targeted browser cases across Chromium, phone and WebKit; nine additional repeated WebKit timeline cases; TypeScript; production build; and the four-sample production probe all passed. The original JPEG and all voice, binding, story, engine and save files remain unchanged. WebKit was installed in temporary storage with locally extracted runtime libraries; no runtime dependency or validation bypass is added to the repository or hosted CI. These are Linux WebKit results, not an iPhone simulator or physical device.
