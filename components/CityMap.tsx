"use client";
import { useState } from "react";
import { mapDisplayRows, MAP_LANDMARKS } from "@/lib/city-map";
import { CITY_SCHEMATIC } from "@/lib/presentation-art";
import { checkpointLabel } from "@/lib/checkpoints";
import type { GameState } from "@/lib/types";
import { DialogFrame } from "./DialogFrame";
import { Symbol } from "./Symbol";
function Landmark({ id }: { id: keyof typeof MAP_LANDMARKS }) {
  const [failed, setFailed] = useState(false), art = MAP_LANDMARKS[id];
  return failed ? null : <img className="map-landmark" src={art.src} alt={art.description} width={600} height={400} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}
export function CityMap({ state, artwork, onClose, onFind }: { state: GameState; artwork: boolean; onClose: () => void; onFind: (id: string) => void }) {
  const rows = mapDisplayRows(state), [failed, setFailed] = useState(false);
  return <DialogFrame titleId="city-map-title" className="city-map-dialog" onEscape={onClose}>
    <div className="map-heading"><div><p className="eyebrow">Runner’s field notes</p><h2 id="city-map-title">Kite City · known places</h2></div>
      <button className="ghost" type="button" data-dialog-initial-focus onClick={onClose}>Close map</button></div>
    <p className="map-position"><Symbol name="location" /> Current checkpoint: {checkpointLabel(state)}</p>
    <p className="hint map-help">Known places, with your current location first. Find focuses a choice for review; it spends nothing.</p>
    <div className="city-map-board" data-artwork={artwork && !failed ? "true" : "false"}>
      {artwork && !failed && <img className="city-map-texture" src={CITY_SCHEMATIC.small} srcSet={`${CITY_SCHEMATIC.small} 600w, ${CITY_SCHEMATIC.src} 1200w`} sizes="(max-width: 700px) calc(100vw - 4rem), 760px" width={1200} height={800} alt="" decoding="async" onError={() => setFailed(true)} />}
      <ol className="district-nodes" aria-label="Known locations">{rows.map(row => <li key={row.id} data-district={row.id} aria-current={row.current ? "location" : undefined}>
        {artwork && <Landmark id={row.id} />}<div className="district-label"><Symbol name="location" /><h3>{row.name}</h3><span className="district-status">{row.current ? "You are here" : "Known place"}</span></div>
        {row.choices.length > 0 && <ul className="map-connections" aria-label={`Choices available for ${row.name}`}>{row.choices.map(choice => <li key={choice.id}>
          <button type="button" className="ghost" onClick={() => onFind(choice.id)}><span className="map-connection" aria-hidden="true">↳</span> Find: {choice.label}</button>
        </li>)}</ul>}
      </li>)}</ol>
    </div>
    {failed && <p className="hint">Map artwork unavailable. Every known place and available choice remains above.</p>}
    <p className="hint">This schematic gives no distance or travel directions. Places appear as your run introduces them; notes and commitments stay in your journal.</p>
  </DialogFrame>;
}
