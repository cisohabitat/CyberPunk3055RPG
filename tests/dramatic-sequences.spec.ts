import {test,expect,type Page}from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {SEQUENCE_CHECKPOINTS}from '../qa/production/dramatic-sequences-checkpoints';
import {getScene,sceneText,presentChoices,commitChoice}from '../lib/engine';
import {visibleCampaignDialogue}from '../lib/campaign-dialogue';
import {installAudioReview,type AudioReview}from '../qa/production/audio-review';
import type{GameState}from '../lib/types';
async function open(page:Page,state:GameState,width:number,artwork='full',sound=false){
 await page.setViewportSize({width,height:900});await page.addInitScript(({state,artwork,sound})=>{if(!localStorage.getItem('saint-shard-3055-v1'))localStorage.setItem('saint-shard-3055-v1',JSON.stringify(state));localStorage.setItem('saint-shard-preferences',JSON.stringify({artwork,sound,autoVoices:sound,voices:100,reading:'all',textStep:2,contrast:'high',motion:'reduce'}));},{state,artwork,sound});await page.goto('/');await page.getByTestId('continue-run').click();await expect(page.getByTestId('goal')).toBeVisible();
}
const saved=(p:Page)=>p.evaluate(()=>localStorage.getItem('saint-shard-3055-v1'));
for(const width of [320,390,1440])for(const{rule,state}of SEQUENCE_CHECKPOINTS)test(`sequence ${rule.id}: enlarged full scene, paired art and legal exit at ${width}`,async({page},info)=>{
 await open(page,state,width);const before=await saved(page);await expect(page.getByTestId('scene-text')).toHaveText(sceneText(getScene(state.sceneId),state).split(/\n\n+/).filter(Boolean).join(''));
 const figure=page.getByTestId('scene-illustration'),im=figure.locator('img');await expect(im).toHaveAttribute('src',rule.illustration.src);await expect(im).toHaveAttribute('alt',rule.illustration.description);await im.scrollIntoViewIfNeeded();await expect(im.locator('xpath=..')).toHaveAttribute('data-ready','true');await im.evaluate((im:HTMLImageElement)=>im.decode());await expect(figure).toContainText(rule.illustration.caption);
 await figure.getByRole('button',{name:/View artwork/}).click();const modal=page.getByRole('dialog');await expect(modal).toBeVisible();await expect(modal.locator('img')).toHaveAttribute('src',rule.illustration.src);await page.keyboard.press('Escape');await expect(modal).toHaveCount(0);
 expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await saved(page)).toEqual(before);await page.screenshot({path:info.outputPath('scene.png'),fullPage:true});
 await page.reload();await page.getByTestId('continue-run').click();expect(await saved(page)).toEqual(before);const c=presentChoices(state,getScene(state.sceneId)).find(c=>c.enabled&&!c.check)!;await page.getByTestId('choice-'+c.id).click();await expect.poll(async()=>JSON.parse((await saved(page))!)).toEqual(commitChoice(state,c).state);
});
for(const{rule,state}of SEQUENCE_CHECKPOINTS)test(`sequence ${rule.id}: text-only makes no art requests`,async({page})=>{
 const art:string[]=[];page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/art/'))art.push(r.url());});await open(page,state,320,'none');await expect(page.getByTestId('scene-illustration')).toHaveCount(0);await expect(page.getByTestId('scene-text')).toContainText(sceneText(getScene(state.sceneId),state).split('\n\n')[0]);expect(art).toEqual([]);
});
for(const{rule,state}of SEQUENCE_CHECKPOINTS)test(`sequence ${rule.id}: missing art retains description and actions`,async({page})=>{
 await page.route('**/art/sequence-*',r=>r.abort());await open(page,state,390);await page.getByTestId('scene-illustration').scrollIntoViewIfNeeded();await expect(page.getByTestId('scene-illustration')).toHaveAttribute('data-unavailable','true');await expect(page.getByTestId('scene-illustration')).toContainText(rule.illustration.description);await expect(page.getByTestId('scene-text')).toContainText(sceneText(getScene(state.sceneId),state).split('\n\n')[0]);
});
for(const{rule,state}of SEQUENCE_CHECKPOINTS)test(`sequence ${rule.id}: exact existing voice and actor finish naturally`,async({page})=>{
 await page.addInitScript(installAudioReview,{});await open(page,state,390,'full',true);const before=await saved(page);const lines=visibleCampaignDialogue(state.sceneId,getScene(state.sceneId).speaker,sceneText(getScene(state.sceneId),state));expect(lines.length).toBeGreaterThan(0);const audio=()=>page.evaluate(()=>(window as unknown as{audioReview:AudioReview}).audioReview);
 for(const line of lines){const file=line.id+(line.id.startsWith('voice-campaign-')?'.mp3':'.wav');await expect.poll(async()=>(await audio()).disposed,{timeout:20000}).toContain(file);expect(line.speaker).toBe(rule.actor);}
 expect(await saved(page)).toEqual(before);expect((await audio()).started.filter(f=>f.startsWith('voice-'))).toEqual(lines.map(l=>l.id+(l.id.startsWith('voice-campaign-')?'.mp3':'.wav')));
});
for(const{rule,state}of SEQUENCE_CHECKPOINTS)test(`sequence ${rule.id}: gallery keeps the exact full painting behind spoiler consent`,async({page})=>{
 await page.addInitScript(state=>{localStorage.setItem('saint-shard-3055-v1',JSON.stringify(state));localStorage.setItem('saint-shard-preferences',JSON.stringify({sound:false,artwork:'full',motion:'reduce'}));},state);await page.goto('/artwork');await expect(page.getByTestId('gallery-grid')).toHaveCount(0);const before=await saved(page);await page.getByRole('button',{name:'Open full gallery',exact:true}).click();await page.getByLabel('Search artwork',{exact:true}).fill(rule.illustration.caption);await page.locator(`[data-art-src="${rule.illustration.src}"]`).click();await expect(page.getByRole('dialog').locator('img')).toHaveAttribute('src',rule.illustration.src);await page.getByRole('dialog').locator('img').evaluate((im:HTMLImageElement)=>im.decode());await page.keyboard.press('Escape');expect(await saved(page)).toEqual(before);
});
