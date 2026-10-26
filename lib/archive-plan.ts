import { mergeJournal } from "./journal";
import type { Choice, CheckResult, CheckSpec, EffectSpec, GameState, Scene } from "./types";

export type ArchivePlanDraft = { objective: "authenticate" | "corroborate"; approach: "reader" | "carbon"; contingency: "staffed" | "withdraw" };
export type ArchivePosition = "priority" | "preflight" | "window" | "registered" | "existing";
export type ArchivePlan = ArchivePlanDraft & { stage: "planned" | "positioned" | "failed" | "retrieved" | "withdrawn" | "abandoned"; position: ArchivePosition | null };
type Position = Choice & { position: ArchivePosition; approach?: ArchivePlanDraft["approach"]; bonus: number };
const positionFlag = (position: ArchivePosition) => `archive_plan_position_${position}`;
export const ARCHIVE_POSITIONS: Position[] = [
  { id: "archive-plan-priority", position: "priority", approach: "reader", bonus: 2, label: "Register a priority reader request.", detail: "Helion +1. Up to +2 to this rolled key match; it does not stack with an indexed preparation.", effects: { factions: { helion: 1 } }, next: "act2_archive_door" },
  { id: "archive-plan-preflight", position: "preflight", approach: "reader", bonus: 1, maxStrain: 4, label: "Preflight the receipt numbers before querying.", detail: "Strain +1. Up to +1 to this rolled match; a failed final query can still be logged.", effects: { strain: 1 }, next: "act2_archive_door" },
  { id: "archive-plan-window", position: "window", approach: "carbon", bonus: 2, maxStrain: 4, label: "Wait out a service interval and prepare the slot.", detail: "Strain +1. Opens this carbon attempt without training; up to +2, not stacked with an already scouted interval.", effects: { strain: 1 }, next: "act2_archive_door" },
  { id: "archive-plan-registered", position: "registered", approach: "carbon", bonus: 0, requireCreds: 15, label: "Pay for registered sleeve access.", detail: "15 creds; Helion +1. Opens this carbon attempt without training. It grants no accuracy bonus and names no technician.", effects: { creds: -15, factions: { helion: 1 } }, next: "act2_archive_door" },
  { id: "archive-plan-existing", position: "existing", bonus: 0, label: "Use the preparation or technique already earned.", detail: "No extra setup cost or accuracy. Requires the matching index/interval preparation or trained technique.", next: "act2_archive_door" },
];
export const ARCHIVE_PLAN_CATALOG = { contexts: ["act2_archive_prep", "act2_archive_compare", "act2_archive_door"], positions: ARCHIVE_POSITIONS.map(({ id, position, approach, bonus }) => ({ id, position, approach: approach ?? "matching earned route", bonus })), methods: ["trace-receipt", "isolate-key", "lift-carbon"], contingencies: { staffed: "Canonical ledger recovery, including free pause/unresolved exit", withdraw: "Apply canonical unresolved closure after failure and return to the canal" } };
const context = (state: GameState) => ARCHIVE_PLAN_CATALOG.contexts.includes(state.sceneId);
const earned = (state: GameState, approach: ArchivePlanDraft["approach"]) => approach === "reader" ? Boolean(state.flags.archive_indexed || state.flags.perk_chrome) : Boolean(state.flags.archive_patrol || state.flags.perk_ghost);
const active = (plan?: ArchivePlan) => plan?.stage === "planned" || plan?.stage === "positioned";

