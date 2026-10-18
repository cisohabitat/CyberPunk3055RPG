import type { ReactNode } from "react";
import { Symbol } from "./Symbol";
import type { SourceGroup } from "@/lib/investigation-notebook";
export function RecordCard({ title, kind, children, testId, compact = false, document }: {
  title: string; kind: "fact" | "claim" | "promise"; children: ReactNode; testId?: string; compact?: boolean; document?: SourceGroup;
}) {
  return <li className={`record-card${compact ? " compact" : ""}${document ? " record-document" : ""}`} data-kind={kind} data-source-group={document} data-testid={testId}>
    <div className="record-heading"><span className="record-emblem"><Symbol name={kind} /></span>
      {compact ? <strong>{title}</strong> : <h3>{title}</h3>}</div>
    {children}
  </li>;
}
