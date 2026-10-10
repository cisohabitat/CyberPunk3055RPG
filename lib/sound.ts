import type { Preferences } from "./preferences";
import type { GameState } from "./types";
import { windowRemaining } from "./chapel-window";

export type SoundMood = "street" | "chapel" | "ward" | "week" | "reading" | "quiet" | "pressure";
export type SoundDistrict = "street" | "chapel" | "spire" | "canal" | "ward";
let ctx: AudioContext | null = null;
let theme: { node: AudioBufferSourceNode; gain: GainNode } | null = null;
let ambience: { node: AudioBufferSourceNode; gain: GainNode } | null = null;
let want = false;
let ticket = 0;
let playingMood: SoundMood | undefined;
let playingDistrict: SoundDistrict | undefined;
let requestedMood: SoundMood = "street";
let requestedDistrict: SoundDistrict = "street";
let mix = { music: 60, ambience: 50, effects: 70, voices: 70 };
let voiceTicket = 0;
let voiceNode: AudioBufferSourceNode | null = null;
let speaking = false;
const buses = new Map<string, GainNode>();
const cache = new Map<string, AudioBuffer>();
const loading = new Map<string, Promise<AudioBuffer>>();
const CACHE_BYTES = 24 * 1024 * 1024;
const live = new Set<AudioBufferSourceNode>();

function context() { if (!ctx) ctx = new AudioContext(); return ctx; }
export function unlockAudio() {
  if (typeof window === "undefined") return;
  try {
    const audio = context();
    if (audio.state === "suspended") void audio.resume().catch(() => {});
  } catch { /* Unsupported audio must never block play. */ }
}
function bus(channel: keyof typeof mix) {
  const audio = context();
  let gain = buses.get(channel);
  if (!gain) { gain = audio.createGain(); gain.connect(audio.destination); buses.set(channel, gain); }
  const duck = speaking && (channel === "music" || channel === "ambience") ? 0.4 : 1;
  gain.gain.setTargetAtTime(mix[channel] / 100 * duck, audio.currentTime, 0.04);
  return gain;
}
export function setAudioMix(value: Pick<Preferences, "music" | "ambience" | "effects" | "voices">) {
  mix = { music: value.music, ambience: value.ambience, effects: value.effects, voices: value.voices };
  if (ctx) for (const channel of ["music", "ambience", "effects", "voices"] as const) bus(channel);
}
async function load(name: string) {
  const cached = cache.get(name); if (cached) { cache.delete(name); cache.set(name, cached); return cached; }
  const request = loading.get(name); if (request) return request;
  const pending = (async () => {
    const response = await fetch(`/audio/${name}.wav`);
    if (!response.ok) throw new Error("Audio unavailable");
    const buffer = await context().decodeAudioData(await response.arrayBuffer());
    cache.set(name, buffer);
    let bytes = 0; for (const value of cache.values()) bytes += value.length * value.numberOfChannels * 4;
    for (const [key, value] of cache) { if (bytes <= CACHE_BYTES) break; cache.delete(key); bytes -= value.length * value.numberOfChannels * 4; }
    return buffer;
  })();
  loading.set(name, pending);
  try { return await pending; } finally { loading.delete(name); }
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
  theme = null; ambience = null;
  playingMood = undefined; playingDistrict = undefined;
}
function crossfade(buffer: AudioBuffer, channel: "music" | "ambience", level: number, previous: typeof theme) {
  const audio = context();
  const next = source(buffer, channel, 0, true);
  next.gain.gain.linearRampToValueAtTime(level, audio.currentTime + 0.65);
  next.node.start();
  if (previous) { previous.gain.gain.setTargetAtTime(0, audio.currentTime, 0.15); previous.node.stop(audio.currentTime + 0.8); }
  return next;
}
export function setBed(on: boolean, nextMood: SoundMood = "street", nextDistrict: SoundDistrict = "street") {
  if (typeof window === "undefined") return;
  const musicChanged = playingMood !== nextMood || !theme;
  const ambienceChanged = playingDistrict !== nextDistrict || !ambience;
  const unchanged = want === on && !musicChanged && !ambienceChanged;
  const planChanged = requestedMood !== nextMood || requestedDistrict !== nextDistrict;
  requestedMood = nextMood; requestedDistrict = nextDistrict;
  want = on;
  if (unchanged) { if (planChanged) ++ticket; return; }
  const id = ++ticket;
  if (!on) { stopVoice(); stopBed(); if (ctx?.state === "running") void ctx.suspend().catch(() => {}); return; }
  void (async () => {
    try {
      if (id !== ticket || !want) return;
      const audio = context(); if (audio.state === "suspended") void audio.resume().catch(() => {});
      const name = nextMood === "street" ? "theme" : `theme-${nextMood}`;
      const [musicResult, ambienceResult] = await Promise.allSettled([musicChanged ? load(name) : null, ambienceChanged ? load(`ambience-${nextDistrict}`) : null]);
      if (id !== ticket || !want) return;
      if (musicResult.status === "fulfilled" && musicResult.value) { theme = crossfade(musicResult.value, "music", 0.5, theme); playingMood = nextMood; }
      if (ambienceResult.status === "fulfilled" && ambienceResult.value) { ambience = crossfade(ambienceResult.value, "ambience", 0.35, ambience); playingDistrict = nextDistrict; }
    } catch { /* Audio stays optional. */ }
  })();
}

