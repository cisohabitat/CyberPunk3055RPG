// Offline goal-driven play, with natural dice from creation through the finale.
import { ORIGINS, STATS } from "./character";
import { balanceRandom } from "./balance-audit";
import { commitChoice, createCharacter, getScene, presentChoices, previewCheck } from "./engine";
import { FIELD_KITS } from "./loadout";
import { missionDecision } from "./matched-balance";
import type { ComplicationId, GameState, OriginId, StatId } from "./types";
import type { ReplaySpec, ReplayStep } from "./story-replay";

export const ECONOMY_CONFIG = { version: 1, seeds: 100, maxSteps: 180 };
export const CAMPAIGN_GOALS = ["witness", "archive", "delivery"] as const;
export type EconomyCase = {
  origin: OriginId; stat: StatId; complication: ComplicationId;
  goal: typeof CAMPAIGN_GOALS[number]; income: "sale" | "no-sale"; spending: "care-first" | "kit-first";
};
const complications: ComplicationId[] = ["debt", "optic", "on-file"];
const caseId = (s: EconomyCase) => `${s.origin}/${s.stat}/${s.complication}/${s.goal}/${s.income}/${s.spending}`;
const reserveForGoal = (s: EconomyCase, state: GameState) => s.goal === "witness" ? state.items.includes("clinic-marker") ? 0 : 90 : s.goal === "archive" ? 25 : 10;

