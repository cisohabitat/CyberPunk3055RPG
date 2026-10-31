# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: connected-performance.spec.ts >> connected shared-breach: exact complete automatic conversation over actual beds at 390px
- Location: tests/connected-performance.spec.ts:23:70

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByTestId('spoken-quote')
Expected substring: "My name went into their register after you promised it wouldn't. Say that before you ask me for another introduction."
Received string:    "You showed me the source summary. Leave the witness out of my errands. I don't need a person's address to ask about a shift."
Timeout: 5000ms

Call log:
  - Expect "toContainText" getByTestId('spoken-quote') with timeout 5000ms
  - waiting for getByTestId('spoken-quote')
    14 × locator resolved to <mark aria-current="true" data-speaker="Kerr" class="spoken-quote" data-testid="spoken-quote">You showed me the source summary. Leave the witne…</mark>
       - unexpected value "You showed me the source summary. Leave the witness out of my errands. I don't need a person's address to ask about a shift."

```

```yaml
- mark: You showed me the source summary. Leave the witness out of my errands. I don't need a person's address to ask about a shift.
```

# Test source

```ts
  1  | import { test, expect, type Page } from '@playwright/test';
  2  | import { getScene, sceneText, presentChoices, commitChoice } from '../lib/engine';
  3  | import { visibleCampaignDialogue } from '../lib/campaign-dialogue';
  4  | import { performanceVoicePath } from '../lib/performance-delivery';
  5  | import { routeCheckpoint } from '../qa/production/route-checkpoint';
  6  | import { ORDINARY_CHECKPOINTS } from '../qa/production/ordinary-checkpoints';
  7  | import { installAudioReview, type AudioReview } from '../qa/production/audio-review';
  8  | import { installSequenceAudioReview, type SequenceAudioReview } from '../qa/production/sequence-audio-review';
  9  | import type { GameState } from '../lib/types';
  10 | import phase from '../qa/media/expressive-performance.json';
  11 | const audio=(p:Page)=>p.evaluate(()=>(window as unknown as{audioReview:AudioReview}).audioReview);
  12 | const mix=(p:Page)=>p.evaluate(()=>(window as unknown as{sequenceAudioReview:SequenceAudioReview}).sequenceAudioReview.sample());
  13 | const saved=(p:Page)=>p.evaluate(()=>({save:localStorage.getItem('saint-shard-3055-v1'),preferences:localStorage.getItem('saint-shard-preferences'),codex:localStorage.getItem('saint-shard-codex')}));
  14 | const stateFor=(c:typeof ORDINARY_CHECKPOINTS[number])=>routeCheckpoint(c.route,c.scene,c.choice);
  15 | const linesFor=(s:GameState)=>visibleCampaignDialogue(s.sceneId,getScene(s.sceneId).speaker,sceneText(getScene(s.sceneId),s));
  16 | async function open(p:Page,s:GameState,{width=390,sound=true,automatic=true,paragraph=false,voices=70,artwork='full'}={}){
  17 |  await p.addInitScript(installAudioReview,{});await p.addInitScript(installSequenceAudioReview);
  18 |  await p.setViewportSize({width,height:900});await p.addInitScript(({s,sound,automatic,paragraph,voices,artwork})=>{localStorage.setItem('saint-shard-3055-v1',JSON.stringify(s));localStorage.setItem('saint-shard-preferences',JSON.stringify({sound,autoVoices:automatic,voices,music:60,ambience:50,effects:0,artwork,reading:paragraph?'paragraph':'all',motion:'reduce',textStep:2,contrast:'high'}));},{s,sound,automatic,paragraph,voices,artwork});
  19 |  await p.goto('/');await p.getByTestId('continue-run').click();await expect(p.getByTestId('goal')).toBeVisible();
  20 | }
  21 | function observe(p:Page){const requests:string[]=[],errors:string[]=[];p.on('request',r=>{const path=new URL(r.url()).pathname;if(path.includes('/voice-'))requests.push(path);});p.on('pageerror',e=>errors.push(e.message));return{requests,errors};}
  22 | async function complete(p:Page,s:GameState){const files=linesFor(s).map(l=>l.id+'.mp3');await expect.poll(async()=>(await audio(p)).disposed.filter(f=>f.startsWith('voice-')),{timeout:20_000}).toEqual(files);const a=await audio(p);expect(a.started.filter(f=>f.startsWith('voice-'))).toEqual(files);expect(a.stoppedSources.filter(f=>f.startsWith('voice-'))).toEqual([]);expect(a.voiceLevels).toEqual(files.map(file=>({file,gain:1})));}
  23 | for(const width of[390,1440])for(const c of ORDINARY_CHECKPOINTS)test(`connected ${c.id}: exact complete automatic conversation over actual beds at ${width}px`,async({page})=>{
  24 |  const s=stateFor(c),o=observe(page),lines=linesFor(s);await open(page,s,{width});const before=await saved(page);
> 25 |  for(const l of lines){await expect(page.getByTestId('spoken-quote')).toContainText(l.text);await expect(page.getByTestId('spoken-quote')).toHaveAttribute('data-speaker','Kerr');await expect(page.locator('.portrait-frame[data-speaking="true"]')).toHaveAttribute('data-speaker','Kerr');}
     |                                                                       ^ Error: expect(locator).toContainText(expected) failed
  26 |  await complete(page,s);expect(o.requests).toEqual(lines.map(l=>performanceVoicePath(l.id)??`/audio/${l.id}.mp3`));expect(o.errors).toEqual([]);expect(await saved(page)).toEqual(before);
  27 |  await expect(page.getByTestId('scene-text')).toHaveText(sceneText(getScene(s.sceneId),s).split(/\n\n+/).filter(Boolean).join(''));
  28 |  await expect.poll(async()=>(await mix(page)).music).toBeCloseTo(.6,5);await expect.poll(async()=>(await mix(page)).ambience).toBeCloseTo(.5,5);
  29 |  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  30 | });
  31 | for(const row of phase.deliveries)test(`connected original fallback once: ${row.id}`,async({page})=>{
  32 |  const c=ORDINARY_CHECKPOINTS.find(c=>c.id===row.checkpoint.id)!,s=stateFor(c),o=observe(page),path=performanceVoicePath(row.id)!;await page.route(path,r=>r.fulfill({status:404,body:'Unavailable'}));await open(page,s);const before=await saved(page);await complete(page,s);expect(o.requests.filter(p=>p.endsWith(row.id+'.mp3'))).toEqual([path,'/audio/'+row.id+'.mp3']);expect(o.errors).toEqual([]);expect(await saved(page)).toEqual(before);
  33 | });
  34 | for(const c of[ORDINARY_CHECKPOINTS[0],ORDINARY_CHECKPOINTS.at(-1)!])test(`connected undecodable alternative: ${c.id}`,async({page})=>{
  35 |  const s=stateFor(c),o=observe(page),l=linesFor(s).at(-1)!,path=performanceVoicePath(l.id);expect(path).toBeDefined();await page.route(path!,r=>r.fulfill({status:200,contentType:'audio/mpeg',body:'Invalid audio'}));await open(page,s);const before=await saved(page);await complete(page,s);expect(o.requests.filter(p=>p.endsWith(l.id+'.mp3'))).toEqual([path,'/audio/'+l.id+'.mp3']);expect(o.errors).toEqual([]);expect(await saved(page)).toEqual(before);
  36 | });
  37 | test('connected missing both retains readable story, save and canonical exit',async({page})=>{
  38 |  const s=stateFor(ORDINARY_CHECKPOINTS[0]),l=linesFor(s)[0],o=observe(page);await page.route(performanceVoicePath(l.id)!,r=>r.fulfill({status:404,body:'Unavailable'}));await page.route('/audio/'+l.id+'.mp3',r=>r.fulfill({status:404,body:'Unavailable'}));await open(page,s);const before=await saved(page);await expect(page.getByTestId('voice-line')).toHaveAttribute('data-playback','unavailable');expect(o.requests).toEqual([performanceVoicePath(l.id),'/audio/'+l.id+'.mp3']);expect((await audio(page)).started.filter(f=>f.startsWith('voice-'))).toEqual([]);await expect(page.getByTestId('scene-text')).toContainText(l.text);expect(await saved(page)).toEqual(before);const c=presentChoices(s,getScene(s.sceneId)).find(c=>c.enabled&&!c.check)!;await page.getByTestId('choice-'+c.id).click();await expect.poll(async()=>JSON.parse((await saved(page)).save!)).toEqual(commitChoice(s,c).state);expect(o.errors).toEqual([]);
  39 | });
  40 | for(const c of ORDINARY_CHECKPOINTS)test(`connected paragraph/manual/text-only: ${c.id}`,async({page})=>{
  41 |  const s=stateFor(c),o=observe(page),art:string[]=[];page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/art/'))art.push(r.url());});await open(page,s,{width:320,automatic:false,paragraph:true,artwork:'none'});const before=await saved(page);expect(o.requests).toEqual([]);const reveal=page.getByTestId('show-rest');if(await reveal.count())await reveal.click();const w=page.getByTestId('voice-line');await w.locator('summary').click();await w.getByRole('button',{name:'Listen to Kerr',exact:true}).first().click();await expect(w).toHaveAttribute('data-playback','playing');await w.getByRole('button',{name:'Stop line',exact:true}).click();await expect(w).toHaveAttribute('data-playback','idle');expect(art).toEqual([]);expect(await saved(page)).toEqual(before);expect(o.errors).toEqual([]);
  42 | });
  43 | for(const [sound,voices]of[[false,70],[true,0]]as const)test(`connected respects sound=${sound}, voices=${voices}`,async({page})=>{const o=observe(page);await open(page,stateFor(ORDINARY_CHECKPOINTS[0]),{sound,voices});const before=await saved(page);await page.getByTestId('voice-line').locator('summary').click();expect(o.requests).toEqual([]);expect((await audio(page)).started.filter(f=>f.startsWith('voice-'))).toEqual([]);expect(await saved(page)).toEqual(before);});
  44 | for(const fallback of[false,true])test(`connected Stop cancels late ${fallback?'original':'alternative'}`,async({page})=>{
  45 |  const s=stateFor(ORDINARY_CHECKPOINTS[0]),l=linesFor(s)[0],o=observe(page);let release!:()=>void;const hold=new Promise<void>(r=>{release=r;});await page.route(performanceVoicePath(l.id)!,async r=>{if(!fallback)await hold;await r.fulfill({status:404,body:'Unavailable'});});if(fallback)await page.route('/audio/'+l.id+'.mp3',async r=>{await hold;await r.continue();});
  46 |  try{await open(page,s);const before=await saved(page);await expect.poll(()=>o.requests).toContain(fallback?'/audio/'+l.id+'.mp3':performanceVoicePath(l.id));const w=page.getByTestId('voice-line');await w.locator('summary').click();await w.getByRole('button',{name:'Stop line',exact:true}).click();release();await expect.poll(async()=>(await audio(page)).decoded).toContain(l.id+'.mp3');expect((await audio(page)).started.filter(f=>f.startsWith('voice-'))).toEqual([]);await expect(w).toHaveAttribute('data-playback','idle');expect(await saved(page)).toEqual(before);expect(o.errors).toEqual([]);}finally{release();await page.unrouteAll({behavior:'ignoreErrors'});}
  47 | });
  48 | for(const fallback of[false,true])test(`connected replay uses settled logical cache, fallback=${fallback}`,async({page})=>{
  49 |  const s=stateFor(ORDINARY_CHECKPOINTS[0]),l=linesFor(s)[0],o=observe(page);let release!:()=>void;const hold=new Promise<void>(r=>{release=r;});await page.route(performanceVoicePath(l.id)!,async r=>{await hold;if(fallback)await r.fulfill({status:404,body:'Unavailable'});else await r.continue();});
  50 |  try{await open(page,s);const before=await saved(page);await expect.poll(async()=>(await mix(page)).music).toBeCloseTo(.6,5);await expect.poll(async()=>(await mix(page)).ambience).toBeCloseTo(.5,5);release();await complete(page,s);const w=page.getByTestId('voice-line');await w.locator('summary').click();await w.getByRole('button',{name:'Listen to Kerr',exact:true}).click();await expect.poll(async()=>(await audio(page)).disposed.filter(f=>f===l.id+'.mp3').length,{timeout:20_000}).toBe(2);expect(o.requests).toEqual(fallback?[performanceVoicePath(l.id),'/audio/'+l.id+'.mp3']:[performanceVoicePath(l.id)]);expect(await saved(page)).toEqual(before);expect(o.errors).toEqual([]);}finally{release();await page.unrouteAll({behavior:'ignoreErrors'});}
  51 | });
  52 | 
```