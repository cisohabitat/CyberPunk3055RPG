import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { getScene, sceneText, presentChoices, commitChoice } from "../lib/engine";
import { sceneIllustration } from "../lib/art";
import { visibleCampaignDialogue } from "../lib/campaign-dialogue";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { keyboardActivate } from "../qa/production/keyboard";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import type { GameState } from "../lib/types";
import phase from "../qa/media/return-routing.json";
import bindings from "../qa/media/return-routing-dialogue-bindings.json";
import { districtRemaining } from '../lib/district-response';
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

for (const width of [390, 1440, 320]) for (const {state, binding} of checkpoints) test(`routing stage ${binding.id}: exact text, art, costs, save and exit at ${width}px`, async ({page}, info) => {
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
for (const {state, binding} of checkpoints) test(`routing voice ${binding.id}: actor, exact quote, gain, completion and Stop`, async ({page}) => {
  await page.addInitScript(installAudioReview, {}); await open(page, state, 390, true); const before = await saved(page);
  await expect.poll(async () => (await audio(page)).started.filter(f => f.startsWith("voice-"))).toEqual([`${binding.id}.mp3`]);
  await expect(page.locator('.portrait-frame[data-speaking="true"]')).toHaveAttribute("data-speaker", "Dispatcher");
  await expect(page.getByTestId("spoken-quote")).toContainText(binding.text);
  expect((await audio(page)).voiceLevels.find(l => l.file === `${binding.id}.mp3`)!.gain).toBe(1);
  await expect.poll(async () => (await audio(page)).disposed, {timeout:20000}).toContain(`${binding.id}.mp3`);
  await expect(page.getByTestId("spoken-quote")).toHaveCount(0);
  const voice = page.getByTestId("voice-line"); await voice.locator("summary").click(); await voice.getByRole("button", {name:"Listen to Dispatcher",exact:true}).click();
  await expect(voice).toHaveAttribute("data-playback","playing"); await voice.getByRole("button",{name:"Stop line",exact:true}).click(); await expect(voice).toHaveAttribute("data-playback","idle");
  expect(await saved(page)).toEqual(before); await exit(page,state);
});
for(const [route,scene,action]of [['scarce','act2_return_routing_prepare','routing-prepare-signed'],['screened','act2_return_routing_prepare','routing-prepare-screened'],['held-strip','act2_return_routing_route','routing-submit-strip'],['cancel-after','act2_return_routing_route','routing-close']])test(`actual routing cost and once-only result: ${route}`,async({page})=>{
 const state=routeCheckpoint('return-routing/'+route,scene,action);await open(page,state,320);const choice=presentChoices(state,getScene(scene)).find(c=>c.id===action&&c.enabled)!;await keyboardActivate(page,page.getByTestId('choice-'+action));const next=commitChoice(state,choice).state;await expect.poll(async()=>JSON.parse((await saved(page)).run!)).toEqual(next);await page.reload();await page.getByTestId('continue-run').click();expect(JSON.parse((await saved(page)).run!)).toEqual(next);
 if(route==='scarce'){expect(next.creds).toBe(0);expect(districtRemaining(next)).toBe(districtRemaining(state)-1);}if(route==='cancel-after'){expect(next.strain).toBe(state.strain);expect(districtRemaining(next)).toBe(districtRemaining(state));}
});
test('routing pause resumes the actual prepared stage without another cost',async({page})=>{
 const state=routeCheckpoint('return-routing/screened','act2_return_routing_route');await open(page,state,390);await keyboardActivate(page,page.getByTestId('choice-routing-pause'));const paused=JSON.parse((await saved(page)).run!);await page.reload();await page.getByTestId('continue-run').click();await keyboardActivate(page,page.getByTestId('choice-routing-resume'));await expect(page.getByTestId('scene')).toContainText('The prepared sleeve');const next=JSON.parse((await saved(page)).run!);for(const key of ['creds','strain','items','rolls'])expect(next[key]).toEqual(paused[key]);expect(districtRemaining(next)).toBe(districtRemaining(state));
});
test('routing paragraph/manual/no-art reveals the quote before explicit playback',async({page})=>{
 await page.addInitScript(installAudioReview,{});const {state,binding}=checkpoints[0];const art:string[]=[];page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/art/'))art.push(r.url());});await open(page,state,320,true,false,true);expect((await audio(page)).started.filter(f=>f.startsWith('voice-'))).toEqual([]);const before=await saved(page);await keyboardActivate(page,page.getByTestId('show-rest'));expect(await saved(page)).toEqual(before);const voice=page.getByTestId('voice-line');await voice.locator('summary').click();await voice.getByRole('button',{name:'Listen to Dispatcher',exact:true}).click();await expect(page.getByTestId('spoken-quote')).toContainText(binding.text);await voice.getByRole('button',{name:'Stop line',exact:true}).click();await expect(voice).toHaveAttribute('data-playback','idle');expect(art).toEqual([]);
});
for(const [sound,voices]of [[false,100],[true,0]]as const)test(`routing respects sound=${sound}, voices=${voices}`,async({page})=>{await page.addInitScript(installAudioReview,{});await open(page,checkpoints[0].state,390,sound,true,false,voices);expect((await audio(page)).started.filter(f=>f.startsWith('voice-'))).toEqual([]);await exit(page,checkpoints[0].state);});
test('missing routing voice leaves exact readable text and working choices',async({page})=>{
 const {state,binding}=checkpoints[0];await page.route('**/audio/'+binding.id+'.mp3',r=>r.abort());await open(page,state,390,true);await expect(page.getByTestId('scene-text')).toContainText(binding.text);await expect(page.getByTestId('voice-line')).toContainText('unavailable');await exit(page,state);
});
test('leaving routing while its exact quote is loading cancels the late start',async({page})=>{
 const {state,binding}=checkpoints[0];await page.addInitScript(installAudioReview,{});let release!:()=>void;const hold=new Promise<void>(r=>release=r);let requested=false;await page.route('**/audio/'+binding.id+'.mp3',async r=>{requested=true;await hold;await r.continue().catch(()=>{});});await open(page,state,390,true);await expect.poll(()=>requested).toBe(true);const choice=presentChoices(state,getScene(state.sceneId)).find(c=>c.enabled)!,next=commitChoice(state,choice).state;const following=visibleCampaignDialogue(next.sceneId,getScene(next.sceneId).speaker,sceneText(getScene(next.sceneId),next))[0];await exit(page,state);release();await expect.poll(async()=>(await audio(page)).disposed,{timeout:20000}).toContain(following.id+'.mp3');expect((await audio(page)).started.filter(f=>f===binding.id+'.mp3')).toEqual([]);
});
