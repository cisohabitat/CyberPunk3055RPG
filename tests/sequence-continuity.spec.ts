import {test,expect,type Page} from '@playwright/test';
import {createCharacter,getScene,sceneText,presentChoices,commitChoice} from '../lib/engine';
import {readFileSync} from 'node:fs';
import {sceneIllustration} from '../lib/art';
import {actName} from '../lib/story/goal';
import {sequenceContinuity} from '../lib/sequence-continuity';
import {keyboardActivate} from '../qa/production/keyboard';
import {sceneSoundPlan} from '../lib/sound';
const sceneSoundPlanFor=(s:GameState)=>sceneSoundPlan(s,getScene(s.sceneId).location,actName(s));
import {RAMP_QUOTES} from '../lib/freight-craft';
import AxeBuilder from '@axe-core/playwright';
import {routeCheckpoint} from '../qa/production/route-checkpoint';
import {installAudioReview,type AudioReview} from '../qa/production/audio-review';
import type {GameState} from '../lib/types';
const audio=(page:Page)=>page.evaluate(()=>(window as unknown as {audioReview:AudioReview}).audioReview);
async function open(page:Page,state:GameState,width=390,sound=true,automatic=false,paragraph=false){
 await page.setViewportSize({width,height:900});
 await page.addInitScript(installAudioReview,{});
 await page.addInitScript(({state,width,sound,automatic,paragraph})=>{
  if(!localStorage.getItem('saint-shard-3055-v1'))localStorage.setItem('saint-shard-3055-v1',JSON.stringify(state));
  localStorage.setItem('saint-shard-preferences',JSON.stringify({sound,autoVoices:automatic,reading:paragraph?'paragraph':'all',textStep:width===320?2:0,artwork:width===320?'none':'full',motion:'reduce'}));
 },{state,width,sound,automatic,paragraph});await page.goto('/');await page.getByTestId('continue-run').click();
}
for(const held of ['theme-quiet.flac','ambience-spire.flac'])test(`cold ${held}: ready channel starts independently`,async({page})=>{
 let release!:()=>void;const gate=new Promise<void>(r=>{release=r;});
 await page.route(`**/audio/${held}`,async route=>{await gate;await route.continue();});
 const state=routeCheckpoint('encounter-craft/archive-reader-success','act2_craft_archive');
 try{
  await open(page,state);const expected=held.startsWith('theme')?'ambience-spire.flac':'theme-quiet.flac';
  await expect.poll(async()=>(await audio(page)).started).toContain(expected);
  expect((await audio(page)).started).not.toContain(held);
  expect(JSON.parse((await page.evaluate(()=>localStorage.getItem('saint-shard-3055-v1')))!)).toEqual(state);
  release();await expect.poll(async()=>(await audio(page)).started).toContain(held);
 }finally{release();await page.unrouteAll({behavior:'ignoreErrors'});}
});

