"""Optional offline authoring: preserve the supplied intro and overlap its loop seam.

Requires Python/numpy and ffmpeg. Builds use the checked-in FLAC, never this script.
"""
import hashlib, json, pathlib, subprocess
import numpy as np

root = pathlib.Path(__file__).resolve().parents[1]
source = root / 'qa/media/title-music-source/under_the_awning.mp3'
output = root / 'public/audio/theme-title.flac'
source_rate, rate, overlap_seconds, gain_db = 44100, 22050, 4, -12
decoded = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(source), '-f', 'f32le', '-acodec', 'pcm_f32le', '-ar', str(source_rate), '-ac', '2', '-'])
samples = np.frombuffer(decoded, dtype='<f4').reshape(-1, 2).copy()
overlap = source_rate * overlap_seconds
assert len(samples) > overlap * 3
weights = np.linspace(0, 1, overlap, dtype=np.float32)[:, None]
samples[-overlap:] = samples[-overlap:] * (1 - weights) + samples[:overlap] * weights
samples *= 10 ** (gain_db / 20)
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(source_rate), '-ac', '2', '-i', '-', '-ar', str(rate), '-sample_fmt', 's16', '-codec:a', 'flac', '-compression_level', '12', '-metadata', 'title=Under the Awning', str(output)], input=samples.astype('<f4').tobytes(), check=True)
delivery = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(output), '-f', 'f32le', '-acodec', 'pcm_f32le', '-ar', str(rate), '-ac', '2', '-'])
audio = np.frombuffer(delivery, dtype='<f4').reshape(-1, 2)
record = {
    'title': 'Under the Awning', 'purpose': 'Optional starting-page music; separate from the existing street score.',
    'source': {'path': str(source.relative_to(root)), 'originalFilename': 'under_the_awning.mp3', 'providedBy': 'Project owner attachment, 12 October 2026', 'creatorOrGenerator': 'Not specified in the attachment', 'licenseDetails': 'Not supplied; no additional rights claim', 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'bytes': source.stat().st_size},
    'delivery': {'path': str(output.relative_to(root)), 'format': 'FLAC', 'bits': 16, 'sampleRate': rate, 'channels': 2, 'sha256': hashlib.sha256(output.read_bytes()).hexdigest(), 'bytes': output.stat().st_size, 'decodedDurationSeconds': len(audio) / rate, 'loopStartSeconds': overlap_seconds, 'loopDurationSeconds': len(audio) / rate - overlap_seconds, 'peak': float(np.max(np.abs(audio))), 'rms': float(np.sqrt(np.mean(audio * audio))), 'loopSeamJump': [float(abs(audio[-1, c] - audio[rate * overlap_seconds, c])) for c in range(2)]},
    'processing': {'script': 'scripts/prepare-title-music.py', 'gainDb': gain_db, 'tailOverlapSeconds': overlap_seconds, 'method': 'Linear overlap of the final four seconds with the opening four seconds. Original intro plays once; looping resumes at four seconds. Source MP3 is retained unchanged.', 'ffmpegVersion': subprocess.check_output(['ffmpeg', '-version'], text=True).splitlines()[0]},
    'acceptance': 'Signal and browser loop checks are technical evidence, not independent listening acceptance.'
}
(root / 'qa/media/title-music.json').write_text(json.dumps(record, indent=2) + '\n')
print(json.dumps(record['delivery']))
