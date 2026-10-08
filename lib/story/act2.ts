import type { GameState, Scene } from "../types";

function districtText(state: GameState): string {
  if (state.flags.act2_done) {
    return `The week has a shape now. Ward Four, the chapel, and the Spire have already spent their calls.

One card is still face down. Ward Nine. The coolant dump stopped being a rumor the moment you learned how to say it, or the moment you decided not to.

Rain ticks the plastic. Nobody is selling noodles.`;
  }
  const sold = state.flags.act1_sold || state.flags.act1_both || state.flags.act1_ash;
  const lumen = state.flags.knows_truth || state.flags.lumen_here || state.flags.act1_burned;
  return `Between jobs the city offers cards, not streets. You stand under a cracked route board in Ward Four and the rain writes on it faster than the tower does.

Ward Four is Kerr. He collects.
${lumen ? "Glass Chapel is Lumen. She still has your name in a mouth that does not forget." : "Glass Chapel is quiet. You did not leave anyone there who is calling."}
${sold || state.flags.on_file ? "Helion Spire is a dry voice that already knows which hour moved." : "The Spire is not asking. Yet."}

Pick the door that knows you. The others can wait for a week you do not have.`;
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
  const knee = state.flags.kerr_down
    ? "He is limping hard enough that the rain has an opinion. You put him on the tile, and he has had a week to decide what that cost."
    : "The knee is a private weather system. He stands like the doorway owes him rent.";
  return `Kerr is under the same awning Quill uses when he wants to look like a rumor. Quill is not here. That is the point.

${knee}

"Week's up," he says. "Helion paid me to know the weight of that glass. You are the part of the weight I can still invoice."`;
}

function lumenText(state: GameState): string {
  const marker = state.items.includes("clinic-marker")
    ? "She turns the clinic marker over in her palm, the one she pressed into yours, and waits until you recognize it."
    : "She does not have a marker to show you. She has the optic, dark, and the week she spent not selling your name.";
  return `Glass Chapel in daylight is a waiting room that has given up on being holy. Sister Lumen is on the step, coat over the habit, rain in the seams.

${marker}

"Ward Nine is still down there," she says. "The shard is a week old, wherever it went. I called the marker in because memory gets thin if nobody walks it back to the wall. Come with me, or tell me you are done and mean it."`;
}

function helionText(state: GameState): string {
  const known = state.flags.on_file
    ? `Ives says your old badge number before your handle. "We kept the name. Burning the badge was a hobby."`
    : state.flags.act1_ash
      ? `"You sold us a damaged hour," Ives says. "We would like the name of whoever fried the rest."`
      : state.flags.copied || state.flags.act1_both
        ? `"There are two fires," Ives says, pleased with the phrase. "We bought one. We would like the other to stop being a rumor."`
        : `"The hour reached us," Ives says. "Helion likes a complete file. You are the incomplete part."`;
  return `The Spire does not come down to Ward Four. It sends Ives, who has a dry coat and a folio that does not like rain.

${known}

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
        next: "act2_kerr",
      },
      {
        id: "to-lumen",
        label: "Glass Chapel",
        detail: "Lumen called the marker in.",
        hideIfFlag: "act2_done",
        requireAnyFlag: ["knows_truth", "lumen_here", "act1_burned", "act1_both"],
        next: "act2_lumen",
      },
      {
        id: "to-helion",
        label: "Helion Spire",
        detail: "A dry coat wants the rest of the hour.",
        hideIfFlag: "act2_done",
        requireAnyFlag: ["act1_sold", "act1_both", "act1_ash", "on_file"],
        next: "act2_helion",
      },
      {
        id: "to-ward-nine",
        label: "Ward Nine",
        detail: "The coolant dump. The people who lived.",
        requireFlag: "act2_done",
        next: "act3_arrival",
      },
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
        detail: "The leak stops being yours.",
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
        detail: "The wards get a clumsy, public version.",
        effects: { flags: ["act2_stand"], factions: { wards: 1 } },
        next: "ending_week_wards",
      },
      {
        id: "deal",
        label: "Sell the week to Helion.",
        detail: "Eighty creds. A quieter mouth.",
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
        next: "districts",
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
        next: "districts",
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
        next: "districts",
      },
    ],
  },
};
