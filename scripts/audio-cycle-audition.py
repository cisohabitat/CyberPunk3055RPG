"""Offline before/after audition. Requires ffmpeg; never run by build or game.
Run from the repository root: python scripts/audio-cycle-audition.py
Baseline PCM comes from the previous released Git revision, not a remote service.
"""
import hashlib, json, pathlib, subprocess, tempfile, wave
import numpy as np

root = pathlib.Path(__file__).resolve().parent.parent
baseline_revision = 'e85f1d80582a54b5ba79ec54df7600820a635b76'
out = root / 'qa/media/audio-cycle-baseline'
out.mkdir(exist_ok=True)
replacements = ['voice-quill-offer', 'voice-mara-revelation', 'voice-kerr-boundary']
lines = json.loads((root / 'qa/media/voice-lines.json').read_text())
rate = 24000
def read(path):
    with wave.open(str(path)) as source:
        assert source.getnchannels() == 1
        samples = np.frombuffer(source.readframes(source.getnframes()), dtype='<i2').astype(np.float64) / 32767
        source_rate = source.getframerate()
    if source_rate != rate:
        samples = np.interp(np.arange(round(len(samples) * rate / source_rate)) * source_rate / rate, np.arange(len(samples)), samples)
    return samples
rows, pieces = [], []
def add(label, samples, source_hash):
    start = sum(len(piece) for piece in pieces) / rate
    pieces.extend([samples, np.zeros(rate)])
    rows.append(dict(label=label, startSeconds=start, durationSeconds=len(samples)/rate, sourceSha256=source_hash))
with tempfile.TemporaryDirectory() as folder:
    folder = pathlib.Path(folder)
    for name in replacements:
        original = subprocess.check_output(['git', 'show', f'{baseline_revision}:public/audio/{name}.wav'], cwd=root)
        path = folder / f'{name}.wav'; path.write_bytes(original)
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', str(path), '-codec:a', 'libmp3lame', '-b:a', '96k', str(out / f'{name}.mp3')], check=True)
        add(name + ' / previous delivery', read(path) * .7, hashlib.sha256(original).hexdigest())
        current = root / f'public/audio/{name}.wav'
        add(name + ' / phrase delivery', read(current) * .7, hashlib.sha256(current.read_bytes()).hexdigest())
    for district in ['clinic', 'witness', 'stall']:
        path = root / f'public/audio/ambience-{district}.wav'
        add(district + ' / room excerpt at default ambience bus', read(path)[:rate*8] * .5 * .35, hashlib.sha256(path.read_bytes()).hexdigest())
    for line in lines:
        if line['id'] not in ['voice-nia-arrival', 'voice-mara-response', 'voice-mara-public-refusal', 'voice-kerr-handover-private', 'voice-kerr-handover-breached', 'voice-kerr-handover-registered']:
            continue
        path = root / f"public/audio/{line['id']}.wav"; voice = read(path)
        district = 'witness' if line['speaker'] == 'Nia Pell' else 'clinic' if line['speaker'] == 'Mara' else 'stall'
        room = read(root / f'public/audio/ambience-{district}.wav')[:len(voice)]
        music = read(root / 'public/audio/theme-quiet.wav')[:len(voice)]
        add(line['id'] + ' / default ducked scene mix', voice * .7 + room * .5 * .35 * .4 + music * .6 * .5 * .4, hashlib.sha256(path.read_bytes()).hexdigest())
    samples = np.concatenate(pieces); assert np.max(np.abs(samples)) < 1
    path = folder / 'audition.wav'
    with wave.open(str(path), 'wb') as target:
        target.setnchannels(1); target.setsampwidth(2); target.setframerate(rate); target.writeframes((samples * 32767).astype('<i2').tobytes())
    preview = root / 'qa/media/audio-cycle-preview.mp3'
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', str(path), '-codec:a', 'libmp3lame', '-b:a', '96k', str(preview)], check=True)
    manifest = dict(baselineRevision=baseline_revision, previewSha256=hashlib.sha256(preview.read_bytes()).hexdigest(), rows=rows, mix='Voice .7; music .6*.5*.4 and ambience .5*.35*.4 while speaking; room-only excerpts .5*.35. Offline approximation of settled default buses.', limitations='Source/signal comparison and audition artifact; does not constitute perceptual listening, physical-device, performance or rights acceptance.')
    (root / 'qa/media/audio-cycle-audition.json').write_text(json.dumps(manifest, indent=2)+'\n')
print(f'Wrote {len(rows)} labeled audition intervals.')
