"""Optional offline character-dialogue authoring. Never imported by the game/build.
Pinned Kokoro v1.0 model/style hashes and licenses remain in voice-provenance.json.
Usage: python scripts/generate-campaign-voices.py --model PATH --voices PATH.
Existing 101 WAV files are never rewritten. New clips use MP3 delivery, with PCM
masters and normalized PCM intermediates retained outside the repository.
"""
import argparse, datetime, hashlib, json, pathlib, subprocess, wave
import numpy as np
import onnxruntime as ort
ort.disable_telemetry_events()
from kokoro_onnx import Kokoro
parser=argparse.ArgumentParser()
parser.add_argument('--model',required=True);parser.add_argument('--voices',required=True)
parser.add_argument('--masters',default='/workspace/generated_audio/campaign-dialogue')
parser.add_argument('--catalog',default='qa/media/campaign-dialogue-lines.json')
parser.add_argument('--provenance',default='qa/media/campaign-dialogue-provenance.json')
parser.add_argument('--only',nargs='+');args=parser.parse_args()
root=pathlib.Path(__file__).resolve().parent.parent
legacy=json.loads((root/'qa/media/voice-provenance.json').read_text())
expected={f['name']:f['sha256'] for f in legacy['model']['files']}
sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
for path in [pathlib.Path(args.model),pathlib.Path(args.voices)]:assert sha(path)==expected[path.name]
lines=json.loads((root/args.catalog).read_text())
if args.only:
 assert set(args.only)<={l['id'] for l in lines}
 lines=[l for l in lines if l['id'] in args.only]
masters=pathlib.Path(args.masters);masters.mkdir(parents=True,exist_ok=True)
provenance=root/args.provenance
records=json.loads(provenance.read_text())['lines'] if provenance.exists() else []
records={r['id']:r for r in records};model=Kokoro(args.model,args.voices)
def write(path,samples,rate):
 with wave.open(str(path),'wb') as out:
  out.setnchannels(1);out.setsampwidth(2);out.setframerate(rate);out.writeframes((np.clip(samples,-1,1)*32767).astype('<i2').tobytes())
