import type { Choice, Effect, GameState, Scene } from "./types";

export const CRAFT_QUOTES = {
  archive: "The plant stayed on. The workers were meant to leave. Find the line that changed before you ask me to put my name under yours.",
  challenge: "You have made one column answer for another. Look again. I am not asking you to believe me; I am asking you to read what is there.",
  issuer: "If you want the hand behind the instruction, bring the cancellation to its key. Her approval is a different act.",
  ledger: "Ask for the movement page. Leave the families out of the request. I can help you carry a record; I will not give you people to lean on.",
  archiveReturn: "Keep the question beside the answer you actually brought back. I still have to work here tomorrow.",
  bargain: "You want me to pay for the quiet way in. Fine. Put something of yours on the counter.",
  kept: "There is the case. There is no name in their register. We kept the bargain. The fitting is another day's work.",
  missed: "I can count what arrived. I can read what they kept. We are not going to make one of those disappear by talking about the other.",
  canceled: "You stopped before the journey. We can leave it here. The case is still there, and neither of us will call it collected.",
} as const;
export const CRAFT_RECORDS = [
  { id: "export", title: "Export receipt", text: "A later instruction cancels worker evacuation. Mara's earlier approval remains attached to the coolant work." },
  { id: "plant", title: "Plant-service catalog", text: "The coolant operation remained scheduled. This summary describes machinery work, not whether workers were told to leave." },
  { id: "movement", title: "Shift-movement catalog", text: "An evacuation revision has a ledger locator, WN/SHIFT/REV. This describes a possible second source; it is not the retrieved page or an issuing-key match." },
] as const;
const record = (s: GameState, id: string) => s.journal.some(j => j.id === id && j.kind === "fact");
export function craftArchiveReady(s: GameState) {
  return Boolean(s.flags.encounter_craft_enabled && s.flags.archive_briefed && s.flags.memory_intact && !s.flags.archive_done && !s.flags.craft_archive_attempted && !s.flags.act2_done && !s.flags.archive_catalog_open && !["planned", "positioned"].includes(s.archivePlan?.stage ?? ""));
}
export function craftScope(s: GameState): "issuer" | "movement" | undefined {
  const f = s.flags; return f.craft_scope_issuer && !f.craft_scope_movement ? "issuer" : f.craft_scope_movement && !f.craft_scope_issuer ? "movement" : undefined;
}
export const craftInspected = (s: GameState) => ["export", "plant", "movement"].every(id => s.flags[`craft_read_${id}`]);
export const CRAFT_ARCHIVE_ENTRY: Choice = { id: "craft-archive-question", label: "Work out which part of the order changed.", detail: "Compare the export and two catalog summaries. Choose a question, then a scoped extraction or issuing-key test. Reading and drafting are free.", requireAllFlags: ["encounter_craft_enabled", "archive_briefed", "memory_intact"], hideIfAnyFlag: ["archive_done", "act2_done", "archive_catalog_open"], next: s => craftInspected(s) && craftScope(s) ? `act2_craft_archive_${craftScope(s) === "issuer" ? "issuer" : "ledger"}` : "act2_craft_archive" };
export const CRAFT_KERR_ENTRY: Choice = { id: "craft-kerr-bargain", label: "Ask Kerr to cover an anonymous lift fare.", detail: "Negotiate a cash bond, equipment security, a self-funded collection or refusal. No cost just to hear the offer.", requireFlag: "encounter_craft_enabled", hideIfAnyFlag: ["kerr_route_promised", "kerr_route_declined", "kerr_route_done", "act2_done", "craft_kerr_agreed"], next: "act2_craft_kerr_offer" };
export const CRAFT_SETTLE_ENTRY: Choice = { id: "craft-settle-kerr", label: "Review Kerr's fare bargain and security.", detail: "Settle an actual handover or closed request, or cancel before departure. No settlement grants treatment or erases a recipient record.", requireAllFlags: ["encounter_craft_enabled", "craft_kerr_agreed"], requireJournal: "craft-kerr-terms", hideIfFlag: "craft_kerr_settled", next: s => s.flags.act2_done ? "act3_craft_kerr_settlement" : "act2_craft_kerr_settlement" };
export const CRAFT_ARCHIVE_RETURN: Choice = { id: "craft-return-edda", label: "Return to the question you brought to Edda's desk.", requireAllFlags: ["encounter_craft_enabled", "craft_archive_attempted"], requireJournal: "craft-archive-request", hideIfFlag: "craft_archive_returned", effects: s => ({ flags: s.sceneId === "act3_edda_visit" ? ["craft_return_from_edda"] : [], flagsOff: s.sceneId === "act3_edda_visit" ? [] : ["craft_return_from_edda"] }), next: "act3_craft_archive_return" };
export function craftBond(s: GameState): "cash" | "tool" | "self" | undefined {
  if (!s.flags.encounter_craft_enabled || !s.flags.craft_kerr_agreed || !s.flags.kerr_route_private || !record(s, "craft-kerr-terms")) return;
  const kinds = (["cash", "tool", "self"] as const).filter(k => s.flags[`craft_bond_${k}`]); if (kinds.length !== 1) return;
  const terms = craftAgreement(kinds[0]).journal!.find(j => typeof j !== "string" && j.id === "craft-kerr-terms");
  return terms && typeof terms !== "string" && s.journal.some(j => j.id === "craft-kerr-terms" && j.text === terms.text) ? kinds[0] : undefined;
}
export function craftSettlement(s: GameState) {
  const kind = craftBond(s); if (!kind || s.flags.craft_kerr_settled) return;
  const started = Boolean(s.flags.kerr_route_started && record(s, "kerr-itinerary"));
  const delivered = Boolean(started && s.flags.kerr_route_delivered && s.flags.kerr_route_done && record(s, "kerr-collection-outcome"));
  const canceled = !s.flags.act2_done && !s.sceneId.startsWith("act3_") && !s.sceneId.startsWith("ending_") && !s.flags.kerr_route_started && !s.flags.kerr_route_delivered && !s.flags.kerr_route_collected && !s.flags.kerr_route_failed && !s.flags.depot_started;
  if (!canceled && !s.flags.kerr_route_done && !s.flags.act2_done) return;
  const registered = s.flags.kerr_route_trace || s.flags.kerr_route_courier || s.journal.some(j => j.kind === "fact" && (j.id === "kerr-itinerary" && j.text.includes("The gate recorded") || j.id === "kerr-collection-outcome" && j.text.includes("broke the promised private terms")));
  const kept = delivered && !registered;
  const fare = kept && kind !== "self" && s.flags.kerr_entry_lift && s.journal.some(j => j.id === "kerr-itinerary" && j.text.includes("Departed through coin lift") && j.text.includes("Spent 10 creds")) ? 10 : 0;
  return { kind, canceled, kept, cash: (canceled || kept) && kind === "cash" ? 20 + fare : fare, tool: (canceled || kept) && kind === "tool", fare };
}
export function craftBondRecord(s: GameState): string {
  const kind = craftBond(s); if (!kind) return "";
  if (s.flags.craft_kerr_settled && record(s, "craft-kerr-settlement")) return s.flags.craft_kerr_canceled ? "Kerr's fare bargain was canceled before departure; security was returned, not a case delivered." : "Kerr's fare bargain was settled against the actual handover and recipient record.";
  if (kind !== "self" && (s.flags.act2_done || s.sceneId.startsWith("act3_") || s.sceneId.startsWith("ending_"))) return craftSettlement(s)?.kept ? "The private handover earned a return under Kerr's fare bargain; no settlement has yet been recorded." : "The week closed without a private observed handover. Kerr has not returned the pledged security; no lift reimbursement was earned.";
  return kind === "self" ? "You chose a self-funded private collection; Kerr owes no fare contribution." : `Kerr holds ${kind === "cash" ? "twenty creds" : "your signal baffle"} as security. A private observed handover returns it; an actually paid coin-lift entry can also earn ten creds back. A breach or uncompleted journey after the week loses the security. Cancel before departure to reclaim it.`;
}
export function craftSettleEffect(s: GameState): Effect {
  const result = craftSettlement(s); if (!result) return {};
  return { creds: result.cash, ...(result.tool ? { itemsAdd: ["signal-baffle"] } : {}), flags: ["craft_kerr_settled", ...(result.canceled ? ["craft_kerr_canceled", "kerr_route_done", "kerr_route_declined"] : [])], journal: [{ id: "craft-kerr-settlement", kind: "fact", text: `${result.canceled ? "The fare bargain was mutually canceled before departure. No collection occurred." : result.kept ? "A private observed handover met the fare bargain." : "The request ended without a private observed handover; any recipient entry remains."} Returned ${result.cash} creds${result.tool ? " and the pledged signal baffle" : ""}. ${result.fare ? "Ten of those creds reimburse the actually paid coin-lift entry." : "No lift reimbursement was earned."} No treatment outcome or forgiveness was supplied.` }] };
}
export function craftAgreement(kind: "cash" | "tool" | "self"): Effect {
  return { ...(kind === "cash" ? { creds: -20 } : kind === "tool" ? { itemsRemove: ["signal-baffle"] } : {}), flags: ["craft_kerr_agreed", `craft_bond_${kind}`, "kerr_route_promised", "kerr_route_private"], journal: [{ id: "kerr-collection-promise", kind: "promise", text: "You promised a private collection of Kerr's unpowered brace. Actual recipient registration breaks these terms; handover is not treatment." }, { id: "craft-kerr-terms", kind: "fact", text: kind === "self" ? "Kerr accepted a self-funded private collection. No security or fare reimbursement was offered." : `Kerr accepted ${kind === "cash" ? "twenty real creds" : "the actual signal baffle"} as security for a private observed handover. He will return it and reimburse ten creds only for an actually paid coin-lift entry when that handover is recorded without a recipient trace. A breach or unfinished journey after the week loses the security; mutual cancellation before departure returns it. Fare still has to be paid at departure.` }] };
}
function attempted(s: GameState, effect: Effect, scope: "issuer" | "movement"): Effect {
  return { ...effect, flags: [...(effect.flags ?? []), "craft_archive_attempted"], journal: [...(effect.journal ?? []), { id: "craft-archive-request", kind: "fact", text: `You submitted a scoped ${scope === "issuer" ? "cancellation-key test" : "worker-movement extraction request"} after comparing the export and catalog summaries. The request itself supplied no source, authenticated key, worker list or public permission.` }] };
}
const apply = (spec: Choice["effects"], s: GameState) => typeof spec === "function" ? spec(s) : spec ?? {};
function craftReader(source: Choice): Choice {
  return { ...source, id: `craft-${source.id}`, ...(source.id === "isolate-key" ? { maxStrain: 4 } : {}), ...(source.check ? { successEffects: s => attempted(s, apply(source.successEffects, s), "issuer"), failEffects: s => attempted(s, apply(source.failEffects, s), "issuer") } : { effects: s => attempted(s, apply(source.effects, s), "issuer") }) };
}
export function craftExtraction(mode: "paid" | "badge" | "face"): Effect {
  return { ...(mode === "paid" ? { creds: -25 } : {}), factions: { helion: mode === "badge" ? 2 : 1 }, flags: ["archive_done", "order_verified", "archive_flagged", ...(mode === "badge" ? ["old_badge_traced"] : []), ...(mode === "face" ? ["archive_method_face"] : [])], journal: [{ id: "verified-order", kind: "fact", text: `A targeted staffed WN/SHIFT/REV extraction corroborated cancellation of the evacuation while coolant work remained scheduled. ${mode === "paid" ? "The logged search cost twenty-five creds." : mode === "badge" ? "The logged search was billed to the runner's old employee number, adding its badge trace." : "Edda agreed to countersign this bounded movement extraction; her employer can identify the signed shift."} No issuing key was authenticated and no worker list or public source-name permission was supplied.` }] };
}
export function encounterCraftChoices(s: GameState, scene: Scene, choices: Choice[], scenes: Record<string, Scene>): Choice[] {
  if (!s.flags.encounter_craft_enabled) return scene.id.includes("_craft_") ? [{ id: "craft-unavailable-exit", label: "Return without making a request.", next: s.flags.act2_done ? "act3_arrival" : "act2_middle" }] : choices;
  if (scene.id === "act2_craft_kerr_offer" && (s.flags.craft_kerr_agreed || s.flags.kerr_route_promised || s.flags.kerr_route_declined || s.flags.kerr_route_done || s.flags.act2_done)) return [{ id: "craft-offer-closed", label: "Keep the recorded terms. Return without a new offer.", next: s.flags.act2_done ? "act3_arrival" : "act2_middle" }];
  let result = choices.filter(c => c.id !== "craft-archive-question" || craftArchiveReady(s));
  if (s.flags.craft_kerr_agreed && scene.id === "act2_kerr_collection_terms") result = [...result.filter(c => !["promise-private-collection", "agree-registered-collection", "decline-kerr-collection", "craft-kerr-bargain"].includes(c.id)), { id: "craft-keep-terms", label: "Keep the agreed terms and return to the canal.", next: "act2_middle" }];
  result = result.filter(c => c.id !== "craft-settle-kerr" || Boolean(craftSettlement(s)));
  if (scene.id.startsWith("act2_craft_archive")) {
    if (!craftArchiveReady(s)) return [{ id: "craft-unavailable-exit", label: "Return without making a request.", next: "act2_middle" }];
    if (scene.id === "act2_craft_archive") result = result.filter(c => !c.id.startsWith("craft-question-") || craftInspected(s));
    if (scene.id === "act2_craft_archive_issuer") {
      if (!craftInspected(s) || craftScope(s) !== "issuer") return [{ id: "craft-review-draft", label: "Review the question and its sources.", next: "act2_craft_archive" }];
      if (s.flags.craft_issuer_targeted) result = [...result, ...scenes.act2_archive_door.choices.filter(c => ["trace-receipt", "isolate-key"].includes(c.id)).map(craftReader)];
    }
    if (scene.id === "act2_craft_archive_ledger") {
      if (!craftInspected(s) || craftScope(s) !== "movement") return [{ id: "craft-review-draft", label: "Review the question and its sources.", next: "act2_craft_archive" }];
      result = result.map(c => c.id.startsWith("craft-extract-") ? { ...c, effects: state => attempted(state, apply(c.effects, state), "movement") } : c);
    }
  }
  if (["act2_craft_kerr_settlement", "act3_craft_kerr_settlement"].includes(scene.id) && !craftSettlement(s)) return [{ id: "craft-unavailable-exit", label: "Return without settling an unsupported claim.", next: s.flags.act2_done ? "act3_kerr_collection" : "act2_middle" }];
  return result;
}
