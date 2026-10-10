import type { GameState, Scene } from "../types";

const ROOTS: Record<GameState["origin"], string> = {
  gutterwire: "You grew up below these pipes. You know which stair stays dry, who leaves a door unlatched, and how long a patrol takes to turn the corner. People call that local knowledge. You have made it a living.",
  spire: "You used to cross the city above the rain, a Helion badge opening every door ahead of you. Then your clearance stopped working. Down here, you are learning what those doors kept outside. Your old training is still yours.",
  dustline: "You carried parcels across the flats before you came under the dome. Out there, a bad route could kill you. In Kite City, a good route can belong to someone who charges twice. You are still a courier. You are learning the price of staying.",
};

export function openingMotive(state: GameState): string {
  if (state.flags.opening_survival) return "You came for enough money to keep tomorrow yours. You want the terms before the promises.";
  if (state.flags.opening_identity) return "You came because the city already has too much say over who you are. The work is a means, not a claim on your name.";
  if (state.flags.opening_exit) return "You came to buy yourself a way beyond the next closed door. One job will not do that alone. It might be a start.";
  return "";
}

function motiveReminder(state: GameState): string {
  if (state.flags.opening_survival) return "You want work that will keep tomorrow yours.";
  if (state.flags.opening_identity) return "You want work without another claim on your name.";
  if (state.flags.opening_exit) return "You want a way beyond the next closed door.";
  return "";
}

function selfText(state: GameState): string {
  const trouble = state.complication === "debt"
    ? `Your chip holds ${state.creds} creds. Quill covered a shortfall once. The debt still carries his name, and his invitation arrived before you found another way to pay it.`
    : state.complication === "optic"
      ? `Your borrowed optic ticks in the damp. Sister Lumen at Glass Chapel fitted it when you needed help; you still owe the clinic. Your chip holds ${state.creds} creds. Repairs and gratitude both cost something here.`
      : state.complication === "on-file"
        ? `Your chip holds ${state.creds} creds. Helion still keeps a file under your old name. Every official job asks for a number that leads back to it. Quill’s work comes through quieter doors.`
        : `Your chip holds ${state.creds} creds. It will buy a little time. You need work before that time runs out.`;
  const tomorrow = state.origin === "gutterwire"
    ? "Tomorrow you will still need a dry place to sleep. You would like to choose whose door you knock on."
    : state.origin === "spire"
      ? "You still reach for the old badge at locked doors. You would like a life that does not need it."
      : "Your route book has a blank page for the next crossing. You would like to choose the destination this time.";
  return `${ROOTS[state.origin]}\n\n${trouble}\n\n${tomorrow} Quill brokers jobs without an official record. Tonight you are going to hear one, under the street handle ${state.handle}. What do you want it to buy?`;
}

export const OPENING_SCENES: Record<string, Scene> = {
  opening_city: {
    id: "opening_city", location: "Kite City, Ward Four · before midnight",
    text: `Rain runs down the inside of Kite City’s dome. Above it, Helion’s towers stay dry. Below it, your chip lights up: “Ward Four noodle stall. Tonight. I have work.” Quill, a broker. You need the work. You have not said yes.\n\nThe year is 3055. You carry things, open doors, find what someone would rather lose. People call you a runner. Across the street, a Glass Chapel advertisement promises a night without regret: pay to edit an hour of memory. The original survives in a sliver of glass called a shard.\n\nThe stall’s amber light cuts through the rain a few streets ahead. Find Quill. Hear the offer before you decide what it is worth.`,
    choices: [
      { id: "begin-opening", label: "Walk toward the stall.", next: "opening_self" },
      { id: "skip-opening", label: "Go straight to Quill’s meeting.", detail: "Skip the prologue and hear the job. No money, items, or stats change.", effects: { flags: ["opening_skipped"] }, next: "stall" },
    ],
  },
  opening_self: {
    id: "opening_self", location: "Ward Four, under the awnings", text: selfText,
    choices: [
      { id: "opening-survival", label: "Keep tomorrow paid for.", detail: "Choose a personal reason. This changes your opening dialogue, not your stats.", effects: { flags: ["opening_survival"] }, next: "opening_approach" },
      { id: "opening-identity", label: "Keep my name and my life mine.", detail: "Choose a personal reason. This changes your opening dialogue, not your stats.", effects: { flags: ["opening_identity"] }, next: "opening_approach" },
      { id: "opening-exit", label: "Build a way out of this life.", detail: "Choose a personal reason. This changes your opening dialogue, not your stats.", effects: { flags: ["opening_exit"] }, next: "opening_approach" },
    ],
  },
  opening_approach: {
    id: "opening_approach", location: "Ward Four night market",
    text: (state) => `${motiveReminder(state)}${motiveReminder(state) ? " " : ""}Steam rises through the awnings. A woman behind the noodle counter wipes rain off a menu while the tower advert plays above her: “Sleep without yesterday.” She sees you looking.\n\n“Funny thing to sell,” she says. “Yesterday.”\n\nQuill sits at the far end of her counter, coat buttoned, bowl untouched. He raises two fingers. You have a moment before you take the stool.`,
    choices: [
      { id: "hear-stallholder", label: "Ask her what she means.", detail: "Hear one person’s experience of the memory trade. No check or purchase.", effects: { flags: ["opening_neighbor_heard"] }, next: "opening_neighbor" },
      { id: "meet-quill", label: "Take the stool opposite Quill.", effects: { flags: ["opening_complete"] }, next: "stall" },
    ],
  },
  opening_neighbor: {
    id: "opening_neighbor", location: "Noodle counter, Ward Four",
    text: "“A regular came in last winter,” she says. “He'd sold an argument with his wife to make the rent. Remembered getting paid. Didn't remember what he needed to apologize for. Asked me to write it down.”\n\nShe flattens the damp menu. “I sell dinner. But if someone hires you to carry an hour, ask whose it was before you ask what it pays.”\n\nQuill moves his bowl aside. You still need work; now you have a question to take with you.",
    choices: [{ id: "take-the-stool", label: "Sit down and hear Quill’s offer.", effects: { flags: ["opening_complete"] }, next: "stall" }],
  },
};
