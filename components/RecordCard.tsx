import type { ReactNode } from "react";
import { Symbol } from "./Symbol";
export function RecordCard({ title, kind, children, testId, compact = false }: {
  title: string; kind: "fact" | "claim" | "promise"; children: ReactNode; testId?: string; compact?: boolean;
}) {
  return <li className={`record-card${compact ? " compact" : ""}`} data-kind={kind} data-testid={testId}>
    <div className="record-heading"><span className="record-emblem"><Symbol name={kind} /></span>
      {compact ? <strong>{title}</strong> : <h3>{title}</h3>}</div>
    {children}
  </li>;
}
