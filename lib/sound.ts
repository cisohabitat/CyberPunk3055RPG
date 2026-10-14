import type { Preferences } from "./preferences";
import type { GameState } from "./types";
import { windowRemaining } from "./chapel-window";
import voiceMix from "../qa/media/voice-mix.json";
import { TITLE_MUSIC } from "./title-music";
import { voiceLevel } from "./voice-level";
import { SCENE_CUE_MIX, type SceneCueName } from "./scene-cues";

export type SoundMood = "street" | "chapel" | "ward" | "week" | "reading" | "quiet" | "pressure" | "title";
export type BedStatus = "idle" | "loading" | "playing" | "unavailable";
export type SoundDistrict = "street" | "chapel" | "spire" | "canal" | "ward" | "clinic" | "witness" | "stall";
let ctx: AudioContext | null = null;
type AudioSource = { node: AudioBufferSourceNode; gain: GainNode; channel: keyof typeof mix; dispose: () => void };
let theme: AudioSource | null = null;
let ambience: AudioSource | null = null;
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
let sceneCueTicket = 0;
let sceneCueSource: AudioSource | null = null;
const buses = new Map<string, GainNode>();
const cache = new Map<string, AudioBuffer>();
const loading = new Map<string, Promise<AudioBuffer>>();
let titleRequest: AbortController | null = null;
const CACHE_BYTES = 24 * 1024 * 1024;
const live = new Map<AudioBufferSourceNode, AudioSource>();

function context() { if (!ctx) ctx = new AudioContext(); return ctx; }
export function unlockAudio() {
  if (typeof window === "undefined") return;
  try {
    const audio = context();
    if (audio.state !== "running" && audio.state !== "closed") void audio.resume().catch(() => {});
  } catch { /* Unsupported audio must never block play. */ }
}
function bus(channel: keyof typeof mix) {
  const audio = context();
  let gain = buses.get(channel);
  if (!gain) { gain = audio.createGain(); gain.connect(audio.destination); buses.set(channel, gain); }
  const bed = channel === "music" || channel === "ambience";
  const duck = speaking && bed ? voiceMix.speechDuck[channel] : 1;
  const settling = bed && !speaking ? voiceMix.releaseSeconds : voiceMix.attackSeconds;
  gain.gain.setTargetAtTime(mix[channel] / 100 * duck, audio.currentTime, settling);
  return gain;
}
export function setAudioMix(value: Pick<Preferences, "music" | "ambience" | "effects" | "voices">) {
  const bedsChanged = (mix.music > 0) !== (value.music > 0) || (mix.ambience > 0) !== (value.ambience > 0);
  mix = { music: value.music, ambience: value.ambience, effects: value.effects, voices: value.voices };
  if (mix.voices === 0) stopVoice();
  if (mix.effects === 0) stopSceneCue();
  for (const current of live.values()) if (mix[current.channel] === 0) stopSource(current);
  if (ctx) for (const channel of ["music", "ambience", "effects", "voices"] as const) bus(channel);
  if (bedsChanged && want) { ++ticket; setBed(true, requestedMood, requestedDistrict); }
}
async function load(name: string) {
  const cached = cache.get(name); if (cached) { cache.delete(name); cache.set(name, cached); return cached; }
  const request = loading.get(name); if (request) return request;
  const controller = name === TITLE_MUSIC.name ? new AbortController() : undefined;
  if (controller) titleRequest = controller;
  const pending = (async () => {
    const extension = name.startsWith("voice-campaign-") ? "mp3" : name === TITLE_MUSIC.name ? TITLE_MUSIC.extension : name === "theme" || name.startsWith("theme-") || name.startsWith("ambience-") ? "flac" : "wav";
    const response = await fetch(`/audio/${name}.${extension}`, { signal: controller?.signal });
    if (!response.ok) throw new Error("Audio unavailable");
    const buffer = await context().decodeAudioData(await response.arrayBuffer());
    if (controller?.signal.aborted) throw new Error("Menu audio cancelled");
    cache.set(name, buffer);
    let bytes = 0; for (const value of cache.values()) bytes += value.length * value.numberOfChannels * 4;
    for (const [key, value] of cache) { if (bytes <= CACHE_BYTES) break; cache.delete(key); bytes -= value.length * value.numberOfChannels * 4; }
    return buffer;
  })();
  loading.set(name, pending);
  try { return await pending; } finally {
    if (loading.get(name) === pending) loading.delete(name);
    if (controller && titleRequest === controller) titleRequest = null;
  }
}
/** Release obsolete menu network work before the document is hidden/unloaded.
 * Normal gameplay handoff can still finish and cache a menu download. */
