"use client";

import { useState } from "react";
import type { CastMember } from "@/lib/story/cast";

export function CastCard({ person, history, artwork }: { person: CastMember; history?: string; artwork: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <li className="cast-card" data-speaker={person.speaker}>
      {artwork && !failed ? (
        <img className="cast-portrait" src={person.thumbnail} alt="" width={80} height={107}
          loading="lazy" decoding="async" onError={() => setFailed(true)} />
      ) : <span className="cast-placeholder" aria-hidden="true">{person.name.slice(0, 1)}</span>}
      <div className="cast-card-copy">
        <strong>{person.name}</strong>
        <span>{person.role}</span>
        {history && <small className="cast-conduct">Shared history · {history}</small>}
      </div>
    </li>
  );
}
