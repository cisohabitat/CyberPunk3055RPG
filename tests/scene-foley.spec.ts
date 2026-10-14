import { test, expect, type Page } from '@playwright/test';
import { createCharacter } from '../lib/engine';
import { installAudioReview, type AudioReview } from '../qa/production/audio-review';
import type { GameState } from '../lib/types';
const base=createCharacter({handle:'Sound review',givenName:'Jo',origin:'spire',bonus:{chrome:2,nerve:0,face:0,ghost:0}});
const audio=(page:Page):Promise<AudioReview>=>page.evaluate(()=>(window as unknown as {audioReview:AudioReview}).audioReview);
const saved=(page:Page)=>page.evaluate(()=>JSON.parse(localStorage.getItem('saint-shard-3055-v1')!));
async function open(page:Page,state:GameState,preferences={}) {
  await page.addInitScript(installAudioReview,{});
  await page.addInitScript(({state,preferences})=>{
    if(!localStorage.getItem('saint-shard-3055-v1'))localStorage.setItem('saint-shard-3055-v1',JSON.stringify(state));
    localStorage.setItem('saint-shard-preferences',JSON.stringify({reading:'all',sound:true,autoVoices:false,music:0,ambience:0,motion:'reduce',...preferences}));
  },{state,preferences});
  await page.goto('/');await page.getByTestId('continue-run').click();
}
for(const [sceneId,choice,filename,flag] of [
  ['memory_table','inspect-order','foley-viewer.wav','memory_order'],
  ['act2_freight_sources','inspect-freight-seal','foley-case.wav','freight_seal'],
  ['act3_testimony_consent','keep-recording-private','foley-recorder.wav','testimony_no_quote'],
] as const) test(`action sound ${filename} follows the actual choice and does not replay after reload`,async({page})=>{
  const state={...base,sceneId,flags:{freight_started:true,testimony_bounded:true}};
  await open(page,state);
  expect((await audio(page)).started.filter(f=>f.startsWith('foley-'))).toEqual([]);
  await page.getByTestId(`choice-${choice}`).click();
  await expect.poll(async()=>(await audio(page)).started.filter(f=>f.startsWith('foley-'))).toEqual([filename]);
  await expect.poll(async()=>(await audio(page)).disposed).toContain(filename);
  const after=await saved(page);expect(after.flags[flag]).toBe(true);
  expect(after.flags.freight_delivered).toBeUndefined();expect(after.flags.archive_key_authenticated).toBeUndefined();expect(after.flags.testimony_published).toBeUndefined();
  await page.reload();await page.getByTestId('continue-run').click();
  expect((await audio(page)).started.filter(f=>f.startsWith('foley-'))).toEqual([]);expect(await saved(page)).toEqual(after);
});

test('the reader plays only after committing the held die; a failed query remains unauthenticated',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;});
  await open(page,{...base,sceneId:'act2_archive_door'});
  await page.getByTestId('choice-trace-receipt').click();await page.getByTestId('roll-button').click();
  await expect(page.getByTestId('continue-check')).toBeVisible();
  const held=await saved(page);expect(held.pendingCheck.roll).toBe(1);
  expect((await audio(page)).started.filter(f=>f.startsWith('foley-'))).toEqual([]);
  await page.reload();await page.getByTestId('continue-run').click();
  await page.getByTestId('continue-check').click();
  await expect.poll(async()=>(await audio(page)).started).toContain('foley-reader.wav');
  await expect.poll(async()=>(await audio(page)).disposed).toContain('foley-reader.wav');
  const after=await saved(page);expect(after.sceneId).toBe('act2_archive_gap');expect(after.flags.archive_key_authenticated).toBeUndefined();expect(after.rolls.at(-1).roll).toBe(1);expect(after.pendingCheck).toBeUndefined();
});

for(const preferences of [{sound:false},{effects:0}])test(`scene sounds respect saved ${JSON.stringify(preferences)}`,async({page})=>{
  const requests:string[]=[];page.on('request',r=>{if(r.url().includes('/audio/foley-'))requests.push(r.url());});
  await open(page,{...base,sceneId:'memory_table'},preferences);
  await page.getByTestId('choice-inspect-order').click();expect((await saved(page)).flags.memory_order).toBe(true);
  expect(requests).toEqual([]);expect((await audio(page)).sceneCueLevels).toEqual([]);
});

