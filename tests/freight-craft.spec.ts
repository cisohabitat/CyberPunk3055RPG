import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { getScene, sceneText, presentChoices, commitChoice } from "../lib/engine";
import { sceneIllustration } from "../lib/art";
import { visibleCampaignDialogue } from "../lib/campaign-dialogue";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { keyboardActivate } from "../qa/production/keyboard";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import type { GameState } from "../lib/types";
import phase from "../qa/media/freight-craft.json";
import bindings from "../qa/media/freight-craft-dialogue-bindings.json";
const checkpoints = bindings.map(binding => {
  for (const file of phase.newRoutes) {
    try {
      const state = routeCheckpoint(file.slice(0, -5), binding.scene);
      if (visibleCampaignDialogue(state.sceneId, getScene(state.sceneId).speaker, sceneText(getScene(state.sceneId), state)).some(line => line.id === binding.id)) return { state, binding };
    } catch { /* A different complete route supplies this conditional line. */ }
  }
  throw Error(`No legal checkpoint for ${binding.id}`);
});
const saved = (page: Page) => page.evaluate(() => ({ run: localStorage.getItem("saint-shard-3055-v1"), preferences: localStorage.getItem("saint-shard-preferences"), codex: localStorage.getItem("saint-shard-codex") }));
const audio = (page: Page) => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
async function open(page: Page, state: GameState, width = 390, sound = false, automatic = sound, paragraph = false, voices = 100) {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ state, width, sound, automatic, paragraph, voices }) => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound, autoVoices: automatic, voices, artwork: width === 320 ? "none" : "full", reading: paragraph ? "paragraph" : "all", textStep: width === 320 ? 2 : 0, contrast: "high", motion: "reduce" }));
  }, { state, width, sound, automatic, paragraph, voices });
  await page.goto("/"); await page.getByTestId("continue-run").click(); await expect(page.getByTestId("goal")).toBeVisible();
}
async function exit(page: Page, state: GameState) {
  const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.enabled)!;
  await keyboardActivate(page, page.getByTestId(`choice-${choice.id}`));
  await expect.poll(async () => JSON.parse((await saved(page)).run!)).toEqual(commitChoice(state, choice).state);
}

