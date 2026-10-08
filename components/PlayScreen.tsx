"use client";

import { useEffect, useRef, useState } from "react";
import { CheckDialog } from "@/components/CheckDialog";
import { DialogFrame } from "@/components/DialogFrame";
import { Mark, originAccent } from "@/components/Mark";
import { Portrait } from "@/components/Portrait";
import { Sheet } from "@/components/Sheet";
import { DISTRICT_ART, placeArt } from "@/lib/art";
import { ORIGINS, STRAIN_MAX, STAT_INFO } from "@/lib/character";
import { commitChoice, getScene, presentChoices, previewCheck, runDelta, sceneText, type VisibleChoice } from "@/lib/engine";
import { locationCue, playCue, setBed } from "@/lib/sound";
import { loadSound, loadTextStep, rememberEnding, writeSound, writeTextStep } from "@/lib/storage";
import { endingCoda } from "@/lib/story";
import type { GameState } from "@/lib/types";

export function PlayScreen({
  state,
  onChange,
  onAbandon,
  onTitle,
  onNewRun,
}: {
  state: GameState;
  onChange: (state: GameState) => void;
  onAbandon: () => void;
  onTitle: () => void;
  onNewRun: () => void;
}) {
  const scene = getScene(state.sceneId);
  const choices = presentChoices(state, scene);
  const [pending, setPending] = useState<VisibleChoice | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const [sound, setSound] = useState(false);
  const [textStep, setTextStep] = useState(0);
  const [fault, setFault] = useState("");
  const [delta, setDelta] = useState<string[]>([]);
  const [flash, setFlash] = useState(false);
  const prior = useRef(state);

  useEffect(() => {
    setSound(loadSound());
    setTextStep(loadTextStep());
  }, []);

  useEffect(() => {
    setBed(sound);
  }, [sound]);

  useEffect(() => {
    if (prior.current !== state) {
      setDelta(prior.current.sceneId === state.sceneId ? [] : runDelta(prior.current, state));
      prior.current = state;
    }
  }, [state]);

  useEffect(() => {
    setSheetOpen(false);
    setPending(null);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setFlash(!reduce);
    document.getElementById("scene-top")?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    if (scene.ending && scene.endingTitle) document.title = `${scene.endingTitle} — Saint Shard`;
    else document.title = "Saint Shard — Kite City 3055";
    if (sound) playCue(locationCue(scene.location, Boolean(scene.ending)));
    if (scene.id.startsWith("ending_") && scene.endingTitle) {
      rememberEnding(scene.id, scene.endingTitle, scene.finale ? state.items : undefined);
    }
  }, [state.sceneId, scene.ending, scene.endingTitle, scene.finale, scene.id, scene.location, sound, state.items]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (confirmAbandon) setConfirmAbandon(false);
        if (sheetOpen) setSheetOpen(false);
        return;
      }
      if (pending || confirmAbandon || choices.length === 0) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const number = Number(event.key);
      if (!Number.isInteger(number) || number < 1 || number > 9) return;
      const choice = choices[number - 1];
      if (choice?.enabled) pick(choice);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function pick(choice: VisibleChoice) {
    if (!choice.enabled) return;
    setFault("");
    if (choice.check) {
      setPending(choice);
      return;
    }
    try {
      onChange(commitChoice(state, choice).state);
    } catch {
      setFault("The city glitched on that choice. Reload this page and continue the save.");
    }
  }

  function toggleSound() {
    const next = !sound;
    setSound(next);
    writeSound(next);
  }

  function cycleText() {
    const next = (textStep + 1) % 3;
    setTextStep(next);
    writeTextStep(next);
    document.documentElement.dataset.text = String(next);
  }

  return (
    <div className="screen">
      <a className="skip" href="#choices">
        Skip to choices
      </a>
      <header className="topbar">
        <div className="brand">
          <Mark accent={originAccent(state.origin)} />
          <div>
            Saint Shard
            <small>Kite City 3055</small>
          </div>
        </div>
        <div className="meters">
          <div className="strain-readout">
            <span className="stat-name">Strain</span>
            <div className={state.strain >= 4 ? "pips hot" : "pips"} data-testid="strain" aria-label={`Strain ${state.strain} of ${STRAIN_MAX}`}>
              {Array.from({ length: STRAIN_MAX }, (_, index) => (
                <span key={index} className={index < state.strain ? "on" : ""} />
              ))}
            </div>
          </div>
          <div className="creds" data-testid="creds">
            {state.creds} cr
          </div>
        </div>
        <div className="top-actions">
          <button className="ghost" type="button" onClick={cycleText}>
            Text {textStep + 1}
          </button>
          <button className="ghost" type="button" aria-pressed={sound} onClick={toggleSound}>
            Sound {sound ? "on" : "off"}
          </button>
          <button className="ghost sheet-toggle" type="button" data-testid="sheet-toggle" onClick={() => setSheetOpen(true)}>
            Sheet
          </button>
          <button className="ghost" type="button" onClick={() => setConfirmAbandon(true)}>
            Abandon
          </button>
        </div>
      </header>
      <div className="layout">
        <main>
          <article
            className={flash ? "scene flash" : "scene"}
            id="scene-top"
            data-testid="scene"
            style={{ backgroundImage: `linear-gradient(180deg, rgba(9,8,13,0.72), rgba(9,8,13,0.94)), url(${placeArt(scene.location)})` }}
          >
            <div className="scene-row">
              <Portrait speaker={scene.speaker} origin={state.origin} />
              <div>
                <p className="kicker">{scene.location}</p>
                {scene.ending && state.chapters.length > 0 && (
                  <ol className="chapter-stack" data-testid="chapter-stack">
                    {state.chapters.map((title) => (
                      <li key={title}>{title}</li>
                    ))}
                  </ol>
                )}
                {scene.ending && (
                  <>
                    <p className="ending-kicker">{scene.finale ? "Ending" : "Chapter"}</p>
                    <h1 data-testid="ending-title">{scene.endingTitle}</h1>
                  </>
                )}
                {scene.speaker && <p className="speaker">{scene.speaker}</p>}
                {delta.length > 0 && (
                  <p className="delta" data-testid="run-delta">
                    {delta.join(" · ")}
                  </p>
                )}
                {scene.ending && (
                  <ul className="recap" data-testid="ending-recap">
                    <li>{ORIGINS[state.origin].name}</li>
                    <li>{state.creds} cr</li>
                    <li>
                      Strain {state.strain}/{STRAIN_MAX}
                    </li>
                    <li>{endingCoda(scene.id)}</li>
                  </ul>
                )}
                <div className="prose" data-testid="scene-text" aria-live="polite">
                  {sceneText(scene, state)
                    .split(/\n\n+/)
                    .map((paragraph, index) => (
                      <p key={`${scene.id}-${index}`}>{paragraph}</p>
                    ))}
                </div>
              </div>
            </div>
            {fault && <p className="form-error">{fault}</p>}
            {choices.length > 0 && (
              <div className={scene.id === "districts" ? "choices cards" : "choices"} id="choices">
                {choices.map((choice, index) => {
                  const odds = choice.check ? previewCheck(state, choice.check) : null;
                  const chance = !odds ? null : odds.hits === 10 ? "certain" : odds.hits === 0 ? "no chance" : `${odds.hits} in 10`;
                  return (
                    <button
                      key={choice.id}
                      className="choice"
                      type="button"
                      data-testid={`choice-${choice.id}`}
                      disabled={!choice.enabled || pending !== null}
                      onClick={() => pick(choice)}
                    >
                      {scene.id === "districts" && DISTRICT_ART[choice.id] && (
                        <img className="card-art" src={DISTRICT_ART[choice.id]} alt="" />
                      )}
                      <span className="index">{index + 1}</span>
                      <span className="label">{choice.label}</span>
                      <span className="odds">
                        {choice.disabledReason ??
                          [odds ? `${STAT_INFO[odds.stat].name} · DC ${odds.dc} · ${chance}` : null, choice.detail]
                            .filter(Boolean)
                            .join(" · ")}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {scene.ending && (
              <div className="actions">
                <button className="primary" type="button" onClick={onNewRun}>
                  New run
                </button>
                <button className="ghost" type="button" onClick={onTitle}>
                  Title
                </button>
              </div>
            )}
          </article>
        </main>
        <button className={sheetOpen ? "sheet-backdrop open" : "sheet-backdrop"} type="button" aria-label="Close sheet" onClick={() => setSheetOpen(false)} />
        <Sheet state={state} open={sheetOpen} onClose={() => setSheetOpen(false)} />
      </div>
      {pending?.check && (
        <CheckDialog
          state={state}
          choice={pending}
          sound={sound}
          speaker={scene.speaker}
          onClose={() => setPending(null)}
          onCommit={(next) => {
            setPending(null);
            onChange(next);
          }}
        />
      )}
      {confirmAbandon && (
        <DialogFrame titleId="abandon-title" onEscape={() => setConfirmAbandon(false)}>
          <h2 id="abandon-title">Abandon this run?</h2>
          <p>This wipes {state.handle} from the browser. The city will not remember it.</p>
          <div className="dialog-actions">
            <button className="primary" type="button" data-testid="confirm-abandon" onClick={onAbandon}>
              Wipe it
            </button>
            <button className="ghost" type="button" onClick={() => setConfirmAbandon(false)}>
              Keep going
            </button>
          </div>
        </DialogFrame>
      )}
    </div>
  );
}
