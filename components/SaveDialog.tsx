"use client";
import { useState } from "react";
import { DialogFrame } from "./DialogFrame";
import { checkpointLabel } from "@/lib/checkpoints";
import { currentGoal } from "@/lib/story/goal";
import { downloadJson } from "@/lib/download";
import { loadBackup } from "@/lib/storage";
import { exportRun, importRun, loadSlot, saveSlot, SLOT_IDS, type SlotId } from "@/lib/vault";
import type { GameState } from "@/lib/types";

export function SaveDialog({ state, onLoad, onClose, onTitle }: { state: GameState | null; onLoad: (state: GameState, source: string) => void; onClose: () => void; onTitle?: () => void }) {
  const [slots, setSlots] = useState(() => SLOT_IDS.map((id) => ({ id, snapshot: loadSlot(id) })));
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState<{ kind: "save"; id: SlotId } | { kind: "load"; state: GameState; source: string } | null>(null);
  const backup = loadBackup();
  function save(id: SlotId) {
    if (!state) return;
    const success = saveSlot(id, state);
    setMessage(success ? `Slot ${id} saved.` : "This browser could not store the slot. Export your run to keep a copy.");
    setSlots(SLOT_IDS.map((slot) => ({ id: slot, snapshot: loadSlot(slot) })));
    setConfirm(null);
  }
  function load(next: GameState, source: string) {
    if (state) setConfirm({ kind: "load", state: next, source });
    else onLoad(next, source);
  }
  return <DialogFrame titleId="saves-title" className="wide" onEscape={onClose}>
    <p className="eyebrow">Keep a way back</p><h2 id="saves-title">Saves & recovery</h2>
    <p>Progress autosaves after every choice and when the die lands. Slots and exported files keep separate copies.</p>
    <div className="save-slots">{slots.map(({ id, snapshot }) => <section key={id} className="save-slot">
      <h3>Slot {id}</h3><p>{snapshot ? `${snapshot.state.handle} · ${new Date(snapshot.savedAt).toLocaleString()}` : "Empty"}</p>
      {snapshot && <><p className="checkpoint-label">{checkpointLabel(snapshot.state)}</p><p className="hint">{currentGoal(snapshot.state)}</p></>}
      <div className="actions"><button className="ghost" type="button" disabled={!state} onClick={() => snapshot ? setConfirm({ kind: "save", id }) : save(id)}>Save to slot {id}</button><button className="ghost" type="button" disabled={!snapshot} onClick={() => snapshot && load(snapshot.state, `Slot ${id}`)}>Load slot {id}</button></div>
    </section>)}</div>
    <div className="actions"><button type="button" className="ghost" disabled={!state} onClick={() => state && downloadJson("saint-shard-run.json", exportRun(state))}>Export run</button><button type="button" className="ghost" disabled={!backup} onClick={() => backup && load(backup, "Automatic backup")}>Restore automatic backup</button></div>
    <label>Import a saved run<input type="file" accept=".json,application/json" onChange={async (event) => {
      const file = event.target.files?.[0]; event.target.value = "";
      if (!file) return;
      if (file.size > 1_048_576) { setMessage("Choose a Saint Shard save under 1 MB."); return; }
      try { load(importRun(await file.text()), "Imported run"); } catch (error) { setMessage(error instanceof Error ? error.message : "The save could not be opened."); }
    }} /></label>
    {confirm && <section className="confirmation" aria-label="Confirm save operation"><p>{confirm.kind === "save" ? `Replace the existing run in slot ${confirm.id}?` : `Load ${confirm.source} — ${checkpointLabel(confirm.state)} and replace your active autosave? Your manual slots stay available.`}</p><div className="actions"><button className="primary" type="button" onClick={() => confirm.kind === "save" ? save(confirm.id) : onLoad(confirm.state, confirm.source)}>Confirm {confirm.kind}</button><button className="ghost" type="button" onClick={() => setConfirm(null)}>Cancel</button></div></section>}
    <p role="status">{message}</p><div className="dialog-actions"><button type="button" className="primary" onClick={onClose}>Close saves</button>{onTitle && <button type="button" className="ghost" onClick={onTitle}>Return to title</button>}</div>
  </DialogFrame>;
}
