// Optional offline delivery generation. Never run by build or gameplay.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { INVESTIGATION_RATE as rate,renderInvestigationFoley } from './investigation-foley.mjs';
const meanings={
 'foley-paper':'Paper handling on committed archive custody or either filing/withdrawal decision. Same neutral sound for both; no authentication, permission or outcome melody.',
 'foley-chair':'Brake/lever handling after the actual chair preparation check is committed. Identical contact on hit/miss, never an assurance of a safe crossing.',
 'foley-folio':'Soft folio cover contact only when Ives actually takes the memorial page. No private-source transfer or inquiry verdict.',
};
const hash=b=>createHash('sha256').update(b).digest('hex'),clips=[];
for(const [id,samples] of Object.entries(renderInvestigationFoley())){
 const wav=Buffer.alloc(44+samples.length*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples.length*2,40);
 let peak=0,energy=0,jump=0,previous=0;
 for(let i=0;i<samples.length;i++){if(!Number.isFinite(samples[i])||Math.abs(samples[i])>=.2)throw Error('Invalid physical texture');wav.writeInt16LE(Math.round(samples[i]*32767),44+i*2);const value=wav.readInt16LE(44+i*2)/32768;peak=Math.max(peak,Math.abs(value));energy+=value*value;jump=Math.max(jump,Math.abs(value-previous));previous=value;}
 const path=`public/audio/${id}.wav`;writeFileSync(new URL(`../${path}`,import.meta.url),wav);clips.push({id,path,description:meanings[id],sha256:hash(wav),bytes:wav.length,sampleRate:rate,channels:1,bits:16,durationSeconds:samples.length/rate,peak,rms:Math.sqrt(energy/samples.length),maxSampleJump:jump});
}
const sources=['scripts/investigation-foley.mjs','scripts/author-investigation-foley.mjs'];
writeFileSync(new URL('../qa/media/investigation-foley.json',import.meta.url),JSON.stringify({version:1,method:'Original seeded procedural physical textures: filtered noise, brushed surfaces, subdued lever/cover transients; no recordings, samples or trained models. 10ms onset/35ms tail fades. Checked-in mono PCM16 WAVs.',sourceSha256:Object.fromEntries(sources.map(p=>[p,hash(readFileSync(new URL(`../${p}`,import.meta.url)))])),mix:{level:.5,speechDuck:.35},clips,review:'Source/signal and source-familiar native-browser review; no physical-device or human listening claim.'},null,2)+'\n');
console.log(JSON.stringify({clips:clips.length,totalBytes:clips.reduce((n,c)=>n+c.bytes,0)}));
