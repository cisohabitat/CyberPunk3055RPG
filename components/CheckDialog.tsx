"use client";

import { useEffect, useRef, useState } from "react";
import { DialogFrame } from "@/components/DialogFrame";
import { Portrait, reactionLine } from "@/components/Portrait";
import { commitChoice, previewCheck, runDelta, stageCheck } from "@/lib/engine";
import { playCue } from "@/lib/sound";
import { statVoice } from "@/lib/story/voices";
import type { CheckResult, Choice, GameState } from "@/lib/types";

export function CheckDialog({
  state,
  choice,
  sound,
  speaker,
  onClose,
  onCommit,
  onStage,
  reducedMotion,
  artwork = true,
}: {
  state: GameState;
  choice: Choice;
  sound: boolean;
  speaker?: string;
  onClose: () => void;
  onCommit: (next: GameState) => void;
  onStage: (next: GameState) => void;
  reducedMotion: boolean;
  artwork?: boolean;
}) {
  const preview = previewCheck(state, choice.check!);
  const [restored] = useState(() => state.pendingCheck ? commitChoice(state, choice, { roll: state.pendingCheck.roll }) : null);
  const [display, setDisplay] = useState<number | null>(restored?.check?.roll ?? null);
  const [result, setResult] = useState<CheckResult | null>(restored?.check ?? null);
  const [next, setNext] = useState<GameState | null>(restored?.state ?? null);
  const locked = useRef(Boolean(restored));
  const [rolling, setRolling] = useState(false);
  const chance = preview.hits === 10 ? "Certain" : preview.hits === 0 ? "No chance" : `${preview.hits} in 10`;
  const delta = next ? runDelta(state, next) : [];

  useEffect(() => {
    if (result && !rolling) document.querySelector<HTMLButtonElement>("[data-testid=continue-check]")?.focus();
  }, [result, rolling]);

  useEffect(() => {
    if (!rolling || !result) return;
    const reduce = reducedMotion;
    if (reduce) {
      setDisplay(result.roll);
      setRolling(false);
      if (sound) playCue(result.success ? "sting-success" : "sting-fail");
      return;
    }
    let ticks = 0;
    const id = window.setInterval(() => {
      ticks += 1;
      if (sound) playCue("dice-tick");
      if (ticks > 9) {
        window.clearInterval(id);
        setDisplay(result.roll);
        setRolling(false);
        if (sound) playCue(result.success ? "sting-success" : "sting-fail");
        return;
      }
      setDisplay(1 + Math.floor(Math.random() * 10));
    }, 70);
    return () => window.clearInterval(id);
  }, [rolling, result, sound, reducedMotion]);

  function roll() {
    if (locked.current) return;
    locked.current = true;
    const face = 1 + Math.floor(Math.random() * 10);
    const staged = stageCheck(state, choice.id, face);
    onStage(staged);
    const committed = commitChoice(staged, choice, { roll: face });
    setResult(committed.check);
    setNext(committed.state);
    setRolling(true);
  }

  return (
    <DialogFrame titleId="check-title" className="wide" onEscape={result ? undefined : onClose}>
      <h2 id="check-title">{preview.label}</h2>
      <p>
        {chance}. 1d10 + {preview.bonus} against DC {preview.dc}.
      </p>
      <p data-testid="stat-voice">{statVoice(preview.stat)}</p>
      <ul className="math">
        {preview.parts.map((part) => (
          <li key={part.label}>
            <span>{part.label}</span>
            <span>+{part.value}</span>
          </li>
        ))}
      </ul>
      {display !== null && (
        <div className={result && !rolling ? (result.success ? "die plate good" : "die plate bad") : "die plate"}>{display}</div>
      )}
      {result && !rolling && (
        <div aria-live="polite">
          <p className="total">
            <span>
              {result.roll} + {result.bonus} = {result.total}
            </span>
            <span>{result.success ? "Success" : "Miss"}</span>
          </p>
          <p>{result.flavor}</p>
          <div className="reaction">
            <Portrait speaker={speaker} origin={state.origin} handle={state.handle} artwork={artwork} />
            <p>{reactionLine(speaker, result.success)}</p>
          </div>
          {result.crit === "success" && <p>A ten. Strain eases.</p>}
          {result.crit === "fail" && <p>A one. Strain bites harder.</p>}
          {delta.length > 0 && <p className="delta">{delta.join(" · ")}</p>}
        </div>
      )}
      {state.strain >= 4 && !result && <p data-testid="chair-close">The chair is close.</p>}
      <div className="dialog-actions">
        {!result && (
          <button className="primary" type="button" data-testid="roll-button" onClick={roll}>
            Roll
          </button>
        )}
        {result && !rolling && next && (
          <button className="primary" type="button" data-testid="continue-check" onClick={() => onCommit(next)}>
            Continue
          </button>
        )}
        {!result && (
          <button className="ghost" type="button" onClick={onClose}>
            Back
          </button>
        )}
      </div>
    </DialogFrame>
  );
}