export function canPlanArchive(state: GameState) {
  return context(state) && !state.pendingCheck && state.flags.archive_briefed && state.flags.memory_intact && !state.flags.archive_done && !state.flags.archive_flagged && (!state.archivePlan || ["planned", "abandoned"].includes(state.archivePlan.stage));
}
export function parseArchivePlan(value: unknown, state: GameState): ArchivePlan | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (!["authenticate", "corroborate"].includes(v.objective as string) || !["reader", "carbon"].includes(v.approach as string) || !["staffed", "withdraw"].includes(v.contingency as string) || !["planned", "positioned", "failed", "retrieved", "withdrawn", "abandoned"].includes(v.stage as string)) return null;
  if (v.objective === "authenticate" && v.approach !== "reader") return null;
  const pos = ARCHIVE_POSITIONS.find(p => p.position === v.position);
  if (v.position !== null && (!pos || pos.approach && pos.approach !== v.approach)) return null;
  if (!state.flags.archive_briefed) return null;
  if (["planned", "positioned"].includes(v.stage as string) && (!state.flags.memory_intact || !state.sceneId.startsWith("act2_archive_"))) return null;
  if (v.stage === "planned" && (v.position !== null || state.flags.archive_done || state.flags.archive_flagged)) return null;
  if (v.stage === "positioned" && (state.sceneId !== "act2_archive_door" || !pos || !state.flags[positionFlag(pos.position)] || state.flags.archive_done || pos.position === "existing" && !earned(state, v.approach as ArchivePlanDraft["approach"]))) return null;
  if (v.stage === "failed" && (!state.flags.archive_flagged || state.flags.archive_done || v.contingency !== "staffed")) return null;
  if (v.stage === "retrieved" && !(state.flags.archive_done && state.flags.order_verified)) return null;
  if (v.stage === "withdrawn" && !(state.flags.archive_done && state.flags.archive_unresolved)) return null;
  if (["positioned", "failed", "retrieved", "withdrawn"].includes(v.stage as string) && !pos) return null;
  return { objective: v.objective, approach: v.approach, contingency: v.contingency, stage: v.stage, position: v.position } as ArchivePlan;
}
export function commitArchivePlan(state: GameState, draft: ArchivePlanDraft): GameState {
  if (!canPlanArchive(state)) throw new Error("Plan before the attempt, with no held roll. Abandon committed setup before changing it.");
  const plan = parseArchivePlan({ ...draft, stage: "planned", position: null }, state);
  if (!plan) throw new Error("A carbon copy can corroborate cancellation; authentication requires the reader.");
  const flags = { ...state.flags }; for (const p of ARCHIVE_POSITIONS) delete flags[positionFlag(p.position)];
  return { ...state, flags, archivePlan: plan };
}
export function archiveSetupBonus(state: GameState, approach: ArchivePlanDraft["approach"], position: ArchivePosition) {
  const amount = ARCHIVE_POSITIONS.find(p => p.position === position)?.bonus ?? 0;
  const already = state.flags[approach === "reader" ? "archive_indexed" : "archive_patrol"] ? 2 : 0;
  return Math.max(0, amount - already);
}
export function archivePlanBonus(state: GameState, check: CheckSpec) {
  const p = state.archivePlan;
  if (state.sceneId !== "act2_archive_door" || p?.stage !== "positioned" || !p.position) return 0;
  if (check.label !== (p.approach === "reader" ? "Authenticate the counter-order" : "Recover the carbon ledger")) return 0;
  return archiveSetupBonus(state, p.approach, p.position);
}
export function archivePlanChoices(state: GameState, scene: Scene): Choice[] {
  const p = state.archivePlan;
  if (scene.id !== "act2_archive_door" || !active(p)) return scene.choices;
  const abandon: Choice = { id: "archive-plan-abandon", label: "Abandon the plan and keep the original archive methods.", detail: "Spent money, effort and exposure remain. No source is granted or removed.", next: scene.id };
  if (p!.stage === "planned") return [
    ...scene.choices.filter(c => c.id === "leave-archive"),
    ...ARCHIVE_POSITIONS.filter(o => (!o.approach || o.approach === p!.approach) && (o.position !== "existing" || earned(state, p!.approach))).map(o => ({ ...o, effects: (s: GameState) => ({ ...(typeof o.effects === "function" ? o.effects(s) : o.effects), flags: [positionFlag(o.position)] }) })),
    abandon,
  ];
  const ids = p!.approach === "reader" ? ["trace-receipt", "isolate-key", "leave-archive"] : ["lift-carbon", "leave-archive"];
  const consequence = p!.contingency === "withdraw" ? "On failure, close this archive search as unresolved and return to the canal; no staffed retry for this attempt." : "On failure, keep the staffed ledger recovery, free pause and unresolved exit.";
  return [...scene.choices.filter(c => ids.includes(c.id)).map(c => c.id === "leave-archive" ? c : ({ ...c, ...(c.id === "lift-carbon" ? { requireFlag: undefined } : {}), detail: `${c.id === "lift-carbon" ? "Prepared slot access applies only to this attempt; it grants no training. " : c.detail ? c.detail + " " : ""}${c.check ? consequence : "The local trained method has no roll; it keeps its original strain cost."}` })), abandon];
}
export function finishArchivePlan(before: GameState, next: GameState, choice: Choice, check: CheckResult | null, gap: Scene, apply: (state: GameState, effect?: EffectSpec) => GameState): GameState {
  const previous = before.archivePlan;
  if (!previous) return next;
  let plan = { ...previous };
  const position = ARCHIVE_POSITIONS.find(p => p.id === choice.id);
  if (previous.stage === "planned" && position) plan = { ...plan, stage: "positioned", position: position.position };
  else if (previous.stage === "positioned" && ["trace-receipt", "isolate-key", "lift-carbon"].includes(choice.id)) {
    if (!check || check.success) plan.stage = "retrieved";
    else if (plan.contingency === "staffed") plan.stage = "failed";
    else {
      const close = gap.choices.find(c => c.id === "keep-gap")!;
      next = apply(next, close.effects);
      const destination = typeof close.next === "function" ? close.next(next) : close.next!;
      next = { ...next, sceneId: destination }; plan.stage = "withdrawn";
    }
  } else if (previous.stage === "failed" && ["buy-ledger", "old-employee"].includes(choice.id)) {
    plan.stage = "retrieved";
    next = { ...next, journal: mergeJournal(next.journal, [{ id: "verified-order", kind: "fact", text: "The staffed shift ledger independently corroborates the evacuation cancellation. No issuing-key match was performed." }]) };
  } else if (previous.stage === "failed" && choice.id === "keep-gap") plan.stage = "withdrawn";
  else if (active(previous) && (choice.id === "archive-plan-abandon" || !next.sceneId.startsWith("act2_archive_") || next.flags.archive_done || next.flags.archive_flagged || !next.flags.memory_intact)) {
    plan.stage = "abandoned"; const flags = { ...next.flags }; for (const p of ARCHIVE_POSITIONS) delete flags[positionFlag(p.position)]; next = { ...next, flags };
  }
  return { ...next, archivePlan: plan };
}
