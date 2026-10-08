"use client";

import { useEffect, useState } from "react";
import { commitChoice, previewCheck } from "@/lib/engine";
import { blip } from "@/lib/sound";
import type { CheckResult, Choice, GameState } from "@/lib/types";

export function CheckDialog({
  state,
  choice,
  sound,
  onClose,
  onCommit,
}: {
  state: GameState;
  choice: Choice;
  sound: boolean;
  onClose: () => void;
  onCommit: (next: GameState) => void;
}) {
  const preview = previewCheck(state, choice.check!);
  const [display, setDisplay] = useState<number | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [next, setNext] = useState<GameState | null>(null);
  const [rolling, setRolling] = useState(false);
  const chance = preview.hits === 10 ? "Certain" : preview.hits === 0 ? "No chance" : `${preview.hits} in 10`;

  useEffect(() => {
    if (!rolling || !result) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDisplay(result.roll);
      setRolling(false);
      if (sound) blip(result.success);
      return;
    }
    let ticks = 0;
    const id = window.setInterval(() => {
      ticks += 1;
      if (ticks > 9) {
        window.clearInterval(id);
        setDisplay(result.roll);
        setRolling(false);
        if (sound) blip(result.success);
        return;
      }
      setDisplay(1 + Math.floor(Math.random() * 10));
    }, 55);
    return () => window.clearInterval(id);
  }, [rolling, result, sound]);

  function roll() {
    const face = 1 + Math.floor(Math.random() * 10);
    const committed = commitChoice(state, choice, { roll: face });
    setResult(committed.check);
    setNext(committed.state);
    setRolling(true);
  }

  return (
    <div className="overlay">
      <div className="dialog wide" role="dialog" aria-modal="true" aria-labelledby="check-title">
        <h2 id="check-title">{preview.label}</h2>
        <p>
          {chance}. 1d10 + {preview.bonus} against DC {preview.dc}.
        </p>
        <ul className="math">
          {preview.parts.map((part) => (
            <li key={part.label}>
              <span>{part.label}</span>
              <span>+{part.value}</span>
            </li>
          ))}
        </ul>
        {display !== null && <div className={result && !rolling ? (result.success ? "die good" : "die bad") : "die"}>{display}</div>}
        {result && !rolling && (
          <div aria-live="polite">
            <p className="total">
              <span>
                {result.roll} + {result.bonus} = {result.total}
              </span>
              <span>{result.success ? "Success" : "Miss"}</span>
            </p>
            <p>{result.flavor}</p>
            {result.crit === "success" && <p>A ten. Strain eases.</p>}
            {result.crit === "fail" && <p>A one. Strain bites harder.</p>}
          </div>
        )}
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
      </div>
    </div>
  );
}
