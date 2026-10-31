# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ordinary-direction.spec.ts >> ordinary exact Kerr voice survives views: voice-campaign-kerr-f829eb68f234
- Location: tests/ordinary-direction.spec.ts:39:36

# Error details

```
Error: locator.click: Test ended.
Call log:
  - waiting for getByTestId('continue-run')
    - locator resolved to <button type="button" data-testid="continue-run" class="primary title-run-action">Continue</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable

```

# Test source

```ts
  1  | import { performanceVoicePath } from "../lib/performance-delivery";
  2  | import { test, expect, type Page } from '@playwright/test';
  3  | import AxeBuilder from '@axe-core/playwright';
  4  | import { getScene, sceneText, presentChoices, commitChoice } from '../lib/engine';
  5  | import { visibleCampaignDialogue } from '../lib/campaign-dialogue';
  6  | import { ordinaryDirection } from '../lib/ordinary-direction';
  7  | import { portraitArt } from '../lib/art';
  8  | import { routeCheckpoint } from '../qa/production/route-checkpoint';
  9  | import { ORDINARY_CHECKPOINTS } from '../qa/production/ordinary-checkpoints';
  10 | import { keyboardActivate, keyboardSelect, tabTo } from '../qa/production/keyboard';
  11 | import { installAudioReview, type AudioReview } from '../qa/production/audio-review';
  12 | import baseline from '../qa/editorial/ordinary-direction-layout-baseline.json';
  13 | import type { GameState } from '../lib/types';
  14 | const saved=(page:Page)=>page.evaluate(()=>({run:localStorage.getItem('saint-shard-3055-v1'),preferences:localStorage.getItem('saint-shard-preferences'),codex:localStorage.getItem('saint-shard-codex')}));
  15 | const audio=(page:Page)=>page.evaluate(()=>(window as unknown as{audioReview:AudioReview}).audioReview);
  16 | async function open(page:Page,state:GameState,width=390,sound=false,automatic=false,artwork='full',reading='all',voices=100){
  17 |  await page.setViewportSize({width,height:900});await page.addInitScript(({state,sound,automatic,artwork,reading,voices})=>{if(!localStorage.getItem('saint-shard-3055-v1'))localStorage.setItem('saint-shard-3055-v1',JSON.stringify(state));if(!localStorage.getItem('saint-shard-preferences'))localStorage.setItem('saint-shard-preferences',JSON.stringify({sound,autoVoices:automatic,artwork,reading,textStep:2,contrast:'high',motion:'reduce',voices}));},{state,sound,automatic,artwork,reading,voices});
> 18 |  await page.goto('/');await page.getByTestId('continue-run').click();await page.evaluate(()=>document.fonts.ready);await expect(page.getByTestId('goal')).toBeInViewport();
     |                                                              ^ Error: locator.click: Test ended.
  19 | }
  20 | async function views(page:Page,scene:string){const panel=page.getByTestId('ordinary-artwork');await keyboardActivate(page,panel.locator('summary').first());await expect(panel).toHaveAttribute('open','');await expect(panel.getByTestId('sequence-shots')).toBeVisible();return ordinaryDirection(scene)!;}
  21 | async function shot(page:Page,name:'Scene'|'Person'|'Detail',src:string){const p=page.getByTestId('ordinary-artwork');await keyboardActivate(page,p.getByRole('button',{name,exact:true}));await expect(p.getByTestId('sequence-shots')).toHaveAttribute('data-view',name.toLowerCase());const image=p.locator('img');await expect(image).toHaveCount(1);await expect(image).toHaveAttribute('src',src);await image.scrollIntoViewIfNeeded();await expect(p.locator('.progressive-art')).toHaveAttribute('data-ready','true');await image.evaluate((img:HTMLImageElement)=>img.decode());expect(await image.evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);}
  22 | for(const width of[320,390,1440])for(const c of ORDINARY_CHECKPOINTS)test(`ordinary ${c.id}: unchanged decisions, one deliberate view and legal exit at ${width}px`,async({page},info)=>{
  23 |  const state=routeCheckpoint(c.route,c.scene,c.choice),prior=baseline.rows.find(r=>r.id===c.id&&r.width===width)!;const requests:string[]=[];page.on('request',r=>requests.push(new URL(r.url()).pathname));await open(page,state,width);const before=await saved(page);
  24 |  await expect(page.getByTestId('scene-text')).toHaveText(sceneText(getScene(state.sceneId),state).split(/\n\n+/).filter(Boolean).join(''));
  25 |  const current=await page.evaluate(()=>{const prose=document.querySelector<HTMLElement>('[data-testid="scene-text"]')!;return{proseTop:prose.getBoundingClientRect().top+scrollY,typography:{font:getComputedStyle(prose).fontSize,lineHeight:getComputedStyle(prose).lineHeight},actions:[...document.querySelectorAll<HTMLButtonElement>('button[data-testid^="choice-"]')].map(b=>({id:b.dataset.testid,text:b.innerText,enabled:!b.disabled,top:b.getBoundingClientRect().top+scrollY}))};});
  26 |  // Compare a preceding-layout control in this same browser, rather than pretending
  27 |  // Chromium's historical pixel serialization is a Firefox/WebKit baseline.
  28 |  const control=await page.evaluate(()=>{const panel=document.querySelector<HTMLElement>('[data-testid="ordinary-artwork"]')!;const display=panel.style.display;panel.style.display='none';try{const prose=document.querySelector<HTMLElement>('[data-testid="scene-text"]')!;return{proseTop:prose.getBoundingClientRect().top+scrollY,typography:{font:getComputedStyle(prose).fontSize,lineHeight:getComputedStyle(prose).lineHeight},actions:[...document.querySelectorAll<HTMLButtonElement>('button[data-testid^="choice-"]')].map(b=>({id:b.dataset.testid,text:b.innerText,enabled:!b.disabled,top:b.getBoundingClientRect().top+scrollY}))};}finally{panel.style.display=display;}});
  29 |  expect(current).toEqual(control);expect(current.actions.map(({top,...a})=>a)).toEqual(prior.actions.map(({top,...a})=>a));
  30 |  await info.attach('preceding-and-current-layout',{body:JSON.stringify({prior: {proseTop:prior.proseTop,typography:prior.typography,actions:prior.actions},current,control}),contentType:'application/json'});
  31 |  const panel=page.getByTestId('ordinary-artwork');expect(await panel.evaluate(e=>Boolean(document.querySelector('#choices')!.compareDocumentPosition(e)&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);await expect(panel.locator('img')).toHaveCount(0);expect(requests.some(p=>/kerr-listening-wide|stall-quiet-detail/.test(p))).toBe(false);
  32 |  const d=await views(page,c.scene);await shot(page,'Person',d.person.src);await shot(page,'Detail',d.detail.src);await shot(page,'Scene',d.scene.src);expect(await saved(page)).toEqual(before);
  33 |  const portrait=page.locator('.scene-row .portrait-frame img').first();if(await portrait.count())await expect(portrait).toHaveAttribute('src',portraitArt('Kerr',c.scene,state.flags)!);
  34 |  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:info.outputPath('ordinary.png'),fullPage:true});
  35 |  await page.reload();await page.getByTestId('continue-run').click();await expect(panel.locator('img')).toHaveCount(0);expect(await saved(page)).toEqual(before);
  36 |  const action=presentChoices(state,getScene(state.sceneId)).find(a=>a.id===c.choice&&a.enabled)!;await keyboardActivate(page,page.getByTestId('choice-'+action.id));await expect.poll(async()=>JSON.parse((await saved(page)).run!)).toEqual(commitChoice(state,action).state);await expect(page.getByTestId('ordinary-artwork').locator('img')).toHaveCount(0);
  37 | });
  38 | const voices=ORDINARY_CHECKPOINTS.flatMap(c=>{const state=routeCheckpoint(c.route,c.scene,c.choice);return visibleCampaignDialogue(c.scene,'Kerr',sceneText(getScene(c.scene),state)).map(line=>({state,line}));}).filter((r,i,all)=>all.findIndex(a=>a.line.id===r.line.id)===i);
  39 | for(const{state,line}of voices)test(`ordinary exact Kerr voice survives views: ${line.id}`,async({page})=>{
  40 |  await page.addInitScript(installAudioReview,{});await open(page,state,390,true);const before=await saved(page),voice=page.getByTestId('voice-line');await keyboardActivate(page,voice.locator('summary'));if(await voice.getByLabel('Dialogue line',{exact:true}).count())await keyboardSelect(page,voice.getByLabel('Dialogue line',{exact:true}),line.key);await keyboardActivate(page,voice.getByRole('button',{name:'Listen to Kerr',exact:true}));
  41 |  await expect(page.getByTestId('spoken-quote')).toContainText(line.text);await expect(page.locator('.portrait-frame[data-speaking="true"]')).toHaveAttribute('data-speaker','Kerr');const d=await views(page,state.sceneId);await shot(page,'Person',d.person.src);await shot(page,'Detail',d.detail.src);
  42 |  await expect.poll(async()=>(await audio(page)).disposed,{timeout:20000}).toContain(line.id+'.mp3');const a=await audio(page);expect(a.started.filter(f=>f.startsWith('voice-'))).toEqual([line.id+'.mp3']);expect(a.stoppedSources).not.toContain(line.id+'.mp3');expect(a.voiceLevels.find(l=>l.file===line.id+'.mp3')!.gain).toBe(1);expect(await saved(page)).toEqual(before);
  43 |  await keyboardActivate(page,voice.getByRole('button',{name:'Listen to Kerr',exact:true}));await expect(voice).toHaveAttribute('data-playback','playing');await keyboardActivate(page,voice.getByRole('button',{name:'Stop line',exact:true}));await expect(voice).toHaveAttribute('data-playback','idle');
  44 | });
  45 | for(const width of[320,390,1440])for(const input of['keyboard','pointer']as const)test(`ordinary ${input} view selection retains reading anchor and Settings at ${width}px; zoom restores focus; close removes selected image`,async({page})=>{
  46 |  const c=ORDINARY_CHECKPOINTS[0],state=routeCheckpoint(c.route,c.scene);await open(page,state,width);const before=await saved(page),d=await views(page,c.scene),panel=page.getByTestId('ordinary-artwork');await shot(page,'Person',d.person.src);const button=panel.getByRole('button',{name:'Detail',exact:true});await button.scrollIntoViewIfNeeded();if(input==='keyboard')await tabTo(page,button);const top=await button.evaluate(e=>e.getBoundingClientRect().top);if(input==='keyboard')await page.keyboard.press('Enter');else await button.click();await panel.locator('img').evaluate((i:HTMLImageElement)=>i.decode());expect(Math.abs(await button.evaluate(e=>e.getBoundingClientRect().top)-top)).toBeLessThan(1);
  47 |  // Native WebKit reverse-tab after a mouse click also stalls on a plain button page.
  48 |  // Establish keyboard navigation with a genuine forward Tab in the pointer flow.
  49 |  if(input==='pointer')await page.keyboard.press('Tab');
  50 |  await keyboardActivate(page,page.getByRole('button',{name:'Settings',exact:true}));await keyboardActivate(page,page.getByRole('button',{name:'Done',exact:true}));await expect(panel.getByTestId('sequence-shots')).toHaveAttribute('data-view','detail');const opener=panel.getByRole('button',{name:/^View artwork:/});await keyboardActivate(page,opener);await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(opener).toBeFocused();expect(await saved(page)).toEqual(before);await keyboardActivate(page,panel.locator('summary'));await expect(panel.locator('img')).toHaveCount(0);
  51 | });
  52 | test('ordinary missing art retains description, original conduct and decisions',async({page})=>{await page.route('**/art/kerr-listening-wide*.jpg',r=>r.fulfill({status:404,body:'Unavailable'}));const c=ORDINARY_CHECKPOINTS[5],state=routeCheckpoint(c.route,c.scene,c.choice);await open(page,state);const before=await saved(page),d=await views(page,c.scene);await keyboardActivate(page,page.getByTestId('ordinary-artwork').getByRole('button',{name:'Person',exact:true}));await expect(page.getByTestId('scene-illustration')).toHaveAttribute('data-unavailable','true');await expect(page.getByTestId('scene-illustration')).toContainText(d.person.description);await shot(page,'Detail',d.detail.src);expect(await saved(page)).toEqual(before);await keyboardActivate(page,page.getByTestId('choice-'+c.choice));});
  53 | test('ordinary paragraph/manual/no-art keeps whole text reachable and makes no art requests',async({page})=>{const art:string[]=[];page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/art/'))art.push(r.url());});await page.addInitScript(installAudioReview,{});const c=ORDINARY_CHECKPOINTS[0],state=routeCheckpoint(c.route,c.scene);await open(page,state,320,true,false,'none','paragraph');const before=await saved(page);await expect(page.getByTestId('ordinary-artwork')).toHaveCount(0);expect((await audio(page)).started.filter(f=>f.startsWith('voice-'))).toEqual([]);if(await page.getByTestId('show-rest').count())await keyboardActivate(page,page.getByTestId('show-rest'));await expect(page.getByTestId('scene-text')).toContainText('You can keep the case closed.');await keyboardActivate(page,page.getByTestId('voice-line').getByRole('button',{name:'Listen to Kerr',exact:true}));await expect(page.getByTestId('voice-line')).toHaveAttribute('data-playback','playing');await keyboardActivate(page,page.getByRole('button',{name:'Stop line',exact:true}));expect(art).toEqual([]);expect(await saved(page)).toEqual(before);});
  54 | for(const[sound,level]of[[false,100],[true,0]]as const)test(`ordinary views respect sound=${sound},voices=${level}`,async({page})=>{await page.addInitScript(installAudioReview,{});const c=ORDINARY_CHECKPOINTS[0],state=routeCheckpoint(c.route,c.scene);await open(page,state,390,sound,true,'full','all',level);const before=await saved(page),d=await views(page,c.scene);await shot(page,'Person',d.person.src);await shot(page,'Detail',d.detail.src);expect((await audio(page)).started.filter(f=>f.startsWith('voice-'))).toEqual([]);expect(await saved(page)).toEqual(before);});
  55 | test('ordinary missing voice leaves readable dialogue and optional art',async({page})=>{const{state,line}=voices[0];await page.route('**/audio/'+line.id+'.mp3',r=>r.abort());const alternative=performanceVoicePath(line.id);if(alternative)await page.route(alternative,r=>r.abort());await open(page,state,390,true,true);await expect(page.getByTestId('voice-line')).toContainText('unavailable');await expect(page.getByTestId('scene-text')).toContainText(line.text);const d=await views(page,state.sceneId);await shot(page,'Person',d.person.src);await keyboardActivate(page,page.getByTestId('choice-district-withhold-kerr'));});
  56 | test('ordinary automatic queue stays exact while optional views open and close',async({page})=>{
  57 |  await page.addInitScript(installAudioReview,{});const c=ORDINARY_CHECKPOINTS[1],state=routeCheckpoint(c.route,c.scene,c.choice),queue=visibleCampaignDialogue(c.scene,'Kerr',sceneText(getScene(c.scene),state));expect(queue).toHaveLength(2);await open(page,state,390,true,true);const before=await saved(page);await expect.poll(async()=>(await audio(page)).started.filter(f=>f.startsWith('voice-'))).toEqual([queue[0].id+'.mp3']);const d=await views(page,c.scene);await shot(page,'Person',d.person.src);await shot(page,'Detail',d.detail.src);await keyboardActivate(page,page.getByTestId('ordinary-artwork').locator('summary'));await expect.poll(async()=>(await audio(page)).disposed.filter(f=>f.startsWith('voice-')),{timeout:20000}).toEqual(queue.map(l=>l.id+'.mp3'));const a=await audio(page);expect(a.started.filter(f=>f.startsWith('voice-'))).toEqual(queue.map(l=>l.id+'.mp3'));expect(a.stoppedSources.filter(f=>f.startsWith('voice-'))).toEqual([]);expect(await saved(page)).toEqual(before);
  58 | });
  59 | test('ordinary late voice remains canceled after canonical navigation with views open',async({page})=>{
  60 |  await page.addInitScript(installAudioReview,{});const{state,line}=voices[0];let release!:()=>void;const held=new Promise<void>(r=>release=r);let requested=false;await page.route(performanceVoicePath(line.id)??'**/audio/'+line.id+'.mp3',async r=>{requested=true;await held;await r.continue().catch(()=>{});});try{await open(page,state,390,true,true);await expect.poll(()=>requested).toBe(true);await views(page,state.sceneId);const action=presentChoices(state,getScene(state.sceneId)).find(c=>c.id==='district-withhold-kerr')!,next=commitChoice(state,action).state;await keyboardActivate(page,page.getByTestId('choice-'+action.id));release();await expect.poll(async()=>JSON.parse((await saved(page)).run!)).toEqual(next);const following=visibleCampaignDialogue(next.sceneId,'Kerr',sceneText(getScene(next.sceneId),next))[0];await expect.poll(async()=>(await audio(page)).disposed,{timeout:20000}).toContain(following.id+'.mp3');expect((await audio(page)).started).not.toContain(line.id+'.mp3');await expect(page.getByTestId('ordinary-artwork').locator('img')).toHaveCount(0);}finally{release();}
  61 | });
  62 | 
```