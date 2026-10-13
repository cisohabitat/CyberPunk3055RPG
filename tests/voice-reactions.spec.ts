import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createCharacter, commitChoice, getScene, presentChoices, sceneText } from "../lib/engine";
import { visibleDialogue } from "../lib/memory-media";
import type { ReplaySpec } from "../lib/story-replay";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";

const cases = [
  ["allocation-revised.json", "voice-lumen-full-window", "act2_notice_capacity"],
  ["allocation-revised.json", "voice-lumen-private-door", "act2_notice_privacy_refusal"],
  ["allocation-later-funded.json", "voice-lumen-counteroffer", "act2_notice_counter"],
  ["allocation-later-funded.json", "voice-lumen-funded-carrier", "act3_notice_visit"],
  ["allocation-later-work.json", "voice-lumen-later-trip", "act3_notice_visit"],
  ["allocation-revised.json", "voice-lumen-return-bundle", "act3_notice_visit"],
  ["gutterwire-harness.json", "voice-quill-care-budget", "act2_workshop"],
  ["finale-names-paused.json", "voice-lumen-ordinary-seat", "act2_recovery"],
  ["finale-names-paused.json", "voice-lumen-after-rest", "act2_recovery_after"],
  ["allocation-gutterwire.json", "voice-sera-daylight", "act2_shelter_result"],
  ["memory-timeline-bounded.json", "voice-edda-clean-number", "act2_spire_receipt"],
  ["spire-late.json", "voice-edda-query-remains", "act2_spire_recovery"],
  ["spire-pending.json", "voice-edda-staffed-desk", "act2_spire_recovery"],
  ["mara-company-courier-stay.json", "voice-mara-waits-answer", "act2_response_receipt"],
  ["mara-company-courier-stay.json", "voice-mara-chair-remembered", "act3_mara_followup"],
  ["mara-company-decline-company.json", "voice-mara-company-declined", "act3_mara_followup"],
  ["mara-company-scarce-leave.json", "voice-mara-walked-reply", "act3_mara_followup"],
  ["mara-company-scarce-resume.json", "voice-mara-next-batch", "act3_mara_followup"],
  ["mara-company-scarce-stay.json", "voice-mara-envelope-pending", "act3_mara_followup"],
  ["notice-relay.json", "voice-lumen-relay-limits", "act3_notice_result"],
  ["notice-withdrawn.json", "voice-lumen-withdrawn-window", "act3_notice_result"],
  ["allocation-dustline.json", "voice-asa-earned-clearance", "act2_freight_result"],
  ["freight-abandoned.json", "voice-asa-unconfirmed-result", "act2_freight_result"],
  ["freight-late.json", "voice-asa-late-receipt", "act3_freight_visit"],
  ["allocation-dustline.json", "voice-asa-motive-identity", "act3_freight_reflection"],
  ["courier-motive-exit.json", "voice-asa-motive-exit", "act3_freight_reflection"],
  ["courier-motive-survival.json", "voice-asa-motive-survival", "act3_freight_reflection"],
] as const;

for (const [route, id, sceneId] of cases) test(`revealed reaction follows the actual authored route: ${id}`, async ({ page }) => {
  const spec = JSON.parse(readFileSync(`qa/routes/${route}`, "utf8")) as ReplaySpec;
  let state = createCharacter(spec.character);
  for (const step of spec.steps) {
    const current = getScene(state.sceneId);
    if (state.sceneId === sceneId && visibleDialogue(current.id, current.speaker, sceneText(current, state))?.id === id) break;
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
  if (!["act3_notice_result", "act2_notice_capacity", "act2_notice_privacy_refusal", "act2_notice_counter", "act2_recovery", "act2_spire_recovery"].includes(sceneId)) {
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
