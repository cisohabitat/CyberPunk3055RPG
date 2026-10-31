import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { routeCheckpoint } from '../qa/production/route-checkpoint';
import { getScene, sceneText, presentChoices, commitChoice } from '../lib/engine';
import { districtRemaining } from '../lib/district-response';
import { visibleCampaignDialogue } from '../lib/campaign-dialogue';
import { keyboardActivate } from '../qa/production/keyboard';
import { installAudioReview, type AudioReview } from '../qa/production/audio-review';
import type { GameState } from '../lib/types';
const stateFor=(stat:string)=>routeCheckpoint(`consequential-methods/${stat}-public-work`,`act2_technique_${stat}`);
const action=(stat:string)=>stat==='chrome'?'consequential-probe-intake':'consequential-public-intake';
const choose=(s:GameState,id:string)=>{const c=presentChoices(s,getScene(s.sceneId)).find(c=>c.id===id&&c.enabled)!;expect(c).toBeTruthy();return commitChoice(s,c).state;};
const saved=(p:Page)=>p.evaluate(()=>JSON.parse(localStorage.getItem('saint-shard-3055-v1')!));
async function open(page:Page,state:GameState,width=390,sound=false){
 await page.setViewportSize({width,height:900});
 await page.addInitScript(({state,width,sound})=>{if(!localStorage.getItem('saint-shard-3055-v1'))localStorage.setItem('saint-shard-3055-v1',JSON.stringify(state));localStorage.setItem('saint-shard-preferences',JSON.stringify({sound,autoVoices:sound,voices:100,artwork:width===320?'none':'full',reading:'all',textStep:width===320?2:0,contrast:'high',motion:'reduce'}));},{state,width,sound});
 await page.goto('/');await page.getByTestId('continue-run').click();await expect(page.getByTestId('goal')).toBeVisible();
}
async function layout(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);}
for(const stat of ['chrome','face'])for(const width of [320,390,1440]){
 test(`consequential ${stat} commitment: exact costs, retained kit and reload at ${width}`,async({page})=>{
  const s=stateFor(stat);await open(page,s,width);await expect(page.getByTestId('scene-text')).toHaveText(sceneText(getScene(s.sceneId),s).split(/\n\n+/).filter(Boolean).join(""));await layout(page);
  const button=page.getByTestId('choice-'+action(stat));await expect(button).toContainText(stat==='chrome'?'Strain +2':'Helion +2');expect(await saved(page)).toEqual(s);
  await keyboardActivate(page,button);const expected=choose(s,action(stat));await expect.poll(()=>saved(page)).toEqual(expected);expect(districtRemaining(expected)).toBe(1);expect(expected.items).toEqual(s.items);
  await page.reload();await page.getByTestId('continue-run').click();expect(await saved(page)).toEqual(expected);await layout(page);
 });
 test(`consequential ${stat} short task: eight once, no full wage at ${width}`,async({page})=>{
  const s=choose(choose(stateFor(stat),action(stat)),'leave-technique-result');await open(page,s,width);await keyboardActivate(page,page.getByTestId('choice-consequential-short-shift'));
  const expected=choose(s,'consequential-short-shift');await expect.poll(()=>saved(page)).toEqual(expected);expect(expected.creds-s.creds).toBe(8);expect(expected.flags.district_work_paid).toBeUndefined();
  await expect(page.getByTestId('choice-consequential-short-shift')).toHaveCount(0);await page.reload();await page.getByTestId('continue-run').click();expect(await saved(page)).toEqual(expected);await layout(page);
 });
}
for(const stat of ['chrome','face'])test(`consequential ${stat} retains exact original actor/voice through the new intake`,async({page})=>{
 await page.addInitScript(installAudioReview,{});const s=stateFor(stat);await open(page,s,390,true);const audio=()=>page.evaluate(()=>(window as unknown as {audioReview:AudioReview}).audioReview);
 const lines=visibleCampaignDialogue(s.sceneId,getScene(s.sceneId).speaker,sceneText(getScene(s.sceneId),s));expect(lines.length).toBeGreaterThan(0);const b=lines[0],file=b.id+(b.id.startsWith('voice-campaign-')?'.mp3':'.wav');
 await expect.poll(async()=>(await audio()).started,{timeout:20000}).toContain(file);await expect(page.locator('.portrait-frame[data-speaking="true"]')).toHaveAttribute('data-speaker',b.speaker);await expect(page.getByTestId('spoken-quote')).toContainText(b.text);
 await keyboardActivate(page,page.getByTestId('choice-'+action(stat)));const next=choose(s,action(stat));await expect.poll(()=>saved(page)).toEqual(next);
 const r=visibleCampaignDialogue(next.sceneId,getScene(next.sceneId).speaker,sceneText(getScene(next.sceneId),next))[0],rf=r.id+(r.id.startsWith('voice-campaign-')?'.mp3':'.wav');await expect.poll(async()=>(await audio()).started,{timeout:20000}).toContain(rf);await expect(page.getByTestId('spoken-quote')).toContainText(r.text);await expect.poll(async()=>(await audio()).disposed,{timeout:20000}).toContain(rf);expect(await saved(page)).toEqual(next);
});
test('consequential private Face keeps the public method unavailable',async({page})=>{const s=routeCheckpoint('consequential-methods/face-private','act2_technique_face');await open(page,s);await expect(page.getByTestId('choice-consequential-public-intake')).toHaveCount(0);await expect(page.getByTestId('choice-prepare-technique-face-self')).toBeEnabled();expect(await saved(page)).toEqual(s);});
test('consequential high strain leaves the safe named diagnostic available',async({page})=>{const s={...stateFor('chrome'),strain:4};await open(page,s);await expect(page.getByTestId('choice-consequential-probe-intake')).toBeDisabled();await expect(page.getByTestId('choice-prepare-technique-chrome-counter')).toBeEnabled();expect(await saved(page)).toEqual(s);});
test('consequential missing kit at zero creds keeps a legal method',async({page})=>{const s={...stateFor('chrome'),creds:0,items:stateFor('chrome').items.filter(i=>i!=='archive-probe')};await open(page,s);await expect(page.getByTestId('choice-consequential-probe-intake')).toHaveCount(0);await expect(page.getByTestId('choice-prepare-technique-chrome-counter')).toBeEnabled();expect(await saved(page)).toEqual(s);});
test('consequential stopping retains public exposure and pays no unworked wage',async({page})=>{const s=choose(choose(stateFor('face'),action('face')),'leave-technique-result');await open(page,s);await keyboardActivate(page,page.getByTestId('choice-district-close'));const expected=choose(s,'district-close');await expect.poll(()=>saved(page)).toEqual(expected);expect(expected.creds).toBe(s.creds);expect(expected.flags.technique_filing_signed).toBe(true);expect(districtRemaining(expected)).toBe(0);});