for(const interrupt of ['dialog','departure','pagehide','zero-effects'] as const)test(`a delayed scene cue cancels on ${interrupt} and never starts later`,async({page})=>{
  let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/audio/foley-viewer.wav',async route=>{const response=await route.fetch();await gate;await route.fulfill({response});});
  await open(page,{...base,sceneId:'memory_table',flags:{memory_signature:true,memory_roster:true}});
  const requested=page.waitForRequest('**/audio/foley-viewer.wav');await page.getByTestId('choice-inspect-order').click();await requested;
  if(interrupt==='departure')await page.getByTestId('choice-reconstruct').click();
  else if(interrupt==='pagehide')await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  else {
    await page.getByRole('button',{name:'Settings',exact:true}).click();
    if(interrupt==='zero-effects'){await page.getByLabel('effects volume').focus();await page.keyboard.press('Home');await page.getByRole('button',{name:'Done',exact:true}).click();}
  }
  release();await expect.poll(async()=>(await audio(page)).decoded).toContain('foley-viewer.wav');
  expect((await audio(page)).started).not.toContain('foley-viewer.wav');
  if(interrupt==='dialog')await page.getByRole('button',{name:'Done',exact:true}).click();
  if(interrupt==='pagehide')await page.getByRole('button',{name:'Resume sound',exact:true}).click();
  expect((await audio(page)).started).not.toContain('foley-viewer.wav');
});

test('the recorder stays below the actual speaking actor and disposes without changing the source account',async({page})=>{
  let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/audio/foley-recorder.wav',async route=>{const response=await route.fetch();await gate;await route.fulfill({response});});
  await open(page,{...base,sceneId:'act3_testimony_consent',flags:{testimony_bounded:true}},{autoVoices:true});
  await page.getByTestId('choice-keep-recording-private').click();
  await expect(page.getByTestId('spoken-quote')).toHaveAttribute('data-speaker','Ives');
  const before=await saved(page);release();
  await expect.poll(async()=>(await audio(page)).sceneCueLevels.length).toBe(1);
  expect((await audio(page)).sceneCueLevels[0].gain).toBeCloseTo(.5*.35,6);
  await expect.poll(async()=>(await audio(page)).disposed).toContain('foley-recorder.wav');
  expect(await saved(page)).toEqual(before);expect(before.flags.nia_public_consent).toBeUndefined();
  await expect(page.locator('img.portrait')).toHaveAttribute('src','/art/ives-questioning.jpg');
  await expect(page.getByTestId('goal')).toBeInViewport();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('opening a dialog stops an already-playing recorder and frees its buffer',async({page})=>{
  await open(page,{...base,sceneId:'act3_testimony_consent',flags:{testimony_bounded:true}});
  await page.getByTestId('choice-keep-recording-private').click();
  await expect.poll(async()=>(await audio(page)).started).toContain('foley-recorder.wav');
  await page.getByRole('button',{name:'Settings',exact:true}).click();
  await expect.poll(async()=>(await audio(page)).stoppedSources).toContain('foley-recorder.wav');
  expect((await audio(page)).cleared).toContain('foley-recorder.wav');
  await page.getByRole('button',{name:'Done',exact:true}).click();
  expect((await audio(page)).started.filter(f=>f==='foley-recorder.wav')).toHaveLength(1);
});

test('an unavailable scene effect leaves the inspected source, choices and save usable',async({page})=>{
  await page.route('**/audio/foley-viewer.wav',route=>route.abort());
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await open(page,{...base,sceneId:'memory_table',flags:{memory_signature:true,memory_roster:true}});
  await page.getByTestId('choice-inspect-order').click();
  await expect(page.getByTestId('choice-reconstruct')).toBeVisible();
  expect((await saved(page)).flags.memory_order).toBe(true);
  await page.getByTestId('choice-reconstruct').click();
  expect((await saved(page)).sceneId).toBe('memory_reconstruction');
  expect(errors).toEqual([]);expect((await audio(page)).started.filter(f=>f.startsWith('foley-'))).toEqual([]);
});
