import profiles from "../qa/editorial/sera-shift-profiles.json";
import assert from 'node:assert/strict';
import { it } from 'node:test';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { createCharacter, getScene, presentChoices, commitChoice, sceneText } from './engine';
import { replayCampaign, type ReplaySpec } from './story-replay';
import { visibleCampaignDialogue, quotedSpeech, spokenDialogueRange } from './campaign-dialogue';
import { portraitArt, sceneIllustration } from './art';
import { routeCheckpoint } from '../qa/production/route-checkpoint';
import { seraShiftRole, SERA_SHIFT_SCENES } from './sera-shift';
import { isSeraShiftFile, precedingSeraArt, withoutSeraArt } from '../qa/production/sera-shift-cohort';
import { exportRun, importRun } from './vault';
import phase from '../qa/media/sera-shift.json';
import baseline from '../qa/editorial/dramatic-pilot-baseline.json';
import previousArt from '../qa/editorial/sera-shift-preceding-scene-art.json';
import currentArt from '../qa/media/scene-art.json';
import bindings from '../qa/media/sera-shift-dialogue-bindings.json';
import deliveries from '../qa/media/sera-shift-dialogue-provenance.json';
import transcripts from '../qa/media/sera-shift-dialogue-transcripts.json';
const sha = (b: string | Buffer) => createHash('sha256').update(b).digest('hex');
const files = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap(r => r.isDirectory() ? files(`${d}/${r.name}`) : [`${d}/${r.name}`]);
const load = (file: string) => JSON.parse(readFileSync(`qa/routes/${file}`, 'utf8')) as ReplaySpec;
const take = (s: ReturnType<typeof createCharacter>, id: string) => {
  const c = presentChoices(s, getScene(s.sceneId)).find(c => c.id === id && c.enabled);
  assert.ok(c, `${s.sceneId}/${id}`); return commitChoice(s, c).state;
};
it('preserves all241 preceding campaigns,17281 exact visits,842 media and every earlier manifest', () => {
  assert.equal(sha(readFileSync(phase.baseline)), phase.baselineSha256);
  assert.deepEqual(files('qa/routes').filter(p => p.endsWith('.json') && !isSeraShiftFile(p)).sort(), baseline.routeFiles);
  const rows = [];
  for (const file of baseline.routeFiles) {
    const spec = JSON.parse(readFileSync(file, 'utf8')) as ReplaySpec; let state = createCharacter(spec.character);
    for (let i = 0; i <= spec.steps.length; i++) {
      const scene = getScene(state.sceneId), text = sceneText(scene, state), choices = presentChoices(state, scene);
      rows.push({ file, step: i, state, text, choices, voice: visibleCampaignDialogue(scene.id, scene.speaker, text), actor: scene.speaker, art: sceneIllustration(scene.id, state.flags), portrait: portraitArt(scene.speaker, scene.id, state.flags) });
      if (i === spec.steps.length) break;
      const a = spec.steps[i], c = choices.find(c => c.id === a.choiceId && c.enabled)!; assert.ok(c);
      state = commitChoice(state, c, c.check ? { roll: a.roll! } : undefined).state;
    }
  }
  assert.equal(rows.length, 17281); assert.equal(sha(JSON.stringify(rows)), baseline.campaignSha256);
  assert.deepEqual([...files('public/art'), ...files('public/audio')].filter(p => !isSeraShiftFile(p)).sort().map(path => ({ path, sha256: sha(readFileSync(path)) })), baseline.media);
  assert.deepEqual(files('qa/media').filter(p => p.endsWith('.json') && !isSeraShiftFile(p)).sort(), baseline.manifests.map(m => m.path));
  for (const m of baseline.manifests) assert.equal(sha(readFileSync(precedingSeraArt(m.path))), m.sha256, m.path);
  assert.deepEqual(withoutSeraArt(currentArt), previousArt);
  assert.deepEqual(phase.newScenes, [...SERA_SHIFT_SCENES]);
  assert.deepEqual(phase.newMedia, bindings.map(b => `public/audio/${b.id}.mp3`));
  for (const p of ['public/audio/voice-campaign-sera-shift-future.mp3', 'qa/routes/sera-shift/future.json', 'qa/media/sera-shift-future.json']) assert.equal(isSeraShiftFile(p), false);
});
for (const file of phase.newRoutes) it(`completes ${file} with exact reloadable saves and unchanged prior outcomes`, () => {
  const spec = load(file), r = replayCampaign(spec);
  assert.ok(r.transcript.every(t => t.restored)); assert.deepEqual(importRun(exportRun(r.state)), r.state);
  assert.equal(spec.character.seraShift, true);
  const preceding = profiles.find(p => p.route === `qa/routes/${file}`)!.precedingRoute;
  const old = replayCampaign(JSON.parse(readFileSync(preceding, 'utf8')) as ReplaySpec).state;
  const current = structuredClone(r.state);
  current.flags = Object.fromEntries(Object.entries(current.flags).filter(([flag]) => !flag.startsWith('sera_shift_')));
  current.journal = current.journal.filter(j => !['sera-shift-offer', 'sera-shift-task'].includes(j.id));
  // The actual choice log deliberately includes the added task and any pause.
  assert.deepEqual({ ...current, log: [] }, { ...old, log: [] });
});
it('keeps both tasks free and distinct, grants no sources/permissions/trust and prevents repeats', () => {
  for (const [route, scene, action, role] of [['carry-authenticated', 'act3_sera_carry', 'sera-carry-cards', 'carry'], ['watch-private', 'act3_sera_watch', 'sera-watch-table', 'watch']] as const) {
    const s = routeCheckpoint(`sera-shift/${route}`, scene), next = take(s, action);
    for (const k of ['creds', 'strain', 'items', 'factions', 'rolls'] as const) assert.deepEqual(next[k], s[k]);
    for (const k of ['order_verified', 'archive_key_authenticated', 'nia_public_consent', 'witness_safe', 'testimony_published']) assert.equal(next.flags[k], s.flags[k]);
    assert.equal(seraShiftRole(next), role); assert.equal(seraShiftRole({ ...next, journal: s.journal }), undefined);
    const done = take(next, 'sera-return-to-account');
    const again = { ...done, sceneId: scene }; assert.deepEqual(presentChoices(again, getScene(scene)).map(c => c.id), ['sera-unavailable']);
    const record = routeCheckpoint(`sera-shift/${route}`, 'act3_testimony_record');
    if (role === 'watch') assert.doesNotMatch(sceneText(getScene(record.sceneId), record), /empty question tray/);
    assert.equal(visibleCampaignDialogue(record.sceneId, 'Sera', sceneText(getScene(record.sceneId), record)).filter(b => bindings.some(l => l.id === b.id)).length, 1);
  }
});
it('supports scarcity, refusal and coherent imported fallback without altering older save cohorts', () => {
  const s = routeCheckpoint('sera-shift/watch-private', 'act3_sera_shift');
  const scarce = { ...s, creds: 0, strain: 5 };
  assert.ok(presentChoices(scarce, getScene(scarce.sceneId)).every(c => c.enabled));
  const declined = take(scarce, 'sera-decline'); assert.equal(declined.creds, 0); assert.equal(declined.strain, 5); assert.equal(seraShiftRole(declined), undefined);
  const broken = { ...s, flags: { ...s.flags, sera_shift_carried: true, sera_shift_watched: true }, sceneId: 'act3_sera_reply' };
  assert.equal(seraShiftRole(broken), undefined); assert.equal(presentChoices(broken, getScene(broken.sceneId))[0].id, 'sera-unavailable');
  assert.throws(() => createCharacter({ ...load(phase.newRoutes[0]).character, seraShift: 'yes' as unknown as boolean }));
  const legacy = createCharacter({ ...load(phase.newRoutes[0]).character, seraShift: false }); assert.equal(legacy.flags.sera_shift_enabled, undefined);
});
it('binds every new spoken word to Sera, matching stock identity, delivery hashes and unprompted ASR', () => {
  const seen = new Set<string>();
  for (const file of phase.newRoutes) {
    const spec = load(file); let s = createCharacter(spec.character);
    for (const a of spec.steps) {
      const scene = getScene(s.sceneId), text = sceneText(scene, s), lines = visibleCampaignDialogue(scene.id, scene.speaker, text);
      if (phase.newScenes.includes(scene.id)) for (const q of quotedSpeech(text)) assert.ok(lines.some(l => l.quote === q.text));
      for (const l of lines.filter(l => bindings.some(b => b.id === l.id))) { seen.add(l.id); assert.equal(l.speaker, 'Sera'); assert.ok(spokenDialogueRange(text, l)); assert.ok(portraitArt('Sera', scene.id, s.flags)); }
      const c = presentChoices(s, scene).find(c => c.id === a.choiceId && c.enabled)!; s = commitChoice(s, c, c.check ? { roll: a.roll! } : undefined).state;
    }
  }
  assert.deepEqual([...seen].sort(), bindings.map(b => b.id).sort());
  for (const b of bindings) {
    const d = deliveries.lines.find(d => d.id === b.id)!, t = transcripts.lines.find(t => t.id === b.id)!;
    assert.ok(d); assert.ok(t); assert.equal(d.text, b.quote); assert.equal(d.voice, 'af_bella'); assert.equal(d.speaker, 'Sera');
    assert.equal(sha(readFileSync(d.path)), d.sha256); assert.equal(t.sha256, d.sha256); assert.ok(t.exactNormalizedWords);
    assert.ok(Math.abs(d.integratedLufs + 23.5) <= .6); assert.ok(d.truePeakDbtp <= -1.5); assert.ok(d.peak < .95);
  }
});
