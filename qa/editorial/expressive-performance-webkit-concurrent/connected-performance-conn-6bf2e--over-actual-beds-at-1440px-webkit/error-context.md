# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: connected-performance.spec.ts >> connected shared-breach: exact complete automatic conversation over actual beds at 1440px
- Location: tests/connected-performance.spec.ts:23:70

# Error details

```
Error: Test timeout of 30000ms exceeded
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - alert [ref=e2]
  - generic [ref=e3]:
    - link "Skip to choices" [ref=e4]:
      - /url: "#choices"
    - banner [ref=e5]:
      - generic [ref=e12]:
        - text: Saint Shard
        - generic [ref=e13]: Kite City 3055
      - generic [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]: Strain
          - meter "Strain 0 of 5" [ref=e19]
        - generic [ref=e25]: 165 cr
      - generic [ref=e28]:
        - button "Settings" [ref=e29] [cursor=pointer]
        - button "Saves" [ref=e30] [cursor=pointer]
        - button "Abandon" [ref=e31] [cursor=pointer]
    - generic [ref=e32]:
      - main [ref=e33]:
        - article [active] [ref=e34]:
          - generic [ref=e35]:
            - figure [ref=e36]:
              - generic "Kerr · Her shadow" [ref=e37]:
                - generic [ref=e38]: Kerr
                - generic [ref=e39]: Her shadow
            - generic [ref=e40]:
              - paragraph [ref=e41]:
                - text: Ward Four stall
                - generic [ref=e45]: · The Week
              - heading "Ward Four stall · The Week" [level=1] [ref=e46]
              - paragraph [ref=e47]: The week wants a buyer or a witness.
              - paragraph [ref=e48]: Ward Four stall · The Week. The week wants a buyer or a witness.
          - status [ref=e49]: Loaded Autosave — The Week · Ward Four stall
          - generic [ref=e50]:
            - paragraph [ref=e51]: “You showed me the source summary. Leave the witness out of my errands. I don't need a person's address to ask about a shift.”
            - paragraph [ref=e52]: “My name went into their register after you promised it wouldn't. Say that before you ask me for another introduction.”
            - paragraph [ref=e53]: The counter offers registered sorting work under your own handle. An introduction supplies no payment, recovery, treatment or source. Any earlier breach stays recorded.
          - complementary "Kerr selected dialogue" [ref=e54]:
            - button "Listen to Kerr" [ref=e55] [cursor=pointer]
            - button "Play all dialogue" [ref=e56] [cursor=pointer]
            - status [ref=e57]: Selected dialogue · Line 1 of 2 · synthetic voice
            - group [ref=e61]:
              - generic "Voice transcript" [ref=e62] [cursor=pointer]
              - option "1. Kerr · You showed me the source summary. Leave the witness out of my er" [selected]
              - option "2. Kerr · My name went into their register after you promised it wouldn't."
          - region "Current commitments" [ref=e64]:
            - group [ref=e65]:
              - generic "Campaign commitments · 1/2 complete · 1 compromised" [ref=e66] [cursor=pointer]
          - group [ref=e67]:
            - generic "Depot response · people and consequences" [ref=e68] [cursor=pointer]
          - region [ref=e69]:
            - generic [ref=e70]:
              - heading "Your next move" [level=2] [ref=e71]
              - paragraph [ref=e72]: Selecting an option commits it. For a check, review the odds and costs first; Back leaves it unrolled.
              - paragraph [ref=e73]:
                - generic [ref=e74]: Action
                - generic [ref=e77]: Move on
            - button "Acknowledge the broken private terms and retain the docket." [ref=e80] [cursor=pointer]:
              - generic [ref=e81]: "1"
            - button "Deny the recorded breach. Kerr withholds this introduction." [ref=e86] [cursor=pointer]:
              - generic [ref=e87]: "2"
            - button "Leave the conversation with the actual terms unchanged." [ref=e92] [cursor=pointer]:
              - generic [ref=e93]: "3"
          - group [ref=e98]:
            - generic "Look closer · Kerr's counter · his answer" [ref=e99] [cursor=pointer]
      - complementary "Character sheet" [ref=e100]:
        - generic [ref=e107]:
          - heading "Replay" [level=2] [ref=e108]
          - paragraph [ref=e109]: Dustline · Ada
        - button "City map" [ref=e110] [cursor=pointer]
        - group [ref=e113]:
          - generic "Origin & complication" [ref=e114] [cursor=pointer]
        - group [ref=e115]:
          - generic "People · 8 met" [ref=e116] [cursor=pointer]
        - tablist "Character details" [ref=e117]:
          - tab "stats" [selected] [ref=e118] [cursor=pointer]
          - tab "gear" [ref=e119] [cursor=pointer]
          - tab "journal" [ref=e120] [cursor=pointer]
        - tabpanel "stats" [ref=e121]:
          - paragraph [ref=e122]:
            - strong [ref=e123]: Signal discipline
            - text: · Chrome checks +1. Isolate an archive key locally; scanner preparation unlocks a clinic-only transfer at a strain cost.
          - generic [ref=e124]:
            - generic [ref=e125]: Chrome
            - generic [ref=e128]: "2"
          - generic [ref=e131]:
            - generic [ref=e132]: Nerve
            - generic [ref=e135]: "2"
          - generic [ref=e138]:
            - generic [ref=e139]: Face
            - generic [ref=e142]: "1"
          - generic [ref=e145]:
            - generic [ref=e146]: Ghost
            - generic [ref=e149]: "5"
          - group [ref=e152]:
            - generic "How stats work" [ref=e153] [cursor=pointer]
          - heading "Factions" [level=3] [ref=e154]
          - generic [ref=e155]:
            - generic [ref=e156]: Quill
            - generic [ref=e159]: "4"
          - generic [ref=e162]:
            - generic [ref=e163]: Lumen
            - generic [ref=e166]: "2"
          - generic [ref=e169]:
            - generic [ref=e170]: Helion
            - generic [ref=e173]: "5"
          - generic [ref=e176]:
            - generic [ref=e177]: The wards
            - generic [ref=e180]: "2"
          - group [ref=e183]:
            - generic "How factions affect checks" [ref=e184] [cursor=pointer]
          - group [ref=e185]:
            - generic "What you did · 6 recent" [ref=e186] [cursor=pointer]
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
> 22 | async function complete(p:Page,s:GameState){const files=linesFor(s).map(l=>l.id+'.mp3');await expect.poll(async()=>(await audio(p)).disposed.filter(f=>f.startsWith('voice-')),{timeout:20_000}).toEqual(files);const a=await audio(p);expect(a.started.filter(f=>f.startsWith('voice-'))).toEqual(files);expect(a.stoppedSources.filter(f=>f.startsWith('voice-'))).toEqual([]);expect(a.voiceLevels).toEqual(files.map(file=>({file,gain:1})));}
     |                                                                                                                                                                                                  ^ Error: Test timeout of 30000ms exceeded
  23 | for(const width of[390,1440])for(const c of ORDINARY_CHECKPOINTS)test(`connected ${c.id}: exact complete automatic conversation over actual beds at ${width}px`,async({page})=>{
  24 |  const s=stateFor(c),o=observe(page),lines=linesFor(s);await open(page,s,{width});const before=await saved(page);
  25 |  for(const l of lines){await expect(page.getByTestId('spoken-quote')).toContainText(l.text);await expect(page.getByTestId('spoken-quote')).toHaveAttribute('data-speaker','Kerr');await expect(page.locator('.portrait-frame[data-speaking="true"]')).toHaveAttribute('data-speaker','Kerr');await expect.poll(async()=>(await audio(page)).disposed,{timeout:20_000}).toContain(l.id+'.mp3');}
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