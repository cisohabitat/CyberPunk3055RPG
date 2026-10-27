import type { Choice, GameState, Scene } from "../types";
import { KERR_TERMS_QUOTES as Q } from "../kerr-terms";

const enabled = "kerr_terms_enabled";
const attempted = "kerr_terms_attempted";
const resume = (state: GameState) => state.items.includes("shard") && !state.flags.heard_memo ? "memo" : "after_kerr";
const back: Choice = { id: "kerr-terms-back", label: "Return to the doorway.", detail: "No offer accepted and no cost paid.", hideIfFlag: attempted, next: "kerr" };
const scene = (id: string, text: string | Scene["text"], choices: Choice[], location = "The chair room"): Scene => ({ id, location, speaker: "Kerr", text, choices });

export const KERR_TERMS_SCENES: Record<string, Scene> = {
  kerr_terms: scene("kerr_terms", state => `Kerr turns his wrist until the shift clock faces him. For a moment the man in the door looks like someone waiting to be allowed home. He waits with his weight against the jamb.\n\n${state.items.includes("shard") ? "The glass warms your palm. Neither of you has agreed where it goes." : "The plinth is still open. The hour has not left this room."}\n\n"${Q.opening}"`, [
    { id: "kerr-terms-offer", label: "Make an offer in your own name.", detail: "Hear his terms before agreeing. No check or payment yet.", next: "kerr_terms_negotiate" },
    { id: "kerr-terms-lie", label: "Ask what clearance he would accept.", detail: "Consider a false authorization. Review the risk before committing to a lie.", next: "kerr_terms_bluff" },
    { id: "kerr-terms-step-back", label: "Consider leaving the hour behind.", detail: "Review the withdrawal before committing.", next: "kerr_terms_retreat" }, back,
  ]),
  kerr_terms_negotiate: scene("kerr_terms_negotiate", state => `${state.flags.heard_memo ? "Mara's recorded sentence is still in your head. " : ""}You ask what it would take to leave without putting either of you on the floor. He lowers his eyes to the leg he has been keeping straight.\n\n"${Q.negotiate}"\n\nHe shifts his weight off the bad leg and leaves the question hanging between you.`, [
    { id: "kerr-terms-pay", label: "Pay twenty. Give him your name. Carry the hour.", detail: "20 credits and Helion +1. Kerr records a contested departure; this is not clearance or proof of treatment.", requireFlag: enabled, hideIfFlag: attempted, requireCreds: 20,
      effects: { creds: -20, factions: { helion: 1 }, itemsAdd: ["shard"], flags: [attempted, "kerr_terms_named", "kerr_talked"], journal: [{ id: "kerr-terms-named", kind: "fact", text: "Kerr let me carry the hour out under objection. I paid twenty toward his clinic journey and gave my name for his report." }] }, next: "kerr_terms_named" }, back,
  ]),
  kerr_terms_named: scene("kerr_terms_named", `Kerr takes the money without counting it in front of you. He enters the name you gave him in the report field, then leaves enough room for one person to pass.\n\n"${Q.named}"`, [
    { id: "kerr-terms-named-exit", label: "Carry the hour into the rain.", requireAllFlags: [enabled, "kerr_terms_named"], next: resume },
  ]),
  kerr_terms_bluff: scene("kerr_terms_bluff", `You ask what he would do if a desk had already cleared the removal. Kerr does not move toward the glass.\n\n"${Q.bluff}"\n\nHe is watching your eyes now. The invented desk would have to hold his attention long enough for you to move.`, [
    { id: "kerr-terms-bluff-check", label: "Invent a desk. Commit to the false clearance.", detail: "Face check. Failure adds one strain before critical adjustment and exposes the lie; no repeat attempt.", requireFlag: enabled, hideIfFlag: attempted,
      check: { stat: "face", dc: 9, label: "Keep Kerr on the false desk" },
      successEffects: { itemsAdd: ["shard"], flags: [attempted, "kerr_terms_bluffed", "kerr_slipped"], journal: [{ id: "kerr-terms-bluffed", kind: "fact", text: "I invented a clearance desk. Kerr checked while I took the hour through the gap; no clearance existed." }] },
      failEffects: { strain: 1, flags: [attempted, "kerr_terms_exposed"], journal: [{ id: "kerr-terms-exposed", kind: "fact", text: "I invented a clearance. Kerr checked and exposed it before I could use the gap." }] },
      resultSuccess: "His eyes turn to the collar display. You take the glass and the distance. The clearance is still a lie.", resultFail: "He checks before he turns. The false desk has nowhere to hide.", nextSuccess: "kerr_terms_bluffed", nextFail: "kerr_terms_exposed" }, back,
  ]),
  kerr_terms_bluffed: scene("kerr_terms_bluffed", `Kerr's collar gives him silence. You are at the threshold with the hour. He is still looking for the person you invented.\n\n"${Q.bluffed}"`, [
    { id: "kerr-terms-bluffed-exit", label: "Leave before the story runs out.", requireAllFlags: [enabled, "kerr_terms_bluffed"], next: resume },
  ]),
  kerr_terms_exposed: scene("kerr_terms_exposed", `Kerr turns the blank collar display toward you. He does not need to raise his voice.\n\n"${Q.exposed}"`, [
    { id: "kerr-terms-exposed-retreat", label: "Leave the hour. Step back.", detail: "Withdraw from this night's job. Review before leaving.", next: "kerr_terms_retreat" },
    { id: "kerr-terms-exposed-fight", label: "Stand your ground.", detail: "The original fight and its risks. The exposed lie remains recorded.", next: "kerr_fight" },
  ]),
  kerr_terms_retreat: scene("kerr_terms_retreat", `There is room behind you to leave. Kerr does not make you ask twice. Beyond his shoulder the chair is still lit.\n\n"${Q.retreat}"\n\nYou can keep yourself out of this fight. You cannot carry the original through this exit.`, [
    { id: "kerr-terms-withdraw", label: "Leave with your hands open.", detail: "Give up the original and this night's job. No payment or further strain. The campaign continues.", requireFlag: enabled, hideIfAnyFlag: ["kerr_terms_named", "kerr_terms_bluffed", "kerr_terms_withdrew", "kerr_terms_withdrew_after_exposure"],
      effects: state => state.flags.kerr_terms_exposed
        ? { itemsRemove: ["shard"], flags: ["kerr_terms_withdrew_after_exposure"] }
        : { itemsRemove: ["shard"], flags: [attempted, "kerr_terms_withdrew"], journal: [{ id: "kerr-terms-withdrew", kind: "fact", text: "I left the original hour at the chapel. Kerr let me go; I did not take it out." }] }, next: "ending_walk" }, back,
  ]),
  act2_kerr_terms_owned: scene("act2_kerr_terms_owned", `You say there was no clearance. No desk, no person who failed to answer. You gave him something to chase because you wanted the door.\n\nKerr waits until you have stopped explaining.\n\n"${Q.owned}"\n\nHe has heard an admission. You still have to decide what the next minute contains.`, [
    { id: "kerr-terms-owned-work", label: "Hear what he needs this week.", next: "act2_kerr" },
    { id: "kerr-terms-owned-leave", label: "Leave the admission with him.", next: "districts" },
  ], "Ward Four"),
};
