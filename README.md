# Saint Shard

A solo story RPG set in **Kite City, 3055**. Four stats, a ten-sided die, and a campaign that keeps the first job. Your run saves in this browser.

Quill wants the unedited hour Glass Chapel is about to cut out of a Helion executive. How you get in, who you trust, and what you do with the shard decide Act 1. The week after forks on those choices, and Ward Nine can contradict them. The people and the rooms are illustrated.

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

## Deploy on Vercel

Import this repository. The framework preset is Next.js. There are no environment variables and no database. `npm run build` is the production build.

Pushes and pull requests run `.github/workflows/ci.yml`. The Test job runs `npm test`. The Build job runs only after that, and runs `npm run build`. A production deploy waits for both checks. If either fails, Vercel skips the production build and the live site stays on the last deploy that passed. Pull request previews still build immediately, with the same checks running beside them.

Saves live in `localStorage` under `saint-shard-3055-v1` on the player's browser.

## How a check works

Roll **1d10** and add the stat, your origin perk if it matches, and any gear, clue, or faction standing that applies. A live optic adds to Chrome. Meet or beat the difficulty. A **10** on a success eases Strain. A **1** on a miss adds Strain.

At Strain 5, a bad night inside Glass Chapel can end in the chair.
