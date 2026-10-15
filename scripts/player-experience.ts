import { chromium, expect } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { commitChoice, getScene, presentChoices, sceneText } from "../lib/engine";
import { metCast } from "../lib/story/cast";
import type { ReplaySpec } from "../lib/story-replay";
import type { GameState } from "../lib/types";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import { keyboardActivate, keyboardSelect, tabTo } from "../qa/production/keyboard";

async function main() {
  const args = process.argv.slice(2), url = args[0];
  if (!url || !/^https?:\/\//.test(url)) throw new Error("Provide URL, optionally --route qa/routes/integration-names.json --width 320 --artwork none --reading paragraph --sound");
  const option = (name: string, fallback: string) => { const i = args.indexOf(name); return i < 0 ? fallback : args[i + 1]; };
  const route = option("--route", "qa/routes/integration-names.json");
  const width = Number(option("--width", "390")), artwork = option("--artwork", "none"), reading = option("--reading", "paragraph");
  if (![320, 390, 1440].includes(width) || !["none", "full"].includes(artwork) || !["paragraph", "all"].includes(reading)) throw new Error("Unsupported QA profile");
  const sound = args.includes("--sound"), profiles = args.includes("--profiles"), out = option("--out", "qa/production/reports/player-experience.json");
  const spec = JSON.parse(readFileSync(route, "utf8")) as ReplaySpec;
  const revision = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const dirty = Boolean(execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim());
  const testedSources = Object.fromEntries(["lib/sound.ts", "components/GameApp.tsx", "components/PlayScreen.tsx", "components/ArchiveCatalog.tsx", "components/FinaleReflection.tsx", "components/PivotalScene.tsx", "lib/pivotal-scenes.ts", "lib/finale-direction.ts", "lib/archive-catalog.ts", "components/VoiceLine.tsx", "components/Sheet.tsx", "components/CastCard.tsx", "lib/character-profiles.ts", "qa/production/keyboard.ts", "scripts/player-experience.ts", route].map(file => [file, createHash("sha256").update(readFileSync(file)).digest("hex")]));
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width, height: width === 1440 ? 900 : 844 }, reducedMotion: "reduce" });
  const errors: string[] = [], failedMedia: string[] = [], mediaRequests = new Set<string>();
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => { const path = new URL(request.url()).pathname; if (/^\/(audio|art)\//.test(path)) mediaRequests.add(path); });
  page.on("response", response => { const path = new URL(response.url()).pathname; if (/^\/(audio|art)\//.test(path) && response.status() >= 400) failedMedia.push(`${response.status()} ${path}`); });
  page.on("requestfailed", request => { const path = new URL(request.url()).pathname; if (/^\/(audio|art)\//.test(path)) failedMedia.push(`${request.failure()?.errorText} ${path}`); });
  await page.addInitScript({ content: `var __name = (fn, name) => Object.defineProperty(fn, "name", { value: name, configurable: true }); (${installAudioReview.toString()})();` });
  const saved = (): Promise<GameState> => page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  const audio = (): Promise<AudioReview> => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
  let tabs = 0, reloads = 0, reveals = 0, voices = 0, interruptions = 0;
  const scenes: string[] = [], choiceResponseMs: number[] = [], completedVoices: string[] = [];
  const consultedProfiles = new Set<string>();
  const activate = async (target: Parameters<typeof keyboardActivate>[1]) => { tabs += await keyboardActivate(page, target); };
  const start = Date.now();
  try {
    await page.goto(url);
    await activate(page.getByRole("button", { name: "Settings", exact: true }));
    tabs += await keyboardSelect(page, page.getByLabel("Text size", { exact: true }), "2");
    tabs += await keyboardSelect(page, page.getByLabel("Contrast", { exact: true }), "high");
    tabs += await keyboardSelect(page, page.getByLabel("Artwork", { exact: true }), artwork);
    tabs += await keyboardSelect(page, page.getByLabel("Reading pace", { exact: true }), reading);
    tabs += await keyboardSelect(page, page.getByLabel("Motion", { exact: true }), "reduce");
    await activate(page.getByLabel("Number-key choices", { exact: true }));
    if (!sound) await activate(page.getByLabel("Sound enabled", { exact: true }));
    await activate(page.getByLabel("Play dialogue automatically", { exact: true }));
    await activate(page.getByRole("button", { name: "Done", exact: true }));
    // The first title uses default illustrated preferences. Attribute its requests
    // separately from requests after the player chooses text-only delivery.
    const initialMediaRequests = [...mediaRequests]; mediaRequests.clear();
    await activate(page.getByTestId("new-run"));
    tabs += await tabTo(page, page.getByTestId("handle-input")); await page.keyboard.type(spec.character.handle);
    if (spec.character.givenName) { tabs += await tabTo(page, page.getByTestId("given-input")); await page.keyboard.type(spec.character.givenName); }
    await activate(page.getByTestId(`origin-${spec.character.origin}`));
    if (!spec.character.complication) throw new Error("UI campaign requires an explicit complication");
    await activate(page.getByTestId(`complication-${spec.character.complication}`));
    for (const [stat, count] of Object.entries(spec.character.bonus)) for (let i = 0; i < count; i++) await activate(page.getByTestId(`plus-${stat}`));
    await activate(page.getByTestId("start-run"));
    for (const [index, step] of spec.steps.entries()) {
      const before = await saved(); scenes.push(before.sceneId);
      await expect(page.getByTestId("goal")).toBeVisible();
      // Goal position is checked before Tab navigation scrolls to choices.
      const goal = await page.getByTestId("goal").boundingBox();
      if (scenes.length === 1 || scenes.at(-2) !== before.sceneId) {
        if (!goal || goal.y < 0 || goal.y + goal.height > page.viewportSize()!.height) throw new Error(`Goal outside first screen at ${before.sceneId}`);
      }
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error(`Overflow at ${before.sceneId}`);
      const showRest = page.getByTestId("show-rest");
      if (await showRest.count()) { await activate(showRest); reveals++; }
      if (profiles) {
        const scene = getScene(before.sceneId);
        const newPeople = metCast(before, scene.speaker, sceneText(scene, before)).filter(person => !consultedProfiles.has(person.speaker));
        if (newPeople.length) {
          if (width <= 1100) await activate(page.getByRole("button", { name: "Sheet", exact: true }));
          const sheet = page.getByTestId("sheet"), people = sheet.locator(".cast-roster");
          if (!await people.evaluate(details => details.hasAttribute("open"))) await activate(people.locator(":scope > summary"));
          for (const person of newPeople) {
            const card = sheet.locator(`.cast-card[data-speaker="${person.speaker}"]`), about = card.locator(".cast-profile > summary");
            await activate(about);
            await expect(card.getByTestId("character-profile")).toBeVisible();
            const notes = card.locator(".cast-profile-notes > summary");
            if (await notes.count()) await activate(notes);
            expect(await saved()).toEqual(before);
            consultedProfiles.add(person.speaker);
            await activate(about);
          }
          await activate(people.locator(":scope > summary"));
          if (width <= 1100) await activate(sheet.getByRole("button", { name: "Close sheet", exact: true }));
          expect(await saved()).toEqual(before);
        }
      }
      const choice = presentChoices(before, getScene(before.sceneId)).find(choice => choice.id === step.choiceId && choice.enabled);
      if (!choice) throw new Error(`Unavailable authored choice ${before.sceneId}/${step.choiceId}`);
      if (sound) {
        const listen = page.getByTestId("voice-line").getByRole("button", { name: /^Listen to / });
        if (await listen.count()) {
          const stateBeforeVoice = await saved();
          await activate(listen); await expect(page.getByTestId("voice-line")).toContainText("Playing selected dialogue"); voices++;
          // Complete each encountered line naturally, including its ended cleanup.
          const name = (await audio()).started.findLast(name => name.startsWith("voice-"))!;
          await expect(page.getByRole("button", { name: /^Listen to / })).toBeVisible({ timeout: 30_000 });
          completedVoices.push(name); expect(await saved()).toEqual(stateBeforeVoice);
        }
        if ([10, 30].includes(index)) {
          const exact = await saved();
          await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true })));
          await expect.poll(async () => (await audio()).liveSources).toBe(0);
          const stopped = await audio(); expect(stopped.sourcesCreated).toBe(stopped.sourcesDisposed); expect(stopped.buffersCleared).toBe(stopped.sourcesCreated);
          await activate(page.getByRole("button", { name: "Resume sound", exact: true }));
          await expect.poll(async () => (await audio()).liveSources).toBe(2);
          expect(await saved()).toEqual(exact); interruptions++;
        }
      }
      const control = page.getByTestId(`choice-${step.choiceId}`);
      tabs += await tabTo(page, control);
      const clicked = Date.now(); await page.keyboard.press("Enter");
      if (choice.check) {
        if (!step.roll) throw new Error(`Missing directed die ${step.choiceId}`);
        await page.evaluate(face => { Math.random = () => (face - 0.5) / 10; }, step.roll);
        await activate(page.getByTestId("roll-button"));
        await expect(page.getByTestId("continue-check")).toBeVisible();
        if (step.reload) {
          const pending = await saved(); expect(pending.pendingCheck?.roll).toBe(step.roll);
          await page.reload(); await activate(page.getByTestId("continue-run"));
          expect(await saved()).toEqual(pending); reloads++;
        }
        await activate(page.getByTestId("continue-check"));
      }
      const expected = commitChoice(before, choice, choice.check ? { roll: step.roll! } : undefined).state;
      await expect.poll(async () => await saved()).toEqual(expected);
      choiceResponseMs.push(Date.now() - clicked); // Includes check review and reload when present; not INP.
      if (step.reload && !choice.check) { await page.reload(); await activate(page.getByTestId("continue-run")); expect(await saved()).toEqual(expected); reloads++; }
    }
    const final = await saved(); scenes.push(final.sceneId); expect(final.sceneId).toBe(spec.expected.sceneId);
    for (const [key, value] of Object.entries(spec.expected.flags ?? {})) expect(Boolean(final.flags[key])).toBe(value);
    const finaleRest = page.getByTestId("show-rest");
    if (await finaleRest.count()) { await activate(finaleRest); reveals++; }
    const finaleLine = page.getByTestId("voice-line").getByRole("button", { name: /^Listen to / });
    if (sound && await finaleLine.count()) {
      await activate(finaleLine); await expect(page.getByTestId("voice-line")).toContainText("Playing selected dialogue"); voices++;
      completedVoices.push((await audio()).started.findLast(name => name.startsWith("voice-"))!);
      await expect(page.getByRole("button", { name: /^Listen to / })).toBeVisible({ timeout: 30_000 });
    }
    await activate(page.getByTestId("aftermath-details").locator("summary"));
    expect(await saved()).toEqual(final);
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error("Expanded aftermath overflow");
    mkdirSync(dirname(out), { recursive: true });
    await page.screenshot({ path: out.replace(/\.json$/, ".png"), fullPage: true });
    await activate(page.getByRole("button", { name: "Settings", exact: true }));
    if (sound) await activate(page.getByLabel("Sound enabled", { exact: true }));
    await expect.poll(async () => (await audio()).liveSources).toBe(0);
    const stopped = await audio(); expect(stopped.sourcesCreated).toBe(stopped.sourcesDisposed); expect(stopped.buffersCleared).toBe(stopped.sourcesCreated);
    expect(errors).toEqual([]); expect(failedMedia).toEqual([]);
    if (artwork === "none") expect([...mediaRequests].filter(path => path.startsWith("/art/"))).toEqual([]);
    if (!sound) expect([...mediaRequests].filter(path => path.startsWith("/audio/"))).toEqual([]);
    mkdirSync(dirname(out), { recursive: true });
    const environment = { browser: "Chromium", browserVersion: browser.version(), platform: process.platform, nodeVersion: process.version, device: "cloud automation host; synthetic viewport" };
    const result = { revision, dirty, testedSources, environment, url, route, width, artwork, reading, sound, profiles, consultedProfiles: [...consultedProfiles], input: "Tab, Shift+Tab, Enter, Space, arrows and typing; no pointer actions or programmatic focus", dice: "authored/directed", elapsedSeconds: (Date.now() - start) / 1000, visits: scenes.length, scenes, tabs, reloads, reveals, voices, completedVoices, interruptions, choiceResponseMs, final: { sceneId: final.sceneId, creds: final.creds, strain: final.strain, rolls: final.rolls.map(roll => roll.roll) }, finalAudio: stopped, initialMediaRequests, mediaRequests: [...mediaRequests], errors, failedMedia, limitations: "Internal authored campaign, not blind or fresh-player observation. Synthetic viewport and pagehide, not physical hardware or app switch. Voice completion and cleanup do not establish listening quality. Transition times include UI review/reloads; they are not INP or field percentiles." };
    writeFileSync(out, JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ route, visits: scenes.length, tabs, reloads, reveals, voices, interruptions, finale: final.sceneId, errors, failedMedia }));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
