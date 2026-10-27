import type { Choice, Effect, GameState, Scene } from "./types";

export const MARA_ACCOUNT_QUOTES = {
  opening: "Before you carry another part of me out of this room, tell me what happened to the first one.",
  sold: "He paid you for it. I thought hearing you say it would feel different.",
  both: "So it went to him and to the street. When do I get to be more than the voice they pass around?",
  destroyed: "I never asked you to choose what was worth keeping. I know why you might have.",
  partial: "He paid for what was left. I wonder which part of me he thought was the useful part.",
  left: "You came back without it. That doesn't tell me what was left in the chair.",
  owned: "You stayed in that sentence. Thank you. It is harder to talk to someone who keeps disappearing behind the job.",
  deflected: "Quill is not sitting here. You are. We can finish the letter. Leave the rest for today.",
  distance: "Then carry only what we agreed. You don't owe me your reasons, and I don't owe you a softer version of mine.",
  returnOwned: "I remember where you put yourself in the story. You can sit without explaining it again.",
  returnDeflected: "Last time, you told me whose job it was. You never told me where you stood.",
  returnDistance: "We left that conversation where we meant to. I haven't filled the silence in for you.",
  returnUnfinished: "You told me where the hour went. We stopped before the rest. We can leave it there.",
  question: "A morning market. I used to go before the stalls opened, when nobody wanted anything from me yet. I would like to choose that again.",
  repair: "I hear the difference. Let it stay different. I don't want to do the rest of this conversation today.",
} as const;

const NIGHT_FLAGS = ["act1_sold", "act1_both", "act1_burned", "act1_smashed", "act1_ash", "act1_walk", "act1_taken", "act1_sainted"] as const;
const APPROACHES = ["owned", "deflected", "distance"] as const;
const has = (state: GameState, id: string) => state.journal.some(j => j.id === id);
export type MaraNight = "sold" | "both" | "destroyed" | "partial" | "left";

/** The edited runner cannot invent a remembered account of the missing night. */
export function maraNight(state: GameState): MaraNight | undefined {
  const flags = NIGHT_FLAGS.filter(f => state.flags[f]);
  if (flags.length !== 1 || flags[0] === "act1_sainted") return;
  return { act1_sold: "sold", act1_both: "both", act1_burned: "destroyed", act1_smashed: "destroyed", act1_ash: "partial", act1_walk: "left", act1_taken: "left" }[flags[0]] as MaraNight;
}
export function maraNightWords(state: GameState): string {
  if (state.flags.act1_sold) return "You tell her you sold the original to Quill.";
  if (state.flags.act1_both) return "You tell her Quill paid for the original and the other file went into circulation.";
  if (state.flags.act1_burned) return "You tell her you broke the original in front of Lumen, who sent her own account afterward.";
  if (state.flags.act1_smashed) return "You tell her you broke the original alone.";
  if (state.flags.act1_ash) return "You tell her the damaged original reached Quill and he paid half.";
  if (state.flags.act1_taken) return "You tell her Kerr stopped you and you came back without the original.";
  if (state.flags.act1_walk) return state.flags.kerr_terms_withdrew || state.flags.kerr_terms_withdrew_after_exposure
    ? "You tell her you left the original at the chapel and walked out."
    : "You tell her you returned without an original to deliver. You could not stop the booked edit.";
  return "The account of that night is incomplete.";
}
export function maraAccountDisclosed(state: GameState): boolean {
  const night = maraNight(state);
  const records = ["sold", "both", "destroyed", "partial", "left"].filter(n => state.flags[`mara_account_night_${n}`]);
  return Boolean(night && records.length === 1 && records[0] === night && has(state, `mara-account-night-${night}`));
}
export function discloseMaraAccount(state: GameState): Effect {
  const night = maraNight(state);
  if (!night) return {};
  return { flags: [`mara_account_night_${night}`], journal: [{ id: `mara-account-night-${night}`, kind: "fact", text: `${maraNightWords(state)} Mara heard this account from you in the clinic. It supplies no new source or permission.` }] };
}
export function maraAccountOutcome(state: GameState): typeof APPROACHES[number] | "unfinished" | undefined {
  const found = APPROACHES.filter(a => state.flags[`mara_account_${a}`]);
  if (found.length > 1) return;
  if (!found.length) return maraAccountDisclosed(state) ? "unfinished" : undefined;
  const approach = found[0];
  if (!has(state, `mara-account-${approach}`) || approach !== "distance" && !maraAccountDisclosed(state)) return;
  // A distance record is a refusal to disclose, not a second, contradictory admission.
  if (approach === "distance" && ["sold", "both", "destroyed", "partial", "left"].some(n => state.flags[`mara_account_night_${n}`])) return;
  return approach;
}
export const maraAccountRepaired = (state: GameState) => maraAccountOutcome(state) === "deflected" && state.flags.mara_account_repaired && has(state, "mara-account-repaired");
export const maraAccountQuestionHeard = (state: GameState) => maraAccountOutcome(state) === "owned" && state.flags.mara_account_question && has(state, "mara-account-question");

