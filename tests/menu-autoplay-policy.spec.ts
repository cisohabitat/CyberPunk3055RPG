import { test, expect } from '@playwright/test';
import { installAudioReview, type AudioReview } from '../qa/production/audio-review';
import { keyboardActivate } from '../qa/production/keyboard';
const audio=(page:import('@playwright/test').Page):Promise<AudioReview>=>page.evaluate(()=>(window as unknown as {audioReview:AudioReview}).audioReview);
const saved=(page:import('@playwright/test').Page)=>page.evaluate(()=>localStorage.getItem('saint-shard-3055-v1'));
// DOM snapshot tracing evaluates the document and supplies user activation.
// Keep native state as JSON evidence; tracing would change this permission test.
test.use({trace:'off'});
for(const policy of ['no-user-gesture-required','document-user-activation-required'])test(`native title autoplay policy ${policy}`,async({playwright,baseURL},testInfo)=>{
  test.skip(testInfo.project.name!=='chromium','Native Chromium policy coverage runs once; ordinary fallback runs in every browser.');
  const args=[`--autoplay-policy=${policy}`];
  if(policy==='document-user-activation-required')args.push('--disable-features=PreloadMediaEngagementData,MediaEngagementBypassAutoplayPolicies');
  const browser=await playwright.chromium.launch({channel:'chromium',executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,args});
  let observed:unknown=null;
  try{
    const context=await browser.newContext({baseURL});const page=await context.newPage();await page.addInitScript(installAudioReview,{});
    await page.addInitScript(()=>{
      const resume=AudioContext.prototype.resume;
      AudioContext.prototype.resume=function(){
        (window as unknown as {menuPolicyContext:AudioContext}).menuPolicyContext=this;
        return resume.call(this);
      };
    });
    const session=await context.newCDPSession(page);
    // Ordinary Playwright evaluation/locator checks can supply user activation.
    // Observe native permission before using those checks or sending any input.
    const inspect=async()=>{
      const result=await session.send('Runtime.evaluate',{userGesture:false,returnByValue:true,expression:`({
        active:navigator.userActivation.hasBeenActive,
        title:!!document.querySelector('[data-testid="title-screen"]'),
        attempted:!!window.menuPolicyContext,state:window.menuPolicyContext?.state,
        waiting:document.querySelector('[data-testid="title-music"]')?.textContent.includes('autoplay is waiting'),
        started:window.audioReview?.started ?? []
      })`});
      if(result.exceptionDetails)throw new Error('Native autoplay inspection failed');
      observed=result.result.value;return observed;
    };
    const requests:string[]=[];page.on('request',r=>{if(r.url().includes('/audio/'))requests.push(r.url());});
    await page.goto('/');
    if(policy==='no-user-gesture-required')await expect.poll(inspect).toMatchObject({title:true,active:false,started:['theme-title.flac']});
    else{
      await expect.poll(inspect).toMatchObject({title:true,active:false,attempted:true,state:'suspended',waiting:true,started:[]});
      expect(requests).toEqual([]);
      await keyboardActivate(page,page.getByTestId('guide-link'));await expect.poll(async()=>(await audio(page)).started).toContain('theme-title.flac');
    }
    await keyboardActivate(page,page.getByRole('button',{name:'Stop menu music',exact:true}));await expect.poll(async()=>(await audio(page)).liveSources).toBe(0);
    expect(await saved(page)).toBeNull();await context.close();
  }finally{
    await testInfo.attach('native-autoplay-before-interaction.json',{body:JSON.stringify({policy,browser:browser.version(),observed},null,2),contentType:'application/json'});
    await browser.close();
  }
});
