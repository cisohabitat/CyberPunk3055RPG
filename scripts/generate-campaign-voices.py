"""Optional offline character-dialogue authoring. Never imported by the game/build.
Pinned Kokoro v1.0 model/style hashes and licenses remain in voice-provenance.json.
Usage: python scripts/generate-campaign-voices.py --model PATH --voices PATH.
Existing 101 WAV files are never rewritten. New clips use MP3 delivery, with PCM
masters and normalized PCM intermediates retained outside the repository.
"""
import argparse, hashlib, json, pathlib, subprocess, wave
import numpy as np
import onnxruntime as ort
ort.disable_telemetry_events()
from kokoro_onnx import Kokoro
parser=argparse.ArgumentParser()
parser.add_argument('--model',required=True);parser.add_argument('--voices',required=True)
parser.add_argument('--masters',default='/workspace/generated_audio/campaign-dialogue')
parser.add_argument('--only',nargs='+');args=parser.parse_args()
root=pathlib.Path(__file__).resolve().parent.parent
legacy=json.loads((root/'qa/media/voice-provenance.json').read_text())
expected={f['name']:f['sha256'] for f in legacy['model']['files']}
sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
for path in [pathlib.Path(args.model),pathlib.Path(args.voices)]:assert sha(path)==expected[path.name]
lines=json.loads((root/'qa/media/campaign-dialogue-lines.json').read_text())
if args.only:
 assert set(args.only)<={l['id'] for l in lines}
 lines=[l for l in lines if l['id'] in args.only]
masters=pathlib.Path(args.masters);masters.mkdir(parents=True,exist_ok=True)
provenance=root/'qa/media/campaign-dialogue-provenance.json'
records=json.loads(provenance.read_text())['lines'] if provenance.exists() else []
records={r['id']:r for r in records};model=Kokoro(args.model,args.voices)
def write(path,samples,rate):
 with wave.open(str(path),'wb') as out:
  out.setnchannels(1);out.setsampwidth(2);out.setframerate(rate);out.writeframes((np.clip(samples,-1,1)*32767).astype('<i2').tobytes())
for line in lines:
 id=line['id'];target=root/'public/audio'/f'{id}.mp3'
 if id in records and target.exists() and records[id]['text']==line['text'] and sha(target)==records[id]['sha256']:
  print(json.dumps({'id':id,'retained':True}),flush=True);continue
 pieces=[];parts=line.get('segments',[{'text':line['text'],'pauseAfter':0}])
 assert ' '.join(p['text'] for p in parts)==line['text']
 for p in parts:
  speed=p.get('speed',line['speed']);assert .75<=speed<=1.15 and 0<=p.get('pauseAfter',0)<=.8
  clip,rate=model.create(p['text'],voice=line['voice'],speed=speed,lang='en-us');clip=clip.copy()
  assert np.isfinite(clip).all() and len(clip)>rate*.1
  fade=min(int(rate*.008),len(clip)//2);clip[:fade]*=np.linspace(0,1,fade);clip[-fade:]*=np.linspace(1,0,fade)
  pieces.extend([clip,np.zeros(int(rate*p.get('pauseAfter',0)),dtype=clip.dtype)])
 samples=np.concatenate(pieces);assert np.max(np.abs(samples))>0
 master=masters/f'{id}.wav';write(master,samples,rate)
 delivery=samples*(.72/np.max(np.abs(samples)));delivery=np.pad(delivery,int(rate*.08))
 pcm=masters/f'{id}-delivery.wav';write(pcm,delivery,rate)
 subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(pcm),'-codec:a','libmp3lame','-b:a','96k','-map_metadata','-1',str(target)],check=True)
 decoded=subprocess.run(['ffmpeg','-loglevel','error','-i',str(target),'-f','f32le','-ac','1','-ar','24000','pipe:1'],check=True,capture_output=True).stdout
 audible=np.frombuffer(decoded,dtype='<f4');assert np.isfinite(audible).all() and np.max(np.abs(audible))<.95
 records[id]={**line,'language':'en-us','path':str(target.relative_to(root)),'sourceFile':str(master),'sourceSha256':sha(master),'pcmDeliveryFile':str(pcm),'pcmDeliverySha256':sha(pcm),'sha256':sha(target),'bytes':target.stat().st_size,'sampleRate':rate,'channels':1,'durationSeconds':len(audible)/rate,'peak':float(np.max(np.abs(audible))),'rms':float(np.sqrt(np.mean(audible**2)))}
 provenance.write_text(json.dumps({'generated':'2026-10-13','disclosure':legacy['disclosure'],'driver':legacy['driver'],'model':legacy['model'],'source':'scripts/generate-campaign-voices.py','processing':'Exact authored character words; existing cast identities; optional sentence pauses, 8ms phrase fades, normalized PCM peak 0.72 with 80ms edges; 96kbps mono MP3 delivery. Original PCM and normalized PCM retained outside Git.','reviewStatus':'Technical signal and source review; stock synthetic dialogue. No commissioned actors or independent listening acceptance.','lines':list(records.values())},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'id':id,'speaker':line['speaker'],'seconds':len(audible)/rate,'bytes':target.stat().st_size}),flush=True)
