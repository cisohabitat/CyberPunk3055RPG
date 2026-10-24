import { test, expect, type Page } from "@playwright/test";
import { createCharacter } from "../lib/engine";
import { exportRun, importRun } from "../lib/vault";

const state = () => createCharacter({ handle: "Security", givenName: "Ada", origin: "gutterwire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });

test("production headers protect documents and keep local art, fonts and compressed audio usable", async ({ page, request }) => {
  expect((await request.get("/_next/image?url=%2Ficon.svg&w=64&q=75")).status()).toBe(404);
  for (const path of ["/", "/guide", "/icon.svg", "/audio/theme-title.flac", "/audio/theme-chapel.flac"]) {
    const response = await request.get(path);
    expect(response.ok()).toBe(true);
    const headers = response.headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("no-referrer");
    expect(headers["permissions-policy"]).toContain("microphone=()");
    expect(headers["x-powered-by"]).toBeUndefined();
    const policy = headers["content-security-policy"];
    for (const directive of ["object-src 'none'", "base-uri 'none'", "frame-ancestors 'none'", "connect-src 'self'", "form-action 'self'"]) expect(policy).toContain(directive);
    if (path.endsWith(".flac")) {
      expect(headers["content-type"]).toMatch(/^audio\/(?:x-)?flac$/);
      if (path.endsWith("theme-chapel.flac")) expect(headers["content-encoding"]).toBe("gzip");
      expect((await response.body()).subarray(0, 4).toString()).toBe("fLaC");
    }
  }
  await page.addInitScript(() => {
    (window as unknown as { policyViolations: string[] }).policyViolations = [];
    document.addEventListener("securitypolicyviolation", event => {
      (window as unknown as { policyViolations: string[] }).policyViolations.push(`${event.effectiveDirective}: ${event.blockedURI}`);
    });
  });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByTestId("new-run")).toBeVisible();
  await expect.poll(() => page.locator(".title-card img").first().evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.getByTestId("guide-link").click();
  await expect(page).toHaveURL(/\/guide$/);
  await expect(page.getByTestId("guide-back")).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.fonts.status)).toBe("loaded");
  expect(await page.evaluate(() => (window as unknown as { policyViolations: string[] }).policyViolations)).toEqual([]);
  expect(errors).toEqual([]);
});

test("imported reserved journal ids and HTML remain text through play, reload and export", async ({ page }) => {
  const payload = "<img src=x onerror=alert(1)>";
  const imported = { ...state(), handle: payload, givenName: "<script>alert(1)</script>", journal: [
    { id: "__proto__", text: payload },
    { id: "constructor", text: "A second harmless imported note" },
  ] };
  const errors: string[] = [];
  const dialogs: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("dialog", async dialog => { dialogs.push(dialog.message()); await dialog.dismiss(); });
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, reading: "all", motion: "reduce" })));
  await page.goto("/");
  await page.getByRole("button", { name: "Saves", exact: true }).click();
  await page.getByLabel("Import a saved run").setInputFiles({ name: "imported.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(imported)) });
  await expect(page.getByTestId("choice-ask-pay")).toBeVisible();
  if (page.viewportSize()!.width <= 1100) await page.getByTestId("sheet-toggle").click();
  await page.getByRole("tab", { name: "journal", exact: true }).click();
  await expect(page.locator("#panel-journal")).toContainText(payload);
  await expect(page.locator("#panel-journal img, #panel-journal script")).toHaveCount(0);
  await expect(page.getByTestId("sheet").locator("h2")).toHaveText(payload);
  if (page.viewportSize()!.width <= 1100) await page.keyboard.press("Escape");
  await page.reload();
  await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("choice-ask-pay")).toBeVisible();
  await page.getByRole("button", { name: "Saves", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export run", exact: true }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream!) chunks.push(chunk);
  expect(importRun(Buffer.concat(chunks).toString())).toEqual(imported);
  expect(dialogs).toEqual([]);
  expect(errors).toEqual([]);
});

test("invalid and oversized imports preserve the active run and manual slot", async ({ page }) => {
  const initial = state();
  await page.addInitScript(value => {
    localStorage.setItem("saint-shard-3055-v1", value);
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false }));
  }, JSON.stringify(initial));
  await page.goto("/");
  await page.getByTestId("continue-run").click();
  await page.getByRole("button", { name: "Saves", exact: true }).click();
  await page.getByRole("button", { name: "Save to slot 1", exact: true }).click();
  const before = await page.evaluate(() => [localStorage.getItem("saint-shard-3055-v1"), localStorage.getItem("saint-shard-slot-1")]);
  for (const [content, message] of [
    ['{"format":"saint-shard-save","schema":1}', "integrity check"],
    [JSON.stringify({ ...initial, sceneId: "__proto__" }), "supported"],
    [JSON.stringify({ ...initial, journal: Array(50_000).fill("legacy") }), "too complex"],
    [JSON.stringify(initial).slice(0, -1) + ',"extra":' + "[".repeat(12_000) + "0" + "]".repeat(12_000) + "}", "too complex"],
    [" ".repeat(1_048_577), "under 1 MB"],
  ]) {
    await page.getByLabel("Import a saved run").setInputFiles({ name: "invalid.json", mimeType: "application/json", buffer: Buffer.from(content) });
    await expect(page.getByRole("dialog").getByRole("status")).toContainText(message);
    expect(await page.evaluate(() => [localStorage.getItem("saint-shard-3055-v1"), localStorage.getItem("saint-shard-slot-1")])).toEqual(before);
    await expect(page.getByRole("button", { name: "Confirm load", exact: true })).toHaveCount(0);
  }
});

