# Saint Shard

A solo story RPG in **Kite City, 3055**. You play it in the browser. The run stays on that browser. There is no account and no server save.

Quill hires you to lift Mara Voss's unedited hour from Glass Chapel before dawn. Helion is about to edit a crime out of her: she signed the Ward Nine coolant dump, and three hundred people died. Kerr is paid to stop you. Sister Lumen may help you leak the hour or break it. A week later the city asks for a buyer or a witness. At Ward Nine, Sera keeps the dead on a wall, and that is the last choice.

The current goal stays under the location while you play, and on the title screen when you continue. The place name sits beside the act: The Hour, The Week, or The Wall. Scene prose arrives one paragraph at a time, and you can show the rest. A choice that moves creds, strain, an item, or a faction says so before you take it. The sheet keeps a short list of what you already did.

- Lift Mara Voss's hour from Glass Chapel before dawn. Kerr is paid to stop you.
- You know what the hour is. Decide who gets it.
- The week wants a buyer or a witness.
- The wall has the names. Say them, or leave them to the rain.

The first time the shard is in your hand, Mara says the memo, then why she signed. People you have met are listed with their role. A seen ending on the title screen shows its coda. Unseen endings stay blank. The phone, the tablet, and the desktop each keep that goal on the scene.

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

Roll **1d10** and add the stat, your origin perk if it matches, and any gear, clue, or faction standing that applies. A live optic adds to Chrome. Meet or beat the difficulty. A **10** on a success eases Strain. A **1** on a miss adds Strain. Before the die, the stat you are rolling says one sentence. Chrome, Nerve, Face, and Ghost each have their own. The sentence does not change the math.

Four stats: Chrome, Nerve, Face, and Ghost. You spend two points at the start. No stat goes above 5. Origins are Gutterwire, Spire Exile, and Dustline. One complication comes with the name: Quill's tab, a live optic, or a record that is still on file.

At Strain 4, a risky check says the chair is close. At Strain 5, a bad night inside Glass Chapel can end in the chair.

## Screens

The same scene fits a phone, a tablet, and a desktop. On a wide screen the character sheet is a column beside the story. On a narrower screen it is a drawer, and the goal stays on the scene without opening it. Buttons stay large enough to tap.

## Deploy on Vercel

Import this repository. The framework preset is Next.js. There are no environment variables and no database. `npm run build` is the production build.

Pushes and pull requests run `.github/workflows/ci.yml`. The Test job runs `npm test`. The Build job runs only after that, and runs `npm run build`. A production deploy waits for both checks. If either fails, Vercel skips the production build and the live site stays on the last deploy that passed. Pull request previews still build immediately, with the same checks running beside them.

Saves live in `localStorage` under `saint-shard-3055-v1` on the player's browser. Sound, text size, and the codex of endings already seen use their own keys on that same browser.

## Changing the game

Read [AGENTS.md](AGENTS.md) before you change the story, the rules, the screens, the sound, the save, or the deploy. Update this README and `AGENTS.md` in the same change when any of those facts move. `npm test` checks that both files still quote the four goals and the save key.
