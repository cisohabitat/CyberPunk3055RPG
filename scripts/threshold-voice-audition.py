"""Offline source metrics and indexed audition for the threshold voice cycle.
Run AFTER generate-voices.py --only the ids in qa/media/threshold-art-voice.json.
Requires numpy and ffmpeg; never run by the game, CI or build.
"""
import hashlib, json, pathlib, subprocess, tempfile, wave
import numpy as np
root = pathlib.Path(__file__).resolve().parent.parent
cycle = json.loads((root / 'qa/media/threshold-art-voice.json').read_text())
provenance_path = root / 'qa/media/voice-provenance.json'
provenance = json.loads(provenance_path.read_text())
lines = {line['id']: line for line in json.loads((root / 'qa/media/voice-lines.json').read_text())}
for name, expected in cycle['preservedDeliverySha256'].items():
    assert hashlib.sha256((root / f'public/audio/{name}.wav').read_bytes()).hexdigest() == expected
intervals, pieces, records = [], [], []
for selected in cycle['voiceAdditions']:
    line = lines[selected['id']]
    master = pathlib.Path('/workspace/generated_audio/threshold-art-voice') / (line['id'] + '.wav')
    delivery = root / f'public/audio/{line["id"]}.wav'
    with wave.open(str(delivery)) as source:
        assert source.getnchannels() == 1 and source.getsampwidth() == 2 and source.getframerate() == 24000
        samples = np.frombuffer(source.readframes(source.getnframes()), dtype='<i2').astype(np.float64) / 32767
    peak = float(np.max(np.abs(samples))); duration = len(samples) / 24000
    assert .7 <= peak < .73 and 2 < duration < 20
    assert np.isfinite(samples).all() and (samples[:1800] == 0).all() and (samples[-1800:] == 0).all()
    digest = hashlib.sha256(delivery.read_bytes()).hexdigest()
    records.append(dict(**line, generated=cycle['generated'], direction=selected['direction'], language='en-us',
        path=str(delivery.relative_to(root)), sourceFile=str(master), sourceSha256=hashlib.sha256(master.read_bytes()).hexdigest(),
        sha256=digest, bytes=delivery.stat().st_size, sampleRate=24000, channels=1, bits=16,
        durationSeconds=duration, peak=peak, rms=float(np.sqrt(np.mean(samples ** 2)))))
    start = sum(len(piece) for piece in pieces) / 24000
    intervals.append(dict(id=line['id'], scene=line['scene'], speaker=line['speaker'], direction=selected['direction'],
        text=line['text'], startSeconds=start, endSeconds=start+duration, sha256=digest))
    pieces.extend([samples, np.zeros(24000)])
ids = {row['id'] for row in records}
provenance['lines'] = [row for row in provenance['lines'] if row['id'] not in ids] + records
provenance['generated'] = cycle['generated']
provenance['reviewStatus'] = 'One hundred and one fixed stock synthetic quotations. Twelve additions for Nia, Kerr, Mara and Sera. All preceding eighty-nine deliveries unchanged; nine established stock cast styles. Authored route, exact speaker/text, signal and native playback checks; no commissioned actor or independent listening acceptance.'
provenance_path.write_text(json.dumps(provenance, indent=2)+'\n')
with tempfile.TemporaryDirectory() as folder:
    wav = pathlib.Path(folder) / 'audition.wav'
    with wave.open(str(wav), 'wb') as target:
        target.setnchannels(1); target.setsampwidth(2); target.setframerate(24000)
        target.writeframes((np.concatenate(pieces) * 32767).astype('<i2').tobytes())
    preview = root / 'qa/media/threshold-voice-preview.mp3'
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', str(wav), '-codec:a', 'libmp3lame', '-b:a', '96k', str(preview)], check=True)
manifest = dict(disclosure='Fixed stock synthetic voices, exact delivered clips with one-second gaps. Technical audition, not perceptual acceptance.',
    delivery=str(preview.relative_to(root)), sha256=hashlib.sha256(preview.read_bytes()).hexdigest(), intervals=intervals)
(root / 'qa/media/threshold-voice-audition.json').write_text(json.dumps(manifest, indent=2)+'\n')
review = root / 'qa/media/review.html'
html = review.read_text(); marker='<section id="threshold-voices">'
if marker in html: html=html[:html.index(marker)] + html[html.index('</section>',html.index(marker))+10:]
from html import escape
section=marker+'<h2>Private terms and the memorial</h2><p>Twelve fixed stock synthetic quotations using the four speakers’ established voice identities. Each paragraph remains available in silent play.</p><audio controls preload="none" src="threshold-voice-preview.mp3"></audio>'
for row in intervals:
    section += f'<h3>{escape(row["speaker"])} · {escape(row["scene"])}</h3><p>{escape(row["direction"])}</p><p>{escape(row["text"])}</p><audio controls preload="none" src="../../public/audio/{row["id"]}.wav"></audio>'
review.write_text(html.replace('</main>',section+'</section></main>'))
print(json.dumps(dict(additions=len(records), preserved=len(cycle['preservedDeliverySha256']), total=len(provenance['lines']), seconds=sum(len(p) for p in pieces)/24000)))
