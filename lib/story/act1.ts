import { PAY } from "../economy";
import { ITEMS } from "../items";
import type { Choice, GameState, NextSpec, Scene } from "../types";

const KNIFE = [{ item: "mono-knife", amount: 1 }];
const SPOOF = [{ item: "spoof-chip", amount: 1 }];
const LAYOUT = [{ item: "layout-scrap", amount: 1 }];
const PASS = [{ item: "counterfeit-pass", amount: 1 }];

const TRUTH = "Mara Voss signed the Ward Nine coolant dump. Three hundred people, one memo.";
const HIRED = "Quill hired you to lift Mara Voss's unedited hour from Glass Chapel.";

export function vaultNext(state: GameState): string {
  const hot =
    !state.flags.quiet ||
    Boolean(state.flags.slow || state.flags.alert || state.flags.watched || state.flags.noisy);
  return hot ? "kerr" : "vault_quiet";
}

function strainRoute(state: GameState): string {
  return state.strain >= 5 ? "ending_sainted" : "ending_taken";
}

function fryFail(state: GameState): string {
  return state.strain >= 5 ? "ending_sainted" : "kerr";
}

function smashNext(state: GameState): string {
  return state.flags.lumen_here ? "ending_burned" : "ending_smashed";
}

const ORIGIN_OPEN: Record<GameState["origin"], string> = {
  gutterwire:
    "The awning leaks onto your collar. You know which leaks are rain and which are a tower's cooling line. This one is rain. Mostly.",
  spire:
    "You still hate the lower wards: fried oil, wet concrete, and the sweet rot of a clinic two blocks over. Helion Spire used to badge you through doors that do not exist down here.",
  dustline:
    "Road dust from the flats still lives in your seams. Inside the dome the horizon is a wall, and every wall has a price.",
};

function stallText(state: GameState): string {
  const complication = state.complication === "debt"
    ? "He knows the tab. He does not mention it, which is how Quill mentions things."
    : state.complication === "optic"
      ? "Your optic ticks once, hunting a frequency the stall does not have."
      : state.flags.on_file
        ? "Somewhere above the rain, a file with your old name is still open."
        : "";
  const carried = state.items.map((id) => ITEMS[id]?.name).filter((name): name is string => Boolean(name));
  const keepsake = carried.length
    ? `You still have ${carried.join(" and ")} from a week this city already filed. Quill notices and does not ask.`
    : "";
  const deal = state.flags.haggled
    ? "He already moved the advance to ninety. He will not enjoy being asked to fall in love with you twice."
    : state.flags.haggle_failed
      ? "He has already refused you once. The bowl is still untouched."
      : "He has not touched the bowl. He did not come here to eat.";
  return `${ORIGIN_OPEN[state.origin]}

Quill nods at the stool across from him. "${state.handle}. Sit. Eat, or pretend."

${complication ? complication + "\n\n" : ""}${keepsake ? keepsake + "\n\n" : ""}${deal}

"Glass Chapel edits guilt. They keep the original. Mara Voss, Helion logistics, sits the chair at dawn. I want the shard from her hour in the chair. You want to remain the sort of person who can spend money."`;
}

function payText(state: GameState): string {
  if (state.flags.haggled) {
    return `"Ninety now. Two hundred when I can hold the shard up to a light and see a whole hour in it. We are done negotiating."`;
  }
  if (state.flags.haggle_failed) {
    return `"Fifty. You already asked. I already didn't. The rain is free if you want a longer conversation."`;
  }
  return `"Fifty now. Two hundred when the shard is in my hand and not wandering around in your bloodstream. Kerr is her shadow. Kerr is why the number is not prettier."`;
}

function undercroftText(state: GameState): string {
  const heat = state.flags.watched
    ? "The tell-mark on your cuff itches. You keep that hand in a pocket."
    : state.flags.alert
      ? "A radio two rooms over says a direction that sounds like yours, then goes bland on purpose."
      : state.flags.noisy
        ? "Somewhere a camera is still deciding what to do with your face."
        : state.flags.scuffle
          ? "Your pulse is louder than the room. Someone felt the hatch move."
          : "No one is shouting yet. You file that under temporary.";
  return `Antiseptic and cheap incense are losing a fight in here. A bowl of extracted optics waits under a sign that says RECYCLE in a font meant to be kind.

${heat}

The chair room is up a short stair. Someone is humming a hymn with the rhythm taken out.`;
}

function lumenColdText(state: GameState): string {
  if (state.flags.exposed) {
    return `She listens to the lie leave your mouth and does not blink. The optic refocuses, not on you. On the hall behind you.

"Kerr likes liars. The chair room is up the stair. So is he, in a moment."`;
  }
  if (state.flags.brushed) {
    return `"Then work." She steps aside. The optic stays on you until the stair bends.

"Try not to bleed on the penitent tile. We just had it blessed."`;
  }
  return `She looks at you the way a nurse looks at a symptom she is not paid to name.

"Walk in blind, then. The chair does not care about your reasons, and I am done spending mine on you."`;
}

function vaultText(state: GameState): string {
  const pact = state.flags.pact_copy
    ? `Lumen nods at the plinth. "Copy it. Then we both leave holding a fire. Do not get clever and die."`
    : state.flags.pact_break
      ? `Lumen puts two fingers on the plinth. "Break it after. I want to see the light go out."`
      : state.flags.pact_fake
        ? "Lumen believes you. Her optic is on the door, watching for Kerr, not for your hands."
        : state.flags.pact_sell
          ? `You told her Ward Nine was not your job. She is not on this side of the glass. The plinth does not care what you called the crime.`
          : "The minute is yours. It does not feel like a gift.";
  return `Mara Voss is under the halo, breathing on a four-count. The plinth is open for calibration. The shard is a tongue of glass, still warm from a life.

${pact}

You have a minute before the door's patience ends.`;
}

