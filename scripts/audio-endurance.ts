import { chromium, expect } from "@playwright/test";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { commitChoice, createCharacter, getScene, presentChoices } from "../lib/engine";
import { actName } from "../lib/story/goal";
import { sceneSoundPlan } from "../lib/sound";
import { exportRun } from "../lib/vault";
import type { ReplaySpec } from "../lib/story-replay";
import type { GameState } from "../lib/types";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";

async function main() {
  const args = process.argv.slice(2), url = args[0];
  if (!url || !/^https?:\/\//.test(url)) throw new Error("Provide the game URL, optionally --minutes 10 --out report.json");
  const option = (name: string, fallback: string) => { const i = args.indexOf(name); return i < 0 ? fallback : args[i + 1]; };
  const minutes = Number(option("--minutes", "10"));
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 120) throw new Error("Minutes must be between 1 and 120");
  const out = option("--out", "qa/production/reports/audio-endurance.json");
  const states = new Map<string, GameState>();
  for (const file of ["integration-names", "integration-quiet", "window-scouted"]) {
    const spec = JSON.parse(readFileSync(`qa/routes/${file}.json`, "utf8")) as ReplaySpec;
    let state = createCharacter(spec.character);
    const record = () => {
      const scene = getScene(state.sceneId), plan = sceneSoundPlan(state, scene.location, actName(state));
      const key = `${plan.mood}/${plan.district}`; if (!states.has(key)) states.set(key, state);
    };
    record();
    for (const step of spec.steps) {
      const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.id === step.choiceId && c.enabled);
      if (!choice) throw new Error(`Unavailable authored step ${file}/${step.choiceId}`);
      state = commitChoice(state, choice, choice.check ? { roll: step.roll! } : undefined).state; record();
    }
  }
  const revision = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const dirty = Boolean(execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim());
  const testedSources = Object.fromEntries(["lib/sound.ts", "components/GameApp.tsx", "components/PlayScreen.tsx", "components/VoiceLine.tsx", "qa/production/audio-review.ts", "scripts/audio-endurance.ts"].map(file => [file, createHash("sha256").update(readFileSync(file)).digest("hex")]));
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const errors: string[] = [], samples: { seconds: number; heapBytes: number; audio: AudioReview }[] = [];
  page.on("pageerror", error => errors.push(error.message));
  // tsx preserves function names with a module helper; serialized browser QA needs it too.
  await page.addInitScript({ content: `var __name = (fn, name) => Object.defineProperty(fn, "name", { value: name, configurable: true }); (${installAudioReview.toString()})();` });
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: true, reading: "all", motion: "reduce", artwork: "none", effects: 0 })));
  const cdp = await page.context().newCDPSession(page); await cdp.send("Performance.enable");
  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  const audio = () => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
  const start = Date.now(); let rounds = 0, restored = 0;
  try {
    await page.goto(url);
    do {
      for (const state of states.values()) {
        await page.getByRole("button", { name: "Saves", exact: true }).click();
        await page.getByLabel("Import a saved run").setInputFiles({ name: "audio-qa.json", mimeType: "application/json", buffer: Buffer.from(exportRun(state)) });
        const confirm = page.getByRole("button", { name: "Confirm load", exact: true });
        if (restored > 0) await confirm.click();
        await expect(page.getByRole("dialog")).toHaveCount(0);
        await expect.poll(async () => (await saved()).sceneId).toBe(state.sceneId);
        await expect(page.getByTestId("scene-text")).toBeVisible(); restored++;
        try { await expect.poll(async () => (await audio()).liveSources).toBe(2); }
        catch (error) { console.error(JSON.stringify({ scene: state.sceneId, saved: (await saved()).sceneId, audio: await audio(), errors, visible: await page.evaluate(() => document.visibilityState), preferences: await page.evaluate(() => localStorage.getItem("saint-shard-preferences")) })); throw error; }
        const before = await saved();
        const listen = page.getByTestId("voice-line").getByRole("button", { name: /^Listen to / });
        if (await listen.count()) {
          await listen.click(); await expect(page.getByTestId("voice-line")).toContainText("Playing selected dialogue");
          await page.getByRole("button", { name: "Stop line", exact: true }).click();
        }
        await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true })));
        await expect.poll(async () => (await audio()).liveSources).toBe(0);
        const stopped = await audio();
        if (stopped.sourcesCreated !== stopped.sourcesDisposed || stopped.sourcesCreated !== stopped.buffersCleared) throw new Error("Stopped sources retain connections or buffers");
        await page.getByRole("button", { name: "Resume sound", exact: true }).click();
        await expect.poll(async () => (await audio()).liveSources).toBe(2);
        expect(await saved()).toEqual(before);
      }
      rounds++;
      await cdp.send("HeapProfiler.collectGarbage");
      const metrics = await cdp.send("Performance.getMetrics");
      const sample = { seconds: (Date.now() - start) / 1000, heapBytes: metrics.metrics.find(m => m.name === "JSHeapUsedSize")!.value, audio: await audio() };
      samples.push(sample); console.log(JSON.stringify({ round: rounds, seconds: sample.seconds, heapBytes: sample.heapBytes, live: sample.audio.liveSources }));
      if (Date.now() - start < minutes * 60_000) await page.waitForTimeout(Math.min(30_000, minutes * 60_000 - (Date.now() - start)));
    } while (Date.now() - start < minutes * 60_000);
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.getByLabel("Sound enabled", { exact: true }).uncheck();
    await expect.poll(async () => (await audio()).liveSources).toBe(0);
    if (errors.length) throw new Error(errors.join("; "));
    mkdirSync(dirname(out), { recursive: true });
    const finalAudio = await audio();
    if (finalAudio.sourcesCreated !== finalAudio.sourcesDisposed || finalAudio.sourcesCreated !== finalAudio.buffersCleared) throw new Error("Final Sound off retained sources or buffers");
    writeFileSync(out, JSON.stringify({ revision, dirty, testedSources, url, requestedMinutes: minutes, elapsedSeconds: (Date.now() - start) / 1000, rounds, restored, plans: [...states.keys()], finalAudio, samples, errors, limitations: "Internal authored-state automation on one host. Forced-GC JS heap excludes native audio buffers and resident memory; no physical-device, two-hour, human listening, or population-percentile acceptance." }, null, 2));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