const segments=[
  {
    "id": "archive-preparation",
    "route": "encounter-craft/archive-reader-success",
    "start": "agree-archive-terms",
    "actions": [
      "agree-archive-terms"
    ]
  },
  {
    "id": "archive-question",
    "route": "encounter-craft/archive-reader-success",
    "start": "craft-archive-question",
    "actions": [
      "craft-archive-question",
      "craft-read-export",
      "craft-read-plant",
      "craft-read-movement",
      "craft-question-conflate",
      "craft-revise-question"
    ]
  },
  {
    "id": "archive-issuer",
    "route": "encounter-craft/archive-reader-success",
    "start": "craft-question-issuer",
    "actions": [
      "craft-question-issuer",
      "craft-target-approval",
      "craft-revise-question",
      "craft-question-issuer"
    ]
  },
  {
    "id": "archive-extraction",
    "route": "encounter-craft/archive-staffed-scope",
    "start": "craft-extract-paid",
    "actions": [
      "craft-extract-paid",
      "withhold-technician",
      "keep-chain"
    ]
  },
  {
    "id": "archive-pause",
    "route": "encounter-craft/archive-reader-failure",
    "start": "pause-archive-recovery",
    "actions": [
      "pause-archive-recovery"
    ]
  },
  {
    "id": "freight-prepared",
    "route": "freight-craft/bare-names",
    "start": "ramp-open-plan",
    "actions": [
      "ramp-open-plan",
      "ramp-agree",
      "ramp-inspect-landing",
      "ramp-inspect-rail",
      "ramp-choose-support",
      "ramp-lift-bare"
    ]
  },
  {
    "id": "freight-receipt",
    "route": "freight-craft/bare-names",
    "start": "ramp-rest-before",
    "actions": [
      "ramp-rest-before",
      "ramp-wait-clerk",
      "acknowledge-freight-receipt",
      "return-freight-board",
      "to-helion"
    ]
  },
  {
    "id": "freight-stopped",
    "route": "freight-craft/failed-desk",
    "start": "ramp-lift-bare",
    "actions": [
      "ramp-lift-bare",
      "ramp-carry-past",
      "ramp-recover-desk",
      "acknowledge-freight-receipt",
      "return-freight-board"
    ]
  },
  {
    "id": "freight-return",
    "route": "freight-craft/unfinished",
    "start": "ramp-ask-return",
    "actions": [
      "ramp-ask-return",
      "ramp-keep-minute",
      "reflect-freight-motive",
      "finish-freight-reflection"
    ]
  }
] as const;

