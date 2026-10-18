"use client";

import { RunRecap } from "./RunRecap";
import { useState } from "react";
import Link from "next/link";
import { MenuMusic } from "./MenuMusic";
import { TITLE_ART } from "@/lib/art";
import { TITLE_BRAND, TITLE_PORTRAIT } from "@/lib/title-branding";
import { DialogFrame } from "@/components/DialogFrame";
import { getScene } from "@/lib/engine";
import { endingCoda } from "@/lib/story";
import { endingGroups } from "@/lib/ending-discovery";
import { currentGoal } from "@/lib/story/goal";
import type { Codex, GameState } from "@/lib/types";
import type { BedStatus } from "@/lib/sound";

const BARS = [42, 78, 55, 96, 34, 88, 63, 110, 48, 74, 38, 92, 58, 84, 46, 70, 100, 52];

function TitleBrand({ artwork }: { artwork: boolean }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  return <h1 id="game-title" tabIndex={-1} className="title-brand" data-ready={artwork && ready && !failed}>
    <span className="title-brand-fallback">Saint <span>Shard</span></span>
    {artwork && !failed && <img data-testid="title-brand" src={TITLE_BRAND.src}
      srcSet={`${TITLE_BRAND.small} 500w, ${TITLE_BRAND.src} 800w`}
      sizes="(max-width: 700px) 280px, 480px" width={TITLE_BRAND.width} height={TITLE_BRAND.height}
      alt="" aria-hidden="true" decoding="async" onLoad={() => setReady(true)} onError={() => setFailed(true)} />}
  </h1>;
}

export function TitleScreen({
  save,
  codex,
  onContinue,
  onNew,
  saveFailed,
  recovered,
  onSettings,
  onSaves,
  artwork = true,
  musicStatus = "idle",
  musicMuted = false,
  musicPaused = false,
  musicWaiting = false,
  onMusic,
}: {
  save: GameState | null;
  codex: Codex;
  onContinue: () => void;
  onNew: () => void;
  saveFailed: boolean;
  recovered: boolean;
  onSettings: () => void;
  onSaves: () => void;
  artwork?: boolean;
  musicStatus?: BedStatus;
  musicMuted?: boolean;
  musicPaused?: boolean;
  musicWaiting?: boolean;
  onMusic?: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const [showReplayHints, setShowReplayHints] = useState(false);
  const scene = save ? getScene(save.sceneId) : null;

  return (
    <main className="title-screen" data-testid="title-screen">
      <div className="title-card">
        <section className={`title-hero${artwork ? "" : " title-hero--text"}`} aria-labelledby="game-title">
          {artwork && <figure className="title-key-art" data-testid="title-art">
            <picture>
              <source media="(max-width: 900px)" srcSet={`${TITLE_PORTRAIT.small} 480w, ${TITLE_PORTRAIT.src} 960w`} sizes="calc(100vw - 2rem)" width={TITLE_PORTRAIT.width} height={TITLE_PORTRAIT.height} />
              <img src={TITLE_ART.src} srcSet={`${TITLE_ART.small} 600w, ${TITLE_ART.src} 1200w`} sizes="(max-width: 1392px) calc(100vw - 2rem), 1360px" width={1200} height={800} alt={TITLE_ART.description} loading="eager" fetchPriority="high" decoding="async" />
            </picture>
            <figcaption className="sr-only">{TITLE_ART.caption}</figcaption>
          </figure>}
          <div className="title-intro">
            <p className="eyebrow">Kite City · 3055</p>
            <TitleBrand artwork={artwork} />
            <p className="title-tagline">Every memory has a price.</p>
            <div className="actions">
              {save && scene && (
                <button className="primary title-run-action" type="button" data-testid="continue-run" onClick={onContinue}>
                  {scene.finale ? `Read “${scene.endingTitle}”` : scene.ending ? "Continue the week" : "Continue"}
                </button>
              )}
              <button className={`title-run-action ${save ? "ghost" : "primary"}`} type="button" data-testid="new-run" onClick={() => (save ? setConfirm(true) : onNew())}>
                New run
              </button>
              <Link className="ghost" href="/guide" prefetch={false} data-testid="guide-link">Field guide</Link>
              <button className="ghost" type="button" onClick={onSaves}>Saves</button>
              <button className="ghost" type="button" onClick={onSettings}>Settings</button>
            </div>
            <MenuMusic status={musicStatus} muted={musicMuted} paused={musicPaused} waiting={musicWaiting} onToggle={onMusic} />
            {recovered && <p role="status">Your last autosave could not be read. The automatic backup is ready to continue.</p>}
            {save && scene && (
              <p className="continue-note">
                {save.handle} {saveFailed ? "is available for this session. Keep this page open to keep your progress." : "is saved in this browser."} {currentGoal(save)}
              </p>
            )}
          </div>
        </section>
        <div className="title-details">
          {save && <RunRecap state={save} />}
          <p className="title-premise"><strong>A solo story RPG.</strong> In Kite City, an hour of memory can be bought. Tonight, a broker has a job for you.</p>
          <div className="rules">
            <section>
              <h2>Dice</h2>
              <p>Roll 1d10, add your stat, and meet the difficulty. A successful 10 eases Strain. A 1 on a miss makes it worse.</p>
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
            <p>Each run follows one chain. Other outcomes remain for future runs.</p>
            <button className="ghost" type="button" aria-expanded={showReplayHints} aria-controls="replay-hints" onClick={() => setShowReplayHints(!showReplayHints)}>
              {showReplayHints ? "Hide replay hints" : "Show replay hints"}
            </button>
            <div id="replay-hints">
              {endingGroups(codex).map((group) => (
                <section className="codex-chapter" key={group.title}>
                  <h3>{group.title} · {group.discovered}/{group.entries.length} discovered</h3>
                  {showReplayHints && <p>{group.hint}</p>}
                  <ul>
                    {group.entries.map((entry) => (
                      <li key={entry.id} className={entry.seen ? "seen" : "unseen"}>
                        {entry.seen ? <><strong>{entry.title}</strong><span>{endingCoda(entry.id)}</span></> : "Undiscovered"}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
          <p className="fine">Corporate violence and memory editing. Original fiction. Progress stays on this device.</p>
        </div>
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
    </main>
  );
}
