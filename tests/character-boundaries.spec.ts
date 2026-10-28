import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { keyboardActivate } from "../qa/production/keyboard";
import { voiceLevel } from "../lib/voice-level";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import { fixture, openRun, kerrRegisteredReceiptFixture } from "./fixtures/game";
import { observeBeds, bedReview } from "./fixtures/audio";

for (const [width, textOnly] of [[390, false], [1440, false], [320, true]] as const) test(`Kerr route draft, recorded roll and delayed receipt at ${width}px`, async ({ page }) => {
  // Allow the full route, accessibility scan and reloads; keep actions bounded.
  test.setTimeout(90_000); page.setDefaultTimeout(10_000); page.setDefaultNavigationTimeout(10_000);
  await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
  await page.addInitScript((none) => { Math.random = () => .75; localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", motion: "reduce", ...(none ? { artwork: "none", textStep: 2, contrast: "high" } : {}) })); }, textOnly);
  const artwork: string[] = []; page.on("request", r => { if(r.url().includes("/art/")) artwork.push(r.url()); });
  await openRun(page, fixture("act2_middle", { creds: 100, strain: 0, flags: { kerr_talked: true } }));
  for(const id of ["answer-kerr-collection", "promise-private-collection"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.getByTestId("goal")).toBeInViewport();
  if(textOnly) await expect(page.getByTestId("scene-illustration")).toHaveCount(0);
  else expect(await page.getByTestId("scene-illustration").locator("img").evaluate((img:HTMLImageElement) => img.decode().then(() => img.naturalWidth))).toBeGreaterThan(0);
  await page.getByTestId("choice-route-entry-lift").focus(); await page.keyboard.press("Enter");
  await page.reload({ waitUntil: "domcontentloaded" }); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("route-board")).toContainText("Coin lift · selected");
  await expect(page.getByTestId("creds")).toContainText("100");
  await page.getByTestId("choice-route-exit-gap").click();
  await expect(page.getByTestId("choice-depart-kerr-lift")).toContainText("-10 cr");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for(const id of ["depart-kerr-lift", "route-use-gap"]) await page.getByTestId(`choice-${id}`).click();
  await page.getByTestId("roll-button").click(); await page.reload({ waitUntil: "domcontentloaded" }); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("roll-button")).toHaveCount(0);
  await page.getByTestId("continue-check").click(); await page.getByTestId("choice-record-kerr-receipt").click();
  await expect(page.getByTestId("choice-answer-kerr-collection")).toHaveCount(0);
  for(const id of ["stand", "back-to-board", "to-the-wall", "to-ward-nine", "face-sera", "visit-kerr-collection", "acknowledge-private-collection", "ask-kerr-personal-question", "keep-kerr-personal-answer", "leave-wall"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.locator(".aftermath")).toContainText("Kerr received his closed brace case");
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.creds).toBe(90); expect(run.flags.kerr_route_trace).toBeUndefined(); expect(run.flags.kerr_question_done).toBe(true); expect(run.flags.order_verified).toBeUndefined();
  if(textOnly) expect(artwork).toEqual([]);
});

test("Kerr failed collection preserves registration and paid receipt through reload", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => .05; localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all" })); });
  await openRun(page, fixture("act2_middle", { creds: 20, strain: 0, stats: {chrome:1,face:1,ghost:1,nerve:1}, flags: { kerr_talked: true, kerr_sold_you: true } }));
  for(const id of ["answer-kerr-collection", "promise-private-collection", "route-entry-gate", "route-exit-gap"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.getByTestId("route-board")).toContainText("This entry breaks your private terms");
  for(const id of ["depart-kerr-foot", "route-use-gap"]) await page.getByTestId(`choice-${id}`).click();
  await page.getByTestId("roll-button").click(); await page.getByTestId("continue-check").click();
  await expect(page.getByTestId("choice-route-use-gap")).toHaveCount(0);
  await page.getByTestId("choice-fund-kerr-courier").click(); await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("creds")).toContainText("0"); await page.getByTestId("choice-record-kerr-receipt").click();
  const receipt = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(receipt).toEqual(kerrRegisteredReceiptFixture());
});

