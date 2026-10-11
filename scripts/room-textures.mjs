// Original periodic room synthesis. No recordings or third-party samples.
// Warm up the low-pass filter over two complete periods so noise wraps continuously.
const rate = 22050, seconds = 64, length = rate * seconds;
function texture(seed, air, hum, drops) {
  let random = seed >>> 0;
  const next = () => { random ^= random << 13; random ^= random >>> 17; random ^= random << 5; return (random >>> 0) / 4294967296; };
  const noise = Float32Array.from({ length }, () => next() * 2 - 1);
  const samples = new Float32Array(length);
  let low = 0, slow = 0;
  for (let pass = 0; pass < 3; pass++) for (let i = 0; i < length; i++) {
    low += .18 * (noise[i] - low); slow += .006 * (noise[i] - slow);
    if (pass === 2) {
      const t = i / rate, swell = .82 + .18 * Math.cos(2 * Math.PI * t / seconds);
      samples[i] = (low - slow) * air * swell + Math.sin(2 * Math.PI * hum * t) * .009
        + Math.sin(2 * Math.PI * (hum * 2) * t) * .003;
    }
  }
  for (let n = 0; n < drops; n++) {
    const start = Math.floor(next() * length), frequency = 330 + next() * 850;
    const gain = .025 + next() * .025, duration = Math.floor(rate * .18);
    for (let i = 0; i < duration; i++) {
      const t = i / rate, envelope = Math.sin(Math.PI * i / duration) ** 2 * Math.exp(-t * 32);
      samples[(start + i) % length] += Math.sin(2 * Math.PI * frequency * t) * envelope * gain;
    }
  }
  // Match waveform endpoints gently over 20ms, without fading the room to silence.
  const correction = samples[0] - samples[length - 1], edge = Math.floor(rate * .02);
  for (let i = 0; i < edge; i++) samples[length - edge + i] += correction * (.5 - .5 * Math.cos(Math.PI * i / (edge - 1)));
  return { rate, channels: [samples] };
}
export function renderRoomTextures() {
  return {
    "ambience-clinic": texture(305501, .065, 50, 18),
    "ambience-witness": texture(305502, .08, 40, 35),
    "ambience-stall": texture(305503, .12, 60, 70),
  };
}
