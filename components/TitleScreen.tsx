"use client";

import { useState } from "react";
import { DialogFrame } from "@/components/DialogFrame";
import { getScene } from "@/lib/engine";
import { CODEX, endingCoda } from "@/lib/story";
import { currentGoal } from "@/lib/story/goal";
import type { Codex, GameState } from "@/lib/types";

const BARS = [42, 78, 55, 96, 34, 88, 63, 110, 48, 74, 38, 92, 58, 84, 46, 70, 100, 52];

export function TitleScreen({
  save,
  codex,
  onContinue,
  onNew,
  saveFailed,
  recovered,
  onSettings,
  onSaves,
}: {
  save: GameState | null;
  codex: Codex;
  onContinue: () => void;
  onNew: () => void;
  saveFailed: boolean;
  recovered: boolean;
  onSettings: () => void;
  onSaves: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const scene = save ? getScene(save.sceneId) : null;

  return (
    <div className="title-screen" data-testid="title-screen">
      <div className="title-card">
        <p className="eyebrow">Kite City · 3055</p>
        <h1>
          Saint <span className="hot">Shard</span>
        </h1>
        <p className="logline">
          A solo story RPG. One job becomes a week, then a ward the tower already paid to forget.
        </p>
        <div className="actions">
          <button className="primary" type="button" data-testid="new-run" onClick={() => (save ? setConfirm(true) : onNew())}>
            New run
          </button>
          {save && scene && (
            <button className="ghost" type="button" data-testid="continue-run" onClick={onContinue}>
              {scene.finale ? `Read “${scene.endingTitle}”` : scene.ending ? "Continue the week" : "Continue"}
            </button>
          )}
          <button className="ghost" type="button" onClick={onSaves}>Saves</button>
          <button className="ghost" type="button" onClick={onSettings}>Settings</button>
        </div>
        {recovered && <p role="status">Your last autosave could not be read. The automatic backup is ready to continue.</p>}
        {save && scene && (
          <p className="continue-note">
            {save.handle} {saveFailed ? "is available for this session. Keep this page open to keep your progress." : "is saved in this browser."} {currentGoal(save)}
          </p>
        )}
        <div className="rules">
          <section>
            <h2>Dice</h2>
            <p>Roll 1d10, add your stat, and meet the difficulty. A 10 eases Strain. A 1 on a miss makes it worse.</p>
          </section>
          <section>
            <h2>Stats</h2>
            <p>Chrome talks to machines. Nerve stays in the fight. Face moves people. Ghost uses the minute nobody counted.</p>
          </section>
          <section>
            <h2>Strain</h2>
            <p>Five pips. At the fifth, a bad night inside Glass Chapel can put you in the chair.</p>
          </section>
        </div>
        <div className="codex" data-testid="codex">
          <h2>Endings this browser has seen</h2>
          <ul>
            {CODEX.map((entry) => {
              const seen = codex.seen.some((item) => item.id === entry.id);
              return (
                <li key={entry.id} className={seen ? "seen" : "unseen"}>
                  {seen ? (
                    <>
                      <strong>{entry.title}</strong>
                      <span>{endingCoda(entry.id)}</span>
                    </>
                  ) : (
                    "—"
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        <p className="fine">Corporate violence and memory editing. Original fiction. Progress stays on this device.</p>
      </div>
      <div className="skyline" aria-hidden="true">
        {BARS.map((height, index) => (
          <i key={index} style={{ height: `${height}%` }} />
        ))}
      </div>
      {confirm && (
        <DialogFrame titleId="overwrite-title" onEscape={() => setConfirm(false)}>
          <h2 id="overwrite-title">Start over?</h2>
          <p>A new character replaces {save?.handle}&apos;s save once you take the stool.</p>
          <div className="dialog-actions">
            <button className="primary" type="button" onClick={onNew}>
              Start a new run
            </button>
            <button className="ghost" type="button" onClick={() => setConfirm(false)}>
              Keep it
            </button>
          </div>
        </DialogFrame>
      )}
    </div>
  );
}
