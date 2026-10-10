"""Optional offline generation: pip install kokoro-onnx==0.6.1 soundfile.
Run with --model and --voices pointing to Kokoro v1.0 weights/style vectors.
Model URLs/licenses/expected hashes are recorded in qa/media/voice-provenance.json.
This is never run by CI, builds, or the game. No player text is synthesized.
"""
import argparse, hashlib, json, pathlib, wave
import numpy as np
import onnxruntime as ort
ort.disable_telemetry_events()
from kokoro_onnx import Kokoro

parser = argparse.ArgumentParser()
parser.add_argument('--model', required=True)
parser.add_argument('--voices', required=True)
parser.add_argument('--masters', default='/workspace/generated_audio')
parser.add_argument('--only', nargs='+', help='Generate only these authored line ids; leave other delivery clips intact')
args = parser.parse_args()
root = pathlib.Path(__file__).resolve().parent.parent
lines = json.loads((root / 'qa/media/voice-lines.json').read_text())
if args.only:
    assert set(args.only) <= {line['id'] for line in lines}, 'Unknown authored line id'
    lines = [line for line in lines if line['id'] in args.only]
provenance = root / 'qa/media/voice-provenance.json'
if provenance.exists():
    expected = {file['name']: file['sha256'] for file in json.loads(provenance.read_text())['model']['files']}
    for path in [pathlib.Path(args.model), pathlib.Path(args.voices)]:
        assert hashlib.sha256(path.read_bytes()).hexdigest() == expected[path.name], 'Unexpected voice model/style vectors'
model = Kokoro(args.model, args.voices)
masters = pathlib.Path(args.masters)
masters.mkdir(parents=True, exist_ok=True)
for line in lines:
    samples, rate = model.create(line['text'], voice=line['voice'], speed=line['speed'], lang='en-us')
    assert np.isfinite(samples).all() and len(samples) > rate
    master = masters / (line['id'] + '.wav')
    def write(path, data):
        with wave.open(str(path), 'wb') as out:
            out.setnchannels(1); out.setsampwidth(2); out.setframerate(rate)
            out.writeframes((np.clip(data, -1, 1) * 32767).astype('<i2').tobytes())
    write(master, samples)
    # Retain the generated master; delivery gains headroom and short silent edges.
    peak = np.max(np.abs(samples))
    delivery = samples * (0.72 / peak)
    fade = min(int(rate * .008), len(delivery) // 2)
    delivery[:fade] *= np.linspace(0, 1, fade)
    delivery[-fade:] *= np.linspace(1, 0, fade)
    delivery = np.pad(delivery, int(rate * .08))
    write(root / 'public/audio' / (line['id'] + '.wav'), delivery)
    print(json.dumps({'id':line['id'], 'seconds':len(delivery)/rate, 'rate':rate, 'master':str(master)}), flush=True)
