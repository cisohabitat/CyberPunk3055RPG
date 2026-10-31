import { DRAMATIC_CHECKPOINTS } from '../qa/production/dramatic-beats-checkpoints';
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { getScene, sceneText, presentChoices, commitChoice } from "../lib/engine";
import { sceneIllustration } from "../lib/art";
import { visibleCampaignDialogue } from "../lib/campaign-dialogue";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { keyboardActivate } from "../qa/production/keyboard";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import type { GameState } from "../lib/types";
import phase from "../qa/media/dramatic-beats.json";
import bindings from "../qa/media/dramatic-beats-dialogue-bindings.json";
const checkpoints = DRAMATIC_CHECKPOINTS;
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
  const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.enabled && !c.check)!;
  await keyboardActivate(page, page.getByTestId(`choice-${choice.id}`));
  await expect.poll(async () => JSON.parse((await saved(page)).run!)).toEqual(commitChoice(state, choice).state);
}

for (const width of [390, 1440, 320]) for (const {state, binding} of checkpoints) test(`dramatic stage ${binding.id}: exact text, art, costs, save and exit at ${width}px`, async ({page}, info) => {
  await open(page, state, width); const before = await saved(page);
  await expect(page.getByTestId("goal")).toBeInViewport();
  await expect(page.getByTestId("scene-text")).toHaveText(sceneText(getScene(state.sceneId), state).split(/\n\n+/).filter(Boolean).join(""));
  const image = page.getByTestId("scene-illustration").locator("img");
  if (width === 320) await expect(image).toHaveCount(0);
  else { await expect(image).toHaveAttribute("src", sceneIllustration(state.sceneId, state.flags)!.src); await image.scrollIntoViewIfNeeded(); await expect(image.locator("xpath=..")).toHaveAttribute("data-ready", "true"); await image.evaluate((im: HTMLImageElement) => im.decode()); }
  for (const choice of presentChoices(state, getScene(state.sceneId))) {
    const button = page.getByTestId(`choice-${choice.id}`); await expect(button).toBeVisible();
    if (choice.enabled) await expect(button).toBeEnabled(); else { await expect(button).toBeDisabled(); await expect(page.getByTestId("scene")).toContainText(choice.disabledReason!); }
  }
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await saved(page)).toEqual(before); await page.screenshot({path: info.outputPath("scene.png"), fullPage:true});
  await page.reload(); await page.getByTestId("continue-run").click(); expect(await saved(page)).toEqual(before); await exit(page, state);
});

for (const {state, binding, lines} of checkpoints) test(`dramatic voice ${binding.id}: exact actor, words, order and natural completion`, async ({page}) => {
  await page.addInitScript(installAudioReview, {}); await open(page, state, 390, true); const before=await saved(page);
  const prefix=lines.slice(0,lines.findIndex(l=>l.id===binding.id));
  for(const l of prefix) await expect.poll(async()=>(await audio(page)).disposed,{timeout:20000}).toContain(l.id+(l.id.startsWith('voice-campaign-')?'.mp3':'.wav'));
  await expect.poll(async()=>(await audio(page)).started,{timeout:20000}).toContain(binding.id+'.mp3');
  await expect(page.locator('.portrait-frame[data-speaking="true"]')).toHaveAttribute('data-speaker',binding.speaker);
  await expect(page.getByTestId('spoken-quote')).toContainText(binding.text);
  expect((await audio(page)).voiceLevels.find(l=>l.file===binding.id+'.mp3')!.gain).toBe(1);
  await expect.poll(async()=>(await audio(page)).disposed,{timeout:20000}).toContain(binding.id+'.mp3');
  expect(await saved(page)).toEqual(before);await exit(page,state);
});
test('dramatic paragraph/manual/no-art reveals the quote before explicit playback',async({page})=>{
 await page.addInitScript(installAudioReview,{});const {state,binding}=checkpoints.find(c=>c.binding.scene==="pay_yes")!;const art:string[]=[];page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/art/'))art.push(r.url());});await open(page,state,320,true,false,true);expect((await audio(page)).started.filter(f=>f.startsWith('voice-'))).toEqual([]);const before=await saved(page);await keyboardActivate(page,page.getByTestId('show-rest'));expect(await saved(page)).toEqual(before);const voice=page.getByTestId('voice-line');await voice.locator('summary').click();await voice.getByRole('button',{name:'Listen to Quill',exact:true}).click();await expect(page.getByTestId('spoken-quote')).toContainText(binding.text);await voice.getByRole('button',{name:'Stop line',exact:true}).click();await expect(voice).toHaveAttribute('data-playback','idle');expect(art).toEqual([]);
});
for(const [sound,voices]of [[false,100],[true,0]]as const)test(`dramatic respects sound=${sound}, voices=${voices}`,async({page})=>{await page.addInitScript(installAudioReview,{});await open(page,checkpoints.find(c=>c.binding.scene==="pay_yes")!.state,390,sound,true,false,voices);expect((await audio(page)).started.filter(f=>f.startsWith('voice-'))).toEqual([]);await exit(page,checkpoints.find(c=>c.binding.scene==="pay_yes")!.state);});
test('missing dramatic voice leaves exact readable text and working choices',async({page})=>{
 const {state,binding}=checkpoints.find(c=>c.binding.scene==="pay_yes")!;await page.route('**/audio/'+binding.id+'.mp3',r=>r.abort());await open(page,state,390,true);await expect(page.getByTestId('scene-text')).toContainText(binding.text);await expect(page.getByTestId('voice-line')).toContainText('unavailable');await exit(page,state);
});
test('leaving dramatic while its exact quote is loading cancels the late start',async({page})=>{
 const {state,binding}=checkpoints.find(c=>c.binding.scene==="pay_yes")!;await page.addInitScript(installAudioReview,{});let release!:()=>void;const hold=new Promise<void>(r=>release=r);let requested=false;await page.route('**/audio/'+binding.id+'.mp3',async r=>{requested=true;await hold;await r.continue().catch(()=>{});});await open(page,state,390,true);await expect.poll(()=>requested).toBe(true);const choice=presentChoices(state,getScene(state.sceneId)).find(c=>c.enabled&&!c.check)!,next=commitChoice(state,choice).state;const following=visibleCampaignDialogue(next.sceneId,getScene(next.sceneId).speaker,sceneText(getScene(next.sceneId),next))[0];await exit(page,state);release();await expect.poll(async()=>(await audio(page)).disposed,{timeout:20000}).toContain(following.id+'.mp3');expect((await audio(page)).started.filter(f=>f===binding.id+'.mp3')).toEqual([]);
});

test('new Quill performance stops on the explicit manual control',async({page})=>{const {state}=checkpoints.find(c=>c.binding.scene==='pay_yes')!;await open(page,state,390,true,false);const voice=page.getByTestId('voice-line');await voice.locator('summary').click();await voice.getByRole('button',{name:'Listen to Quill',exact:true}).click();await expect(voice).toHaveAttribute('data-playback','playing');await voice.getByRole('button',{name:'Stop line',exact:true}).click();await expect(voice).toHaveAttribute('data-playback','idle');});