test("rejecting a new import clears the previous file's load confirmation", async ({ page }) => {
  await page.addInitScript(value => {
    localStorage.setItem("saint-shard-3055-v1", value);
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false }));
  }, JSON.stringify(state()));
  await page.goto("/");
  await page.getByTestId("continue-run").click();
  await page.getByRole("button", { name: "Saves", exact: true }).click();
  const input = page.getByLabel("Import a saved run");
  const before = await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
  for (const buffer of [Buffer.from("invalid JSON"), Buffer.alloc(1_048_577, " ")]) {
    await input.setInputFiles({ name: "valid.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ ...state(), sceneId: "pay" })) });
    await expect(page.getByRole("button", { name: "Confirm load", exact: true })).toBeVisible();
    await input.setInputFiles({ name: "rejected.json", mimeType: "application/json", buffer });
    await expect(page.getByRole("dialog").getByRole("status")).toContainText(/not valid JSON|under 1 MB/);
    await expect(page.getByRole("button", { name: "Confirm load", exact: true })).toHaveCount(0);
  }
  expect(await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"))).toBe(before);
});

async function delayImport(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false }));
    const original = File.prototype.text;
    File.prototype.text = async function () {
      const text = await original.call(this);
      if (this.name === "slow.json") await new Promise<void>(resolve => {
        (window as unknown as { releaseImport: () => void }).releaseImport = resolve;
      });
      return text;
    };
  });
}

async function releaseImport(page: Page) {
  await page.evaluate(async () => {
    (window as unknown as { releaseImport: () => void }).releaseImport();
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}

test("an older slow file cannot replace the latest selected import", async ({ page }) => {
  await delayImport(page);
  await page.addInitScript(value => localStorage.setItem("saint-shard-3055-v1", value), JSON.stringify(state()));
  await page.goto("/");
  await page.getByTestId("continue-run").click();
  await page.getByRole("button", { name: "Saves", exact: true }).click();
  const input = page.getByLabel("Import a saved run");
  await input.setInputFiles({ name: "slow.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ ...state(), handle: "Older file" })) });
  await page.waitForFunction(() => typeof (window as unknown as { releaseImport?: () => void }).releaseImport === "function");
  await input.setInputFiles({ name: "latest.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ ...state(), handle: "Latest file" })) });
  await expect(page.getByRole("button", { name: "Confirm load", exact: true })).toBeVisible();
  await releaseImport(page);
  await page.getByRole("button", { name: "Confirm load", exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!).handle)).toBe("Latest file");
});

test("closing saves cancels a pending import instead of starting a run later", async ({ page }) => {
  await delayImport(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Saves", exact: true }).click();
  await page.getByLabel("Import a saved run").setInputFiles({ name: "slow.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(state())) });
  await page.waitForFunction(() => typeof (window as unknown as { releaseImport?: () => void }).releaseImport === "function");
  await page.getByRole("button", { name: "Close saves", exact: true }).click();
  await releaseImport(page);
  await expect(page.getByTestId("new-run")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"))).toBeNull();
});

test("choosing a manual slot cancels an older pending file import", async ({ page }) => {
  await delayImport(page);
  await page.addInitScript(({ run, slot }) => {
    localStorage.setItem("saint-shard-3055-v1", run);
    localStorage.setItem("saint-shard-slot-1", slot);
  }, { run: JSON.stringify(state()), slot: exportRun({ ...state(), handle: "Manual slot" }) });
  await page.goto("/");
  await page.getByTestId("continue-run").click();
  await page.getByRole("button", { name: "Saves", exact: true }).click();
  await page.getByLabel("Import a saved run").setInputFiles({ name: "slow.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ ...state(), handle: "Older file" })) });
  await page.waitForFunction(() => typeof (window as unknown as { releaseImport?: () => void }).releaseImport === "function");
  await page.getByRole("button", { name: "Load slot 1", exact: true }).click();
  await releaseImport(page);
  await page.getByRole("button", { name: "Confirm load", exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!).handle)).toBe("Manual slot");
});
