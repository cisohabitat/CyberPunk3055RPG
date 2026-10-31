/** Offline public-layout review. Run from the repository root with node --import tsx.
 * Legal checkpoints, enlarged type, exact save checks and axe. No game mutations.
 */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
async function main() {
  const root=process.cwd(), require=createRequire(resolve(root,'package.json'));
  const {chromium,expect}=require('@playwright/test');
  const axe=require('@axe-core/playwright'), AxeBuilder=axe.default??axe;
  const checkpointModule=await import(pathToFileURL(resolve(root,'qa/production/route-checkpoint.ts')).href);
  const routeCheckpoint=checkpointModule.routeCheckpoint??checkpointModule.default?.routeCheckpoint;
  const baseline=JSON.parse(readFileSync('qa/editorial/decision-flow-baseline.json','utf8'));
  const dir=resolve(process.argv[2]??'/tmp/saint-shard-craft-review');if(existsSync(dir+'/review.json'))throw new Error('Choose a fresh output directory to preserve earlier evidence');mkdirSync(dir,{recursive:true});
  const url=process.argv[3]??'https://cyberpunk3055rpg.vercel.app';const target=new URL(url);if(!['http:','https:'].includes(target.protocol)||target.username||target.password)throw new Error('Use an HTTP(S) game URL without embedded credentials');
  const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  if(!executablePath)throw new Error('Explicit reviewed Chromium executable required');
  const revision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  const dirty=Boolean(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim());
  const cases=baseline.rows.map((r:any)=>({id:r.sceneId+'-'+r.width,scene:r.sceneId,route:r.route,choice:r.choice,width:r.width,artwork:r.artwork,before:r}));
  cases.push({id:'freight-loaded-390',scene:'act2_ramp_load',route:'freight-craft/failed-desk',choice:'ramp-carry-past',width:390,artwork:'full'});
  const proxy=process.env.HTTPS_PROXY??process.env.HTTP_PROXY;const browser=await chromium.launch({headless:true,executablePath,...(proxy?{proxy:{server:proxy}}:{})}),rows=[];const browserVersion=browser.version();
  try {for(const c of cases){
    const state=routeCheckpoint(c.route,c.scene,c.choice),context=await browser.newContext({viewport:{width:c.width,height:900},reducedMotion:'reduce'}),page=await context.newPage();
    const errors:string[]=[];page.on('pageerror',(e:Error)=>errors.push(e.message));
    await page.addInitScript({content:'var __name = (fn, name) => Object.defineProperty(fn, "name", { value: name, configurable: true });'});
    await page.addInitScript(({state,artwork}:any)=>{localStorage.setItem('saint-shard-3055-v1',JSON.stringify(state));localStorage.setItem('saint-shard-preferences',JSON.stringify({sound:false,reading:'all',artwork,textStep:2,contrast:'high',motion:'reduce'}));},{state,artwork:c.artwork});
    await page.goto(url);await page.getByTestId('continue-run').click();await page.evaluate(()=>document.fonts.ready);await expect(page.getByTestId('goal')).toBeInViewport();
    const metrics=await page.getByTestId('scene').evaluate((root:HTMLElement)=>{
      const prose=root.querySelector<HTMLElement>('[data-testid="scene-text"]')!,choices=root.querySelector<HTMLElement>('#choices')!,bottom=prose.getBoundingClientRect().bottom;
      const controls=[...root.querySelectorAll<HTMLElement>('button,a,input,select,summary')].filter(n=>n.getBoundingClientRect().height>0&&!n.hasAttribute('disabled')&&n.getBoundingClientRect().top>=bottom);
      const first=controls[0],firstCanonical=choices.querySelector<HTMLElement>('button:not([disabled])');
      const actions=[...root.querySelectorAll<HTMLButtonElement>('button[data-testid^="choice-"]')].filter(n=>n.getBoundingClientRect().height>0).map(n=>({id:n.dataset.testid,text:n.innerText,disabled:n.disabled,gap:Math.round(n.getBoundingClientRect().top-bottom),height:n.getBoundingClientRect().height}));
      const task=actions.find(a=>!a.disabled);
      return{prose:prose.innerText,proseToChoiceSectionPx:Math.round(choices.getBoundingClientRect().top-bottom),proseToFirstFollowingControlPx:first?Math.round(first.getBoundingClientRect().top-bottom):null,firstFollowingControl:first?.innerText,proseToFirstTaskActionPx:task?.gap??null,firstTaskAction:task?.text,proseToFirstCanonicalButtonPx:firstCanonical?Math.round(firstCanonical.getBoundingClientRect().top-bottom):null,pageHeight:document.documentElement.scrollHeight,overflow:document.documentElement.scrollWidth>innerWidth,actions};
    });
    if(c.before){expect(state).toEqual(c.before.state);expect(metrics.prose).toEqual(c.before.prose);expect(metrics.actions.map(({gap,height,...r}:any)=>r)).toEqual(c.before.actions.map(({gap,height,...r}:any)=>r));const previous=c.before.actions.find((a:any)=>!a.disabled);expect(metrics.proseToFirstTaskActionPx).toBeLessThanOrEqual(previous.gap*.75);}
    expect(metrics.overflow).toBe(false);expect(errors).toEqual([]);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('saint-shard-3055-v1')!))).toEqual(state);
    const a11y=await new AxeBuilder({page}).analyze();expect(a11y.violations).toEqual([]);
    const entry=dir+'/'+c.id+'-entry.png',reading=dir+'/'+c.id+'-reading.png',action=dir+'/'+c.id+'-action.png';
    await page.screenshot({path:entry});await page.getByTestId('scene-text').scrollIntoViewIfNeeded();await page.screenshot({path:reading});await page.getByTestId('choice-'+c.choice).scrollIntoViewIfNeeded();await page.screenshot({path:action});
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('saint-shard-3055-v1')!))).toEqual(state);
    const previous=c.before?.actions.find((a:any)=>!a.disabled)?.gap;
    rows.push({id:c.id,scene:c.scene,route:c.route,choice:c.choice,width:c.width,artwork:c.artwork,metrics,beforeFirstActionPx:previous??null,firstActionReduction:previous?(previous-metrics.proseToFirstTaskActionPx)/previous:null,violations:a11y.violations,errors,captures:{entry,reading,action},method:'Actual public UI at legal saved checkpoints. Enlarged type/high contrast/reduced motion, full scene; 320px no art, others illustrated. Reading/action captures use diagnostic scrolling; entry goal visibility is checked first. No physical-device, unfamiliar-player, screen-reader listening or reading-speed claim.'});
    await context.close();console.log(JSON.stringify({id:c.id,firstActionPx:metrics.proseToFirstTaskActionPx,prior:previous??null}));
  }}finally{await browser.close();}
  const hash=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
  writeFileSync(dir+'/review.json',JSON.stringify({revision,dirty,url,environment:{browser:'Actual Chromium',browserVersion,viewport:'synthetic',layout:'enlarged'},baseline:{path:'qa/editorial/decision-flow-baseline.json',sha256:hash('qa/editorial/decision-flow-baseline.json')},rows},null,2)+'\n');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