export type VoiceStatus = "loading" | "playing" | "idle" | "unavailable";
function duckBed(on: boolean) {
  speaking = on;
  if (ctx) { bus("music"); bus("ambience"); }
}
export function stopVoice() {
  ++voiceTicket;
  if (voiceNode) { try { voiceNode.stop(); } catch { /* Already stopped. */ } }
  voiceNode = null;
  duckBed(false);
}
/** Explicit playback only. Cancelling a pending fetch must prevent a late start. */
export function playVoice(name: string, report: (status: VoiceStatus) => void): () => void {
  stopVoice();
  const id = voiceTicket;
  if (!want || mix.voices === 0) { report("idle"); return () => {}; }
  report("loading");
  unlockAudio();
  void (async () => {
    try {
      const buffer = await load(name);
      if (id !== voiceTicket || !want || mix.voices === 0) return;
      const { node } = source(buffer, "voices", 1, false);
      const cleanup = node.onended;
      node.onended = (event) => {
        cleanup?.call(node, event);
        if (id === voiceTicket) { voiceNode = null; duckBed(false); report("idle"); }
      };
      voiceNode = node; duckBed(true); node.start(); report("playing");
    } catch {
      if (id === voiceTicket) { voiceNode = null; duckBed(false); report("unavailable"); }
    }
  })();
  return () => { if (id === voiceTicket) stopVoice(); };
}
export function playCue(name: string) {
  if (typeof window === "undefined" || !want) return;
  const id = ticket;
  void (async () => {
    try {
      const audio = context(); if (audio.state === "suspended") void audio.resume().catch(() => {});
      const buffer = await load(name); if (!want || id !== ticket) return;
      source(buffer, "effects", name === "dice-tick" ? 0.22 : 0.5, false).node.start();
    } catch { /* Audio stays optional. */ }
  })();
}
export function sceneMood(location: string, act = ""): SoundMood {
  const value = location.toLowerCase();
  if (value.includes("ward nine") || value.includes("wall") || value.includes("witness")) return "ward";
  if (value.includes("chapel") || value.includes("chair") || value.includes("memory")) return "chapel";
  return act === "The Week" ? "week" : "street";
}
const QUIET_SCENES = new Set(["act2_mara_quiet", "act2_lumen_quiet", "act3_lumen_boundary", "act3_mara_followup", "act3_kerr_personal_question", "act3_chapel_return", "ending_quiet"]);
/** Read-only staging. A saved allowance is pressure; no real-time clock is added. */
export function sceneSoundPlan(state: GameState, location: string, act = ""): { mood: SoundMood; district: SoundDistrict } {
  const value = location.toLowerCase();
  const district: SoundDistrict = state.sceneId.startsWith("ending_") && ["ending_names", "ending_quiet", "ending_witness", "ending_listed"].includes(state.sceneId) ? "ward"
    : /ward nine|wall|witness/.test(value) ? "ward" : /chapel|chair|memory|clinic|conversation room/.test(value) ? "chapel"
    : /spire|helion/.test(value) ? "spire" : /canal|depot/.test(value) ? "canal" : "street";
  const pressure = state.sceneId.startsWith("chapel_window_") && state.flags.chapel_window_started && !state.flags.chapel_window_done && windowRemaining(state) > 0;
  const mood = pressure ? "pressure" : QUIET_SCENES.has(state.sceneId) ? "quiet"
    : state.sceneId === "memo" || state.sceneId === "mara_why" || state.sceneId.startsWith("memory_") && state.sceneId !== "memory_table" ? "reading"
    : state.sceneId.startsWith("ending_") && district === "ward" ? "ward" : sceneMood(location, act);
  return { mood, district };
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
