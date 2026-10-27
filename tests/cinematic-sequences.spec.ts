import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import { installSequenceAudioReview, type SequenceAudioReview } from "../qa/production/sequence-audio-review";
import { cinematicDetail, cinematicSequence, dialoguePause } from "../lib/cinematic-sequences";
import { commitChoice, presentChoices, getScene, sceneText } from "../lib/engine";
import { visibleCampaignDialogue } from "../lib/campaign-dialogue";
import { BED_FOCUS } from "../lib/pivotal-scenes";
import phase from "../qa/media/cinematic-sequences.json";
const saved=(page:Page)=>page.evaluate(()=>localStorage.getItem("saint-shard-3055-v1"));
async function clearRoutes(page: Page) {
 try { await page.unrouteAll({ behavior: "ignoreErrors" }); }
 catch (error) { if (!page.isClosed()) throw error; }
}
async function open(page:Page,sceneId:string,width=390,sound=false,paragraph=false){const example=phase.baseline.examples.find(e=>e.sceneId===sceneId)!;let run=routeCheckpoint(example.route,example.checkpointSceneId ?? sceneId,example.choiceId);if(example.forceChoiceId && example.forceRoll !== undefined){const choice=presentChoices(run,getScene(run.sceneId)).find(c=>c.id===example.forceChoiceId&&c.enabled)!;run=commitChoice(run,choice,{roll:example.forceRoll}).state;}await page.setViewportSize({width,height:900});await page.addInitScript(({run,width,sound,paragraph})=>{if(!localStorage.getItem("saint-shard-3055-v1"))localStorage.setItem("saint-shard-3055-v1",JSON.stringify(run));localStorage.setItem("saint-shard-preferences",JSON.stringify({sound,autoVoices:true,artwork:width===320?"none":"full",reading:paragraph?"paragraph":"all",textStep:width===320?2:0,motion:"reduce"}));},{run,width,sound,paragraph});await page.goto("/");await page.getByTestId("continue-run").click();return run;}
for(const width of [390,1440,320])for(const example of phase.baseline.examples)test(`${example.sceneId} preserves state, source and shot scope at ${width}px`,async({page})=>{
 await open(page,example.sceneId,width);const before=await saved(page);await expect(page.getByTestId("goal")).toBeInViewport();const shots=page.getByTestId("sequence-shots"),detail=cinematicDetail(example.sceneId);
 if(width===320){await expect(shots).toHaveCount(0);await expect(page.getByTestId("scene-illustration")).toHaveCount(0);}else if(detail){await expect(shots).toHaveCount(1);await shots.getByRole("button",{name:"Detail",exact:true}).click();const image=page.getByTestId("scene-illustration").locator("img");await expect(image).toHaveAttribute("src",detail.src);await image.evaluate((i:HTMLImageElement)=>i.decode());await expect(shots.getByRole("button",{name:"Detail",exact:true})).toHaveAttribute("aria-pressed","true");await shots.getByRole("button",{name:"Scene",exact:true}).click();await expect(image).toHaveAttribute("src",example.defaultArt!);}else await expect(shots).toHaveCount(0);
 expect(await saved(page)).toBe(before);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);if(example.sceneId==="memo")expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);

});
test("a detail view preserves paragraph reveal and resets to the next scene's establishing shot",async({page})=>{await open(page,"memo",390,false,true);const before=await saved(page);const paragraphs=await page.locator(".prose p").count();await page.getByTestId("sequence-shots").getByRole("button",{name:"Detail",exact:true}).click();expect(await page.locator(".prose p").count()).toBe(paragraphs);expect(await saved(page)).toBe(before);await page.getByTestId("show-rest").click();await page.getByTestId("choice-heard").click();await expect(page.getByTestId("sequence-shots").getByRole("button",{name:"Scene",exact:true})).toHaveAttribute("aria-pressed","true");await expect(page.getByTestId("scene-illustration").locator("img")).toHaveAttribute("src","/art/mara-revelation.jpg");});
for(const sceneId of ["memo","kerr","act2_witness_arrival","act3_arrival"])test(`directed performance retains exact voices and measured bus mix in ${sceneId}`,async({page})=>{
 test.setTimeout(50_000);
 // This test measures overlapping buses, not cold score-download latency.
 // Hold automatic dialogue until the actual music/room sources have started.
 // Keep the original 5s numeric assertions and 50s overall case limit below.
 let releaseVoices!: () => void;
 const bedsReady = new Promise<void>(resolve => { releaseVoices = resolve; });
 await page.route(/\/audio\/voice-/, async route => { await bedsReady; await route.continue(); });
 await page.addInitScript(installAudioReview,{});await page.addInitScript(installSequenceAudioReview);
 const run=await open(page,sceneId,390,true),before=await saved(page),scene=getScene(sceneId),lines=visibleCampaignDialogue(sceneId,scene.speaker,sceneText(scene,run)),sequence=cinematicSequence(sceneId)!;
 try {
 await page.waitForFunction(() => { const mix = (window as unknown as {sequenceAudioReview:SequenceAudioReview}).sequenceAudioReview.sample(); return Number.isFinite(mix.music) && Number.isFinite(mix.ambience); });
 // Actual bus observations must survive collection of native JS wrappers.
 await page.requestGC();
 releaseVoices();
 const widget=page.getByTestId("voice-line");await expect(widget).toHaveCount(1);await expect(widget).toHaveAttribute("data-playback","playing");
 await expect.poll(()=>page.evaluate(()=>(window as unknown as{sequenceAudioReview:SequenceAudioReview}).sequenceAudioReview.sample().music)).toBeCloseTo(.6*BED_FOCUS[sequence.focus].music*.22,5);
 const mix=await page.evaluate(()=>(window as unknown as{sequenceAudioReview:SequenceAudioReview}).sequenceAudioReview.sample());expect(mix.ambience).toBeCloseTo(.5*BED_FOCUS[sequence.focus].ambience*.44,5);expect(mix.voices).toBeCloseTo(.7,5);
 const shots=page.getByTestId("sequence-shots");if(await shots.count())await shots.getByRole("button",{name:"Detail",exact:true}).click();
 await expect.poll(async()=>(await page.evaluate(()=>(window as unknown as{audioReview:AudioReview}).audioReview)).started.filter(n=>n.startsWith("voice-")),{timeout:35_000}).toEqual(lines.map(l=>l.id+(l.id.startsWith("voice-campaign-")?".mp3":".wav")));
 const rows=await page.evaluate(()=>(window as unknown as{sequenceAudioReview:SequenceAudioReview}).sequenceAudioReview.rows.filter(r=>r.file.startsWith("voice-")));
 for(let i=1;i<rows.length;i++){expect(rows[i-1].endedAtMs).toBeDefined();const gap=rows[i].atMs-rows[i-1].endedAtMs!;expect(gap).toBeGreaterThanOrEqual(dialoguePause(sceneId,lines[i-1].speaker,lines[i].speaker)-20);}
 await widget.locator("summary").click();for(const l of lines)await expect(widget).toContainText(l.text);expect(await saved(page)).toBe(before);await widget.getByRole("button",{name:/Stop line/}).click();await expect(widget).toHaveAttribute("data-playback","idle");
 } finally { releaseVoices(); await clearRoutes(page); }
});


