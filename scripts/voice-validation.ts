import dramaticAdditions from "../qa/media/dramatic-beats-dialogue-lines.json";
import seraAdditions from "../qa/media/sera-shift-dialogue-lines.json";
import routingAdditions from "../qa/media/return-routing-dialogue-lines.json";
import { performanceVoicePath } from "../lib/performance-delivery";
import freightAdditions from "../qa/media/freight-craft-dialogue-lines.json";
import payoffAdditions from "../qa/media/emotional-payoff-dialogue-lines.json";
import craftAdditions from "../qa/media/encounter-craft-dialogue-lines.json";
import { chromium, expect } from "@playwright/test";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { commitChoice, getScene, sceneText } from "../lib/engine";
import { visibleCampaignDialogue, visibleCheckDialogue } from "../lib/campaign-dialogue";
import old from "../qa/media/voice-lines.json";
import additions from "../qa/media/campaign-dialogue-lines.json";
import districtAdditions from "../qa/media/district-dialogue-lines.json";
import techniqueAdditions from "../qa/media/technique-dialogue-lines.json";
import kerrAdditions from "../qa/media/kerr-terms-dialogue-lines.json";
import maraAdditions from "../qa/media/mara-account-dialogue-lines.json";
import witnessAdditions from "../qa/media/witness-return-dialogue-lines.json";
import { allCampaignDialogue as bindings } from "../lib/campaign-dialogue";
import { dialogueExamples } from "../qa/production/dialogue-examples";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import { keyboardActivate } from "../qa/production/keyboard";
import { voiceLevel } from "../lib/voice-level";

