import { chromium, expect, type Page } from "@playwright/test";
import { spawn, execFileSync, type ChildProcess } from "node:child_process";
import { createServer, request, type Server } from "node:http";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { createHash } from "node:crypto";
import { commitChoice, getScene, presentChoices } from "../lib/engine";
import { importRun } from "../lib/vault";
import { parseSave } from "../lib/storage";
import type { GameState } from "../lib/types";

const KEY = "saint-shard-3055-v1";
const SOURCES = ["lib/storage.ts", "lib/vault.ts", "lib/engine.ts", "components/GameApp.tsx", "components/SaveDialog.tsx", "components/CheckDialog.tsx"];
const digest = (raw: string | Buffer) => createHash("sha256").update(raw).digest("hex");
async function listen(server: Server) {
  await new Promise<void>((done, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", done); });
  const address = server.address(); if (!address || typeof address === "string") throw new Error("No isolated port");
  return address.port;
}
async function close(server: Server) { server.closeAllConnections(); await new Promise<void>(done => server.close(() => done())); }
async function startBuild(path: string) {
  const reservation = createServer(); const port = await listen(reservation); await close(reservation);
  const child = spawn(process.execPath, [join(path, "node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", String(port)], { cwd: path, stdio: ["ignore", "pipe", "pipe"] });
  let log = ""; for (const stream of [child.stdout, child.stderr]) stream!.on("data", data => { log = (log + String(data)).slice(-4096); });
  let spawnError: Error | undefined; child.on("error", error => { spawnError = error; });
  try {
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      if (spawnError) throw spawnError;
      if (child.exitCode !== null) throw new Error(`Isolated build exited ${child.exitCode}: ${log}`);
      try { if ((await fetch(`http://127.0.0.1:${port}`, { signal: AbortSignal.timeout(1000) })).ok) return { child, port }; } catch {}
      await new Promise(done => setTimeout(done, 200));
    }
    throw new Error("Isolated build did not start within 30 seconds");
  } catch (error) { child.kill("SIGTERM"); throw error; }
}
function fingerprint(path: string) {
  return {
    revision: execFileSync("git", ["-C", path, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    dirty: Boolean(execFileSync("git", ["-C", path, "status", "--porcelain"], { encoding: "utf8" }).trim()),
    buildId: readFileSync(join(path, ".next/BUILD_ID"), "utf8").trim(),
    sources: Object.fromEntries(SOURCES.map(file => [file, digest(readFileSync(join(path, file)))])),
  };
}
async function stored(page: Page) { return page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter(key => key.startsWith("saint-shard-")).sort().map(key => [key, localStorage.getItem(key)]))); }
async function state(page: Page) { return page.evaluate(key => JSON.parse(localStorage.getItem(key)!), KEY) as Promise<GameState>; }
async function importFile(page: Page, raw: string) {
  const replacing = await page.evaluate(key => Boolean(localStorage.getItem(key)), KEY);
  await page.getByRole("button", { name: "Saves", exact: true }).click();
  await page.getByLabel("Import a saved run").setInputFiles({ name: "release-fixture.json", mimeType: "application/json", buffer: Buffer.from(raw) });
  if (replacing) await page.getByRole("button", { name: "Confirm load", exact: true }).click();
  await expect(page.getByTestId("scene-text")).toBeVisible();
}

async function main() {
  const args = process.argv.slice(2);
  const option = (name: string, fallback = "") => { const i = args.indexOf(name); return i < 0 ? fallback : args[i + 1]; };
  const previous = resolve(option("--previous")), candidate = resolve(option("--candidate", "."));
  if (!option("--previous") || previous === candidate) throw new Error("Provide separate built worktrees: --previous PATH [--candidate PATH]");
  const out = option("--out", "qa/production/reports/release-rehearsal.json");
  const fixtures = resolve(option("--fixtures", "qa/release/cycle9")), provenance = JSON.parse(readFileSync(join(fixtures, "provenance.json"), "utf8"));
  const previousBuild = fingerprint(previous), candidateBuild = fingerprint(candidate);
  if (previousBuild.revision !== provenance.revision || previousBuild.dirty) throw new Error("Previous worktree must be the clean, recorded public release");
  const files = provenance.files as { file: string; sha256: string }[];
  if (files.length !== 5 || files.some(file => !/^(pending-window|ending-(names|quiet|witness|listed))\.json$/.test(file.file))) throw new Error("Unexpected release fixture manifest");
  for (const file of files) if (digest(readFileSync(join(fixtures, file.file))) !== file.sha256) throw new Error(`Changed previous-release fixture ${file.file}`);
  const children: ChildProcess[] = [], checks: object[] = [], errors: string[] = [];
  let proxy: Server | undefined, browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    const old = await startBuild(previous); children.push(old.child);
    const next = await startBuild(candidate); children.push(next.child);
    let active = old.port;
    proxy = createServer((req, res) => {
      if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405); res.end(); return; }
      const upstream = request({ hostname: "127.0.0.1", port: active, path: req.url, method: req.method, headers: { ...req.headers, host: `127.0.0.1:${active}` } }, incoming => {
        res.writeHead(incoming.statusCode ?? 502, incoming.headers); incoming.pipe(res);
      });
      upstream.on("error", () => { if (!res.headersSent) res.writeHead(502); res.end(); });
      res.on("close", () => upstream.destroy()); req.pipe(upstream);
    });
    const url = `http://127.0.0.1:${await listen(proxy)}`;
    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ["--no-sandbox"] });
    for (const width of [390, 320]) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: "reduce" });
      const page = await context.newPage(); page.on("pageerror", error => errors.push(error.message));
      await page.addInitScript(width => {
        // Initialize once: reload and rollback must preserve these preferences.
        if (!localStorage.getItem("saint-shard-preferences")) localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", motion: "reduce", sound: false, artwork: width === 320 ? "none" : "full", textStep: width === 320 ? 2 : 0, contrast: "high", numberShortcuts: false }));
      }, width);
      active = old.port; await page.goto(url);
      for (const file of files) {
        active = old.port; await page.reload(); const raw = readFileSync(join(fixtures, file.file), "utf8"), expected = importRun(raw);
        await importFile(page, raw); expect(await state(page)).toEqual(expected);
        await page.reload(); await page.getByTestId("continue-run").click(); await page.reload();
        await page.getByRole("button", { name: "Saves", exact: true }).click();
        await page.getByRole("button", { name: "Save to slot 1", exact: true }).click();
        const confirmSave = page.getByRole("button", { name: "Confirm save", exact: true });
        if (await confirmSave.count()) await confirmSave.click();
        await expect(page.getByRole("dialog").getByRole("status")).toContainText("Slot 1 saved");
        await page.getByRole("button", { name: "Close saves", exact: true }).click();
        const baseline = await stored(page);
        // One browser origin and context; no save copying or storage resets on switch.
        for (const [phase, port] of [["candidate", next.port], ["rollback", old.port], ["re-promote", next.port]] as const) {
          active = port; await page.reload(); expect(await stored(page)).toEqual(baseline);
          await page.getByTestId("continue-run").click(); expect(await state(page)).toEqual(expected);
          if (expected.pendingCheck) {
            await expect(page.getByTestId("roll-button")).toHaveCount(0);
            await expect(page.locator(".total")).toContainText("8 +");
          } else {
            await expect(page.locator("h1")).toBeVisible();
            await page.getByTestId("aftermath-details").locator("summary").click();
            await expect(page.getByTestId("aftermath-details")).toHaveAttribute("open", "");
          }
          expect(await stored(page)).toEqual(baseline);
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          checks.push({ width, fixture: file.file, phase, preserved: true });
        }
        if (expected.pendingCheck) {
          const choice = presentChoices(expected, getScene(expected.sceneId)).find(choice => choice.id === expected.pendingCheck!.choiceId)!;
          const committed = commitChoice(expected, choice, { roll: 8 }).state;
          await page.getByTestId("continue-check").click(); expect(await state(page)).toEqual(committed);
          await page.reload(); await page.getByTestId("continue-run").click(); expect(await state(page)).toEqual(committed);
          await expect(page.getByTestId("roll-button")).toHaveCount(0);
          await expect(page.getByTestId("goal")).toContainText("1 opportunity");
          // Fault injection stays in this disposable browser's local storage.
          await page.evaluate(({ key, expected }) => { localStorage.setItem(`${key}-backup`, JSON.stringify(expected)); localStorage.setItem(key, "broken autosave"); }, { key: KEY, expected });
          await page.reload(); await expect(page.getByRole("status")).toContainText("automatic backup is ready");
          await page.getByTestId("continue-run").click(); expect(await state(page)).toEqual(expected);
          await page.reload(); await page.getByRole("button", { name: "Saves", exact: true }).click();
          const before = await stored(page);
          await page.getByRole("button", { name: "Save to slot 1", exact: true }).click(); await page.getByRole("button", { name: "Cancel", exact: true }).click(); expect(await stored(page)).toEqual(before);
          const corrupted = JSON.parse(raw); corrupted.state.creds++;
          await page.getByLabel("Import a saved run").setInputFiles({ name: "corrupt.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(corrupted)) });
          await expect(page.getByRole("dialog").getByRole("status")).toContainText("integrity check"); expect(await stored(page)).toEqual(before);
          await page.getByLabel("Import a saved run").setInputFiles({ name: "replacement.json", mimeType: "application/json", buffer: Buffer.from(readFileSync(join(fixtures, "ending-quiet.json"))) });
          await page.getByRole("button", { name: "Cancel", exact: true }).click(); expect(await stored(page)).toEqual(before);
          const downloading = page.waitForEvent("download"); await page.getByRole("button", { name: "Export run", exact: true }).click();
          const download = await downloading, downloaded = await download.path(); if (!downloaded) throw new Error("No native export");
          expect(importRun(readFileSync(downloaded, "utf8"))).toEqual(expected);
          await page.getByRole("button", { name: "Close saves", exact: true }).click();
          await page.evaluate(key => { localStorage.setItem(key, "bad primary"); localStorage.setItem(`${key}-backup`, "bad backup"); }, KEY);
          await page.reload(); await expect(page.getByTestId("continue-run")).toHaveCount(0);
          await page.getByRole("button", { name: "Saves", exact: true }).click(); await page.getByRole("button", { name: "Load slot 1", exact: true }).click();
          expect(await state(page)).toEqual(expected); await page.getByTestId("continue-check").click(); expect(await state(page)).toEqual(committed);
          active = old.port; await page.reload(); await page.getByTestId("continue-run").click(); expect(await state(page)).toEqual(committed);
          active = next.port; await page.reload(); await page.getByTestId("continue-run").click(); expect(await state(page)).toEqual(committed);
          checks.push({ width, pendingDie: 8, costAndAllowanceCommittedOnce: true, backupRecovery: true, slotRecovery: true, cancelledReplacement: true, corruptImportUnchanged: true, nativeExport: true, committedRollback: true });
        }
      }
      const legacy = JSON.parse(readFileSync(join(fixtures, "ending-quiet.json"), "utf8")).state;
      legacy.version = 1; delete legacy.givenName; delete legacy.factions; delete legacy.log; delete legacy.chapters; legacy.journal = legacy.journal.map((entry: { id: string }) => entry.id);
      const migrated = parseSave(JSON.stringify(legacy)); if (!migrated) throw new Error("Synthetic version 1 fixture rejected");
      await page.reload(); await importFile(page, JSON.stringify(legacy)); expect(await state(page)).toEqual(migrated);
      active = old.port; await page.reload(); await page.getByTestId("continue-run").click(); expect(await state(page)).toEqual(migrated);
      active = next.port; await page.reload(); await page.getByTestId("continue-run").click(); expect(await state(page)).toEqual(migrated);
      checks.push({ width, syntheticVersion1Migration: true, readableAfterRollback: true });
      await context.close();
    }
    if (errors.length) throw new Error(errors.join("; "));
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify({ previousBuild, candidateBuild, previousDeployment: provenance.deploymentId, previousExports: files, toolSources: Object.fromEntries(["scripts/release-rehearsal.ts"].map(file => [file, digest(readFileSync(file))])), checks, errors, completedAt: new Date().toISOString(), limitations: "Internal same-origin rehearsal on isolated production builds and fresh automated browser contexts. No live hosting rollback, real player storage, independent acceptance, or physical-device claim. Version 1 is synthetic; version 2 exports are native downloads from the recorded previous public release after importing internal directed states." }, null, 2));
    console.log(JSON.stringify({ checks: checks.length, previous: previousBuild.revision, candidate: candidateBuild.revision, errors }));
  } finally {
    await browser?.close(); if (proxy) await close(proxy);
    for (const child of children) child.kill("SIGTERM");
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
