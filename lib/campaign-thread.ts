import { CASE_CLAIMS, reviewCase } from "./case-file";
import { districtActorKnowledge, districtStatus } from "./district-response";
import { techniqueStatus } from "./build-techniques";
import { sourceReadiness } from "./source-ledger";
import { finaleScene } from "./finale-direction";
import type { GameState } from "./types";

export type CampaignThreadRow = { id: string; title: string; decision: string; consequence: string; limit: string; people?: ReturnType<typeof districtActorKnowledge> };
export const THREAD_CHECKPOINTS = ["card_week", "act2_middle", "card_wall", "act3_neighborhood", "act3_arrival"] as const;
export function hasCampaignThread(sceneId: string) {
  return (THREAD_CHECKPOINTS as readonly string[]).includes(sceneId) || Boolean(finaleScene(sceneId));
}

/** Read the current acquired record; never infer evidence from a draft or a relationship score. */
export function campaignThread(state: GameState): CampaignThreadRow[] {
  const f = state.flags, rows: CampaignThreadRow[] = [];
  const source = sourceReadiness(state);
  const record = (id: string) => state.journal.some(entry => entry.id === id);
  if (f.memory_prepared || record("memory-order") || f.heard_memo) rows.push({
    id: "account", title: "The hour → your account",
    decision: f.memory_intact ? "You kept the complete archive." : f.memory_redacted ? "You withheld worker locations from the packet." : f.memory_witness ? "You chose the witness chain." : f.memory_prepared ? "You prepared an account of the hour." : "You heard Mara's recorded confession.",
    consequence: source.cancellation,
    limit: "Mara's authorization, the later cancellation and the issuing key are separate claims. A protected roster alone did not move Nia.",
  });
  if (state.caseFile) {
    const review = reviewCase(state), history = state.caseFile.history;
    rows.push({ id: "case", title: "Your case → the next question",
      decision: `Claim under review: ${CASE_CLAIMS[state.caseFile.claim]}`,
      consequence: state.caseFile.reviewed ? `Current source test: ${review.verdict}. ${review.feedback}` : "This draft has not been tested since its last edit. It supplies no tested-case route.",
      limit: `${history.length ? `Saved reviews: ${history.map(entry => entry.verdict).join(" → ")}. Earlier tests keep their original verdicts; the current test uses sources held now. ` : ""}Testing an account grants no source, authentication or permission.`,
    });
  }
  if (state.archivePlan) {
    const p = state.archivePlan;
    const setup = p.position ? {
      priority: "You signed a priority reader request.",
      preflight: "The preflight cost one strain.",
      window: "Preparing the service interval cost one strain.",
      registered: "Registered sleeve access cost fifteen creds.",
      existing: "You used existing preparation or training without an extra setup cost.",
    }[p.position] : "No setup cost is recorded for this plan.";
    const stages = { planned: "Setup has not been committed.", positioned: "Setup was committed; the retrieval is still open.", failed: "The attempt failed; staffed recovery remains subject to its actual terms.", retrieved: "A source was retrieved through the archive operation.", withdrawn: "The search was closed with its gap unresolved.", abandoned: "The plan was set aside; any committed costs remain spent." };
    rows.push({ id: "plan", title: "Preparation → archive execution",
      decision: `${p.approach === "reader" ? "Reader match" : "Carbon retrieval"} · ${p.objective === "authenticate" ? "seek key authentication" : "seek corroboration"} · ${p.contingency === "staffed" ? "staffed recovery" : "withdraw after failure"}.`,
      consequence: p.stage === "failed" && f.act2_done ? "The week closed after the failed attempt. The paused request supplied no retrieved source or reopened recovery." : stages[p.stage],
      limit: `${setup} Committed costs are not refunded. ${source.cancellation}. A chosen objective is not a result; a carbon or recovery ledger does not authenticate the key.`,
    });
  }
  if (f.district_started || f.district_query_sent) {
    const people = districtActorKnowledge(state);
    rows.push({ id: "district", title: "Disclosure → the depot response",
      decision: people[0].told,
      consequence: districtStatus(state),
      limit: `Kerr: ${people[1].told} ${people[1].response} No request settles Edda's inquiry or restores her shift.`,
      people,
    });
  }
  if (f.technique_started) rows.push({ id: "build", title: "Your build → the filing procedure",
    decision: "You committed an earned specialist method rather than the ordinary courier route.",
    consequence: techniqueStatus(state),
    limit: "An intake reference confirms receipt for review. It does not approve the correction, authenticate a key or authorize a witness quote.",
  });
  if (f.witness_briefed || f.witness_safe || f.witness_lost || record("nia-account")) rows.push({
    id: "witness", title: "Nia's terms → what you can publish",
    decision: f.witness_lost ? f.witness_relocated ? "You arranged a second private room; the first location remains exposed." : "The transfer exposed her location to Helion." : f.witness_safe ? "The transfer reached a room outside Helion's tenancy register." : "You heard the transfer terms; no completed move is recorded.",
    consequence: source.quotation,
    limit: `${f.witness_deferred && !record("nia-account") ? "You deferred the recording. " : ""}${f.act2_done && !record("nia-account") ? "The week closed without an approved account. " : ""}Safety, approval to record and public quotation are separate decisions.`,
  });
  if (f.testimony_done || f.testimony_published || f.testimony_withdrawn) rows.push({
    id: "hearing", title: "The hearing → the public record",
    decision: f.testimony_published ? "You filed a public account." : f.testimony_withdrawn ? "You withdrew the hearing draft." : "The hearing work closed without a filed public account.",
    consequence: f.testimony_published ? "Sera retains the filed account with its source limits." : "The memorial decision does not publish the hearing draft.",
    limit: `${f.testimony_corrected ? "The unsupported claim and its correction remain attached. " : ""}Speaking memorial names grants no new evidence or quotation permission.`,
  });
  return rows;
}

/** Links only focus already-visible canonical decisions. They do not resolve a choice. */
export function campaignThreadLeads(choices: readonly { id: string; label: string; enabled: boolean }[]) {
  const ids = new Set(["open-district-response", "visit-district-return", "visit-records", "visit-nia", "visit-edda", "return-edda-payroll", "prepare-public-account", "protect-witness", "return-witness", "repair-location", "trace-order", "resume-archive-recovery"]);
  return choices.filter(choice => choice.enabled && ids.has(choice.id)).map(({ id, label }) => ({ id, label }));
}
