import { spireVisitChoice } from "./spire";
import { shelterVisitChoice } from "./shelter";
import { freightVisitChoice } from "./freight";
import { GOAL_WALL } from "./goal";
import { kerrQuestionChoice, kerrVisitChoice, quillVisitChoice } from "./relationships";
import type { GameState, Scene } from "../types";

function wallCardText(state: GameState): string {
  const did = state.flags.act2_exposed
    ? "The week got upstairs before you finished saying it."
    : state.flags.act2_deal
      ? "You sold the week. The receipt does not spend well where the names are."
      : "You put the week in the street. The street got it half right.";
  return `The Week\n\n${did}\n\nThe Wall is in Ward Nine. ${GOAL_WALL}`;
}

function hasJournal(state: GameState, id: string): boolean {
  return state.journal.some((entry) => entry.id === id);
}

function wallText(state: GameState): string {
  const tone = state.flags.act2_deal
    ? "She does not mention the payment. The wall is doing that work."
    : "She waits with the pencil capped.";
  const named = `${state.givenName}. She says it once, the way the wall has not been allowed to keep a living name, then she turns you toward the concrete.`;
  const second = hasJournal(state, "ward-nine")
    ? "The memo puts a second name in your mouth without a check: Junie Calder, night shift, the locker beside Ivo."
    : "The second row is rain. You do not have the memo's name yet.";
  const neighbor =
    state.factions.wards >= 2
      ? "The wards already know you. Beside the memorial, Sera keeps a private witness ledger. Nia Pell is a living witness, the cousin who signed the housing slip, not one of the dead. Her name is readable without a check or an optic; her current address is not on display."
      : "";
  const window = hasJournal(state, "calibration")
    ? "The four-minute window is still in your head. The scratches look like a clock."
    : "";
  const eye = state.flags.optic
    ? "Your optic is already warm. Sera sees the red and does not ask you to darken it."
    : "";
  return `Sera stands you in front of the wall before she asks anything. ${named} The rain has eaten the lower rows. One name is still sharp, readable without a check or an optic: Ivo Pell, night shift, level two.

${second}${neighbor ? `\n\n${neighbor}` : ""}${window ? `\n\n${window}` : ""}${eye ? `\n\n${eye}` : ""}

"That one I can still read without a pencil," she says. "The third name needs the eye, or the wards, or both. The rest of the choice can wait until you have tried."

${tone}`;
}

function arrivalText(state: GameState): string {
  const deal = state.flags.act2_exposed
    ? "Helion already has a version of this week. The wall has not agreed to it."
    : state.flags.act2_deal
      ? "You can still feel the payment. It does not spend well down here."
      : "The street version of the week got here before you did, wrong in the details and right about the tower.";
  const ives = state.flags.on_file && state.flags.act2_deal
    ? "Ives is at the stair in a dry coat. The folio is the same one."
    : state.flags.quill_collected
      ? "Quill's tab is paid. That does not buy a name on this wall."
      : state.flags.quill_refused
        ? "Quill is not here. The interest still is."
        : "";
  return `Ward Nine is a stack of housing with the coolant scars still on the lower floors. The dump took the bottom two levels and the tower called it maintenance. People moved up, and then they moved the names onto a wall the rain is trying to eat.

Sera keeps the list. She has a hood, a pencil, and the patience of someone who has already done the funeral without a priest.

${deal}${ives ? `\n\n${ives}` : ""}

"If you know any of them," she says, "say them. If you sold them, you can still say them. The wall does not check your receipt."`;
}

