import { commitChoice, createCharacter, getScene, presentChoices, stageCheck } from "./engine";
import { parseSave } from "./storage";
import type { GameState } from "./types";

export type ReplayStep = { choiceId: string; roll?: number; reload?: boolean };
export type ReplaySpec = {
  name: string;
  character: Parameters<typeof createCharacter>[0];
  steps: ReplayStep[];
  expected: { sceneId: string; flags?: Record<string, boolean>; journal?: string[]; creds?: number; strain?: number; items?: string[] };
};

const restore = (state: GameState) => {
  const saved = parseSave(JSON.stringify(state));
  if (!saved) throw new Error(`Save checkpoint rejected in ${state.sceneId}`);
  return saved;
};

// Development-only QA runner: no debug UI, telemetry, or production import.
export function replayCampaign(spec: ReplaySpec) {
  if (!spec || typeof spec.name !== "string" || !Array.isArray(spec.steps) || spec.steps.length > 500 || !spec.expected || typeof spec.expected.sceneId !== "string") throw new Error("Invalid replay specification");
  let state = createCharacter(spec.character);
  const transcript: { from: string; choiceId: string; roll?: number; to: string; restored: boolean }[] = [];
  for (const [index, step] of spec.steps.entries()) {
    const from = state.sceneId;
    try {
      const choice = presentChoices(state, getScene(from)).find((entry) => entry.id === step.choiceId && entry.enabled);
      if (!choice) throw new Error(`Choice ${step.choiceId} is unavailable`);
      if (choice.check && (!Number.isInteger(step.roll) || step.roll! < 1 || step.roll! > 10)) throw new Error("A check requires an explicit die face from 1 to 10");
      if (!choice.check && step.roll !== undefined) throw new Error("A non-check choice cannot carry a die face");
      if (choice.check && step.reload) state = restore(stageCheck(state, choice.id, step.roll!));
      state = commitChoice(state, choice, choice.check ? { roll: step.roll! } : undefined).state;
      if (step.reload) state = restore(state);
      transcript.push({ from, choiceId: choice.id, roll: step.roll, to: state.sceneId, restored: Boolean(step.reload) });
    } catch (error) {
      throw new Error(`${spec.name}, step ${index + 1}, ${from}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (state.sceneId !== spec.expected.sceneId) throw new Error(`${spec.name}: expected ${spec.expected.sceneId}, reached ${state.sceneId}`);
  for (const [flag, expected] of Object.entries(spec.expected.flags ?? {})) {
    if (typeof expected !== "boolean" || Boolean(state.flags[flag]) !== expected) throw new Error(`${spec.name}: flag ${flag} did not match ${expected}`);
  }
  for (const id of spec.expected.journal ?? []) if (!state.journal.some((entry) => entry.id === id)) throw new Error(`${spec.name}: missing journal source ${id}`);
  for (const key of ["creds", "strain"] as const) if (spec.expected[key] !== undefined && state[key] !== spec.expected[key]) throw new Error(`${spec.name}: ${key} expected ${spec.expected[key]}, reached ${state[key]}`);
  for (const item of spec.expected.items ?? []) if (!state.items.includes(item)) throw new Error(`${spec.name}: missing equipment ${item}`);
  return { name: spec.name, state, transcript };
}