// Explicit additional QA policy. Omission retains the reviewed single-goal audit.
export type ClinicSchedule = {
  order: "clinic-first" | "witness-first";
  recovery: "early" | "late";
  transport: "trained" | "volunteer";
};
export function playEconomyCampaign(spec: EconomyCase, seed: number, maxSteps = ECONOMY_CONFIG.maxSteps, schedule?: ClinicSchedule) {
  if (schedule && spec.goal !== "witness") throw new Error("Clinic schedule requires the witness goal");
  if (!Number.isInteger(seed) || seed < 1) throw new Error("Invalid campaign seed");
  // Same origin/complication/seed stream across stats, goals and spending policies.
  // Branches can diverge; matching seed does not mean matching later encounters.
  const stratum = Object.keys(ORIGINS).indexOf(spec.origin) * complications.length + complications.indexOf(spec.complication);
  const dice = balanceRandom((seed + Math.imul(stratum, 0x85ebca6b)) >>> 0);
  const character = { handle: "Economy review", givenName: "Jo", origin: spec.origin, complication: spec.complication,
    bonus: { chrome: 0, nerve: 0, face: 0, ghost: 0, [spec.stat]: 2 }, startWithPrologue: true };
  let state = createCharacter(character), shopReviewed = false, enteredMiddle = false;
  let week: { creds: number; strain: number } | undefined, mission: { creds: number; strain: number } | undefined;
  let kitRequested = false, kitBought = false, kitUnaffordable = false, kitDeferred = false;
  let cashEarned = 0, cashSpent = 0, checks = 0, successes = 0, expectedSuccesses = 0, maxStrain = state.strain, everBroke = state.creds === 0;
  const steps: ReplayStep[] = [], scenes = new Set<string>(), blocked = new Set<string>();
  const opening: { choice: string; roll: number; success: boolean }[] = [];
  let clinicEntry: { creds: number; strain: number } | undefined;
  const kit = FIELD_KITS.find(k => k.stat === spec.stat)!;
  function choose(): string {
    const scene = getScene(state.sceneId), enabled = presentChoices(state, scene).filter(c => c.enabled);
    const ids = new Set(enabled.map(c => c.id));
    const pick = (...options: string[]) => {
      const id = options.find(id => ids.has(id));
      if (!id) throw new Error(`No supported choice at ${scene.id}: ${[...ids].join(",")}`);
      return id;
    };
    if (schedule) {
      if (scene.id === "act2_middle") {
        enteredMiddle = true;
        if (schedule.recovery === "early" && state.strain >= 3 && ids.has("take-recovery")) return "take-recovery";
        const clinic = () => { clinicEntry ??= { creds: state.creds, strain: state.strain }; return "help-clinic-pump"; };
        if (schedule.order === "clinic-first" && ids.has("help-clinic-pump")) return clinic();
        if (!mission && ids.has("protect-witness")) { mission = { creds: state.creds, strain: state.strain }; return "protect-witness"; }
        if (ids.has("help-clinic-pump")) return clinic();
        for (const work of ["work-witness-shift", "work-chapel-shift"]) if (ids.has(work)) return work;
        if (ids.has("return-witness")) return "return-witness";
        if (schedule.recovery === "late" && state.strain > 0 && ids.has("take-recovery")) return "take-recovery";
        // Do not let the single-goal early-rest policy override late/no-strain play.
        return "stand";
      }
      if (scene.id === "act2_pump_brief") return "work-pump";
      if (scene.id === "act2_pump_methods") return ({ chrome: "isolate-pump", nerve: "brace-pump", face: "dispatch-pump", ghost: "route-pump" })[spec.stat];
      if (scene.id === "act2_pump_triage") return state.creds >= 35 + (state.flags.witness_done ? 0 : reserveForGoal(spec, state)) ? "fund-cold-transfer" : "carry-cold-transfer";
      if (scene.id === "act2_pump_report") return "keep-pump-local";
      if (scene.id === "act2_witness_plan" && schedule.transport === "volunteer") return "arrange-escort";
      if (scene.id === "act2_witness_door" && schedule.transport === "volunteer" && state.flags.witness_escort) return "compare-witness-support";
      if (scene.id === "act2_witness_support" && schedule.transport === "volunteer" && state.flags.witness_escort) return "promise-volunteer-shift";
      if (scene.id === "act2_witness_arrival" && schedule.order === "witness-first" && !state.flags.pump_done) return "defer-account";
      if (scene.id === "act2_recovery") return pick("favor-recovery", ...(state.creds >= 45 + (state.flags.witness_done ? 0 : reserveForGoal(spec, state)) ? ["pay-recovery"] : []), "short-recovery");
    }
    switch (scene.id) {
      case "opening_city": return "begin-opening";
      case "opening_self": return "opening-survival";
      case "opening_approach": return "hear-stallholder";
      case "opening_neighbor": return "take-the-stool";
      case "stall": return state.flags.haggled || state.flags.haggle_failed ? "accept" : "ask-pay";
      case "pay": return "haggle";
      case "pay_yes": return "pocket";
      case "pay_no": return "sit-with-it";
      case "route":
        if (spec.stat === "nerve" && !state.flags.chapel_window_done) return "begin-chapel-window";
        if (spec.stat === "face" && !state.flags.chapel_method_committed && !state.flags.chapel_method_prepared) return "prepare-chapel-method";
        return spec.stat === "ghost" ? "hatch" : "side";
      case "chapel_methods": return pick("offer-chapel-service", "leave-chapel-methods");
      case "chapel_method_review": return pick("bargain-service-entry", "leave-prepared-entry");
      case "chapel_window_plan": return "window-force-hatch";
      case "chapel_window_exit": return pick("window-quiet-exit", "window-staffed-exit");
      case "chapel_window_expired": return "window-return-doors";
      case "side": return "spoof-door";
      case "hatch": return "slip-hatch";
      case "hatch_caught": return "bail";
      case "undercroft": return "go";
      case "lumen": return "honest";
      case "lumen_deal": return "pact-copy";
      case "vault_quiet": return "copy";
      case "memo": return "heard";
      case "mara_why": return "inspect-hour";
      case "memory_table":
        for (const fragment of ["signature", "order", "roster"]) if (!state.flags[`memory_${fragment}`]) return `inspect-${fragment}`;
        if (!state.flags.memory_prepared) return "reconstruct";
        return spec.goal === "archive" ? "seal-full" : "seal-witness";
      case "memory_reconstruction": return "separate-decisions";
      case "memory_publication": return "label-unverified";
      case "kerr": {
        const preference = spec.stat === "ghost" ? ["slip", "talk-leave", "fight"] : spec.stat === "nerve" ? ["fight", "talk-leave", "slip"] : ["talk-leave", "slip", "fight"];
        return enabled.filter(c => preference.includes(c.id)).toSorted((a, b) => previewCheck(state, b.check!).hits - previewCheck(state, a.check!).hits || preference.indexOf(a.id) - preference.indexOf(b.id))[0]?.id ?? pick("tell-truth");
      }
      case "kerr_fight": return pick("dose-clinch", "meet");
      case "after_kerr": return spec.income === "sale" ? pick("both", "sell", "deliver-ash", "walk") : pick("destroy", "ditch-ash", "walk");
      case "card_week": return "into-week";
      case "street_after":
        week ??= { creds: state.creds, strain: state.strain };
        return pick("practice", "read-board");
      case "act2_training": return `learn-${spec.stat}`;
      case "districts":
        if (state.flags.act2_done) return "to-ward-nine";
        if (!shopReviewed) { shopReviewed = true; return "visit-workshop"; }
        return pick("to-lumen", "to-kerr");
      case "act2_workshop": {
        kitRequested = true;
        const affordable = ids.has(`buy-${kit.id}`);
        const reserve = reserveForGoal(spec, state) + 45;
        kitUnaffordable = !affordable;
        if (affordable && (spec.spending === "kit-first" || state.creds - kit.price >= reserve)) { kitBought = true; return `buy-${kit.id}`; }
        kitDeferred = affordable;
        return "leave-workshop";
      }
      case "act2_lumen_door": return "hear-lumen";
      case "act2_lumen": return "walk-with-her";
      case "act2_kerr_door": return "hear-kerr";
      case "act2_kerr": return "refuse-kerr";
      case "act2_middle": {
        enteredMiddle = true;
        if (state.strain >= 3 && ids.has("take-recovery")) return "take-recovery";
        if (ids.has("work-depot-return-shift")) return "work-depot-return-shift";
        if (ids.has("work-chapel-shift")) return "work-chapel-shift";
        if (!mission) {
          const entry = spec.goal === "witness" ? "protect-witness" : spec.goal === "archive" ? "trace-order" : "answer-kerr-collection";
          if (ids.has(entry)) { mission = { creds: state.creds, strain: state.strain }; return entry; }
        }
        if (spec.goal === "witness" && state.flags.witness_lost && !state.flags.witness_relocated && ids.has("repair-location")) return "repair-location";
        return "stand";
      }
      case "act2_recovery": return pick("favor-recovery", ...(state.creds >= 45 + reserveForGoal(spec, state) ? ["pay-recovery"] : []), "short-recovery");
      case "act2_recovery_after": return "return-after-recovery";
      case "act2_witness_arrival": return "review-account";
      case "act2_witness_safe": return "file-account";
      case "act2_witness_repair": return pick("clinic-second-room", "fund-second-room", "leave-repair");
      case "act2_kerr_collection_terms": return "promise-private-collection";
      case "act2_route_map": return state.creds >= 10 ? "route-entry-lift" : "route-entry-stairs";
      case "act2_route_exit": return `route-exit-${spec.stat === "chrome" ? "ramp" : spec.stat === "nerve" ? "walk" : "gap"}`;
      case "act2_route_review": return pick("depart-kerr-lift", "depart-kerr-foot");
      case "act2_route_crossing": return "compare-trained-depot-methods";
      case "act2_depot_methods": return `begin-depot-${spec.stat}`;
      case "act2_depot_relay": return pick("depot-fit-buffer", "depot-disconnect-recipient");
      case "act2_depot_return": return "depot-preserve-return";
      case "act2_depot_outer_pass": return "depot-watch-cart";
      case "act2_depot_cart_pass": return "depot-wait-return";
      case "act2_depot_return_pass": return "depot-cross-return";
      case "act2_depot_carry": return pick("depot-rent-cradle", "depot-carry-direct");
      case "act2_depot_load": return "depot-carry-low";
      case "act2_depot_liability": return "depot-offer-own-liability";
      case "act2_depot_contract": return "depot-promise-return-shift";
      case "act2_route_receipt": return "record-kerr-receipt";
      case "act2_route_recovery": return "leave-kerr-case-held";
      case "card_wall": return "to-the-wall";
      case "act3_neighborhood": return "go-wall";
      case "ward_wall": return "face-sera";
      case "act3_arrival": return "read-names";
      default:
        if (scene.endingTitle && ids.has("week-after")) return "week-after";
        if (scene.endingTitle && ids.has("back-to-board")) return "back-to-board";
        if (/^act2_(witness|archive)_/.test(scene.id)) return missionDecision(state, spec).id;
        throw new Error(`Unsupported goal-policy scene ${scene.id}`);
    }
  }
  for (let step = 0; step < maxSteps; step++) {
    const scene = getScene(state.sceneId); scenes.add(scene.id);
    if (scene.finale) {
      const goalMet = spec.goal === "witness" ? Boolean(state.flags.witness_safe && !state.flags.witness_lost && state.journal.some(e => e.id === "nia-account"))
        : spec.goal === "archive" ? Boolean(state.flags.archive_done && state.flags.order_verified && !state.flags.archive_unresolved)
        : Boolean(state.flags.kerr_route_delivered && !state.flags.kerr_route_trace);
      return { state, steps, scenes: [...scenes], week, mission, clinicEntry, enteredMiddle, goalMet, kitRequested, kitBought, kitUnaffordable, kitDeferred,
        cashEarned, cashSpent, checks, successes, expectedSuccesses, maxStrain, everBroke, blocked: [...blocked], opening,
        replay: { name: `economy-${caseId(spec).replaceAll("/", "-")}-${seed}`, character, steps, expected: { sceneId: state.sceneId, creds: state.creds, strain: state.strain } } satisfies ReplaySpec };
    }
    for (const c of presentChoices(state, scene)) if (c.requireCreds !== undefined && state.creds < c.requireCreds) blocked.add(`${scene.id}/${c.id}`);
    const id = choose(), choice = presentChoices(state, scene).find(c => c.id === id && c.enabled);
    if (!choice) throw new Error(`${caseId(spec)} seed ${seed} step ${step}: unavailable ${state.sceneId}/${id}`);
    const roll = choice.check ? 1 + Math.floor(dice() * 10) : undefined;
    if (choice.check) expectedSuccesses += previewCheck(state, choice.check).hits / 10;
    const result = commitChoice(state, choice, roll === undefined ? undefined : { roll });
    if (result.check) { checks++; successes += Number(result.check.success); if (!week) opening.push({ choice: `${scene.id}/${choice.id}`, roll: roll!, success: result.check.success }); }
    cashEarned += Math.max(0, result.state.creds - state.creds); cashSpent += Math.max(0, state.creds - result.state.creds);
    state = result.state; steps.push({ choiceId: id, ...(roll === undefined ? {} : { roll }), reload: step % 5 === 0 || Boolean(choice.check) });
    if (!Number.isInteger(state.creds) || state.creds < 0 || state.strain < 0 || state.strain > 5) throw new Error("Invalid campaign resources");
    maxStrain = Math.max(maxStrain, state.strain); everBroke ||= state.creds === 0;
  }
  throw new Error(`${caseId(spec)} seed ${seed}: exceeded ${maxSteps} decisions at ${state.sceneId}`);
}

