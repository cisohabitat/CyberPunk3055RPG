import type { Preferences } from "./preferences";

export type SoundMood = "street" | "chapel" | "ward";
let ctx: AudioContext | null = null;
let theme: { node: AudioBufferSourceNode; gain: GainNode } | null = null;
let rain: AudioBufferSourceNode | null = null;
let want = false;
let ticket = 0;
let mood: SoundMood = "street";
let pending: Promise<void> = Promise.resolve();
let mix = { music: 60, ambience: 50, effects: 70 };
const buses = new Map<string, GainNode>();
const cache = new Map<string, AudioBuffer>();
const live = new Set<AudioBufferSourceNode>();

function context() { if (!ctx) ctx = new AudioContext(); return ctx; }
function bus(channel: keyof typeof mix) {
  const audio = context();
  let gain = buses.get(channel);
  if (!gain) { gain = audio.createGain(); gain.connect(audio.destination); buses.set(channel, gain); }
  gain.gain.setTargetAtTime(mix[channel] / 100, audio.currentTime, 0.04);
  return gain;
}
export function setAudioMix(value: Pick<Preferences, "music" | "ambience" | "effects">) {
  mix = { music: value.music, ambience: value.ambience, effects: value.effects };
  if (ctx) for (const channel of ["music", "ambience", "effects"] as const) bus(channel);
}
async function load(name: string) {
  const cached = cache.get(name); if (cached) return cached;
  const response = await fetch(`/audio/${name}.wav`);
  if (!response.ok) throw new Error("Audio unavailable");
  const buffer = await context().decodeAudioData(await response.arrayBuffer());
  cache.set(name, buffer); return buffer;
}
function source(buffer: AudioBuffer, channel: keyof typeof mix, level: number, loop: boolean) {
  const audio = context(); const node = audio.createBufferSource(); const gain = audio.createGain();
  node.buffer = buffer; node.loop = loop; gain.gain.value = level;
  node.connect(gain).connect(bus(channel)); live.add(node);
  node.onended = () => { node.disconnect(); gain.disconnect(); live.delete(node); };
  return { node, gain };
}
function stopBed() {
  for (const node of live) { try { node.stop(); } catch { /* Already stopped. */ } }
  theme = null; rain = null;
}
export function setBed(on: boolean, nextMood: SoundMood = "street") {
  if (typeof window === "undefined") return;
  const unchanged = want === on && mood === nextMood && theme;
  want = on; mood = nextMood;
  if (unchanged) return;
  const id = ++ticket;
  if (!on) { stopBed(); if (ctx?.state === "running") void ctx.suspend().catch(() => {}); return; }
  pending = pending.then(async () => {
    try {
      if (id !== ticket || !want) return;
      const audio = context(); if (audio.state === "suspended") await audio.resume();
      const name = nextMood === "street" ? "theme" : `theme-${nextMood}`;
      const [musicBuffer, rainBuffer] = await Promise.all([load(name), load("rain")]);
      if (id !== ticket || !want) return;
      const previous = theme;
      theme = source(musicBuffer, "music", 0, true);
      theme.gain.gain.linearRampToValueAtTime(0.5, audio.currentTime + 0.45);
      theme.node.start();
      if (previous) { previous.gain.gain.setTargetAtTime(0, audio.currentTime, 0.1); previous.node.stop(audio.currentTime + 0.5); }
      if (!rain) { rain = source(rainBuffer, "ambience", 0.5, true).node; rain.start(); }
    } catch { /* Audio stays optional. */ }
  });
}
export function playCue(name: string) {
  if (typeof window === "undefined" || !want) return;
  const id = ticket;
  void (async () => {
    try {
      const audio = context(); if (audio.state === "suspended") await audio.resume();
      const buffer = await load(name); if (!want || id !== ticket) return;
      source(buffer, "effects", name === "dice-tick" ? 0.22 : 0.5, false).node.start();
    } catch { /* Audio stays optional. */ }
  })();
}
export function sceneMood(location: string): SoundMood {
  const value = location.toLowerCase();
  if (value.includes("ward nine") || value.includes("wall") || value.includes("witness")) return "ward";
  if (value.includes("chapel") || value.includes("chair") || value.includes("memory")) return "chapel";
  return "street";
}
export function locationCue(location: string, ending: boolean): string {
  if (ending) return "sting-ending";
  const value = location.toLowerCase();
  if (value.includes("memory")) return "sting-memory";
  if (value.includes("ward nine") || value.includes("witness")) return "sting-ward";
  if (value.includes("district") || value.includes("board") || value === "the week") return "sting-week";
  if (value.includes("chapel") || value.includes("chair") || value.includes("stair")) return "sting-chapel";
  if (value.includes("ward") || value.includes("alley") || value.includes("canal") || value.includes("hatch")) return "sting-alley";
  if (value.includes("spire") || value.includes("helion")) return "sting-ending";
  return "sting-stall";
}
