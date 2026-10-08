"use client";

import { useEffect, useState } from "react";
import { CreateScreen } from "@/components/CreateScreen";
import { PlayScreen } from "@/components/PlayScreen";
import { TitleScreen } from "@/components/TitleScreen";
import { clearSave, loadSave, writeSave } from "@/lib/storage";
import type { GameState } from "@/lib/types";

export function GameApp() {
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<"title" | "create" | "play">("title");
  const [run, setRun] = useState<GameState | null>(null);
  const [saved, setSaved] = useState<GameState | null>(null);

  useEffect(() => {
    setSaved(loadSave());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !run || screen !== "play") return;
    writeSave(run);
    setSaved(run);
  }, [ready, run, screen]);

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
          setScreen("title");
        }}
        onTitle={() => {
          setRun(null);
          setScreen("title");
        }}
        onNewRun={() => {
          clearSave();
          setSaved(null);
          setRun(null);
          setScreen("create");
        }}
      />
    );
  }

  if (screen === "create") {
    return <CreateScreen onBack={() => setScreen("title")} onStart={(next) => {
      setRun(next);
      setScreen("play");
    }} />;
  }

  return (
    <TitleScreen
      save={saved}
      onContinue={() => {
        if (!saved) return;
        setRun(saved);
        setScreen("play");
      }}
      onNew={() => setScreen("create")}
    />
  );
}