function kerrText(state: GameState): string {
  const holding = state.items.includes("shard");
  const room = holding
    ? "The shard is already against your palm, warm as a coin left on an engine."
    : "The shard sits in the open plinth, a tongue of glass with a life still on it. Mara Voss breathes on a four-count under the halo.";
  const lumen = state.flags.lumen_here
    ? "Sister Lumen stands at the halo controls with her hands open, so everyone can see she is not pressing them."
    : "";
  const line = holding
    ? `"Put it down." Kerr fills the door. The knee is the only apology on him. "That glass is Mara's hour. Helion pays me so the Ward Nine memo stays in her head, not in your pocket."`
    : `"Shard on the plinth. You on the floor." Kerr's coat is wet. His knee is set like it owes him money. "That glass is an hour Helion paid to keep. We can skip to the end."`;
  return [room, lumen, line].filter(Boolean).join("\n\n");
}

function afterText(state: GameState): string {
  const beat = state.flags.kerr_down
    ? "Kerr is on the tile, breathing. That is more mercy than the room required. You take the alley before the hymn comes back on."
    : state.flags.kerr_slipped
      ? "You are in the alley before your name catches up. Rain works at your cuffs."
      : "Kerr steps out of the door like the frame hurts him. He does not wish you luck. He spends the mercy of not counting your steps.";
  const hold = !state.items.includes("shard")
    ? "Your pockets are honest. The chair upstairs is not. Dawn still has Mara's name on it."
    : state.flags.ash
      ? "What you carry is half a scream in glass. It flickers when the streetlight does."
      : state.flags.copy_failed
        ? "The copy collapsed in the plinth. Only the original is warm, and it is the one in your pocket."
        : state.flags.copied
          ? "Two copies of Mara's hour exist. One is in your pocket. One is a file that wants a witness."
          : "Mara's hour is a weight in your pocket. It is smaller than three hundred names, and heavier.";
  const copyWindow = state.flags.pact_copy && !state.flags.copied ? "You left the chair room without the second file you promised Lumen. The copying window is closed; an original alone does not keep that promise." : "";
  const believed = state.flags.she_believes
    ? "Lumen believed the reason you sold her. The stair will keep the version she bought."
    : "";
  return `${beat}

${hold}${copyWindow ? `\n\n${copyWindow}` : ""}${believed ? `\n\n${believed}` : ""}

Quill is a noodle stall away. He has never once been sentimental.`;
}

function soldText(state: GameState): string {
  const sting = state.flags.pact_fake
    ? `Lumen's message finds you before dawn. No threat. Just your name, and the words "I will remember for both of us."`
    : state.flags.knows_truth
      ? "You try to taste the creds. They spend. Ward Nine stays a number with a tower standing on it."
      : "You do not ask what the hour contained. Quill prefers contractors who treat memory as weight, not weather.";
  const pocket = state.flags.copied
    ? "You keep the second file and do not send it anywhere. A lever is not a conscience."
    : "";
  return [`Quill holds the shard over the stall light like it might be undercooked. The rest of the money hits your chip. Somewhere a tower files Mara's hour next to the memo she will no longer feel.`, pocket, sting, `${state.handle} walks out with a heavier pocket and a lighter kind of sleep.`]
    .filter(Boolean)
    .join("\n\n");
}

