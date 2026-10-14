import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createCharacter } from '../lib/engine';
import { installAudioReview, type AudioReview } from '../qa/production/audio-review';
import { keyboardActivate } from '../qa/production/keyboard';
const run=createCharacter({handle:'Guide reader',givenName:'Jo',origin:'spire',bonus:{chrome:2,nerve:0,face:0,ghost:0}});
const audio=(page:import('@playwright/test').Page):Promise<AudioReview>=>page.evaluate(()=>(window as unknown as {audioReview:AudioReview}).audioReview);
const saved=(page:import('@playwright/test').Page)=>page.evaluate(()=>localStorage.getItem('saint-shard-3055-v1'));

test('main page guide link, practice, bookmarks and Back preserve the existing campaign and preferences',async({page})=>{
  await page.addInitScript(run=>{
    if(!localStorage.getItem('saint-shard-3055-v1'))localStorage.setItem('saint-shard-3055-v1',JSON.stringify(run));
    localStorage.setItem('saint-shard-preferences',JSON.stringify({sound:false,reading:'paragraph',autoVoices:false}));
  },run);
  await page.goto('/');const before=await saved(page);
  await keyboardActivate(page,page.getByTestId('guide-link'));await expect(page).toHaveURL(/\/guide$/);
  await expect(page.getByRole('heading',{name:'A runner’s field guide',exact:true})).toBeFocused();
  await expect(page.getByRole('navigation',{name:'Field guide chapters'})).toBeVisible();
  for(const [face,total,label] of [[4,7,'Miss.'],[5,8,'Success.'],[10,13,'from 2 to 1'],[1,4,'from 2 to 3']] as const){
    await keyboardActivate(page,page.getByRole('button',{name:`Show a ${face}`,exact:true}));
    await expect(page.getByTestId('guide-result')).toContainText(`${face} + 3 = ${total}`);await expect(page.getByTestId('guide-result')).toContainText(label);
    expect(await saved(page)).toBe(before);
  }
  await page.reload();await expect(page.getByTestId('guide-screen')).toBeVisible();await expect(page).toHaveTitle('Runner’s Field Guide — Saint Shard');
  expect(await saved(page)).toBe(before);await expect(page.getByTestId('guide-result')).toContainText('Your first example is ready');
  await keyboardActivate(page,page.getByTestId('guide-back'));await expect(page).toHaveURL(/\/$/);await expect(page.getByTestId('title-screen')).toBeVisible();
  expect(await saved(page)).toBe(before);
  const prefs=await page.evaluate(()=>JSON.parse(localStorage.getItem('saint-shard-preferences')!));expect(prefs.reading).toBe('paragraph');expect(prefs.autoVoices).toBe(false);expect(prefs.sound).toBe(false);
  await keyboardActivate(page,page.getByTestId('continue-run'));await expect(page.getByTestId('scene-text')).toBeVisible();expect(await saved(page)).toBe(before);
});
for(const [width,artwork] of [[390,'full'],[1440,'full'],[320,'none']] as const)test(`direct guide at ${width}px/${artwork} has accessible reading and truthful city art`,async({page})=>{
  const requests:string[]=[],errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/\/(art|audio)\//.test(r.url()))requests.push(r.url());});
  await page.addInitScript(({artwork})=>localStorage.setItem('saint-shard-preferences',JSON.stringify({sound:false,artwork,textStep:2,contrast:'high',motion:'reduce'})),{artwork});
  await page.setViewportSize({width,height:900});await page.goto('/guide');
  await expect(page.getByTestId('guide-screen')).toBeVisible();expect(await saved(page)).toBeNull();
  await expect(page.getByTestId('guide-screen')).toContainText('It is 3055');
  await expect(page.getByTestId('guide-screen')).not.toContainText('coolant dump');
  await expect(page.getByTestId('guide-screen')).not.toContainText('Three hundred');
  if(artwork==='none'){await expect(page.getByTestId('scene-illustration')).toHaveCount(0);expect(requests).toEqual([]);}
  else{const image=page.getByTestId('scene-illustration').locator('img');await expect(image).toHaveAttribute('src','/art/opening.jpg');await image.scrollIntoViewIfNeeded();await image.evaluate((image:HTMLImageElement)=>image.decode());}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
  await keyboardActivate(page,page.getByRole('link',{name:'Choices & dice',exact:true}));await expect(page).toHaveURL(/#guide-checks$/);
  await expect(page.getByRole('heading',{name:'Choices and dice',exact:true})).toBeInViewport();expect(errors).toEqual([]);
});
test('unavailable guide artwork keeps its description, lore and practice usable',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('saint-shard-preferences',JSON.stringify({sound:false})));
  await page.route('**/art/opening*.jpg',r=>r.fulfill({status:404,body:'Unavailable'}));await page.goto('/guide');
  await expect(page.getByTestId('scene-illustration').locator('.art-unavailable')).toContainText('noodle stall');
  await keyboardActivate(page,page.getByRole('button',{name:'Show a 5',exact:true}));await expect(page.getByTestId('guide-result')).toContainText('Success.');
  expect(await saved(page)).toBeNull();
});
test('music continues once across guide navigation, and explicit Stop stays respected',async({page})=>{
  await page.addInitScript(installAudioReview,{});await page.goto('/');
  await keyboardActivate(page,page.getByTestId('guide-link'));await expect(page).toHaveURL(/\/guide$/);
  await expect.poll(async()=>(await audio(page)).started.filter(f=>f==='theme-title.flac').length).toBe(1);
  const before=await saved(page);await keyboardActivate(page,page.getByTestId('guide-back'));
  await expect(page.getByTestId('title-screen')).toBeVisible();expect((await audio(page)).started.filter(f=>f==='theme-title.flac')).toHaveLength(1);
  await keyboardActivate(page,page.getByRole('button',{name:'Stop menu music',exact:true}));await expect.poll(async()=>(await audio(page)).liveSources).toBe(0);
  await keyboardActivate(page,page.getByTestId('guide-link'));await expect(page.getByTestId('guide-screen')).toBeVisible();
  expect((await audio(page)).started.filter(f=>f==='theme-title.flac')).toHaveLength(1);expect(await saved(page)).toBe(before);
});
test('direct guide respects saved mute and pagehide cancels a later theme start',async({page})=>{
  await page.addInitScript(installAudioReview,{});await page.addInitScript(()=>localStorage.setItem('saint-shard-preferences',JSON.stringify({sound:false})));
  const requests:string[]=[];page.on('request',r=>{if(r.url().includes('/audio/'))requests.push(r.url());});
  await page.goto('/guide');await keyboardActivate(page,page.getByRole('button',{name:'Show a 5',exact:true}));expect(requests).toEqual([]);
  await keyboardActivate(page,page.getByRole('button',{name:'Settings',exact:true}));await keyboardActivate(page,page.getByLabel('Sound enabled',{exact:true}));
  await keyboardActivate(page,page.getByRole('button',{name:'Done',exact:true}));await expect.poll(async()=>(await audio(page)).liveSources).toBe(1);
  await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await expect.poll(async()=>(await audio(page)).liveSources).toBe(0);
  await keyboardActivate(page,page.getByRole('button',{name:'Show a 1',exact:true}));expect((await audio(page)).liveSources).toBe(0);
  await keyboardActivate(page,page.getByRole('button',{name:'Resume menu music',exact:true}));await expect.poll(async()=>(await audio(page)).liveSources).toBe(1);
  expect(await saved(page)).toBeNull();
});
for(const policy of ['no-user-gesture-required','document-user-activation-required'])test(`native title autoplay policy ${policy}`,async({playwright,baseURL},testInfo)=>{
  test.skip(testInfo.project.name!=='chromium','Native Chromium policy coverage runs once; ordinary fallback runs in every browser.');
  const browser=await playwright.chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,args:[`--autoplay-policy=${policy}`]});
  try{
    const context=await browser.newContext({baseURL});const page=await context.newPage();await page.addInitScript(installAudioReview,{});
    const requests:string[]=[];page.on('request',r=>{if(r.url().includes('/audio/'))requests.push(r.url());});
    await page.goto('/');await expect(page.getByTestId('title-screen')).toBeVisible();
    if(policy==='no-user-gesture-required')await expect.poll(async()=>(await audio(page)).started).toContain('theme-title.flac');
    else{
      expect(requests).toEqual([]);await expect(page.getByTestId('title-music')).toContainText('autoplay is waiting');
      await keyboardActivate(page,page.getByTestId('guide-link'));await expect.poll(async()=>(await audio(page)).started).toContain('theme-title.flac');
    }
    await keyboardActivate(page,page.getByRole('button',{name:'Stop menu music',exact:true}));await expect.poll(async()=>(await audio(page)).liveSources).toBe(0);
    expect(await saved(page)).toBeNull();await context.close();
  }finally{await browser.close();}
});
