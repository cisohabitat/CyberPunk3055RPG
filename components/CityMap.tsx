"use client";
import { useState } from "react";
import { cityMap } from "@/lib/city-map";
import { CITY_SCHEMATIC } from "@/lib/presentation-art";
import { checkpointLabel } from "@/lib/checkpoints";
import type { GameState } from "@/lib/types";
import { DialogFrame } from "./DialogFrame";
import { Symbol } from "./Symbol";
export function CityMap({ state, artwork, onClose, onFind }: { state: GameState; artwork: boolean; onClose: () => void; onFind: (id: string) => void }) {
  const rows = cityMap(state), [failed, setFailed] = useState(false);
  return <DialogFrame titleId="city-map-title" className="city-map-dialog" onEscape={onClose}>
    <div className="map-heading"><div><p className="eyebrow">Runner’s field notes</p><h2 id="city-map-title">Kite City · known places</h2></div>
      <button className="ghost" type="button" data-dialog-initial-focus onClick={onClose}>Close map</button></div>
    <p className="map-position"><Symbol name="location" /> Current checkpoint: {checkpointLabel(state)}</p>
    <p className="hint">A schematic of places introduced in your run. Positions show no distance or travel directions. Find locates an existing choice for you to review; it spends nothing.</p>
    <div className="city-map-board" data-artwork={artwork && !failed ? "true" : "false"}>
      {artwork && !failed && <img className="city-map-texture" src={CITY_SCHEMATIC.small} srcSet={`${CITY_SCHEMATIC.small} 600w, ${CITY_SCHEMATIC.src} 1200w`} sizes="(max-width: 700px) calc(100vw - 4rem), 760px" width={1200} height={800} alt="" decoding="async" onError={() => setFailed(true)} />}
      <ol className="district-nodes" aria-label="Known locations">{rows.map(row => <li key={row.id} data-district={row.id} aria-current={row.current ? "location" : undefined}>
        <Symbol name="location" /><h3>{row.name}</h3><span className="district-status">{row.current ? "You are here" : "Known place"}</span>
        {row.choices.length > 0 && <ul aria-label={`Choices available for ${row.name}`}>{row.choices.map(choice => <li key={choice.id}>
          <button type="button" className="ghost" onClick={() => onFind(choice.id)}>Find: {choice.label}</button>
        </li>)}</ul>}
      </li>)}</ol>
    </div>
    {failed && <p className="hint">Map artwork unavailable. Every known place and available choice remains above.</p>}
    <p className="hint">Places appear as your run introduces them. Their notes and commitments stay in your journal.</p>
  </DialogFrame>;
}
