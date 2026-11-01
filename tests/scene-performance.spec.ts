import {test,expect,type Page}from '@playwright/test';
import {SCENE_PERFORMANCE_CHECKPOINTS}from '../qa/production/scene-performance-checkpoints';
import {getScene,sceneText,presentChoices,commitChoice}from '../lib/engine';
import {performanceVoicePath}from '../lib/performance-delivery';
import {voiceLevel}from '../lib/voice-level';
import {scenePerformanceLevel}from '../lib/scene-performance';
import {sceneIllustration}from '../lib/art';
import {sceneSoundPlan}from '../lib/sound';
import {sequenceContinuity}from '../lib/sequence-continuity';
import {actName}from '../lib/story/goal';
import {TITLE_MUSIC}from '../lib/title-music';
import {installAudioReview,type AudioReview}from '../qa/production/audio-review';
import type{GameState}from '../lib/types';
const audio=(p:Page)=>p.evaluate(()=>(window as unknown as{audioReview:AudioReview}).audioReview);
const saved=(p:Page)=>p.evaluate(()=>localStorage.getItem('saint-shard-3055-v1'));
const cases=SCENE_PERFORMANCE_CHECKPOINTS;
const file=(id:string)=>id+(id.startsWith('voice-campaign-')?'.mp3':'.wav');
async function open(p:Page,state:GameState,{width=390,automatic=true,sound=true,voices=70,paragraph=false,beforeContinue}: {width?:number;automatic?:boolean;sound?:boolean;voices?:number;paragraph?:boolean;beforeContinue?:()=>Promise<void>}={}){
 await p.setViewportSize({width,height:900});await p.addInitScript(installAudioReview,{});await p.addInitScript(({state,automatic,sound,voices,paragraph})=>{localStorage.setItem('saint-shard-3055-v1',JSON.stringify(state));localStorage.setItem('saint-shard-preferences',JSON.stringify({sound,voices,autoVoices:automatic,music:60,ambience:50,effects:0,reading:paragraph?'paragraph':'all',artwork:paragraph?'none':'full',textStep:2,motion:'reduce'}));},{state,automatic,sound,voices,paragraph});await p.goto('/');if(beforeContinue)await beforeContinue();await p.getByTestId('continue-run').click();await expect(p.getByTestId('goal')).toBeVisible();
}
function requests(p:Page){const paths:string[]=[];p.on('request',r=>{const path=new URL(r.url()).pathname;if(path.includes('/voice-'))paths.push(path);});return paths;}
function backgroundRequests(p:Page){
 const files=new Set<string>();p.on('request',r=>{const path=new URL(r.url()).pathname;if(path.startsWith('/audio/')&&!path.includes('/voice-'))files.add(path.split('/').at(-1)!);});return files;
}
function cacheBeds(state:GameState){
 const scene=getScene(state.sceneId),plan=sequenceContinuity(state,sceneSoundPlan(state,scene.location,actName(state)),'normal');
 return {music:plan.mood==='street'?'theme.flac':`theme-${plan.mood}.flac`,ambience:`ambience-${plan.district}.flac`};
}
async function settleCacheBeds(p:Page,state:GameState,background:Set<string>){
 const bed=cacheBeds(state);await expect.poll(async()=>(await audio(p)).started).toEqual(expect.arrayContaining([bed.music,bed.ambience]));
 // Real late bed/menu decodes may legitimately evict a voice under24MiB.
 // Start the strict cache-hit task only after every requested bed has decoded.
 await expect.poll(async()=>{const decoded=new Set((await audio(p)).decoded);return[...background].filter(file=>!decoded.has(file));}).toEqual([]);
}
async function manual(p:Page,c:typeof cases[number]){const v=p.getByTestId('voice-line');await v.locator('summary').click();if(c.lines.length>1)await v.getByLabel('Dialogue line',{exact:true}).selectOption(c.lines.find(l=>l.id===c.delivery.id)!.key);await v.getByRole('button',{name:'Listen to '+c.delivery.speaker,exact:true}).click();return v;}
async function cleanup(p:Page){await p.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));await expect.poll(async()=>(await audio(p)).liveSources).toBe(0);const a=await audio(p);expect(a.sourcesCreated).toBe(a.sourcesDisposed);expect(a.sourcesCreated).toBe(a.buffersCleared);}
for(const width of[390,1440])for(const c of cases)test(`scene performance ${c.delivery.id}: complete words, actor, art and natural queue at${width}`,async({page})=>{
 const paths=requests(page);await open(page,c.state,{width});const before=await saved(page);await expect(page.getByTestId('scene-text')).toHaveText(sceneText(getScene(c.state.sceneId),c.state).split(/\n\n+/).filter(Boolean).join(''));
 for(const l of c.lines){await expect(page.getByTestId('spoken-quote')).toContainText(l.text);await expect(page.getByTestId('spoken-quote')).toHaveAttribute('data-speaker',l.speaker);await expect.poll(async()=>(await audio(page)).disposed,{timeout:20000}).toContain(file(l.id));}
 const a=await audio(page);expect(a.started.filter(f=>f.startsWith('voice-'))).toEqual(c.lines.map(l=>file(l.id)));expect(paths).toEqual(c.lines.map(l=>performanceVoicePath(l.id)??'/audio/'+file(l.id)));for(const l of c.lines){const path=performanceVoicePath(l.id)??'/audio/'+file(l.id);expect(a.voiceLevels.find(r=>r.file===file(l.id))!.gain).toBeCloseTo(scenePerformanceLevel(l.id,path)??voiceLevel(l.id),6);}
 const art=sceneIllustration(c.state.sceneId,c.state.flags);if(art)await expect(page.getByTestId('scene-illustration').locator('img')).toHaveAttribute('src',art.src);expect(await saved(page)).toBe(before);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await cleanup(page);
});
for(const failure of['download','decode'])for(const c of cases)test(`scene performance ${c.delivery.id}: ${failure} falls back once at the measured source level`,async({page})=>{
 const path=performanceVoicePath(c.delivery.id)!,original='/'+c.delivery.fallbackPath.slice(7),paths=requests(page);await page.route(path,r=>r.fulfill({status:failure==='download'?404:200,contentType:'audio/mpeg',body:'Unavailable'}));await open(page,c.state,{automatic:false});const before=await saved(page);await manual(page,c);await expect.poll(async()=>(await audio(page)).disposed,{timeout:20000}).toContain(c.delivery.id+'.mp3');expect(paths).toEqual([path,original]);expect((await audio(page)).voiceLevels.find(l=>l.file===c.delivery.id+'.mp3')!.gain).toBeCloseTo(c.delivery.fallbackGain,6);expect(await saved(page)).toBe(before);await cleanup(page);
});
for(const c of cases)test(`scene performance ${c.delivery.id}: both missing leave words and canonical exit`,async({page})=>{
 const path=performanceVoicePath(c.delivery.id)!,original='/'+c.delivery.fallbackPath.slice(7),paths=requests(page);await page.route(path,r=>r.fulfill({status:404,body:'Missing'}));await page.route(original,r=>r.fulfill({status:404,body:'Missing'}));await open(page,c.state,{automatic:false});const before=await saved(page);const v=await manual(page,c);await expect(v).toHaveAttribute('data-playback','unavailable');expect(paths).toEqual([path,original]);await expect(page.getByTestId('scene-text')).toContainText(c.delivery.text);expect(await saved(page)).toBe(before);const ch=presentChoices(c.state,getScene(c.state.sceneId)).find(ch=>ch.enabled&&!ch.check)!;await page.getByTestId('choice-'+ch.id).click();await expect.poll(async()=>JSON.parse((await saved(page))!)).toEqual(commitChoice(c.state,ch).state);await cleanup(page);
});
for(const fallback of[false,true])for(const c of cases)test(`scene performance ${c.delivery.id}: Stop cancels late ${fallback?'original':'preferred'}`,async({page})=>{
 const path=performanceVoicePath(c.delivery.id)!,original='/'+c.delivery.fallbackPath.slice(7),paths=requests(page);let release!:()=>void;const gate=new Promise<void>(r=>release=r);if(fallback)await page.route(path,r=>r.fulfill({status:404,body:'Missing'}));await page.route(fallback?original:path,async r=>{await gate;await r.continue();});try{await open(page,c.state,{automatic:false});const before=await saved(page);const v=await manual(page,c);await expect.poll(()=>paths).toContain(fallback?original:path);await v.getByRole('button',{name:'Stop line',exact:true}).click();release();await expect.poll(async()=>(await audio(page)).decoded).toContain(c.delivery.id+'.mp3');expect((await audio(page)).started.filter(n=>n===c.delivery.id+'.mp3')).toEqual([]);expect(await saved(page)).toBe(before);await cleanup(page);}finally{release();await page.unrouteAll({behavior:'ignoreErrors'});}
});
for(const c of cases)test(`scene performance ${c.delivery.id}: paragraph manual and text-only retain control`,async({page})=>{
 const art:string[]=[];page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/art/'))art.push(r.url());});const paths=requests(page);await open(page,c.state,{automatic:false,paragraph:true});const before=await saved(page);expect(paths).toEqual([]);const rest=page.getByTestId('show-rest');if(await rest.count())await rest.click();await expect(page.getByTestId('scene-text')).toContainText(c.delivery.text);const v=await manual(page,c);await expect(v).toHaveAttribute('data-playback','playing');await expect(page.getByTestId('spoken-quote')).toContainText(c.delivery.text);await v.getByRole('button',{name:'Stop line',exact:true}).click();expect(art).toEqual([]);expect(await saved(page)).toBe(before);await cleanup(page);
});
for(const fallback of[false,true])for(const c of cases)test(`scene performance ${c.delivery.id}: replay retains cached ${fallback?'original':'preferred'} level`,async({page})=>{
 const path=performanceVoicePath(c.delivery.id)!,original='/'+c.delivery.fallbackPath.slice(7),paths=requests(page),background=backgroundRequests(page);if(fallback)await page.route(path,r=>r.fulfill({status:404,body:'Missing'}));await open(page,c.state,{automatic:false});await settleCacheBeds(page,c.state,background);const before=await saved(page);const v=await manual(page,c);await expect.poll(async()=>(await audio(page)).disposed.filter(n=>n===c.delivery.id+'.mp3').length,{timeout:20000}).toBe(1);await v.getByRole('button',{name:'Listen to '+c.delivery.speaker,exact:true}).click();await expect.poll(async()=>(await audio(page)).disposed.filter(n=>n===c.delivery.id+'.mp3').length,{timeout:20000}).toBe(2);expect(paths).toEqual(fallback?[path,original]:[path]);const levels=(await audio(page)).voiceLevels.filter(l=>l.file===c.delivery.id+'.mp3').map(l=>l.gain);const expected=Math.fround(fallback?c.delivery.fallbackGain:1);expect(levels).toEqual([expected,expected]);expect(await saved(page)).toBe(before);await cleanup(page);
});
test('late menu and ambience decodes retain the exact fallback level on replay',async({page},info)=>{
 const c=cases.find(c=>c.delivery.id==='voice-campaign-kerr-899d4ba5ecfb')!,path=performanceVoicePath(c.delivery.id)!,original='/'+c.delivery.fallbackPath.slice(7),paths=requests(page),background=backgroundRequests(page),bed=cacheBeds(c.state),title=`${TITLE_MUSIC.name}.${TITLE_MUSIC.extension}`;
 expect(c.delivery.fallbackGain).not.toBe(1);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 let releaseTitle!:()=>void,releaseAmbience!:()=>void;
 const titleGate=new Promise<void>(r=>releaseTitle=r),ambienceGate=new Promise<void>(r=>releaseAmbience=r);
 await page.route(path,r=>r.fulfill({status:404,body:'Missing'}));
 await page.route('/audio/'+title,async r=>{await titleGate;await r.continue();});
 await page.route('/audio/'+bed.ambience,async r=>{await ambienceGate;await r.continue();});
 try{
  await open(page,c.state,{automatic:false,beforeContinue:async()=>{await page.getByRole('heading',{name:'Saint Shard',exact:true}).click();await expect.poll(()=>background.has(title)).toBe(true);}});
  const before=await saved(page);await expect.poll(async()=>(await audio(page)).started).toContain(bed.music);
  const v=await manual(page,c);await expect(page.getByTestId('spoken-quote')).toContainText(c.delivery.text);
  await expect.poll(async()=>(await audio(page)).disposed.filter(n=>n===file(c.delivery.id)).length,{timeout:20000}).toBe(1);
  expect((await audio(page)).decoded).not.toContain(title);expect((await audio(page)).decoded).not.toContain(bed.ambience);
  releaseAmbience();await expect.poll(async()=>(await audio(page)).started).toContain(bed.ambience);
  releaseTitle();await expect.poll(async()=>(await audio(page)).decoded).toContain(title);
  expect((await audio(page)).started).not.toContain(title);
  await v.getByRole('button',{name:'Listen to '+c.delivery.speaker,exact:true}).click();await expect(page.getByTestId('spoken-quote')).toContainText(c.delivery.text);
  await expect.poll(async()=>(await audio(page)).disposed.filter(n=>n===file(c.delivery.id)).length,{timeout:20000}).toBe(2);
  const a=await audio(page),decoded=a.decoded.filter(n=>n===file(c.delivery.id)).length,levels=a.voiceLevels.filter(l=>l.file===file(c.delivery.id)).map(l=>l.gain),expected=Math.fround(c.delivery.fallbackGain);
  // Native decode rates determine whether this real pressure evicts the voice.
  // A retained buffer and a refetched original must deliver the same trim.
  expect([1,2]).toContain(decoded);expect(paths).toEqual(Array.from({length:decoded},()=>[path,original]).flat());
  expect(a.started.filter(n=>n.startsWith('voice-'))).toEqual([file(c.delivery.id),file(c.delivery.id)]);expect(levels).toEqual([expected,expected]);expect(errors).toEqual([]);expect(await saved(page)).toBe(before);
  await info.attach('late-cache-observation',{body:JSON.stringify({paths,decoded:a.decoded,levels,expected,saveUnchanged:true,errors}),contentType:'application/json'});await cleanup(page);
 }finally{releaseTitle();releaseAmbience();await page.unrouteAll({behavior:'ignoreErrors'});}
});
for(const[sound,voices]of[[false,70],[true,0]]as const)for(const c of cases)test(`scene performance ${c.delivery.id}: sound${sound}/voices${voices} makes no voice request`,async({page})=>{
 const paths=requests(page);await open(page,c.state,{sound,voices});expect(paths).toEqual([]);expect((await audio(page)).started.filter(n=>n.startsWith('voice-'))).toEqual([]);await cleanup(page);
});
