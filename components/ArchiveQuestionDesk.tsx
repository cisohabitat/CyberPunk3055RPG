"use client";
import { useEffect, useRef } from "react";
import { CRAFT_RECORDS } from "@/lib/encounter-craft";
import type { VisibleChoice } from "@/lib/engine";
import type { GameState } from "@/lib/types";

/** Written source descriptions; inspection invokes the actual canonical free action. */
export function ArchiveQuestionDesk({ state, choices, onInspect, numberShortcuts }: { state: GameState; choices: VisibleChoice[]; onInspect: (choice: VisibleChoice) => void; numberShortcuts: boolean }) {
  const root = useRef<HTMLElement>(null), requested = useRef<string | null>(null);
  const readKey = CRAFT_RECORDS.map(r => Number(Boolean(state.flags[`craft_read_${r.id}`]))).join("");
  useEffect(() => {
    if (!requested.current) return;
    const target = root.current?.querySelector<HTMLElement>(`[data-record="${requested.current}"] h3`);
    requested.current = null;
    if (!target) return;
    const height = document.querySelector(".topbar")?.getBoundingClientRect().height ?? 0;
    document.documentElement.style.setProperty("--header-h", `${height + 12}px`);
    target.focus({ preventScroll: true }); target.scrollIntoView({ block: "start", behavior: "instant" });
  }, [readKey]);
  const count = CRAFT_RECORDS.filter(r => state.flags[`craft_read_${r.id}`]).length;
  return <section ref={root} className="question-desk" aria-label="Compare archive descriptions" data-testid="archive-question-desk">
    <h2>Compare the records</h2>
    <p className="hint">Descriptions help you choose a request. Inspection retrieves no ledger and tests no issuing key.</p>
    <ol className="question-records">{CRAFT_RECORDS.map(record => {
      const read = state.flags[`craft_read_${record.id}`], choice = choices.find(c => c.id === `craft-read-${record.id}`);
      return <li key={record.id} data-record={record.id} data-testid={`craft-record-${record.id}`}>
        <h3 tabIndex={-1}>{record.title}</h3>
        {read ? <><p>{record.text}</p><p className="question-read-state">Description inspected</p></> : choice && <button className="ghost" type="button" data-testid={`choice-${choice.id}`} disabled={!choice.enabled} aria-keyshortcuts={numberShortcuts ? String(choices.indexOf(choice) + 1) : undefined} onClick={() => { requested.current = record.id; onInspect(choice); }}>{choice.label}</button>}
      </li>;
    })}</ol>
    <p className="hint" role="status" aria-atomic="true">{count} of 3 descriptions inspected. {count === 3 ? "Choose the question below." : "Inspection is free."}</p>
  </section>;
}