test("Kerr registered receipt preserves refusal of further contact through reload", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all" })));
  await openRun(page, kerrRegisteredReceiptFixture());
  for(const id of ["stand", "back-to-board", "to-the-wall", "to-ward-nine", "face-sera", "visit-kerr-collection", "answer-kerr-breach", "deny-kerr-disclosure"]) await page.getByTestId(`choice-${id}`).click();
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("choice-ask-kerr-personal-question")).toHaveCount(0);
  if (await page.getByTestId("sheet-toggle").isVisible()) await page.getByTestId("sheet-toggle").click();
  await expect(page.locator("#runner-sheet .cast")).toContainText("He sold your account to Helion");
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.flags.kerr_route_trace).toBe(true); expect(run.flags.kerr_route_denied).toBe(true); expect(run.flags.kerr_route_delivered).toBe(true);
});

for (const [width,textOnly] of [[390,false],[1440,false],[320,true]] as const) test(`present-day response refusals, private dispatch and finale at ${width}px`,async({page})=>{
 test.setTimeout(90_000);page.setDefaultTimeout(10_000);page.setDefaultNavigationTimeout(10_000);
 await page.setViewportSize({width,height:width<700?844:900});
 await page.addInitScript(none=>localStorage.setItem("saint-shard-preferences",JSON.stringify({reading:"all",motion:"reduce",...(none?{artwork:"none",textStep:2,contrast:"high"}:{})})),textOnly);
 const art:string[]=[];page.on("request",r=>{if(r.url().includes("/art/"))art.push(r.url())});
 await openRun(page,fixture("act2_middle",{creds:15,strain:0,flags:{heard_memo:true,met_mara:true}}));
 await page.getByTestId("choice-hear-mara-response").click();await expect(page.getByTestId("goal")).toBeInViewport();await expect(page.getByTestId("scene-text")).toContainText("her voice now");
 if(textOnly)await expect(page.getByTestId("scene-illustration")).toHaveCount(0);else expect(await page.getByTestId("scene-illustration").locator("img").evaluate((x:HTMLImageElement)=>x.decode().then(()=>x.naturalWidth))).toBeGreaterThan(0);
 for(const id of ["listen-response-terms","propose-public-response"])await page.getByTestId(`choice-${id}`).click();await page.reload({ waitUntil: "domcontentloaded" });await page.getByTestId("continue-run").click();
 await expect(page.getByTestId("scene-text")).toContainText("Not the board");await page.getByTestId("choice-revise-private-response").focus();await page.keyboard.press("Enter");
 expect((await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze()).violations).toEqual([]);
 for(const id of ["ask-mara-tomorrow","keep-mara-quiet-answer","defer-private-response","hear-mara-response","courier-private-response"])await page.getByTestId(`choice-${id}`).click();
 await page.reload({ waitUntil: "domcontentloaded" });await page.getByTestId("continue-run").click();await expect(page.getByTestId("creds")).toContainText("0");await expect(page.getByTestId("choice-courier-private-response")).toHaveCount(0);
 const dispatched=await page.evaluate(()=>JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));expect(dispatched.flags.response_received).toBeUndefined();expect(dispatched.flags.response_public_refused).toBe(true);
 for(const id of ["record-response-dispatch","stand","back-to-board","to-the-wall","to-ward-nine","face-sera","visit-mara-response","read-response-intake","finish-mara-response","visit-lumen-boundary","respect-lumen-boundary","leave-wall"])await page.getByTestId(`choice-${id}`).click();
 await expect(page.getByTestId("relationship-coda")).toContainText("Mara’s cup");await expect(page.locator(".aftermath")).toContainText("unanswered queue");expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const run=await page.evaluate(()=>JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));expect(run.flags.response_received).toBe(true);expect(run.flags.order_verified).toBeUndefined();expect(run.flags.nia_public_consent).toBeUndefined();if(textOnly)expect(art).toEqual([]);
});

for(const [scene,speaker] of [["act2_mara_quiet","Mara"],["act2_lumen_quiet","Sister Lumen"]]) test(`current quiet dialogue is explicit and stops on departure: ${speaker}`,async({page})=>{
 await page.addInitScript(()=>localStorage.setItem("saint-shard-preferences",JSON.stringify({reading:"all",sound:true,autoVoices:false})));
 await openRun(page,fixture(scene,{flags:{heard_memo:true,response_started:true,response_private_consent:true}}));
 const line=page.getByTestId("voice-line");await expect(line).toContainText("synthetic");await line.getByRole("button",{name:`Listen to ${speaker === "Sister Lumen" ? "Lumen" : speaker}`}).click();await expect(line).toContainText("Playing selected dialogue");
 await page.getByTestId(`choice-${speaker==="Mara"?"keep-mara-quiet-answer":"keep-lumen-quiet-answer"}`).click();await expect(line).toHaveCount(0);
});

