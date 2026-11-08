import { FACTIONS, STRAIN_MAX } from "./character";
import { mergeJournal } from "./journal";
import type { Effect, EffectSpec, GameState } from "./types";

/** Pure resource/record updates. Choice authorization stays in the engine. */
const FACTION_MIN = -3;
const FACTION_MAX = 5;

function clampFaction(value: number): number {
  return Math.max(FACTION_MIN, Math.min(FACTION_MAX, value));
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

