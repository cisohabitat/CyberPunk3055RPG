import { effectPreview, getScene, presentChoices } from "./engine";
import { objectives } from "./objectives";
import type { GameState } from "./types";

// Advice follows visible canonical choices; it grants no new action authority.
export function commitmentActions(state: GameState) {
  if (state.pendingCheck || getScene(state.sceneId).finale) return [];
  const rows = objectives(state);
  const ids = new Set<string>();
  for (const row of rows) {
    if (row.id === "notice" && row.status === "Open") {
      for (const id of ["help-clinic-notice", "accept-notice", "plan-notice", "compare-notice-allocation", "offer-notice-clinic-contact", "accept-notice-standard", "accept-notice-extra-trip", "fund-notice-extra-carrier", "revise-notice-allocation", "resume-notice-allocation-receipt", "record-private-notice", "record-public-notice"]) ids.add(id);
    }
    if (row.id === "notice-followup" && row.status === "Open") {
      for (const id of ["visit-notice", "record-private-reply", "record-public-reply", "record-unresolved-reply", "repair-public-window"]) ids.add(id);
    }
    if (row.id === "witness" && row.status !== "Complete" && row.status !== "Unresolved") {
      for (const id of ["protect-witness", "return-witness", "repair-location", "review-account", "file-account"]) ids.add(id);
    }
    if (row.id === "coolant" && row.status === "Open") {
      for (const id of ["help-clinic-pump", "fund-cold-transfer", "carry-cold-transfer", "leave-cold-transfer", "keep-pump-local", "file-pump-rebate"]) ids.add(id);
    }
    if (row.id === "witness-shift" && row.status === "Open") ids.add("work-witness-shift");
    if (row.id === "chapel-shift" && row.status === "Open") ids.add("work-chapel-shift");
  }
  if (!state.flags.act2_done && rows.some(r => r.status === "Open") && state.strain > 0) ids.add("take-recovery");
  return presentChoices(state, getScene(state.sceneId)).filter(c => ids.has(c.id)).map(c => ({
    id: c.id, label: c.label, enabled: c.enabled,
    detail: [c.disabledReason, c.detail, ...effectPreview(state, c)].filter(Boolean).join(" · "),
  }));
}

export function clinicWitnessBudget(state: GameState): string | undefined {
  if (state.sceneId !== "act2_middle" || state.flags.act2_done || state.flags.witness_done || !(state.flags.memory_witness || state.flags.memory_redacted)) return;
  const choices = presentChoices(state, getScene(state.sceneId));
  if (!choices.some(c => c.id === "help-clinic-pump" && c.enabled)) return;
  const room = getScene("act2_witness_door").choices.find(c => c.id === "pay-room")!.requireCreds!;
  const courier = getScene("act2_pump_triage").choices.find(c => c.id === "fund-cold-transfer")!.requireCreds!;
  return `Care budget: a private witness room costs ${room} creds. If the coolant repair fails, its cold-storage courier costs ${courier}; carrying the medicines instead adds up to 2 Strain. These are separate jobs. ${state.creds < room + courier ? "Your current cash cannot cover both paid fallbacks." : "Your current cash covers both paid fallbacks, before other spending."} Preparation, earned alternatives and Nia’s approval still matter.`;
}
