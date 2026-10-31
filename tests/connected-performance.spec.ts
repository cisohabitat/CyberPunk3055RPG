import { test, expect, type Page } from '@playwright/test';
import { getScene, sceneText, presentChoices, commitChoice } from '../lib/engine';
import { visibleCampaignDialogue } from '../lib/campaign-dialogue';
import { performanceVoicePath } from '../lib/performance-delivery';
import { routeCheckpoint } from '../qa/production/route-checkpoint';
import { ORDINARY_CHECKPOINTS } from '../qa/production/ordinary-checkpoints';
import { installAudioReview, type AudioReview } from '../qa/production/audio-review';
import { installSequenceAudioReview, type SequenceAudioReview } from '../qa/production/sequence-audio-review';
import type { GameState } from '../lib/types';
import phase from '../qa/media/expressive-performance.json';
const audio=(p:Page)=>p.evaluate(()=>(window as unknown as{audioReview:AudioReview}).audioReview);
const mix=(p:Page)=>p.evaluate(()=>(window as unknown as{sequenceAudioReview:SequenceAudioReview}).sequenceAudioReview.sample());
const saved=(p:Page)=>p.evaluate(()=>({save:localStorage.getItem('saint-shard-3055-v1'),preferences:localStorage.getItem('saint-shard-preferences'),codex:localStorage.getItem('saint-shard-codex')}));
const stateFor=(c:typeof ORDINARY_CHECKPOINTS[number])=>routeCheckpoint(c.route,c.scene,c.choice);
const linesFor=(s:GameState)=>visibleCampaignDialogue(s.sceneId,getScene(s.sceneId).speaker,sceneText(getScene(s.sceneId),s));
async function open(p:Page,s:GameState,{width=390,sound=true,automatic=true,paragraph=false,voices=70,artwork='full'}={}){
 await p.addInitScript(installAudioReview,{});await p.addInitScript(installSequenceAudioReview);
 await p.setViewportSize({width,height:900});await p.addInitScript(({s,sound,automatic,paragraph,voices,artwork})=>{localStorage.setItem('saint-shard-3055-v1',JSON.stringify(s));localStorage.setItem('saint-shard-preferences',JSON.stringify({sound,autoVoices:automatic,voices,music:60,ambience:50,effects:0,artwork,reading:paragraph?'paragraph':'all',motion:'reduce',textStep:2,contrast:'high'}));},{s,sound,automatic,paragraph,voices,artwork});
 await p.goto('/');await p.getByTestId('continue-run').click();await expect(p.getByTestId('goal')).toBeVisible();
}
function observe(p:Page){const requests:string[]=[],errors:string[]=[];p.on('request',r=>{const path=new URL(r.url()).pathname;if(path.includes('/voice-'))requests.push(path);});p.on('pageerror',e=>errors.push(e.message));return{requests,errors};}
async function complete(p:Page,s:GameState){const files=linesFor(s).map(l=>l.id+'.mp3');await expect.poll(async()=>(await audio(p)).disposed.filter(f=>f.startsWith('voice-')),{timeout:20_000}).toEqual(files);const a=await audio(p);expect(a.started.filter(f=>f.startsWith('voice-'))).toEqual(files);expect(a.stoppedSources.filter(f=>f.startsWith('voice-'))).toEqual([]);expect(a.voiceLevels).toEqual(files.map(file=>({file,gain:1})));}
for(const width of[390,1440])for(const c of ORDINARY_CHECKPOINTS)test(`connected ${c.id}: exact complete automatic conversation over actual beds at ${width}px`,async({page})=>{
 const s=stateFor(c),o=observe(page),lines=linesFor(s);await open(page,s,{width});const before=await saved(page);
 for(const l of lines){await expect(page.getByTestId('spoken-quote')).toContainText(l.text);await expect(page.getByTestId('spoken-quote')).toHaveAttribute('data-speaker','Kerr');await expect(page.locator('.portrait-frame[data-speaking="true"]')).toHaveAttribute('data-speaker','Kerr');await expect.poll(async()=>(await audio(page)).disposed,{timeout:20_000}).toContain(l.id+'.mp3');}
 await complete(page,s);expect(o.requests).toEqual(lines.map(l=>performanceVoicePath(l.id)??`/audio/${l.id}.mp3`));expect(o.errors).toEqual([]);expect(await saved(page)).toEqual(before);
 await expect(page.getByTestId('scene-text')).toHaveText(sceneText(getScene(s.sceneId),s).split(/\n\n+/).filter(Boolean).join(''));
 await expect.poll(async()=>(await mix(page)).music).toBeCloseTo(.6,5);await expect.poll(async()=>(await mix(page)).ambience).toBeCloseTo(.5,5);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
for(const row of phase.deliveries)test(`connected original fallback once: ${row.id}`,async({page})=>{
 const c=ORDINARY_CHECKPOINTS.find(c=>c.id===row.checkpoint.id)!,s=stateFor(c),o=observe(page),path=performanceVoicePath(row.id)!;await page.route(path,r=>r.fulfill({status:404,body:'Unavailable'}));await open(page,s);const before=await saved(page);await complete(page,s);expect(o.requests.filter(p=>p.endsWith(row.id+'.mp3'))).toEqual([path,'/audio/'+row.id+'.mp3']);expect(o.errors).toEqual([]);expect(await saved(page)).toEqual(before);
});
for(const c of[ORDINARY_CHECKPOINTS[0],ORDINARY_CHECKPOINTS.at(-1)!])test(`connected undecodable alternative: ${c.id}`,async({page})=>{
 const s=stateFor(c),o=observe(page),l=linesFor(s).at(-1)!,path=performanceVoicePath(l.id);expect(path).toBeDefined();await page.route(path!,r=>r.fulfill({status:200,contentType:'audio/mpeg',body:'Invalid audio'}));await open(page,s);const before=await saved(page);await complete(page,s);expect(o.requests.filter(p=>p.endsWith(l.id+'.mp3'))).toEqual([path,'/audio/'+l.id+'.mp3']);expect(o.errors).toEqual([]);expect(await saved(page)).toEqual(before);
});
test('connected missing both retains readable story, save and canonical exit',async({page})=>{
 const s=stateFor(ORDINARY_CHECKPOINTS[0]),l=linesFor(s)[0],o=observe(page);await page.route(performanceVoicePath(l.id)!,r=>r.fulfill({status:404,body:'Unavailable'}));await page.route('/audio/'+l.id+'.mp3',r=>r.fulfill({status:404,body:'Unavailable'}));await open(page,s);const before=await saved(page);await expect(page.getByTestId('voice-line')).toHaveAttribute('data-playback','unavailable');expect(o.requests).toEqual([performanceVoicePath(l.id),'/audio/'+l.id+'.mp3']);expect((await audio(page)).started.filter(f=>f.startsWith('voice-'))).toEqual([]);await expect(page.getByTestId('scene-text')).toContainText(l.text);expect(await saved(page)).toEqual(before);const c=presentChoices(s,getScene(s.sceneId)).find(c=>c.enabled&&!c.check)!;await page.getByTestId('choice-'+c.id).click();await expect.poll(async()=>JSON.parse((await saved(page)).save!)).toEqual(commitChoice(s,c).state);expect(o.errors).toEqual([]);
});
for(const c of ORDINARY_CHECKPOINTS)test(`connected paragraph/manual/text-only: ${c.id}`,async({page})=>{
 const s=stateFor(c),o=observe(page),art:string[]=[];page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/art/'))art.push(r.url());});await open(page,s,{width:320,automatic:false,paragraph:true,artwork:'none'});const before=await saved(page);expect(o.requests).toEqual([]);const reveal=page.getByTestId('show-rest');if(await reveal.count())await reveal.click();const w=page.getByTestId('voice-line');await w.locator('summary').click();await w.getByRole('button',{name:'Listen to Kerr',exact:true}).first().click();await expect(w).toHaveAttribute('data-playback','playing');await w.getByRole('button',{name:'Stop line',exact:true}).click();await expect(w).toHaveAttribute('data-playback','idle');expect(art).toEqual([]);expect(await saved(page)).toEqual(before);expect(o.errors).toEqual([]);
});
for(const [sound,voices]of[[false,70],[true,0]]as const)test(`connected respects sound=${sound}, voices=${voices}`,async({page})=>{const o=observe(page);await open(page,stateFor(ORDINARY_CHECKPOINTS[0]),{sound,voices});const before=await saved(page);await page.getByTestId('voice-line').locator('summary').click();expect(o.requests).toEqual([]);expect((await audio(page)).started.filter(f=>f.startsWith('voice-'))).toEqual([]);expect(await saved(page)).toEqual(before);});
for(const fallback of[false,true])test(`connected Stop cancels late ${fallback?'original':'alternative'}`,async({page})=>{
 const s=stateFor(ORDINARY_CHECKPOINTS[0]),l=linesFor(s)[0],o=observe(page);let release!:()=>void;const hold=new Promise<void>(r=>{release=r;});await page.route(performanceVoicePath(l.id)!,async r=>{if(!fallback)await hold;await r.fulfill({status:404,body:'Unavailable'});});if(fallback)await page.route('/audio/'+l.id+'.mp3',async r=>{await hold;await r.continue();});
 try{await open(page,s);const before=await saved(page);await expect.poll(()=>o.requests).toContain(fallback?'/audio/'+l.id+'.mp3':performanceVoicePath(l.id));const w=page.getByTestId('voice-line');await w.locator('summary').click();await w.getByRole('button',{name:'Stop line',exact:true}).click();release();await expect.poll(async()=>(await audio(page)).decoded).toContain(l.id+'.mp3');expect((await audio(page)).started.filter(f=>f.startsWith('voice-'))).toEqual([]);await expect(w).toHaveAttribute('data-playback','idle');expect(await saved(page)).toEqual(before);expect(o.errors).toEqual([]);}finally{release();await page.unrouteAll({behavior:'ignoreErrors'});}
});
for(const fallback of[false,true])test(`connected replay uses settled logical cache, fallback=${fallback}`,async({page})=>{
 const s=stateFor(ORDINARY_CHECKPOINTS[0]),l=linesFor(s)[0],o=observe(page);let release!:()=>void;const hold=new Promise<void>(r=>{release=r;});await page.route(performanceVoicePath(l.id)!,async r=>{await hold;if(fallback)await r.fulfill({status:404,body:'Unavailable'});else await r.continue();});
 try{await open(page,s);const before=await saved(page);await expect.poll(async()=>(await mix(page)).music).toBeCloseTo(.6,5);await expect.poll(async()=>(await mix(page)).ambience).toBeCloseTo(.5,5);release();await complete(page,s);const w=page.getByTestId('voice-line');await w.locator('summary').click();await w.getByRole('button',{name:'Listen to Kerr',exact:true}).click();await expect.poll(async()=>(await audio(page)).disposed.filter(f=>f===l.id+'.mp3').length,{timeout:20_000}).toBe(2);expect(o.requests).toEqual(fallback?[performanceVoicePath(l.id),'/audio/'+l.id+'.mp3']:[performanceVoicePath(l.id)]);expect(await saved(page)).toEqual(before);expect(o.errors).toEqual([]);}finally{release();await page.unrouteAll({behavior:'ignoreErrors'});}
});
