/** Explicit offline 26 prior-save + six current-creation acceptance; never shipped. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createCharacter, getScene, presentChoices, commitChoice, sceneText } from '../../lib/engine';
import type { ReplaySpec } from '../../lib/story-replay';
import fixed from '../editorial/aaa-campaign-profiles.json';
import additional from '../editorial/campaign-reassessment-additional-profiles.json';
import routing from '../editorial/return-routing-profiles.json';
import ordinary from '../editorial/ordinary-direction-profiles.json';
import pilot from '../editorial/sera-shift-profiles.json';
const directory = process.argv[2]; assert.ok(directory, 'Provide a fresh32-report directory');
const output = process.argv[3] ?? '/tmp/sera-shift-acceptance.json';
const load = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex');
const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
const words = (s: string) => (s.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).join(' ');
const previous = [...fixed, ...additional, ...routing, ...ordinary];
const rows = [...previous, ...pilot].map(p => {
  const file = `${directory}/${p.id}.json`, report = load(file), spec = load(p.route) as ReplaySpec;
  const current = pilot.some(r => r.id === p.id);
  for (const k of ['route', 'width', 'artwork', 'reading', 'sound', 'shots'] as const) assert.equal(report[k], p[k], `${p.id}/${k}`);
  for (const [path, hash] of Object.entries(report.testedSources)) assert.equal(sha(path), hash, path);
  assert.equal(report.cohortSetup.kind, current ? 'current-ui-creation' : 'supported-prior-factory-save');
  assert.equal(report.cohortSetup.reloads, current ? 0 : 1);
  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedMedia, []);
  assert.equal(report.finalAudio.liveSources, 0);
  assert.equal(report.finalAudio.sourcesCreated, report.finalAudio.sourcesDisposed);
  assert.equal(report.finalAudio.sourcesCreated, report.finalAudio.buffersCleared);
  assert.equal(report.observations.length, spec.steps.length + 1);
  let state = createCharacter({ ...spec.character, startWithPrologue: true, expandedKerr: true, expandedMara: true, expandedWitness: true, craftedEncounters: true, emotionalPayoffs: true, freightCraft: true, returnRouting: true, seraShift: current });
  for (const [i, o] of report.observations.entries()) {
    assert.equal(o.sceneId, state.sceneId); assert.equal(o.step, i); assert.equal(o.overflow, false);
    assert.equal(norm(o.text), norm(sceneText(getScene(state.sceneId), state)), `${p.id}/${i}/text`);
    const a = spec.steps[i]; if (!a) continue;
    const c = presentChoices(state, getScene(state.sceneId)).find(c => c.id === a.choiceId && c.enabled); assert.ok(c);
    const rendered = o.choices.find((r: {id: string}) => r.id === `choice-${c.id}`); assert.ok(rendered?.enabled);
    assert.ok(words(rendered.text).includes(words(c.label)));
    state = commitChoice(state, c, c.check ? { roll: a.roll! } : undefined).state;
  }
  assert.deepEqual(report.final, { sceneId: state.sceneId, creds: state.creds, strain: state.strain, rolls: state.rolls.map(r => r.roll) });
  assert.equal(report.final.sceneId, spec.expected.sceneId);
  if (!p.sound) assert.deepEqual(report.mediaRequests.filter((p: string) => p.startsWith('/audio/')), []);
  if (p.artwork === 'none') assert.deepEqual(report.mediaRequests.filter((p: string) => p.startsWith('/art/')), []);
  let precedingComparison;
  if (!current) {
    const before = load(`qa/editorial/campaign-reassessment-phase15-runs/${p.id}.json`);
    for (const k of ['visits', 'reveals', 'completedVoices', 'shotReviews', 'ordinaryShotReviews', 'interruptions', 'final']) assert.deepEqual(report[k], before[k], `${p.id}/${k}`);
    assert.equal(report.tabs, before.tabs + report.cohortSetup.tabs, `${p.id}/actual extra setup Tabs`);
    assert.equal(report.reloads, before.reloads + report.cohortSetup.reloads);
    for (const [i, o] of report.observations.entries()) for (const k of ['sceneId', 'text', 'choices', 'decisionGapPx', 'overflow', 'words', 'panels', 'artworkControls']) assert.deepEqual(o[k], before.observations[i][k], `${p.id}/${i}/${k}`);
    precedingComparison = 'Exact preceding prose/actions/layout/final resources/media workload; actual extra prior-save setup Tabs/reload retained';
  }
  const base = pilot.find(r => r.id === p.id);
  const addedAuthoredChoices = base ? spec.steps.length - (load(base.precedingRoute) as ReplaySpec).steps.length : 0;
  return { id: p.id, evidence: file, evidenceSha256: sha(file), revision: report.revision, dirty: report.dirty, cohortSetup: report.cohortSetup, visits: report.visits, reloads: report.reloads, tabs: report.tabs, voices: report.completedVoices.length, artViews: report.shotReviews.length, ordinaryArtViews: report.ordinaryShotReviews.length, interruptions: report.interruptions, addedAuthoredChoices, scenes: [...new Set(report.scenes)], final: report.final, precedingComparison };
});
const result = { method: 'Source-familiar authored-dice UI proxy. Older supported saves and current UI creation separately labeled; no grading, telemetry or human comprehension claim.', profiles: rows, totals: Object.fromEntries(['visits','reloads','tabs','voices','artViews','ordinaryArtViews','interruptions','addedAuthoredChoices'].map(k => [k, rows.reduce((n,r) => n + Number(r[k as keyof typeof r]),0)])), distinctBrowserSceneIds: [...new Set(rows.flatMap(r => r.scenes))].sort() };
writeFileSync(output, JSON.stringify(result, null, 2) + '\n'); console.log(JSON.stringify({ output, profiles: rows.length, totals: result.totals, browserScenes: result.distinctBrowserSceneIds.length }));
