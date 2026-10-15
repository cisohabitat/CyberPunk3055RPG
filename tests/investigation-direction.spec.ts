import { test,expect,type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { createCharacter,getScene,sceneText } from "../lib/engine";
import type { GameState } from "../lib/types";
import { installAudioReview,type AudioReview } from "../qa/production/audio-review";
import phase from "../qa/media/archive-hearing.json";
async function open(page:Page,state:GameState,preferences={}){
 await page.addInitScript(({state,preferences})=>{
  if(!localStorage.getItem("saint-shard-3055-v1"))localStorage.setItem("saint-shard-3055-v1",JSON.stringify(state));
  localStorage.setItem("saint-shard-preferences",JSON.stringify({sound:false,reading:"all",motion:"reduce",...preferences}));
 },{state,preferences});await page.goto("/");await page.getByTestId("continue-run").click();
}
const saved=(page:Page)=>page.evaluate(()=>localStorage.getItem("saint-shard-3055-v1"));
const audio=(page:Page):Promise<AudioReview>=>page.evaluate(()=>(window as unknown as {audioReview:AudioReview}).audioReview);
const words=(text:string)=>text.match(/[\p{L}\p{N}]+/gu)??[];
for(const [width,artwork,textStep]of [[390,"full",0],[1440,"full",0],[320,"none",2]]as const)test(`ten investigation conversations lead with their canonical text at ${width}px`,async({browser,baseURL})=>{
 test.setTimeout(120_000);
 for(const row of phase.scenes){const context=await browser.newContext({baseURL,viewport:{width,height:900}});
 try{const page=await context.newPage(),requests:string[]=[];page.on("request",r=>{if(r.url().includes("/art/"))requests.push(r.url())});const state=routeCheckpoint(row.route,row.sceneId);
  await open(page,state,{artwork,textStep,contrast:textStep?"high":"standard"});const before=await saved(page),stage=page.getByTestId("investigation-scene"),prose=page.getByTestId("scene-text");
  await expect(stage).toHaveAttribute("aria-label",row.label);await expect(prose).toHaveCount(1);
  expect(await prose.locator("p").allTextContents()).toEqual(sceneText(getScene(row.sceneId),state).split(/\n\n+/).filter(Boolean));
  const goal=(await page.getByTestId("goal").boundingBox())!;expect(goal.y+goal.height).toBeLessThan(900);
  if(!textStep)expect((await prose.boundingBox())!.y).toBeLessThan(650);
  if(artwork==="full"){
   const image=stage.locator("img"),copy=(await stage.locator(".pivotal-copy").boundingBox())!;await expect(image).toHaveAttribute("src",row.illustration);await image.scrollIntoViewIfNeeded();await expect.poll(()=>image.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
   expect(await image.evaluate(img=>getComputedStyle(img).objectFit)).toBe("contain");const box=(await image.boundingBox())!;expect(box.width/box.height).toBeCloseTo(1.5,1);
   if(width>=900)expect(box.x).toBeLessThan(copy.x);else expect(box.y+await page.evaluate(()=>scrollY)).toBeGreaterThan(copy.y+copy.height);
  }else{await expect(page.locator("img")).toHaveCount(0);expect(requests).toEqual([]);}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await saved(page)).toBe(before);
  if(row.sceneId==="act3_testimony_hearing")expect((await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze()).violations).toEqual([]);
  await expect(page.locator("[data-testid^='choice-']").first()).toBeVisible();
 }finally{await context.close();}}
});

test("missing new art and paragraph pacing preserve the actual secondary speaker",async({page})=>{
 const state=routeCheckpoint("balance-dustline-nerve-equipped","act2_witness_safe");
 await page.route("**/art/nia-arrival*.jpg",route=>route.abort());await open(page,state,{reading:"paragraph"});const before=await saved(page);
 await expect(page.getByTestId("scene-text").locator("p")).toHaveCount(1);await expect(page.getByTestId("voice-line")).toHaveCount(0);
 await page.getByTestId("next-paragraph").click();await expect(page.getByTestId("voice-line")).toContainText("Nia Pell");await page.getByTestId("show-rest").click();
 await expect(page.getByTestId("investigation-scene").locator(".art-unavailable")).toBeVisible();expect(await saved(page)).toBe(before);
 await page.getByTestId("choice-file-account").click();await expect(page.getByTestId("investigation-scene")).toHaveCount(0);
});

for(const performance of phase.performances)test(`revised performance finishes with exact visible actor and words: ${performance.id}`,async({page})=>{
 test.setTimeout(60_000);await page.addInitScript(installAudioReview,{});
 const scene=performance.speaker==="Edda"?"act2_archive_custody":"act2_witness_safe",route=performance.speaker==="Edda"?"pacing-signed-face":"balance-dustline-nerve-equipped";
 await open(page,routeCheckpoint(route,scene),{sound:true,autoVoices:false,music:40,ambience:30,effects:0,voices:70});const before=await saved(page);
 const voice=page.getByTestId("voice-line");await voice.locator("summary").click();
 const binding=phase.scenes.find(row=>row.sceneId===scene)!.dialogue.find(line=>line.id===performance.id);
 // The signed-source branch contains the extra warning absent from the baseline row.
 const select=page.getByLabel("Dialogue line",{exact:true});
 if(binding)await select.selectOption(binding.key);else await select.selectOption({label:(await select.locator("option").allTextContents()).find(label=>label.includes(performance.text.slice(0,45)))!});
 await page.getByRole("button",{name:`Listen to ${performance.speaker}`,exact:true}).click();
 const mark=page.getByTestId("spoken-quote");await expect(mark).toHaveAttribute("data-speaker",performance.speaker);
 await expect.poll(()=>mark.textContent().then(text=>words(text!))).toEqual(words(performance.text));
 await expect(page.locator(".portrait-frame[data-speaking='true']")).toHaveAttribute("data-speaker",performance.speaker);
 await expect.poll(()=>audio(page).then(r=>r.started)).toContain(`${performance.id}.mp3`);
 await expect.poll(()=>audio(page).then(r=>r.disposed),{timeout:30_000}).toContain(`${performance.id}.mp3`);
 await expect(mark).toHaveCount(0);expect(await saved(page)).toBe(before);
});

for(const [route,scene,choice,file,roll]of [
 ["pacing-signed-face","act2_archive_custody","withhold-technician","foley-paper.wav",0],
 ["finale-witness-corrected","act3_testimony_record","withdraw-public-account","foley-paper.wav",0],
 ["finale-listed-archive","act3_arrival","let-ives","foley-folio.wav",0],
 ["","act2_witness_plan","steady-chair","foley-chair.wav",1],
]as const)test(`physical sound follows only the committed action: ${choice}`,async({page})=>{
 await page.addInitScript(installAudioReview,{});
 const state=route?routeCheckpoint(route,scene,scene==="act3_arrival"?choice:undefined):{...createCharacter({handle:"Chair review",givenName:"Jo",origin:"spire",bonus:{chrome:2,nerve:0,face:0,ghost:0}}),sceneId:scene};
 await open(page,state,{sound:true,autoVoices:false,music:0,ambience:0});expect((await audio(page)).started.filter(f=>f.startsWith("foley-"))).toEqual([]);
 await page.getByTestId(`choice-${choice}`).click();if(roll){await page.evaluate(()=>{Math.random=()=>0});await page.getByTestId("roll-button").click();await expect(page.getByTestId("continue-check")).toBeVisible();expect((await audio(page)).started.filter(f=>f.startsWith("foley-"))).toEqual([]);await page.getByTestId("continue-check").click();}
 await expect.poll(()=>audio(page).then(r=>r.started.filter(f=>f.startsWith("foley-")))).toEqual([file]);await expect.poll(()=>audio(page).then(r=>r.disposed)).toContain(file);
 const after=await saved(page);await page.reload();await page.getByTestId("continue-run").click();expect(await saved(page)).toBe(after);expect((await audio(page)).started.filter(f=>f.startsWith("foley-"))).toEqual([]);
});
