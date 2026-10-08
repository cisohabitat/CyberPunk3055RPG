# Saint Shard

A solo story RPG set in **Kite City, 3055**. One job, four stats, a ten-sided die. Your run saves in this browser.

Quill wants the unedited hour Glass Chapel is about to cut out of a Helion executive. How you get in, who you trust, and what you do with the shard all change the ending.

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

Saves live in `localStorage` under `saint-shard-3055-v1` on the player's browser.

## How a check works

Roll **1d10** and add the stat, your origin perk if it matches, and any gear or clue that applies. Meet or beat the difficulty. A **10** on a success eases Strain. A **1** on a miss adds Strain.

At Strain 5, a bad night inside Glass Chapel can end in the chair.