function burnedText(state: GameState): string {
  const copy = state.flags.wiped_copy ? "You wipe the second file in the same motion. One fire, then none." : "";
  return [
    "You break the shard where Lumen can see it. It goes out like a nerve. She sends what she remembers: names, the shape of a memo, a voice note that shakes. It is not the hour itself. It is enough to make Helion hire liars.",
    copy,
    `She presses a clinic marker into your palm. "Next time you are dying, come here first. We owe you a cheaper kind of edit."`,
    `Quill does not pay the rest. ${state.handle} keeps the advance and a witness. In Kite City that is an unusual fortune.`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function smashedText(state: GameState): string {
  const copy = state.flags.wiped_copy
    ? "You wipe the copy too. Nobody inherits the hour."
    : "No witness. No leak. No second copy.";
  return `You break the shard alone, under a pipe that leaks real rain. ${copy} Quill does not pay. Helion does not bleed.

${state.handle} is the only person in the dome with the truth and no proof. That is its own kind of poverty, and it spends nothing.`;
}

function bothText(state: GameState): string {
  const witness = state.flags.lumen_here
    ? "Lumen takes the copy like a hot instrument. She does not thank you. She starts walking toward a transmitter that is not supposed to exist."
    : "You dump the copy into a public drop the wards actually read. By the time a tower lawyer names it defamation, the file has grown legs.";
  return `Quill gets a shard and calls you a professional. The other file does not go to him.

${witness}

By morning Ward Nine is a rumor with a file attached, and Helion is busy denying a voice they have not yet bought. ${state.handle} is paid, and also listed. In this city those often arrive as a pair.`;
}

function ashText(state: GameState): string {
  return `The shard stutters in Quill's hand. Half a signature. A scream with the middle cut out. He pays half and looks at you like a tool that slipped.

Helion spends a nervous week. Then the week ends. Most of them do.

${state.handle} keeps the partial and the feeling of having touched a crime without leaving fingerprints on it.`;
}

function walkText(state: GameState): string {
  const extra = state.flags.kerr_talked
    ? "Kerr's last look stays with you: a man who heard enough, and still had a shift to finish."
    : "The stall is still there. Quill nods like he priced this outcome in before you sat down.";
  const gutter = state.flags.ash
    ? "The ruined shard is in a gutter that already knows too much. You do not go back for it."
    : "";
  return [`You come back with rain and no glass worth selling. "Keep the advance," Quill says. "Lose my name for a while."`, gutter, "The chair still happens at dawn. Mara walks out lighter. The wards do not.", extra]
    .filter(Boolean)
    .join("\n\n");
}

function takenText(state: GameState): string {
  const copy = state.flags.copied
    ? " He takes the fresh copy too, still warm in the buffer, and that is the end of the clever version."
    : "";
  return `Kerr takes the shard, or the space where it should have been.${copy} You wake in an alley with incense in your mouth and your chip lighter than the plan.

Quill's number does not answer. The job is over in the way jobs end when you were the expendable part.

${state.handle} is alive. The hour is not yours. Dawn will edit Mara anyway.`;
}

function saintedText(state: GameState): string {
  return `The halo comes down like a polite hand. You feel the hour of your own night lift out, labeled, filed, and burned. Pain is there and then not there, which is worse.

The orderly says "${state.givenName}" the way a person reads a chart. You answer to it. Answering is easy. It is the one part they left fully installed.

Somewhere a plinth holds the reason you came to Glass Chapel. You do not miss it. That is the worst sentence you will never think.`;
}


function shardNext(next: string): NextSpec {
  return (state) => (state.items.includes("shard") && !state.flags.heard_memo ? "memo" : next);
}

function weekAfter(flag: string): Choice {
  return {
    id: "week-after",
    label: "The week after.",
    detail: "The job is over. The city is not.",
    effects: { flags: ["act1_done", flag] },
    next: "card_week",
  };
}

function add(scene: Scene): Scene {
  return scene;
}

function checkChoice(choice: Choice): Choice {
  return choice;
}

export const ACT1_SCENES: Record<string, Scene> = {
  stall: add({
    id: "stall",
    location: "Noodle stall, Ward Four",
    speaker: "Quill",
    text: stallText,
    choices: [
      { id: "ask-pay", label: "Ask what the job pays.", detail: "Money first. Always.", next: "pay" },
      { id: "ask-why", label: "Ask why he doesn't take it himself.", next: "why" },
      { id: "ask-chapel", label: "Ask what the Chapel actually does.", next: "chapel" },
      {
        id: "accept",
        label: "Take the job.",
        detail: "The advance hits your chip.",
        effects: (state) => ({
          creds: state.flags.haggled ? PAY.haggled : PAY.base,
          flags: ["hired"],
          journal: [HIRED],
          factions: { quill: 1 },
        }),
        next: "route",
      },
    ],
  }),
  pay: add({
    id: "pay",
    location: "Noodle stall, Ward Four",
    speaker: "Quill",
    text: payText,
    choices: [
      checkChoice({
        id: "haggle",
        label: "Push the advance.",
        detail: "He already priced Kerr into the fifty.",
        hideIfAnyFlag: ["haggled", "haggle_failed"],
        check: { stat: "face", dc: 8, label: "Push Quill" },
        successEffects: {
          flags: ["haggled"],
          journal: ["Quill agreed to ninety up front."],
        },
        failEffects: { flags: ["haggle_failed"] },
        resultSuccess: "He hates it, and he agrees.",
        resultFail: "He doesn't blink. The number stays fifty.",
        nextSuccess: "pay_yes",
        nextFail: "pay_no",
      }),
      { id: "back", label: "Leave the number alone.", next: "stall" },
    ],
  }),
  pay_yes: add({
    id: "pay_yes",
    location: "Noodle stall, Ward Four",
    speaker: "Quill",
    text: `"Ninety. I will not go higher unless you are secretly three people. Two hundred on delivery, and if you die I am billing the corpse for my time."`,
    choices: [{ id: "pocket", label: "Pocket the promise.", next: "stall" }],
  }),
  pay_no: add({
    id: "pay_no",
    location: "Noodle stall, Ward Four",
    speaker: "Quill",
    text: `"Cute. Fifty. Count it if you want. The count will not change, and neither will my face."`,
    choices: [{ id: "sit-with-it", label: "Sit with it.", next: "stall" }],
  }),
  why: add({
    id: "why",
    location: "Noodle stall, Ward Four",
    speaker: "Quill",
    text: `"Because Kerr knows my face from a year I would rather sell than tell. Kerr does not know yours. If that changes, do not come back here to explain it to me. Explain it to the rain."`,
    choices: [{ id: "back", label: "That's enough biography.", next: "stall" }],
  }),
  chapel: add({
    id: "chapel",
    location: "Noodle stall, Ward Four",
    speaker: "Quill",
    text: `"Clients call it absolution. The machine reads the hour, files the raw memory, then burns the feeling out and leaves the facts standing there like furniture. The raw file sits in the plinth under the chair.

That file is the product. Saints keep it. Then they sell it back to the same towers that sent them the clients. Mara's hour is worth more to Helion than Mara is."`,
    choices: [{ id: "back", label: "You've heard enough.", next: "stall" }],
  }),
  route: add({
    id: "route",
    location: "Under the awning",
    speaker: "Quill",
    text: (state) => {
      const money = state.flags.haggled
        ? "Ninety is already on your chip. Try not to donate it to a door."
        : "Fifty is on your chip. The rest of the city will try to take it.";
      const passLine = state.items.includes("counterfeit-pass")
        ? "The pass is already in your pocket. The basin will still want a story."
        : "The penitent pass is a hundred. It scans often enough.";
      return `${money}

"Three ways in. The front sells forgiveness to anyone with an appointment. The hatch behind the incinerator is for people who still sweat. The choir door runs on an old Helion pad. I would not kiss it."

${passLine}`;
    },
    choices: [
      {
        id: "pass",
        label: "Buy a counterfeit penitent pass.",
        detail: "Walk in as someone the basin expects.",
        requireCreds: PAY.pass,
        hideIfItem: "counterfeit-pass",
        effects: {
          creds: -PAY.pass,
          itemsAdd: ["counterfeit-pass"],
          journal: ["A counterfeit penitent pass is burning a hole in your pocket."],
        },
        next: "front",
      },
      {
        id: "use-pass",
        label: "Use the penitent pass.",
        detail: "You already paid for the appointment.",
        requireItem: "counterfeit-pass",
        next: "front",
      },
      { id: "hatch", label: "Take the maintenance hatch.", detail: "Behind the incinerator.", next: "hatch" },
      { id: "side", label: "Spoof the choir door.", detail: "Old Helion hardware. It bites.", next: "side" },
    ],
  }),
  front: add({
    id: "front",
    location: "Chapel basin",
    speaker: "Orderly",
    text: `White coat. A gold filament in one tooth. A smile that has practiced on worse people than you.

"Penitent? Appointment chip. Hands where the basin can see them. If you are here to sell us organs, we already have a guy."`,
    choices: [
      checkChoice({
        id: "bluff-door",
        label: "Offer the pass and a tired story.",
        check: {
          stat: "face",
          dc: 7,
          label: "Pass the basin",
          itemBonuses: PASS,
        },
        successEffects: { flags: ["quiet"] },
        failEffects: {
          flags: ["watched"],
          strain: 1,
          journal: ["The orderly painted a tell-mark on your cuff."],
        },
        resultSuccess: "The basin chirps a color that means yes.",
        resultFail: "The basin hesitates. He marks your cuff and waves you through anyway.",
        nextSuccess: "undercroft",
        nextFail: "undercroft",
      }),
      {
        id: "retreat",
        label: "Pocket the pass and walk.",
        detail: "The orderly has not logged you yet.",
        next: "route",
      },
    ],
  }),
  hatch: add({
    id: "hatch",
    location: "Incinerator vein",
    text: `Heat, bleach, and the sweet smell of a person who has already been turned into a policy. The hatch is a square of dark above the flue. It was not built for guests. It was built for smoke.`,
    choices: [
      checkChoice({
        id: "slip-hatch",
        label: "Go in like a rumor.",
        check: { stat: "ghost", dc: 8, label: "Enter like a rumor" },
        successEffects: {
          flags: ["quiet"],
          itemsAdd: ["layout-scrap"],
          journal: ["You kept a scrap of the chapel's service map."],
        },
        resultSuccess: "You come out among labeled pipes, holding somebody's abandoned map.",
        resultFail: "A filter-mask turns. The wrench comes up.",
        nextSuccess: "undercroft",
        nextFail: "hatch_caught",
      }),
      {
        id: "retreat",
        label: "This vein is wrong. Turn around.",
        detail: "Quill's other doors are still open.",
        next: "route",
      },
    ],
  }),
  hatch_caught: add({
    id: "hatch_caught",
    location: "Incinerator vein",
    text: `The tech is more offended than afraid. The wrench is a real wrench. The collar mic is the actual problem.

"This vein is hot," the mask says. "You are not on the hot list."`,
    choices: [
      checkChoice({
        id: "drop-tech",
        label: "Put the tech down.",
        check: { stat: "nerve", dc: 7, label: "Drop the tech" },
        successEffects: {
          flags: ["scuffle"],
          itemsAdd: ["mono-knife"],
          journal: ["The tech's wrench was a mono-knife with the stamp scratched off."],
        },
        failEffects: { flags: ["alert"], strain: 2 },
        resultSuccess: "He folds. The thing in his belt is not a tool.",
        resultFail: "He gets one shout into the collar before you stop the second.",
        nextSuccess: "undercroft",
        nextFail: "undercroft",
      }),
      {
        id: "bail",
        label: "Bail loud, before the shout finishes.",
        detail: "The chapel hears you coming.",
        effects: { flags: ["alert"], strain: 1 },
        next: "undercroft",
      },
    ],
  }),
  side: add({
    id: "side",
    location: "Choir door",
    text: `The pad is old Helion, the kind that still believes a handshake is a moral act. The shock coil behind it is less theological. Someone has scratched a halo into the paint and then tried to scratch the halo off.`,
    choices: [
      checkChoice({
        id: "spoof-door",
        label: "Speak the pad's old language.",
        check: { stat: "chrome", dc: 8, label: "Spoof the choir door" },
        successEffects: {
          flags: ["quiet"],
          itemsAdd: ["spoof-chip"],
          journal: ["The choir door accepted a name you kept on a chip."],
        },
        failEffects: { flags: ["noisy"], strain: 1 },
        resultSuccess: "It opens for a name you have not used in years. You keep the chip.",
        resultFail: "The pad bites. The door opens anyway, sulking, and a camera wakes up red.",
        nextSuccess: "undercroft",
        nextFail: "undercroft",
      }),
      {
        id: "retreat",
        label: "Leave the pad alone.",
        detail: "Shock coils are a kind of opinion.",
        next: "route",
      },
    ],
  }),
  undercroft: add({
    id: "undercroft",
    location: "Chapel undercroft",
    text: undercroftText,
    choices: [
      checkChoice({
        id: "search",
        label: "Search the supply cage.",
        detail: "One quiet minute, spent on other people's drawers.",
        check: { stat: "ghost", dc: 6, label: "Search the cage" },
        successEffects: {
          flags: ["knee"],
          itemsAdd: ["sedative"],
          journal: ["Kerr's knee is still his own, and it is bad. You also pocketed a sedative."],
        },
        failEffects: { flags: ["slow"] },
        resultSuccess: "Sedative, chapel stock, and a duty note about Kerr's knee.",
        resultFail: "Gauze, and a minute you did not have. Boots sound closer.",
        nextSuccess: "lumen",
        nextFail: "lumen",
      }),
      checkChoice({
        id: "slate",
        label: "Read the shift slate.",
        detail: "Calibration times. Or a log with your fingerprints on it.",
        check: { stat: "chrome", dc: 7, label: "Read the shift slate" },
        successEffects: {
          flags: ["timing"],
          journal: ["The plinth's calibration window is four minutes."],
        },
        failEffects: { flags: ["noisy"] },
        resultSuccess: "Four minutes, plinth open. Long enough to copy a life if the room stays polite.",
        resultFail: "The slate locks and logs a clumsy guest.",
        nextSuccess: "lumen",
        nextFail: "lumen",
      }),
      { id: "go", label: "Enough. Find the nurse.", next: "lumen" },
    ],
  }),
  lumen: add({
    id: "lumen",
    location: "Chapel stair",
    speaker: "Sister Lumen",
    text: `A nurse with a shaved head and an optic that refocuses like it resents the distance. Her hands are clean. Her shoes are not.

"You are not on the penitent list. Dawn puts Mara Voss in that chair so Helion can edit a crime out of her. The next sentence should be one you can survive."`,
    choices: [
      {
        id: "honest",
        label: "Quill sent me for the Voss shard.",
        effects: { flags: ["knows_truth", "honest"], journal: [TRUTH], factions: { lumen: 1 } },
        next: "lumen_deal",
      },
      checkChoice({
        id: "lie-stop",
        label: "I'm here to stop the edit.",
        check: { stat: "face", dc: 8, label: "Sell Lumen a reason" },
        successEffects: {
          flags: ["knows_truth", "she_believes"],
          journal: [TRUTH],
          factions: { lumen: 1 },
        },
        failEffects: { flags: ["exposed", "alert"] },
        resultSuccess: "She studies your mouth, then decides to spend the truth on you.",
        resultFail: "She sighs like a person ticking a box.",
        nextSuccess: "lumen_deal",
        nextFail: "lumen_cold",
      }),
      checkChoice({
        id: "optic",
        label: "Your optic is live. You're recording this.",
        check: { stat: "chrome", dc: 7, label: "Catch the optic" },
        successEffects: {
          flags: ["knows_truth", "seen"],
          journal: [TRUTH],
        },
        failEffects: { flags: ["rebuffed"] },
        resultSuccess: "She taps the optic off with a fingernail and uses her mouth instead.",
        resultFail: "She smiles a professional smile. The optic stays red.",
        nextSuccess: "lumen_deal",
        nextFail: "lumen_cold",
      }),
      {
        id: "brush",
        label: "Move. I'm working.",
        effects: { flags: ["brushed"] },
        next: "lumen_cold",
      },
    ],
  }),
  lumen_deal: add({
    id: "lumen_deal",
    location: "Chapel stair",
    speaker: "Sister Lumen",
    text: `"Mara Voss signed the coolant dump into Ward Nine. Three hundred people. One memo. No funeral that used their names. The shard is the only unedited hour.

Sell it to Quill and he sells it to Helion, and Helion buys the last copy of its own crime. Break it, and I leak what I remember. Memory is weaker than a shard. It is still a fire."

She waits. The optic is dark now, which means she is doing this as a person.`,
    choices: [
      {
        id: "pact-break",
        label: "I'll break it.",
        effects: { flags: ["pact_break", "lumen_here"], factions: { lumen: 1, wards: 1 } },
        next: vaultNext,
      },
      {
        id: "pact-copy",
        label: "I'll copy it. You get the leak. I get paid.",
        effects: { flags: ["pact_copy", "lumen_here"], factions: { lumen: 1, quill: 1 } },
        next: vaultNext,
      },
      {
        id: "pact-sell",
        label: "Ward Nine is not my job.",
        effects: { flags: ["pact_sell"], factions: { helion: 1, lumen: -1 } },
        next: vaultNext,
      },
      checkChoice({
        id: "fake-pact",
        label: "Promise to break it. Mean the sale.",
        check: { stat: "face", dc: 9, label: "Lie to Lumen" },
        successEffects: { flags: ["pact_fake", "lumen_here", "she_believes"] },
        failEffects: { flags: ["exposed", "alert", "pact_sell"] },
        resultSuccess: "She believes the promise and turns to watch the door.",
        resultFail: `"Kerr," she says to the room, gently.`,
        nextSuccess: vaultNext,
        nextFail: vaultNext,
      }),
    ],
  }),
  lumen_cold: add({
    id: "lumen_cold",
    location: "Chapel stair",
    speaker: "Sister Lumen",
    text: lumenColdText,
    choices: [
      checkChoice({
        id: "jack-slate",
        label: "Jack the wall slate before you go.",
        check: { stat: "chrome", dc: 8, label: "Jack the wall slate" },
        successEffects: {
          flags: ["knows_truth", "timing"],
          journal: [TRUTH, "The plinth's calibration window is four minutes."],
        },
        failEffects: { flags: ["noisy"], strain: 1 },
        resultSuccess: "Ward Nine is in the admin layer, and so is the calibration window.",
        resultFail: "The slate snaps shut and logs the attempt.",
        nextSuccess: vaultNext,
        nextFail: vaultNext,
      }),
      { id: "go-chair", label: "Go to the chair.", next: vaultNext },
    ],
  }),
  memo: add({
    id: "memo",
    location: "The chair room",
    speaker: "Mara",
    text: `The shard is warm against your palm, and it does not wait for you to be ready.

Mara's voice, unedited: "I signed the coolant dump. Ward Nine. Three hundred on the night shift. I want that sentence to stay in my mouth."

The halo would have taken it out of her by dawn. It is in your hand instead.`,
    choices: [
      {
        id: "heard",
        label: "Keep the hour.",
        detail: "You know what the glass is now.",
        effects: { flags: ["heard_memo"], journal: [TRUTH] },
        next: "mara_why",
      },
    ],
  }),
  mara_why: add({
    id: "mara_why",
    location: "The chair room",
    speaker: "Mara",
    text: `The hour is not finished with you.

Mara, still unedited: "Helion told me the dump was a flush, not a kill. I signed because the night shift was already in the building and I thought the tower would move them. They did not move them."

She does not ask you to forgive it. She asks you to keep the reason attached to the crime.`,
    choices: [
      { id: "inspect-hour", label: "Open the hour on the memory bench.", detail: "Inspect the signature, counter-order, and roster. Decide what becomes evidence.", next: "memory_table" },
      {
        id: "why-signed",
        label: "Keep the reason with the hour.",
        detail: "No check. Kerr is still the door.",
        next: (state) => (state.flags.kerr_down || state.flags.kerr_slipped || state.flags.kerr_talked ? "after_kerr" : "kerr"),
      },
    ],
  }),
  vault_quiet: add({
    id: "vault_quiet",
    location: "The chair room",
    speaker: "Mara",
    text: vaultText,
    choices: [
      {
        id: "take",
        label: "Take the shard.",
        detail: "No copy. No fire. Just the hour in your hand.",
        effects: { itemsAdd: ["shard"] },
        next: shardNext("kerr"),
      },
      checkChoice({
        id: "copy",
        label: "Copy it, then take the original.",
        detail: "A second file, if the dice love you.",
        check: {
          stat: "chrome",
          dc: 10,
          label: "Copy the hour",
          itemBonuses: SPOOF,
          flagBonuses: [{ flag: "timing", amount: 1, label: "Calibration window" }],
        },
        successEffects: {
          itemsAdd: ["shard"],
          flags: ["copied"],
          journal: ["A second copy of Mara's hour exists."],
        },
        failEffects: { itemsAdd: ["shard"], flags: ["copy_failed"], strain: 1 },
        resultSuccess: "The buffer drinks a full copy. The original comes free in your hand.",
        resultFail: "The copy collapses. You grab the original as the plinth starts to sulk.",
        nextSuccess: shardNext("kerr"),
        nextFail: shardNext("kerr"),
      }),
      checkChoice({
        id: "fry",
        label: "Fry the plinth and pull whatever survives.",
        detail: "The shard will come out damaged.",
        check: { stat: "chrome", dc: 8, label: "Fry the plinth", itemBonuses: SPOOF },
        successEffects: { itemsAdd: ["shard"], flags: ["ash"], strain: 1 },
        failEffects: { strain: 2 },
        resultSuccess: "The halo dies. What ejects is half a voice.",
        resultFail: "The coil answers. Your nerves light up in the machine's dialect.",
        nextSuccess: shardNext("kerr"),
        nextFail: fryFail,
      }),
    ],
  }),
  kerr: add({
    id: "kerr",
    location: "The chair room",
    speaker: "Kerr",
    text: kerrText,
    choices: [
      checkChoice({
        id: "tell-truth",
        label: "Tell him who signed Ward Nine.",
        hideIfItem: "shard",
        requireFlag: "knows_truth",
        check: {
          stat: "face",
          dc: 8,
          label: "Tell Kerr the truth",
          flagBonuses: [
            { flag: "lumen_here", amount: 1, label: "Lumen" },
            { flag: "knee", amount: 1, label: "Bad knee" },
          ],
        },
        successEffects: { itemsAdd: ["shard"], flags: ["kerr_talked"] },
        resultSuccess: "The name lands. He lets the shard leave with you, and hates the shift he's still on.",
        resultFail: "He has heard the rumor. He does not intend to hear it from you.",
        nextSuccess: shardNext("after_kerr"),
        nextFail: "kerr_fight",
      }),
      checkChoice({
        id: "bluff-kerr",
        label: "Bluff a reason to touch the plinth.",
        hideIfItem: "shard",
        hideIfFlag: "knows_truth",
        check: { stat: "face", dc: 9, label: "Bluff Kerr" },
        successEffects: { itemsAdd: ["shard"], flags: ["kerr_talked"] },
        resultSuccess: "He gives you one contemptuous inch. You spend it on the glass.",
        resultFail: "He doesn't buy a word. His hand is already moving.",
        nextSuccess: shardNext("after_kerr"),
        nextFail: "kerr_fight",
      }),
      checkChoice({
        id: "talk-leave",
        label: "Convince him to let you walk.",
        requireItem: "shard",
        check: {
          stat: "face",
          dc: 8,
          label: "Walk past Kerr",
          flagBonuses: [
            { flag: "knows_truth", amount: 2, label: "Ward Nine" },
            { flag: "lumen_here", amount: 1, label: "Lumen" },
            { flag: "knee", amount: 1, label: "Bad knee" },
          ],
        },
        successEffects: { flags: ["kerr_talked"] },
        resultSuccess: "He steps aside like the door frame hurts. The shard stays yours.",
        resultFail: "He hears you out. Then he decides the listening portion is over.",
        nextSuccess: shardNext("after_kerr"),
        nextFail: "kerr_fight",
      }),
      checkChoice({
        id: "slip",
        label: "Slip the shard and the door.",
        check: {
          stat: "ghost",
          dc: 8,
          label: "Slip past Kerr",
          itemBonuses: LAYOUT,
          flagBonuses: [{ flag: "lumen_here", amount: 1, label: "Lumen draws his eye" }],
        },
        successEffects: { itemsAdd: ["shard"], flags: ["kerr_slipped"] },
        resultSuccess: "Lumen, the chair, the knee: something holds his eyes. You are already gone.",
        resultFail: "His hand finds your coat like it was waiting there.",
        nextSuccess: shardNext("after_kerr"),
        nextFail: "kerr_fight",
      }),
      checkChoice({
        id: "fight",
        label: "Put him down.",
        check: { stat: "nerve", dc: 8, label: "Fight Kerr", itemBonuses: KNIFE },
        successEffects: { itemsAdd: ["shard"], flags: ["kerr_down"], strain: 1 },
        failEffects: { strain: 2, itemsRemove: ["shard"] },
        resultSuccess: "He goes down breathing. You take the glass and the alley.",
        resultFail: "He is faster than the knee suggested.",
        nextSuccess: shardNext("after_kerr"),
        nextFail: strainRoute,
      }),
      checkChoice({
        id: "dose",
        label: "Dose him, then strike.",
        detail: "Uses the sedative.",
        requireItem: "sedative",
        consumeItems: ["sedative"],
        check: { stat: "nerve", dc: 6, label: "Dose Kerr", itemBonuses: KNIFE },
        successEffects: { itemsAdd: ["shard"], flags: ["kerr_down"], strain: 1 },
        failEffects: { strain: 2, itemsRemove: ["shard"] },
        resultSuccess: "The dose makes him polite. The rest is brief.",
        resultFail: "He tastes it and gets meaner before he gets slow.",
        nextSuccess: shardNext("after_kerr"),
        nextFail: strainRoute,
      }),
      checkChoice({
        id: "crash",
        label: "Crash the saint-machine.",
        detail: "The shard comes out damaged.",
        hideIfItem: "shard",
        check: { stat: "chrome", dc: 9, label: "Crash the machine", itemBonuses: SPOOF },
        successEffects: { itemsAdd: ["shard"], flags: ["ash", "kerr_down"], strain: 1 },
        failEffects: { strain: 2, itemsRemove: ["shard"] },
        resultSuccess: "The halo blows. Kerr eats floor. The glass that ejects is already dying.",
        resultFail: "The machine prefers you to the intruder protocol.",
        nextSuccess: shardNext("after_kerr"),
        nextFail: strainRoute,
      }),
      checkChoice({
        id: "copy-hot",
        label: "Copy it while he closes the distance.",
        detail: "You already have the original.",
        requireItem: "shard",
        hideIfFlag: "copied",
        hideIfAnyFlag: ["ash"],
        check: {
          stat: "chrome",
          dc: 10,
          label: "Copy under Kerr",
          itemBonuses: SPOOF,
          flagBonuses: [{ flag: "timing", amount: 1, label: "Calibration window" }],
        },
        successEffects: {
          flags: ["copied", "kerr_slipped"],
          journal: ["A second copy of Mara's hour exists."],
        },
        failEffects: { strain: 1 },
        resultSuccess: "The buffer takes the hour. Kerr takes offense a second too late.",
        resultFail: "The copy dies. So does the distance between you.",
        nextSuccess: shardNext("after_kerr"),
        nextFail: "kerr_fight",
      }),
    ],
  }),
  kerr_fight: add({
    id: "kerr_fight",
    location: "The chair room",
    speaker: "Kerr",
    text: `He moves first. The halo stutters. Mara makes a small sound she will not be allowed to remember.

There is no more conversation in this room. There is only the exit you can still reach.`,
    choices: [
      checkChoice({
        id: "meet",
        label: "Meet him.",
        check: { stat: "nerve", dc: 8, label: "Meet Kerr", itemBonuses: KNIFE },
        successEffects: { itemsAdd: ["shard"], flags: ["kerr_down"], strain: 1 },
        failEffects: { strain: 2, itemsRemove: ["shard"] },
        resultSuccess: "You meet him and you are the one still standing.",
        resultFail: "The floor finds you first.",
        nextSuccess: shardNext("after_kerr"),
        nextFail: strainRoute,
      }),
      checkChoice({
        id: "dose-clinch",
        label: "Dose him in the clinch.",
        detail: "Uses the sedative.",
        requireItem: "sedative",
        consumeItems: ["sedative"],
        check: { stat: "nerve", dc: 6, label: "Dose Kerr", itemBonuses: KNIFE },
        successEffects: { itemsAdd: ["shard"], flags: ["kerr_down"], strain: 1 },
        failEffects: { strain: 2, itemsRemove: ["shard"] },
        resultSuccess: "The sedative wins the clinch for you.",
        resultFail: "He spits it out and puts you into the tile.",
        nextSuccess: shardNext("after_kerr"),
        nextFail: strainRoute,
      }),
      checkChoice({
        id: "crash-now",
        label: "Crash the machine into both of you.",
        detail: "Whatever glass survives will be damaged.",
        hideIfItem: "shard",
        check: { stat: "chrome", dc: 9, label: "Crash the machine", itemBonuses: SPOOF },
        successEffects: { itemsAdd: ["shard"], flags: ["ash", "kerr_down"], strain: 1 },
        failEffects: { strain: 2, itemsRemove: ["shard"] },
        resultSuccess: "The halo dies screaming. You come away with damaged proof.",
        resultFail: "It reaches for the nearer nervous system. That is yours.",
        nextSuccess: shardNext("after_kerr"),
        nextFail: strainRoute,
      }),
      {
        id: "surrender",
        label: "Drop the job.",
        detail: "You stay yourself. You do not stay paid.",
        effects: { itemsRemove: ["shard"], strain: 1 },
        next: "ending_taken",
      },
    ],
  }),
  after_kerr: add({
    id: "after_kerr",
    location: "Chapel alley",
    text: afterText,
    choices: [
      {
        id: "sell",
        label: "Bring the shard to Quill.",
        detail: "Two hundred on delivery.",
        requireItem: "shard",
        hideIfFlag: "ash",
        effects: {
          creds: PAY.delivery,
          itemsRemove: ["shard"],
          journal: ["You sold Mara's hour."],
        },
        next: "ending_sold",
      },
      {
        id: "both",
        label: "Quill gets the original. The copy gets out.",
        detail: "Paid, and the wards get the file.",
        requireItem: "shard",
        requireFlag: "copied",
        hideIfFlag: "ash",
        effects: {
          creds: PAY.delivery,
          itemsRemove: ["shard"],
          journal: ["Helion's crime has a second copy loose in the wards."],
        },
        next: "ending_both",
      },
      {
        id: "destroy",
        label: "Destroy the shard.",
        detail: "No delivery fee. Fewer owners of the hour.",
        requireItem: "shard",
        hideIfFlag: "ash",
        effects: (state) => {
          const journal: string[] = [];
          const itemsAdd: string[] = [];
          if (state.flags.lumen_here) {
            itemsAdd.push("clinic-marker");
            journal.push("Sister Lumen pressed a clinic marker into your palm.");
          }
          if (state.flags.copied) journal.push("You wiped the copy with the original.");
          return {
            itemsRemove: ["shard"],
            itemsAdd,
            flagsOff: state.flags.copied ? ["copied"] : [],
            flags: state.flags.copied ? ["wiped_copy"] : [],
            journal,
          };
        },
        next: smashNext,
      },
      {
        id: "deliver-ash",
        label: "Take the ruined shard to Quill.",
        detail: "He will not pay full.",
        requireItem: "shard",
        requireFlag: "ash",
        effects: {
          creds: PAY.ash,
          itemsRemove: ["shard"],
          journal: ["Quill bought a damaged hour and hated it."],
        },
        next: "ending_ash",
      },
      {
        id: "ditch-ash",
        label: "Leave the ruined glass in the gutter.",
        requireItem: "shard",
        requireFlag: "ash",
        effects: { itemsRemove: ["shard"] },
        next: "ending_walk",
      },
      {
        id: "walk",
        label: "Go back with empty hands.",
        hideIfItem: "shard",
        next: "ending_walk",
      },
    ],
  }),
  ending_sold: add({
    id: "ending_sold",
    location: "Ending",
    ending: true,
    endingTitle: "The Sale",
    text: soldText,
    choices: [weekAfter("act1_sold")],
  }),
  ending_both: add({
    id: "ending_both",
    location: "Ending",
    ending: true,
    endingTitle: "Two Fires",
    text: bothText,
    choices: [weekAfter("act1_both")],
  }),
  ending_burned: add({
    id: "ending_burned",
    location: "Ending",
    ending: true,
    endingTitle: "Unedited",
    speaker: "Sister Lumen",
    text: burnedText,
    choices: [weekAfter("act1_burned")],
  }),
  ending_smashed: add({
    id: "ending_smashed",
    location: "Ending",
    ending: true,
    endingTitle: "No Witness",
    text: smashedText,
    choices: [weekAfter("act1_smashed")],
  }),
  ending_ash: add({
    id: "ending_ash",
    location: "Ending",
    ending: true,
    endingTitle: "Half a Scream",
    text: ashText,
    choices: [weekAfter("act1_ash")],
  }),
  ending_walk: add({
    id: "ending_walk",
    location: "Ending",
    ending: true,
    endingTitle: "Empty Hands",
    text: walkText,
    choices: [weekAfter("act1_walk")],
  }),
  ending_taken: add({
    id: "ending_taken",
    location: "Ending",
    ending: true,
    endingTitle: "Collateral",
    text: takenText,
    choices: [weekAfter("act1_taken")],
  }),
  ending_sainted: add({
    id: "ending_sainted",
    location: "Ending",
    ending: true,
    endingTitle: "Sainted",
    text: saintedText,
    choices: [weekAfter("act1_sainted")],
  }),
};
