import { MARA_ACCOUNT_QUOTES as Q, discloseMaraAccount, maraAccountDisclosed, maraAccountOutcome, maraAccountRepaired, maraNight, maraNightWords } from "../mara-account";
import type { Choice, GameState, Scene } from "../types";

const room = "Clinic side room, Ward Four";
const returned = (s: GameState) => s.journal.some(j => j.id === "mara-account-return");
const guards: Record<string, (s: GameState) => boolean> = {
  act2_mara_account: s => Boolean(s.flags.mara_account_enabled && s.flags.response_private_consent && s.flags.heard_memo && maraNight(s)),
  act2_mara_account_told: maraAccountDisclosed,
  act2_mara_account_owned: s => maraAccountOutcome(s) === "owned",
  act2_mara_account_deflected: s => maraAccountOutcome(s) === "deflected",
  act2_mara_account_distance: s => maraAccountOutcome(s) === "distance",
  act3_mara_account_return: s => Boolean(maraAccountOutcome(s) && returned(s)),
  act3_mara_account_question: s => maraAccountOutcome(s) === "owned" && returned(s),
  act3_mara_account_repair: maraAccountRepaired,
};
const scene = (id: string, text: Scene["text"], choices: Choice[]): Scene => ({ id, location: room, speaker: "Mara", text: s => guards[id](s) ? typeof text === "function" ? text(s) : text : "Mara waits beside the window. The personal account is incomplete; the letter keeps its own terms.", choices });
const dispatch: Choice = { id: "mara-account-dispatch", label: "Return to the letter’s terms.", detail: "Dispatch and company keep their existing terms and costs.", next: "act2_response_terms" };
const leave: Choice = { id: "mara-account-leave", label: "Leave the conversation where it stands.", effects: { flags: ["mara_account_returned"] }, next: "act3_arrival" };
export const maraAccountEntry: Choice = { id: "mara-account-open", label: "Let Mara ask what happened to her hour.", detail: "A personal conversation. Reading or pausing is free; you can keep an honest distance.", requireFlag: "mara_account_enabled", hideIfAnyFlag: ["mara_account_owned", "mara_account_deflected", "mara_account_distance", "act2_done"], next: s => maraAccountDisclosed(s) ? "act2_mara_account_told" : "act2_mara_account" };
export const maraAccountReturn: Choice = { id: "mara-account-return", label: "Return to what you told Mara about the hour.", detail: "She remembers what you chose to say. Her letter and the records inquiry keep their own status.", requireFlag: "mara_account_enabled", hideIfFlag: "mara_account_returned", effects: { flags: ["response_visit"], journal: [{ id: "mara-account-return", kind: "fact", text: "You returned to Mara's personal conversation about the hour. This visit supplied no inquiry result or new public permission." }] }, next: "act3_mara_account_return" };

