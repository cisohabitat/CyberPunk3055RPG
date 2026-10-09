import { ITEMS } from "./items";
import type { Choice, GameState, Scene } from "./types";

type Condition = { all?: string[]; any?: string[]; not?: string[] };
type Paragraph = string | { select: { when: Condition; text: string }[]; fallback: string };
type AuthoredScene = Omit<Scene, "text"> & { text: string | Paragraph[] };
const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
function fail(path: string, message: string): never { throw new Error(`${path}: ${message}`); }
function keys(value: unknown, allowed: string[], path: string): asserts value is Record<string, unknown> {
  if (!record(value)) fail(path, "expected an object");
  for (const key of Object.keys(value)) if (!allowed.includes(key)) fail(path, `unknown field ${key}`);
}
function string(value: unknown, path: string, id = false): asserts value is string {
  if (typeof value !== "string" || !value.trim() || (id && !/^[a-z0-9][a-z0-9_-]*$/.test(value))) fail(path, id ? "expected a stable id" : "expected nonempty text");
}
function list(value: unknown, path: string) {
  if (!Array.isArray(value) || !value.length) fail(path, "expected a nonempty id list");
  value.forEach((entry, index) => string(entry, `${path}[${index}]`, true));
}
function number(value: unknown, path: string, min = -10000, max = 10000) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) fail(path, `expected an integer from ${min} to ${max}`);
}
function effect(value: unknown, path: string) {
  keys(value, ["strain", "creds", "itemsAdd", "itemsRemove", "flags", "flagsOff", "journal", "factions"], path);
  for (const field of ["strain", "creds"]) if (value[field] !== undefined) number(value[field], `${path}.${field}`);
  for (const field of ["flags", "flagsOff", "itemsAdd", "itemsRemove"]) if (value[field] !== undefined) {
    list(value[field], `${path}.${field}`);
    if (field.startsWith("items")) for (const id of value[field] as string[]) if (!Object.hasOwn(ITEMS, id)) fail(path, `unknown item ${id}`);
  }
  if (value.factions !== undefined) {
    keys(value.factions, ["quill", "lumen", "helion", "wards"], `${path}.factions`);
    for (const [id, amount] of Object.entries(value.factions)) number(amount, `${path}.factions.${id}`, -8, 8);
  }
  if (value.journal !== undefined) {
    if (!Array.isArray(value.journal)) fail(path, "journal must be an array");
    for (const entry of value.journal) {
      if (typeof entry === "string") string(entry, `${path}.journal`);
      else {
        keys(entry, ["id", "text", "kind"], `${path}.journal`); string(entry.id, `${path}.journal.id`, true); string(entry.text, `${path}.journal.text`);
        if (entry.kind !== undefined && !["fact", "claim", "promise"].includes(entry.kind as string)) fail(path, "invalid journal kind");
      }
    }
  }
}
function choice(value: unknown, path: string): asserts value is Choice {
  keys(value, ["id", "label", "detail", "hideIfFlag", "hideIfAnyFlag", "hideIfItem", "requireFlag", "requireAnyFlag", "requireAllFlags", "requireOrigin", "requireItem", "requireJournal", "hideIfJournal", "requireCreds", "requireStrain", "requireFaction", "check", "effects", "successEffects", "failEffects", "consumeItems", "next", "nextSuccess", "nextFail", "resultSuccess", "resultFail"], path);
  string(value.id, `${path}.id`, true); string(value.label, `${path}.label`);
  for (const field of ["detail", "resultSuccess", "resultFail"]) if (value[field] !== undefined) string(value[field], `${path}.${field}`);
  for (const field of ["hideIfFlag", "hideIfItem", "requireFlag", "requireItem", "requireJournal", "hideIfJournal", "next", "nextSuccess", "nextFail"]) if (value[field] !== undefined) string(value[field], `${path}.${field}`, true);
  for (const field of ["hideIfAnyFlag", "requireAnyFlag", "requireAllFlags", "consumeItems"]) if (value[field] !== undefined) list(value[field], `${path}.${field}`);
  for (const field of ["requireItem", "hideIfItem"]) if (value[field] !== undefined && !Object.hasOwn(ITEMS, value[field] as string)) fail(path, `unknown item ${value[field]}`);
  for (const id of (value.consumeItems ?? []) as string[]) if (!Object.hasOwn(ITEMS, id)) fail(path, `unknown item ${id}`);
  if (value.requireOrigin !== undefined && !["spire", "gutterwire", "dustline"].includes(value.requireOrigin as string)) fail(path, "invalid origin");
  if (value.requireCreds !== undefined) number(value.requireCreds, `${path}.requireCreds`, 0);
  if (value.requireStrain !== undefined) number(value.requireStrain, `${path}.requireStrain`, 0, 5);
  if (value.requireFaction !== undefined) {
    keys(value.requireFaction, ["faction", "min"], `${path}.requireFaction`);
    if (!["quill", "lumen", "helion", "wards"].includes(value.requireFaction.faction as string)) fail(path, "invalid faction");
    number(value.requireFaction.min, `${path}.requireFaction.min`, -3, 5);
  }
  for (const field of ["effects", "successEffects", "failEffects"]) if (value[field] !== undefined) effect(value[field], `${path}.${field}`);
  if (value.check !== undefined) {
    keys(value.check, ["stat", "dc", "label", "itemBonuses", "flagBonuses", "factionBonuses", "journalBonuses"], `${path}.check`);
    if (!["chrome", "nerve", "face", "ghost"].includes(value.check.stat as string)) fail(path, "invalid check stat");
    number(value.check.dc, `${path}.check.dc`, 1, 30); string(value.check.label, `${path}.check.label`);
    for (const field of ["itemBonuses", "flagBonuses", "factionBonuses", "journalBonuses"]) if (value.check[field] !== undefined) {
      if (!Array.isArray(value.check[field])) fail(path, "bonuses must be an array");
      for (const bonus of value.check[field]) {
        const key = field === "itemBonuses" ? "item" : field === "flagBonuses" ? "flag" : field === "factionBonuses" ? "faction" : "id";
        keys(bonus, [key, "amount", ...(field === "flagBonuses" || field === "factionBonuses" ? ["label"] : []), ...(field === "factionBonuses" ? ["min"] : [])], `${path}.check.${field}`);
        string(bonus[key], path, true); number(bonus.amount, path, -10, 10);
        if (key === "item" && !Object.hasOwn(ITEMS, bonus.item as string)) fail(path, `unknown item ${bonus.item}`);
        if (key === "faction") { if (!["quill", "lumen", "helion", "wards"].includes(bonus.faction as string)) fail(path, "invalid faction"); number(bonus.min, path, -3, 5); }
        if (field === "flagBonuses" || field === "factionBonuses") string(bonus.label, path);
      }
    }
    string(value.nextSuccess, `${path}.nextSuccess`, true); string(value.nextFail, `${path}.nextFail`, true);
  } else string(value.next, `${path}.next`, true);
}
export function matches(state: GameState, condition: Condition): boolean {
  return (condition.all ?? []).every((flag) => state.flags[flag]) && (!condition.any || condition.any.some((flag) => state.flags[flag])) && (condition.not ?? []).every((flag) => !state.flags[flag]);
}
export function compileMission(raw: unknown): Record<string, Scene> {
  keys(raw, ["version", "scenes"], "mission"); if (raw.version !== 1 || !Array.isArray(raw.scenes) || !raw.scenes.length) fail("mission", "expected version 1 and scenes");
  const scenes: Record<string, Scene> = {};
  for (const value of raw.scenes) {
    keys(value, ["id", "location", "speaker", "text", "choices", "memory", "ending", "finale", "endingTitle"], "scene"); string(value.id, "scene.id", true); string(value.location, value.id);
    if (Object.hasOwn(scenes, value.id)) fail(value.id, "duplicate scene id");
    for (const field of ["speaker", "endingTitle"]) if (value[field] !== undefined) string(value[field], `${value.id}.${field}`);
    for (const field of ["memory", "ending", "finale"]) if (value[field] !== undefined && typeof value[field] !== "boolean") fail(value.id, `invalid ${field}`);
    if (typeof value.text === "string") string(value.text, `${value.id}.text`);
    else {
      if (!Array.isArray(value.text) || !value.text.length) fail(value.id, "expected paragraphs");
      for (const paragraph of value.text) {
        if (typeof paragraph === "string") string(paragraph, value.id);
        else {
          keys(paragraph, ["select", "fallback"], value.id); string(paragraph.fallback, value.id);
          if (!Array.isArray(paragraph.select) || !paragraph.select.length) fail(value.id, "expected text variants");
          for (const variant of paragraph.select) {
            keys(variant, ["when", "text"], value.id); string(variant.text, value.id); keys(variant.when, ["all", "any", "not"], value.id);
            if (!Object.keys(variant.when).length) fail(value.id, "variant condition must not be empty");
            for (const field of ["all", "any", "not"]) if (variant.when[field] !== undefined) list(variant.when[field], value.id);
          }
        }
      }
    }
    if (!Array.isArray(value.choices) || !value.choices.length) fail(value.id, "expected choices");
    const ids = new Set<string>();
    for (const entry of value.choices) { choice(entry, value.id); if (ids.has(entry.id)) fail(value.id, `duplicate choice ${entry.id}`); ids.add(entry.id); }
    const authored = value as unknown as AuthoredScene;
    const paragraphs = authored.text;
    scenes[authored.id] = { ...authored, text: typeof paragraphs === "string" ? paragraphs : (state) => paragraphs.map((paragraph) => typeof paragraph === "string" ? paragraph : paragraph.select.find((variant) => matches(state, variant.when))?.text ?? paragraph.fallback).join("\n\n") };
  }
  return scenes;
}

export function mergeScenes(...sources: Record<string, Scene>[]): Record<string, Scene> {
  const result: Record<string, Scene> = {};
  for (const source of sources) for (const [id, scene] of Object.entries(source)) {
    if (id !== scene.id || Object.hasOwn(result, id)) fail(id, "duplicate or mismatched global scene id");
    result[id] = scene;
  }
  return result;
}
