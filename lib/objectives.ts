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
      detail: state.flags.witness_lost ? state.flags.witness_relocated ? "Her new room is private. The first location was exposed; that breach remains part of the account." : account ? "Her account corroborates the order, but her clinic location is on Helion's register." : "Her clinic location is on Helion's register. Her account can still be preserved."
        : state.flags.witness_safe ? account ? "Her account is recorded without publishing her home." : atWall ? "Nia reached a safe room, but her account was not attached before the week ended." : "Nia has a safe room. Attach her account before moving on."
        : actName(state) === "The Hour" ? "During The Week, find a safe transfer through the clinic. The private roster alone does not move her."
        : atWall ? "The week ended without a protected account. Her location remains private; her route remains unresolved."
        : "After answering a district call, agree Nia's terms and prepare a transfer. A shelter, passenger route, trained method, favor, or ninety creds can secure a room.",
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
    return count < 3 ? `Inspect the remaining ${3 - count} ${3 - count === 1 ? "fragment" : "fragments"}, then compare their decisions.` : state.flags.memory_prepared ? "Choose an archive, a redacted roster, or a witness chain. Each opens a different responsibility next week." : "Compare the signature and the later order, then label what the packet can prove.";
  }
  if (state.sceneId === "memory_reconstruction" || state.sceneId === "memory_challenge") return "Separate authorization, the later cancellation, and the questions neither source settles.";
  if (state.sceneId === "memory_publication") return "Label the account's certainty. Custody and witness safety are separate decisions.";
  if (state.sceneId === "act2_witness_brief") return "Agree what Nia authorizes before arranging the move.";
  if (state.sceneId === "act2_witness_plan") return "Choose one preparation. Your trained skill can unlock a different transfer method.";
  if (state.sceneId === "act2_witness_arrival") return "Nia has a safe room. Let her review the account, or return before the week closes.";
  if (state.sceneId === "act2_witness_repair") return "Protect a new location without erasing the earlier breach.";
  if (state.sceneId === "act2_public_response") return "Answer with a corroborating source, a correction, or an explicit unresolved question.";
  if (state.sceneId === "act3_testimony_review") return "Choose the scope your actual sources support. Public testimony supplies no new evidence.";
  if (["act3_testimony_consent", "act3_testimony_nia"].includes(state.sceneId)) return "Recording consent and public quotation consent are separate. A private account can remain private.";
  if (["act3_testimony_hearing", "act3_testimony_correction"].includes(state.sceneId)) return "Identify corroboration or key authentication precisely; preserve any correction beside the original claim.";
  if (state.sceneId === "act3_testimony_record") return "File or withdraw the draft, then return to the original ending choices.";
  if (state.sceneId === "act3_neighborhood") return "Visit the people and records changed by your week, or go directly to the wall.";
  if (state.sceneId === "act2_witness_checkpoint") return "Recover the transfer at this checkpoint. A registered room provides care but exposes Nia's location.";
  if (state.sceneId === "act2_witness_safe") return "Attach Nia's account. A safe room and a recorded witness are separate steps.";
  if (state.sceneId === "act2_archive_brief") return "Agree source access and publication limits before searching.";
  if (state.sceneId === "act2_archive_prep") return "Prepare one retrieval route. A failed probe leaves staffed recovery available.";
  if (["act2_archive_compare", "act2_archive_challenge"].includes(state.sceneId)) return "Distinguish a catalog, a corroborating ledger, and an authenticated issuing key.";
  if (state.sceneId === "act2_archive_custody") return "Choose public attribution. Withholding a name cannot erase an existing signed extraction.";
  if (state.sceneId === "act3_edda_visit") return "Hear the source’s employment consequences; support does not settle the review.";
  if (state.sceneId === "act2_archive_gap") return "Corroborate the receipt through the ledger, or record the gap honestly.";
  if (state.sceneId === "act2_middle") {
    if (objectives(state).some((row) => row.status === "Open")) return "Your memory promise is still open. Finish it here before closing the week, or choose to leave it unresolved.";
    if (unresolvedPromises(state).length) return "The archive gap is recorded. Closing the week leaves that issuing key unverified.";
  }
  if (state.sceneId === "districts") return state.flags.act2_done ? "Ward Nine is the remaining call. Take your account to the wall." : "Answer a district call. Your old contact also offers an optional origin favor.";
  return "";
}
