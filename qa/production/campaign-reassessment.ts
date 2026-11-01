/** Offline Phase21 review. Editorial scores are inputs, never earned by test counts.
 * node --import tsx qa/production/campaign-reassessment.ts REPORTS SCORECARD FRESH_OUTPUT
 */
import assert from 'node:assert/strict';
import {createHash}from'node:crypto';
import {execFileSync}from'node:child_process';
import {existsSync,mkdirSync,readFileSync,readdirSync,writeFileSync}from'node:fs';
import {join,resolve}from'node:path';
import {TITLE_MUSIC}from'../../lib/title-music';
type Score={area:string;weight:number;current:number;target:number;reason:string};
const load=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const hash=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
const [reports,scoreFile,out]=process.argv.slice(2);
assert.ok(reports&&scoreFile&&out,'Provide reports, editorial scorecard and a fresh output directory');
assert.ok(!existsSync(out),'Choose a fresh output directory; preserve prior evidence');
const previous=load('qa/editorial/campaign-reassessment-phase15-review.json');
const score=load(scoreFile);const rubric=score.rubric as Score[];
assert.equal(score.targetWeightedEstimate,previous.targetWeightedEstimate);
assert.deepEqual(rubric.map(({area,weight,target})=>({area,weight,target})),previous.rubric.map(({area,weight,target}:Score)=>({area,weight,target})),'Rubric/weights/targets must remain exact');
assert.ok(rubric.every(r=>Number.isFinite(r.current)&&r.current>=0&&r.current<=10&&r.reason.trim().length>0));
assert.equal(Math.round(rubric.reduce((n,r)=>n+r.weight,0)*100),100);
assert.equal(score.method,'Source-familiar authored-dice AI proxy');
assert.ok(Array.isArray(score.remainingDeficits)&&score.remainingDeficits.length>0);
const names=['aaa-campaign-profiles','campaign-reassessment-additional-profiles','return-routing-profiles','ordinary-direction-profiles','sera-shift-profiles','dramatic-beats-profiles','consequential-methods-profiles','consequential-expansion-profiles','dramatic-sequences-profiles','navigation-release-profiles'];
const profiles=names.flatMap(n=>load(`qa/editorial/${n}.json`));assert.equal(profiles.length,74);
assert.deepEqual(readdirSync(reports).filter(f=>f.endsWith('.json')).sort(),profiles.map(p=>p.id+'.json').sort(),'All74 exact reports, no extra/missing cohort');
const theme=`/audio/${TITLE_MUSIC.name}.${TITLE_MUSIC.extension}`;
const rows=profiles.map(p=>{
 const path=join(reports,p.id+'.json'),r=load(path),before=load(`qa/editorial/navigation-release-spacing-accepted-runs/${p.id}.json`);
 assert.equal(r.url,'https://cyberpunk3055rpg.vercel.app');
 assert.equal(r.revision,score.reviewedRevision);assert.equal(r.dirty,false,'Review public runs must retain their actual clean revision');
 for(const k of ['route','width','artwork','reading','sound','shots'])assert.equal(r[k],p[k],`${p.id}/${k}`);
 for(const [file,digest]of Object.entries(r.testedSources))assert.equal(hash(file),digest,`${p.id}/stale ${file}`);
 assert.deepEqual(r.errors,[]);assert.deepEqual(r.failedMedia,[]);
 assert.equal(r.finalAudio.liveSources,0);assert.equal(r.finalAudio.sourcesCreated,r.finalAudio.sourcesDisposed);assert.equal(r.finalAudio.sourcesCreated,r.finalAudio.buffersCleared);
 for(const k of ['visits','reloads','tabs','reveals','completedVoices','shotReviews','ordinaryShotReviews','interruptions','final'])assert.deepEqual(r[k],before[k],`${p.id}/${k}`);
 assert.equal(r.observations.length,before.observations.length);
 for(const [i,o]of r.observations.entries())for(const k of ['sceneId','text','choices','decisionGapPx','overflow','words','panels','artworkControls'])assert.deepEqual(o[k],before.observations[i][k],`${p.id}/${i}/${k}`);
 const oldSet=new Set<string>(before.mediaRequests),newSet=new Set<string>(r.mediaRequests);
 assert.deepEqual([...oldSet].filter(f=>f!==theme).sort(),[...newSet].filter(f=>f!==theme).sort(),`${p.id}/all gameplay media`);
 let menuThemeRequestSetDelta=null;
 if(oldSet.has(theme)!==newSet.has(theme)){
  assert.equal(p.sound,true);assert.ok(before.initialMediaRequests.includes(theme));assert.ok(r.initialMediaRequests.includes(theme));
  menuThemeRequestSetDelta={path:theme,beforePresent:oldSet.has(theme),currentPresent:newSet.has(theme),scope:'Separately disclosed native title/reload request-set membership, not request counts; no gameplay media exception.'};
 }
 return{id:p.id,cohortSetup:r.cohortSetup,evidence:path,evidenceSha256:hash(path),revision:r.revision,dirty:r.dirty,visits:r.visits,reloads:r.reloads,tabs:r.tabs,voices:r.completedVoices.length,artViews:r.shotReviews.length,ordinaryArtViews:r.ordinaryShotReviews.length,interruptions:r.interruptions,final:r.final,scenes:[...new Set<string>(r.scenes)],menuThemeRequestSetDelta};
});
mkdirSync(out,{recursive:true});
const run=(file:string,args:string[],log:string)=>writeFileSync(join(out,log),execFileSync(process.execPath,['--import','tsx',file,...args],{encoding:'utf8',maxBuffer:16*1024*1024}));
const prior=join(out,'prior66.json'),all=join(out,'all74.json'),sourceFile=join(out,'source.json');
run('qa/production/navigation-release-prior-acceptance.ts',[reports,prior],'prior66.log');
run('qa/production/navigation-release-acceptance.ts',[reports,prior,all],'all74.log');
run('scripts/campaign-acceptance.ts',[reports,sourceFile,'21'],'source.log');
const accepted=load(all),source=load(sourceFile);
assert.equal(source.source.routes,289);assert.equal(source.source.visits,20681);assert.equal(source.source.visitedScenes,255);assert.equal(source.source.totalScenes,264);
const original=load('qa/editorial/navigation-release-spacing-source-acceptance.json');assert.equal(source.sourceFingerprint,original.sourceFingerprint);assert.deepEqual(source.source,original.source);
assert.equal(accepted.profiles.length,74);assert.equal(accepted.distinctBrowserSceneIds.length,209);
assert.deepEqual(accepted.totals,load('qa/editorial/navigation-release-spacing-whole-campaign-acceptance.json').totals);
assert.deepEqual([...new Set(rows.map(r=>r.final.sceneId))].sort(),['ending_listed','ending_names','ending_quiet','ending_witness']);
const cohortCoverage=Object.fromEntries(['current-ui-creation','supported-prior-sequence-factory-save'].map(kind=>{const selected=rows.filter(r=>r.cohortSetup.kind===kind);return[kind,{profiles:selected.length,sceneIds:[...new Set<string>(selected.flatMap(r=>r.scenes))].sort()}]}));
const round=(n:number)=>Number(n.toFixed(3));
const weightedEstimate=round(rubric.reduce((n,r)=>n+r.weight*r.current,0));
const result={version:1,phase:21,reviewedAtUtc:new Date().toISOString(),reviewedRevision:score.reviewedRevision,method:score.method,limitations:score.limitations,reviewTool:{path:'qa/production/campaign-reassessment.ts',sha256:hash('qa/production/campaign-reassessment.ts'),invocationRevision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),invocationDirty:Boolean(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim())},runtimeSourceFingerprint:source.sourceFingerprint,previousWeightedEstimate:previous.weightedEstimate,weightedEstimate,grade:Number(weightedEstimate.toFixed(1)),targetWeightedEstimate:score.targetWeightedEstimate,remainingWeightedGap:round(Math.max(0,score.targetWeightedEstimate-weightedEstimate)),rubric:rubric.map((r,i)=>({...r,previous:previous.rubric[i].current,weightedTargetGap:round(Math.max(0,r.target-r.current)*r.weight)})),totals:accepted.totals,cohortCoverage,continuousBrowserSceneIds:accepted.distinctBrowserSceneIds,source:source.source,profiles:rows,remainingDeficits:score.remainingDeficits,nextDecision:score.nextDecision,releaseStatus:'Reassessment of exact preceding public build. QA/documentation publication still requires its own exact-commit CI, READY aliases and fresh public checks.'};
writeFileSync(join(out,'review.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({output:resolve(out,'review.json'),profiles:rows.length,totals:result.totals,browserScenes:209,sourceScenes:255,weightedEstimate,grade:result.grade,target:score.targetWeightedEstimate}));
