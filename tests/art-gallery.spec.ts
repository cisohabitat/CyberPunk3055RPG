import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createCharacter } from "../lib/engine";
import { GALLERY_ART, GALLERY_PAGE_SIZE } from "../lib/art-gallery";
import { keyboardActivate } from "../qa/production/keyboard";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";

const run = createCharacter({ handle: "Gallery visitor", givenName: "Jo", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
const snapshot = (page: Page) => page.evaluate(() => ({ save: localStorage.getItem("saint-shard-3055-v1"), codex: localStorage.getItem("saint-shard-codex"), preferences: localStorage.getItem("saint-shard-preferences") }));
async function seed(page: Page, artwork = "full") {
  await page.addInitScript(({ run, artwork }) => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run));
    if (!localStorage.getItem("saint-shard-preferences")) localStorage.setItem("saint-shard-preferences", JSON.stringify({ artwork, sound: false, textStep: artwork === "none" ? 2 : 0 }));
  }, { run, artwork });
}

test("main-page gallery, search, portrait zoom, Escape and Back preserve the campaign", async ({ page }) => {
  await seed(page); await page.goto("/"); const before = await snapshot(page);
  await keyboardActivate(page, page.getByTestId("gallery-link")); await expect(page).toHaveURL(/\/artwork$/);
  await expect(page.getByRole("heading", { name: "Artwork gallery", exact: true })).toBeFocused();
  await keyboardActivate(page, page.getByRole("button", { name: "Open full gallery", exact: true }));
  await expect(page.getByTestId("gallery-grid").locator("img").first()).toBeInViewport();
  await page.getByLabel("Search artwork", { exact: true }).fill("Mara");
  await page.getByLabel("Artwork category").selectOption("Characters");
  const opener = page.locator('[data-art-src="/art/mara.jpg"]'); await keyboardActivate(page, opener);
  const dialog = page.getByRole("dialog"); await expect(dialog).toBeVisible();
  const image = dialog.getByRole("img"); await image.evaluate((img: HTMLImageElement) => img.decode());
  const dimensions = await image.boundingBox(); expect(dimensions!.height).toBeGreaterThan(dimensions!.width);
  expect(dimensions!.height).toBeLessThanOrEqual(await page.evaluate(() => innerHeight * .6 + 2));
  await keyboardActivate(page, dialog.getByRole("button", { name: "Zoom in", exact: true }));
  await expect(dialog.getByLabel("Artwork zoom")).toHaveText("150%");
  await page.keyboard.press("Escape"); await expect(dialog).toHaveCount(0); await expect(opener).toBeFocused();
  expect(await snapshot(page)).toEqual(before);
  await keyboardActivate(page, page.getByTestId("gallery-back")); await expect(page.getByTestId("continue-run")).toBeVisible();
  await page.goBack(); await expect(page.getByRole("button", { name: "Open full gallery", exact: true })).toBeVisible();
  expect(await snapshot(page)).toEqual(before);
});

for (const [width, artwork] of [[390, "full"], [1440, "full"], [320, "none"]] as const) test(`gallery at ${width}px/${artwork}: spoilers, preferences, accessibility and stable reading`, async ({ page }) => {
  await seed(page, artwork); await page.setViewportSize({ width, height: 900 });
  const artRequests: string[] = []; page.on("request", request => { if (new URL(request.url()).pathname.startsWith("/art/")) artRequests.push(request.url()); });
  await page.goto("/artwork"); await expect(page.getByRole("heading", { name: "Artwork gallery", exact: true })).toBeVisible();
  await expect(page).toHaveTitle("Artwork Gallery — Saint Shard");
  await expect(page.getByRole("heading", { name: "Contains story spoilers" })).toBeVisible();
  await expect(page.getByTestId("gallery-grid")).toHaveCount(0); expect(artRequests).toEqual([]);
  const before = await snapshot(page);
  await keyboardActivate(page, page.getByRole("button", { name: "Open full gallery", exact: true }));
  await expect(page.getByTestId("gallery-grid").locator("li")).toHaveCount(GALLERY_PAGE_SIZE);
  if (artwork === "none") { await expect(page.getByTestId("gallery-grid").locator("img")).toHaveCount(0); expect(artRequests).toEqual([]); }
  else { const first = page.getByTestId("gallery-grid").locator("img").first(); await first.evaluate((img: HTMLImageElement) => img.decode()); }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.getByLabel("Search artwork", { exact: true }).fill("no-such-picture");
  await expect(page.getByRole("status").filter({ hasText: "No artwork matches" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Next page", exact: true })).toBeDisabled();
  expect(await snapshot(page)).toEqual(before);
});

test("all primary entries are reachable through bounded pages with no skipped or repeated pictures", async ({ page }) => {
  await seed(page); await page.goto("/artwork"); await page.getByRole("button", { name: "Open full gallery", exact: true }).click();
  const before = await snapshot(page), found: string[] = [];
  for (let index = 0; index < Math.ceil(GALLERY_ART.length / GALLERY_PAGE_SIZE); index++) {
    const buttons = page.getByTestId("gallery-grid").locator("[data-art-src]");
    const batch = await buttons.evaluateAll(nodes => nodes.map(node => node.getAttribute("data-art-src")!));
    expect(batch.length).toBeLessThanOrEqual(GALLERY_PAGE_SIZE); found.push(...batch);
    if (found.length < GALLERY_ART.length) await page.getByRole("button", { name: "Next page", exact: true }).click();
  }
  expect(found).toEqual(GALLERY_ART.map(art => art.src));
  await expect(page.getByRole("button", { name: "Next page", exact: true })).toBeDisabled();
  await page.getByLabel("Search artwork", { exact: true }).fill("Mara");
  await expect(page.getByRole("button", { name: "Previous page", exact: true })).toBeDisabled();
  expect(await snapshot(page)).toEqual(before);
});

test("a missing thumbnail and full image leave descriptions and close/retry navigation usable", async ({ page }) => {
  await seed(page); await page.route("**/art/mara-account*.jpg", route => route.fulfill({ status: 404, body: "Unavailable" }));
  await page.goto("/artwork"); await page.getByRole("button", { name: "Open full gallery", exact: true }).click();
  const before = await snapshot(page); await page.getByLabel("Search artwork", { exact: true }).fill("conversation with a past");
  const opener = page.locator('[data-art-src="/art/mara-account.jpg"]'); await opener.scrollIntoViewIfNeeded();
  await expect(opener).toContainText("Image unavailable"); await opener.click();
  await expect(page.getByRole("dialog").locator(".art-unavailable")).toContainText("Mara listens");
  await page.keyboard.press("Escape"); await expect(opener).toBeFocused(); expect(await snapshot(page)).toEqual(before);
});

test("menu music keeps one source across the gallery and respects explicit Stop", async ({ page }) => {
  await page.addInitScript(installAudioReview, {}); await page.goto("/");
  await keyboardActivate(page, page.getByTestId("gallery-link"));
  const audio = () => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
  await expect.poll(async () => (await audio()).started.filter(file => file === "theme-title.flac").length).toBe(1);
  await page.getByRole("button", { name: "Open full gallery", exact: true }).click();
  await keyboardActivate(page, page.getByRole("button", { name: "Stop menu music", exact: true }));
  await expect.poll(async () => (await audio()).liveSources).toBe(0);
  await keyboardActivate(page, page.getByTestId("gallery-back")); await expect(page.getByTestId("title-screen")).toBeVisible();
  expect((await audio()).started.filter(file => file === "theme-title.flac")).toHaveLength(1);
  expect(await snapshot(page)).toEqual({ save: null, codex: null, preferences: null });
});
