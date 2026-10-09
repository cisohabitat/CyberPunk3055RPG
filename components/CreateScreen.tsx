"use client";

import { useState } from "react";
import { Mark, originAccent } from "@/components/Mark";
import { COMPLICATIONS, ORIGINS, POINTS, STATS, STAT_INFO, isValidName } from "@/lib/character";
import { createCharacter } from "@/lib/engine";
import { ITEMS } from "@/lib/items";
import type { ComplicationId, GameState, OriginId, StatId } from "@/lib/types";

const EMPTY: Record<StatId, number> = { chrome: 0, nerve: 0, face: 0, ghost: 0 };

export function CreateScreen({
  keepsakes = [],
  onBack,
  onStart,
}: {
  keepsakes?: string[];
  onBack: () => void;
  onStart: (state: GameState) => void;
}) {
  const [handle, setHandle] = useState("");
  const [givenName, setGivenName] = useState("");
  const [origin, setOrigin] = useState<OriginId>("gutterwire");
  const [complication, setComplication] = useState<ComplicationId | null>(null);
  const [keepsake, setKeepsake] = useState("");
  const [bonus, setBonus] = useState(EMPTY);
  const profile = ORIGINS[origin];
  const remaining = POINTS - STATS.reduce((sum, stat) => sum + bonus[stat], 0);
  const given = givenName.trim();
  const handleOk = isValidName(handle);
  const givenOk = given.length === 0 || isValidName(given, 24);
  const ready = handleOk && givenOk && remaining === 0 && complication !== null;

  function add(stat: StatId, delta: number) {
    setBonus((current) => {
      const next = current[stat] + delta;
      if (next < 0) return current;
      if (profile.stats[stat] + next > 5) return current;
      const spent = STATS.reduce((sum, id) => sum + (id === stat ? next : current[id]), 0);
      if (spent > POINTS) return current;
      return { ...current, [stat]: next };
    });
  }

  return (
    <div className="create-screen">
      <form
        className="create-card"
        onSubmit={(event) => {
          event.preventDefault();
          if (!ready) return;
          onStart(createCharacter({ handle, givenName, origin, bonus, complication, keepsake: keepsake || null, startWithPrologue: true }));
        }}
      >
        <p className="eyebrow">New runner</p>
        <h1>Who walks in?</h1>
        <p>You are a runner, taking work the towers leave off the record. Choose the life you bring with you. Your story begins on the way to a meeting.</p>
        <div className="names">
          <label>
            <span>Street handle</span>
            <input
              data-testid="handle-input"
              value={handle}
              onChange={(event) => setHandle(event.target.value)}
              maxLength={18}
              autoComplete="off"
              required
            />
          </label>
          <label>
            <span>Given name, optional</span>
            <input
              data-testid="given-input"
              value={givenName}
              onChange={(event) => setGivenName(event.target.value)}
              maxLength={24}
              autoComplete="off"
            />
          </label>
        </div>
        <fieldset>
          <legend>Origin</legend>
          <div className="origin-grid">
            {(Object.values(ORIGINS)).map((option) => (
              <button
                key={option.id}
                type="button"
                className="origin"
                data-testid={`origin-${option.id}`}
                aria-pressed={origin === option.id}
                onClick={() => {
                  setOrigin(option.id);
                  setBonus(EMPTY);
                }}
              >
                <Mark accent={originAccent(option.id)} />
                <strong>{option.name}</strong>
                <em>{option.perk}</em>
                <span className="origin-copy">{option.blurb}</span>
                <span className="origin-copy">{option.perkText}</span>
                <span className="origin-copy">{option.creds} creds in your chip.</span>
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Complication</legend>
          <div className="origin-grid">
            {Object.values(COMPLICATIONS).map((option) => (
              <button
                key={option.id}
                type="button"
                className="origin"
                data-testid={`complication-${option.id}`}
                aria-pressed={complication === option.id}
                onClick={() => setComplication(option.id)}
              >
                <strong>{option.name}</strong>
                <em>{option.perk}</em>
                <span className="origin-copy">{option.blurb}</span>
                <span className="origin-copy">{option.cost}</span>
              </button>
            ))}
          </div>
        </fieldset>
        {keepsakes.length > 0 && (
          <label className="keepsake">
            <span>Carry one thing from a finished run</span>
            <select data-testid="keepsake" value={keepsake} onChange={(event) => setKeepsake(event.target.value)}>
              <option value="">Carry nothing</option>
              {keepsakes.map((id) => (
                <option key={id} value={id}>
                  {ITEMS[id]?.name ?? id}
                </option>
              ))}
            </select>
          </label>
        )}
        <fieldset>
          <legend>{remaining} point{remaining === 1 ? "" : "s"} left</legend>
          <div className="points">
            {STATS.map((stat) => {
              const total = profile.stats[stat] + bonus[stat];
              return (
                <div className="point-row" key={stat}>
                  <span className="stat-name">{STAT_INFO[stat].name}</span>
                  <div className="stepper">
                    <button type="button" aria-label={`Lower ${STAT_INFO[stat].name}`} disabled={bonus[stat] <= 0} onClick={() => add(stat, -1)}>
                      −
                    </button>
                    <strong>{total}</strong>
                    <button
                      type="button"
                      data-testid={`plus-${stat}`}
                      aria-label={`Raise ${STAT_INFO[stat].name}`}
                      disabled={remaining <= 0 || total >= 5}
                      onClick={() => add(stat, 1)}
                    >
                      +
                    </button>
                  </div>
                  <div className="track" aria-hidden="true">
                    <span style={{ width: `${(total / 5) * 100}%` }} />
                  </div>
                  <span className="hint">{STAT_INFO[stat].blurb}</span>
                </div>
              );
            })}
          </div>
        </fieldset>
        <p className="form-error" role="status">
          {!handleOk && handle.length > 0 && "Handles use letters, numbers, spaces, apostrophes, or hyphens."}
          {handleOk && !givenOk && "That given name has a character the city won't print."}
          {handleOk && givenOk && remaining !== 0 && "Spend both points. Every stat is a way through the job."}
          {handleOk && givenOk && remaining === 0 && !complication && "Pick the complication. Everyone arrives carrying something."}
        </p>
        <div className="actions">
          <button className="primary" type="submit" data-testid="start-run" disabled={!ready}>
            Enter Kite City
          </button>
          <button className="ghost" type="button" onClick={onBack}>
            Back
          </button>
        </div>
      </form>
    </div>
  );
}
