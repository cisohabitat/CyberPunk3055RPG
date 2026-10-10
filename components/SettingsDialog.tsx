"use client";
import { DialogFrame } from "./DialogFrame";
import { downloadJson } from "@/lib/download";
import { APP_VERSION, diagnosticsReport } from "@/lib/diagnostics";
import type { Preferences } from "@/lib/preferences";

export function SettingsDialog({ preferences, onChange, onClose }: { preferences: Preferences; onChange: (next: Preferences) => void; onClose: () => void }) {
  const update = <K extends keyof Preferences>(key: K, value: Preferences[K]) => onChange({ ...preferences, [key]: value });
  return <DialogFrame titleId="settings-title" className="wide" onEscape={onClose}>
    <p className="eyebrow">Make the city readable</p><h2 id="settings-title">Settings</h2>
    <div className="settings-grid">
      <label>Text size<select aria-label="Text size" value={preferences.textStep} onChange={(event) => update("textStep", Number(event.target.value))}><option value={0}>Standard</option><option value={1}>Large</option><option value={2}>Largest</option></select></label>
      <label>Contrast<select aria-label="Contrast" value={preferences.contrast} onChange={(event) => update("contrast", event.target.value as Preferences["contrast"])}><option value="standard">Atmospheric</option><option value="high">High contrast</option></select></label>
      <label>Reading pace<select aria-label="Reading pace" value={preferences.reading} onChange={(event) => update("reading", event.target.value as Preferences["reading"])}><option value="paragraph">One paragraph at a time</option><option value="all">Show the whole scene</option></select></label>
      <label>Motion<select aria-label="Motion" value={preferences.motion} onChange={(event) => update("motion", event.target.value as Preferences["motion"])}><option value="system">Follow device preference</option><option value="reduce">Reduce motion</option></select></label>
      <label>Artwork<select aria-label="Artwork" value={preferences.artwork} onChange={(event) => update("artwork", event.target.value as Preferences["artwork"])}><option value="full">Illustrated</option><option value="none">Text only · reduce downloads</option></select></label>
      <label className="check-label"><input type="checkbox" checked={preferences.sound} onChange={(event) => update("sound", event.target.checked)} />Sound enabled</label>
      {(["music", "ambience", "effects", "voices"] as const).map((channel) => <label key={channel}>{channel} · {preferences[channel]}%<input aria-label={`${channel} volume`} type="range" min={0} max={100} value={preferences[channel]} onChange={(event) => update(channel, Number(event.target.value))} /></label>)}
      <label className="check-label"><input type="checkbox" checked={preferences.controller} onChange={(event) => update("controller", event.target.checked)} />Controller support</label>
    </div>
    <p className="hint">Controller: D-pad up/down moves focus; left/right adjusts settings and sheet tabs. A selects; B goes back. Number keys choose story options. Arrow keys switch sheet tabs.</p>
    <p className="hint">Contains corporate violence, coercion, grief, and memory editing. Sound and motion are optional.</p>
    <div className="dialog-actions"><button type="button" className="primary" onClick={onClose}>Done</button><button type="button" className="ghost" onClick={() => downloadJson("saint-shard-diagnostics.json", diagnosticsReport())}>Export diagnostics</button></div>
    <p className="fine">Saint Shard {APP_VERSION} · Diagnostics stay on this device until you export them.</p>
  </DialogFrame>;
}