test("recorded interview replay survives reload without becoming a live response", async ({page}) => {
 await page.addInitScript(()=>localStorage.setItem("saint-shard-preferences",JSON.stringify({reading:"all",sound:true,autoVoices:false})));
 await openRun(page,fixture("memory_cross_exam",{flags:{heard_memo:true,memory_signature:true,memory_order:true,memory_roster:true}}));
 await expect(page.getByTestId("scene-text")).toContainText("she cannot hear you now");
 await page.getByTestId("choice-ask-evacuation-assurance").click();
 await page.getByRole("button",{name:"Listen to Mara",exact:true}).click();
 await expect(page.getByTestId("voice-line")).toContainText("Playing selected dialogue");
 await page.getByTestId("choice-record-assurance-limit").click();await page.reload();await page.getByTestId("continue-run").click();
 await expect(page.getByTestId("scene-text")).toContainText("testimony, not an evacuation confirmation");
 for(const id of ["ask-command-contact","record-channel-limit","close-cross-exam","separate-decisions"])await page.getByTestId(`choice-${id}`).click();
 const run=await page.evaluate(()=>JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
 expect(run.flags.order_verified).toBeUndefined();expect(run.flags.response_started).toBeUndefined();expect(run.journal.filter((j:{id:string})=>j.id.startsWith("mara-")).every((j:{kind:string})=>j.kind==="claim")).toBe(true);
});

test("edited neighborhood return keeps choices and commitments through a narrow text-only reload", async ({page}) => {
 await page.setViewportSize({width:320,height:844});await page.addInitScript(()=>localStorage.setItem("saint-shard-preferences",JSON.stringify({reading:"all",artwork:"none",textStep:2,contrast:"high",motion:"reduce"})));
 const artwork:string[]=[];page.on("request",r=>{if(r.url().includes("/art/"))artwork.push(r.url())});
 await openRun(page,fixture("act3_neighborhood",{creds:0,flags:{memory_prepared:true,memory_intact:true,archive_custody:true}}));
 await page.getByTestId("choice-visit-records").click();await page.getByTestId("choice-keep-limits").click();await page.reload();await page.getByTestId("continue-run").click();
 await expect(page.getByTestId("goal")).toBeInViewport();await expect(page.getByTestId("choice-visit-records")).toHaveCount(0);await expect(page.getByTestId("choice-go-wall")).toBeEnabled();
 expect((await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze()).violations).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(artwork).toEqual([]);
 const run=await page.evaluate(()=>JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));expect(run.creds).toBe(0);expect(run.flags.visited_records).toBe(true);expect(run.flags.order_verified).toBeUndefined();expect(run.flags.witness_safe).toBeUndefined();
});

for (const action of ["read-names", "leave-wall", "let-ives", "say-anyway"]) test(`memorial scope survives a keyboard finale and reload: ${action}`, async ({page}) => {
  await page.setViewportSize({width:320,height:844});
  await page.addInitScript(() => { Math.random=()=>.05;localStorage.setItem("saint-shard-preferences",JSON.stringify({reading:"all",artwork:"none",textStep:2,contrast:"high",motion:"reduce"})); });
  const run=fixture("act3_arrival",{flags:{heard_memo:true,on_file:true,act2_deal:true,testimony_done:true,testimony_withdrawn:true,nia_public_consent:true,witness_safe:true},journal:[{id:"ward-nine",text:"The memorial names.",kind:"fact"},{id:"nia-account",text:"An approved recording under private terms.",kind:"fact"}]});
  await openRun(page,run);
  await keyboardActivate(page,page.getByTestId(`choice-${action}`));
  if(action==="say-anyway"){
    await keyboardActivate(page,page.getByTestId("roll-button"));
    await expect(page.getByTestId("continue-check")).toBeVisible();await page.reload();await page.getByTestId("continue-run").click();
    await keyboardActivate(page,page.getByTestId("continue-check"));
  }
  await page.reload();await page.getByTestId("continue-run").click();
  const details=page.getByTestId("aftermath-details");await keyboardActivate(page,details.locator("summary"));
  await expect(details).toContainText("withdrew the hearing draft");await expect(details).not.toContainText("Neighbors have a public account");
  if(action.includes("ives")||action==="say-anyway"){
    await expect(page.getByTestId("scene-text")).toContainText("private witness ledger stays");
    await expect(page.getByTestId("scene-text")).toContainText("recording stays outside public circulation");
  }
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(saved.flags.testimony_published).toBeUndefined();expect(saved.flags.nia_public_consent).toBe(true);expect(saved.flags.archive_key_authenticated).toBeUndefined();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect((await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze()).violations).toEqual([]);
});

