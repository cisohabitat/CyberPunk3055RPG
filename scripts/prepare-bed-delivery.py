"""Optional offline lossless bed delivery; requires ffmpeg. Never run by CI/builds."""
import gzip, hashlib, json, pathlib, subprocess, wave
root = pathlib.Path(__file__).resolve().parent.parent
records = []
for source in sorted((root / 'public/audio').glob('*.wav')):
    if source.stem != 'theme' and not source.stem.startswith(('theme-', 'ambience-')):
        continue
    delivery = source.with_suffix('.flac')
    order = 24 if source.stem == 'ambience-street' else 32
    options = ['-compression_level', '12', '-lpc_type', 'cholesky', '-lpc_passes', '2', '-min_prediction_order', str(order), '-max_prediction_order', str(order), '-frame_size', '16384', '-metadata_header_padding', '0']
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(source), *options, str(delivery)], check=True)
    with wave.open(str(source)) as audio:
        pcm = audio.readframes(audio.getnframes())
        rate, channels = audio.getframerate(), audio.getnchannels()
    decoded = subprocess.check_output(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', str(delivery), '-f', 's16le', '-'])
    assert decoded == pcm, 'Lossless delivery must preserve every PCM sample'
    transport = delivery.with_suffix('.flac.gz')
    transport.write_bytes(gzip.compress(delivery.read_bytes(), compresslevel=9, mtime=0))
    record = dict(name=source.stem, source=str(source.relative_to(root)), sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(), delivery=str(delivery.relative_to(root)), sha256=hashlib.sha256(delivery.read_bytes()).hexdigest(), bytes=delivery.stat().st_size, transport=str(transport.relative_to(root)), transportSha256=hashlib.sha256(transport.read_bytes()).hexdigest(), transportBytes=transport.stat().st_size, pcmSha256=hashlib.sha256(pcm).hexdigest(), pcmBytes=len(pcm), sampleRate=rate, channels=channels, options=options)
    records.append(record)
    print(json.dumps({'name':source.stem,'bytes':record['transportBytes'],'pcmUnchanged':True}), flush=True)
(root / 'qa/media/bed-delivery.json').write_text(json.dumps({'processing':'Lossless FLAC plus deterministic gzip HTTP transport. Existing WAV masters and every decoded PCM sample remain unchanged. Before-file rewrites and Content-Encoding serve gzip at the FLAC URL.', 'source':'scripts/prepare-bed-delivery.py', 'ffmpeg':subprocess.check_output(['ffmpeg','-version'],text=True).splitlines()[0], 'beds':records},indent=2)+'\n')