export function economyCampaignCases(): EconomyCase[] {
  const cases: EconomyCase[] = [];
  for (const origin of Object.keys(ORIGINS) as OriginId[]) for (const stat of STATS) for (const complication of complications) for (const goal of CAMPAIGN_GOALS) for (const income of ["sale", "no-sale"] as const) for (const spending of ["care-first", "kit-first"] as const) cases.push({ origin, stat, complication, goal, income, spending });
  return cases;
}

export function campaignEconomyReport(seeds = ECONOMY_CONFIG.seeds) {
  if (!Number.isInteger(seeds) || seeds < 1) throw new Error("Invalid economy sample size");
  const failures: { id: string; seed: number; error: string }[] = [], covered = new Set<string>();
  const rows = economyCampaignCases().map(spec => {
    const row = { ...spec, id: caseId(spec), runs: seeds, completed: 0, eligible: 0, goalMet: 0, missingPacket: 0, kitBought: 0, kitUnaffordable: 0, kitDeferred: 0,
      finalCreds: 0, finalStrain: 0, cashEarned: 0, cashSpent: 0, weekCreds: 0, weekStrain: 0, checks: 0, successes: 0, expectedSuccesses: 0,
      broke: 0, highStrain: 0, recovered: 0, exposedWitness: 0, relocatedWitness: 0, keyAuthenticated: 0, archiveFlagged: 0, openWork: 0,
      blockedOptions: {} as Record<string, number>, endings: {} as Record<string, number>, hourOutcomes: {} as Record<string, number> };
    for (let seed = 1; seed <= seeds; seed++) {
      try {
        const run = playEconomyCampaign(spec, seed), s = run.state;
        row.completed++; row.eligible += Number(Boolean(run.mission)); row.goalMet += Number(run.goalMet);
        row.missingPacket += Number(!run.mission && spec.goal !== "delivery" && !s.flags.memory_prepared);
        row.kitBought += Number(run.kitBought); row.kitUnaffordable += Number(run.kitUnaffordable); row.kitDeferred += Number(run.kitDeferred);
        row.finalCreds += s.creds; row.finalStrain += s.strain; row.cashEarned += run.cashEarned; row.cashSpent += run.cashSpent;
        row.weekCreds += run.week?.creds ?? 0; row.weekStrain += run.week?.strain ?? 0;
        row.checks += run.checks; row.successes += run.successes; row.expectedSuccesses += run.expectedSuccesses;
        row.broke += Number(run.everBroke); row.highStrain += Number(run.maxStrain >= 4); row.recovered += Number(Boolean(s.flags.week_recovered));
        row.exposedWitness += Number(Boolean(s.flags.witness_lost)); row.relocatedWitness += Number(Boolean(s.flags.witness_relocated));
        row.keyAuthenticated += Number(Boolean(s.flags.archive_key_authenticated)); row.archiveFlagged += Number(Boolean(s.flags.archive_flagged || s.flags.old_badge_traced));
        row.openWork += Number(Boolean(s.flags.depot_shift_owed && !s.flags.depot_shift_kept || s.flags.chapel_shift_owed && !s.flags.chapel_shift_kept));
        row.endings[s.sceneId] = (row.endings[s.sceneId] ?? 0) + 1;
        const hour = ["sold", "both", "burned", "smashed", "ash", "walk", "taken", "sainted"].find(id => s.flags[`act1_${id}`]) ?? "unclassified";
        row.hourOutcomes[hour] = (row.hourOutcomes[hour] ?? 0) + 1;
        for (const key of run.blocked) row.blockedOptions[key] = (row.blockedOptions[key] ?? 0) + 1;
        for (const scene of run.scenes) covered.add(scene);
      } catch (error) { failures.push({ id: row.id, seed, error: String(error) }); }
    }
    row.expectedSuccesses = Math.round(row.expectedSuccesses * 1e8) / 1e8;
    return row;
  });
  return { schema: 1, config: { ...ECONOMY_CONFIG, seeds }, scope: "Natural dice from prologue through finale; source-aware goal and spending policies; no injected resources or directed setup. Current UI complications only. Completion and chosen-goal success are separate.", rows, coveredScenes: [...covered].sort(), failures };
}

