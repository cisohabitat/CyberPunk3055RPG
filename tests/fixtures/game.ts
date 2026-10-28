import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { commitChoice, createCharacter, getScene } from "../../lib/engine";
import type { GameState } from "../../lib/types";

export function fixture(sceneId = "stall", extra: Partial<GameState> = {}): GameState {
  return { ...createCharacter({ handle: "Rex", givenName: "Ada", origin: "spire", bonus: { chrome: 0, nerve: 0, face: 2, ghost: 0 }, complication: "optic" }), sceneId, ...extra };
}

/** Actual canonical custody actions, not an invented authenticated source. */
export function archiveCustodyFixture(): GameState {
  let state = fixture("act2_middle", { creds: 100, flags: { memory_prepared: true, memory_intact: true, perk_face: true } });
  for (const id of ["trace-order", "agree-archive-terms", "skip-archive-prep", "catalog-is-proof", "revise-source-test", "request-invoice", "withhold-technician", "keep-chain"]) {
    const choice = getScene(state.sceneId).choices.find(choice => choice.id === id);
    if (!choice) throw new Error(`Missing canonical archive action: ${id}`);
    state = commitChoice(state, choice).state;
  }
  return state;
}

export async function openRun(page: Page, state = fixture()) {
  await page.addInitScript((run) => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run));
  }, state);
  await page.goto("/"); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("scene")).toBeVisible();
}

export function freightFixture(stat = "ghost", creds = 100): GameState {
  return { ...createCharacter({ handle: "Rex", givenName: "Ada", origin: "dustline", bonus: { chrome: 0, nerve: 0, face: 0, ghost: 2 } }), sceneId: "act2_origin_dustline", creds, flags: { perk_trained: true, [`perk_${stat}`]: true }, factions: { quill: 2, lumen: 0, helion: 0, wards: 0 } };
}

export async function inspectFreight(page: Page) {
  for (const id of ["plan-freight", "accept-freight-terms", "inspect-freight-seal", "inspect-freight-manifest", "inspect-freight-window", "prepare-freight"]) await page.getByTestId(`choice-${id}`).click();
}

export function shelterFixture(stat = "nerve", creds = 100): GameState {
  return { ...createCharacter({ handle: "Rex", givenName: "Ada", origin: "gutterwire", bonus: { chrome: 0, nerve: 2, face: 0, ghost: 0 } }), sceneId: "act2_origin_gutterwire", creds, flags: { perk_trained: true, [`perk_${stat}`]: true }, factions: { quill: 0, lumen: 0, helion: 0, wards: 2 } };
}

export function spireFixture(stat = "chrome", creds = 100): GameState {
  return { ...createCharacter({ handle: "Rex", givenName: "Ada", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } }), sceneId: "act2_origin_spire", creds, flags: { perk_trained: true, [`perk_${stat}`]: true }, factions: { quill: 0, lumen: 0, helion: 2, wards: 0 } };
}

export async function readSpireSources(page: Page) {
  for (const id of ["plan-spire-key", "accept-spire-key", "inspect-spire-billing", "inspect-spire-protocol", "inspect-spire-receiver", "plan-spire-key"]) await page.getByTestId(`choice-${id}`).click();
}