export function maraAccountRecord(state: GameState): string | undefined {
  const outcome = maraAccountOutcome(state);
  if (!outcome) return;
  if (outcome === "distance") return "You kept an honest personal distance. Mara agreed to the scope of the letter without demanding your reasons.";
  if (outcome === "unfinished") return "You told Mara what happened to the hour, then left the personal conversation unfinished.";
  if (outcome === "owned") return `You told Mara what happened to her hour and acknowledged your own choice.${maraAccountQuestionHeard(state) ? " Later she told you about the morning market she hopes to choose again." : " Her later personal answer has not been heard."} No forgiveness or new quotation permission was granted.`;
  return maraAccountRepaired(state)
    ? "You first put responsibility on Quill, then acknowledged your own part when you returned. Mara heard the correction and kept the personal conversation closed that day. Both acts remain recorded."
    : "You told Mara what happened to the hour but put responsibility on Quill. She kept the letter arrangement and closed the new personal conversation.";
}
export function maraAccountCoda(state: GameState): string | undefined {
  const outcome = maraAccountOutcome(state);
  if (!outcome) return;
  if (maraAccountQuestionHeard(state)) return "You picture the market before the shutters rise, the ordinary morning Mara hoped to choose. She offered that picture in private; it is not another line for the wall.";
  if (maraAccountRepaired(state)) return "The sentence you corrected at Mara's chair stays beside the first one. She heard it without reopening the conversation. You leave both acts where they happened.";
  return outcome === "owned" ? "You told Mara what you chose without asking her to make it clean. There was room for you in that sentence, and no promise that it would be forgiven."
    : outcome === "distance" ? "There was a silence you and Mara agreed to keep. It did not become an invitation just because the story reached its end."
    : outcome === "deflected" ? "Quill's name was the space you left between yourself and Mara. The letter could travel. That conversation went no further."
    : "Mara heard where the hour went. You left the rest unsaid. An unfinished conversation can remain unfinished beside a finished night.";
}

export function maraAccountChoices(state: GameState, scene: Scene, choices: Choice[]): Choice[] {
  const outcome = maraAccountOutcome(state);
  return choices.filter(choice => {
    if (state.flags.mara_account_enabled && outcome === "deflected" && ["ask-mara-tomorrow", "share-mara-window"].includes(choice.id)) return false;
    if (!choice.id.startsWith("mara-account-")) return true;
    if (["mara-account-disclose", "mara-account-own", "mara-account-deflect", "mara-account-distance"].includes(choice.id)
      && (!state.flags.mara_account_enabled || !state.flags.heard_memo || !state.flags.response_private_consent || !has(state, "mara-response-terms") || state.flags.act2_done)) return false;
    if (choice.id === "mara-account-open") return Boolean(state.flags.mara_account_enabled && state.flags.heard_memo && state.flags.response_private_consent && has(state, "mara-response-terms") && maraNight(state) && (!outcome || outcome === "unfinished"));
    if (choice.id === "mara-account-disclose") return Boolean(maraNight(state) && !outcome);
    if (choice.id === "mara-account-own" || choice.id === "mara-account-deflect") return outcome === "unfinished";
    if (choice.id === "mara-account-distance") return !outcome;
    if (choice.id === "mara-account-return") return Boolean(outcome);
    if (choice.id === "mara-account-ask") return outcome === "owned" && !maraAccountQuestionHeard(state) && has(state, "mara-account-return");
    if (choice.id === "mara-account-correct") return outcome === "deflected" && !maraAccountRepaired(state) && has(state, "mara-account-return");
    if (choice.id === "mara-account-keep-answer") return outcome === "owned" && !maraAccountQuestionHeard(state) && has(state, "mara-account-return");
    return true;
  });
}
