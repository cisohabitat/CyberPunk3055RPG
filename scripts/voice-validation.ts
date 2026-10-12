import { chromium, expect } from "@playwright/test";
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createCharacter, commitChoice, getScene, presentChoices, sceneText } from "../lib/engine";
import { visibleDialogue } from "../lib/memory-media";
import lines from "../qa/media/voice-lines.json";
import type { ReplaySpec } from "../lib/story-replay";
import type { GameState } from "../lib/types";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import { keyboardActivate } from "../qa/production/keyboard";

async function main() {
  const args = process.argv.slice(2), url = args[0], index = args.indexOf("--out");
  if (!url || !/^https?:\/\//.test(url)) throw new Error("Provide URL, optionally --out qa/production/reports/voices.json");
  const out = index < 0 ? "qa/production/reports/voices.json" : args[index + 1];
  const examples = new Map<string, { state: GameState; route: string }>();
  for (const file of readdirSync("qa/routes").filter(file => file.endsWith(".json")).sort()) {
    const spec = JSON.parse(readFileSync(`qa/routes/${file}`, "utf8")) as ReplaySpec;
    let state = createCharacter(spec.character);
    const record = () => {
      const scene = getScene(state.sceneId), line = visibleDialogue(scene.id, scene.speaker, sceneText(scene, state));
      if (line && !examples.has(line.id)) examples.set(line.id, { state, route: file });
    };
    record();
    for (const step of spec.steps) {
      const choice = presentChoices(state, getScene(state.sceneId)).find(choice => choice.id === step.choiceId && choice.enabled);
      if (!choice) throw new Error(`Unavailable authored choice ${file}/${step.choiceId}`);
      state = commitChoice(state, choice, choice.check ? { roll: step.roll! } : undefined).state; record();
    }
  }
  for (const line of lines) if (!examples.has(line.id)) throw new Error(`No authored reachable example for ${line.id}`);
  const revision = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const dirty = Boolean(execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim());
  const testedSources = Object.fromEntries(["lib/sound.ts", "lib/engine.ts", "lib/memory-media.ts", "components/VoiceLine.tsx", "components/GameApp.tsx", "components/PlayScreen.tsx", "qa/production/keyboard.ts", "qa/production/audio-review.ts", "qa/media/voice-lines.json", "scripts/voice-validation.ts"].map(file => [file, createHash("sha256").update(readFileSync(file)).digest("hex")]));
  const testedRoutes = Object.fromEntries([...new Set([...examples.values()].map(example => example.route))].map(file => [file, createHash("sha256").update(readFileSync(`qa/routes/${file}`)).digest("hex")]));
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ["--no-sandbox"] });
  const rows: { id: string; route: string; durationSeconds: number; voiceRequests: number; liveSourcesAfterEnd: number; created: number; disposed: number }[] = [];
  const errors: string[] = [], failures: string[] = [];
  const started = Date.now(), automatic = args.includes("--automatic");
  try {
    for (const line of lines) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
      try {
        const page = await context.newPage(), example = examples.get(line.id)!;
        let voiceRequests = 0;
        page.on("pageerror", error => errors.push(`${line.id}: ${error.message}`));
        page.on("request", request => { if (new URL(request.url()).pathname === `/audio/${line.id}.wav`) voiceRequests++; });
        page.on("requestfailed", request => { if (new URL(request.url()).pathname.startsWith("/audio/")) failures.push(`${line.id}: ${request.failure()?.errorText}`); });
        await page.addInitScript({ content: `var __name = (fn, name) => Object.defineProperty(fn, "name", { value: name, configurable: true }); (${installAudioReview.toString()})();` });
        await page.addInitScript(({ state, automatic }) => {
          localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
          localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", sound: true, autoVoices: automatic, motion: "reduce", artwork: "none", effects: 0 }));
        }, { state: example.state, automatic });
        const audio = (): Promise<AudioReview> => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
        const saved = () => page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
        await page.goto(url); await keyboardActivate(page, page.getByTestId("continue-run"));
        await expect.poll(async () => (await audio()).liveSources).toBe(automatic ? 3 : 2);
        const before = await saved(), created = (await audio()).sourcesCreated - (automatic ? 1 : 0);
        expect(voiceRequests).toBe(automatic ? 1 : 0);
        await expect(page.getByTestId("scene-text")).toContainText(line.text);
        await keyboardActivate(page, page.getByTestId("voice-line").locator("summary"));
        await expect(page.getByTestId("voice-line").locator("details")).toContainText(line.text);
        const listen = page.getByTestId("voice-line").getByRole("button", { name: /^Listen to / });
        const playStarted = Date.now();
        if (!automatic) { await keyboardActivate(page, listen); await expect(page.getByTestId("voice-line")).toContainText("Playing selected dialogue"); }
        await expect.poll(async () => (await audio()).sourcesCreated).toBe(created + 1);
        await expect(listen).toBeVisible({ timeout: 30_000 });
        const ended = await audio(), durationSeconds = (Date.now() - playStarted) / 1000;
        expect(ended.liveSources).toBe(2); expect(ended.sourcesDisposed).toBe(1); expect(ended.buffersCleared).toBe(1);
        expect(ended.started.filter(name => name === `${line.id}.wav`)).toHaveLength(1); expect(await saved()).toBe(before);
        // Cached replay must remain explicit and Stop must dispose immediately.
        await keyboardActivate(page, listen); await expect(page.getByTestId("voice-line")).toContainText("Playing selected dialogue");
        await keyboardActivate(page, page.getByRole("button", { name: "Stop line", exact: true }));
        await expect.poll(async () => (await audio()).liveSources).toBe(2);
        expect(voiceRequests).toBe(1); expect(await saved()).toBe(before);
        await keyboardActivate(page, page.getByRole("button", { name: "Settings", exact: true }));
        await keyboardActivate(page, page.getByLabel("Sound enabled", { exact: true }));
        await expect.poll(async () => (await audio()).liveSources).toBe(0);
        const off = await audio(); expect(off.sourcesDisposed).toBe(off.sourcesCreated); expect(off.buffersCleared).toBe(off.sourcesCreated);
        rows.push({ id: line.id, route: example.route, durationSeconds, voiceRequests, liveSourcesAfterEnd: ended.liveSources, created: off.sourcesCreated, disposed: off.sourcesDisposed });
        console.log(JSON.stringify(rows.at(-1)));
      } finally { await context.close(); }
    }
    expect(errors).toEqual([]); expect(failures).toEqual([]);
    mkdirSync(dirname(out), { recursive: true });
    const environment = { browser: "Chromium", browserVersion: browser.version(), platform: process.platform, nodeVersion: process.version, device: "cloud automation host; synthetic viewport" };
    writeFileSync(out, JSON.stringify({ revision, dirty, testedSources, testedRoutes, environment, url, automatic, elapsedSeconds: (Date.now() - started) / 1000, rows, errors, failures, limitations: "Internal directed, reachable replay states in separate QA contexts; these are not completed campaigns. Natural clip completion, explicit cached replay, Stop, transcript parity and cleanup are technical observations. No human listening, loudness comfort, artistic pronunciation, fatigue, rights or physical-device acceptance." }, null, 2));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
