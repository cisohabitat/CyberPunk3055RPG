import { GOAL_WEEK } from "./goal";
import type { GameState, Scene } from "../types";

function districtText(state: GameState): string {
  if (state.flags.act2_done) {
    return `The week has a shape now. Ward Four, the chapel, and the Spire have already spent their calls.

One card is still face down. Ward Nine. The coolant dump stopped being a rumor the moment you learned how to say it, or the moment you decided not to.

Rain ticks the plastic. Nobody is selling noodles.`;
  }
  const sold = state.flags.act1_sold || state.flags.act1_both || state.flags.act1_ash;
  const lumen = state.flags.knows_truth || state.flags.lumen_here || state.flags.act1_burned;
  const orderly = state.items.includes("counterfeit-pass")
    ? `The orderly from the basin is under the board, gold tooth, no coat. "Pass still scans," he says, and does not ask what you did with the hour.`
    : "";
  const badge = state.flags.on_file ? "The badge you burned is penciled on the underside of the Helion card." : "";
  return `Between jobs the city offers cards, not streets. You stand under a cracked route board in Ward Four and the rain writes on it faster than the tower does.

Ward Four is Kerr. He collects.
${lumen ? "Glass Chapel is Lumen. She still has your name in a mouth that does not forget." : "Glass Chapel is quiet. You did not leave anyone there who is calling."}
${sold || state.flags.on_file ? "Helion Spire is a dry voice that already knows which hour moved." : "The Spire is not asking. Yet."}
${orderly ? `\n\n${orderly}` : ""}${badge ? `\n\n${badge}` : ""}

Pick the door that knows you. The others can wait for a week you do not have.`;
}

function weekCardText(state: GameState): string {
  const did = state.flags.act1_sold
    ? "You sold Mara's hour."
    : state.flags.act1_both
      ? "You sold the hour and let a copy walk."
      : state.flags.act1_burned
        ? "You broke the shard where Lumen could see it."
        : state.flags.act1_smashed
          ? "You broke the shard and kept the proof to yourself."
          : state.flags.act1_ash
            ? "You sold a damaged hour."
            : state.flags.act1_walk
              ? "You came back with empty hands."
              : state.flags.act1_taken
                ? "Kerr took the job off you."
                : state.flags.act1_sainted
                  ? "The chair took the night you walked in with."
                  : "The job is over.";
  return `The Hour\n\n${did}\n\nThe Week starts in the street. ${GOAL_WEEK}`;
}

function streetText(state: GameState): string {
  const stall =
    state.flags.act1_burned || state.flags.act1_smashed || state.flags.act1_walk
      ? "Quill's stall is dark. The bowls are stacked. He priced your absence and went home."
      : "The stall is open and pretending it was always open. Quill does not look up.";
  const origin =
    state.origin === "gutterwire"
      ? "The leaks are the ones you grew up counting. This street still smells like that arithmetic."
      : state.origin === "spire"
        ? "The tower you used to wear is still up there, pretending it does not know this street."
        : "The flats you invoiced to get here are a rumor under this rain.";
  const rumor =
    state.flags.act1_both || state.flags.act1_burned
      ? "Someone on the corner says Ward Nine like it is a file now, not a rumor."
      : "Ward Nine is still a direction people lower their voice to say.";
  const limp = state.flags.kerr_down
    ? "You see Kerr at the far awning. The limp is worse. He sees you and does not cross."
    : "";
  const tab = state.flags.debt ? "Quill's tab is still in the steam, even when he will not look at you." : "";
  return `A week of rain has rewritten the paint. ${stall}

${origin}

${rumor}${limp ? `\n\n${limp}` : ""}${tab ? `\n\n${tab}` : ""}

The route board is still there. The cards that know your name are the ones face up.`;
}

function kerrDoorText(state: GameState): string {
  const knows = state.flags.act1_taken
    ? "He already took the shard once. He wants the week you spent not paying that back."
    : state.flags.kerr_down
      ? "You put him on the tile. He has had a week to decide what the knee cost, and he wants that number said out loud."
      : "He wants the weight of the glass. He already knows you were in the room.";
  return `Kerr is under the same awning, a week deeper into the rain. ${knows}

He offers the knee as the price of the conversation: what it cost him, what it should cost you.

"You can tell me what the hour was worth," he says, "or you can walk past and let the canal be the argument."`;
}

