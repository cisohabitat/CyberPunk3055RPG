# Saint Shard

A solo story RPG in **Kite City, 3055**. You play it in the browser. The run stays on that browser. There is no account and no server save.

Quill hires you to lift Mara Voss's unedited hour from Glass Chapel before dawn. Helion is about to edit a crime out of her: she signed the Ward Nine coolant dump, and three hundred people died. Kerr is paid to stop you. Sister Lumen may help you leak the hour or break it. A week later the city asks for a buyer or a witness. At Ward Nine, Sera keeps the dead on a wall, and that is the last choice.

The current goal stays under the location while you play, and on the title screen when you continue. The place name sits beside the act: The Hour, The Week, or The Wall. Scene prose arrives one paragraph at a time, and you can show the rest. A choice that moves creds, strain, an item, or a faction says so before you take it. The sheet keeps a short list of what you already did.

- Lift Mara Voss's hour from Glass Chapel before dawn. Kerr is paid to stop you.
- You know what the hour is. Decide who gets it.
- The week wants a buyer or a witness.
- The wall has the names. Say them, or leave them to the rain.

The first time the shard is in your hand, Mara says the memo, then why she signed. People you have met are listed with their role. A seen ending on the title screen shows its coda. Unseen endings stay blank. The phone, the tablet, and the desktop each keep that goal on the scene. Longer prose uses the full reading width below the portrait.

This is original fiction. It is not affiliated with any studio or with any existing cyberpunk game.

## Play locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test
npm run build
```

## How a check works

Roll **1d10** and add the stat, your origin perk if it matches, one earned skill if it applies, and any gear, clue, or faction standing that applies. A live optic adds to Chrome. Meet or beat the difficulty. A **10** on a success eases Strain. A **1** on a miss adds Strain. Before the die, the stat you are rolling says one sentence. Chrome, Nerve, Face, and Ghost each have their own. The sentence does not change the math.

Four stats: Chrome, Nerve, Face, and Ghost. You spend two points at the start. No stat goes above 5. Origins are Gutterwire, Spire Exile, and Dustline. One complication comes with the name: Quill's tab, a live optic, or a record that is still on file.

At Strain 4, a risky check says the chair is close. At Strain 5, a bad night inside Glass Chapel can end in the chair.

## Screens

The same scene fits a phone, a tablet, and a desktop. On a wide screen the character sheet is a column beside the story. On a narrower screen it is a drawer, and the goal stays on the scene without opening it. Buttons stay large enough to tap.

Settings control text size, contrast, reading pace, motion, sound, separate music/ambience/effect volumes, and optional controller input. Controller D-pad up/down moves focus, left/right adjusts settings or sheet tabs, A selects, and B closes a dismissible dialog. Number keys choose story options while the sheet and other dialogs are closed. In the sheet, Left and Right arrow keys switch between Stats, Gear, and Journal; Home and End select the first and last tabs.

## Deploy on Vercel

Import this repository. The framework preset is Next.js. There are no environment variables and no database. `npm run build` is the production build.

Pushes and pull requests run `.github/workflows/ci.yml`. The Test job runs `npm test`. The Build job runs only after that, builds the game, and runs Playwright on desktop Chromium, phone-sized Chromium, Firefox, and WebKit. Accessibility checks run with the browser suite. A production deploy waits for both checks. If either fails, Vercel skips the production build and the live site stays on the last deploy that passed. Pull request previews still build immediately, with the same checks running beside them.

The active run lives in `localStorage` under `saint-shard-3055-v1`. Its previous valid state is an automatic backup. Three manual slots and JSON export/import keep separate copies. Imported files are validated and exported files carry an integrity checksum. The checksum detects accidental changes; it is not a signature or anti-cheat system. A rolled outcome is saved before its animation and restored after a reload; Continue applies it once. Abandon clears the active run and backup, while manual slots remain.

Settings and the codex use their own keys. Existing version 1 and version 2 runs still load; older sound and text preferences migrate when there is no new settings record.

If the browser blocks storage or cannot save, the game still opens and plays. A failed save shows a notice to keep the page open: that run can continue during the session, but reloading may lose its progress. Sound and text controls still work when their preferences cannot be stored.

## The memory bench and the week

After Mara explains her signature, open the memory bench to inspect three fragments: her account, an exported counter-order awaiting independent verification, and the roster identifying Nia Pell as a living witness. The journal distinguishes claims, facts, and promises. Inspect all three before deciding which record leaves the room:

- **Complete archive:** preserve the chain and roster, take Strain and surveillance attention, and investigate its issuing key during The Week.
- **Protected roster:** withhold worker locations, lose some public confidence, and move Nia to safety before attaching her account.
- **Witness chain:** entrust the private roster to Lumen and accept the promise to protect its living source.

Your character still remembers what they heard when a public record is redacted. Failed transport opens a checkpoint negotiation. Failed archive authentication opens a ledger search. These jobs can be left unresolved; the final aftermath describes that honestly.

At the beginning of The Week, choose one practiced skill for +1 on its checks. Each origin has a different contact favor: Gutterwire can earn a shelter token, Spire Exile a signal baffle, and Dustline a one-use passenger route. Quill's standing can buy a witness room; the clinic marker can be consumed to recover a stopped transfer. The third-name check at the wall permits one attempt.

Finales retain their codas and add consequences for Ward Nine, Mara, Nia, Lumen, and your origin contact when those stories apply. The chapel, street, and wards have separate musical beds with crossfades. Audio remains optional.

## Verification and authoring

```bash
npm test
npx tsc --noEmit
npm run build
npx playwright install --with-deps chromium firefox webkit
npm run test:browser
npm run story:report -- story-report.json
```

The story report maps choices, gates, destinations, and consumed tools, then runs 900 seeded campaigns. Simulations check completion, not whether players find a build satisfying or balanced. Browser traces and screenshots are retained for failures. Diagnostics can be exported from Settings; the game sends no diagnostics automatically and the report excludes names, choices, and save contents.

See [production direction](docs/PRODUCTION.md), [release gates](docs/RELEASE.md), and [credits and asset provenance](CREDITS.md). External playtests, manual screen-reader review, asset rights confirmation, and recorded voice performances remain production work, not completed certification.

## Changing the game

Read [AGENTS.md](AGENTS.md) before you change the story, the rules, the screens, the sound, the save, or the deploy. Update this README and `AGENTS.md` in the same change when any of those facts move. `npm test` checks that both files still quote the four goals and the save key.

The deterministic score generator runs automatically before development, tests, and production builds. The chapel and ward beds and memory cue are generated assets; keep their source in `scripts/generate-audio.mjs`.

The six-phase status and remaining production milestones are tracked in [docs/ROADMAP.md](docs/ROADMAP.md). The candidate contains 64 scenes and 149 choices; retain all four original finales.

This review adds a compact commitments panel, contextual next steps, and warnings on week-closing choices when a memory promise remains open. The memory bench places inspection controls in each fragment row and expands inspected source details on request. Archive preservation alone is not independent verification; exposed-location testimony can corroborate an order without protecting its witness. Motion and reading pace are independent settings. Story shortcuts ignore key repeats and focus inside the character sheet. Manual slots reject invalid date metadata. See [the current review and grade](docs/REVIEW.md).

Audio resumes from an explicit player gesture when sound is enabled or a saved sound-enabled run is continued, so browser autoplay restrictions do not strand the score. Unsupported audio remains optional.

Inspecting a memory fragment opens its source text and moves focus to that source summary; the player can revisit or collapse inspected sources.