export type EconomyReport = ReturnType<typeof campaignEconomyReport>;
export function campaignEconomyIssues(current: EconomyReport, baseline: EconomyReport): string[] {
  const issues: string[] = [];
  if (current.schema !== 1 || baseline.schema !== 1 || JSON.stringify(current.config) !== JSON.stringify(baseline.config)) throw new Error("Economy evidence has incompatible schema or sampling configuration");
  const expected = new Set(economyCampaignCases().map(caseId));
  const rate = (n: number, d: number) => d ? n / d : 0;
  for (const report of [current, baseline]) {
    if (!Array.isArray(report.rows) || report.rows.length !== expected.size || !Array.isArray(report.failures) || !Array.isArray(report.coveredScenes) || !report.coveredScenes.length) throw new Error("Incomplete economy evidence");
    const seen = new Set<string>();
    for (const r of report.rows) {
      if (!expected.has(r.id) || r.id !== caseId(r) || seen.has(r.id)) throw new Error("Missing, duplicate or mismatched economy cell");
      seen.add(r.id);
      for (const key of ["runs", "completed", "eligible", "goalMet", "missingPacket", "kitBought", "kitUnaffordable", "kitDeferred", "finalCreds", "finalStrain", "cashEarned", "cashSpent", "weekCreds", "weekStrain", "checks", "successes", "broke", "highStrain", "recovered", "exposedWitness", "relocatedWitness", "keyAuthenticated", "archiveFlagged", "openWork"] as const) {
        if (!Number.isInteger(r[key]) || r[key] < 0) throw new Error(`Invalid economy count ${r.id}/${key}`);
      }
      if (r.runs !== report.config.seeds || r.completed > r.runs || r.eligible > r.completed || r.goalMet > r.eligible || r.missingPacket > r.completed - r.eligible || r.successes > r.checks || !Number.isFinite(r.expectedSuccesses) || r.expectedSuccesses < 0 || r.expectedSuccesses > r.checks + 1e-6 || r.finalStrain > 5 * r.completed) throw new Error(`Inconsistent economy counts ${r.id}`);
      for (const map of [r.endings, r.hourOutcomes, r.blockedOptions]) {
        if (!map || typeof map !== "object" || Array.isArray(map) || Object.values(map).some(n => !Number.isInteger(n) || n < 0 || n > r.completed)) throw new Error("Invalid economy outcome/pressure counts");
      }
      if (Object.values(r.endings).reduce((a, n) => a + n, 0) !== r.completed || Object.values(r.hourOutcomes).reduce((a, n) => a + n, 0) !== r.completed) throw new Error("Missing campaign outcome evidence");
    }
  }
  if (current.failures.length) issues.push(`${current.failures.length} campaigns failed; first: ${JSON.stringify(current.failures[0])}`);
  if (baseline.failures.length || baseline.rows.some(r => r.completed !== r.runs)) issues.push("Economy baseline contains failed or incomplete campaigns");
  const previous = new Map(baseline.rows.map(r => [r.id, r]));
  for (const r of current.rows) {
    const b = previous.get(r.id)!;
    if (r.completed !== r.runs) issues.push(`${r.id}: incomplete campaigns`);
    if (rate(b.eligible, b.runs) - rate(r.eligible, r.runs) > .05 + 1e-9) issues.push(`${r.id}: mission access fell by more than 5pp`);
    if (b.eligible >= 50 && r.eligible >= 50 && rate(b.goalMet, b.eligible) - rate(r.goalMet, r.eligible) > .05 + 1e-9) issues.push(`${r.id}: eligible-goal success fell by more than 5pp`);
    if (rate(b.finalCreds, b.completed) - rate(r.finalCreds, r.completed) > 25) issues.push(`${r.id}: mean final cash fell by more than 25 creds`);
    if (rate(r.finalStrain, r.completed) - rate(b.finalStrain, b.completed) > .5) issues.push(`${r.id}: mean final Strain rose by more than 0.5`);
    for (const key of ["exposedWitness", "openWork"] as const) if (rate(r[key], r.completed) - rate(b[key], b.completed) > .05 + 1e-9) issues.push(`${r.id}: ${key} rose by more than 5pp`);
  }
  const scenes = new Set(current.coveredScenes);
  for (const id of baseline.coveredScenes) if (!scenes.has(id)) issues.push(`Lost goal-policy scene coverage: ${id}`);
  return issues;
}

