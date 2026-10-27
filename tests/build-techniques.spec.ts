import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { exportRun, importRun } from "../lib/vault";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import { visibleCampaignDialogue } from "../lib/campaign-dialogue";
import { getScene, sceneText } from "../lib/engine";
import type { GameState } from "../lib/types";
const profiles = [
  ["chrome","technique-chrome-portable-label","portable","label"],
  ["ghost","technique-ghost-screened-reference","screened","reference"],
  ["face","technique-face-cosign-process","cosign","process"],
  ["nerve","technique-nerve-fast-rest","fast","rest"],
] as const;
const saved = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
async function open(page:Page,width:number,run:GameState,sound=false){await page.setViewportSize({width,height:900});await page.addInitScript(({run,width,sound})=>{if(!localStorage.getItem("saint-shard-3055-v1"))localStorage.setItem("saint-shard-3055-v1",JSON.stringify(run));localStorage.setItem("saint-shard-preferences",JSON.stringify({sound,artwork:width===320?"none":"full",textStep:width===320?2:0,reading:"all",motion:"reduce",autoVoices:true}));},{run,width,sound});await page.goto("/");await page.getByTestId("continue-run").click();}
const pick=async(page:Page,id:string)=>{await page.getByTestId(`choice-${id}`).click();};
for(const width of [390,1440,320])for(const [stat,file,mode,submit]of profiles)test(`${stat} specialist method preserves costs and boundaries at ${width}px`,async({page})=>{
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));const initial=routeCheckpoint(file,"act2_district_canal","open-build-techniques");await open(page,width,initial);
  await pick(page,"open-build-techniques");const before=await saved(page);await page.getByTestId("technique-builds").locator(":scope > summary").click();expect(await saved(page)).toEqual(before);
  await pick(page,"plan-technique-"+stat);if(stat==="chrome"){await page.getByTestId("technique-record-fields").locator(":scope > summary").click();expect((await saved(page)).flags.district_window_2).toBe(true);}
  if(width!==320){const image=page.getByTestId("scene-illustration").locator("img");await expect(image).toHaveAttribute("src","/art/correction-bench.jpg");await image.evaluate((i:HTMLImageElement)=>i.decode());}else await expect(page.getByTestId("scene-illustration")).toHaveCount(0);
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(stat==="face"){await pick(page,"ask-technique-cosign");expect((await saved(page)).flags.district_window_2).toBe(true);}
  await pick(page,`prepare-technique-${stat}-${mode}`);let run=await saved(page);expect(run.flags.district_window_1).toBe(true);expect(run.creds).toBe(initial.creds);expect(importRun(exportRun(run))).toEqual(run);
  await page.reload();await page.getByTestId("continue-run").click();
  if(stat==="ghost"){const before=await saved(page);await page.getByTestId("technique-envelope").locator(":scope > summary").click();expect(await saved(page)).toEqual(before);}
  if(stat==="nerve"){expect(run.flags.technique_review_reference).toBe(true);await pick(page,"technique-harness-rest");await expect(page.getByTestId("choice-technique-harness-rest")).toHaveCount(0);}else{await pick(page,`submit-technique-${stat}-${submit}`);}
  run=await saved(page);expect(run.flags.technique_review_reference).toBe(true);expect(run.flags.district_window_0).toBe(true);for(const f of ["archive_key_authenticated","nia_public_consent","edda_public_consent"])expect(run.flags[f]).toBe(initial.flags[f]);
  await pick(page,"leave-technique-result");await expect(page.getByTestId("choice-open-build-techniques")).toHaveCount(0);await expect(page.getByTestId("choice-district-register-work")).toHaveCount(0);expect(errors).toEqual([]);
});
for(const checkpoint of [
 ["technique-face-cosign-process","act2_technique_face","prepare-technique-face-cosign"],
 ["technique-face-self-refusal","act2_technique_face","prepare-technique-face-self"],
 ["technique-chrome-portable-label","act2_technique_result","leave-technique-result"],
 ["technique-face-cosign-truth","act2_technique_result","leave-technique-result"],
]as const)test(`automatic specialist speech matches actual ${checkpoint[0]} words and actor`,async({page})=>{
 test.setTimeout(40_000);await page.addInitScript(installAudioReview,{});const run=routeCheckpoint(checkpoint[0],checkpoint[1],checkpoint[2]),scene=getScene(run.sceneId),lines=visibleCampaignDialogue(scene.id,scene.speaker,sceneText(scene,run));await open(page,390,run,true);const widget=page.getByTestId("voice-line");await expect(widget).toHaveCount(1);await expect(widget).toHaveAttribute("aria-label","Dispatcher selected dialogue");await expect.poll(async()=>(await page.evaluate(()=>(window as unknown as {audioReview:AudioReview}).audioReview)).started.filter(n=>n.startsWith("voice-")),{timeout:30_000}).toEqual(lines.map(l=>l.id+".mp3"));await widget.locator("summary").click();for(const l of lines)await expect(widget).toContainText(l.text);expect(await saved(page)).toEqual(run);
});
test("abandoning a voluntary co-sign never restores the waived paid shift",async({page})=>{const run=routeCheckpoint("technique-face-cosign-process","act2_technique_face_scope");await open(page,390,run);await pick(page,"abandon-technique");expect((await saved(page)).flags.technique_work_waived).toBe(true);await expect(page.getByTestId("choice-district-register-work")).toHaveCount(0);await expect(page.getByTestId("choice-district-resume-work")).toHaveCount(0);await pick(page,"district-close");});
