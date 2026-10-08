import type { GameState, Scene } from "../types";

function arrivalText(state: GameState): string {
  const deal = state.flags.act2_deal
    ? "You can still feel the eighty creds. They do not spend well down here."
    : "The street version of the week got here before you did, wrong in the details and right about the tower.";
  return `Ward Nine is a stack of housing with the coolant scars still on the lower floors. The dump took the bottom two levels and the tower called it maintenance. People moved up, and then they moved the names onto a wall the rain is trying to eat.

Sera keeps the list. She has a hood, a pencil, and the patience of someone who has already done the funeral without a priest.

${deal}

"If you know any of them," she says, "say them. If you sold them, you can still say them. The wall does not check your receipt."`;
}

function namesText(state: GameState): string {
  const sale = state.flags.act1_sold
    ? `You already sold the hour. ${state.handle} did that in a stall, for a number that felt like an ending. Sera listens anyway. You read the names off a memory Helion paid for, and the wall gets them back. The sale stands in a ledger. It does not stand here.`
    : state.flags.act1_ash
      ? "The shard was half a scream when you sold it. The names were whole. You say the ones you kept, and Sera writes slower than the rain erases."
      : "You read what the chair tried to file away. Three hundred is a number. The wall wants them one at a time.";
  const first = state.chapters[0] ?? "The job";
  return `${sale}

Above this hour, the city already titled the job ${first}. This one is smaller and harder: a pencil, a wall, and your mouth doing a thing the tower cannot edit after the fact.`;
}

function quietText(state: GameState): string {
  const contradicted = state.flags.act1_sold
    ? "The sale stands. You do not take it back."
    : state.flags.act1_burned || state.flags.act1_both
      ? "The leak you already made can live without your voice on this wall."
      : "You leave the proof where you left it last week.";
  return `You leave the wall to the weather. ${contradicted}

Sera does not chase you. Ward Nine has practice at people who get to the stair and then remember they have somewhere dry to be. The names stay. The rain stays. You stay a person who could have spoken and did not, which is its own title.`;
}

function witnessText(state: GameState): string {
  return `You tell Sera the leak already started. ${
    state.flags.act1_burned
      ? "Lumen watched the glass go dark, and what she remembers has been walking the wards without you."
      : "A second copy is loose. The tower bought one fire and did not get to own the other."
  }

She writes ${state.handle} under the last name, small, like a footnote that refuses to be one. It is not absolution. It is a witness who arrived late and said so out loud.`;
}

export const ACT3_SCENES: Record<string, Scene> = {
  act3_arrival: {
    id: "act3_arrival",
    location: "Ward Nine",
    speaker: "Sera",
    text: arrivalText,
    choices: [
      {
        id: "read-names",
        label: "Read the names you kept.",
        detail: "You have to be carrying the truth, not just the mood.",
        requireJournal: "ward-nine",
        effects: { flags: ["spoke_names"], factions: { wards: 2, helion: -1 } },
        next: "ending_names",
      },
      {
        id: "confirm-leak",
        label: "Tell her the leak already started.",
        detail: "Lumen's fire, or the copy, is already walking.",
        requireAnyFlag: ["act1_burned", "act1_both"],
        effects: { flags: ["confirmed_leak"], factions: { lumen: 1, wards: 1 } },
        next: "ending_witness",
      },
      {
        id: "leave-wall",
        label: "Leave the wall to the rain.",
        effects: { factions: { wards: -1 } },
        next: "ending_quiet",
      },
    ],
  },
  ending_names: {
    id: "ending_names",
    location: "Ending",
    ending: true,
    finale: true,
    endingTitle: "Said Aloud",
    speaker: "Sera",
    text: namesText,
    choices: [],
  },
  ending_quiet: {
    id: "ending_quiet",
    location: "Ending",
    ending: true,
    finale: true,
    endingTitle: "Left to the Rain",
    speaker: "Sera",
    text: quietText,
    choices: [],
  },
  ending_witness: {
    id: "ending_witness",
    location: "Ending",
    ending: true,
    finale: true,
    endingTitle: "Already Loose",
    speaker: "Sera",
    text: witnessText,
    choices: [],
  },
};
