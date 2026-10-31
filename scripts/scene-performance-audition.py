"""Offline complete-sequence actual/matched A/B. No game/build import or synthesis.
Requires numpy/ffmpeg. Outputs masters/full previews outside Git; a compact
review and exact reconstruction metadata are retained in the repository.
"""
import hashlib,json,pathlib,subprocess,wave,functools
import numpy as np
root=pathlib.Path(__file__).resolve().parent.parent;out=pathlib.Path('/workspace/generated_audio/connected-scenes/mixes');out.mkdir(parents=True,exist_ok=True);rate=24000
phase=json.loads((root/'qa/media/connected-scenes.json').read_text());context=json.loads((root/'qa/editorial/connected-scenes-context.json').read_text());selected={r['id']:r for r in phase['deliveries']};sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
@functools.lru_cache(None)
def decode(path):return np.frombuffer(subprocess.check_output(['ffmpeg','-loglevel','error','-i',str(root/path),'-f','f32le','-ar',str(rate),'-ac','2','pipe:1']),dtype='<f4').reshape(-1,2).copy()
@functools.lru_cache(None)
def measure(path,gain):
 s=subprocess.run(['ffmpeg','-hide_banner','-i',str(root/path),'-af',f'volume={gain},loudnorm=I=-23.5:TP=-2:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True,check=True).stderr;d=json.JSONDecoder().raw_decode(s[s.rfind('{'):])[0];return dict(integratedLufs=float(d['input_i']),truePeakDbtp=float(d['input_tp']))
def deliver(pcm,pieces,preview):
 a=np.concatenate(pieces);assert np.isfinite(a).all()and np.max(np.abs(a))<.99
 with wave.open(str(pcm),'wb')as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(rate);f.writeframes((a*32767).astype('<i2').tobytes())
 subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(pcm),'-codec:a','libmp3lame','-b:a','96k','-map_metadata','-1',str(preview)],check=True)
 return dict(masterPath=str(pcm),masterSha256=sha(pcm),previewPath=str(preview),previewSha256=sha(preview),bytes=preview.stat().st_size,durationSeconds=len(a)/rate,peak=float(np.max(np.abs(a))))
rows=[];compact=[];compactRows=[];compactOffset=0;compactSeen=set()
for group in context['groups']:
 for mode in ['actual','loudness-matched']:
  pieces=[];stages=[];offset=0
  for stage in group['stages']:
   versions=[];pair=[]
   for version in ['before','current']:
    clips=[];voiceParts=[];position=0
    for line in stage['lines']:
     pick=selected.get(line['id']) if version=='current'else None;path=pick['path']if pick else line['beforePath'];gain=pick['sourceGain']if pick else line['beforeSourceGain'];assert sha(root/path)==(pick['sha256']if pick else line['beforeSha256']);stats=measure(path,gain);matchGain=10**((-23.5-stats['integratedLufs'])/20)if mode=='loudness-matched'else 1
     if line['pauseBeforeMs']:voiceParts.append(np.zeros((round(rate*line['pauseBeforeMs']/1000),2),dtype=np.float32));position+=round(rate*line['pauseBeforeMs']/1000)
     voice=decode(path)*(gain*matchGain*.7);voiceParts.append(voice);clips.append(dict(id=line['id'],speaker=line['speaker'],text=line['text'],path=path,sha256=sha(root/path),sourceGain=gain,comparisonOnlyGain=matchGain,startSeconds=position/rate,durationSeconds=len(voice)/rate,sourcePlayback=stats));position+=len(voice)
    voice=np.concatenate(voiceParts);s=stage['sound'];music='public/audio/'+('theme'if s['mood']=='street'else'theme-'+s['mood'])+'.flac';room='public/audio/ambience-'+s['district']+'.flac';fg=stage['bedGains'];bed=np.resize(decode(music),voice.shape)*(.5*.6*.22*fg['music'])+np.resize(decode(room),voice.shape)*(.35*.5*.44*fg['ambience']);mix=voice+bed;vrms=float(np.sqrt(np.mean(voice**2)));brms=float(np.sqrt(np.mean(bed**2)));versions.append(dict(version=version,startSeconds=offset/rate,durationSeconds=len(mix)/rate,clips=clips,voiceRms=vrms,bedRms=brms,speechToBedRmsDb=20*float(np.log10(vrms/brms)),peak=float(np.max(np.abs(mix)))));pieces.extend([mix,np.zeros((rate,2),dtype=np.float32)]);pair.extend([mix,np.zeros((rate,2),dtype=np.float32)]);offset+=len(mix)+rate
   stages.append(dict(scene=stage['scene'],step=stage['step'],route=group['route'],sound=stage['sound'],musicPath=music,musicSha256=sha(root/music),ambiencePath=room,ambienceSha256=sha(root/room),versions=versions))
   chosen=[l['id']for l in stage['lines']if l['id']in selected]
   key=(mode,tuple(chosen))
   if chosen and key not in compactSeen:
    compactSeen.add(key);compactRows.append(dict(mode=mode,group=group['id'],scene=stage['scene'],startSeconds=compactOffset/rate,selectedIds=chosen,versions=versions));compact.extend(pair);compactOffset+=sum(len(v)for v in pair)
  delivery=deliver(out/(group['id']+'-'+mode+'.wav'),pieces,out/(group['id']+'-'+mode+'.mp3'));rows.append(dict(group=group['id'],mode=mode,stages=stages,**delivery));print(json.dumps(dict(group=group['id'],mode=mode,seconds=delivery['durationSeconds'])),flush=True)
preview=root/'qa/editorial/connected-scenes-audition.mp3';summary=deliver(out/'compact.wav',compact,preview);summary['previewPath']=str(preview.relative_to(root))
result=dict(version=1,method='Five complete legal-route dialogue sequences, every line and repeated stage retained. Before/current pairs at actual settled runtime gains and separately at per-clip loudness-matched-23.5LUFS. Exact delivered music/ambience, runtime focus and source gains, default Voice70/Music60/Ambience50, music/ambience source .5/.35, speech duck .22/.44 and actual scene/actor pauses. One-second A/B separators are review-only.',limitations='Offline settled-gain approximation omits browser fades, transition/download delays and hardware. Matching applies a constant comparison-only gain before the normal voice slider. Full PCM masters/previews retained outside Git and exactly reconstructible from retained repo deliveries/context/driver. Broadband RMS is not intelligibility or acting acceptance. Unprompted ASR/signal checks are technical evidence; no human/blind/physical-device/independent listening score is claimed.',groups=rows,compact=dict(**summary,intervals=compactRows),fallback=dict(id='voice-campaign-kerr-899d4ba5ecfb',gain=selected['voice-campaign-kerr-899d4ba5ecfb']['fallbackGain'],playback=measure(selected['voice-campaign-kerr-899d4ba5ecfb']['fallbackPath'],selected['voice-campaign-kerr-899d4ba5ecfb']['fallbackGain'])))
(root/'qa/media/connected-scenes-mix.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(dict(groups=5,stages=sum(len(g['stages'])for g in context['groups']),comparisons=10,compactSeconds=summary['durationSeconds'],fallback=result['fallback'])),flush=True)