function segmentStart(route:string,action:string){
 const spec=JSON.parse(readFileSync(`qa/routes/${route}.json`,'utf8'));let state=createCharacter(spec.character);
 for(const step of spec.steps){if(step.choiceId===action)return state;const c=presentChoices(state,getScene(state.sceneId)).find(c=>c.id===step.choiceId&&c.enabled)!;state=commitChoice(state,c,c.check?{roll:step.roll}:undefined).state;}throw Error(action);
}
const saved=(page:Page)=>page.evaluate(()=>JSON.parse(localStorage.getItem('saint-shard-3055-v1')!));
async function assertStage(page:Page,state:GameState,width:number,entering=true){
 const scene=getScene(state.sceneId);await expect(page.getByTestId('scene-text')).toHaveText(sceneText(scene,state).split(/\n\n+/).filter(Boolean).join(''));
 const art=page.getByTestId('scene-illustration').locator('img');
 if(width===320)await expect(art).toHaveCount(0);else await expect(art).toHaveAttribute('src',sceneIllustration(scene.id,state.flags)!.src);
 if(entering)await expect(page.getByTestId('goal')).toBeInViewport();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(await saved(page)).toEqual(state);
 const plan=sequenceContinuity(state,sceneSoundPlanFor(state),'normal');
 const file=plan.mood==='street'?'theme.flac':`theme-${plan.mood}.flac`;
 await expect.poll(async()=>(await audio(page)).started).toContain(file);
 await expect.poll(async()=>(await audio(page)).started).toContain(`ambience-${plan.district}.flac`);
}
for(const width of [390,1440,320])for(const row of segments)test(`sequence ${row.id} retains exact words, art, resources and bed through choices at${width}px`,async({page})=>{
 let state=segmentStart(row.route,row.start);await open(page,state,width);await assertStage(page,state,width);
 for(const id of row.actions){const c=presentChoices(state,getScene(state.sceneId)).find(c=>c.id===id&&c.enabled)!;expect(c.check).toBeUndefined();await keyboardActivate(page,page.getByTestId(`choice-${id}`));const previousScene=state.sceneId;state=commitChoice(state,c).state;await assertStage(page,state,width,previousScene!==state.sceneId);}
 if(row.id==='archive-question'||row.id==='freight-return')expect((await audio(page)).started.filter(f=>f==='theme-quiet.flac')).toHaveLength(1);
 await page.reload();await page.getByTestId('continue-run').click();expect(await saved(page)).toEqual(state);
 if(row.id==='archive-preparation')expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
});
for(const held of ['theme-quiet.flac','ambience-spire.flac'])for(const exit of ['leave','mute'])test(`late ${held} cannot restart after${exit}`,async({page})=>{
 let release!:()=>void;const gate=new Promise<void>(r=>{release=r;});await page.route(`**/audio/${held}`,async route=>{await gate;await route.continue();});
 const state=routeCheckpoint('encounter-craft/archive-reader-success','act2_craft_archive');
 try{await open(page,state);await expect.poll(async()=>(await audio(page)).started).toContain(held.startsWith('theme')?'ambience-spire.flac':'theme-quiet.flac');
  if(exit==='leave'){await page.getByTestId('choice-craft-leave-archive').click();const c=presentChoices(state,getScene(state.sceneId)).find(c=>c.id==='craft-leave-archive')!;await expect.poll(()=>saved(page)).toEqual(commitChoice(state,c).state);await expect.poll(async()=>(await audio(page)).started).toContain('theme-week.flac');}
  else{await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByLabel('Sound enabled',{exact:true}).uncheck();await page.getByRole('button',{name:'Done',exact:true}).click();expect(await saved(page)).toEqual(state);}
  release();await expect.poll(async()=>(await audio(page)).decoded).toContain(held);expect((await audio(page)).started).not.toContain(held);
 }finally{release();await page.unrouteAll({behavior:'ignoreErrors'});}
});
for(const missing of ['theme-quiet.flac','ambience-spire.flac'])test(`missing ${missing} keeps the available channel and full text`,async({page})=>{
 await page.route(`**/audio/${missing}`,route=>route.abort());const state=routeCheckpoint('encounter-craft/archive-reader-success','act2_craft_archive');await open(page,state);
 await expect.poll(async()=>(await audio(page)).started).toContain(missing.startsWith('theme')?'ambience-spire.flac':'theme-quiet.flac');await expect(page.getByTestId('scene-text')).toContainText('Edda puts three headings');expect(await saved(page)).toEqual(state);
});
test('scene handoff stops the previous exact actor quote and starts only the new revealed line',async({page})=>{
 const state=routeCheckpoint('freight-craft/bare-names','act2_ramp_terms');await open(page,state,390,true,true);const voice=page.getByTestId('voice-line');await expect(voice).toHaveAttribute('data-playback','playing');const first=(await audio(page)).started.find(f=>f.startsWith('voice-'))!;
 await page.getByTestId('choice-ramp-agree').click();await expect(page.getByTestId('spoken-quote')).toContainText(RAMP_QUOTES.survey);await expect(page.locator('.portrait-frame[data-speaking="true"]')).toHaveAttribute('data-speaker','Asa');await expect.poll(async()=>(await audio(page)).stoppedSources).toContain(first);
 const played=(await audio(page)).started.filter(f=>f.startsWith('voice-'));expect(played).toHaveLength(2);expect(played[0]).not.toBe(played[1]);await voice.getByRole('button',{name:'Stop line',exact:true}).click();await expect(voice).toHaveAttribute('data-playback','idle');
});
test('paragraph manual no-art keeps hidden dialogue silent and matches the revealed speaker',async({page})=>{
 const state=routeCheckpoint('freight-craft/bare-names','act2_ramp_terms'),art:string[]=[];page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/art/'))art.push(r.url());});await open(page,state,320,true,false,true);
 await expect(page.getByTestId('voice-line')).toHaveCount(0);expect((await audio(page)).started.filter(f=>f.startsWith('voice-'))).toEqual([]);await page.getByTestId('show-rest').click();const voice=page.getByTestId('voice-line');await voice.getByRole('button',{name:'Listen to Asa',exact:true}).click();await expect(voice).toHaveAttribute('data-playback','playing');await expect(page.getByTestId('spoken-quote')).toContainText(RAMP_QUOTES.terms);await voice.getByRole('button',{name:'Stop line',exact:true}).click();expect(art).toEqual([]);expect(await saved(page)).toEqual(state);
});
