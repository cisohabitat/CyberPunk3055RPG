// Original procedural mechanical textures. No recordings or third-party samples.
export const FOLEY_RATE = 22050;
export function renderSceneFoley() {
  function cue(seconds, seed, clicks, hum, glass = 0) {
    const samples = new Float32Array(Math.round(seconds * FOLEY_RATE));
    let random = seed >>> 0, low = 0, slow = 0;
    const next = () => { random ^= random << 13; random ^= random >>> 17; random ^= random << 5; return (random >>> 0) / 4294967296 * 2 - 1; };
    for (let i = 0; i < samples.length; i++) {
      const t = i / FOLEY_RATE, noise = next(); low += .12 * (noise - low); slow += .008 * (noise - slow);
      const bed = Math.sin(Math.PI * t / seconds) ** 2;
      let value = (low - slow) * .018 * bed + Math.sin(2 * Math.PI * hum * t) * .018 * bed;
      for (const [at, strength, pitch] of clicks) {
        const age = t - at;
        if (age >= 0 && age < .18) {
          const attack = Math.min(1, age / .004);
          value += attack * Math.exp(-age * 45) * (noise * .13 + Math.sin(2 * Math.PI * pitch * age) * .08) * strength;
        }
      }
      if (glass) value += Math.sin(2 * Math.PI * glass * t) * Math.exp(-t * 8) * .025 * Math.min(1, t / .015);
      const edge = Math.min(1, i / (FOLEY_RATE * .008), (samples.length - 1 - i) / (FOLEY_RATE * .025));
      samples[i] = value * (.5 - .5 * Math.cos(Math.PI * Math.max(0, edge)));
    }
    return samples;
  }
  return {
    'foley-viewer': cue(.92, 305561, [[.07,.7,430],[.22,.35,620]], 92, 1160),
    'foley-reader': cue(1.28, 305562, [[.06,.8,190],[.23,.5,280],[.49,.35,230]], 118),
    'foley-case': cue(.76, 305563, [[.08,.65,145],[.25,.4,210]], 58),
    'foley-recorder': cue(1.44, 305564, [[.12,.8,175]], 74),
  };
}