export const MARA_ACCOUNT_SCENES: Record<string, Scene> = {
  act2_mara_account: scene("act2_mara_account", `Mara leaves the envelope on her side of the table. The cup has stopped steaming.\n\n"${Q.opening}"\n\nShe has asked you. She has not been told what you did.`, [
    { id: "mara-account-disclose", label: "Tell her what you chose that night.", detail: "Describe the actual outcome. Mara learns it from you here.", effects: discloseMaraAccount, next: "act2_mara_account_told" },
    { id: "mara-account-distance", label: "Say you can carry the letter, but cannot offer a personal account.", detail: "Keep an honest distance without inventing a story or promising company.", effects: { flags: ["mara_account_distance"], journal: [{ id: "mara-account-distance", kind: "fact", text: "You declined a personal account of the hour. Mara accepted that distance while keeping the authorized private letter separate." }] }, next: "act2_mara_account_distance" },
    { id: "mara-account-pause", label: "Pause before answering. Return to the letter.", detail: "No personal answer committed. You can return before the Week closes.", next: "act2_response_terms" },
  ]),
  act2_mara_account_told: scene("act2_mara_account_told", s => {
    const night = maraAccountDisclosed(s) ? maraNight(s) : undefined;
    if (!night) return "Mara waits by the cooling cup. The account of the hour is incomplete; there is no answer to put in her mouth.";
    return `${maraNightWords(s)} She listens to the end without touching the envelope.\n\n"${Q[night]}"\n\nHer eyes come back to you. The route out of the chapel is no longer the question.`;
  }, [
    { id: "mara-account-own", label: "Acknowledge your choice. Do not ask her to excuse it.", detail: "She can respond to you personally. Her responsibility and the private letter remain separate.", effects: { flags: ["mara_account_owned"], journal: [{ id: "mara-account-owned", kind: "fact", text: "After telling Mara what happened to her hour, you acknowledged choosing your part in it. She accepted a personal conversation, without forgiving it or granting public quotation." }] }, next: "act2_mara_account_owned" },
    { id: "mara-account-deflect", label: "Put it on Quill. You were doing his job.", detail: "Mara ends further personal questions today; the letter can still be dispatched. A later acknowledgment does not reopen personal questions that day.", effects: { flags: ["mara_account_deflected"], journal: [{ id: "mara-account-deflected", kind: "fact", text: "After describing the hour's outcome, you put responsibility for your part on Quill. Mara kept the letter arrangement but closed this personal conversation." }] }, next: "act2_mara_account_deflected" },
    { id: "mara-account-pause-told", label: "Leave the answer unfinished for now.", detail: "She has heard where the hour went. You can finish this conversation before the Week closes.", next: "act2_response_terms" },
  ]),
  act2_mara_account_owned: scene("act2_mara_account_owned", `Mara takes a breath before she answers. The rain has worked a bright line down the window frame.\n\n"${Q.owned}"\n\nShe moves her cup off the unused chair's side of the table. If you return later, there may be something ordinary to ask her about.`, [dispatch]),
  act2_mara_account_deflected: scene("act2_mara_account_deflected", `Mara brings the envelope closer. She does not take back the arrangement you made for it.\n\n"${Q.deflected}"\n\nThe cup stays on her side of the table.`, [dispatch]),
  act2_mara_account_distance: scene("act2_mara_account_distance", `You tell her what you can offer, and where it ends. Mara considers it without reaching for another question.\n\n"${Q.distance}"\n\nShe turns the envelope so its address faces you.`, [dispatch]),
  act3_mara_account_return: scene("act3_mara_account_return", s => {
    const outcome = maraAccountOutcome(s);
    if (!outcome) return "Mara sets her cup beside the window. There is no coherent personal account to continue.";
    const quote = { owned: Q.returnOwned, deflected: Q.returnDeflected, distance: Q.returnDistance, unfinished: Q.returnUnfinished }[outcome];
    return `Mara looks at the spare chair before she looks at you. The window is the same; the conversation has a past now.\n\n"${quote}"\n\n${outcome === "owned" ? "She leaves room for one personal question. You can also let the visit end here." : outcome === "deflected" ? "You can acknowledge what you left out. She has not offered another personal question." : "Neither of you has promised another answer."}`;
  }, [
    { id: "mara-account-ask", label: "Ask about an ordinary morning she would choose.", detail: "A private personal answer. No recording, quotation permission or treatment outcome.", next: "act3_mara_account_question" },
    { id: "mara-account-correct", label: "Acknowledge that Quill's job was still your choice.", detail: "Record the correction beside the deflection. Mara keeps personal questions closed today; the letter and earlier outcome do not change.", effects: { flags: ["mara_account_repaired"], journal: [{ id: "mara-account-repaired", kind: "fact", text: "You acknowledged your own choice after previously putting it on Quill. Mara heard the correction and kept this personal conversation closed that day. No forgiveness, new invitation or erased history was granted." }] }, next: "act3_mara_account_repair" }, leave,
  ]),
  act3_mara_account_question: scene("act3_mara_account_question", `You ask what she would do with a morning that belonged to her. Mara watches a shutter opening across the walkway.\n\n"${Q.question}"\n\nShe has offered a hope. You leave it in the room with her.`, [
    { id: "mara-account-keep-answer", label: "Remember the market without turning it into a promise.", requireFlag: "mara_account_owned", effects: { flags: ["mara_account_returned", "mara_account_question"], journal: [{ id: "mara-account-question", kind: "claim", text: "In a private conversation, Mara said she hopes to choose a morning market before the stalls open. It is a personal hope, not observed care, forgiveness, a promise or permission to publish her words." }] }, next: "act3_arrival" },
  ]),
  act3_mara_account_repair: scene("act3_mara_account_repair", `You stop at Quill's name and begin the sentence again with your own part in it. Mara keeps her hands still while you speak.\n\n"${Q.repair}"\n\nYou have changed what you said on this visit. You have not changed what she heard on the first.`, [leave]),
};
