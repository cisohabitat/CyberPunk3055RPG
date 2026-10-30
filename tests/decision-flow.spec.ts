import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import baseline from '../qa/editorial/decision-flow-baseline.json';
import {routeCheckpoint} from '../qa/production/route-checkpoint';
import {keyboardActivate} from '../qa/production/keyboard';
import {commitChoice,getScene,presentChoices,sceneText} from '../lib/engine';
import {FIELD_KITS,fieldKitBudget} from '../lib/loadout';
import {testimonyPacket} from '../lib/testimony';
import type {GameState} from '../lib/types';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {installAudioReview,type AudioReview} from '../qa/production/audio-review';
import {visibleCampaignDialogue} from '../lib/campaign-dialogue';
const normalized=(s:string)=>s.replace(/\s+/g,' ').trim();
const wordInventory=(s:string)=>s.match(/\S+/g)?.sort()??[];
const sortRows=<T,>(rows:T[])=>rows.map(r=>JSON.stringify(r)).sort();
test.beforeAll(()=>expect(createHash('sha256').update(readFileSync('qa/editorial/decision-flow-baseline.json')).digest('hex')).toBe('8df3961cea4acd02d6f04780c7e0a9c1e2045058dfde782a6dfbbdeb69bed026'));
const saved=(page:Page)=>page.evaluate(()=>({run:localStorage.getItem('saint-shard-3055-v1'),preferences:localStorage.getItem('saint-shard-preferences'),codex:localStorage.getItem('saint-shard-codex')}));
async function open(page:Page,state:GameState,width:number,artwork=width===320?'none':'full',paragraph=false,sound=false){
 await page.setViewportSize({width,height:900});
 await page.addInitScript(({state,artwork,paragraph,sound})=>{
  if(!localStorage.getItem('saint-shard-3055-v1'))localStorage.setItem('saint-shard-3055-v1',JSON.stringify(state));
  localStorage.setItem('saint-shard-preferences',JSON.stringify({sound,autoVoices:false,reading:paragraph?'paragraph':'all',artwork,textStep:2,contrast:'high',motion:'reduce'}));
 },{state,artwork,paragraph,sound});
 await page.goto('/');await page.getByTestId('continue-run').click();await page.evaluate(()=>document.fonts.ready);
}
for(const original of baseline.rows)test(`nearby decisions preserve terms and improve real action travel: ${original.sceneId}/${original.width}`,async({page},info)=>{
 const state=routeCheckpoint(original.route,original.sceneId,original.choice);expect(state).toEqual(original.state);
 await open(page,state,original.width,original.artwork);const before=await saved(page);await expect(page.getByTestId('goal')).toBeInViewport();
 const current=await page.getByTestId('scene').evaluate(root=>{
  const prose=root.querySelector<HTMLElement>('[data-testid="scene-text"]')!,bottom=prose.getBoundingClientRect().bottom;
  return {text:(root as HTMLElement).innerText,prose:prose.innerText,overflow:document.documentElement.scrollWidth>innerWidth,
   controls:[...root.querySelectorAll<HTMLElement>('button,a,summary,input,select,textarea')].filter(n=>n.getBoundingClientRect().height>0).map(n=>({tag:n.tagName,id:n.dataset.testid||n.id,text:n.innerText,disabled:n.hasAttribute('disabled')})),
   typography:[...root.querySelectorAll<HTMLElement>('p,dt,h2,h3,button,summary')].filter(n=>n.getBoundingClientRect().height>0).map(n=>({tag:n.tagName,text:n.innerText,fontSize:getComputedStyle(n).fontSize,lineHeight:getComputedStyle(n).lineHeight})),
   actions:[...root.querySelectorAll<HTMLButtonElement>('button[data-testid^="choice-"]')].map(n=>({id:n.dataset.testid,text:n.innerText,disabled:n.disabled,gap:Math.round(n.getBoundingClientRect().top-bottom),height:n.getBoundingClientRect().height}))};
 });
 expect(normalized(current.prose)).toBe(normalized(original.prose));
 // Only exact duplicated kit uses move to the existing optional odds reference;
 // the complete same words stay visible on each enabled purchase itself.
 let oldText=original.sceneId==='act2_workshop'?FIELD_KITS.reduce((s,k)=>s.replace(k.uses,''),original.text):original.text;
 if(original.sceneId==='act2_workshop')for(let i=0;i<3;i++)oldText=oldText.replace('Find the purchase choice and review it. No money is spent until you select that choice.','');
 if(original.sceneId==='act2_craft_archive')for(let i=0;i<3;i++)oldText=oldText.replace('Description inspected','');
 // Exact word inventory preserves every other written token; the prose,
 // controls, individual paragraphs/titles and source rows are checked intact.
 expect(wordInventory(current.text.replace('Selecting an option commits it.','').replace('REVIEW LEAVING WITHOUT BUYING',''))).toEqual(wordInventory(oldText));
 expect(sortRows(current.controls.filter(r=>r.id!=='review-workshop-exit').map(r=>({...r,text:normalized(r.text)})))).toEqual(sortRows(original.controls.map(r=>({...r,text:normalized(r.text)}))));
 expect(current.controls.filter(r=>r.id==='review-workshop-exit')).toEqual(original.sceneId==='act2_workshop'?[{tag:'A',id:'review-workshop-exit',text:'REVIEW LEAVING WITHOUT BUYING',disabled:false}]:[]);
 const reviewTerms='Find the purchase choice and review it. No money is spent until you select that choice.';
 const currentType=current.typography.filter(r=>!(r.tag==='P'&&(r.text==='Selecting an option commits it.'||original.sceneId==='act2_workshop'&&r.text===reviewTerms)));
 const originalType=original.typography.filter(r=>r.tag!=='DD'&&!(original.sceneId==='act2_craft_archive'&&r.tag==='P'&&r.text==='Description inspected')&&!(original.sceneId==='act2_workshop'&&r.tag==='P'&&r.text===reviewTerms));
 const ordered=(rows:typeof currentType)=>rows.map(r=>({...r,text:normalized(r.text)})).sort((a,b)=>(a.tag+a.text).localeCompare(b.tag+b.text)||parseFloat(a.fontSize)-parseFloat(b.fontSize));
 const types=ordered(currentType),previousTypes=ordered(originalType);expect(types.map(({tag,text})=>({tag,text}))).toEqual(previousTypes.map(({tag,text})=>({tag,text})));
 // Browser engines serialize subpixel CSS sizes differently. Less than one
 // 1/64px layout unit is allowed; the observed1px regression still fails.
 for(let i=0;i<types.length;i++)for(const key of ['fontSize','lineHeight']as const){
  const a=parseFloat(types[i][key]),b=parseFloat(previousTypes[i][key]);if(Number.isFinite(a)&&Number.isFinite(b))expect(Math.abs(a-b)).toBeLessThan(1/64);else expect(types[i][key]).toBe(previousTypes[i][key]);
 }
 if(original.sceneId==='act2_workshop')await expect(page.locator('.kit-review-terms')).toHaveText(reviewTerms);
 expect(current.actions.map(({gap,height,...rest})=>({...rest,text:normalized(rest.text)}))).toEqual(original.actions.map(({gap,height,...rest})=>({...rest,text:normalized(rest.text)})));
 const first=current.actions.find(a=>!a.disabled)!,oldFirst=original.actions.find(a=>!a.disabled)!;
 expect(first.gap).toBeLessThanOrEqual(oldFirst.gap*.75);
 for(const action of current.actions)if(!action.disabled)expect(action.height).toBeGreaterThanOrEqual(44);
 const records=page.getByTestId('decision-flow-records');
 expect(await records.evaluate(n=>Boolean(document.getElementById('choices')!.compareDocumentPosition(n)&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
 for(const id of ['archive-question-desk','testimony-brief','route-board'])if(await page.getByTestId(id).count()){
  expect(await page.getByTestId(id).evaluate(n=>Boolean(n.compareDocumentPosition(document.getElementById('choices')!)&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
 }
 if(original.sceneId.startsWith('act3_testimony_')) {
  const pairs=await page.getByTestId('testimony-brief').locator(':scope > dl > div').evaluateAll(rows=>rows.map(n=>({title:n.querySelector('dt')!.textContent,text:n.querySelector('dd')!.textContent})));
  expect(pairs).toEqual(testimonyPacket(state));
 }
 if(original.sceneId==='act2_workshop'){
  for(const kit of FIELD_KITS){
   const button=page.getByTestId(`choice-buy-${kit.id}`);await expect(button).toHaveCount(1);await expect(button.locator('[data-kind="detail"]')).toBeVisible();await expect(button).toContainText(kit.uses);
   const oldDescription=original.typography.find(r=>r.tag==='DD'&&r.text.includes(kit.uses))!;expect(await button.locator('[data-kind="detail"]').evaluate(n=>parseFloat(getComputedStyle(n).fontSize))).toBeGreaterThanOrEqual(parseFloat(oldDescription.fontSize)-1/64);
   expect(await button.evaluate(n=>Boolean(n.closest('[data-testid="field-kit-brief"]')))).toBe(true);
   const budget=page.getByTestId(`budget-${kit.id}`);expect(await budget.evaluate((n,id)=>Boolean(n.compareDocumentPosition(document.querySelector(`[data-testid="choice-buy-${id}"]`)!)&Node.DOCUMENT_POSITION_FOLLOWING),kit.id)).toBe(true);
   await keyboardActivate(page,page.getByTestId(`review-purchase-${kit.id}`));await expect(button).toBeFocused();await expect(button).toBeInViewport();
   await expect(button.locator('.label')).toBeInViewport();expect((await button.locator('.label').boundingBox())!.y).toBeGreaterThanOrEqual(await page.locator('.topbar').evaluate(n=>n.getBoundingClientRect().bottom));expect(await saved(page)).toEqual(before);
   if(kit.id==='chair-harness')await page.screenshot({path:info.outputPath('workshop-review.png')});
  }
  await expect(page.getByTestId('field-kit-brief')).toContainText('room 90 + staffed rest 45 = 135');await expect(page.getByTestId('field-kit-brief')).toContainText('Equipment supplies no evidence, safe room, or consent.');
  await keyboardActivate(page,page.getByTestId('review-workshop-exit'));const leave=page.getByTestId('choice-leave-workshop');await expect(leave).toBeFocused();expect((await leave.locator('.label').boundingBox())!.y).toBeGreaterThanOrEqual(await page.locator('.topbar').evaluate(n=>n.getBoundingClientRect().bottom));expect(await saved(page)).toEqual(before);expect((await page.getByTestId('review-workshop-exit').boundingBox())!.height).toBeGreaterThanOrEqual(44);
 }
 expect(current.overflow).toBe(false);expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);expect(await saved(page)).toEqual(before);
 await info.attach('decision-flow-measurement',{body:JSON.stringify({scene:original.sceneId,width:original.width,before:original.actions,current:current.actions}),contentType:'application/json'});
 await page.screenshot({path:info.outputPath('decision-flow.png'),fullPage:true});
 await page.reload();await page.getByTestId('continue-run').click();expect(await saved(page)).toEqual(before);
});

test('workshop review remeasures its header after changing text size without spending',async({page})=>{
 const state=routeCheckpoint('freight-craft/harness-listed','act2_workshop','buy-chair-harness');await open(page,state,320,'none');const before=(await saved(page)).run;
 for(const step of ['0','2']){
  await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByLabel('Text size',{exact:true}).selectOption(step);await page.getByRole('button',{name:'Done',exact:true}).click();
  await keyboardActivate(page,page.getByTestId('review-purchase-chair-harness'));const target=page.getByTestId('choice-buy-chair-harness');await expect(target).toBeFocused();
  expect((await target.locator('.label').boundingBox())!.y).toBeGreaterThanOrEqual(await page.locator('.topbar').evaluate(n=>n.getBoundingClientRect().bottom));expect((await saved(page)).run).toBe(before);
 }
});

test('workshop reviews keep both exact Quill lines playing once through natural completion',async({page})=>{
 await page.addInitScript(installAudioReview,{});const state=routeCheckpoint('freight-craft/harness-listed','act2_workshop','buy-chair-harness');const scene=getScene(state.sceneId);
 const lines=visibleCampaignDialogue(scene.id,scene.speaker,sceneText(scene,state));expect(lines).toHaveLength(2);expect(lines.every(line=>line.speaker==='Quill')).toBe(true);await open(page,state,390,'full',false,true);const before=await saved(page);
 const audio=():Promise<AudioReview>=>page.evaluate(()=>(window as unknown as{audioReview:AudioReview}).audioReview);
 await keyboardActivate(page,page.getByTestId('voice-line').getByRole('button',{name:'Play all dialogue',exact:true}));
 await expect.poll(async()=>{
  const cue=await page.evaluate(()=>({id:document.querySelector('[data-testid="voice-line"]')?.getAttribute('data-voice-id'),speaker:document.querySelector('[data-testid="spoken-quote"]')?.getAttribute('data-speaker'),text:document.querySelector('[data-testid="spoken-quote"]')?.textContent}));
  return lines.some(line=>line.id===cue.id&&line.speaker===cue.speaker&&line.text===cue.text);
 }).toBe(true);
 for(const id of ['review-purchase-chair-harness','review-workshop-exit']){await keyboardActivate(page,page.getByTestId(id));expect(await saved(page)).toEqual(before);}
 await expect(page.getByTestId('voice-line').getByRole('button',{name:/^Listen to/})).toBeVisible({timeout:20_000});const playback=await audio();const expected=lines.map(line=>`${line.id}.${line.id.startsWith('voice-campaign-')?'mp3':'wav'}`);expect(playback.started.filter(n=>n.startsWith('voice-'))).toEqual(expected);for(const file of expected){expect(playback.disposed).toContain(file);expect(playback.cleared).toContain(file);}
});

for(const width of [320,390,1440])for(const creds of [0,100,120,140,275])test(`workshop imported budget${creds} retains actual affordability and commits once at${width}px`,async({page})=>{
 const checkpoint=routeCheckpoint('freight-craft/harness-listed','act2_workshop','buy-chair-harness');
 // Explicit imported-resource edge, separate from the complete legal scarcity run.
 const state={...checkpoint,creds};await open(page,state,width);const before=await saved(page);const choices=presentChoices(state,getScene(state.sceneId));
 for(const kit of FIELD_KITS){const button=page.getByTestId(`choice-buy-${kit.id}`),choice=choices.find(c=>c.id===`buy-${kit.id}`)!;
  await expect(button).toHaveCount(1);await expect(button).toBeEnabled({enabled:choice.enabled});
  if(choice.disabledReason)await expect(button).toContainText(choice.disabledReason);
  const budget=fieldKitBudget(creds,kit.price);await expect(page.getByTestId(`budget-${kit.id}`)).toContainText(budget.affordable?`After purchase: ${budget.remaining} creds.`:`Need ${-budget.remaining} more creds`);
 }
 await keyboardActivate(page,page.getByTestId('review-workshop-exit'));await expect(page.getByTestId('choice-leave-workshop')).toBeFocused();expect(await saved(page)).toEqual(before);const choice=choices.find(c=>c.enabled&&c.id.startsWith('buy-'))??choices.find(c=>c.id==='leave-workshop')!;
 await keyboardActivate(page,page.getByTestId(`choice-${choice.id}`));const expected=commitChoice(state,choice).state;
 await expect.poll(async()=>JSON.parse((await saved(page)).run!)).toEqual(expected);await page.reload();await page.getByTestId('continue-run').click();expect(JSON.parse((await saved(page)).run!)).toEqual(expected);
 expect(expected.creds).toBeGreaterThanOrEqual(0);expect(expected.rolls).toEqual(state.rolls);
 if(choice.id.startsWith('buy-')){expect(expected.items).toContain(choice.id.slice(4));expect(presentChoices(expected,getScene(expected.sceneId)).some(c=>c.id.startsWith('buy-')&&c.enabled)).toBe(false);}
});

for(const width of [320,390,1440])test(`paragraph reading retains unaltered source text and free inspection focus at${width}px`,async({page})=>{
 const state=routeCheckpoint('emotional-payoff/both-returns-listed','act2_craft_archive');await open(page,state,width,'none',true);const before=await saved(page);
 await expect(page.getByTestId('scene-text').locator('p')).toHaveCount(1);await keyboardActivate(page,page.getByTestId('show-rest'));
 await expect(page.getByTestId('scene-text')).toHaveText(sceneText(getScene(state.sceneId),state).split(/\n\n+/).filter(Boolean).join(''));
 expect(await saved(page)).toEqual(before);const choice=presentChoices(state,getScene(state.sceneId)).find(c=>c.id==='craft-read-export')!;
 await keyboardActivate(page,page.getByTestId('choice-craft-read-export'));await expect(page.getByTestId('craft-record-export').locator('h3')).toBeFocused();await expect(page.getByTestId('craft-record-export').locator('h3')).toBeInViewport();
 expect(JSON.parse((await saved(page)).run!)).toEqual(commitChoice(state,choice).state);await expect(page.getByTestId('archive-question-desk')).toContainText('Inspection retrieves no ledger and tests no issuing key.');
});
