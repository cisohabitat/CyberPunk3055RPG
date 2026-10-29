/** Offline acceptance evidence. Never imported by the game; no automatic grade. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { commitChoice, createCharacter, getScene, presentChoices, sceneText } from "../lib/engine";
import { replayCampaign, type ReplaySpec } from "../lib/story-replay";
import { SCENES } from "../lib/story";
import profiles from "../qa/editorial/aaa-campaign-profiles.json";

const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(row => row.isDirectory() ? files(join(dir, row.name)) : [join(dir, row.name)]).sort();
const hash = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");
const json = <T>(file: string): T => JSON.parse(readFileSync(file, "utf8"));
const normalized = (text: string) => text.replace(/\s+/g, " ").trim();
const labelWords = (text: string) => (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).join(" ");
type Observation = { sceneId: string; step: number; text: string; words: number; decisionGapPx: number | null; overflow: boolean; choices: { id: string; enabled: boolean; text: string }[] };
type BrowserReport = {
  revision: string; dirty: boolean; testedSources: Record<string, string>; route: string; width: number; artwork: string; reading: string; sound: boolean; shots: boolean;
  visits: number; scenes: string[]; tabs: number; reloads: number; reveals: number; completedVoices: string[]; shotReviews: unknown[];
  errors: string[]; failedMedia: string[]; mediaRequests: string[]; observations: Observation[]; environment: unknown; limitations: string;
  final: { sceneId: string; creds: number; strain: number; rolls: number[] };
  finalAudio: { liveSources: number; sourcesCreated: number; sourcesDisposed: number; buffersCleared: number };
};

const [reportsDirectory, output = "qa/production/reports/aaa-campaign-acceptance.json", phaseArgument = "6"] = process.argv.slice(2);
assert.ok(reportsDirectory, "Usage: node --import tsx scripts/campaign-acceptance.ts REPORT_DIRECTORY [OUTPUT_JSON] [PHASE]");
const phase = Number(phaseArgument);
assert.ok(Number.isSafeInteger(phase) && phase > 0, "Phase must be a positive integer");
const sourceFiles = [...files("app"), ...files("components"), ...files("lib"), ...files("qa/routes"), ...files("qa/media"), "qa/production/campaign-observation.ts", "qa/production/keyboard.ts", "qa/production/audio-review.ts", "scripts/player-experience.ts", "scripts/campaign-acceptance.ts", "qa/editorial/aaa-campaign-profiles.json"];
const sourceFingerprint = hash(JSON.stringify(sourceFiles.map(path => ({ path, sha256: hash(readFileSync(path)) }))));
const visited = new Set<string>(), available = new Set<string>(), selected = new Set<string>();
let sourceVisits = 0;
const sourceCampaigns = files("qa/routes").filter(file => file.endsWith(".json")).map(file => {
  const spec = json<ReplaySpec>(file), replay = replayCampaign(spec);
  let state = createCharacter(spec.character);
  for (let step = 0; step <= spec.steps.length; step++) {
    visited.add(state.sceneId); sourceVisits++;
    const choices = presentChoices(state, getScene(state.sceneId));
    for (const choice of choices) available.add(`${state.sceneId}/${choice.id}`);
    if (step === spec.steps.length) break;
    const action = spec.steps[step], choice = choices.find(row => row.id === action.choiceId && row.enabled)!;
    selected.add(`${state.sceneId}/${choice.id}`);
    state = commitChoice(state, choice, choice.check ? { roll: action.roll! } : undefined).state;
  }
  assert.deepEqual(state, replay.state, file);
  return { file, sha256: hash(readFileSync(file)), origin: state.origin, complication: state.complication, stats: state.stats, visits: spec.steps.length + 1, restoredCheckpoints: replay.transcript.filter(row => row.restored).length, checks: state.rolls.length, failedChecks: state.rolls.filter(row => !row.success).length, finale: state.sceneId, creds: state.creds, strain: state.strain, finalStateSha256: hash(JSON.stringify(state)) };
});

const browserCampaigns = profiles.map(profile => {
  const file = join(reportsDirectory, `${profile.id}.json`), report = json<BrowserReport>(file), spec = json<ReplaySpec>(profile.route);
  for (const key of ["route", "width", "artwork", "reading", "sound", "shots"] as const) assert.equal(report[key], profile[key], `${profile.id}/${key}`);
  for (const [path, sha256] of Object.entries(report.testedSources)) assert.equal(hash(readFileSync(path)), sha256, `${profile.id}: stale ${path}`);
  assert.equal(report.testedSources[profile.route], hash(readFileSync(profile.route)), "Actual route fingerprint required");
  assert.equal(report.visits, spec.steps.length + 1); assert.equal(report.observations.length, report.visits); assert.equal(report.scenes.length, report.visits);
  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedMedia, []);
  assert.equal(report.finalAudio.liveSources, 0); assert.equal(report.finalAudio.sourcesCreated, report.finalAudio.sourcesDisposed); assert.equal(report.finalAudio.buffersCleared, report.finalAudio.sourcesCreated);
  if (!profile.sound) assert.deepEqual(report.mediaRequests.filter(path => path.startsWith("/audio/")), []);
  if (profile.artwork === "none") assert.deepEqual(report.mediaRequests.filter(path => path.startsWith("/art/")), []);
  // UI runs enable the current content cohort. Historical fixtures remain unchanged.
  let state = createCharacter({ ...spec.character, startWithPrologue: true, expandedKerr: true, expandedMara: true, expandedWitness: true, craftedEncounters: true, emotionalPayoffs: true, freightCraft: true });
  const checkpoints = report.observations.map((observation, step) => {
    const scene = getScene(state.sceneId), choices = presentChoices(state, scene);
    assert.equal(observation.step, step); assert.equal(observation.sceneId, state.sceneId); assert.equal(report.scenes[step], state.sceneId);
    assert.equal(normalized(observation.text), normalized(sceneText(scene, state)), `${profile.id}/${step}: rendered prose`);
    assert.equal(observation.overflow, false);
    const before = state;
    const action = spec.steps[step];
    if (action) {
      const choice = choices.find(row => row.id === action.choiceId && row.enabled);
      assert.ok(choice, `${profile.id}/${step}: canonical choice unavailable`);
      const rendered = observation.choices.find(row => row.id === `choice-${action.choiceId}`);
      assert.ok(rendered?.enabled, `${profile.id}/${step}: selected action absent/disabled`);
      // Existing memory/desk controls uppercase labels and omit terminal punctuation.
      // Keep every label word; canonical prose above remains case/punctuation exact.
      assert.ok(labelWords(rendered.text).includes(labelWords(choice.label)), `${profile.id}/${step}: choice label`);
      state = commitChoice(state, choice, choice.check ? { roll: action.roll! } : undefined).state;
    }
    return { step, sceneId: before.sceneId, speaker: scene.speaker, proseSha256: hash(sceneText(scene, before)), words: observation.words, choiceId: action?.choiceId, legalChoices: observation.choices.filter(row => row.enabled).length, renderedChoices: observation.choices.length, decisionGapPx: observation.decisionGapPx, creds: before.creds, strain: before.strain };
  });
  assert.deepEqual(report.final, { sceneId: state.sceneId, creds: state.creds, strain: state.strain, rolls: state.rolls.map(row => row.roll) });
  assert.equal(report.final.sceneId, spec.expected.sceneId);
  const maxGap = checkpoints.filter(row => row.decisionGapPx !== null).sort((a, b) => b.decisionGapPx! - a.decisionGapPx!)[0];
  return { id: profile.id, evidence: file, evidenceSha256: hash(readFileSync(file)), revision: report.revision, dirty: report.dirty, environment: report.environment, profile, origin: state.origin, complication: state.complication, stats: state.stats, visits: report.visits, reloads: report.reloads, tabs: report.tabs, reveals: report.reveals, completedVoices: report.completedVoices.length, shotReviews: report.shotReviews.length, failedChecks: state.rolls.filter(row => !row.success).length, initialCreds: checkpoints[0].creds, minimumCreds: Math.min(...checkpoints.map(row => row.creds)), maximumStrain: Math.max(...checkpoints.map(row => row.strain)), final: report.final, maxGap, checkpoints, limitations: report.limitations };
});
assert.deepEqual([...new Set(browserCampaigns.map(row => row.origin))].sort(), ["dustline", "gutterwire", "spire"]);
assert.deepEqual([...new Set(browserCampaigns.map(row => row.final.sceneId))].sort(), ["ending_listed", "ending_names", "ending_quiet", "ending_witness"]);
assert.deepEqual([...new Set(browserCampaigns.flatMap(row => Object.entries(json<ReplaySpec>(row.profile.route).character.bonus).filter(([, points]) => points > 0).map(([stat]) => stat)))].sort(), ["chrome", "face", "ghost", "nerve"]);
assert.deepEqual([...new Set(browserCampaigns.map(row => row.complication))].sort(), ["debt", "on-file", "optic"]);
assert.ok(browserCampaigns.some(row => row.failedChecks > 0), "Actual failed dice required");
assert.ok(browserCampaigns.some(row => row.minimumCreds === 0), "Scarce-resource run required");
const result = {
  version: 1, phase, revision: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  dirty: Boolean(execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim()), sourceFingerprint,
  method: "Source-familiar AI proxy over fixed authored dice and keyboard UI runs. No blind players, physical devices, screen-reader listening, perceptual audio scores or automatic craft grade.",
  source: { routes: sourceCampaigns.length, visits: sourceVisits, visitedScenes: visited.size, totalScenes: Object.keys(SCENES).length, unvisitedScenes: Object.keys(SCENES).filter(id => !visited.has(id)).sort(), presentedSceneChoices: available.size, selectedSceneChoices: selected.size, campaigns: sourceCampaigns },
  totals: { browserCampaigns: browserCampaigns.length, visits: browserCampaigns.reduce((n, row) => n + row.visits, 0), reloads: browserCampaigns.reduce((n, row) => n + row.reloads, 0), tabs: browserCampaigns.reduce((n, row) => n + row.tabs, 0), completedVoices: browserCampaigns.reduce((n, row) => n + row.completedVoices, 0), shotReviews: browserCampaigns.reduce((n, row) => n + row.shotReviews, 0) },
  browserCampaigns,
};
mkdirSync(dirname(output), { recursive: true }); writeFileSync(output, JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ output, sourceFingerprint, sourceRoutes: result.source.routes, sourceVisits, unvisitedScenes: result.source.unvisitedScenes, totals: result.totals }));