export function cancelPendingMenuAudio() {
  titleRequest?.abort(); titleRequest = null;
  loading.delete(TITLE_MUSIC.name);
}
function source(buffer: AudioBuffer, channel: keyof typeof mix, level: number, loop: boolean) {
  const audio = context(); const node = audio.createBufferSource(); const gain = audio.createGain();
  node.buffer = buffer; node.loop = loop; gain.gain.value = level;
  node.connect(gain).connect(bus(channel));
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    node.onended = null;
    node.disconnect(); gain.disconnect(); node.buffer = null;
    live.delete(node);
  };
  const current = { node, gain, channel, dispose };
  live.set(node, current); node.onended = dispose;
  return current;
}
function stopSource(current: AudioSource) {
  try { current.node.stop(); } catch { /* Already stopped. */ }
  current.dispose();
}
function stopBed() {
  stopSceneCue();
  for (const current of live.values()) stopSource(current);
  theme = null; ambience = null;
  playingMood = undefined; playingDistrict = undefined;
}
function crossfade(buffer: AudioBuffer, channel: "music" | "ambience", level: number, previous: typeof theme, loopStart = 0) {
  const audio = context();
  const next = source(buffer, channel, 0, true);
  next.node.loopStart = loopStart;
  next.node.loopEnd = buffer.duration;
  next.gain.gain.linearRampToValueAtTime(level, audio.currentTime + 0.65);
  next.node.start();
  if (previous) { previous.gain.gain.setTargetAtTime(0, audio.currentTime, 0.15); previous.node.stop(audio.currentTime + 0.8); }
  return next;
}
/** Cancel menu loading and dispose sources without suspending the next scene. */
export function leaveMenuMusic() {
  if (requestedMood !== "title") return;
  ++ticket; want = false; stopVoice(); stopBed();
}
export function setBed(on: boolean, nextMood: SoundMood = "street", nextDistrict: SoundDistrict = "street", report?: (status: BedStatus) => void) {
  if (typeof window === "undefined") return;
  if (mix.music === 0 && theme) { stopSource(theme); theme = null; playingMood = undefined; }
  if (mix.ambience === 0 && ambience) { stopSource(ambience); ambience = null; playingDistrict = undefined; }
  if (nextMood === "title" && ambience) { stopSource(ambience); ambience = null; playingDistrict = undefined; }
  const musicChanged = mix.music > 0 && (playingMood !== nextMood || !theme);
  const ambienceChanged = nextMood !== "title" && mix.ambience > 0 && (playingDistrict !== nextDistrict || !ambience);
  const unchanged = want === on && !musicChanged && !ambienceChanged;
  const planChanged = requestedMood !== nextMood || requestedDistrict !== nextDistrict;
  requestedMood = nextMood; requestedDistrict = nextDistrict;
  want = on;
  if (unchanged) { if (planChanged) ++ticket; report?.(on && theme ? "playing" : "idle"); return; }
  const id = ++ticket;
  if (!on) {
    stopVoice(); stopBed(); report?.("idle");
    // A new bed may have requested resume before this suspension completed.
    if (ctx?.state === "running") void ctx.suspend().then(() => { if (want) unlockAudio(); }).catch(() => {});
    return;
  }
  report?.("loading");
  void (async () => {
    try {
      if (id !== ticket || !want) return;
      if (!musicChanged && !ambienceChanged) return;
      unlockAudio();
      const name = nextMood === "title" ? TITLE_MUSIC.name : nextMood === "street" ? "theme" : `theme-${nextMood}`;
      const [musicResult, ambienceResult] = await Promise.allSettled([musicChanged ? load(name) : null, ambienceChanged ? load(`ambience-${nextDistrict}`) : null]);
      if (id !== ticket || !want) return;
      if (mix.music > 0 && musicResult.status === "fulfilled" && musicResult.value) { theme = crossfade(musicResult.value, "music", 0.5, theme, nextMood === "title" ? TITLE_MUSIC.loopStartSeconds : 0); playingMood = nextMood; }
      if (mix.ambience > 0 && ambienceResult.status === "fulfilled" && ambienceResult.value) { ambience = crossfade(ambienceResult.value, "ambience", 0.35, ambience); playingDistrict = nextDistrict; }
      report?.(theme && playingMood === nextMood ? "playing" : "unavailable");
    } catch { if (id === ticket && want) report?.("unavailable"); /* Audio stays optional. */ }
  })();
}

