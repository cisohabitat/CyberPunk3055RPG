"use client";

import { useEffect, useState } from "react";
import { CreateScreen } from "@/components/CreateScreen";
import { PlayScreen } from "@/components/PlayScreen";
import { TitleScreen } from "@/components/TitleScreen";
import { clearSave, emptyCodex, loadCodex, loadSave, loadTextStep, writeSave } from "@/lib/storage";
import type { Codex, GameState } from "@/lib/types";

export function GameApp() {
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<"title" | "create" | "play">("title");
  const [run, setRun] = useState<GameState | null>(null);
  const [saved, setSaved] = useState<GameState | null>(null);
  const [codex, setCodex] = useState<Codex>(emptyCodex());

  useEffect(() => {
    setSaved(loadSave());
    setCodex(loadCodex());
    document.documentElement.dataset.text = String(loadTextStep());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !run || screen !== "play") return;
    writeSave(run);
    setSaved(run);
  }, [ready, run, screen]);

  function refreshCodex() {
    setCodex(loadCodex());
  }

  if (!ready) return <div className="boot">Jacking in</div>;

  if (screen === "play" && run) {
    return (
      <PlayScreen
        state={run}
        onChange={setRun}
        onAbandon={() => {
          clearSave();
          setSaved(null);
          setRun(null);
          refreshCodex();
          setScreen("title");
        }}
        onTitle={() => {
          setRun(null);
          refreshCodex();
          setScreen("title");
        }}
        onNewRun={() => {
          clearSave();
          setSaved(null);
          setRun(null);
          refreshCodex();
          setScreen("create");
        }}
      />
    );
  }

  if (screen === "create") {
    return (
      <CreateScreen
        keepsakes={codex.keepsakes}
        onBack={() => setScreen("title")}
        onStart={(next) => {
          setRun(next);
          setScreen("play");
        }}
      />
    );
  }

  return (
    <TitleScreen
      save={saved}
      codex={codex}
      onContinue={() => {
        if (!saved) return;
        setRun(saved);
        setScreen("play");
      }}
      onNew={() => setScreen("create")}
    />
  );
}
