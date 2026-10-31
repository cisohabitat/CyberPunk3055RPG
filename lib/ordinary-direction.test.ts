import { isConnectedPerformanceFile } from "../qa/production/connected-performance-media";
import assert from 'node:assert/strict';
import { it } from 'node:test';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { createCharacter, getScene, sceneText, presentChoices, commitChoice } from './engine';
import { visibleCampaignDialogue } from './campaign-dialogue';
import { sceneIllustration, portraitArt } from './art';
import { ORDINARY_DIRECTIONS, ordinaryDirection } from './ordinary-direction';
import baseline from '../qa/editorial/ordinary-direction-baseline.json';
import manifest from '../qa/media/ordinary-scene-direction.json';
const files=(d:string):string[]=>readdirSync(d,{withFileTypes:true}).flatMap(r=>r.isDirectory()?files(`${d}/${r.name}`):[`${d}/${r.name}`]).filter(p=>!isConnectedPerformanceFile(p));
const hash=(b:string|Buffer)=>createHash('sha256').update(b).digest('hex');
it('preserves all241 campaigns,17281 full visits,837 media and every preceding manifest exactly',()=>{
 assert.equal(hash(readFileSync('qa/editorial/ordinary-direction-baseline.json')),'9d198af6fdb9684dbfa54db8830da1b2501645793cb6d3982ce71414e4d0e7ef');
 assert.equal(hash(readFileSync('qa/editorial/ordinary-direction-layout-baseline.json')),'530e004fea88f1e81bfac5c4be0e6942655db7ac5128f9aa42a821d389bbbfc0');
 const routes=files('qa/routes').filter(f=>f.endsWith('.json')).sort(),rows=[];
 assert.deepEqual(routes,baseline.routeFiles);assert.equal(routes.length,241);
 for(const file of routes){const spec=JSON.parse(readFileSync(file,'utf8'));let state=createCharacter(spec.character);for(let step=0;step<=spec.steps.length;step++){const scene=getScene(state.sceneId),text=sceneText(scene,state),choices=presentChoices(state,scene);rows.push({file,step,state,text,choices,voice:visibleCampaignDialogue(scene.id,scene.speaker,text),actor:scene.speaker,art:sceneIllustration(scene.id,state.flags),portrait:portraitArt(scene.speaker,scene.id,state.flags)});if(step===spec.steps.length)break;const a=spec.steps[step],c=choices.find(c=>c.id===a.choiceId&&c.enabled);assert.ok(c);state=commitChoice(state,c,c.check?{roll:a.roll}:undefined).state;}}
 assert.equal(rows.length,17281);assert.equal(hash(JSON.stringify(rows)),baseline.campaignSha256);
 assert.deepEqual([...files('public/art'),...files('public/audio')].sort().map(path=>({path,sha256:hash(readFileSync(path))})),baseline.media);
 const mediaManifests=files('qa/media').filter(f=>f.endsWith('.json')&&f!=='qa/media/ordinary-scene-direction.json').sort();assert.deepEqual(mediaManifests,baseline.manifests.map(m=>m.path));for(const m of baseline.manifests)assert.equal(hash(readFileSync(m.path)),m.sha256,m.path);
});
it('enumerates only the complete Kerr disclosure sequence with accurate identity and no future-scene fallback',()=>{
 assert.deepEqual(Object.keys(ORDINARY_DIRECTIONS),['act2_district_kerr','act2_district_kerr_reply']);
 assert.deepEqual(manifest.stages,Object.entries(ORDINARY_DIRECTIONS).map(([scene,d])=>({scene,...d})));
 for(const [id,d]of Object.entries(ORDINARY_DIRECTIONS)){assert.equal(getScene(id).speaker,d.speaker);assert.equal(d.speaker,'Kerr');assert.equal(sceneIllustration(id),undefined);assert.equal(d.scene.src,'/art/stall.jpg');assert.equal(d.person.src,'/art/kerr-listening-wide.jpg');assert.equal(d.detail.src,'/art/stall-quiet-detail.jpg');for(const a of[d.scene,d.person,d.detail]){assert.ok(a.caption.trim());assert.ok(a.description.trim());assert.ok(manifest.assets.some(f=>f.path==='public'+a.src));assert.ok(manifest.assets.some(f=>f.path==='public'+a.small));}}
 for(const id of ['__proto__','constructor','act2_craft_kerr_offer','act2_district_canal','act3_payoff_kerr','unknown'])assert.equal(ordinaryDirection(id),undefined);
 assert.deepEqual(manifest.newScenes,[]);assert.deepEqual(manifest.newRoutes,[]);assert.deepEqual(manifest.newMedia,[]);for(const a of manifest.assets)assert.equal(hash(readFileSync(a.path)),a.sha256);
});