function lumenDoorText(state: GameState): string {
  const knows = state.flags.act1_burned
    ? "She watched you break the shard. She wants the names walked back to the wall anyway."
    : state.flags.act1_sold || state.flags.act1_both
      ? "She knows the hour was sold. She still wants a person, not a receipt, on the stair at Ward Nine."
      : "She wants the marker to mean a walk, not a souvenir.";
  const warm =
    state.factions.lumen >= 2
      ? `"${state.handle}," she says, before the coat, before the habit. "I already decided you were a person."`
      : "You can hear her out, or you can leave the step and keep the week unsaid.";
  return `Sister Lumen is on the chapel step with the coat over the habit. ${knows}

She holds the clinic marker out, a detail you can refuse to carry.

${warm}`;
}

function ivesDoorText(state: GameState): string {
  const file =
    state.flags.on_file
      ? "Ives still has the badge. He lets you see the dead chip before he says a handle. The number on it is the one you burned."
      : "";
  const greeting =
    state.factions.helion >= 2
      ? "He opens with the file, not the weather. Your name is already the first line."
      : state.flags.on_file
        ? "The folio is the badge's second page."
        : state.flags.act1_both || state.flags.copied
          ? "Ives knows there are two fires. They want the one you did not sell."
          : "Ives wants the week closed in a folio before the street learns the verb.";
  return `The Spire does not come down. It sends Ives, dry coat, open folio. ${file ? `${file} ` : ""}${greeting}

A clause on the second page wants your initial. You can refuse it.

You can hear the price, or you can leave the page unfinished.`;
}

function kerrText(state: GameState): string {
  if (state.flags.act1_sainted) {
    return `You come back to yourself on a wet bench with incense in your teeth. Kerr is the first face that is not a chart.

"They kept the reason you walked in," he says. The knee is worse. "I kept you. That was not the contract. The contract is the part where you tell me what the shard was worth, and then you pay me for the week I spent not letting the chair finish."`;
  }
  if (state.flags.act1_taken) {
    return `Kerr finds the alley before you find a better one. He is not holding the shard. Helion already took it upstairs.

"I did my job," he says. "You did not do yours. The knee still wants a conversation, and I am the only one who will have it without a memo."`;
  }
  const knee = state.flags.refused_knee
    ? "You would not price the limp at the door. He brings the knee up anyway, meaner for the refusal."
    : state.flags.kerr_down
      ? "He is limping hard enough that the rain has an opinion. You put him on the tile, and he has had a week to decide what that cost."
      : "The knee is a private weather system. He stands like the doorway owes him rent.";
  const note = state.journal.some((entry) => entry.id === "kerr-knee")
    ? "You kept the note about the knee. He sees that you already know which step fails."
    : "";
  return `Kerr is under the same awning Quill uses when he wants to look like a rumor. Quill is not here. That is the point.

${knee}${note ? `\n\n${note}` : ""}

"Week's up," he says. "Helion paid me to know the weight of that glass. You are the part of the weight I can still invoice."`;
}

function lumenText(state: GameState): string {
  const marker = state.flags.refused_marker
    ? "You refused the marker on the step. Her hand stays closed, and the week is colder for it."
    : state.items.includes("clinic-marker") || state.journal.some((entry) => entry.id === "clinic-debt")
      ? "The clinic marker is a debt with her name on it. She turns it over until you recognize the weight."
      : "She does not have a marker to show you. She has the optic, dark, and the week she spent not selling your name.";
  return `Glass Chapel in daylight is a waiting room that has given up on being holy. Sister Lumen is on the step, coat over the habit, rain in the seams.

${marker}

"Ward Nine is still down there," she says. "The shard is a week old, wherever it went. I called the marker in because memory gets thin if nobody walks it back to the wall. Come with me, or tell me you are done and mean it."`;
}

