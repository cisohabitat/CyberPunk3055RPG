"use client";

import { useState } from "react";
import { Mark, originAccent } from "@/components/Mark";
import { ORIGINS, STATS, STAT_INFO } from "@/lib/character";
import { ITEMS } from "@/lib/items";
import type { GameState } from "@/lib/types";

export function Sheet({ state, open, onClose }: { state: GameState; open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<"stats" | "gear" | "journal">("stats");
  const origin = ORIGINS[state.origin];

  return (
    <aside className={open ? "sheet open" : "sheet"} data-testid="sheet">
      <div className="who">
        <Mark accent={originAccent(state.origin)} />
        <div>
          <h2>{state.handle}</h2>
          <p>
            {origin.name}
            {state.givenName !== state.handle ? ` · ${state.givenName}` : ""}
          </p>
        </div>
      </div>
      <p className="perk">
        {origin.perk}. {origin.perkText}
      </p>
      <div className="tabs" role="tablist">
        {(["stats", "gear", "journal"] as const).map((id) => (
          <button key={id} className="tab" type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
            {id}
          </button>
        ))}
      </div>
      {tab === "stats" && (
        <div>
          {STATS.map((stat) => (
            <div className="stat" key={stat}>
              <span className="stat-name">{STAT_INFO[stat].name}</span>
              <span>{state.stats[stat]}</span>
              <div className="track" aria-hidden="true">
                <span style={{ width: `${(state.stats[stat] / 5) * 100}%` }} />
              </div>
            </div>
          ))}
          {state.rolls.length > 0 && (
            <ul className="rolls">
              {state.rolls.slice(0, 4).map((roll, index) => (
                <li key={`${roll.label}-${index}`} className={roll.success ? "ok" : "no"}>
                  {roll.label}: {roll.roll} + {roll.total - roll.roll} = {roll.total} vs {roll.dc}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {tab === "gear" && (
        <ul className="gear">
          {state.items.length === 0 && <li className="empty">Pockets empty, which is a kind of honesty.</li>}
          {state.items.map((id) => (
            <li key={id}>
              <strong>{ITEMS[id]?.name ?? id}</strong>
              <span>{id === "shard" && state.flags.ash ? "Damaged. Half a voice, flickering." : ITEMS[id]?.blurb}</span>
            </li>
          ))}
        </ul>
      )}
      {tab === "journal" && (
        <ul className="journal">
          {state.journal.length === 0 && <li className="empty">The city has not told you anything you trust.</li>}
          {state.journal.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      <button className="ghost sheet-toggle" type="button" onClick={onClose}>
        Close sheet
      </button>
    </aside>
  );
}
