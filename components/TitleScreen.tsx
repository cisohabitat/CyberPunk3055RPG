"use client";

import { useState } from "react";
import { getScene } from "@/lib/engine";
import type { GameState } from "@/lib/types";

const BARS = [42, 78, 55, 96, 34, 88, 63, 110, 48, 74, 38, 92, 58, 84, 46, 70, 100, 52];

export function TitleScreen({
  save,
  onContinue,
  onNew,
}: {
  save: GameState | null;
  onContinue: () => void;
  onNew: () => void;
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
          A solo story RPG. One job, four stats, and a shard that remembers a crime the tower already paid to forget.
        </p>
        <div className="actions">
          <button className="primary" type="button" data-testid="new-run" onClick={() => (save ? setConfirm(true) : onNew())}>
            New run
          </button>
          {save && scene && (
            <button className="ghost" type="button" data-testid="continue-run" onClick={onContinue}>
              {scene.ending ? `Read “${scene.endingTitle}”` : "Continue"}
            </button>
          )}
        </div>
        {save && scene && (
          <p className="continue-note">
            {save.handle} is saved in this browser. {scene.ending ? scene.endingTitle : scene.location}.
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
        <p className="fine">Corporate violence and memory editing. Original fiction. Progress stays on this device.</p>
      </div>
      <div className="skyline" aria-hidden="true">
        {BARS.map((height, index) => (
          <i key={height + index} style={{ height: `${height}%` }} />
        ))}
      </div>
      {confirm && (
        <div className="overlay">
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="overwrite-title">
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
          </div>
        </div>
      )}
    </div>
  );
}