async function main() {
  const args = process.argv.slice(2), url = args[0];
  if (!url || !/^https?:\/\//.test(url)) throw new Error("Provide URL, optionally --out PATH --workers 1..4 --automatic --only-new --ids ID,ID");
  const argument = (name: string, fallback: string) => { const index = args.indexOf(name); return index < 0 ? fallback : args[index + 1]; };
  const out = argument("--out", "qa/production/reports/voices.json"), workers = Number(argument("--workers", "1"));
  if (!Number.isInteger(workers) || workers < 1 || workers > 4) throw new Error("Use 1..4 QA browser workers");
  const automatic = args.includes("--automatic"), used = new Set(bindings.map(line => line.id));
  const requested = args.includes("--ids") ? argument("--ids", "").split(",") : undefined;
  const candidates = [...(args.includes("--only-new") ? [] : old), ...additions, ...districtAdditions, ...techniqueAdditions, ...kerrAdditions, ...maraAdditions, ...witnessAdditions, ...craftAdditions, ...payoffAdditions, ...freightAdditions, ...dramaticAdditions, ...seraAdditions, ...routingAdditions].filter(line => used.has(line.id));
  if (requested && (!requested.length || requested.some(id => !candidates.some(line => line.id === id)))) throw new Error("Every --ids entry must identify an active delivery in this audit scope");
  const lines = candidates.filter(line => !requested || requested.includes(line.id));
  const examples = dialogueExamples();
  const revision = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const dirty = Boolean(execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim());
  const testedSources = Object.fromEntries(["lib/ordinary-direction.ts", "components/OrdinarySceneArtwork.tsx", "qa/media/ordinary-scene-direction.json", "lib/engine.ts", "lib/story/index.ts", "lib/objectives.ts", "qa/media/scene-art.json", "qa/media/return-routing-dialogue-transcripts.json", "qa/media/return-routing-performance-review.json", "lib/return-routing.ts", "lib/story/return-routing.ts", "qa/media/return-routing.json", "qa/media/return-routing-dialogue-bindings.json", "qa/media/return-routing-dialogue-lines.json", "qa/media/return-routing-dialogue-provenance.json", "lib/decision-flow.ts", "components/TestimonyBrief.tsx", "components/FieldKitBrief.tsx", "qa/editorial/decision-flow-baseline.json", "lib/sequence-continuity.ts", "qa/media/sequence-continuity.json", "lib/freight-craft.ts", "lib/story/freight-craft.ts", "qa/media/freight-craft.json", "qa/media/freight-craft-dialogue-bindings.json", "qa/media/freight-craft-dialogue-lines.json", "qa/media/freight-craft-dialogue-provenance.json", "lib/workspace-flow.ts", "lib/performance-delivery.ts", "qa/media/aaa-performance-direction.json", "lib/emotional-payoff.ts", "lib/story/emotional-payoff.ts", "qa/media/emotional-payoff.json", "qa/media/emotional-payoff-dialogue-bindings.json", "qa/media/emotional-payoff-dialogue-lines.json", "qa/media/emotional-payoff-dialogue-provenance.json", "components/ArchiveQuestionDesk.tsx", "lib/encounter-craft.ts", "lib/story/encounter-craft.ts", "qa/media/encounter-craft.json", "qa/media/encounter-craft-dialogue-bindings.json", "qa/media/encounter-craft-dialogue-lines.json", "qa/media/encounter-craft-dialogue-provenance.json", "lib/decision-pacing.ts", "lib/witness-return.ts", "lib/story/witness-return.ts", "qa/media/witness-return.json", "qa/media/witness-return-dialogue-bindings.json", "qa/media/witness-return-dialogue-lines.json", "qa/media/witness-return-dialogue-provenance.json", "lib/mara-account.ts", "lib/story/mara-account.ts", "qa/media/mara-relationship.json", "qa/media/mara-account-dialogue-bindings.json", "qa/media/mara-account-dialogue-lines.json", "qa/media/mara-account-dialogue-provenance.json", "lib/kerr-terms.ts", "lib/story/kerr-terms.ts", "qa/media/kerr-confrontation.json", "qa/media/kerr-terms-dialogue-bindings.json", "qa/media/kerr-terms-dialogue-lines.json", "qa/media/kerr-terms-dialogue-provenance.json", "lib/cinematic-sequences.ts", "components/SequenceArtwork.tsx", "components/PivotalScene.tsx", "qa/media/cinematic-sequences.json", "lib/preferences.ts", "next.config.ts", "qa/media/bed-delivery.json", "lib/build-techniques.ts", "lib/story/build-techniques.ts", "lib/technique-dialogue.ts", "components/TechniqueBoard.tsx", "qa/media/technique-dialogue-bindings.json", "qa/media/technique-dialogue-lines.json", "qa/media/technique-dialogue-provenance.json", "lib/sound.ts", "lib/voice-level.ts", "qa/media/voice-levels.json", "qa/media/voice-mix.json", "lib/engine.ts", "lib/campaign-dialogue.ts", "lib/dialogue-playback.ts", "components/VoiceLine.tsx", "components/GameApp.tsx", "components/PlayScreen.tsx", "qa/production/keyboard.ts", "qa/production/audio-review.ts", "qa/production/dialogue-examples.ts", "qa/media/campaign-dialogue-bindings.json", "qa/media/campaign-dialogue-lines.json", "qa/media/district-dialogue-bindings.json", "qa/media/district-dialogue-lines.json", "qa/media/district-dialogue-provenance.json", "qa/media/voice-lines.json", "scripts/voice-validation.ts"].map(file => [file, createHash("sha256").update(readFileSync(file)).digest("hex")]));
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ["--no-sandbox"] });
  const rows: object[] = [], errors: string[] = [], failures: string[] = []; let next = 0; const started = Date.now();
  const filename = (id: string) => `${id}.${id.startsWith("voice-campaign-") ? "mp3" : "wav"}`;
  try {
    await Promise.all(Array.from({ length: workers }, async () => {
      while (next < lines.length) {
        const line = lines[next++], example = examples.get(line.id)!;
        const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
        try {
          const page = await context.newPage(); let voiceRequests = 0;
          page.on("pageerror", error => errors.push(`${line.id}: ${error.message}`));
          page.on("request", request => { if ([performanceVoicePath(line.id), `/audio/${filename(line.id)}`].includes(new URL(request.url()).pathname)) voiceRequests++; });
          page.on("requestfailed", request => { if (new URL(request.url()).pathname.startsWith("/audio/")) failures.push(`${line.id}: ${request.failure()?.errorText}`); });
          await page.addInitScript({ content: `var __name = (fn, name) => Object.defineProperty(fn, "name", { value: name, configurable: true }); (${installAudioReview.toString()})();` });
          await page.addInitScript(({ state, automatic }) => {
            localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
            localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", sound: true, autoVoices: automatic, motion: "reduce", artwork: "none", effects: 0 }));
          }, { state: example.state, automatic });
          const audio = (): Promise<AudioReview> => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
          const saved = () => page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
          await page.goto(url);
          // Stabilize the title decode before testing the bounded cache's replay.
          await expect(page.getByTestId("new-run")).toBeEnabled();
          await keyboardActivate(page, page.getByRole("button", { name: "Show replay hints", exact: true }));
          await expect.poll(async () => (await audio()).started).toContain("theme-title.flac");
          await keyboardActivate(page, page.getByTestId("continue-run"));
          const scene = getScene(example.state.sceneId), text = sceneText(scene, example.state);
          const pending = example.checkResult ? example.state.pendingCheck! : undefined;
          const checkChoice = pending ? scene.choices.find(choice => choice.id === pending.choiceId)! : undefined;
          const checkCommit = checkChoice && pending ? commitChoice(example.state, checkChoice, { roll: pending.roll }) : undefined;
          const queue = checkCommit?.check ? visibleCheckDialogue(scene.id, checkChoice!.id, scene.speaker, checkCommit.check.success, checkCommit.check.flavor) : visibleCampaignDialogue(scene.id, scene.speaker, text);
          const selected = queue.find(candidate => candidate.id === line.id)!;
          // A restored check keeps the scene's voice widget mounted behind the
          // modal. Audition the revealed result, not that inactive scene widget.
          const voice = checkCommit ? page.getByRole("dialog").getByTestId("voice-line") : page.getByTestId("scene").getByTestId("voice-line");
          const expected = automatic ? queue.map(candidate => filename(candidate.id)) : [filename(line.id)];
          if (automatic) await expect.poll(async () => (await audio()).started.filter(name => name.startsWith("voice-"))).toContain(expected[0]);
          else await expect.poll(async () => (await audio()).liveSources).toBe(2);
          const before = await saved();
          await keyboardActivate(page, voice.locator("summary"));
          await expect(voice.locator("details")).toContainText(line.text);
          if (!automatic) {
            expect(voiceRequests).toBe(0);
            if (queue.length > 1) await voice.getByLabel("Dialogue line", { exact: true }).selectOption(selected.key);
            await keyboardActivate(page, voice.getByRole("button", { name: /^Listen to / }));
          }
          const playStarted = Date.now();
          await expect.poll(async () => (await audio()).started.filter(name => name.startsWith("voice-")), { timeout: 90_000 }).toEqual(expected);
          if (!automatic) {
            const mark = page.getByTestId("spoken-quote");
            await expect(mark).toHaveAttribute("data-speaker", selected.speaker);
            const words = (text: string) => text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
            expect(words((await mark.textContent())!)).toEqual(words(selected.text));
            const portrait = page.locator(checkCommit ? ".reaction .portrait-frame" : ".scene-row .portrait-frame");
            await expect(portrait).toHaveAttribute("data-speaker", selected.speaker);
            await expect(portrait).toHaveAttribute("data-speaking", "true");
          }
          const listen = voice.getByRole("button", { name: /^Listen to / });
          await expect(listen).toBeVisible({ timeout: 45_000 });
          await expect(page.getByTestId("spoken-quote")).toHaveCount(0);
          const ended = await audio(), durationSeconds = (Date.now() - playStarted) / 1000;
          expect(ended.liveSources).toBe(2);
          expect(ended.disposed.filter(name => name.startsWith("voice-"))).toEqual(expected);
          expect(ended.cleared.filter(name => name.startsWith("voice-"))).toEqual(expected); expect(await saved()).toBe(before);
          expect(ended.voiceLevels.map(entry => entry.file)).toEqual(expected);
          for (const entry of ended.voiceLevels) expect(entry.gain).toBeCloseTo(voiceLevel(entry.file.replace(/\.(wav|mp3)$/, "")), 6);
          const requestsBeforeReplay = voiceRequests;
          expect(requestsBeforeReplay).toBe(1);
          if (queue.length > 1) await voice.getByLabel("Dialogue line", { exact: true }).selectOption(selected.key);
          await keyboardActivate(page, listen); await expect(voice).toContainText("Playing selected dialogue");
          await keyboardActivate(page, page.getByRole("button", { name: "Stop line", exact: true }));
          await expect(page.getByTestId("spoken-quote")).toHaveCount(0);
          await expect.poll(async () => (await audio()).liveSources).toBe(2);
          // The bounded decoded cache may evict an early clip in a long queue.
          // Explicit replay can fetch it once again; automatic playback cannot.
          expect(voiceRequests - requestsBeforeReplay).toBeGreaterThanOrEqual(0);
          expect(voiceRequests - requestsBeforeReplay).toBeLessThanOrEqual(1);
          expect(await saved()).toBe(before);
          if (checkCommit) {
            await keyboardActivate(page, page.getByTestId("continue-check"));
            expect(JSON.parse((await saved())!)).toEqual(checkCommit.state);
          }
          await keyboardActivate(page, page.getByRole("button", { name: "Settings", exact: true }));
          await keyboardActivate(page, page.getByLabel("Sound enabled", { exact: true }));
          await expect.poll(async () => (await audio()).liveSources).toBe(0);
          const off = await audio(); expect(off.sourcesDisposed).toBe(off.sourcesCreated); expect(off.buffersCleared).toBe(off.sourcesCreated);
          const row = { id: line.id, route: example.route, source: example.source, expectedVoices: expected, playbackLevels: ended.voiceLevels, durationSeconds, voiceRequests, requestsBeforeReplay, replayRefetched: voiceRequests > requestsBeforeReplay, liveSourcesAfterEnd: ended.liveSources, created: off.sourcesCreated, disposed: off.sourcesDisposed };
          rows.push(row); console.log(JSON.stringify(row));
        } finally { await context.close(); }
      }
    }));
    expect(errors).toEqual([]); expect(failures).toEqual([]);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify({ revision, dirty, testedSources, environment: { browser: "Chromium", browserVersion: browser.version(), platform: process.platform, nodeVersion: process.version, device: "cloud automation host; synthetic viewport" }, url, automatic, workers, elapsedSeconds: (Date.now() - started) / 1000, rows, errors, failures, limitations: "Internal source examples: authored/seeded route states and separately labeled conditional branch samples. This is clip playback verification, not completed UI campaigns. Natural completion, explicit replay (cached or refetched after eviction), Stop, transcripts and cleanup are observed. No commissioned actors, human participation, physical-device or independent listening acceptance." }, null, 2));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