for(const [action,creds,width,none] of [["stay-with-mara-courier",15,390,false],["carry-reply-leave-mara",0,1440,false],["stay-with-mara-wait",0,320,true],["decline-mara-company",0,390,true]] as const) test(`Mara window choice retains company and dispatch through keyboard reload: ${action}`,async({page},testInfo)=>{
 await page.setViewportSize({width,height:844});
 await page.addInitScript(none=>localStorage.setItem("saint-shard-preferences",JSON.stringify({reading:"all",artwork:none?"none":"full",textStep:2,contrast:"high",motion:"reduce"})),none);
 const art:string[]=[];page.on("request",r=>{if(r.url().includes("/art/"))art.push(r.url())});
 await openRun(page,fixture("act2_mara_company",{creds,strain:2,flags:{heard_memo:true,response_started:true,response_private_consent:true,mara_quiet_heard:true,response_question_done:true}}));
 await expect(page.getByTestId("goal")).toBeInViewport();
 if(none)await expect(page.getByTestId("scene-illustration")).toHaveCount(0);else {
  const image=page.getByTestId("scene-illustration").locator("img");expect(await image.evaluate((img:HTMLImageElement)=>img.decode().then(()=>img.naturalWidth))).toBeGreaterThan(0);
  await page.screenshot({path:testInfo.outputPath("mara-window-choice.png"),fullPage:true});
 }
 if(!creds)await expect(page.getByTestId("choice-stay-with-mara-courier")).toBeDisabled();
 await keyboardActivate(page,page.getByTestId(`choice-${action}`));await page.reload();await keyboardActivate(page,page.getByTestId("continue-run"));
 let state=await page.evaluate(()=>JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));expect(state.creds).toBe(action==="stay-with-mara-courier"?0:creds);expect(state.strain).toBe(action==="carry-reply-leave-mara"?3:2);
 if(action.startsWith("stay-")){
  await expect(page.getByTestId("scene-text")).toContainText("cup");await keyboardActivate(page,page.getByTestId("choice-keep-mara-shared-hour"));
  if(action==="stay-with-mara-wait"){
   state=await page.evaluate(()=>JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));expect(state.flags.response_sent).toBeUndefined();
   await keyboardActivate(page,page.getByTestId("choice-hear-mara-response"));await expect(page.getByTestId("choice-courier-private-response")).toBeDisabled();await keyboardActivate(page,page.getByTestId("choice-walk-private-response"));await expect(page.getByTestId("scene-text")).toContainText("next intake batch");
  }
 }else if(action==="decline-mara-company")await keyboardActivate(page,page.getByTestId("choice-walk-private-response"));
 await keyboardActivate(page,page.getByTestId("choice-record-response-dispatch"));
 await page.reload();await keyboardActivate(page,page.getByTestId("continue-run"));await expect(page.getByTestId("choice-hear-mara-response")).toHaveCount(0);
 state=await page.evaluate(()=>JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));expect(state.flags.response_sent).toBe(true);expect(state.flags.response_received).toBeUndefined();expect(state.flags.order_verified).toBeUndefined();expect(state.flags.nia_public_consent).toBeUndefined();expect(state.flags.mara_company_kept).toBe(action.startsWith("stay-")?true:undefined);
 const detail=(await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze());expect(detail.violations).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);if(none)expect(art).toEqual([]);
});

