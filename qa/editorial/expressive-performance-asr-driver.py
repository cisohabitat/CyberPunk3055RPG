import json,pathlib,re,hashlib,sys
from faster_whisper import WhisperModel
root=pathlib.Path('/workspace/saint-shard-fix');m=WhisperModel('/tmp/saint-phase12/asr-models/models--Systran--faster-whisper-base.en/snapshots',device='cpu',compute_type='int8',cpu_threads=4) if False else WhisperModel('base.en',device='cpu',compute_type='int8',download_root='/tmp/saint-phase12/asr-models',local_files_only=True,cpu_threads=4)
norm=lambda s:re.findall('[a-z0-9]+',s.lower().replace("'",'').replace('’',''))
folder=pathlib.Path(sys.argv[1]);output=pathlib.Path(sys.argv[2]);rows=[]
for l in json.loads((root/'qa/media/expressive-performance-lines.json').read_text()):
 p=folder/(l['id']+'.mp3')
 if not p.exists():continue
 segments,info=m.transcribe(str(p),language='en',beam_size=5,condition_on_previous_text=False,word_timestamps=True)
 ss=list(segments);text=' '.join(s.text.strip()for s in ss);rows.append(dict(id=l['id'],text=l['text'],path=str(p),transcription=text,exactNormalizedWords=norm(text)==norm(l['text']),sha256=hashlib.sha256(p.read_bytes()).hexdigest(),durationSeconds=info.duration,words=[dict(word=w.word,start=w.start,end=w.end)for s in ss for w in s.words]));print(json.dumps({k:v for k,v in rows[-1].items()if k!='words'}),flush=True)
output.write_text(json.dumps(dict(model='faster-whisper base.en',method='Unprompted CPU int8, beam5, no initial prompt, no conditioning on previous text; lowercase/apostrophe/punctuation normalization only',lines=rows),indent=2)+'\n')