test("cold score loading does not hold speech, choices or saved state", async ({ page }) => {
 let releaseScore!: () => void;
 const scoreReady = new Promise<void>(resolve => { releaseScore = resolve; });
 await page.route("**/audio/theme*.flac", async route => { await scoreReady; await route.continue(); });
 await page.addInitScript(installAudioReview, {}); await page.addInitScript(installSequenceAudioReview);
 try {
  const state = await open(page, "kerr", 390, true), before = await saved(page);
  const scene = getScene("kerr"), lines = visibleCampaignDialogue("kerr", scene.speaker, sceneText(scene, state));
  const voice = page.getByTestId("voice-line");
  await expect(voice).toHaveAttribute("data-playback", "playing");
  await expect(page.getByTestId("goal")).toBeInViewport();
  await expect(page.locator(".choices button").first()).toBeEnabled();
  await expect(voice).toHaveAttribute("data-playback", "idle", { timeout: 15_000 });
  const playback = await page.evaluate(() => (window as unknown as {audioReview:AudioReview}).audioReview);
  expect(playback.started.filter(file => file.startsWith("voice-"))).toEqual(lines.map(line => `${line.id}${line.id.startsWith("voice-campaign-") ? ".mp3" : ".wav"}`));
  expect(playback.started.some(file => /^theme.*\.flac$/.test(file))).toBe(false);
  const rows = await page.evaluate(() => (window as unknown as {sequenceAudioReview:SequenceAudioReview}).sequenceAudioReview.rows.filter(row => row.file.startsWith("voice-")));
  expect(rows.every(row => row.endedAtMs !== undefined)).toBe(true);
  expect(await saved(page)).toBe(before);
  releaseScore();
  await expect.poll(() => page.evaluate(() => (window as unknown as {sequenceAudioReview:SequenceAudioReview}).sequenceAudioReview.sample().music)).toBeCloseTo(.6 * BED_FOCUS[cinematicSequence("kerr")!.focus].music, 5);
  expect(await saved(page)).toBe(before);
 } finally { releaseScore(); await clearRoutes(page); }
});
