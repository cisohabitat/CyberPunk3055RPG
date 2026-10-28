import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { replayCampaign, type ReplaySpec } from "../lib/story-replay";
import { endingPayoff } from "../lib/ending-payoff";
import { finaleCommitments } from "../lib/finale-commitments";
import { getScene, sceneText } from "../lib/engine";
import { visibleCampaignDialogue } from "../lib/campaign-dialogue";
import { keyboardActivate } from "../qa/production/keyboard";

const routes = ["finale-names-paused", "finale-names-consent-withdrawn", "finale-quiet-withdrawn", "finale-witness-corrected", "finale-listed-archive", "finale-listed-private"];
for (const route of routes) for (const [width, artwork] of [[390, "full"], [1440, "full"], [320, "none"]] as const) {
  test(`earned ending reflection and unfinished work: ${route} at ${width}px`, async ({ page }, info) => {
    const state = replayCampaign(JSON.parse(readFileSync(`qa/routes/${route}.json`, "utf8")) as ReplaySpec).state;
    const scene = getScene(state.sceneId), text = sceneText(scene, state), payoff = endingPayoff(state)!;
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(({ state, artwork }) => {
      localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
      localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", artwork, textStep: artwork === "none" ? 2 : 0, sound: false, motion: "reduce" }));
    }, { state, artwork });
    const images: string[] = []; page.on("request", r => { if (new URL(r.url()).pathname.startsWith("/art/")) images.push(r.url()); });
    await page.goto("/"); await page.getByTestId("continue-run").click();
    const saved = () => page.evaluate(() => ({ run: localStorage.getItem("saint-shard-3055-v1"), codex: localStorage.getItem("saint-shard-codex"), preferences: localStorage.getItem("saint-shard-preferences") }));
    const before = await saved(), echo = page.getByTestId("ending-payoff");
    await expect(echo.getByRole("heading")).toHaveText(payoff.title); await expect(echo.locator("p")).toHaveText(payoff.text);
    expect(await page.getByTestId("scene-text").locator("p").allTextContents()).toEqual(text.split(/\n\n+/));
    const priority = finaleCommitments(state)?.priority;
    if (priority) { await expect(page.getByTestId("finale-open-thread")).toContainText(priority.title); await expect(page.getByTestId("finale-open-thread")).toContainText(priority.status === "Open" ? "Still open when you left the wall." : priority.detail); }
    else await expect(page.getByTestId("finale-open-thread")).toHaveCount(0);
    await keyboardActivate(page, echo.getByRole("link", { name: "Review what remains", exact: true }));
    await expect(page.locator("#ending-facts")).toBeFocused(); await expect(page.locator("#ending-facts")).toBeInViewport();
    await expect(page.getByTestId("aftermath-details")).not.toHaveAttribute("open", "");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
    if (artwork === "none") { await expect(page.locator("img")).toHaveCount(0); expect(images).toEqual([]); }
    // Written afterword stays outside the exact, existing character transcript.
    const expectedLines = visibleCampaignDialogue(scene.id, scene.speaker, text).map(line => line.text);
    const transcript = page.getByTestId("voice-line").locator("details");
    await transcript.locator("summary").click();
    for (const line of expectedLines) await expect(transcript).toContainText(line);
    await expect(transcript).not.toContainText(payoff.text);
    expect(await saved()).toEqual(before);
    await page.reload(); await page.getByTestId("continue-run").click();
    await expect(page.getByTestId("ending-payoff").locator("p")).toHaveText(payoff.text); expect(await saved()).toEqual(before);
    if (route === "finale-witness-corrected") await page.screenshot({ path: info.outputPath(`ending-payoff-${width}.png`), fullPage: true });
    await page.getByRole("button", { name: "Title", exact: true }).click(); await expect(page.getByTestId("continue-run")).toBeVisible();
  });
}
