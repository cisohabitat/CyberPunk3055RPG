let ctx: AudioContext | null = null;
let theme: AudioBufferSourceNode | null = null;
let rain: AudioBufferSourceNode | null = null;
let want = false;
let ticket = 0;
let pending: Promise<void> = Promise.resolve();
const cache = new Map<string, AudioBuffer>();

function context() {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

async function load(name: string) {
  const audio = context();
  const cached = cache.get(name);
  if (cached) return cached;
  const response = await fetch(`/audio/${name}.wav`);
  const raw = await response.arrayBuffer();
  const buffer = await audio.decodeAudioData(raw);
  cache.set(name, buffer);
  return buffer;
}

function stopBed() {
  theme?.stop();
  rain?.stop();
  theme = null;
  rain = null;
}

function source(buffer: AudioBuffer, gainValue: number) {
  const audio = context();
  const node = audio.createBufferSource();
  const gain = audio.createGain();
  node.buffer = buffer;
  node.loop = true;
  gain.gain.value = gainValue;
  node.connect(gain).connect(audio.destination);
  return node;
}

function startBed(id: number) {
  pending = pending.then(async () => {
    try {
      if (id !== ticket || !want || theme) return;
      const audio = context();
      if (audio.state === "suspended") await audio.resume();
      const [themeBuffer, rainBuffer] = await Promise.all([load("theme"), load("rain")]);
      if (id !== ticket || !want || theme) return;
      const themeNode = source(themeBuffer, 0.32);
      const rainNode = source(rainBuffer, 0.34);
      themeNode.start();
      rainNode.start();
      theme = themeNode;
      rain = rainNode;
    } catch {
      // A blocked audio context should never stop the scene.
    }
  });
}

export function setBed(on: boolean) {
  if (typeof window === "undefined") return;
  want = on;
  ticket += 1;
  if (!on) {
    stopBed();
    if (ctx && ctx.state === "running") void ctx.suspend();
    return;
  }
  if (theme) return;
  startBed(ticket);
}

export function playCue(name: string) {
  if (typeof window === "undefined" || !want) return;
  const audio = context();
  void (async () => {
    try {
      if (audio.state === "suspended") await audio.resume();
      const buffer = await load(name);
      if (!want) return;
      const node = audio.createBufferSource();
      const gain = audio.createGain();
      node.buffer = buffer;
      gain.gain.value = name === "dice-tick" ? 0.16 : 0.36;
      node.connect(gain).connect(audio.destination);
      node.start();
    } catch {
      // Missing or blocked audio stays cosmetic.
    }
  })();
}

export function locationCue(location: string, ending: boolean): string {
  if (ending) return "sting-ending";
  const value = location.toLowerCase();
  if (value.includes("chapel") || value.includes("chair") || value.includes("stair")) return "sting-chapel";
  if (value.includes("ward") || value.includes("alley") || value.includes("canal") || value.includes("hatch")) return "sting-alley";
  if (value.includes("spire") || value.includes("helion")) return "sting-ending";
  return "sting-stall";
}
