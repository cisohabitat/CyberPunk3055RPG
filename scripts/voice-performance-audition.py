"""Offline directed-voice and scene-mix comparison; never run by the game/build.
Requires numpy and ffmpeg. Run from the repository root.
Intervals separate a replaced delivery from mix and room changes. New Mara/Kerr
quotations had no prior spoken performance; their paired mixes use the SAME clip.
"""
import hashlib, json, pathlib, subprocess, tempfile, wave
import numpy as np

root = pathlib.Path(__file__).resolve().parent.parent
baseline = '4ffec648b61e9983f6421cc08ce61110d56ad471'
mix = json.loads((root / 'qa/media/voice-mix.json').read_text())
rate = 24000
rows, pieces = [], []

def read(path):
    with wave.open(str(path)) as source:
        assert source.getnchannels() == 1 and source.getsampwidth() == 2
        samples = np.frombuffer(source.readframes(source.getnframes()), dtype='<i2').astype(np.float64) / 32767
        source_rate = source.getframerate()
    if source_rate != rate:
        samples = np.interp(np.arange(round(len(samples) * rate / source_rate)) * source_rate / rate, np.arange(len(samples)), samples)
    return samples

def rms(samples):
    return float(np.sqrt(np.mean(samples ** 2)))

def add(label, voice_path, district=None, duck=None):
    voice = read(voice_path) * .7
    room = np.zeros_like(voice); music = np.zeros_like(voice)
    sources = {str(voice_path.name): hashlib.sha256(voice_path.read_bytes()).hexdigest()}
    if district:
        for name, level, destination in [('theme-quiet', .6 * .5 * duck['music'], music), (f'ambience-{district}', .5 * .35 * duck['ambience'], room)]:
            path = root / f'public/audio/{name}.wav'
            destination[:] = np.resize(read(path), len(voice)) * level
            sources[path.name] = hashlib.sha256(path.read_bytes()).hexdigest()
    samples = voice + room + music
    assert np.isfinite(samples).all() and np.max(np.abs(samples)) < 1
    start = sum(len(piece) for piece in pieces) / rate
    rows.append(dict(label=label, startSeconds=start, durationSeconds=len(samples)/rate, sourceSha256=sources, district=district, speechDuck=duck,
                     peak=float(np.max(np.abs(samples))), voiceRms=rms(voice), musicRms=rms(music), ambienceRms=rms(room), bedRms=rms(music+room)))
    pieces.extend([samples, np.zeros(rate)])

with tempfile.TemporaryDirectory() as folder:
    folder = pathlib.Path(folder)
    original = subprocess.check_output(['git', 'show', f'{baseline}:public/audio/voice-lumen-staying.wav'], cwd=root)
    previous = folder / 'voice-lumen-staying-previous.wav'; previous.write_bytes(original)
    out = root / 'qa/media/voice-performance-baseline'; out.mkdir(exist_ok=True)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', str(previous), '-codec:a', 'libmp3lame', '-b:a', '96k', str(out / 'voice-lumen-staying.mp3')], check=True)
    paths = {name: root / f'public/audio/voice-{name}.wav' for name in ['lumen-staying', 'mara-company', 'kerr-personal']}
    add('Lumen / previous delivery, dry default voice gain', previous)
    for name, path in paths.items():
        add(name + ' / directed delivery, dry default voice gain', path)
    old = dict(music=.4, ambience=.4)
    add('Lumen / previous delivery and previous clinic mix', previous, 'clinic', old)
    add('Lumen / directed delivery, previous clinic mix', paths['lumen-staying'], 'clinic', old)
    add('Lumen / directed delivery, revised clinic mix', paths['lumen-staying'], 'clinic', mix['speechDuck'])
    for name in ['mara-company', 'kerr-personal']:
        district = 'clinic' if name == 'mara-company' else 'ward'
        add(name + ' / same directed clip, previous mix and room', paths[name], district, old)
        add(name + ' / same directed clip, revised mix and same room', paths[name], district, mix['speechDuck'])
    add('Kerr / same directed clip, revised mix and closer stall room', paths['kerr-personal'], 'stall', mix['speechDuck'])
    samples = np.concatenate(pieces); path = folder / 'audition.wav'
    with wave.open(str(path), 'wb') as target:
        target.setnchannels(1); target.setsampwidth(2); target.setframerate(rate)
        target.writeframes((samples * 32767).astype('<i2').tobytes())
    preview = root / 'qa/media/voice-performance-preview.mp3'
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', str(path), '-codec:a', 'libmp3lame', '-b:a', '96k', str(preview)], check=True)
    manifest = dict(baselineRevision=baseline, previewSha256=hashlib.sha256(preview.read_bytes()).hexdigest(), rows=rows,
                    mix='Offline approximation of settled default buses: voice .7, quiet music .6*.5*duck, room .5*.35*duck. Dry intervals retain default voice gain. Runtime attack/release automation is verified separately.',
                    runtimeMix=mix, limitations='Source/signal comparison and labeled audition. Technical headroom does not establish perceptual comfort or emotional improvement. No human listening, physical-device, commissioned performance or rights acceptance claimed.')
    (root / 'qa/media/voice-performance-audition.json').write_text(json.dumps(manifest, indent=2)+'\n')
print(json.dumps({'intervals':len(rows), 'seconds':len(samples)/rate, 'peak':float(np.max(np.abs(samples)))}))
