"""Offline four-sequence A/B proxy; never loaded by the game. Requires numpy and ffmpeg.
Static speech-duck mix comparison, not a browser crossfade simulation or listening acceptance.
"""
import argparse, hashlib, json, pathlib, subprocess, wave
import numpy as np
p=argparse.ArgumentParser();p.add_argument('--spec',default='qa/media/cinematic-mix-spec.json');p.add_argument('--out',default='qa/media/cinematic-mix-review.json');p.add_argument('--masters',default='/workspace/generated_audio/cinematic-phase5');args=p.parse_args()
root=pathlib.Path(__file__).resolve().parent.parent;masters=pathlib.Path(args.masters);masters.mkdir(parents=True,exist_ok=True);rate=24000
sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
def decode(path):
 return np.frombuffer(subprocess.run(['ffmpeg','-loglevel','error','-i',str(path),'-f','f32le','-ar',str(rate),'-ac','1','pipe:1'],capture_output=True,check=True).stdout,dtype='<f4').copy()
def rms(v):return float(np.sqrt(np.mean(v*v)))
rows=[]
for sample in json.loads((root/args.spec).read_text()):
 clips=[]
 for line in sample['lines']:
  path=root/line['path'];assert sha(path)==line['sha256'];clips.append(decode(path)*line['level']*.7)
 music=decode(root/sample['musicPath']);ambient=decode(root/sample['ambiencePath']);versions=[]
 for version,focus,pause in [('before',sample['beforeFocus'],sample['pauseBefore']),('directed',sample['afterFocus'],sample['pauseAfter'])]:
  pieces=[];offsets=[];length=0
  for i,clip in enumerate(clips):
   if i:
    gap=pause['sameSpeakerMs'] if sample['lines'][i]['speaker']==sample['lines'][i-1]['speaker'] else pause['changedSpeakerMs'];padding=np.zeros(round(rate*gap/1000),dtype=np.float32);pieces.append(padding);length+=len(padding)
   offsets.append(length/rate);pieces.append(clip);length+=len(clip)
  voice=np.concatenate(pieces);bed=np.resize(music,len(voice))*.5*.6*.22*focus['music']+np.resize(ambient,len(voice))*.35*.5*.44*focus['ambience'];mix=voice+bed;assert np.isfinite(mix).all() and np.max(np.abs(mix))<.99
  path=masters/f"{sample['sceneId']}-{version}.wav"
  with wave.open(str(path),'wb')as out:out.setnchannels(1);out.setsampwidth(2);out.setframerate(rate);out.writeframes((mix*32767).astype('<i2').tobytes())
  versions.append({'version':version,'sourceFile':str(path),'sha256':sha(path),'durationSeconds':len(mix)/rate,'lineStartSeconds':offsets,'voiceRmsWithoutGaps':rms(np.concatenate(clips)),'bedRms':rms(bed),'peak':float(np.max(np.abs(mix)))})
 row={'sceneId':sample['sceneId'],'route':sample['route'],'lines':sample['lines'],'musicPath':sample['musicPath'],'musicSha256':sha(root/sample['musicPath']),'ambiencePath':sample['ambiencePath'],'ambienceSha256':sha(root/sample['ambiencePath']),'versions':versions,'bedChangeDb':20*float(np.log10(versions[1]['bedRms']/versions[0]['bedRms']))};assert row['bedChangeDb']<0;rows.append(row)
result={'method':'Offline mono 24 kHz static speech-duck A/B proxy using actual delivered voices/music/ambience. Current default sliders, source gains and speech-duck multipliers; excludes attack/release ramps, browser crossfades, network and room playback. Voice samples and gain identical; only gaps and bed focus vary.','sourcePolicy':'qa/media/cinematic-mix-spec.json; production timing/mix separately observed in browser checks.','limitations':'Technical comparison, not independent human intelligibility, performance or acting acceptance. Original and comparison PCM retained outside Git.','samples':rows};(root/args.out).write_text(json.dumps(result,indent=2)+'\n');print(json.dumps([{'sceneId':r['sceneId'],'bedChangeDb':r['bedChangeDb']}for r in rows]))
