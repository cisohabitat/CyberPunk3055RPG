// Optional offline authoring. Builds serve checked-in WAVs and never invoke this.
import { writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { FOLEY_RATE, renderSceneFoley } from './scene-foley.mjs';
const descriptions = {
  'foley-viewer': 'Viewer contact, muted glass resonance and short lens-motor texture on a newly inspected fragment. No authentication or memory verdict.',
  'foley-reader': 'Dry reader contacts and a brief low transport motor on a committed index/key query, identical across success and failure. No success melody or authentication claim.',
  'foley-case': 'Soft closed-case shell and strap contact during inspection of the intact seal. No opening latch, broken seal, handover or receipt.',
  'foley-recorder': 'A restrained running-recorder transport and light table contact on entering the hearing. No new public quotation permission, filed account or verdict.',
};
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const clips = [];
for (const [id,samples] of Object.entries(renderSceneFoley())) {
  const wav = Buffer.alloc(44 + samples.length * 2);
  wav.write('RIFF');wav.writeUInt32LE(wav.length - 8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(FOLEY_RATE,24);wav.writeUInt32LE(FOLEY_RATE * 2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples.length * 2,40);
  let peak=0,energy=0,jump=0,previous=0;
  for(let i=0;i<samples.length;i++) {
    if(!Number.isFinite(samples[i]) || Math.abs(samples[i])>=.2) throw new Error('Invalid cue signal');
    wav.writeInt16LE(Math.round(samples[i]*32767),44+i*2);
    const decoded=wav.readInt16LE(44+i*2)/32768;
    peak=Math.max(peak,Math.abs(decoded));energy+=decoded*decoded;jump=Math.max(jump,Math.abs(decoded-previous));previous=decoded;
  }
  const path=`public/audio/${id}.wav`;writeFileSync(new URL(`../${path}`,import.meta.url),wav);
  clips.push({id,path,description:descriptions[id],sha256:sha(wav),bytes:wav.length,sampleRate:FOLEY_RATE,channels:1,bits:16,durationSeconds:samples.length/FOLEY_RATE,peak,rms:Math.sqrt(energy/samples.length),maxSampleJump:jump});
}
const files=['scripts/scene-foley.mjs','scripts/author-scene-foley.mjs'];
writeFileSync(new URL('../qa/media/scene-foley.json',import.meta.url),JSON.stringify({version:1,method:'Original seeded procedural synthesis; filtered noise, subdued contact transients and short mechanical motors. No samples, recordings, trained model or music service. 8ms onset / 25ms tail fades; checked-in mono PCM16 WAV deliveries.',sourceSha256:Object.fromEntries(files.map(p=>[p,sha(readFileSync(new URL(`../${p}`,import.meta.url)))])),mix:{level:.5,speechDuck:.35},clips,review:'Technical signal and source-familiar native-browser review; not physical-device or human listening acceptance.'},null,2)+'\n');
console.log(JSON.stringify({clips:clips.length,totalBytes:clips.reduce((sum,c)=>sum+c.bytes,0)}));
