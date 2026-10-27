/** Explicit browser QA only; observes actual buffers and bus targets, not production telemetry. */
export type SequenceAudioReview = { rows: { file: string; atMs: number; seconds: number; endedAtMs?: number }[]; sample: () => { music?: number; ambience?: number; voices?: number } };
export function installSequenceAudioReview() {
  const ownGains = new WeakMap<AudioBufferSourceNode, GainNode>();
  const edges = new WeakMap<GainNode, GainNode>();
  // Keep native AudioParam wrappers alive for this QA page. WebKit can collect
  // an otherwise unreferenced wrapper and return a fresh one for bus.gain;
  // a WeakMap then loses the observation although the real bus keeps playing.
  const targets = new Map<AudioParam, number>();
  const named = new Map<string, GainNode>();
  const rows: { file: string; atMs: number; seconds: number; endedAtMs?: number }[] = [];
  const target = AudioParam.prototype.setTargetAtTime;
  AudioParam.prototype.setTargetAtTime = function(value, time, constant) { targets.set(this, value); return target.call(this, value, time, constant); };
  const gainConnect = GainNode.prototype.connect;
  GainNode.prototype.connect = function(this: GainNode, destination: AudioNode | AudioParam, output?: number, input?: number) {
    if (destination instanceof GainNode) edges.set(this, destination);
    return destination instanceof AudioParam ? gainConnect.call(this,destination,output) : (gainConnect as (destination:AudioNode, output?:number,input?:number)=>AudioNode).call(this,destination,output,input);
  } as typeof gainConnect;
  const connect = AudioBufferSourceNode.prototype.connect;
  AudioBufferSourceNode.prototype.connect = function(this: AudioBufferSourceNode, destination: AudioNode | AudioParam, output?:number,input?:number) {
    if(destination instanceof GainNode)ownGains.set(this,destination);
    return destination instanceof AudioParam ? connect.call(this,destination,output) : (connect as (destination:AudioNode,output?:number,input?:number)=>AudioNode).call(this,destination,output,input);
  } as typeof connect;
  const start=AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start=function(...args:Parameters<typeof start>){
    const result=start.apply(this,args);
    const file=(window as unknown as {audioReview:{started:string[]}}).audioReview.started.at(-1)??"unknown";
    const own=ownGains.get(this),bus=own?edges.get(own):undefined;
    if(bus){const channel=file.startsWith("voice-")?"voices":file.startsWith("theme")?"music":file.startsWith("ambience")?"ambience":undefined;if(channel)named.set(channel,bus);}
    const row: {file:string;atMs:number;seconds:number;endedAtMs?:number}={file,atMs:performance.now(),seconds:this.buffer?.duration??0};
    this.addEventListener("ended",()=>{row.endedAtMs=performance.now();},{once:true});
    rows.push(row);return result;
  };
  (window as unknown as {sequenceAudioReview:SequenceAudioReview}).sequenceAudioReview={rows,sample:()=>Object.fromEntries([...named].map(([name,bus])=>[name,targets.get(bus.gain)]))};
}
