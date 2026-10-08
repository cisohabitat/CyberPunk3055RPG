import { ORIGINS, POINTS, STAT_CAP, STATS, STAT_INFO, STRAIN_MAX, isValidName } from "./character";
import { ITEMS } from "./items";
import { SCENES } from "./story";
import type {
  CheckPreview,
  CheckResult,
  CheckSpec,
  Choice,
  Effect,
  EffectSpec,
  GameState,
  OriginId,
  Scene,
  StatId,
} from "./types";

export type VisibleChoice = Choice & { enabled: boolean; disabledReason?: string };

export function getScene(id: string): Scene {
  const scene = SCENES[id];
  if (!scene) throw new Error(`Missing scene ${id}`);
  return scene;
}

export function sceneText(scene: Scene, state: GameState): string {
  return typeof scene.text === "function" ? scene.text(state) : scene.text;
}

export function createCharacter(input: {
  handle: string;
  givenName: string;
  origin: OriginId;
  bonus: Record<StatId, number>;
}): GameState {
  const origin = ORIGINS[input.origin];
  const stats = { ...origin.stats };
  let spent = 0;
  for (const stat of STATS) {
    const add = input.bonus[stat];
    if (!Number.isInteger(add) || add < 0) throw new Error(`Bad bonus for ${stat}`);
    stats[stat] += add;
    if (stats[stat] > STAT_CAP) throw new Error(`Stat cap exceeded for ${stat}`);
    spent += add;
  }
  if (spent !== POINTS) throw new Error(`Spend exactly ${POINTS} points`);
  const handle = input.handle.trim();
  if (!isValidName(handle)) throw new Error("Invalid handle");
  const given = input.givenName.trim();
  if (given && !isValidName(given, 24)) throw new Error("Invalid given name");
  return {
    version: 1,
    handle,
    givenName: given || handle,
    origin: input.origin,
    stats,
    creds: origin.creds,
    strain: 0,
    items: [],
    flags: {},
    journal: [],
    rolls: [],
    sceneId: "stall",
  };
}

export function applyEffect(state: GameState, spec?: EffectSpec): GameState {
  if (!spec) return state;
  const effect: Effect = typeof spec === "function" ? spec(state) : spec;
  const creds = Math.max(0, state.creds + (effect.creds ?? 0));
  const strain = Math.max(0, Math.min(STRAIN_MAX, state.strain + (effect.strain ?? 0)));
  const items = [...state.items];
  for (const id of effect.itemsRemove ?? []) {
    const index = items.indexOf(id);
    if (index >= 0) items.splice(index, 1);
  }
  for (const id of effect.itemsAdd ?? []) {
    if (!items.includes(id)) items.push(id);
  }
  const flags = { ...state.flags };
  for (const flag of effect.flagsOff ?? []) delete flags[flag];
  for (const flag of effect.flags ?? []) flags[flag] = true;
  const journal = [...state.journal];
  for (const line of effect.journal ?? []) {
    if (!journal.includes(line)) journal.push(line);
  }
  return { ...state, creds, strain, items, flags, journal };
}

function choiceHidden(state: GameState, choice: Choice): boolean {
  if (choice.hideIfFlag && state.flags[choice.hideIfFlag]) return true;
  if (choice.hideIfAnyFlag?.some((flag) => state.flags[flag])) return true;
  if (choice.hideIfItem && state.items.includes(choice.hideIfItem)) return true;
  if (choice.requireFlag && !state.flags[choice.requireFlag]) return true;
  if (choice.requireItem && !state.items.includes(choice.requireItem)) return true;
  return false;
}

export function presentChoices(state: GameState, scene: Scene): VisibleChoice[] {
  return scene.choices.filter((choice) => !choiceHidden(state, choice)).map((choice) => {
    if (choice.requireCreds !== undefined && state.creds < choice.requireCreds) {
      return { ...choice, enabled: false, disabledReason: `Need ${choice.requireCreds} creds` };
    }
    return { ...choice, enabled: true };
  });
}

export function previewCheck(state: GameState, check: CheckSpec): CheckPreview {
  const parts = [{ label: STAT_INFO[check.stat].name, value: state.stats[check.stat] }];
  let bonus = state.stats[check.stat];
  const origin = ORIGINS[state.origin];
  if (origin.perkStat === check.stat) {
    bonus += 1;
    parts.push({ label: origin.perk, value: 1 });
  }
  for (const itemBonus of check.itemBonuses ?? []) {
    if (state.items.includes(itemBonus.item)) {
      bonus += itemBonus.amount;
      parts.push({ label: ITEMS[itemBonus.item]?.name ?? itemBonus.item, value: itemBonus.amount });
    }
  }
  for (const flagBonus of check.flagBonuses ?? []) {
    if (state.flags[flagBonus.flag]) {
      bonus += flagBonus.amount;
      parts.push({ label: flagBonus.label, value: flagBonus.amount });
    }
  }
  let hits = 0;
  for (let roll = 1; roll <= 10; roll += 1) {
    if (roll + bonus >= check.dc) hits += 1;
  }
  return { label: check.label, stat: check.stat, dc: check.dc, bonus, parts, hits };
}

export function resolveCheck(state: GameState, choice: Choice, roll: number): CheckResult {
  if (!choice.check) throw new Error(`Choice ${choice.id} has no check`);
  if (roll < 1 || roll > 10) throw new Error(`Bad roll ${roll}`);
  const preview = previewCheck(state, choice.check);
  const total = roll + preview.bonus;
  const success = total >= preview.dc;
  const crit = roll === 10 && success ? "success" : roll === 1 && !success ? "fail" : null;
  const flavor = success ? (choice.resultSuccess ?? "It lands.") : (choice.resultFail ?? "It doesn't.");
  return { ...preview, roll, total, success, crit, flavor };
}

function resolveNext(choice: Choice, state: GameState, success: boolean | null): string {
  const spec = success === null ? choice.next : success ? choice.nextSuccess : choice.nextFail;
  if (!spec) throw new Error(`Choice ${choice.id} is missing a destination`);
  const id = typeof spec === "function" ? spec(state) : spec;
  if (!SCENES[id]) throw new Error(`Choice ${choice.id} points at missing scene ${id}`);
  return id;
}

export function commitChoice(
  state: GameState,
  choice: Choice,
  rolled?: { roll: number },
): { state: GameState; check: CheckResult | null } {
  const scene = getScene(state.sceneId);
  const legal = presentChoices(state, scene).find((option) => option.id === choice.id);
  if (!legal?.enabled) throw new Error(`Illegal choice ${choice.id} in ${state.sceneId}`);

  let check: CheckResult | null = null;
  let next = applyEffect(state, choice.effects);
  if (choice.check) {
    if (!rolled) throw new Error(`Choice ${choice.id} requires a roll`);
    check = resolveCheck(state, choice, rolled.roll);
    next = applyEffect(next, check.success ? choice.successEffects : choice.failEffects);
    if (check.crit === "fail") next = applyEffect(next, { strain: 1 });
    if (check.crit === "success") next = applyEffect(next, { strain: -1 });
    next = {
      ...next,
      rolls: [
        {
          label: check.label,
          roll: check.roll,
          total: check.total,
          dc: check.dc,
          success: check.success,
        },
        ...next.rolls,
      ].slice(0, 8),
    };
  }

  for (const itemId of choice.consumeItems ?? []) {
    if (next.items.includes(itemId)) next = applyEffect(next, { itemsRemove: [itemId] });
  }

  const sceneId = resolveNext(choice, next, check ? check.success : null);
  return { state: { ...next, sceneId }, check };
}
