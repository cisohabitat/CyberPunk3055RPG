"""Offline Phase 5 stock-voice candidates. Never run by game/build; writes outside Git.
Use the pinned Kokoro model/style bank from voice-provenance.json, an existing
Kokoro environment, ffmpeg and numpy. Original deliveries are never overwritten.
"""
import argparse,datetime,hashlib,json,pathlib,subprocess,wave
import numpy as np
import onnxruntime as ort
ort.disable_telemetry_events()
from kokoro_onnx import Kokoro
p=argparse.ArgumentParser();p.add_argument('--model',required=True);p.add_argument('--voices',required=True);p.add_argument('--out',required=True);p.add_argument('--only',nargs='+');a=p.parse_args()
root=pathlib.Path(__file__).resolve().parent.parent;out=pathlib.Path(a.out).resolve()
assert not out.is_relative_to(root), 'Keep candidate masters outside the repository'
out.mkdir(parents=True,exist_ok=True)
sha=lambda f:hashlib.sha256(pathlib.Path(f).read_bytes()).hexdigest()
legacy=json.loads((root/'qa/media/voice-provenance.json').read_text());expected={r['name']:r['sha256']for r in legacy['model']['files']}
for f in [a.model,a.voices]:assert sha(f)==expected[pathlib.Path(f).name]
model=Kokoro(a.model,a.voices);rows=[]
lines=json.loads((root/'qa/media/aaa-performance-lines.json').read_text())
if a.only:assert set(a.only)<={r['id']for r in lines}
def wav(path,samples,rate):
 with wave.open(str(path),'wb')as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(rate);f.writeframes((np.clip(samples,-1,1)*32767).astype('<i2').tobytes())
def measure(path):
 s=subprocess.run(['ffmpeg','-hide_banner','-i',str(path),'-af','loudnorm=I=-23.5:TP=-2:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True,check=True).stderr
 return json.JSONDecoder().raw_decode(s[s.rfind('{'):])[0]
for line in lines:
 if a.only and line['id']not in a.only:continue
 assert sha(root/line['previousPath'])==line['previousSha256'];assert ' '.join(s['text']for s in line['segments'])==line['text']
 pieces=[];parts=[]
 for i,s in enumerate(line['segments']):
  assert .75<=s['speed']<=1.15 and 0<=s['pauseAfter']<=.8
  clip,rate=model.create(s['text'],voice=line['voice'],speed=s['speed'],lang='en-us');clip=clip.copy();assert np.isfinite(clip).all()
  raw=out/f"{line['id']}-phrase-{i}.wav";wav(raw,clip,rate)
  # Remove only model padding quieter than -60dB relative to this phrase's
  # peak. Retain 80ms on either side of every detected sample, including
  # final consonants; ASR and full-context comparisons review the delivery.
  active=np.flatnonzero(np.abs(clip)>max(float(np.max(np.abs(clip)))*.001,1e-5));assert len(active)
  lo=max(0,int(active[0])-int(rate*.08));hi=min(len(clip),int(active[-1])+1+int(rate*.08));trimmed=clip[lo:hi].copy()
  fade=min(int(rate*.008),len(trimmed)//2);trimmed[:fade]*=np.linspace(0,1,fade);trimmed[-fade:]*=np.linspace(1,0,fade)
  parts.append({**s,'rawFile':str(raw),'rawSha256':sha(raw),'rawSeconds':len(clip)/rate,'retainedSeconds':len(trimmed)/rate,'trimmedHeadSeconds':lo/rate,'trimmedTailSeconds':(len(clip)-hi)/rate,'startSeconds':sum(len(v)for v in pieces)/rate})
  pieces.extend([trimmed,np.zeros(round(rate*s['pauseAfter']),dtype=trimmed.dtype)])
 samples=np.concatenate(pieces);master=out/f"{line['id']}-master.wav";wav(master,samples,rate)
 pcm=out/f"{line['id']}-pcm.wav";wav(pcm,np.pad(samples*(.72/np.max(np.abs(samples))),int(rate*.08)),rate)
 stats=measure(pcm);target=line['loudnessLufs'];settings=f"loudnorm=I={target}:TP=-2:LRA=11:measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:offset={stats['target_offset']}:linear=true"
 normalized=out/f"{line['id']}-normalized.wav";subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(pcm),'-af',settings,'-ar',str(rate),'-ac','1','-map_metadata','-1',str(normalized)],check=True);normalized.replace(pcm)
 delivery=out/f"{line['id']}.mp3"
 def encode():subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(pcm),'-codec:a','libmp3lame','-b:a','96k','-map_metadata','-1',str(delivery)],check=True)
 encode();stats=measure(delivery);correction=min(target-float(stats['input_i']),-1.6-float(stats['input_tp']))
 if abs(correction)>.15:
  corrected=out/f"{line['id']}-codec.wav";subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(pcm),'-af',f'volume={correction}dB','-map_metadata','-1',str(corrected)],check=True);corrected.replace(pcm);encode();stats=measure(delivery)
 assert abs(float(stats['input_i'])-target)<=.6 and float(stats['input_tp'])<=-1.5
 decoded=np.frombuffer(subprocess.check_output(['ffmpeg','-loglevel','error','-i',str(delivery),'-f','f32le','-ar','24000','-ac','1','pipe:1']),dtype='<f4');assert np.isfinite(decoded).all()and np.max(np.abs(decoded))<.95
 rows.append({**line,'candidateFile':str(delivery),'sha256':sha(delivery),'bytes':delivery.stat().st_size,'sourceFile':str(master),'sourceSha256':sha(master),'pcmDeliveryFile':str(pcm),'pcmDeliverySha256':sha(pcm),'parts':parts,'integratedLufs':float(stats['input_i']),'truePeakDbtp':float(stats['input_tp']),'durationSeconds':len(decoded)/24000,'sampleRate':rate,'channels':1,'peak':float(np.max(np.abs(decoded)))})
 print(json.dumps({'id':line['id'],'seconds':len(decoded)/24000,'lufs':stats['input_i']}),flush=True)
result={'generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source':'scripts/direct-anchor-voices.py','driver':legacy['driver'],'model':legacy['model'],'disclosure':legacy['disclosure'],'method':'Exact words and stock identity; phrase speed/pause direction, conservative -60dB-relative model-padding removal with80ms guards/8ms fades, two-pass -23.5LUFS codec matching,96kbps mono MP3. Masters retained outside Git.','lines':rows}
(out/'provenance.json').write_text(json.dumps(result,indent=2)+'\n')
