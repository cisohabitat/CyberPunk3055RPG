import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import AxeBuilder from '@axe-core/playwright';
import baseline from '../qa/editorial/navigation-release-layout-baseline.json';
import { keyboardActivate } from '../qa/production/keyboard';
import type { GameState } from '../lib/types';
import { FIELD_KITS } from '../lib/loadout';
import { commitChoice, getScene, presentChoices } from '../lib/engine';

const precedingCSS = readFileSync('qa/editorial/navigation-release-preceding.css', 'utf8');
test.beforeAll(() => {
  expect(createHash('sha256').update(precedingCSS).digest('hex')).toBe('c22dc0801c22176cbf71560d36819adb3588ae6162e8539236bf677203fe91dc');
  expect(createHash('sha256').update(readFileSync('qa/editorial/navigation-release-layout-baseline.json')).digest('hex')).toBe('f355f0ad676d77fde8812efb85156b6b94cd8476d508646aea6e605330250c08');
});

function measureWorkshop(root: HTMLElement) {
    const bottom = root.querySelector('[data-testid="scene-text"]')!.getBoundingClientRect().bottom;
    const controls = [...root.querySelectorAll<HTMLElement>('button,a,summary,input,select')].filter(n => n.getBoundingClientRect().height > 0);
    return {
      text: (root as HTMLElement).innerText,
      controls: controls.map(n => ({ tag: n.tagName, id: n.dataset.testid || n.id, text: n.innerText, disabled: n.hasAttribute('disabled') })),
      actions: controls.filter(n => n.dataset.testid?.startsWith('choice-')).map(n => ({ id: n.dataset.testid, gap: n.getBoundingClientRect().top - bottom, height: n.getBoundingClientRect().height, disabled: n.hasAttribute('disabled') })),
      typography: [...root.querySelectorAll<HTMLElement>('p,dt,h2,h3,button,summary')].filter(n => n.getBoundingClientRect().height > 0).map(n => ({ text: n.innerText, tag: n.tagName, font: getComputedStyle(n).fontSize, line: getComputedStyle(n).lineHeight })),
      reviewExitPx: root.querySelector('[data-testid="review-workshop-exit"]')!.getBoundingClientRect().top - bottom,
      overflow: document.documentElement.scrollWidth > innerWidth,
    };
}

