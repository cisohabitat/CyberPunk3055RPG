"""Offline connected-scene comparison; never run by build/game.
Requires numpy, ffmpeg. Actual delivered beds at settled default gains, not
browser fades/network/hardware/perceptual acceptance. No loudness matching:
original depot clips are ~-20LUFS, selected alternatives ~-23.5LUFS.
"""
import hashlib,json,pathlib,subprocess,wave
import numpy as np
root=pathlib.Path(__file__).resolve().parent.parent
phase=json.loads((root/'qa/media/expressive-performance.json').read_text());rate=24000
out=pathlib.Path('/workspace/generated_audio/expressive-performance/mixes');out.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def decode(p):
 return np.frombuffer(subprocess.check_output(['ffmpeg','-loglevel','error','-i',str(p),'-f','f32le','-ar',str(rate),'-ac','2','pipe:1']),dtype='<f4').reshape(-1,2).copy()
selected={l['id']:l for l in phase['deliveries']};pieces=[];rows=[];offset=0
for scene in phase['examples']:
 music=root/'public/audio/theme-quiet.flac';room=root/'public/audio/ambience-street.flac';beds=(decode(music)*(.5*.6*.22),decode(room)*(.35*.5*.44));versions=[]
 for label in ['before','directed']:
  voices=[];clips=[];pos=0
  for i,line in enumerate(scene['lines']):
   path=root/(selected[line['id']]['path']if label=='directed'and line['id']in selected else 'public/audio/'+line['id']+'.mp3');voice=decode(path)*.7
   clips.append(dict(id=line['id'],text=line['text'],path=str(path.relative_to(root)),sha256=sha(path),startSeconds=pos/rate,durationSeconds=len(voice)/rate));voices.append(voice);pos+=len(voice)
   if i<len(scene['lines'])-1:voices.append(np.zeros((round(rate*.12),2),dtype=np.float32));pos+=round(rate*.12)
  voice=np.concatenate(voices);bed=np.resize(beds[0],voice.shape)+np.resize(beds[1],voice.shape);mixed=voice+bed;assert np.isfinite(mixed).all()and np.max(np.abs(mixed))<.99
  pcm=out/(scene['id']+'-'+label+'.wav')
  with wave.open(str(pcm),'wb')as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(rate);f.writeframes((mixed*32767).astype('<i2').tobytes())
  versions.append(dict(version=label,startSeconds=offset/rate,durationSeconds=len(mixed)/rate,clips=clips,masterPath=str(pcm),masterSha256=sha(pcm),peak=float(np.max(np.abs(mixed))),voiceRms=float(np.sqrt(np.mean(voice**2))),bedRms=float(np.sqrt(np.mean(bed**2)))))
  pieces.extend([mixed,np.zeros((rate,2),dtype=np.float32)]);offset+=len(mixed)+rate
 rows.append(dict(checkpoint=scene['id'],route=scene['route'],scene=scene['scene'],choice=scene['choice'],sceneText=scene['text'],sound=scene['sound'],focus='normal',musicPath=str(music.relative_to(root)),musicSha256=sha(music),ambiencePath=str(room.relative_to(root)),ambienceSha256=sha(room),versions=versions))
all=np.concatenate(pieces);master=out/'connected-audition.wav'
with wave.open(str(master),'wb')as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(rate);f.writeframes((all*32767).astype('<i2').tobytes())
preview=root/'qa/media/expressive-performance-audition.mp3';subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(master),'-codec:a','libmp3lame','-b:a','96k','-map_metadata','-1',str(preview)],check=True)
result=dict(method='Six complete conditional conversation stages, before/directed pairs; actual delivered stereo quiet/street beds, normal focus, Voice70/Music60/Ambience50, source gains1/.5/.35, speech duck.22/.44, same-speaker gap120ms, continuous settled beds through each stage and one-second separators. Exact scene context and current art decisions retained.',limitations='Offline settled-gain approximation; no browser ramps, download timing, hardware or perceptual listening acceptance. Alternatives are quieter than ~-20LUFS originals; not level matched. Retained summary/fallback keeps its original level. No acting score inferred.',previewPath=str(preview.relative_to(root)),previewSha256=sha(preview),bytes=preview.stat().st_size,durationSeconds=len(all)/rate,channels=2,sampleRate=rate,scenes=rows)
(root/'qa/media/expressive-performance-audition.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(dict(stages=len(rows),intervals=12,seconds=len(all)/rate,bytes=preview.stat().st_size)))
