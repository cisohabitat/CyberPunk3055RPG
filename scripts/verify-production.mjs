import { spawn } from "node:child_process";
import { resolve } from "node:path";
const port=3117;
const url=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,[resolve("node_modules/next/dist/bin/next"),"start","--hostname","127.0.0.1","--port",String(port)],{stdio:"inherit"});
try {
  let ready=false;
  const deadline=Date.now()+30000;
  while(Date.now()<deadline){
    if(server.exitCode!==null)throw new Error(`Production server exited ${server.exitCode}`);
    try{ready=(await fetch(url,{signal:AbortSignal.timeout(1000)})).ok;}catch{}
    if(ready)break;
    await new Promise(resolve=>setTimeout(resolve,400));
  }
  if(!ready)throw new Error("Production server did not become ready");
  const code=await new Promise((resolve,reject)=>{
    const probe=spawn(process.execPath,["scripts/performance-probe.mjs",url],{stdio:"inherit"});
    probe.once("error",reject);probe.once("exit",code=>resolve(code??1));
  });
  if(code!==0)process.exitCode=1;
}finally{server.kill("SIGTERM");}