function namesText(state: GameState): string {
  const said = state.flags.spoke_names
    ? "You said them. Sera's pencil does not ask whether you meant to."
    : "";
  if (state.flags.optic_read) {
    return `The optic dragged the names off the concrete and would not give them back. ${state.handle} says them while the eye is still hot. Sera writes. The strain is the price of a clue you did not earn in the chapel.${said ? ` ${said}` : ""}`;
  }
  if (state.flags.gave_copy) {
    return `Helion already owns the file. You are repeating it out loud so Sera can hear a person say it, not a clerk. ${state.handle} does not get the clean version of this hour. The wall gets the names anyway.

The pencil moves. The tower's copy does not get smaller. It also does not get to be the only voice.`;
  }
  const sale = state.flags.act1_sold
    ? `You already sold the hour. ${state.handle} did that in a stall, for a number that felt like an ending. Sera listens anyway. You read the names off a memory Helion paid for, and the wall gets them back. The sale stands in a ledger. It does not stand here.`
    : state.flags.act1_ash
      ? "The shard was half a scream when you sold it. The names were whole. You say the ones you kept, and Sera writes slower than the rain erases."
      : "You read what the chair tried to file away. Three hundred is a number. The wall wants them one at a time.";
  const first = state.chapters[0] ?? "The job";
  return `${sale}${said ? `\n\n${said}` : ""}

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
  const admitted = state.flags.confirmed_leak
    ? "You confirmed the leak out loud. That sentence is now on the wall beside the names."
    : "";
  return `You tell Sera the leak already started. ${
    state.flags.betrayed_lumen
      ? "You sold Lumen's week and then came down here to admit the fire. She is not on the stair. The leak walked without your loyalty."
      : state.flags.act1_burned
        ? "Lumen watched the glass go dark, and what she remembers has been walking the wards without you."
        : "A second copy is loose. The tower bought one fire and did not get to own the other."
  }${admitted ? ` ${admitted}` : ""}

She writes ${state.handle} under the last name, small, like a footnote that refuses to be one. It is not absolution. It is a witness who arrived late and said so out loud.`;
}

export const ACT3_SCENES: Record<string, Scene> = {
  card_wall: {
    id: "card_wall",
    location: "The Wall",
    text: wallCardText,
    choices: [{ id: "to-the-wall", label: "Go down to Ward Nine.", next: "districts" }],
  },
  ward_wall: {
    id: "ward_wall",
    location: "Ward Nine",
    speaker: "Sera",
    text: wallText,
    choices: [
      shelterVisitChoice(true),
      spireVisitChoice(true),
      freightVisitChoice(true),
      { id: "face-sera", label: "Tell her why you came.", next: "act3_arrival" },
      {
        id: "read-third",
        hideIfFlag: "third_attempted",
        effects: { flags: ["third_attempted"] },
        label: "Read the third name.",
        detail: "The optic helps. So do the wards.",
        check: {
          stat: "chrome",
          dc: 7,
          label: "Read the third name",
          flagBonuses: [{ flag: "optic", amount: 2, label: "Live optic" }],
          factionBonuses: [{ faction: "wards", min: 1, amount: 1, label: "The wards" }],
        },
        successEffects: {
          flags: ["read_third"],
          journal: ["Pell the younger, maintenance, no shift listed."],
        },
        failEffects: { strain: 1 },
        resultSuccess: "The third name comes up: Pell the younger, maintenance, no shift listed.",
        resultFail: "The row stays rain. Ivo Pell is still the one you can say for free.",
        nextSuccess: "act3_arrival",
        nextFail: "ward_wall",
      },
    ],
  },
  act3_arrival: {
    id: "act3_arrival",
    location: "Ward Nine",
    speaker: "Sera",
    text: arrivalText,
    choices: [
      kerrVisitChoice(),
      quillVisitChoice(),
      kerrQuestionChoice(),
      { id: "prepare-public-account", label: "Prepare an account people can question after you leave.", detail: "Review source strength and witness publication permission before a public hearing.", requireFlag: "memory_prepared", hideIfFlag: "testimony_done", next: "act3_testimony_review" },
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
        id: "read-wall",
        label: "Read the wall with the optic.",
        detail: "The eye does not turn off. The names might come up anyway.",
        requireFlag: "optic",
        hideIfFlag: "optic_burned",
        hideIfJournal: "ward-nine",
        check: {
          stat: "chrome",
          dc: 8,
          label: "Read the etched names",
          journalBonuses: [{ id: "calibration", amount: 1, label: "You kept the window" }],
        },
        successEffects: {
          flags: ["optic_read", "spoke_names"],
          strain: 1,
          factions: { wards: 1 },
          journal: ["Mara Voss signed the Ward Nine coolant dump. Three hundred people, one memo."],
        },
        failEffects: { strain: 1, flags: ["optic_burned"] },
        resultSuccess: "The optic drags the names off the concrete. It costs you a pip of strain to keep them.",
        resultFail: "The optic flares and keeps nothing. The wall is still just scratches.",
        nextSuccess: "ending_names",
        nextFail: "act3_arrival",
      },
      {
        id: "let-ives",
        label: "Let Ives take the list.",
        detail: "The folio was always going to want this wall.",
        requireFlag: "on_file",
        requireAnyFlag: ["act2_deal"],
        effects: { flags: ["ives_took_list"], factions: { helion: 1, wards: -2 } },
        next: "ending_listed",
      },
      {
        id: "say-anyway",
        label: "Say the names with Ives listening.",
        detail: "The folio is open. Your mouth can still be first.",
        requireFlag: "on_file",
        requireAnyFlag: ["act2_deal"],
        check: { stat: "face", dc: 8, label: "Speak before the folio" },
        successEffects: { flags: ["spoke_names"], factions: { wards: 1, helion: -1 } },
        failEffects: { flags: ["ives_took_list"], factions: { helion: 1 } },
        resultSuccess: "You get the names out before the pencil is a Helion exhibit.",
        resultFail: "Ives thanks Sera and takes the page. Your voice arrives as a footnote.",
        nextSuccess: "ending_names",
        nextFail: "ending_listed",
      },
      {
        id: "leave-wall",
        label: "Leave the wall to the rain.",
        effects: { factions: { wards: -1 } },
        next: "ending_quiet",
      },
    ],
  },
  ending_listed: {
    id: "ending_listed",
    location: "Ending",
    ending: true,
    finale: true,
    endingTitle: "On the Folio",
    speaker: "Ives",
    text: (state) =>
      `Ives closes the list into the folio like it was always a Helion document that had been stored in the rain by mistake. Sera keeps the pencil. She does not keep the page.

${state.handle} is still on file. Ward Nine is now a line item under resolved, which is the word the tower uses when it means owned.`,
    choices: [],
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
