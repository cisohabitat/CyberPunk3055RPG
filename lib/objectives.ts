import { actName } from "./story/goal";
import type { GameState } from "./types";

export type Objective = { id: string; title: string; status: "Open" | "Complete" | "Compromised" | "Unresolved"; detail: string };

export function objectives(state: GameState): Objective[] {
  const rows: Objective[] = [];
  const atWall = actName(state) === "The Wall";
  const account = state.journal.some((entry) => entry.id === "nia-account");
  if (state.flags.memory_witness || state.flags.memory_redacted) {
    rows.push({
      id: "witness", title: "Protect Nia Pell",
      status: state.flags.witness_lost ? "Compromised" : state.flags.witness_safe && account ? "Complete" : atWall ? "Unresolved" : "Open",
      detail: state.flags.witness_lost ? account ? "Her account corroborates the order, but her clinic location is on Helion's register." : "Her clinic location is on Helion's register. Her account can still be preserved."
        : state.flags.witness_safe ? account ? "Her account is recorded without publishing her home." : atWall ? "Nia reached a safe room, but her account was not attached before the week ended." : "Nia has a safe room. Attach her account before moving on."
        : actName(state) === "The Hour" ? "During The Week, find a safe transfer through the clinic. The private roster alone does not move her."
        : atWall ? "The week ended without a protected account. Her location remains private; her route remains unresolved."
        : "After answering a district call, finish the promise at the dry canal. A shelter, passenger route, favor, or thirty creds can secure a room.",
    });
  }
  if (state.flags.memory_intact) {
    rows.push({ id: "archive", title: "Authenticate the counter-order",
      status: state.flags.order_verified ? "Complete" : state.flags.archive_unresolved || atWall ? "Unresolved" : "Open",
      detail: state.flags.order_verified ? "An independent source corroborates the canceled evacuation."
        : state.flags.archive_unresolved ? "The issuing key remains unverified. The gap is recorded, not repaired."
        : actName(state) === "The Hour" ? "During The Week, compare the exported receipt with an independent tower record."
        : atWall ? "The archive survived, but its issuing key was not independently verified."
        : "After answering a district call, trace the issuing key from the dry canal. A failed query still leaves a ledger route.",
    });
  }
  return rows;
}

export function unresolvedPromises(state: GameState): Objective[] {
  return objectives(state).filter((row) => row.status === "Open" || row.status === "Unresolved");
}

export function nextStep(state: GameState): string {
  if (state.pendingCheck) return "Finish the recorded roll. Its outcome is already saved.";
  if (state.sceneId === "memory_table") {
    const count = ["memory_signature", "memory_order", "memory_roster"].filter((flag) => state.flags[flag]).length;
    return count < 3 ? `Inspect the remaining ${3 - count} ${3 - count === 1 ? "fragment" : "fragments"}, then decide which record leaves the chapel.` : "Choose an archive, a redacted roster, or a witness chain. Each opens a different responsibility next week.";
  }
  if (state.sceneId === "act2_witness_checkpoint") return "Recover the transfer at this checkpoint. A registered room provides care but exposes Nia's location.";
  if (state.sceneId === "act2_witness_safe") return "Attach Nia's account. A safe room and a recorded witness are separate steps.";
  if (state.sceneId === "act2_archive_gap") return "Corroborate the receipt through the ledger, or record the gap honestly.";
  if (state.sceneId === "act2_middle") {
    if (objectives(state).some((row) => row.status === "Open")) return "Your memory promise is still open. Finish it here before closing the week, or choose to leave it unresolved.";
    if (unresolvedPromises(state).length) return "The archive gap is recorded. Closing the week leaves that issuing key unverified.";
  }
  if (state.sceneId === "districts") return state.flags.act2_done ? "Ward Nine is the remaining call. Take your account to the wall." : "Answer a district call. Your old contact also offers an optional origin favor.";
  return "";
}
