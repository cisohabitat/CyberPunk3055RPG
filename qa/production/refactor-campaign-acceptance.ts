/** Exact comparison against the accepted Phase21 campaigns; no grading or relaxed assertions. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { TITLE_MUSIC } from "../../lib/title-music";

const [directory, output] = process.argv.slice(2);
assert.ok(directory && output && !existsSync(output), "Provide report directory and fresh output filename");
const load = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const hash = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");
const profiles = ["aaa-campaign-profiles", "campaign-reassessment-additional-profiles", "return-routing-profiles",
  "ordinary-direction-profiles", "sera-shift-profiles", "dramatic-beats-profiles", "consequential-methods-profiles",
  "consequential-expansion-profiles", "dramatic-sequences-profiles", "navigation-release-profiles"]
  .flatMap(name => load(`qa/editorial/${name}.json`));
assert.equal(profiles.length, 74);
assert.deepEqual(readdirSync(directory).filter(path => path.endsWith(".json")).sort(), profiles.map(p => p.id + ".json").sort());
const theme = `/audio/${TITLE_MUSIC.name}.${TITLE_MUSIC.extension}`;
const rows = profiles.map(profile => {
  const path = join(directory, profile.id + ".json"), current = load(path);
  const beforePath = `qa/editorial/campaign-reassessment-phase21-runs/${profile.id}.json`, before = load(beforePath);
  for (const key of ["route", "width", "artwork", "reading", "sound", "shots"]) assert.equal(current[key], profile[key], `${profile.id}/${key}`);
  for (const [file, digest] of Object.entries(current.testedSources)) assert.equal(hash(file), digest, `${profile.id}/stale ${file}`);
  for (const file of ["components/useSceneReading.ts", "components/useSceneBed.ts", "components/SceneNarrative.tsx", "lib/scene-sound.ts", "lib/state-effects.ts"]) {
    assert.equal(current.testedSources[file], hash(file), `${profile.id}/missing extracted source binding`);
  }
  assert.deepEqual(current.errors, []); assert.deepEqual(current.failedMedia, []);
  assert.equal(current.finalAudio.liveSources, 0);
  assert.equal(current.finalAudio.sourcesCreated, current.finalAudio.sourcesDisposed);
  assert.equal(current.finalAudio.sourcesCreated, current.finalAudio.buffersCleared);
  for (const key of ["visits", "reloads", "tabs", "reveals", "completedVoices", "shotReviews", "ordinaryShotReviews", "interruptions", "final", "cohortSetup", "scenes"]) {
    assert.deepEqual(current[key], before[key], `${profile.id}/${key}`);
  }
  assert.equal(current.observations.length, before.observations.length);
  for (const [i, observation] of current.observations.entries()) {
    for (const key of ["sceneId", "text", "choices", "decisionGapPx", "overflow", "words", "panels", "artworkControls"]) {
      assert.deepEqual(observation[key], before.observations[i][key], `${profile.id}/${i}/${key}`);
    }
  }
  const oldMedia = new Set<string>(before.mediaRequests), media = new Set<string>(current.mediaRequests);
  assert.deepEqual([...media].filter(p => p !== theme).sort(), [...oldMedia].filter(p => p !== theme).sort(), `${profile.id}/gameplay media`);
  let menuThemeRequestSetDelta = null;
  if (media.has(theme) !== oldMedia.has(theme)) {
    assert.equal(profile.sound, true); assert.ok(before.initialMediaRequests.includes(theme)); assert.ok(current.initialMediaRequests.includes(theme));
    menuThemeRequestSetDelta = { path: theme, beforePresent: oldMedia.has(theme), currentPresent: media.has(theme),
      scope: "Existing native title/reload request-set membership only; not request-count equality or a speech/art exception." };
  }
  return { id: profile.id, path, sha256: hash(path), beforePath, beforeSha256: hash(beforePath),
    revision: current.revision, dirty: current.dirty, environment: current.environment, baselineEnvironment: before.environment,
    cohortSetup: current.cohortSetup, visits: current.visits, reloads: current.reloads, tabs: current.tabs,
    voices: current.completedVoices.length, artViews: current.shotReviews.length, ordinaryArtViews: current.ordinaryShotReviews.length,
    interruptions: current.interruptions, scenes: [...new Set<string>(current.scenes)], menuThemeRequestSetDelta };
});
const result = { version: 1, tool: { path: "qa/production/refactor-campaign-acceptance.ts", sha256: hash("qa/production/refactor-campaign-acceptance.ts") }, revision: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  dirty: Boolean(execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim()),
  method: "Source-familiar authored-dice AI proxy; exact 74-profile comparison. No physical-device or independent acting claim.",
  profiles: rows, totals: Object.fromEntries(["visits", "reloads", "tabs", "voices", "artViews", "ordinaryArtViews", "interruptions"].map(key =>
    [key, rows.reduce((total, row) => total + Number(row[key as keyof typeof row]), 0)])),
  continuousSceneIds: [...new Set(rows.flatMap(row => row.scenes))].sort() };
writeFileSync(output, JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ output, profiles: rows.length, totals: result.totals, scenes: result.continuousSceneIds.length }));
