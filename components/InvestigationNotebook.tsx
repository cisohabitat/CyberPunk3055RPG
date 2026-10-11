"use client";

import { useState } from "react";
import { DialogFrame } from "./DialogFrame";
import { filterNotebookSources, notebookSources, SOURCE_GROUPS, type SourceGroup } from "@/lib/investigation-notebook";
import { sourceReadiness } from "@/lib/source-ledger";
import type { GameState } from "@/lib/types";

export function InvestigationNotebook({ state, onClose }: { state: GameState; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<SourceGroup | "all">("all");
  const sources = notebookSources(state);
  const visible = filterNotebookSources(state, group, query);
  const readiness = sourceReadiness(state);
  return <DialogFrame titleId="notebook-title" className="source-notebook" onEscape={onClose}>
    <div className="notebook-tools">
      <h2 id="notebook-title">Investigation notebook</h2>
      <button className="ghost" type="button" data-testid="close-notebook" onClick={onClose}>Return to the decision</button>
      <div className="notebook-filters">
        <div><label htmlFor="notebook-query">Find in acquired records</label><input id="notebook-query" data-dialog-initial-focus type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Source, phrase or timestamp" /></div>
        <div><label htmlFor="notebook-group">Record group</label><select id="notebook-group" value={group} onChange={event => setGroup(event.target.value as SourceGroup | "all")}>
          <option value="all">All records ({sources.length})</option>
          {SOURCE_GROUPS.map(category => <option key={category.id} value={category.id}>{category.label} ({sources.filter(source => source.group === category.id).length})</option>)}
        </select></div>
      </div>
      <p role="status" aria-atomic="true" data-testid="notebook-count">Showing {visible.length} of {sources.length} acquired records</p>
      {(query || group !== "all") && <button className="ghost" type="button" onClick={() => { setQuery(""); setGroup("all"); }}>Show all records</button>}
    </div>
    <section aria-label="Current source limits" className="notebook-limits">
      <h3>Current source limits</h3>
      <dl><dt>Cancellation</dt><dd>{readiness.cancellation}</dd><dt>Public quotation</dt><dd>{readiness.quotation}</dd></dl>
    </section>
    <p className="hint">Records keep their original wording and recorded status. A later source or correction stays separate. Filtering changes this view, not the account.</p>
    {visible.length ? <ol className="notebook-records" aria-label="Matching acquired records">{visible.map(record => <li key={record.id} data-testid={`notebook-${record.id}`}>
      <h3>{record.title}</h3>
      <p className="hint">{SOURCE_GROUPS.find(group => group.id === record.group)!.label} · Recorded as {record.kind}</p>
      {record.time && <p className="notebook-provenance"><strong>{record.time}</strong> · {record.provenance}</p>}
      <p>{record.text}</p>
    </li>)}</ol> : <p data-testid="notebook-empty">No acquired records match. Try another phrase or show all records.</p>}
  </DialogFrame>;
}
