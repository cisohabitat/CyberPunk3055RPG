import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createCharacter, commitChoice, getScene, presentChoices } from "../lib/engine";
import type { ReplaySpec } from "../lib/story-replay";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";

const cases = [
  ["mara-company-courier-stay.json", "voice-mara-chair-remembered", "act3_mara_followup"],
  ["mara-company-decline-company.json", "voice-mara-company-declined", "act3_mara_followup"],
  ["mara-company-scarce-leave.json", "voice-mara-walked-reply", "act3_mara_followup"],
  ["mara-company-scarce-resume.json", "voice-mara-next-batch", "act3_mara_followup"],
  ["mara-company-scarce-stay.json", "voice-mara-envelope-pending", "act3_mara_followup"],
  ["notice-relay.json", "voice-lumen-relay-limits", "act3_notice_result"],
  ["notice-withdrawn.json", "voice-lumen-withdrawn-window", "act3_notice_result"],
] as const;

for (const [route, id, sceneId] of cases) test(`revealed reaction follows the actual authored route: ${id}`, async ({ page }) => {
  const spec = JSON.parse(readFileSync(`qa/routes/${route}`, "utf8")) as ReplaySpec;
  let state = createCharacter(spec.character);
  for (const step of spec.steps) {
    if (state.sceneId === sceneId) break;
    const choice = presentChoices(state, getScene(state.sceneId)).find(choice => choice.id === step.choiceId && choice.enabled)!;
    state = commitChoice(state, choice, choice.check ? { roll: step.roll! } : undefined).state;
  }
  expect(state.sceneId).toBe(sceneId);
  await page.addInitScript(installAudioReview, {});
  await page.addInitScript(state => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "paragraph", sound: true, autoVoices: true, artwork: "none", effects: 0 }));
  }, state);
  await page.goto("/"); await page.getByTestId("continue-run").click();
  const audio = (): Promise<AudioReview> => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
  const saved = () => page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
  const before = await saved();
  if (sceneId === "act3_mara_followup") {
    await expect(page.getByTestId("voice-line")).toHaveCount(0);
    expect((await audio()).started.filter(name => name.startsWith("voice-"))).toEqual([]);
    await page.getByTestId("show-rest").click();
  }
  await expect.poll(async () => (await audio()).started.filter(name => name.startsWith("voice-"))).toEqual([`${id}.wav`]);
  await page.getByRole("button", { name: "Stop line", exact: true }).click();
  await expect.poll(async () => (await audio()).cleared.filter(name => name.startsWith("voice-"))).toEqual([`${id}.wav`]);
  expect(await saved()).toBe(before);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  expect((await audio()).started.filter(name => name.startsWith("voice-"))).toEqual([`${id}.wav`]);
});
