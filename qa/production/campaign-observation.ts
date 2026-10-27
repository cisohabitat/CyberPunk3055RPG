/** Explicit QA observation over rendered play; never imported by the game. */
import type { Page } from "@playwright/test";
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
export async function observeCampaign(page: Page, sceneId: string, step: number, out: string) {
  const rendered = await page.evaluate(() => {
    const prose = document.querySelector<HTMLElement>('[data-testid="scene-text"]');
    const decisions = document.querySelector<HTMLElement>('#choices');
    const summaries = [...document.querySelectorAll<HTMLElement>('details > summary')].filter(node => node.getBoundingClientRect().height > 0);
    const panels = Object.fromEntries(['archive-planner','district-ledger','campaign-thread','technique-board'].map(id => [id, document.querySelectorAll(`[data-testid="${id}"]`).length]));
    const choices = [...document.querySelectorAll<HTMLButtonElement>('button[data-testid^="choice-"]')].map(node => ({id:node.dataset.testid,enabled:!node.disabled,text:node.innerText}));
    const text = prose?.innerText ?? '';
    return {text,words:text.match(/\S+/g)?.length??0,choices,panels,visibleSummaries:summaries.map(node=>node.innerText),decisionGapPx:prose&&decisions?Math.round(decisions.getBoundingClientRect().top-prose.getBoundingClientRect().bottom):null,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  let screenshot: string | undefined;
  if (['kerr_terms','kerr_terms_negotiate','kerr_terms_named','kerr_terms_bluff','kerr_terms_bluffed','kerr_terms_exposed','kerr_terms_retreat','act2_kerr_terms_owned','act2_kerr_door','act2_middle','act2_district_canal','act3_neighborhood','act3_arrival','ending_names','ending_quiet','ending_listed','ending_witness'].includes(sceneId)) {
    screenshot=out.replace(/\.json$/,'')+`-${step}-${sceneId}.png`;
    mkdirSync(dirname(screenshot),{recursive:true});
    await page.screenshot({path:screenshot,fullPage:true});
  }
  return {sceneId,step,...rendered,...(screenshot?{screenshot}:{})};
}
