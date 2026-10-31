"""Optional offline unprompted ASR; never imported by game/build.
Use an existing faster-whisper environment and pinned local base.en model.
No expected words are supplied to the model. Output must stay outside Git.
"""
import argparse,hashlib,json,pathlib,re
from faster_whisper import WhisperModel
p=argparse.ArgumentParser();p.add_argument('--model',required=True);p.add_argument('--folder',required=True);p.add_argument('--out',required=True);a=p.parse_args()
root=pathlib.Path(__file__).resolve().parent.parent;model=pathlib.Path(a.model).resolve();folder=pathlib.Path(a.folder).resolve();out=pathlib.Path(a.out).resolve()
assert model.is_dir() and not out.is_relative_to(root)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
model_files=[dict(path=str(p.relative_to(model)),sha256=sha(p))for p in sorted(model.rglob('*'))if p.is_file()]
m=WhisperModel(str(model),device='cpu',compute_type='int8',cpu_threads=4)
words=lambda s:re.findall('[a-z0-9]+',s.lower().replace("'",'').replace('’',''))
rows=[]
for l in json.loads((root/'qa/media/expressive-performance-lines.json').read_text()):
 path=folder/(l['id']+'.mp3')
 if not path.exists():continue
 segments,info=m.transcribe(str(path),language='en',beam_size=5,condition_on_previous_text=False,word_timestamps=True)
 segments=list(segments);text=' '.join(s.text.strip()for s in segments)
 row=dict(id=l['id'],text=l['text'],path=str(path),sha256=sha(path),transcription=text,exactNormalizedWords=words(text)==words(l['text']),durationSeconds=info.duration,words=[dict(word=w.word,start=w.start,end=w.end)for s in segments for w in s.words]);rows.append(row);print(json.dumps({k:v for k,v in row.items()if k!='words'}),flush=True)
assert rows,'No authored deliveries found'
out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(dict(method='Unprompted base.en CPU int8, beam5, no initial prompt/previous-text conditioning. Case/apostrophe/punctuation normalization only. ASR is not phonetic or acting acceptance.',modelFiles=model_files,lines=rows),indent=2)+'\n')
