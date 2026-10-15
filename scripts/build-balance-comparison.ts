import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { commitChoice, createCharacter, getScene, presentChoices, previewCheck, stageCheck } from "../lib/engine";
import { parseSave } from "../lib/storage";
import { FIELD_KITS } from "../lib/loadout";
import type { ReplaySpec, ReplayStep } from "../lib/story-replay";
import type { GameState, OriginId, StatId } from "../lib/types";

// Complete authored proxy campaigns; no invented funds, equipment or preparation.
// Directed dice and source familiarity are explicit limitations of this comparison.
const origins: OriginId[] = ["gutterwire", "spire", "dustline"];
const stats: StatId[] = ["chrome", "nerve", "face", "ghost"];
const read = (name: string): ReplaySpec => JSON.parse(readFileSync(`qa/routes/${name}.json`, "utf8"));
const rows = [];
for (const origin of origins) for (const stat of stats) for (const profile of ["prepared", "equipped", "scarce"] as const) {
  const source = read(profile === "scarce" ? `scarce-witness-${origin}` : `depot-build-${stat}`);
  const kit = FIELD_KITS.find(kit => kit.stat === stat)!;
  const spec = structuredClone(source);
  spec.name = `balance-${origin}-${stat}-${profile}`;
  spec.character = { ...source.character, origin, bonus: { chrome: 0, nerve: 0, face: 0, ghost: 0, [stat]: 2 } };
  // All builds retain the same common route; no origin-exclusive favor is injected.
  if (profile !== "scarce") spec.steps = spec.steps.filter(step => !["origin-contract", "clear-key", "return-board"].includes(step.choiceId));
  if (profile === "scarce") {
    const index = spec.steps.findIndex(step => step.choiceId === "into-week") + 1;
    spec.steps.splice(index, 0, { choiceId: "practice" }, { choiceId: `learn-${stat}` });
  }
  if (profile === "equipped") {
    const index = spec.steps.findIndex(step => step.choiceId === "to-lumen");
    spec.steps.splice(index, 0, { choiceId: "visit-workshop" }, { choiceId: `buy-${kit.id}` });
    if (stat === "nerve") {
      const transfer = spec.steps.findIndex(step => step.choiceId === "nerve-transfer");
      spec.steps.splice(transfer, 1, { choiceId: "compare-witness-support" }, { choiceId: "harness-chair-transfer", reload: true });
    }
  }
  let state = createCharacter(spec.character);
  const checks = [], decisions = [];
  for (let index = 0; index < spec.steps.length; index++) {
    if (profile === "scarce" && state.sceneId === "act2_witness_arrival" && spec.steps[index].choiceId === "registered-transfer") {
      const after = spec.steps.findIndex((step, position) => position > index && step.choiceId === "stand");
      spec.steps.splice(index, after - index, { choiceId: "defer-account", reload: true });
    }
    const step = spec.steps[index];
    if (profile === "scarce" && state.sceneId === "act2_route_receipt" && step.choiceId === "pause-kerr-recovery") step.choiceId = "record-kerr-receipt";
    const scene = getScene(state.sceneId), choice = presentChoices(state, scene).find(choice => choice.id === step.choiceId && choice.enabled);
    if (!choice) throw new Error(`${spec.name}: unavailable ${state.sceneId}/${step.choiceId} (${state.creds} creds)`);
    const before = state;
    if (choice.check) {
      const preview = previewCheck(state, choice.check);
      checks.push({ scene: scene.id, choice: choice.id, stat: choice.check.stat, hits: preview.hits, bonus: preview.bonus, dc: preview.dc, die: step.roll });
      state = stageCheck(state, choice.id, step.roll!);
    }
    state = parseSave(JSON.stringify(state))!;
    state = commitChoice(state, choice, choice.check ? { roll: step.roll! } : undefined).state;
    state = parseSave(JSON.stringify(state))!;
    if (scene.id.startsWith("act2_witness") || scene.id === "act2_workshop" || scene.id === "districts") decisions.push({ scene: scene.id, choice: choice.id, before: { creds: before.creds, strain: before.strain }, after: { creds: state.creds, strain: state.strain }, safe: Boolean(state.flags.witness_safe), consent: Boolean(state.flags.witness_consent) });
  }
  if (!getScene(state.sceneId).endingTitle) throw new Error(`${spec.name}: no finale`);
  rows.push({ origin, stat, profile, name: spec.name, steps: spec.steps.length, checks, decisions, final: { scene: state.sceneId, creds: state.creds, strain: state.strain, flags: state.flags, items: state.items } });
  if (process.argv.includes("--write-fixtures") && profile === "equipped" && stat === "nerve") {
    spec.expected = { sceneId: state.sceneId, creds: state.creds, strain: state.strain, flags: { witness_safe: true, witness_method_nerve: true }, items: ["chair-harness"] };
    writeFileSync(`qa/routes/${spec.name}.json`, JSON.stringify(spec, null, 2) + "\n");
  }
}
const file = process.argv.find(arg => arg.startsWith("--out="))?.slice(6) ?? "qa/editorial/build-balance.json";
mkdirSync(dirname(file), { recursive: true });
writeFileSync(file, JSON.stringify({ schema: 1, scope: "36 complete source-familiar directed campaigns; three origins, four two-point specializations, prepared/equipped/scarce profiles. All training, purchases and preparation are legally played; no injected money or items. Not natural-dice, blind-player or physical-device evidence.", rows }, null, 2) + "\n");
console.log(JSON.stringify({ file, campaigns: rows.length, equippedNerve: rows.filter(row => row.stat === "nerve" && row.profile === "equipped").map(row => ({ origin: row.origin, transfer: row.decisions.find(step => step.choice === "harness-chair-transfer"), final: row.final })) }));
