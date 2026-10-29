"""Offline complete-anchor comparison; never imported by game/build.
Actual delivered stereo beds and centered stock voices at settled default gains.
No browser crossfade/duck ramps, network latency, hardware or acting acceptance.
"""
import hashlib,json,pathlib,subprocess,wave
import numpy as np
root=pathlib.Path(__file__).resolve().parent.parent;phase=json.loads((root/'qa/media/aaa-performance-direction.json').read_text());review=json.loads((root/'qa/media/aaa-performance-review.json').read_text());rate=24000
out=pathlib.Path('/workspace/generated_audio/aaa-performance-direction/mixes');out.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def decode(p):
 channels=int(subprocess.check_output(['ffprobe','-v','error','-select_streams','a:0','-show_entries','stream=channels','-of','csv=p=0',str(p)]).decode().strip())
 args=['ffmpeg','-loglevel','error','-i',str(p)]
 if channels==1:args+=['-af','pan=stereo|c0=c0|c1=c0']
 return np.frombuffer(subprocess.check_output(args+['-f','f32le','-ar',str(rate),'-ac','2','pipe:1']),dtype='<f4').reshape(-1,2).copy()
focus={'normal':(1,1),'closing':(.65,.55)};current={r['id']:r for r in phase['deliveries']};baseline={r['id']:r for r in review['before']['lines']};pieces=[];rows=[];offset=0
for example in phase['examples']:
 id=example['id'];old=baseline[id];mood=example['sound']['mood'];music=root/f"public/audio/{'theme' if mood=='street' else 'theme-'+mood}.flac";room=root/f"public/audio/ambience-{example['sound']['district']}.flac";fm,fa=focus[example['focus']];beds=(decode(music)*(.5*.6*.22*fm),decode(room)*(.35*.5*.44*fa));versions=[]
 choices=[('before',old['path'],old['sha256']),('directed',current[id]['path'],current[id]['sha256'])]if id in current else [('retained',old['path'],old['sha256'])]
 for label,path,h in choices:
  p=root/path;assert sha(p)==h;voice=decode(p)*.7;bed=np.resize(beds[0],voice.shape)+np.resize(beds[1],voice.shape);mixed=voice+bed;assert np.isfinite(mixed).all() and np.max(np.abs(mixed))<.99
  pcm=out/f'{id}-{label}.wav'
  with wave.open(str(pcm),'wb')as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(rate);f.writeframes((mixed*32767).astype('<i2').tobytes())
  versions.append({'version':label,'path':path,'sha256':h,'startSeconds':offset/rate,'durationSeconds':len(mixed)/rate,'sourceFile':str(pcm),'sourceSha256':sha(pcm),'peak':float(np.max(np.abs(mixed))),'voiceRms':float(np.sqrt(np.mean(voice**2))),'bedRms':float(np.sqrt(np.mean(bed**2)))})
  pieces.extend([mixed,np.zeros((rate,2),dtype=np.float32)]);offset+=len(mixed)+rate
 rows.append({'id':id,'sceneId':example['sceneId'],'speaker':example['speaker'],'text':example['text'],'musicPath':str(music.relative_to(root)),'musicSha256':sha(music),'ambiencePath':str(room.relative_to(root)),'ambienceSha256':sha(room),'focus':example['focus'],'versions':versions})
all=np.concatenate(pieces);master=out/'anchor-audition.wav'
with wave.open(str(master),'wb')as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(rate);f.writeframes((all*32767).astype('<i2').tobytes())
preview=root/'qa/media/aaa-performance-audition.mp3';subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(master),'-codec:a','libmp3lame','-b:a','96k','-map_metadata','-1',str(preview)],check=True)
result={'method':'Complete quoted performances at actual authored checkpoints; seven before/directed pairs and twelve retained performances over the same delivered stereo music/ambience. Default Voice70/Music60/Ambience50, source voice gain1, bed gains.5/.35, speech duck.22/.44 and unchanged scene focus. One-second separator between labeled intervals. Canonical scene context and art are in aaa-performance-direction.json.','limitations':'Offline settled-gain 24kHz comparison, not runtime ramp/crossfade simulation, hardware playback, human listening, independent intelligibility or acting acceptance. No added narrator, timing cue or synthesized name.','previewPath':str(preview.relative_to(root)),'previewSha256':sha(preview),'bytes':preview.stat().st_size,'durationSeconds':len(all)/rate,'channels':2,'sampleRate':rate,'samples':rows};(root/'qa/media/aaa-performance-audition.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'performances':len(rows),'intervals':sum(len(r['versions'])for r in rows),'durationSeconds':len(all)/rate,'bytes':preview.stat().st_size}))
