import { createCharacter, commitChoice, presentChoices } from "./engine";
import { SCENES } from "./story";
import type { GameState, OriginId } from "./types";

export function storyReport() {
  const flags = new Set<string>();
  for (const scene of Object.values(SCENES)) for (const choice of scene.choices) {
    for (const flag of [choice.requireFlag, choice.hideIfFlag, ...(choice.requireAnyFlag ?? []), ...(choice.requireAllFlags ?? []), ...(choice.hideIfAnyFlag ?? [])]) if (flag) flags.add(flag);
    for (const effect of [choice.effects, choice.successEffects, choice.failEffects]) if (effect && typeof effect !== "function") for (const flag of effect.flags ?? []) flags.add(flag);
  }
  const nodes = Object.values(SCENES).map((scene) => {
    const destinations = new Set<string>();
    for (const origin of ["gutterwire", "spire", "dustline"] as OriginId[]) {
      const base = createCharacter({ handle: "Inspector", givenName: "", origin, bonus: { chrome: 1, nerve: 1, face: 0, ghost: 0 } });
      for (const state of [base, { ...base, flags: Object.fromEntries([...flags].map((flag) => [flag, true])), strain: 5 }]) {
        for (const choice of scene.choices) for (const next of [choice.next, choice.nextSuccess, choice.nextFail]) {
          if (next) destinations.add(typeof next === "function" ? next(state) : next);
        }
      }
    }
    return { id: scene.id, location: scene.location, finale: Boolean(scene.finale), choices: scene.choices.map((choice) => ({ id: choice.id, label: choice.label, check: choice.check?.stat, flags: choice.requireAllFlags ?? (choice.requireFlag ? [choice.requireFlag] : []), origin: choice.requireOrigin, consumes: choice.consumeItems ?? [] })), destinations: [...destinations] };
  });
  return { sceneCount: nodes.length, choiceCount: nodes.reduce((sum, node) => sum + node.choices.length, 0), nodes, missing: nodes.flatMap((node) => node.destinations.filter((id) => !Object.hasOwn(SCENES, id)).map((id) => ({ from: node.id, to: id }))) };
}

export function simulateCampaign(seed: number, origin: OriginId): { steps: number; finale: string; state: GameState } {
  let randomState = seed >>> 0;
  const random = () => { randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0; return randomState / 4294967296; };
  let state = createCharacter({ handle: "Inspector", givenName: "", origin, bonus: { chrome: seed % 2, nerve: 0, face: 1, ghost: 1 - seed % 2 }, complication: ["debt", "optic", "on-file"][seed % 3] as "debt" | "optic" | "on-file" });
  for (let steps = 0; steps < 200; steps++) {
    const scene = SCENES[state.sceneId];
    if (scene.finale) return { steps, finale: scene.id, state };
    const choices = presentChoices(state, scene).filter((choice) => choice.enabled);
    if (!choices.length) throw new Error(`No way forward in ${scene.id}`);
    const choice = choices[Math.floor(random() * choices.length)];
    state = commitChoice(state, choice, choice.check ? { roll: 1 + Math.floor(random() * 10) } : undefined).state;
  }
  throw new Error(`Run ${seed}:${origin} did not finish`);
}
