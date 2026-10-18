"use client";

import { useEffect, useRef, useState } from "react";
import { DialogFrame } from "./DialogFrame";
import { CastCard } from "./CastCard";
import { InventoryIllustration } from "./InventoryIllustration";
import { RecordCard } from "./RecordCard";
import { Symbol } from "./Symbol";
import { Mark, originAccent } from "@/components/Mark";
import { COMPLICATIONS, FACTIONS, FACTION_CHECK, FACTION_INFO, ORIGINS, STATS, STAT_INFO } from "@/lib/character";
import { ITEMS } from "@/lib/items";
import { journalKind, journalTitle, promiseStatus } from "@/lib/journal";
import { learnedPerks } from "@/lib/progression";
import { objectives } from "@/lib/objectives";
import { memoryDisposition } from "@/lib/evidence";
import { metCast } from "@/lib/story/cast";
import { characterConduct } from "@/lib/relationships";
import { characterProfile } from "@/lib/character-profiles";
import type { GameState } from "@/lib/types";

const TABS = ["stats", "gear", "journal"] as const;

export function Sheet({ state, open, onClose, onMap, speaker, visibleText, artwork = true }: { state: GameState; open: boolean; onClose: () => void; onMap: () => void; speaker?: string; visibleText?: string; artwork?: boolean }) {
  const [tab, setTab] = useState<"stats" | "gear" | "journal">("stats");
  const origin = ORIGINS[state.origin];
  const ref = useRef<HTMLElement>(null);
  const [narrow, setNarrow] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const people = metCast(state, speaker, visibleText);
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
      <button className="ghost sheet-map" type="button" aria-haspopup="dialog" onClick={onMap}><Symbol name="location" /> City map</button>
      <details className="sheet-reference"><summary>Origin & complication</summary>
      <p className="perk">
        {origin.perk}. {origin.perkText}
      </p>
      {state.complication && (
        <p className="perk">
          {COMPLICATIONS[state.complication].name}. {COMPLICATIONS[state.complication].perk} {COMPLICATIONS[state.complication].cost}
        </p>
      )}
      </details>
      <details className="cast-roster" open={peopleOpen} onToggle={event => setPeopleOpen(event.currentTarget.open)}>
        <summary>People · {people.length} met</summary>
        <p className="hint">People you have encountered. Open About for a portrait and biography; encounter notes grow from your journal. Shared history records what happened between you.</p>
        <ul className="cast" data-testid="cast">
          {people.map(person => <CastCard key={person.speaker} person={person}
            history={characterConduct(state, person.name)} artwork={artwork && peopleOpen}
            profile={characterProfile(state, person.speaker, speaker, visibleText)} state={state} />)}
        </ul>
      </details>
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
      <div hidden={tab !== "stats"} role="tabpanel" id="panel-stats" aria-labelledby="tab-stats" tabIndex={0}>
          {learnedPerks(state).map((perk) => <p className="perk" key={perk.stat}><strong>{perk.name}</strong> · {perk.description}</p>)}
          {STATS.map((stat) => (
            <div className="stat" key={stat}>
              <span className="stat-name"><Symbol name={stat} /> {STAT_INFO[stat].name}</span>
              <span>{state.stats[stat]}</span>
              <div className="track" aria-hidden="true">
                <span style={{ width: `${(state.stats[stat] / 5) * 100}%` }} />
              </div>

            </div>
          ))}
          <details className="sheet-reference" data-testid="stat-reference"><summary>How stats work</summary>
            {STATS.map(stat => <p className="hint" key={stat}><strong>{STAT_INFO[stat].name}</strong> · {STAT_INFO[stat].blurb}</p>)}
          </details>
          <h3 className="sheet-label">Factions</h3>
          {FACTIONS.map((faction) => (
            <div className="stat" key={faction} data-testid={`faction-${faction}`}>
              <span className="stat-name"><Symbol name={faction} /> {FACTION_INFO[faction].name}</span>
              <span>{state.factions[faction]}</span>
              <div className="track" aria-hidden="true">
                <span style={{ width: `${((state.factions[faction] + 3) / 8) * 100}%` }} />
              </div>

            </div>
          ))}
          <details className="sheet-reference" data-testid="faction-reference"><summary>How factions affect checks</summary>
            {FACTIONS.map(faction => <p className="hint" key={faction}><strong>{FACTION_INFO[faction].name}</strong> · {FACTION_INFO[faction].blurb} {FACTION_CHECK[faction]}</p>)}
          </details>
          <details className="sheet-reference"><summary>What you did · {recent.length} recent</summary>
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
          </details>
        </div>
        <div hidden={tab !== "gear"} role="tabpanel" id="panel-gear" aria-labelledby="tab-gear" tabIndex={0}>
        <ul className="gear">
          {state.items.length === 0 && <li className="empty">Pockets empty, which is a kind of honesty.</li>}
          {state.items.map((id) => (
            <li key={id}>
              {tab === "gear" && artwork && Object.hasOwn(ITEMS, id) && <InventoryIllustration key={`${id}-${Boolean(state.flags.ash)}`} id={id} name={ITEMS[id].name} damaged={Boolean(state.flags.ash)} />}
              <div className="gear-copy"><strong>{Object.hasOwn(ITEMS, id) ? ITEMS[id].name : id}</strong>
              <span>{id === "shard" && state.flags.ash ? "Damaged. Half a voice, flickering." : Object.hasOwn(ITEMS, id) ? ITEMS[id].blurb : ""}</span></div>
            </li>
          ))}
        </ul>
        </div>
        <div hidden={tab !== "journal"} role="tabpanel" id="panel-journal" aria-labelledby="tab-journal" tabIndex={0}>
        <ul className="journal">
          <li className="evidence-summary">{memoryDisposition(state)}</li>
          {objectives(state).map((row) => <li key={`objective-${row.id}`}><strong>{row.title} · {row.status}</strong><span>{row.detail}</span></li>)}
          {state.journal.length === 0 && <li className="empty">The city has not told you anything you trust.</li>}
          {state.journal.map((entry) => (
            <RecordCard key={entry.id} title={journalTitle(entry)} kind={journalKind(entry)} compact>
              <small className="journal-kind">{journalKind(entry)}{journalKind(entry) === "promise" ? ` · ${promiseStatus(entry.id, state.flags, state.journal)}` : ""}</small>
              <span>{entry.text}</span>
            </RecordCard>
          ))}
        </ul>
        </div>
      <button className="ghost sheet-toggle" type="button" onClick={onClose}>
        Close sheet
      </button>
    </aside>
  );
  if (narrow) return open ? <DialogFrame titleId="sheet-title" className="sheet-drawer" onEscape={onClose}>{content}</DialogFrame> : null;
  return content;
}
