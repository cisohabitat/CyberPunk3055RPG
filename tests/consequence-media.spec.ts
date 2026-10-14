import { test, expect, type Page } from '@playwright/test';
import { createCharacter } from '../lib/engine';
import type { GameState } from '../lib/types';
const base=createCharacter({handle:'Media review',givenName:'Jo',origin:'gutterwire',bonus:{chrome:0,nerve:2,face:0,ghost:0}});
const saved=(page:Page)=>page.evaluate(()=>JSON.parse(localStorage.getItem('saint-shard-3055-v1')!));
const illustration=(page:Page)=>page.getByTestId('scene-illustration').locator('img');
async function open(page:Page,run:GameState,preferences={}){
  await page.addInitScript(({run,preferences})=>{
    if(!localStorage.getItem('saint-shard-3055-v1'))localStorage.setItem('saint-shard-3055-v1',JSON.stringify(run));
    localStorage.setItem('saint-shard-preferences',JSON.stringify({reading:'all',sound:false,artwork:'full',textStep:2,contrast:'high',motion:'reduce',...preferences}));
  },{run,preferences});
  await page.goto('/');await page.getByTestId('continue-run').click();
}
for(const roll of [1,10])test(`shelter outcome art follows the committed held die ${roll}, survives reload and supplies no referral`,async({page})=>{
  await page.addInitScript(roll=>{Math.random=()=> (roll-.5)/10;},roll);
  await open(page,{...base,sceneId:'act2_shelter_methods'});
  await expect(illustration(page)).toHaveAttribute('src','/art/shelter-pump.jpg');
  await page.getByTestId('choice-shelter-turn-valve').click();await page.getByTestId('roll-button').click();
  await expect(page.getByTestId('continue-check')).toBeVisible();
  const held=await saved(page);expect(held.pendingCheck.roll).toBe(roll);expect(held.flags.shelter_restored).toBeUndefined();
  await page.reload();await page.getByTestId('continue-run').click();
  await expect(illustration(page)).toHaveAttribute('src','/art/shelter-pump.jpg');
  await page.getByTestId('continue-check').click();
  const after=await saved(page);expect(after.rolls.at(-1).roll).toBe(roll);expect(after.flags.shelter_reserved).toBeUndefined();
  if(roll===10){
    await expect(illustration(page)).toHaveAttribute('src','/art/shelter-restored.jpg');
    await page.getByTestId('choice-shelter-all-residents').click();
    await expect(illustration(page)).toHaveAttribute('src','/art/shelter-restored.jpg');
    expect((await saved(page)).flags.shelter_reserved).toBeUndefined();
  }else{
    await page.getByTestId('choice-shelter-guide-hall').click();await page.getByTestId('choice-shelter-confirm-hall').click();
    await expect(illustration(page)).not.toHaveAttribute('src','/art/shelter-restored.jpg');
    await expect(page.getByTestId('scene-text')).toContainText('still needs repair');
  }
  const result=await saved(page);await page.reload();await page.getByTestId('continue-run').click();expect(await saved(page)).toEqual(result);
});
for(const observed of [false,true])test(`courier art distinguishes ${observed?'observed receipt':'parcel left at intake'}`,async({page})=>{
  await open(page,{...base,sceneId:'act2_freight_intake',flags:{freight_at_intake:true}});
  await expect(illustration(page)).not.toHaveAttribute('src','/art/courier-receipt.jpg');
  await page.getByTestId(`choice-${observed?'acknowledge-freight-receipt':'leave-freight-batch'}`).click();
  const after=await saved(page);
  if(observed){await expect(illustration(page)).toHaveAttribute('src','/art/courier-receipt.jpg');expect(after.flags.freight_delivered).toBe(true);}
  else{await expect(illustration(page)).not.toHaveAttribute('src','/art/courier-receipt.jpg');expect(after.flags.freight_delivered).toBeUndefined();}
  expect(after.flags.witness_safe).toBeUndefined();expect(after.flags.nia_public_consent).toBeUndefined();
  await page.reload();await page.getByTestId('continue-run').click();expect(await saved(page)).toEqual(after);
});
test('a recorded late stock reply changes the return plate without earning a clearance',async({page})=>{
  await open(page,{...base,sceneId:'act3_freight_query',flags:{freight_unconfirmed:true,freight_queried:true,freight_done:true}});
  await expect(illustration(page)).not.toHaveAttribute('src','/art/courier-receipt.jpg');
  await page.getByTestId('choice-record-freight-reply').click();
  await expect(illustration(page)).toHaveAttribute('src','/art/courier-receipt.jpg');
  await expect(page.getByTestId('scene-text')).toContainText('No passenger clearance was earned.');
  const after=await saved(page);expect(after.flags.freight_late_received).toBe(true);expect(after.flags.freight_clearance_earned).toBeUndefined();
});
for(const file of [false,true])test(`hearing ${file?'filing':'withdrawal'} selects art without creating evidence or quotation permission`,async({page})=>{
  await open(page,{...base,sceneId:'act3_testimony_record',flags:{testimony_answered:true,testimony_bounded:true}});
  await expect(illustration(page)).toHaveAttribute('src','/art/hearing-table.jpg');
  await page.getByTestId(`choice-${file?'file-public-account':'withdraw-public-account'}`).click();
  if(file)await expect(illustration(page)).toHaveAttribute('src','/art/hearing-filed.jpg');
  else await expect(illustration(page)).not.toHaveAttribute('src','/art/hearing-filed.jpg');
  const after=await saved(page);for(const flag of ['order_verified','archive_key_authenticated','nia_public_consent'])expect(after.flags[flag]).toBeUndefined();
  expect(after.journal.find((row:{id:string})=>row.id==='wall-account').text).toContain(file?'quotes none of her words':'withdrawn');
  await page.reload();await page.getByTestId('continue-run').click();expect(await saved(page)).toEqual(after);
});
const samples=[
  {sceneId:'act2_shelter_result',flags:{shelter_restored:true,shelter_done:true},art:'/art/shelter-restored.jpg'},
  {sceneId:'act3_freight_visit',flags:{freight_late_received:true,freight_done:true},art:'/art/courier-receipt.jpg'},
  {sceneId:'act3_arrival',flags:{testimony_done:true,testimony_published:true},art:'/art/hearing-filed.jpg'},
  {sceneId:'act3_chapel_return',flags:{},portrait:'/art/lumen-considering.jpg'},
  {sceneId:'act3_chapel_return',flags:{betrayed_lumen:true,chapel_shift_kept:true},portrait:'/art/lumen-guarded.jpg'},
  {sceneId:'act3_witness_visit',flags:{},portrait:'/art/nia-speaking.jpg'},
];
for(const [width,artwork] of [[390,'full'],[1440,'full'],[320,'none']] as const)test(`consequence illustrations and actual actor expressions at ${width}px/${artwork}`,async({browser,baseURL})=>{
  test.setTimeout(90_000);
  for(const sample of samples){
    const context=await browser.newContext({baseURL,viewport:{width,height:900}});
    try{
      const page=await context.newPage(),requests:string[]=[],errors:string[]=[];
      page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/\/(art|audio)\//.test(r.url()))requests.push(r.url());});
      await open(page,{...base,...sample,flags:sample.flags as Record<string,boolean>},{artwork});
      const goal=await page.getByTestId('goal').boundingBox();expect(goal!.y+goal!.height).toBeLessThanOrEqual(900);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      if(artwork==='none'){expect(requests).toEqual([]);await expect(page.locator('img.portrait')).toHaveCount(0);await expect(page.getByTestId('scene-illustration')).toHaveCount(0);}
      else{
        if(sample.art){await expect(illustration(page)).toHaveAttribute('src',sample.art);await illustration(page).scrollIntoViewIfNeeded();
          const result=await illustration(page).evaluate(async(image:HTMLImageElement)=>{await image.decode();return{width:image.naturalWidth,current:image.currentSrc,alt:image.alt,ratio:image.getBoundingClientRect().width/image.getBoundingClientRect().height};});
          expect(result.width).toBeGreaterThan(0);expect(result.ratio).toBeCloseTo(1.5,2);expect(result.alt.length).toBeGreaterThan(30);
          // Browsers may choose either valid source for density or cache reasons.
          await expect(illustration(page)).toHaveAttribute('srcset',`${sample.art.replace('.jpg','-small.jpg')} 600w, ${sample.art} 1200w`);
          expect([sample.art,sample.art.replace('.jpg','-small.jpg')]).toContain(new URL(result.current).pathname);
        }
        if(sample.portrait){await expect(page.locator('img.portrait')).toHaveAttribute('src',sample.portrait);await page.locator('img.portrait').evaluate((image:HTMLImageElement)=>image.decode());}
      }
      expect(errors).toEqual([]);
    }finally{await context.close();}
  }
});
test('missing outcome art retains its truthful description, choices and autosave',async({browser,baseURL})=>{
  test.setTimeout(60_000);
  for(const sample of samples.filter(s=>s.art)){
    const context=await browser.newContext({baseURL});try{
      const page=await context.newPage();await page.route('**/art/*',route=>route.fulfill({status:404,body:'Unavailable'}));
      await open(page,{...base,...sample,flags:sample.flags as Record<string,boolean>});
      await expect(page.getByTestId('scene-illustration').locator('.art-unavailable')).toBeVisible();
      const choice=page.locator('[data-testid^="choice-"]:enabled').first();await expect(choice).toBeEnabled();await choice.click();
      expect((await saved(page)).sceneId).not.toBe(sample.sceneId);
    }finally{await context.close();}
  }
});