function helionText(state: GameState): string {
  const known = state.flags.refused_clause
    ? "You would not initial the clause. The blank line has your refusal in it, and Ives reads that as a fact."
    : state.flags.on_file
      ? `Ives says your old badge number before your handle. "We kept the name. Burning the badge was a hobby."`
      : state.flags.act1_ash
        ? `"You sold us a damaged hour," Ives says. "We would like the name of whoever fried the rest."`
        : state.flags.copied || state.flags.act1_both
          ? `"There are two fires," Ives says, pleased with the phrase. "We bought one. We would like the other to stop being a rumor."`
          : `"The hour reached us," Ives says. "Helion likes a complete file. You are the incomplete part."`;
  const copy = state.journal.some((entry) => entry.id === "shard-copy")
    ? "The second copy is a sentence Ives can already quote. They are only deciding whether you will say it too."
    : "";
  const file = state.factions.helion >= 2 ? "Standing with the tower has moved the greeting. The file is the hello." : "";
  return `The Spire does not come down to Ward Four. It sends Ives, who has a dry coat and a folio that does not like rain.

${known}${copy ? `\n\n${copy}` : ""}${file ? `\n\n${file}` : ""}

Under the overpass the traffic is a long electric animal. Ives holds the folio like a door they can open or close.`;
}

function middleText(state: GameState): string {
  const from = state.flags.kerr_told
    ? "Kerr kept the names in his mouth. The canal is quieter for it."
    : state.flags.walk_nine
      ? "Lumen's coat is still on the rail. She walked you this far and then let the canal speak. Selling the week now is selling her with it."
      : state.flags.gave_copy
        ? "The second file is already upstairs. The canal is where you decide whether to repeat it."
        : state.flags.ives_satisfied
          ? "Ives already has a tick on a page. The canal does not care about ticks."
          : "Whoever collected you this week is not in the canal. The week is.";
  const tab = state.flags.debt && !state.flags.quill_settled
    ? "Quill's tab is still open. He will not let the canal be the only meeting."
    : state.flags.quill_collected
      ? "The tab is paid. Quill's absence is the receipt."
      : "";
  return `The dry canal under Ward Four is a rumor with a floor. Rain falls in, then finds a grate and pretends it never wanted to stay.

Ren Calder is on the grate, hood up. "Ivo Pell was not the only locker," she says. "Junie Calder worked the shift beside him. Say her if you get to the wall."

${from}${tab ? `\n\n${tab}` : ""}

You can put the story in the street, where the wards will do something clumsy and public with it. Or you can sell the week to Helion and let the tower write the footnote. Both of them are a choice. Neither of them is clean.`;
}

function wardsFinale(state: GameState): string {
  const prior = state.chapters[0] ? `Last week the city called this ${state.chapters[0]}.` : "Last week was a job.";
  return `${prior} This week you stand where the noodle steam can hear you and you say Mara Voss's name next to Ward Nine until a stranger repeats it wrong, which is how a fact learns to walk.

Helion will answer. Quill will pretend he was never hungry. The wards will get it half right, and half right is more than a plinth ever offered.

The card for Ward Nine is still on the board. The people who lived there have not agreed to be a speech.`;
}

function dealFinale(state: GameState): string {
  const prior = state.chapters[0] ? `You can still read ${state.chapters[0]} under this one.` : "The job has a second receipt.";
  const price = state.flags.ives_open || state.flags.kerr_sold_you ? "Forty" : "Eighty";
  const squeeze = state.flags.ives_open
    ? "The folio never quite closed. The price knows it."
    : state.flags.kerr_sold_you
      ? "Kerr already rented your confession upstairs. This payment is the leftover."
      : "The folio closes.";
  return `${prior}

Ives pays without counting out loud. ${price} creds for a week of quiet, which is a polite way to buy your mouth. ${squeeze} Your handle is a line item under "resolved."

Ward Nine does not get a memo about being resolved. The district card is still there when you want to find out what the tower thinks it bought.`;
}

