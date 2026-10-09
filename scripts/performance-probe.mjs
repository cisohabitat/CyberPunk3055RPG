import { chromium } from "playwright";
import { mkdirSync,readFileSync,writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const base=process.argv[2]; if(!base||!/^https?:\/\//.test(base)) throw new Error("Supply a running production URL: npm run production:probe -- http://127.0.0.1:3116");
const browser=await chromium.launch({...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{}),args:["--no-sandbox"]});
const samples=[];const initialTransferBudget=JSON.parse(readFileSync("qa/production/budgets.json","utf8")).initialTransferBytes;if(!Number.isSafeInteger(initialTransferBudget)||initialTransferBudget<=0)throw new Error("Invalid initial transfer budget");
try {
  for(const width of [390,1440]) for(const artwork of ["full","none"]) {
    const context=await browser.newContext({viewport:{width,height:width===390?844:900},reducedMotion:"reduce"}); const page=await context.newPage();
    await page.addInitScript(mode=>{
      localStorage.setItem("saint-shard-preferences",JSON.stringify({artwork:mode,motion:"reduce"}));
      window.__probeLcp=0;window.__probeCls=0;
      new PerformanceObserver(list=>{for(const entry of list.getEntries())window.__probeLcp=entry.startTime;}).observe({type:"largest-contentful-paint",buffered:true});
      new PerformanceObserver(list=>{for(const entry of list.getEntries())if(!entry.hadRecentInput)window.__probeCls+=entry.value;}).observe({type:"layout-shift",buffered:true});
    },artwork);
    if(width===390){const session=await context.newCDPSession(page);await session.send("Network.enable");await session.send("Network.emulateNetworkConditions",{offline:false,latency:150,downloadThroughput:625000,uploadThroughput:625000});}
    const requests=[];page.on("request",request=>requests.push(request.url()));
    const begun=Date.now();await page.goto(base,{waitUntil:"networkidle"}); await page.evaluate(()=>document.fonts.ready);
    await page.getByTestId("new-run").click();await page.getByTestId("handle-input").fill("Probe");await page.getByTestId("complication-debt").click();await page.getByTestId("plus-chrome").click();await page.getByTestId("plus-nerve").click();const artworkReady=artwork==="full"?Promise.all([page.waitForResponse(r=>r.url().endsWith("/art/stall.jpg"))]):Promise.resolve([]);await page.getByTestId("start-run").click();
    await page.getByTestId("goal").waitFor();const goalReadyMs=Date.now()-begun;const artResponses=await artworkReady;await Promise.all(artResponses.map(response=>response.finished()));if(artwork==="full")await page.locator("img.portrait").evaluate(img=>img.decode());await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const metrics=await page.evaluate(()=>({encodedResourceBytes:performance.getEntriesByType("resource").reduce((sum,entry)=>sum+entry.encodedBodySize,0),htmlBytes:performance.getEntriesByType("navigation")[0]?.encodedBodySize??0,titleLcpMs:window.__probeLcp,layoutShift:window.__probeCls,overflow:document.documentElement.scrollWidth>innerWidth}));
    const goal=await page.getByTestId("goal").boundingBox();
    samples.push({sceneId:await page.evaluate(()=>JSON.parse(localStorage.getItem("saint-shard-3055-v1")).sceneId),width,height:width===390?844:900,artwork,goalReadyMs,network:width===390?"Emulated 5 Mbps / 150 ms":"Unthrottled automation host",elapsedToReadyMs:Date.now()-begun,...metrics,artworkRequests:requests.filter(url=>url.includes("/art/")).length,goalVisible:goal.y+goal.height<=(width===390?844:900)});
    await page.screenshot({path:`/tmp/production-probe-${width}-${artwork}.png`,fullPage:true});await context.close();
  }
}finally{await browser.close();}
mkdirSync("qa/production/reports",{recursive:true});const report={revision:execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),dirty:Boolean(execFileSync("git",["status","--porcelain"],{encoding:"utf8"}).trim()),initialTransferBudget,samples,limitations:["Four synthetic samples on the automation host, not p75/p95 field data or named physical devices.","Elapsed-to-ready includes automated form entry and network-idle waits; it is not LCP or INP.","titleLcpMs measures this navigation's title screen. Encoded resource bytes are Resource Timing measurements, not all wire overhead."]};
writeFileSync("qa/production/reports/performance-probe.json",JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify(report));
if(samples.some(sample=>sample.encodedResourceBytes+sample.htmlBytes>initialTransferBudget||sample.overflow||!sample.goalVisible||(sample.artwork==="none"&&sample.artworkRequests!==0)))process.exitCode=1;
