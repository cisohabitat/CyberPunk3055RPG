"use client";

import { useEffect, useRef, useState } from "react";
import { Mark, originAccent } from "@/components/Mark";
import { COMPLICATIONS, FACTIONS, FACTION_CHECK, FACTION_INFO, ORIGINS, STATS, STAT_INFO } from "@/lib/character";
import { ITEMS } from "@/lib/items";
import { journalTitle } from "@/lib/journal";
import { metCast } from "@/lib/story/cast";
import type { GameState } from "@/lib/types";

export function Sheet({ state, open, onClose, speaker }: { state: GameState; open: boolean; onClose: () => void; speaker?: string }) {
  const [tab, setTab] = useState<"stats" | "gear" | "journal">("stats");
  const origin = ORIGINS[state.origin];
  const ref = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const recent = (state.log ?? []).slice(-6).reverse();

  useEffect(() => {
    if (!open) return;
    const root = ref.current;
    if (!root) return;
    const narrow = window.matchMedia("(max-width: 1100px)").matches;
    if (!narrow) return;
    const focusable = () =>
      [...root.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input, select, textarea")];
    focusable()[0]?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = focusable();
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    root.addEventListener("keydown", onKey);
    return () => root.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <aside
      ref={ref}
      id="runner-sheet"
      className={open ? "sheet open" : "sheet"}
      data-testid="sheet"
      role={open ? "dialog" : "complementary"}
      aria-modal={open ? true : undefined}
      aria-label="Character sheet"
    >
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
      {state.complication && (
        <p className="perk">
          {COMPLICATIONS[state.complication].name}. {COMPLICATIONS[state.complication].perk} {COMPLICATIONS[state.complication].cost}
        </p>
      )}
      <h3 className="sheet-label">People</h3>
      <ul className="cast" data-testid="cast">
        {metCast(state, speaker).map((person) => (
          <li key={person.name}>
            <strong>{person.name}</strong>
            <span>{person.role}</span>
          </li>
        ))}
      </ul>
      <div className="tabs" role="tablist">
        {(["stats", "gear", "journal"] as const).map((id) => (
          <button
            key={id}
            id={`tab-${id}`}
            className="tab"
            type="button"
            role="tab"
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            tabIndex={tab === id ? 0 : -1}
            onClick={() => setTab(id)}
          >
            {id}
          </button>
        ))}
      </div>
      {tab === "stats" && (
        <div role="tabpanel" id="panel-stats" aria-labelledby="tab-stats">
          {STATS.map((stat) => (
            <div className="stat" key={stat}>
              <span className="stat-name">{STAT_INFO[stat].name}</span>
              <span>{state.stats[stat]}</span>
              <div className="track" aria-hidden="true">
                <span style={{ width: `${(state.stats[stat] / 5) * 100}%` }} />
              </div>
              <p className="hint">{STAT_INFO[stat].blurb}</p>
            </div>
          ))}
          <h3 className="sheet-label">Factions</h3>
          {FACTIONS.map((faction) => (
            <div className="stat" key={faction} data-testid={`faction-${faction}`}>
              <span className="stat-name">{FACTION_INFO[faction].name}</span>
              <span>{state.factions[faction]}</span>
              <div className="track" aria-hidden="true">
                <span style={{ width: `${((state.factions[faction] + 3) / 8) * 100}%` }} />
              </div>
              <p className="hint">{FACTION_INFO[faction].blurb}</p>
              <p className="hint">{FACTION_CHECK[faction]}</p>
            </div>
          ))}
          <h3 className="sheet-label">What you did</h3>
          <ul className="journal" data-testid="choice-log">
            {recent.length === 0 && <li className="empty">Nothing committed yet.</li>}
            {recent.map((line, index) => (
              <li key={`${line}-${index}`}>{line}</li>
            ))}
          </ul>
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
        <ul className="gear" role="tabpanel" id="panel-gear" aria-labelledby="tab-gear">
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
        <ul className="journal" role="tabpanel" id="panel-journal" aria-labelledby="tab-journal">
          {state.journal.length === 0 && <li className="empty">The city has not told you anything you trust.</li>}
          {state.journal.map((entry) => (
            <li key={entry.id}>
              <strong>{journalTitle(entry)}</strong>
              <span>{entry.text}</span>
            </li>
          ))}
        </ul>
      )}
      <button className="ghost sheet-toggle" type="button" onClick={onClose}>
        Close sheet
      </button>
    </aside>
  );
}