export function campaignEconomySummary(report: EconomyReport): string {
  const total = (key: "runs" | "completed" | "eligible" | "goalMet", rows = report.rows) => rows.reduce((sum, r) => sum + r[key], 0);
  const pct = (n: number, d: number) => d ? `${(100 * n / d).toFixed(1)}%` : "not sampled";
  const lines = ["# Goal-driven campaign economy", "", report.scope, "", `${total("completed")}/${total("runs")} campaigns completed; ${total("eligible")} started their target mission; ${total("goalMet")} met that goal. ${report.coveredScenes.length} scenes sampled by these focused policies.`, "", "## Strategy comparison", "", "| Goal | Income policy | Spending policy | Runs | Mission started | Goal met | Mean final creds | Mean final Strain | Kits bought |", "|---|---|---|---|---|---|---|---|---|"];
  for (const goal of CAMPAIGN_GOALS) for (const income of ["sale", "no-sale"] as const) for (const spending of ["care-first", "kit-first"] as const) {
    const rows = report.rows.filter(r => r.goal === goal && r.income === income && r.spending === spending);
    const completed = total("completed", rows), sum = (key: "finalCreds" | "finalStrain" | "kitBought") => rows.reduce((s, r) => s + r[key], 0);
    lines.push(`| ${goal} | ${income} | ${spending} | ${total("runs", rows)} | ${total("eligible", rows)} | ${total("goalMet", rows)} | ${(sum("finalCreds") / (completed || 1)).toFixed(2)} | ${(sum("finalStrain") / (completed || 1)).toFixed(2)} | ${sum("kitBought")} |`);
  }
  lines.push("", "Pooled resource figures summarize these paired strategies; compare individual builds only within the same origin/complication. Failed opening access is not an unaffordable mission or a campaign softlock. Blocked-option counts include unused alternatives and are not required expenditure.", "", "## Every build and policy", "", "| Build / complication | Goal | Income | Spending | Access | Goal among started | Mean final creds | Mean final Strain |", "|---|---|---|---|---|---|---|---|");
  for (const r of report.rows) lines.push(`| ${r.origin}/${r.stat}/${r.complication} | ${r.goal} | ${r.income} | ${r.spending} | ${pct(r.eligible, r.runs)} | ${pct(r.goalMet, r.eligible)} (${r.eligible}) | ${(r.finalCreds / (r.completed || 1)).toFixed(2)} | ${(r.finalStrain / (r.completed || 1)).toFixed(2)} |`);
  lines.push("", "Source-aware internal simulation; not player preference, a universal win rate or a grade increase. See docs/CAMPAIGN_ECONOMY.md for exact policies, scope and limits.", "");
  return lines.join("\n");
}