for line in lines:
 id=line['id'];target=root/'public/audio'/f'{id}.mp3'
 if id in records and target.exists() and all(records[id].get(k)==line.get(k) for k in ['text','speaker','voice','speed','segments','loudnessLufs']) and sha(target)==records[id]['sha256']:
  print(json.dumps({'id':id,'retained':True}),flush=True);continue
 pieces=[];parts=line.get('segments',[{'text':line['text'],'pauseAfter':0}])
 assert ' '.join(p['text'] for p in parts)==line['text']
 for p in parts:
  speed=p.get('speed',line['speed']);assert .75<=speed<=1.15 and 0<=p.get('pauseAfter',0)<=.8
  # Reviewed consonant articulation for this exact word, never arbitrary
  # phonetic text in place of authored dialogue. Avoid the US flapped /t/
  # that can make "writing" indistinguishable from "riding".
  if p.get('pronunciation'):
   assert p['pronunciation']=='clear-writing-t' and p['text']=='writing.'
   clip,rate=model.create('ɹˈaɪtɪŋ.',voice=line['voice'],speed=speed,lang='en-us',is_phonemes=True)
  else:
   clip,rate=model.create(p['text'],voice=line['voice'],speed=speed,lang='en-us')
  clip=clip.copy()
  assert np.isfinite(clip).all() and len(clip)>rate*.1
  fade=min(int(rate*.008),len(clip)//2);clip[:fade]*=np.linspace(0,1,fade);clip[-fade:]*=np.linspace(1,0,fade)
  pieces.extend([clip,np.zeros(int(rate*p.get('pauseAfter',0)),dtype=clip.dtype)])
 samples=np.concatenate(pieces);assert np.max(np.abs(samples))>0
 master=masters/f'{id}.wav';write(master,samples,rate)
 delivery=samples*(.72/np.max(np.abs(samples)));delivery=np.pad(delivery,int(rate*.08))
 pcm=masters/f'{id}-delivery.wav';write(pcm,delivery,rate)
 if 'loudnessLufs' in line:
  target_lufs=line['loudnessLufs'];assert -24<=target_lufs<=-18
  measurement=subprocess.run(['ffmpeg','-hide_banner','-i',str(pcm),'-af',f'loudnorm=I={target_lufs}:TP=-2:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True,check=True).stderr
  stats=json.JSONDecoder().raw_decode(measurement[measurement.rfind('{'):])[0]
  settings=f"loudnorm=I={target_lufs}:TP=-2:LRA=11:measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:offset={stats['target_offset']}:linear=true"
  normalized=masters/f'{id}-loudness.wav'
  subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(pcm),'-af',settings,'-ar',str(rate),'-ac','1','-map_metadata','-1',str(normalized)],check=True)
  normalized.replace(pcm)
 subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(pcm),'-codec:a','libmp3lame','-b:a','96k','-map_metadata','-1',str(target)],check=True)
 decoded=subprocess.run(['ffmpeg','-loglevel','error','-i',str(target),'-f','f32le','-ac','1','-ar','24000','pipe:1'],check=True,capture_output=True).stdout
 audible=np.frombuffer(decoded,dtype='<f4');assert np.isfinite(audible).all() and np.max(np.abs(audible))<.95
 loudness={}
 if 'loudnessLufs' in line:
  measurement=subprocess.run(['ffmpeg','-hide_banner','-i',str(target),'-af','loudnorm=I=-20:TP=-2:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True,check=True).stderr
  stats=json.JSONDecoder().raw_decode(measurement[measurement.rfind('{'):])[0]
  loudness={'integratedLufs':float(stats['input_i']),'truePeakDbtp':float(stats['input_tp'])}
  # Match the delivered codec's measured level; retain a true-peak margin.
  correction=min(line['loudnessLufs']-loudness['integratedLufs'],-1.6-loudness['truePeakDbtp'])
  if abs(correction)>.15:
   corrected=masters/f'{id}-codec-matched.wav'
   subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(pcm),'-af',f'volume={correction}dB','-map_metadata','-1',str(corrected)],check=True)
   corrected.replace(pcm)
   subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(pcm),'-codec:a','libmp3lame','-b:a','96k','-map_metadata','-1',str(target)],check=True)
   decoded=subprocess.run(['ffmpeg','-loglevel','error','-i',str(target),'-f','f32le','-ac','1','-ar','24000','pipe:1'],check=True,capture_output=True).stdout
   audible=np.frombuffer(decoded,dtype='<f4');assert np.isfinite(audible).all() and np.max(np.abs(audible))<.95
   measurement=subprocess.run(['ffmpeg','-hide_banner','-i',str(target),'-af','loudnorm=I=-20:TP=-2:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True,check=True).stderr
   stats=json.JSONDecoder().raw_decode(measurement[measurement.rfind('{'):])[0]
   loudness={'integratedLufs':float(stats['input_i']),'truePeakDbtp':float(stats['input_tp'])}
  assert abs(loudness['integratedLufs']-line['loudnessLufs'])<=.6 and loudness['truePeakDbtp']<=-1.5
 records[id]={**line,**loudness,'language':'en-us','path':str(target.relative_to(root)),'sourceFile':str(master),'sourceSha256':sha(master),'pcmDeliveryFile':str(pcm),'pcmDeliverySha256':sha(pcm),'sha256':sha(target),'bytes':target.stat().st_size,'sampleRate':rate,'channels':1,'durationSeconds':len(audible)/rate,'peak':float(np.max(np.abs(audible))),'rms':float(np.sqrt(np.mean(audible**2)))}
 provenance.write_text(json.dumps({'generated':datetime.datetime.now(datetime.timezone.utc).date().isoformat(),'disclosure':legacy['disclosure'],'driver':legacy['driver'],'model':legacy['model'],'source':'scripts/generate-campaign-voices.py','processing':'Exact authored character words; existing cast identities; optional sentence pauses, 8ms phrase fades, normalized PCM peak 0.72 with 80ms edges; optional per-line two-pass EBU loudness matching with -2dBTP ceiling; 96kbps mono MP3 delivery. Original PCM and normalized PCM retained outside Git.','reviewStatus':'Technical signal and source review; stock synthetic dialogue. No commissioned actors or independent listening acceptance.','lines':list(records.values())},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'id':id,'speaker':line['speaker'],'seconds':len(audible)/rate,'bytes':target.stat().st_size}),flush=True)
