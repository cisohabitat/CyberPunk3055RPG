"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useController } from "./useController";
import { CreateScreen } from "./CreateScreen";
import { PlayScreen } from "./PlayScreen";
import { TitleScreen } from "./TitleScreen";
import { SaveDialog } from "./SaveDialog";
import { SettingsDialog } from "./SettingsDialog";
import { clearSave, emptyCodex, loadCodex, loadSave, usedBackup, writeSave } from "@/lib/storage";
import { applyPreferences, DEFAULT_PREFERENCES, loadPreferences, writePreferences, type Preferences } from "@/lib/preferences";
import { setAudioMix, setBed, unlockAudio } from "@/lib/sound";
import { checkpointLabel } from "@/lib/checkpoints";
import { recordIncident } from "@/lib/diagnostics";
import type { Codex, GameState } from "@/lib/types";

export function GameApp() {
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<"title" | "create" | "play">("title");
  const [playSession, setPlaySession] = useState(0);
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);
  const [run, setRun] = useState<GameState | null>(null);
  const [saved, setSaved] = useState<GameState | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const [codex, setCodex] = useState<Codex>(emptyCodex());
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [dialog, setDialog] = useState<"saves" | "settings" | null>(null);
  const [audioPaused, setAudioPaused] = useState(false);

  useController(preferences.controller);

  useEffect(() => {
    setSaved(loadSave()); setRecovered(usedBackup()); setCodex(loadCodex());
    const loaded = loadPreferences(); setPreferences(loaded); applyPreferences(loaded);
    setReady(true);
  }, []);
  useLayoutEffect(() => { window.scrollTo(0, 0); }, [screen]);
  useEffect(() => { setAudioMix(preferences); }, [preferences]);
  useEffect(() => { if (screen !== "play") setBed(false); }, [screen]);
  useEffect(() => {
    function pause() {
      if (!preferences.sound) return;
      setBed(false);
      setAudioPaused(true);
    }
    function visibility() { if (document.visibilityState !== "visible") pause(); }
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", pause);
    visibility();
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", pause);
    };
  }, [preferences.sound]);

  function updateRun(next: GameState) {
    const persisted = writeSave(next);
    setSaveFailed(!persisted);
    if (!persisted) recordIncident("save-unavailable");
    setRun(next); setSaved(next);
  }
  function updatePreferences(next: Preferences) {
    if (next.sound && !preferences.sound) { unlockAudio(); setAudioPaused(false); }
    if (!next.sound) setAudioPaused(false);
    setPreferences(next); applyPreferences(next); writePreferences(next);
  }
  function title() { setDialog(null); setRun(null); setCodex(loadCodex()); setScreen("title"); }
  function load(next: GameState, source = "Autosave") {
    if (preferences.sound) unlockAudio();
    setAudioPaused(false);
    updateRun(next); setRestoreNotice(source === "New run" ? null : `Loaded ${source} — ${checkpointLabel(next)}`);
    setPlaySession((session) => session + 1); setRecovered(false); setDialog(null); setScreen("play");
  }

  if (!ready) return <div className="boot">Jacking in</div>;
  return <>
    {screen === "play" && run ? <PlayScreen key={playSession} restoreNotice={restoreNotice} state={run} saveFailed={saveFailed} preferences={preferences}
      audioPaused={audioPaused} onResumeAudio={() => { unlockAudio(); setAudioPaused(false); }}
      modalOpen={dialog !== null} onSettings={() => setDialog("settings")} onSaves={() => setDialog("saves")}
      onChange={(next) => { setRestoreNotice(null); updateRun(next); }} onTitle={title} onNewRun={() => { setCodex(loadCodex()); setRun(null); setScreen("create"); }}
      onAbandon={() => { clearSave(); setSaved(null); setRun(null); setSaveFailed(false); title(); }} />
      : screen === "create" ? <CreateScreen keepsakes={codex.keepsakes} onBack={title} onStart={(next) => load(next, "New run")} />
      : <TitleScreen save={saved} codex={codex} saveFailed={saveFailed} recovered={recovered}
          artwork={preferences.artwork !== "none"}
          onSettings={() => setDialog("settings")} onSaves={() => setDialog("saves")}
          onContinue={() => { if (saved) load(saved); }} onNew={() => setScreen("create")} />}
    {dialog === "settings" && <SettingsDialog preferences={preferences} onChange={updatePreferences} onClose={() => setDialog(null)} />}
    {dialog === "saves" && <SaveDialog state={run ?? saved} onLoad={load} onClose={() => setDialog(null)} onTitle={screen === "play" ? title : undefined} />}
  </>;
}
