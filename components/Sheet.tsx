"use client";

import { useEffect, useRef, useState } from "react";
import { DialogFrame } from "./DialogFrame";
import { Mark, originAccent } from "@/components/Mark";
import { COMPLICATIONS, FACTIONS, FACTION_CHECK, FACTION_INFO, ORIGINS, STATS, STAT_INFO } from "@/lib/character";
import { ITEMS } from "@/lib/items";
import { journalKind, journalTitle, promiseStatus } from "@/lib/journal";
import { learnedPerks } from "@/lib/progression";
import { objectives } from "@/lib/objectives";
import { memoryDisposition } from "@/lib/evidence";
import { metCast } from "@/lib/story/cast";
import type { GameState } from "@/lib/types";

const TABS = ["stats", "gear", "journal"] as const;

export function Sheet({ state, open, onClose, speaker }: { state: GameState; open: boolean; onClose: () => void; speaker?: string }) {
  const [tab, setTab] = useState<"stats" | "gear" | "journal">("stats");
  const origin = ORIGINS[state.origin];
  const ref = useRef<HTMLElement>(null);
  const [narrow, setNarrow] = useState(false);
  const recent = (state.log ?? []).slice(-6).reverse();
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1100px)");
    const update = () => setNarrow(media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const content = (
    <aside
      ref={ref}
      id="runner-sheet"
      className={narrow ? "sheet open" : "sheet"}
      data-testid="sheet"
      role="complementary"
      aria-label="Character sheet"
    >
      <div className="who">
        <Mark accent={originAccent(state.origin)} />
        <div>
          <h2 id="sheet-title">{state.handle}</h2>
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
      <div className="tabs" role="tablist" aria-label="Character details">
        {TABS.map((id, index) => (
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
            onKeyDown={(event) => {
              let nextIndex: number;
              if (event.key === "ArrowRight") nextIndex = (index + 1) % TABS.length;
              else if (event.key === "ArrowLeft") nextIndex = (index + TABS.length - 1) % TABS.length;
              else if (event.key === "Home") nextIndex = 0;
              else if (event.key === "End") nextIndex = TABS.length - 1;
              else return;
              event.preventDefault();
              const nextTab = TABS[nextIndex];
              setTab(nextTab);
              ref.current?.querySelector<HTMLButtonElement>(`#tab-${nextTab}`)?.focus();
            }}
          >
            {id}
          </button>
        ))}
      </div>
      <div hidden={tab !== "stats"} role="tabpanel" id="panel-stats" aria-labelledby="tab-stats">
          {learnedPerks(state).map((perk) => <p className="perk" key={perk.stat}><strong>{perk.name}</strong> · {perk.description}</p>)}
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
        <ul hidden={tab !== "gear"} className="gear" role="tabpanel" id="panel-gear" aria-labelledby="tab-gear">
          {state.items.length === 0 && <li className="empty">Pockets empty, which is a kind of honesty.</li>}
          {state.items.map((id) => (
            <li key={id}>
              <strong>{ITEMS[id]?.name ?? id}</strong>
              <span>{id === "shard" && state.flags.ash ? "Damaged. Half a voice, flickering." : ITEMS[id]?.blurb}</span>
            </li>
          ))}
        </ul>
        <ul hidden={tab !== "journal"} className="journal" role="tabpanel" id="panel-journal" aria-labelledby="tab-journal">
          <li className="evidence-summary">{memoryDisposition(state)}</li>
          {objectives(state).map((row) => <li key={`objective-${row.id}`}><strong>{row.title} · {row.status}</strong><span>{row.detail}</span></li>)}
          {state.journal.length === 0 && <li className="empty">The city has not told you anything you trust.</li>}
          {state.journal.map((entry) => (
            <li key={entry.id}>
              <strong>{journalTitle(entry)}</strong>
              <small className="journal-kind">{journalKind(entry)}{journalKind(entry) === "promise" ? ` · ${promiseStatus(entry.id, state.flags, state.journal)}` : ""}</small>
              <span>{entry.text}</span>
            </li>
          ))}
        </ul>
      <button className="ghost sheet-toggle" type="button" onClick={onClose}>
        Close sheet
      </button>
    </aside>
  );
  if (narrow) return open ? <DialogFrame titleId="sheet-title" className="sheet-drawer" onEscape={onClose}>{content}</DialogFrame> : null;
  return content;
}