for (const width of [390, 1440, 320]) for (const {state, binding} of checkpoints) test(`freight stage ${binding.id}: exact text, art, costs, save and exit at ${width}px`, async ({page}, info) => {
  await open(page, state, width); const before = await saved(page);
  await expect(page.getByTestId("goal")).toBeInViewport();
  await expect(page.getByTestId("scene-text")).toHaveText(sceneText(getScene(state.sceneId), state).split(/\n\n+/).filter(Boolean).join(""));
  const image = page.getByTestId("scene-illustration").locator("img");
  if (width === 320) await expect(image).toHaveCount(0);
  else { await expect(image).toHaveAttribute("src", sceneIllustration(state.sceneId, state.flags)!.src); await image.evaluate((im: HTMLImageElement) => im.decode()); }
  for (const choice of presentChoices(state, getScene(state.sceneId))) {
    const button = page.getByTestId(`choice-${choice.id}`); await expect(button).toBeVisible();
    if (choice.enabled) await expect(button).toBeEnabled(); else { await expect(button).toBeDisabled(); await expect(page.getByTestId("scene")).toContainText(choice.disabledReason!); }
  }
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await saved(page)).toEqual(before); await page.screenshot({path: info.outputPath("scene.png"), fullPage:true});
  await page.reload(); await page.getByTestId("continue-run").click(); expect(await saved(page)).toEqual(before); await exit(page, state);
});
for (const {state, binding} of checkpoints) test(`freight voice ${binding.id}: actor, exact quote, gain, completion and Stop`, async ({page}) => {
  await page.addInitScript(installAudioReview, {}); await open(page, state, 390, true); const before = await saved(page);
  await expect.poll(async () => (await audio(page)).started.filter(f => f.startsWith("voice-"))).toEqual([`${binding.id}.mp3`]);
  await expect(page.locator('.portrait-frame[data-speaking="true"]')).toHaveAttribute("data-speaker", "Asa");
  await expect(page.getByTestId("spoken-quote")).toContainText(binding.text);
  expect((await audio(page)).voiceLevels.find(l => l.file === `${binding.id}.mp3`)!.gain).toBe(1);
  await expect.poll(async () => (await audio(page)).disposed, {timeout:20000}).toContain(`${binding.id}.mp3`);
  await expect(page.getByTestId("spoken-quote")).toHaveCount(0);
  const voice = page.getByTestId("voice-line"); await voice.locator("summary").click(); await voice.getByRole("button", {name:"Listen to Asa",exact:true}).click();
  await expect(voice).toHaveAttribute("data-playback","playing"); await voice.getByRole("button",{name:"Stop line",exact:true}).click(); await expect(voice).toHaveAttribute("data-playback","idle");
  expect(await saved(page)).toEqual(before); await exit(page,state);
});
for (const [route, scene, action] of [["bare-names","act2_ramp_gear","ramp-lift-bare"],["blocks-witness","act2_ramp_gear","ramp-lift-blocks"],["harness-listed","act2_ramp_gear","ramp-lift-harness"],["failed-desk","act2_ramp_stopped","ramp-recover-desk"],["failed-courier","act2_ramp_stopped","ramp-recover-courier"],["cancel","act2_ramp_survey","ramp-cancel"],["pause-resume","act2_ramp_gear","ramp-pause"],["scarce","act2_ramp_gear","ramp-lift-bare"]]) test(`freight actual commitment ${route}: exact resources survive reload`, async ({page}) => {
  const state = routeCheckpoint(`freight-craft/${route}`,scene,action); await open(page,state,320);
  const choice = presentChoices(state,getScene(scene)).find(c=>c.id===action && c.enabled)!;
  await keyboardActivate(page,page.getByTestId(`choice-${action}`));
  const next = commitChoice(state,choice).state;
  await expect.poll(async()=>JSON.parse((await saved(page)).run!)).toEqual(next);
  await page.reload(); await page.getByTestId("continue-run").click(); expect(JSON.parse((await saved(page)).run!)).toEqual(next);
});
test("freight paragraph/manual/no-art reveals speech before playback and respects Stop",async({page})=>{
  await page.addInitScript(installAudioReview,{}); const {state,binding}=checkpoints[0], artRequests:string[]=[];
  page.on("request",r=>{if(new URL(r.url()).pathname.startsWith("/art/"))artRequests.push(r.url());});
  await open(page,state,320,true,false,true); const before=await saved(page);
  await expect(page.getByTestId("voice-line")).toHaveCount(0); expect((await audio(page)).started.filter(f=>f.startsWith("voice-"))).toEqual([]);
  await page.getByTestId("show-rest").click(); const voice=page.getByTestId("voice-line"); await voice.locator("summary").click(); await expect(voice).toContainText(binding.text);
  await voice.getByRole("button",{name:"Listen to Asa",exact:true}).click(); await expect(voice).toHaveAttribute("data-playback","playing");
  await voice.getByRole("button",{name:"Stop line",exact:true}).click(); await expect(voice).toHaveAttribute("data-playback","idle"); expect(artRequests).toEqual([]); expect(await saved(page)).toEqual(before);
});
for(const [sound,voices] of [[false,100],[true,0]] as const)test(`freight muted channel remains readable: sound=${sound}, voices=${voices}`,async({page})=>{
  await page.addInitScript(installAudioReview,{}); const {state,binding}=checkpoints[0]; await open(page,state,390,sound,true,false,voices);
  await expect(page.getByTestId("scene-text")).toContainText(binding.text); expect((await audio(page)).started.filter(f=>f.startsWith("voice-"))).toEqual([]); await exit(page,state);
});
test("missing freight audio and art leave full readable text and a legal exit",async({page})=>{
  await page.route("**/voice-campaign-freight-craft-*.mp3",r=>r.abort()); await page.route("**/art/*.jpg",r=>r.abort()); const {state,binding}=checkpoints[0]; await open(page,state,390,true); await expect(page.getByTestId("scene-text")).toContainText(binding.text); await exit(page,state);
});
test("unsupported imported carry cannot invent a voiced handover",async({page})=>{
  await page.addInitScript(installAudioReview,{}); const state=structuredClone(routeCheckpoint("freight-craft/bare-names","act2_ramp_arrived")); state.journal=state.journal.filter(j=>j.id!=="freight-ramp-handover");
  await open(page,state,390,true); await expect(page.getByTestId("voice-line")).toHaveCount(0); await expect(page.getByTestId("choice-ramp-wait-clerk")).toHaveCount(0); expect((await audio(page)).started.filter(f=>f.startsWith("voice-"))).toEqual([]); await exit(page,state);
});
