# Artwork gallery

The main-page **Artwork gallery** link opens `/artwork`. Direct visits and browser Back work without starting a run. The persistent layout keeps the current campaign and the menu music controls available.

The collection contains 159 primary art entries, including portraits and their cast-card crops. Responsive small files and previews belong to their main image rather than becoming repeated entries. The explicit catalog is `qa/media/art-gallery.json`; its source check compares it with all primary files in `public/art` and validates the smaller-delivery pairing. Future art additions must update the catalog.

Players deliberately open a spoiler notice before seeing the collection. It includes later scenes, expressions and all four ending paintings; it does not mark them discovered. Search and four category filters narrow the collection. Pages contain at most 24 entries, with navigation above and below. Browsing uses lazy smaller images; inspecting an entry uses the existing keyboard-accessible zoom dialog. Natural dimensions keep portrait, square and panoramic images fitted correctly. Missing images retain a readable description and a working Close action.

Text-only artwork shows descriptions and makes no gallery image requests. Settings is the explicit way to enable images. Saved mute, menu music Stop, reduced motion, enlarged text and high contrast remain supported. Browsing, search, filters, pages and inspection change no campaign, codex or preference. The new route and catalog load separately from the ordinary game screen. No new story scene, character quotation, painting or recording is introduced; the existing art and speech bytes and bindings remain intact.

## Local validation

- 805 source tests passed with no failures, including completeness and delivery checks for the catalog. TypeScript and the production build passed.
- 28 directed browser cases passed with four workers and zero retries: seven gallery flows and seven existing guide flows in both Chromium and WebKit. They cover main-page entry, direct visits, spoiler handling, all 159 entries through pagination, search/filter reset, portrait fit and zoom, Escape/focus restoration, Back, exact save/preference preservation, missing thumbnail/full-image recovery and single-source menu music/Stop.
- Accessibility and overflow checks passed at 390px, 1440px and 320px enlarged text-only. These are synthetic viewports, not physical-device acceptance.
- Local WebKit's initial launch preflight reported `libGLESv2.so.2`; the installed browser subsequently executed all 14 directed cases with its local host preflight disabled. This local diagnostic setting is not in the repository or hosted workflow. Hosted browsers still install and validate their normal dependencies and must pass the full existing suites before production publication.
- A test-fixture omission of the runner's required given-name field was corrected before the final checks. Visual review also led to collection padding, a themed heading and bottom page controls before the final build and browser run.

The preceding Mara production release proof is retained separately in `qa/editorial/mara-relationship-release.json`. This document records the gallery candidate, not a claim of publication. Full exact-commit Test, all four Browser checks and Build remain required; separate live evidence follows a successful release. Tests and source-familiar automation establish implementation behavior, not independent art acceptance.
