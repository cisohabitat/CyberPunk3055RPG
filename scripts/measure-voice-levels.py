"""Optional offline EBU-R128 playback mastering; never imported by game/build.
Measure all bound delivery bytes and apply a constant gain per clip. No dynamics,
words, pauses or audio files are changed. The player's slider remains separate.
Usage: python scripts/measure-voice-levels.py [--workers 4]
"""
import argparse, concurrent.futures, hashlib, json, math, pathlib, subprocess
parser=argparse.ArgumentParser();parser.add_argument('--workers',type=int,default=4);args=parser.parse_args()
assert 1<=args.workers<=8
root=pathlib.Path(__file__).resolve().parent.parent; media=root/'qa/media'
bindings=json.loads((media/'campaign-dialogue-bindings.json').read_text()); ids=sorted(set(b['id'] for b in bindings))
target=-23.5; ceiling=-1.5

def stats(path,filters):
 result=subprocess.run(['ffmpeg','-hide_banner','-i',str(path),'-af',filters+',loudnorm=I=-23.5:TP=-1.5:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True,check=True).stderr
 row=json.JSONDecoder().raw_decode(result[result.rfind('{'):])[0]
 return dict(integratedLufs=float(row['input_i']),truePeakDbtp=float(row['input_tp']))

def measure(id):
 path=root/'public/audio'/f'{id}.{ "mp3" if id.startswith("voice-campaign-") else "wav"}'
 before=stats(path,'anull'); assert all(math.isfinite(n) for n in before.values())
 trim=round(target-before['integratedLufs'],2);assert -12<=trim<=6
 # EBU gating can select a different block after attenuation; correct the
 # measured output, not just a predicted decibel difference.
 candidates=[]
 for attempt in range(6):
  assert -12<=trim<=6
  gain=round(10**(trim/20),8)
  after=stats(path,f'volume={gain}')
  candidates.append((trim,gain,after))
  if abs(after['integratedLufs']-target)<=.03:break
  trim=round(trim+target-after['integratedLufs'],2)
 trim,gain,after=min(candidates,key=lambda row:abs(row[2]['integratedLufs']-target))
 # Very short phrases can straddle an EBU gate; retain the closest measured
 # gain without changing the performance to force a meter reading.
 assert abs(after['integratedLufs']-target)<=.25, (id,after)
 assert after['truePeakDbtp']<=ceiling, (id,after)
 return dict(id=id,path=str(path.relative_to(root)),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),source=before,trimDb=trim,gain=gain,playback=after)

with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:rows=list(pool.map(measure,ids))
levels={r['id']:r['gain'] for r in rows}
(media/'voice-levels.json').write_text(json.dumps(levels,indent=2)+'\n')
manifest=dict(version=1,targetLufs=target,truePeakCeilingDbtp=ceiling,method='ffmpeg EBU-R128 measurement of exact decoded deliveries; per-clip constant gain; independently measured post-trim signal. No compression, limiting, silence removal or audio file rewrite. Applies before the separate user voice-volume bus.',source='scripts/measure-voice-levels.py',runtimeMapSha256=hashlib.sha256((media/'voice-levels.json').read_bytes()).hexdigest(),bindingSha256=hashlib.sha256((media/'campaign-dialogue-bindings.json').read_bytes()).hexdigest(),clips=rows)
(media/'voice-mastering.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(dict(count=len(rows),sourceMinLufs=min(r['source']['integratedLufs'] for r in rows),sourceMaxLufs=max(r['source']['integratedLufs'] for r in rows),playbackMinLufs=min(r['playback']['integratedLufs'] for r in rows),playbackMaxLufs=max(r['playback']['integratedLufs'] for r in rows),maxPlaybackTruePeak=max(r['playback']['truePeakDbtp'] for r in rows))))