for (const row of baseline.rows) test(`workshop comparison keeps complete terms with less real travel: ${row.width}/${row.creds}`, async ({ page }, info) => {
  await page.setViewportSize({ width: row.width, height: 900 });
  await page.addInitScript(state => {
    if (!localStorage.getItem('saint-shard-3055-v1')) localStorage.setItem('saint-shard-3055-v1', JSON.stringify(state));
    localStorage.setItem('saint-shard-preferences', JSON.stringify({ sound: false, reading: 'all', artwork: 'none', textStep: 2, contrast: 'high', motion: 'reduce' }));
  }, row.state);
  await page.goto('/'); await page.getByTestId('continue-run').click(); await page.evaluate(() => document.fonts.ready);
  const saved = () => page.evaluate(() => localStorage.getItem('saint-shard-3055-v1'));
  const before = await saved();
  const scene = page.getByTestId('scene');
  const metrics = await scene.evaluate(measureWorkshop);
  // Independent808b196 stylesheet, measured by this exact browser/font engine.
  // Keep the separate font stylesheet loaded; replace the complete global one.
  const preceding = await page.evaluateHandle(css => {
    const sheets = [...document.styleSheets].filter(sheet => [...sheet.cssRules].some(rule => rule.cssText.includes('.kit-shop')));
    if (sheets.length !== 1) throw new Error(`Expected one global stylesheet, found${sheets.length}`);
    const style = document.createElement('style'); style.textContent = css;
    sheets.forEach(sheet => { sheet.disabled = true; }); document.head.append(style);
    return { sheets, style };
  }, precedingCSS);
  let previous: Awaited<ReturnType<typeof measureWorkshop>>;
  try {
    await page.evaluate(() => document.fonts.ready);
    previous = await scene.evaluate(measureWorkshop);
  } finally {
    await preceding.evaluate(({ sheets, style }) => { style.remove(); sheets.forEach(sheet => { sheet.disabled = false; }); });
    await preceding.dispose();
  }
  await page.evaluate(() => document.fonts.ready);
  expect(metrics.text).toBe(previous.text);
  expect(metrics.controls).toEqual(previous.controls);
  expect(metrics.typography).toEqual(previous.typography);
  expect(metrics.text).toBe(row.metrics.text);
  expect(metrics.controls).toEqual(row.metrics.controls);
  // Baseline was captured in Chromium; native font serialization is checked in
  // that engine. Every engine retains the exact same DOM/style font rules.
  if (info.project.name === 'chromium') expect(metrics.typography).toEqual(row.metrics.typography);
  expect(metrics.overflow).toBe(false);
  const exit = metrics.actions.find(a => a.id === 'choice-leave-workshop')!;
  const oldExit = previous.actions.find(a => a.id === 'choice-leave-workshop')!;
  // The8% budget and no-increase checks now run in all four native projects.
  {
    expect(exit.gap).toBeLessThanOrEqual(oldExit.gap * .92);
    expect(metrics.reviewExitPx).toBeLessThanOrEqual(previous.reviewExitPx);
    for (const action of metrics.actions) expect(action.gap).toBeLessThanOrEqual(previous.actions.find(a => a.id === action.id)!.gap);
  }
  for (const action of metrics.actions) if (!action.disabled) expect(action.height).toBeGreaterThanOrEqual(44);
  await expect(page.getByTestId('goal')).toBeInViewport();
  // Original controls, native tab order and actual same keyboard helper:
  // no new Tab stops, duplicated commits, hidden terms or gesture interceptor.
  for (const kit of FIELD_KITS) {
    const review = page.getByTestId(`review-purchase-${kit.id}`), purchase = page.getByTestId(`choice-buy-${kit.id}`);
    if (await review.isEnabled()) {
      await keyboardActivate(page, review); await expect(purchase).toBeFocused(); await expect(purchase.locator('.label')).toBeInViewport();
      expect(await saved()).toBe(before);
    } else await expect(purchase).toBeDisabled();
  }
  await keyboardActivate(page, page.getByTestId('review-workshop-exit'));
  await expect(page.getByTestId('choice-leave-workshop')).toBeFocused();
  expect(await saved()).toBe(before);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const choice = presentChoices(row.state as GameState, getScene(row.state.sceneId)).find(c => c.enabled && c.id.startsWith('buy-')) ?? presentChoices(row.state as GameState, getScene(row.state.sceneId)).find(c => c.id === 'leave-workshop')!;
  await keyboardActivate(page, page.getByTestId(`choice-${choice.id}`));
  const expected = commitChoice(row.state as GameState, choice).state;
  await expect.poll(async () => JSON.parse((await saved())!)).toEqual(expected);
  await page.reload(); await page.getByTestId('continue-run').click(); expect(JSON.parse((await saved())!)).toEqual(expected);
  await info.attach('workshop-task', { body: JSON.stringify({ independentCapture: row.metrics, precedingSameEngine: previous, current: metrics }), contentType: 'application/json' });
});

for (const row of baseline.rows.filter(r => r.creds === 275)) test(`workshop native odds inspections preserve save and normal scroll at${row.width}px`, async ({ page }) => {
  await page.setViewportSize({ width: row.width, height: 900 });
  await page.addInitScript(state => {
    localStorage.setItem('saint-shard-3055-v1', JSON.stringify(state));
    localStorage.setItem('saint-shard-preferences', JSON.stringify({ sound: false, reading: 'all', artwork: 'none', textStep: 2, contrast: 'high', motion: 'reduce' }));
  }, row.state);
  await page.goto('/'); await page.getByTestId('continue-run').click();
  const before = await page.evaluate(() => localStorage.getItem('saint-shard-3055-v1'));
  for (const kit of FIELD_KITS) {
    const panel = page.getByTestId(`kit-odds-${kit.id}`);
    await keyboardActivate(page, panel.locator('summary')); await expect(panel).toHaveAttribute('open', '');
    await expect(panel.locator('ul')).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('saint-shard-3055-v1'))).toBe(before);
    await keyboardActivate(page, panel.locator('summary'));
  }
  const end = await page.evaluate(() => { scrollTo(0, document.documentElement.scrollHeight); return scrollY; });
  expect(end).toBeGreaterThan(900);
  await page.evaluate(() => scrollTo(0, 0)); expect(await page.evaluate(() => scrollY)).toBe(0);
  expect(await page.evaluate(() => localStorage.getItem('saint-shard-3055-v1'))).toBe(before);
});