test("Mara company keeps quiet music and clinic ambience continuous without voice autoplay",async({page})=>{
 await observeBeds(page);const voices:string[]=[];page.on("request",r=>{if(r.url().includes("/audio/voice-"))voices.push(r.url())});
 await openRun(page,fixture("act2_mara_company",{creds:15,flags:{heard_memo:true,response_started:true,response_private_consent:true,mara_quiet_heard:true,response_question_done:true}}));
 await expect.poll(async()=>(await bedReview(page)).started).toContain("theme-quiet.flac");await expect.poll(async()=>(await bedReview(page)).started).toContain("ambience-clinic.flac");
 await keyboardActivate(page,page.getByTestId("choice-stay-with-mara-courier"));await keyboardActivate(page,page.getByTestId("choice-keep-mara-shared-hour"));
 const played=(await bedReview(page)).started;expect(played.filter(n=>n==="theme-quiet.flac")).toHaveLength(1);expect(played.filter(n=>n==="ambience-clinic.flac")).toHaveLength(1);expect(voices).toEqual([]);
 const state=await page.evaluate(()=>JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));expect(state.creds).toBe(0);expect(state.flags.mara_company_kept).toBe(true);expect(state.flags.response_received).toBeUndefined();
});

test("campaign mastering applies native per-clip gain without changing the saved voice slider or source state", async ({ page }) => {
  await page.addInitScript({ content: `var __name = (fn, name) => Object.defineProperty(fn, "name", { value: name, configurable: true }); (${installAudioReview.toString()})();` });
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: true, autoVoices: false, voices: 37, music: 60, ambience: 50, reading: "all", motion: "reduce" })));
  await openRun(page, fixture("act3_testimony_hearing", { flags: { testimony_bounded: true } }));
  const before = await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
  await page.getByRole("button", { name: "Listen to Ives", exact: true }).click();
  const audio = () => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
  await expect.poll(async () => (await audio()).voiceLevels.length).toBe(1);
  const entry = (await audio()).voiceLevels[0];
  expect(entry.file).toBe("voice-campaign-ives-hearing-challenge-performance.mp3");
  expect(entry.gain).toBeCloseTo(voiceLevel("voice-campaign-ives-hearing-challenge-performance"), 6);
  await expect(page.locator("img.portrait")).toHaveAttribute("src", "/art/ives-questioning.jpg");
  await expect(page.getByTestId("spoken-quote")).toContainText("A maintenance signature isn't an issuing key.");
  await page.getByRole("button", { name: "Stop line", exact: true }).click();
  await expect(page.getByTestId("spoken-quote")).toHaveCount(0);
  const prefs = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-preferences")!));
  expect(prefs.voices).toBe(37); expect(prefs.music).toBe(60); expect(prefs.ambience).toBe(50);
  expect(await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"))).toBe(before);
});

for (const textOnly of [false, true]) test(`Ives source challenge keeps precise scene art and readable goals with ${textOnly ? "text-only" : "full art"}`, async ({ page }) => {
  await page.addInitScript(none => localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, reading: "all", motion: "reduce", artwork: none ? "none" : "full" })), textOnly);
  const requests: string[] = []; page.on("request", request => { if (new URL(request.url()).pathname.startsWith("/art/")) requests.push(request.url()); });
  await openRun(page, fixture("act3_testimony_hearing", { flags: { testimony_bounded: true } }));
  await expect(page.getByTestId("scene-text")).toContainText("A witness isn't a server.");
  await expect(page.getByTestId("goal")).toBeInViewport();
  if (textOnly) { await expect(page.locator("img.portrait")).toHaveCount(0); expect(requests).toEqual([]); }
  else {
    await expect(page.locator("img.portrait")).toHaveAttribute("src", "/art/ives-questioning.jpg");
    const scene = page.locator('img[src="/art/ives-hearing.jpg"]');
    await expect(scene).toHaveCount(1);
    expect(await scene.evaluate((image: HTMLImageElement) => image.decode().then(() => image.naturalWidth))).toBeGreaterThan(0);
  }
  await page.getByTestId("choice-answer-open-question").click();
  await expect(page.getByTestId("scene-text")).toContainText("Sera");
  if (!textOnly) await expect(page.locator('img[src="/art/sera-hearing.jpg"]')).toHaveCount(1);
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.flags.testimony_answered).toBe(true); expect(run.flags.archive_key_authenticated).toBeUndefined(); expect(run.flags.testimony_published).toBeUndefined();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
