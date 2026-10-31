"""Offline connected Sera context preview. Not imported by the game/build.
Settled normal-focus gains only; not hardware/perceptual or level-matched evidence.
"""
import hashlib,json,pathlib,subprocess,wave
import numpy as np
root=pathlib.Path(__file__).resolve().parent.parent
contexts=json.loads((root/'qa/editorial/dramatic-beats-audition-context.json').read_text())
rate=24000;rows=[];pieces=[];offset=0
out=pathlib.Path('/workspace/generated_audio/dramatic-beats/mixes');out.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def decode(p):return np.frombuffer(subprocess.check_output(['ffmpeg','-loglevel','error','-i',str(p),'-f','f32le','-ar',str(rate),'-ac','2','pipe:1']),dtype='<f4').reshape(-1,2).copy()
for stageIndex,s in enumerate(contexts):
 voices=[];clips=[];pos=0
 for i,line in enumerate(s['lines']):
  path=root/line['path'];voice=decode(path)*(.7*line['sourceGain']);clips.append(dict(**line,sha256=sha(path),startSeconds=pos/rate,durationSeconds=len(voice)/rate));voices.append(voice);pos+=len(voice)
  if i<len(s['lines'])-1:voices.append(np.zeros((round(rate*.12),2),dtype=np.float32));pos+=round(rate*.12)
 if not voices:continue
 voice=np.concatenate(voices);music=root/("public/audio/theme.flac" if s['sound']['mood']=='street' else f"public/audio/theme-{s['sound']['mood']}.flac");room=root/f"public/audio/ambience-{s['sound']['district']}.flac"
 bed=np.resize(decode(music),voice.shape)*(.5*.6*.22)+np.resize(decode(room),voice.shape)*(.35*.5*.44)
 mixed=voice+bed;assert np.isfinite(mixed).all()and np.max(np.abs(mixed))<.99
 pcm=out/(f'{stageIndex:03d}-'+s['route']+'-'+s['scene']+'.wav')
 with wave.open(str(pcm),'wb')as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(rate);f.writeframes((mixed*32767).astype('<i2').tobytes())
 rows.append(dict(**s,clips=clips,startSeconds=offset/rate,durationSeconds=len(mixed)/rate,musicPath=str(music.relative_to(root)),musicSha256=sha(music),ambiencePath=str(room.relative_to(root)),ambienceSha256=sha(room),masterPath=str(pcm),masterSha256=sha(pcm),peak=float(np.max(np.abs(mixed))),voiceRms=float(np.sqrt(np.mean(voice**2))),bedRms=float(np.sqrt(np.mean(bed**2)))))
 pieces.extend([mixed,np.zeros((rate,2),dtype=np.float32)]);offset+=len(mixed)+rate
samples=np.concatenate(pieces);master=out/'complete.wav'
with wave.open(str(master),'wb')as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(rate);f.writeframes((samples*32767).astype('<i2').tobytes())
preview=root/'qa/editorial/dramatic-beats-audition.mp3';subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(master),'-codec:a','libmp3lame','-b:a','96k','-map_metadata','-1',str(preview)],check=True)
result=dict(method=f'Quill agreement/refusal and three Edda extraction sequences, {len(rows)} complete spoken stages including actual repeated inspections and later signed-shift response; actual delivered clips and actual planned music and room ambience. Settled normal-focus approximation: Voice70/Music60/Ambience50, source gains from runtime, music/room source .5/.35, speech duck .22/.44, 120ms same-speaker gaps and one-second stage separators.',limitations='Offline preview omits browser fades, download timing and hardware. Original account recordings and new-23.5LUFS clips are not level matched. No independent listening/acting score or comprehension finding is inferred.',previewPath=str(preview.relative_to(root)),previewSha256=sha(preview),bytes=preview.stat().st_size,durationSeconds=len(samples)/rate,scenes=rows)
(root/'qa/editorial/dramatic-beats-audition.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(dict(stages=len(rows),seconds=len(samples)/rate,bytes=preview.stat().st_size)))
