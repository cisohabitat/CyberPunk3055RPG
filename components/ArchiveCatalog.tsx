"use client";

import { useEffect, useRef, useState } from "react";
import { ARCHIVE_CATALOG, catalogFeedback } from "@/lib/archive-catalog";
import { effectPreview, type VisibleChoice } from "@/lib/engine";
import type { GameState } from "@/lib/types";

function revealControl(element: HTMLElement | null | undefined) {
  element?.focus({ preventScroll: true });
  element?.scrollIntoView({ block: "nearest", behavior: "instant" });
}

export function ArchiveCatalog({ state, choices, onChoose, numberShortcuts }: {
  state: GameState; choices: VisibleChoice[]; onChoose: (choice: VisibleChoice) => void; numberShortcuts: boolean;
}) {
  const root = useRef<HTMLElement>(null), previousOpen = useRef(Boolean(state.flags.archive_catalog_open));
  const [selected, setSelected] = useState<string | null>(null);
  const open = Boolean(state.flags.archive_catalog_open);
  useEffect(() => {
    if (open && !previousOpen.current) {
      revealControl(root.current?.querySelector<HTMLElement>("h2"));
    }
    if (!open) {
      if (previousOpen.current) revealControl(document.getElementById("archive-catalog-toggle"));
      setSelected(null);
    }
    previousOpen.current = open;
  }, [open]);
  useEffect(() => {
    if (selected) revealControl(root.current?.querySelector<HTMLElement>(`#${selected}`));
  }, [selected, state.flags]);
  if (!open) return null;
  const action = (id: string, target?: string) => {
    const choice = choices.find(choice => choice.id === id);
    if (!choice) return null;
    const index = choices.indexOf(choice), detail = choice.disabledReason ?? [choice.detail, ...effectPreview(state, choice)].filter(Boolean).join(" · ");
    return <div className="catalog-action"><button className="ghost" type="button" data-testid={`choice-${id}`} disabled={!choice.enabled}
      aria-describedby={`catalog-detail-${id}`} aria-keyshortcuts={numberShortcuts && choice.enabled && index < 9 ? String(index + 1) : undefined}
      onClick={() => { if (target) setSelected(target); onChoose(choice); }}>
      {numberShortcuts && index < 9 ? `${index + 1} · ` : ""}{choice.label}
    </button><p className="hint" id={`catalog-detail-${id}`}>{detail}</p></div>;
  };
  const feedback = catalogFeedback(state);
  return <section ref={root} className="archive-catalog" aria-labelledby="catalog-title" data-testid="archive-catalog">
    <h2 id="catalog-title" tabIndex={-1}>The catalog drawer</h2>
    <p>Find a second source for the later evacuation revision. Start with what the intact export actually records.</p>
    <dl className="catalog-receipt"><div><dt>Earlier decision</dt><dd>Mara authorized the coolant flush.</dd></div><div><dt>Later receipt</dt><dd>Evacuation canceled; the flush retained.</dd></div><div><dt>Search target</dt><dd>A shift record of that later revision. A catalog description is a locator, not the record.</dd></div></dl>
    <p className="hint">Reading descriptions is free. Submitting a locator logs the query: Helion +1. A mismatch also alerts the reader. Existing retrieval methods remain available below.</p>
    <div className="catalog-records">{ARCHIVE_CATALOG.map(record => <article key={record.id} data-testid={`catalog-record-${record.id}`}>
      <h3 id={`catalog-heading-${record.id}`} tabIndex={-1}>{record.title}</h3><p className="eyebrow">{record.reference}</p>
      {state.flags[`archive_catalog_read_${record.id}`] ? <><dl><div><dt>Scope</dt><dd>{record.scope}</dd></div><div><dt>Catalog entry</dt><dd>{record.entry}</dd></div><div><dt>Limit</dt><dd>{record.limit}</dd></div></dl>
        {action(`catalog-request-${record.id}`, `catalog-result-${record.id}`)}</> : action(`catalog-inspect-${record.id}`, `catalog-heading-${record.id}`)}
      {feedback.filter(row => row.id === record.id).map(row => <p key={row.id} className="catalog-feedback" id={`catalog-result-${record.id}`} tabIndex={-1} role="status">{row.text}</p>)}
    </article>)}</div>
    {state.flags.archive_catalog_located && <section className="catalog-retrieval" aria-label="Staffed retrieval" data-testid="catalog-retrieval">
      <h3>Retrieve the record</h3><p>The correct locator opens a staffed search. A payment or employee bill retrieves the actual ledger extraction. Custody and source-name permission follow separately.</p>
      {action("catalog-buy-extraction")}{action("catalog-bill-employee")}
    </section>}
    {action("close-archive-catalog")}
  </section>;
}
