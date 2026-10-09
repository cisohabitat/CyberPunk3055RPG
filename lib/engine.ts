import { COMPLICATIONS, FACTIONS, FACTION_INFO, ORIGINS, POINTS, STAT_CAP, STATS, STAT_INFO, STRAIN_MAX, isValidName, startingFactions } from "./character";
import { ITEMS } from "./items";
import { mergeJournal } from "./journal";
import { SCENES } from "./story";
import type {
  CheckPreview,
  CheckResult,
  CheckSpec,
  Choice,
  ComplicationId,
  Effect,
  EffectSpec,
  GameState,
  OriginId,
  Scene,
  StatId,
} from "./types";

const FACTION_MIN = -3;
const FACTION_MAX = 5;

function clampFaction(value: number): number {
  return Math.max(FACTION_MIN, Math.min(FACTION_MAX, value));
}

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
  complication?: ComplicationId | null;
  keepsake?: string | null;
}): GameState {
  const origin = ORIGINS[input.origin];
  const complication = input.complication ?? null;
  if (complication && !COMPLICATIONS[complication]) throw new Error("Invalid complication");
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
  const keepsake = input.keepsake && ITEMS[input.keepsake] ? input.keepsake : null;
  const flags: Record<string, boolean> = {};
  if (complication === "on-file") flags.on_file = true;
  if (complication === "debt") flags.debt = true;
  if (complication === "optic") flags.optic = true;
  let creds = origin.creds;
  let strain = 0;
  if (complication === "debt") creds = Math.max(0, creds - 40);
  if (complication === "optic") strain = 1;
  return {
    version: 2,
    handle,
    givenName: given || handle,
    origin: input.origin,
    complication,
    stats,
    factions: startingFactions(input.origin, complication),
    creds,
    strain,
    items: keepsake ? [keepsake] : [],
    flags,
    journal: [],
    chapters: [],
    rolls: [],
    log: [],
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
  const journal = mergeJournal(state.journal, effect.journal);
  const factions = { ...state.factions };
  for (const faction of FACTIONS) {
    const delta = effect.factions?.[faction];
    if (delta) factions[faction] = clampFaction((factions[faction] ?? 0) + delta);
  }
  return { ...state, creds, strain, items, flags, journal, factions };
}

function choiceHidden(state: GameState, choice: Choice): boolean {
  if (choice.hideIfFlag && state.flags[choice.hideIfFlag]) return true;
  if (choice.hideIfAnyFlag?.some((flag) => state.flags[flag])) return true;
  if (choice.hideIfItem && state.items.includes(choice.hideIfItem)) return true;
  if (choice.requireFlag && !state.flags[choice.requireFlag]) return true;
  if (choice.requireAnyFlag && !choice.requireAnyFlag.some((flag) => state.flags[flag])) return true;
  if (choice.requireAllFlags && !choice.requireAllFlags.every((flag) => state.flags[flag])) return true;
  if (choice.requireOrigin && state.origin !== choice.requireOrigin) return true;
  if (choice.requireItem && !state.items.includes(choice.requireItem)) return true;
  if (choice.requireJournal && !state.journal.some((entry) => entry.id === choice.requireJournal)) return true;
  if (choice.hideIfJournal && state.journal.some((entry) => entry.id === choice.hideIfJournal)) return true;
  return false;
}

export function presentChoices(state: GameState, scene: Scene): VisibleChoice[] {
  return scene.choices.filter((choice) => !choiceHidden(state, choice)).map((choice) => {
    if (choice.requireFaction && state.factions[choice.requireFaction.faction] < choice.requireFaction.min) {
      return { ...choice, enabled: false, disabledReason: `Need ${FACTION_INFO[choice.requireFaction.faction].name} standing ${choice.requireFaction.min}` };
    }
    if (choice.requireCreds !== undefined && state.creds < choice.requireCreds) {
      return { ...choice, enabled: false, disabledReason: `Need ${choice.requireCreds} creds` };
    }
    return { ...choice, enabled: true };
  });
}

export function previewCheck(state: GameState, check: CheckSpec): CheckPreview {
  const parts = [{ label: STAT_INFO[check.stat].name, value: state.stats[check.stat] }];
  let bonus = state.stats[check.stat];
  if (state.flags[`perk_${check.stat}`]) {
    bonus += 1;
    parts.push({ label: "Practiced under pressure", value: 1 });
  }
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
  if (state.complication === "optic" && check.stat === "chrome") {
    bonus += 1;
    parts.push({ label: "Live optic", value: 1 });
  }
  for (const factionBonus of check.factionBonuses ?? []) {
    if ((state.factions[factionBonus.faction] ?? 0) >= factionBonus.min) {
      bonus += factionBonus.amount;
      parts.push({ label: factionBonus.label, value: factionBonus.amount });
    }
  }
  for (const journalBonus of check.journalBonuses ?? []) {
    if (state.journal.some((entry) => entry.id === journalBonus.id)) {
      bonus += journalBonus.amount;
      parts.push({ label: journalBonus.label, value: journalBonus.amount });
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
  if (!Number.isInteger(roll) || roll < 1 || roll > 10) throw new Error(`Bad roll ${roll}`);
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

export function effectPreview(state: GameState, choice: Choice): string[] {
  if (!choice.effects) return [];
  const effect: Effect = typeof choice.effects === "function" ? choice.effects(state) : choice.effects;
  const lines: string[] = [];
  if (effect.strain) lines.push(`Strain ${effect.strain > 0 ? "+" : ""}${effect.strain}`);
  if (effect.creds) lines.push(`${effect.creds > 0 ? "+" : ""}${effect.creds} cr`);
  for (const id of effect.itemsAdd ?? []) lines.push(`Gain ${ITEMS[id]?.name ?? id}`);
  for (const id of effect.itemsRemove ?? []) lines.push(`Lose ${ITEMS[id]?.name ?? id}`);
  for (const faction of FACTIONS) {
    const delta = effect.factions?.[faction];
    if (delta) lines.push(`${FACTION_INFO[faction].name} ${delta > 0 ? "+" : ""}${delta}`);
  }
  return lines;
}

export function runDelta(before: GameState, after: GameState): string[] {
  const lines: string[] = [];
  if (after.strain !== before.strain) {
    const delta = after.strain - before.strain;
    lines.push(`Strain ${delta > 0 ? "+" : ""}${delta}`);
  }
  if (after.creds !== before.creds) {
    const delta = after.creds - before.creds;
    lines.push(`${delta > 0 ? "+" : ""}${delta} cr`);
  }
  for (const id of after.items) {
    if (!before.items.includes(id)) lines.push(`Gained ${ITEMS[id]?.name ?? id}`);
  }
  for (const id of before.items) {
    if (!after.items.includes(id)) lines.push(`Lost ${ITEMS[id]?.name ?? id}`);
  }
  for (const faction of FACTIONS) {
    const delta = after.factions[faction] - before.factions[faction];
    if (delta) lines.push(`${FACTION_INFO[faction].name} ${delta > 0 ? "+" : ""}${delta}`);
  }
  return lines;
}

export function commitChoice(
  state: GameState,
  choice: Choice,
  rolled?: { roll: number },
): { state: GameState; check: CheckResult | null } {
  const scene = getScene(state.sceneId);
  const legal = presentChoices(state, scene).find((option) => option.id === choice.id);
  if (!legal?.enabled) throw new Error(`Illegal choice ${choice.id} in ${state.sceneId}`);
  choice = legal;
  if (state.pendingCheck && (state.pendingCheck.choiceId !== choice.id || state.pendingCheck.sceneId !== state.sceneId || state.pendingCheck.roll !== rolled?.roll)) {
    throw new Error("Finish the recorded roll first");
  }

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

  const metFlag: Record<string, string> = {
    Quill: "met_quill",
    Mara: "met_mara",
    Kerr: "met_kerr",
    "Sister Lumen": "met_lumen",
    Ives: "met_ives",
    Sera: "met_sera",
    "Nia Pell": "met_nia",
  };
  const met = scene.speaker ? metFlag[scene.speaker] : undefined;
  if (met && !next.flags[met]) next = { ...next, flags: { ...next.flags, [met]: true } };

  const sceneId = resolveNext(choice, next, check ? check.success : null);
  const chapters =
    scene.endingTitle && sceneId !== scene.id && !next.chapters.includes(scene.endingTitle)
      ? [...next.chapters, scene.endingTitle]
      : next.chapters;
  const log = [...(next.log ?? []), choice.label].slice(-24);
  const { pendingCheck: _pending, ...completed } = next;
  return { state: { ...completed, sceneId, chapters, log }, check };
}

export function stageCheck(state: GameState, choiceId: string, roll: number): GameState {
  if (state.pendingCheck) return state;
  const choice = presentChoices(state, getScene(state.sceneId)).find((entry) => entry.id === choiceId && entry.enabled);
  if (!choice?.check) throw new Error("This choice is not a legal check");
  resolveCheck(state, choice, roll);
  return { ...state, pendingCheck: { sceneId: state.sceneId, choiceId, roll } };
}