export type VoiceStatus = "loading" | "playing" | "idle" | "unavailable";
function duckBed(on: boolean) {
  speaking = on;
  if (ctx && sceneCueSource) sceneCueSource.gain.gain.setTargetAtTime(SCENE_CUE_MIX.level * (on ? SCENE_CUE_MIX.speechDuck : 1), ctx.currentTime, voiceMix.attackSeconds);
  if (ctx) { bus("music"); bus("ambience"); }
}
export function stopVoice() {
  ++voiceTicket;
  if (voiceNode) { const current = live.get(voiceNode); if (current) stopSource(current); }
  voiceNode = null;
  duckBed(false);
}
/** Revealed authored dialogue only. Cancellation prevents a late fetch start. */
export function playVoice(name: string, report: (status: VoiceStatus) => void, finished?: (outcome: "ended" | "unavailable") => void): () => void {
  stopVoice();
  const id = voiceTicket;
  if (!want || mix.voices === 0) { report("idle"); return () => {}; }
  report("loading");
  unlockAudio();
  void (async () => {
    try {
      const buffer = await load(name);
      if (id !== voiceTicket || !want || mix.voices === 0) return;
      const { node } = source(buffer, "voices", voiceLevel(name), false);
      const cleanup = node.onended;
      node.onended = (event) => {
        cleanup?.call(node, event);
        if (id === voiceTicket) { voiceNode = null; duckBed(false); report("idle"); finished?.("ended"); }
      };
      voiceNode = node; duckBed(true); node.start(); report("playing");
    } catch {
      if (id === voiceTicket) { voiceNode = null; duckBed(false); report("unavailable"); finished?.("unavailable"); }
    }
  })();
  return () => { if (id === voiceTicket) stopVoice(); };
}
export function playCue(name: string) {
  if (typeof window === "undefined" || !want || mix.effects === 0) return;
  const id = ticket;
  void (async () => {
    try {
      unlockAudio();
      const buffer = await load(name); if (!want || mix.effects === 0 || id !== ticket) return;
      source(buffer, "effects", name === "dice-tick" ? 0.22 : 0.5, false).node.start();
    } catch { /* Audio stays optional. */ }
  })();
}
/** One bounded action cue. Cancellation never starts a late download. */
export function stopSceneCue() {
  ++sceneCueTicket;
  if (sceneCueSource) stopSource(sceneCueSource);
  sceneCueSource = null;
}
export function playSceneCue(name: SceneCueName): () => void {
  stopSceneCue();
  const id = sceneCueTicket;
  if (typeof window === "undefined" || !want || mix.effects === 0) return () => {};
  unlockAudio();
  void (async () => {
    try {
      const buffer = await load(name);
      if (id !== sceneCueTicket || !want || mix.effects === 0) return;
      const next = source(buffer, "effects", SCENE_CUE_MIX.level * (speaking ? SCENE_CUE_MIX.speechDuck : 1), false);
      sceneCueSource = next;
      const dispose = next.node.onended;
      next.node.onended = event => { dispose?.call(next.node, event); if (sceneCueSource === next) sceneCueSource = null; };
      next.node.start();
    } catch { /* Missing effects never block a choice or save. */ }
  })();
  return () => { if (id === sceneCueTicket) stopSceneCue(); };
}
export function sceneMood(location: string, act = ""): SoundMood {
  const value = location.toLowerCase();
  if (value.includes("ward nine") || value.includes("wall") || value.includes("witness")) return "ward";
  if (value.includes("chapel") || value.includes("chair") || value.includes("memory")) return "chapel";
  return act === "The Week" ? "week" : "street";
}
const QUIET_SCENES = new Set(["act2_mara_quiet", "act2_mara_company", "act2_mara_company_kept", "act2_lumen_quiet", "act3_lumen_boundary", "act3_mara_followup", "act3_kerr_personal_question", "act3_chapel_return", "ending_quiet"]);
const CLINIC_SCENES = new Set(["act2_response_invitation", "act2_response_agenda", "act2_response_refusal", "act2_response_terms", "act2_response_dispatch", "act2_response_receipt", "act2_mara_quiet", "act2_mara_company", "act2_mara_company_kept", "act2_lumen_quiet", "act3_response_visit", "act3_mara_followup", "act3_lumen_boundary"]);
const ROOM_SCENES: Readonly<Record<string, SoundDistrict>> = { stall: "stall", pay: "stall", pay_yes: "stall", pay_no: "stall", why: "stall", job_owner: "stall", act2_route_receipt: "stall", act3_kerr_personal_question: "stall", act2_witness_arrival: "witness" };
/** Read-only staging. A saved allowance is pressure; no real-time clock is added. */
export function sceneSoundPlan(state: GameState, location: string, act = ""): { mood: SoundMood; district: SoundDistrict } {
  const value = location.toLowerCase();
  const district: SoundDistrict = CLINIC_SCENES.has(state.sceneId) ? "clinic" : ROOM_SCENES[state.sceneId] ?? (state.sceneId.startsWith("ending_") && ["ending_names", "ending_quiet", "ending_witness", "ending_listed"].includes(state.sceneId) ? "ward"
    : /ward nine|wall|witness/.test(value) ? "ward" : /chapel|chair|memory|clinic|conversation room/.test(value) ? "chapel"
    : /spire|helion/.test(value) ? "spire" : /canal|depot/.test(value) ? "canal" : "street");
  const pressure = state.sceneId.startsWith("chapel_window_") && state.flags.chapel_window_started && !state.flags.chapel_window_done && windowRemaining(state) > 0;
  const mood = pressure ? "pressure" : QUIET_SCENES.has(state.sceneId) || CLINIC_SCENES.has(state.sceneId) || state.sceneId === "act2_witness_arrival" || state.sceneId === "act2_route_receipt" ? "quiet"
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
