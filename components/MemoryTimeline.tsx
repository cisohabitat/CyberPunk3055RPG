"use client";

import { useEffect, useRef } from "react";
import { FRAGMENTS } from "@/lib/evidence";
import { memorySequence } from "@/lib/memory-model";
import type { VisibleChoice } from "@/lib/engine";
import type { GameState } from "@/lib/types";

export function MemoryTimeline({ state, choices, onPlace }: { state: GameState; choices: VisibleChoice[]; onPlace: (choice: VisibleChoice) => void }) {
  const slots = memorySequence(state);
  const filled = slots.filter(Boolean).length;
  const last = slots[filled - 1]?.id;
  const previousFilled = useRef(filled);
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (filled > previousFilled.current && last) root.current?.querySelector<HTMLElement>(`#timeline-source-${last}`)?.focus({ preventScroll: true });
    previousFilled.current = filled;
  }, [filled, last]);
  return <section ref={root} className="memory-plate memory-workspace" aria-label="Draft memory timeline" data-testid="memory-workspace">
    <div className="memory-header"><h2>Arrange the hour</h2><span role="status">{filled} of 3 slots filled{filled ? ` · Last placed: ${slots[filled - 1]?.title}` : ""}</span></div>
    <ol className="memory-timeline" data-testid="draft-timeline">{slots.map((fragment, index) => <li key={index}>
      <span className="memory-time">Slot {index + 1}</span>
      <div><strong>{fragment?.title ?? "Empty"}</strong><p>{fragment ? `${fragment.time} · ${fragment.source}` : index === filled ? "Choose the next fragment below." : "Waiting for the previous slot."}</p></div>
    </li>)}</ol>
    <h3>Source cards</h3>
    <p className="hint">Open a card to consult its timestamp, then place it in the next empty slot.</p>
    <div className="memory-source-bank">{[FRAGMENTS[1], FRAGMENTS[2], FRAGMENTS[0]].filter((fragment) => state.flags[fragment.flag]).map((fragment) => {
      const choice = choices.find((option) => option.id === `place-${fragment.id}`);
      return <div key={fragment.id} className="memory-source-card"><details>
        <summary id={`timeline-source-${fragment.id}`}>{fragment.title}{state.flags[`memory_placed_${fragment.id}`] ? " · placed" : " · available"}</summary>
        <p><strong>{fragment.time}</strong> · {fragment.source}</p><p>{fragment.text}</p>
      </details>{choice && <button type="button" className="ghost" data-testid={`choice-${choice.id}`} aria-keyshortcuts={String(choices.indexOf(choice) + 1)} disabled={!choice.enabled} onClick={() => onPlace(choice)}>{choices.indexOf(choice) + 1} · Place {fragment.title.toLowerCase()} next</button>}</div>;
    })}</div>
  </section>;
}
