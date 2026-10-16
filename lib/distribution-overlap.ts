// Offline extension of the legally played witness/clinic campaign audit.
import { ORIGINS } from "./character";
import { playEconomyCampaign } from "./campaign-economy";
import { clinicOverlapCases } from "./clinic-overlap";

export const DISTRIBUTION_SEEDS = 20;
export function distributionCases() {
  return clinicOverlapCases().filter(s => s.transport === "trained").flatMap(s =>
    (["standard", "carry", "carrier"] as const).flatMap(distribution =>
      (s.order === "clinic-first" ? [false, true] : [false]).map(interleave => ({ ...s, distribution, interleave }))));
}
export type DistributionCase = ReturnType<typeof distributionCases>[number];
export const distributionId = (s: DistributionCase) => `${s.origin}/${s.stat}/${s.complication}/${s.spending}/${s.interleave ? "interleaved" : s.order}/${s.recovery}/${s.distribution}`;
export function playDistribution(spec: DistributionCase, seed: number) {
  return playEconomyCampaign(spec, seed, 180, spec);
}
export function distributionReport(seeds = DISTRIBUTION_SEEDS) {
  if (!Number.isInteger(seeds) || seeds < 1) throw new Error("Invalid distribution sample size");
  const failures: { id: string; seed: number; error: string }[] = [], scenes = new Set<string>();
  const rows = distributionCases().map(spec => {
    const r = { ...spec, id: distributionId(spec), runs: seeds, completed: 0, started: 0, jointGoal: 0, missingPacket: 0,
      paused: 0, paid: 0, carried: 0, standard: 0, carrierUnavailable: 0, acknowledged: 0, exposed: 0,
      highStrain: 0, broke: 0, finalCreds: 0, finalStrain: 0, cashSpent: 0, openWork: 0 };
    for (let seed = 1; seed <= seeds; seed++) try {
      const run = playDistribution(spec, seed), s = run.state;
      const initialCash = Math.max(0, ORIGINS[spec.origin].creds - (spec.complication === "debt" ? 40 : 0));
      if (s.creds !== initialCash + run.cashEarned - run.cashSpent) throw new Error("Distribution cash not conserved");
      if (s.flags.nia_public_consent || s.flags.testimony_published || s.flags.archive_key_authenticated) throw new Error("Distribution invented permission/authentication");
      const started = Boolean(run.clinicEntry && run.mission);
      if (started && (!s.flags.notice_allocation_committed || !s.flags.notice_done || !s.flags.notice_receipt_observed)) throw new Error("Started distribution was not accepted/recorded/followed up");
      const acceptance = run.steps.filter(step => ["accept-notice-standard", "accept-notice-extra-trip", "fund-notice-extra-carrier"].includes(step.choiceId));
      if (acceptance.length !== Number(started) || run.steps.filter(step => step.choiceId === "pause-notice-allocation").length !== Number(started)) throw new Error("Missing pause or repeated distribution fee/work");
      r.completed++; r.started += Number(started); r.jointGoal += Number(started && run.goalMet); r.missingPacket += Number(!s.flags.memory_prepared);
      r.paused += Number(started); r.paid += Number(Boolean(s.flags.notice_allocation_paid)); r.carried += Number(Boolean(s.flags.notice_allocation_carry)); r.standard += Number(Boolean(s.flags.notice_allocation_standard));
      r.carrierUnavailable += Number(spec.distribution === "carrier" && Boolean(s.flags.notice_allocation_carry));
      r.acknowledged += Number(Boolean(s.flags.notice_receipt_observed)); r.exposed += Number(Boolean(s.flags.witness_lost));
      r.highStrain += Number(run.maxStrain >= 4); r.broke += Number(run.everBroke); r.finalCreds += s.creds; r.finalStrain += s.strain; r.cashSpent += run.cashSpent;
      r.openWork += Number(Boolean(s.flags.chapel_shift_owed && !s.flags.chapel_shift_kept));
      run.scenes.forEach(id => scenes.add(id));
    } catch (error) { failures.push({ id: r.id, seed, error: String(error) }); }
    return r;
  });
  return { schema: 1, seeds, scope: "Natural no-sale campaigns, 1296 paired source-aware build/spending/sequence/recovery/channel cells. Dispatch-first, witness-first or pause-draft/witness/resume interleaving. Each saves a draft before acceptance, pays/carries once, then observes two actual card acknowledgements at Ward Nine. No attendance or public quotation inferred. Not independent players or exhaustive legal play.", rows, coveredScenes: [...scenes].sort(), failures };
}
export type DistributionReport = ReturnType<typeof distributionReport>;
export function validateDistribution(report: DistributionReport) {
  const expected = new Set(distributionCases().map(distributionId)), seen = new Set<string>();
  if (report.schema !== 1 || !Number.isInteger(report.seeds) || report.seeds < 1 || !Array.isArray(report.rows) || report.rows.length !== expected.size || !Array.isArray(report.failures) || report.failures.length || !Array.isArray(report.coveredScenes) || !report.coveredScenes.length) throw new Error("Incomplete/failed distribution evidence");
  for (const r of report.rows) {
    if (!expected.has(r.id) || r.id !== distributionId(r) || seen.has(r.id) || r.goal !== "witness" || r.income !== "no-sale" || r.transport !== "trained") throw new Error("Invalid distribution cell");
    seen.add(r.id);
    for (const key of ["runs", "completed", "started", "jointGoal", "missingPacket", "paused", "paid", "carried", "standard", "carrierUnavailable", "acknowledged", "exposed", "highStrain", "broke", "finalCreds", "finalStrain", "cashSpent", "openWork"] as const) {
      if (!Number.isInteger(r[key]) || r[key] < 0 || (!["finalCreds", "finalStrain", "cashSpent"].includes(key) && r[key] > report.seeds)) throw new Error(`Invalid distribution count: ${r.id}/${key}`);
    }
    if (r.runs !== report.seeds || r.completed !== r.runs || r.jointGoal > r.started || r.started !== r.paused || r.started !== r.acknowledged || r.standard + r.paid + r.carried !== r.started || r.finalStrain > r.completed * 5 || r.carrierUnavailable > r.carried) throw new Error("Inconsistent distribution evidence");
  }
}
export function distributionSummary(report: DistributionReport) {
  const lines = ["# Distribution and witness overlap", "", report.scope, "", `${report.rows.length * report.seeds} campaigns; ${report.coveredScenes.length} sampled scenes; ${report.failures.length} failures.`, "", "| Order | Channel preference | Runs | Both started | Both goals | Paid carriers | Carry fallback | Mean cash | Mean Strain |", "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"];
  for (const order of ["clinic-first", "witness-first", "interleaved"]) for (const distribution of ["standard", "carry", "carrier"]) {
    const rows = report.rows.filter(r => (r.interleave ? "interleaved" : r.order) === order && r.distribution === distribution);
    const sum = (k: "runs" | "started" | "jointGoal" | "paid" | "carrierUnavailable" | "finalCreds" | "finalStrain") => rows.reduce((n, r) => n + r[k], 0), n = sum("runs");
    lines.push(`| ${order} | ${distribution} | ${n} | ${sum("started")} | ${sum("jointGoal")} | ${sum("paid")} | ${sum("carrierUnavailable")} | ${(sum("finalCreds") / n).toFixed(2)} | ${(sum("finalStrain") / n).toFixed(2)} |`);
  }
  return lines.join("\n") + "\n\nEach JSON cell retains origin, specialization, complication, spending and recovery timing. Acknowledged card receipt does not establish appointment attendance.\n";
}