export const ACT2_SCENES: Record<string, Scene> = {
  districts: {
    id: "districts",
    location: "District board, Ward Four",
    text: districtText,
    choices: [
      {
        id: "to-kerr",
        label: "Ward Four",
        detail: "Kerr is still counting.",
        hideIfFlag: "act2_done",
        next: "act2_kerr_door",
      },
      {
        id: "to-lumen",
        label: "Glass Chapel",
        detail: "Lumen called the marker in.",
        hideIfFlag: "act2_done",
        requireAnyFlag: ["knows_truth", "lumen_here", "act1_burned", "act1_both"],
        next: "act2_lumen_door",
      },
      {
        id: "to-helion",
        label: "Helion Spire",
        detail: "A dry coat wants the rest of the hour.",
        hideIfFlag: "act2_done",
        requireAnyFlag: ["act1_sold", "act1_both", "act1_ash", "on_file"],
        next: "act2_helion_door",
      },
      {
        id: "to-ward-nine",
        label: "Ward Nine",
        detail: "The coolant dump. The people who lived.",
        requireFlag: "act2_done",
        next: "ward_wall",
      },
    ],
  },
  card_week: {
    id: "card_week",
    location: "The Week",
    text: weekCardText,
    choices: [{ id: "into-week", label: "Walk out into the week.", next: "street_after" }],
  },
  street_after: {
    id: "street_after",
    location: "Ward Four",
    speaker: "Quill",
    text: streetText,
    choices: [{ id: "read-board", label: "Read the board.", next: "districts" }],
  },
  act2_kerr_door: {
    id: "act2_kerr_door",
    location: "Ward Four",
    speaker: "Kerr",
    text: kerrDoorText,
    choices: [
      { id: "hear-kerr", label: "Hear what the week cost.", next: "act2_kerr" },
      {
        id: "refuse-knee",
        label: "Refuse the knee.",
        detail: "You will not price the limp.",
        effects: { flags: ["refused_knee"] },
        next: "act2_kerr",
      },
      { id: "leave-kerr", label: "Not the knee. Not tonight.", next: "districts" },
    ],
  },
  act2_lumen_door: {
    id: "act2_lumen_door",
    location: "Glass Chapel",
    speaker: "Sister Lumen",
    text: lumenDoorText,
    choices: [
      { id: "hear-lumen", label: "Hear her out.", next: "act2_lumen" },
      {
        id: "refuse-marker",
        label: "Refuse the marker.",
        detail: "You will not carry what she is holding out.",
        effects: { flags: ["refused_marker"] },
        next: "act2_lumen",
      },
      { id: "leave-lumen", label: "Leave the step.", next: "districts" },
    ],
  },
  act2_helion_door: {
    id: "act2_helion_door",
    location: "Helion Spire",
    speaker: "Ives",
    text: ivesDoorText,
    choices: [
      { id: "hear-ives", label: "Hear the price.", next: "act2_helion" },
      {
        id: "refuse-clause",
        label: "Refuse to initial the clause.",
        detail: "The blank line can stay blank.",
        effects: { flags: ["refused_clause"] },
        next: "act2_helion",
      },
      { id: "leave-ives", label: "Leave the folio closed.", next: "districts" },
    ],
  },
  act2_kerr: {
    id: "act2_kerr",
    location: "Ward Four",
    speaker: "Kerr",
    text: kerrText,
    choices: [
      {
        id: "pay-kerr",
        label: "Pay the week.",
        detail: "Forty creds. He stops collecting.",
        requireCreds: 40,
        effects: { creds: -40, factions: { wards: 1, quill: -1 } },
        next: "act2_middle",
      },
      {
        id: "tell-kerr",
        label: "Tell him the names.",
        detail: "Only if you actually have them.",
        requireJournal: "ward-nine",
        check: {
          stat: "face",
          dc: 7,
          label: "Give Kerr the truth",
          factionBonuses: [{ faction: "wards", min: 1, amount: 1, label: "The wards already trust you" }],
          journalBonuses: [{ id: "kerr-knee", amount: 1, label: "You know the knee" }],
        },
        successEffects: { flags: ["kerr_told"], factions: { wards: 1 } },
        failEffects: { strain: 1, factions: { helion: 1 }, flags: ["kerr_sold_you"] },
        resultSuccess: "He sits. The knee agrees before he does.",
        resultFail: "He hears a confession and files it where Helion can rent it.",
        nextSuccess: "act2_middle",
        nextFail: "act2_heat",
      },
      {
        id: "refuse-kerr",
        label: "Tell him the week is not for sale.",
        effects: { factions: { wards: -1 } },
        next: "act2_middle",
      },
    ],
  },
  act2_lumen: {
    id: "act2_lumen",
    location: "Glass Chapel",
    speaker: "Sister Lumen",
    text: lumenText,
    choices: [
      {
        id: "walk-with-her",
        label: "Walk Ward Nine with her.",
        detail: "Selling the week after this reads as a betrayal.",
        effects: { flags: ["walk_nine"], factions: { lumen: 1, wards: 1 } },
        next: "act2_middle",
      },
      {
        id: "keep-marker",
        label: "Keep the marker. Stay out of it.",
        detail: "You still have what she gave you.",
        requireItem: "clinic-marker",
        effects: { factions: { lumen: -1 } },
        next: "act2_middle",
      },
      {
        id: "decline-lumen",
        label: "Tell her you are done.",
        effects: { factions: { lumen: -1, helion: 1 } },
        next: "act2_middle",
      },
    ],
  },
  act2_helion: {
    id: "act2_helion",
    location: "Helion Spire",
    speaker: "Ives",
    text: helionText,
    choices: [
      {
        id: "give-copy",
        label: "Give Ives the second copy.",
        detail: "The leak stops being yours. The wards will remember this at the wall.",
        requireJournal: "shard-copy",
        effects: { flags: ["gave_copy"], factions: { helion: 2, wards: -1, lumen: -1 } },
        next: "act2_middle",
      },
      {
        id: "convince-ives",
        label: "Convince Ives you are finished.",
        check: {
          stat: "face",
          dc: 8,
          label: "Close Ives's folio",
          factionBonuses: [{ faction: "helion", min: 1, amount: 1, label: "Helion already has your name" }],
        },
        successEffects: { flags: ["ives_satisfied"], factions: { helion: 1 } },
        failEffects: { strain: 1, flags: ["ives_open"] },
        resultSuccess: "Ives ticks a box that was already going to be ticked.",
        resultFail: "The folio stays open. Your name is the line they have not priced yet.",
        nextSuccess: "act2_middle",
        nextFail: "act2_folio",
      },
      {
        id: "refuse-ives",
        label: "Refuse the tower.",
        effects: { factions: { helion: -1, wards: 1 } },
        next: "act2_middle",
      },
    ],
  },
  act2_middle: {
    id: "act2_middle",
    location: "The dry canal",
    text: middleText,
    choices: [
      {
        id: "pay-tab",
        label: "Pay Quill's tab.",
        detail: "Forty creds. The stall stops being a creditor.",
        requireFlag: "debt",
        hideIfFlag: "quill_settled",
        requireCreds: 40,
        effects: { creds: -40, flags: ["quill_collected", "quill_settled"], factions: { quill: 1 } },
        next: "act2_middle",
      },
      {
        id: "refuse-tab",
        label: "Tell Quill the tab can wait.",
        detail: "He will remember the interest in his face.",
        requireFlag: "debt",
        hideIfFlag: "quill_settled",
        effects: { strain: 1, flags: ["quill_refused", "quill_settled"], factions: { quill: -1 } },
        next: "act2_middle",
      },
      {
        id: "stand",
        label: "Stand where the names are.",
        detail: "The wards will remember this at the wall.",
        effects: { flags: ["act2_stand"], factions: { wards: 1 } },
        next: "ending_week_wards",
      },
      {
        id: "deal",
        label: "Sell the week to Helion.",
        detail: "Eighty creds. The wards will remember this at the wall.",
        effects: (state) => ({
          creds: 80,
          flags: state.flags.walk_nine ? ["act2_deal", "betrayed_lumen"] : ["act2_deal"],
          factions: state.flags.walk_nine ? { helion: 1, wards: -1, lumen: -1 } : { helion: 1, wards: -1 },
        }),
        next: "ending_week_deal",
      },
    ],
  },
  act2_heat: {
    id: "act2_heat",
    location: "The dry canal",
    speaker: "Kerr",
    text: `Kerr is already on the grate when you get there, and he is not alone in the story. Helion has the names you handed him. He looks sorry in the way a man looks sorry when the invoice cleared.

"You can still stand in the street," he says. "They will already be listening. Or you take what is left of the quiet money. It is not eighty. It is what they pay for a confession they already own."`,
    choices: [
      {
        id: "stand-heat",
        label: "Stand anyway.",
        detail: "The street can still be louder than the folio.",
        check: { stat: "nerve", dc: 7, label: "Stand after Kerr sold you" },
        successEffects: { flags: ["act2_stand"], factions: { wards: 1 } },
        failEffects: { strain: 1, flags: ["act2_exposed"] },
        resultSuccess: "You say the names where the steam can hear them. Kerr does not stop you.",
        resultFail: "The listening post gets there first. The street version is already theirs.",
        nextSuccess: "ending_week_wards",
        nextFail: "ending_exposed",
      },
      {
        id: "take-leftover",
        label: "Take the leftover quiet.",
        detail: "Forty creds. Kerr's invoice already cleared.",
        effects: { creds: 40, flags: ["act2_deal"], factions: { helion: 1, wards: -1 } },
        next: "ending_week_deal",
      },
    ],
  },
  act2_folio: {
    id: "act2_folio",
    location: "Helion Spire",
    speaker: "Ives",
    text: `The folio is still open. Ives has not priced you yet, which is worse than a number. Rain hits the overpass and does not come in.

"Helion can pay forty for a week of quiet," they say. "Or you can try to close this in the street, where we are already writing."`,
    choices: [
      {
        id: "cheap-deal",
        label: "Take the forty.",
        detail: "A smaller mouth. The page stays open.",
        effects: { creds: 40, flags: ["act2_deal", "ives_open"], factions: { helion: 1 } },
        next: "ending_week_deal",
      },
      {
        id: "stand-folio",
        label: "Close it in the street.",
        check: { stat: "nerve", dc: 7, label: "Outshout an open folio" },
        successEffects: { flags: ["act2_stand"], factions: { wards: 1, helion: -1 } },
        failEffects: { strain: 1, flags: ["act2_exposed"] },
        resultSuccess: "You leave the overpass talking. Ives has to chase a rumor.",
        resultFail: "Ives lets you go and files the attempt. The week is already a Helion sentence.",
        nextSuccess: "ending_week_wards",
        nextFail: "ending_exposed",
      },
    ],
  },
  ending_exposed: {
    id: "ending_exposed",
    location: "Ending",
    ending: true,
    endingTitle: "Exposed",
    text: (state) =>
      `${state.handle}, the week got upstairs before you finished saying it. ${
        state.flags.kerr_sold_you ? "Kerr sold the names." : "Ives kept the folio open."
      } Ward Nine will already know a version of you that you did not approve.

The district card is still there. The wall does not care that Helion heard it first.`,
    choices: [
      {
        id: "back-to-board",
        label: "The districts again.",
        detail: "Ward Nine has your name in someone else's mouth.",
        effects: { flags: ["act2_done"] },
        next: "card_wall",
      },
    ],
  },
  ending_week_wards: {
    id: "ending_week_wards",
    location: "Ending",
    ending: true,
    endingTitle: "Open Street",
    text: wardsFinale,
    choices: [
      {
        id: "back-to-board",
        label: "The districts again.",
        detail: "Ward Nine is still face down.",
        effects: { flags: ["act2_done"] },
        next: "card_wall",
      },
    ],
  },
  ending_week_deal: {
    id: "ending_week_deal",
    location: "Ending",
    ending: true,
    endingTitle: "The Quiet Contract",
    text: dealFinale,
    choices: [
      {
        id: "back-to-board",
        label: "The districts again.",
        detail: "You can still contradict the receipt.",
        effects: { flags: ["act2_done"] },
        next: "card_wall",
      },
    ],
  },
};
