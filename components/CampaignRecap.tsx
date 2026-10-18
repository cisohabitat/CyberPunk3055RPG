"use client";
import { useState } from "react";
import { campaignRecap } from "@/lib/presentation-art";
import type { GameState } from "@/lib/types";
import { SceneIllustration } from "./SceneIllustration";
export function CampaignRecap({ state, artwork }: { state: GameState; artwork: boolean }) {
  const [open, setOpen] = useState(false);
  return <details className="campaign-recap" open={open} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>Three moments from your run</summary>
    {open && <ol className="recap-moments">{campaignRecap(state).map((moment, index) => <li key={moment.chapter} data-testid={`recap-moment-${index}`}>
      <p className="eyebrow">0{index + 1} · {moment.chapter}</p>
      {artwork && moment.art && <SceneIllustration art={moment.art} paired />}
      <p>{moment.text}</p>
    </li>)}</ol>}
  </details>;
}
