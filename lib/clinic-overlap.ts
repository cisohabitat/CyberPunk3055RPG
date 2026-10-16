// Offline source-aware QA. Never import into the application.
import { ORIGINS, STATS } from "./character";
import { playEconomyCampaign, type ClinicSchedule, type EconomyCase } from "./campaign-economy";

export const OVERLAP_CONFIG = { version: 1, seeds: 25, maxSteps: 180 };
export type OverlapCase = EconomyCase & ClinicSchedule;
export function clinicOverlapCases(): OverlapCase[] {
  const cases: OverlapCase[] = [];
  for (const origin of Object.keys(ORIGINS) as EconomyCase["origin"][]) for (const stat of STATS)
    for (const complication of ["debt", "optic", "on-file"] as const) for (const spending of ["care-first", "kit-first"] as const)
      for (const order of ["clinic-first", "witness-first"] as const) for (const recovery of ["early", "late"] as const)
        for (const transport of ["trained", "volunteer"] as const)
          cases.push({ origin, stat, complication, goal: "witness", income: "no-sale", spending, order, recovery, transport });
  return cases;
}
export const overlapId = (s: OverlapCase) => `${s.origin}/${s.stat}/${s.complication}/${s.spending}/${s.order}/${s.recovery}/${s.transport}`;
export function playClinicOverlap(spec: OverlapCase, seed: number) {
  return playEconomyCampaign(spec, seed, OVERLAP_CONFIG.maxSteps, spec);
}
export function clinicOverlapReport(seeds = OVERLAP_CONFIG.seeds) {
  if (!Number.isInteger(seeds) || seeds < 1) throw new Error("Invalid overlap sample size");
  const failures: { id: string; seed: number; error: string }[] = [], covered = new Set<string>();
  const rows = clinicOverlapCases().map(spec => {
    const row = { ...spec, id: overlapId(spec), runs: seeds, completed: 0, bothStarted: 0, jointGoal: 0, missingPacket: 0,
      witnessGoal: 0, clinicGoal: 0, restored: 0, courier: 0, carried: 0, deferred: 0, volunteerWork: 0, openWork: 0,
      exposed: 0, broke: 0, highStrain: 0, clinicHighStrain: 0, witnessHighStrain: 0,
      finalCreds: 0, finalStrain: 0, cashEarned: 0, cashSpent: 0, recovered: 0, kits: 0 };
    for (let seed = 1; seed <= seeds; seed++) {
      try {
        const run = playClinicOverlap(spec, seed), s = run.state;
        const initialCash = Math.max(0, ORIGINS[spec.origin].creds - (spec.complication === "debt" ? 40 : 0));
        if (s.creds !== initialCash + run.cashEarned - run.cashSpent) throw new Error("Cash not conserved");
        if (s.flags.nia_public_consent || s.flags.testimony_published || s.flags.archive_key_authenticated) throw new Error("Side work invented permission or authentication");
        if (run.steps.filter(step => ["isolate-pump", "brace-pump", "dispatch-pump", "route-pump"].includes(step.choiceId)).length > 1) throw new Error("Repeated pump attempt");
        const clinicGoal = Boolean(s.flags.pump_done && (s.flags.pump_restored || s.flags.pump_supplies_saved));
        row.completed++; row.bothStarted += Number(Boolean(run.mission && run.clinicEntry));
        row.jointGoal += Number(run.goalMet && clinicGoal); row.witnessGoal += Number(run.goalMet); row.clinicGoal += Number(clinicGoal);
        row.missingPacket += Number(!s.flags.memory_prepared);
        row.restored += Number(Boolean(s.flags.pump_restored)); row.courier += Number(Boolean(s.flags.pump_courier)); row.carried += Number(Boolean(s.flags.pump_carried));
        row.deferred += Number(run.steps.some(step => step.choiceId === "defer-account"));
        row.volunteerWork += Number(Boolean(s.flags.witness_shift_owed));
        row.openWork += Number(Boolean(s.flags.witness_shift_owed && !s.flags.witness_shift_kept || s.flags.chapel_shift_owed && !s.flags.chapel_shift_kept));
        row.exposed += Number(Boolean(s.flags.witness_lost)); row.broke += Number(run.everBroke); row.highStrain += Number(run.maxStrain >= 4);
        row.clinicHighStrain += Number((run.clinicEntry?.strain ?? 0) >= 4); row.witnessHighStrain += Number((run.mission?.strain ?? 0) >= 4);
        row.finalCreds += s.creds; row.finalStrain += s.strain; row.cashEarned += run.cashEarned; row.cashSpent += run.cashSpent;
        row.recovered += Number(Boolean(s.flags.week_recovered)); row.kits += Number(run.kitBought);
        for (const scene of run.scenes) covered.add(scene);
      } catch (error) { failures.push({ id: row.id, seed, error: String(error) }); }
    }
    return row;
  });
  return { schema: 1, config: { ...OVERLAP_CONFIG, seeds }, scope: "Natural-dice no-sale witness + coolant campaigns; paired seeds across 576 source-aware policy/build cells. Witness-first defers recording until after clinic work. Local repair receipt; courier only while preserving an outstanding room reserve, otherwise carry. Early rest at Strain >=3; late rest after work. No injected resources. Not independent players or exhaustive mission combinations.", rows, coveredScenes: [...covered].sort(), failures };
}
export type OverlapReport = ReturnType<typeof clinicOverlapReport>;
export function validateOverlapReport(report: OverlapReport) {
  if (report.schema !== 1 || report.config?.version !== 1 || report.config.maxSteps !== 180 || !Number.isInteger(report.config.seeds) || report.config.seeds < 1) throw new Error("Invalid overlap configuration");
  const expected = new Set(clinicOverlapCases().map(overlapId)), seen = new Set<string>();
  if (!Array.isArray(report.rows) || report.rows.length !== expected.size || !Array.isArray(report.failures) || !Array.isArray(report.coveredScenes) || !report.coveredScenes.length) throw new Error("Incomplete overlap evidence");
  for (const r of report.rows) {
    if (!expected.has(r.id) || r.id !== overlapId(r) || seen.has(r.id) || r.goal !== "witness" || r.income !== "no-sale") throw new Error("Invalid or duplicate overlap cell");
    seen.add(r.id);
    const totals = new Set(["finalCreds", "finalStrain", "cashEarned", "cashSpent"]);
    for (const key of ["runs", "completed", "bothStarted", "jointGoal", "missingPacket", "witnessGoal", "clinicGoal", "restored", "courier", "carried", "deferred", "volunteerWork", "openWork", "exposed", "broke", "highStrain", "clinicHighStrain", "witnessHighStrain", "finalCreds", "finalStrain", "cashEarned", "cashSpent", "recovered", "kits"] as const) {
      const n = r[key];
      if (!Number.isInteger(n) || n < 0 || (!totals.has(key) && n > report.config.seeds)) throw new Error(`Invalid overlap count ${r.id}/${key}`);
    }
    if (r.runs !== report.config.seeds || r.completed !== r.runs || r.jointGoal > r.bothStarted || r.jointGoal > r.witnessGoal || r.jointGoal > r.clinicGoal || r.restored + r.courier + r.carried !== r.clinicGoal || r.finalStrain > 5 * r.completed) throw new Error("Inconsistent overlap outcomes");
  }
  if (report.failures.length) throw new Error(`Overlap campaigns failed: ${JSON.stringify(report.failures[0])}`);
}
export function clinicOverlapSummary(report: OverlapReport) {
  const lines = ["# Witness and clinic overlap", "", report.scope, "", `${report.rows.length * report.config.seeds} campaigns; ${report.coveredScenes.length} sampled scenes; ${report.failures.length} failures.`, "", "| Order | Recovery | Transport | Runs | Both started | Both goals | Work owed | Open work | Mean final cash | Mean final Strain |", "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"];
  for (const order of ["clinic-first", "witness-first"]) for (const recovery of ["early", "late"]) for (const transport of ["trained", "volunteer"]) {
    const rows = report.rows.filter(r => r.order === order && r.recovery === recovery && r.transport === transport);
    const sum = (key: "runs" | "bothStarted" | "jointGoal" | "volunteerWork" | "openWork" | "finalCreds" | "finalStrain") => rows.reduce((n, r) => n + r[key], 0), n = sum("runs");
    lines.push(`| ${order} | ${recovery} | ${transport} | ${n} | ${sum("bothStarted")} | ${sum("jointGoal")} | ${sum("volunteerWork")} | ${sum("openWork")} | ${(sum("finalCreds") / n).toFixed(2)} | ${(sum("finalStrain") / n).toFixed(2)} |`);
  }
  return lines.join("\n") + "\n\nPer-cell counts, clinic repair versus transfer, high-pressure entry, cash and source non-starts remain in the paired JSON. Zero unfinished work here describes a policy that explicitly returns to keep it.\n";
}
