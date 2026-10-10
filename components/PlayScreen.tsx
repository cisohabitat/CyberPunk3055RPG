"use client";

import { campaignCoda } from "@/lib/campaign-consequences";

import { useEffect, useRef, useState } from "react";
import { CheckDialog } from "@/components/CheckDialog";
import { DialogFrame } from "@/components/DialogFrame";
import { Mark, originAccent } from "@/components/Mark";
import { Portrait } from "@/components/Portrait";
import { Sheet } from "@/components/Sheet";
import { DISTRICT_ART, placeArt, sceneIllustration } from "@/lib/art";
import { SceneIllustration } from "./SceneIllustration";
import { ORIGINS, STRAIN_MAX, STAT_INFO } from "@/lib/character";
import { commitChoice, effectPreview, checkResourceCosts, getScene, presentChoices, previewCheck, runDelta, sceneText, type VisibleChoice } from "@/lib/engine";
import { locationCue, playCue, sceneMood, setBed } from "@/lib/sound";
import { rememberEnding } from "@/lib/storage";
import type { Preferences } from "@/lib/preferences";
import { ObjectiveBrief } from "./ObjectiveBrief";
import { unresolvedPromises } from "@/lib/objectives";
import { MemoryTimeline } from "./MemoryTimeline";
import { MemoryPlate } from "./MemoryPlate";
import { RouteBoard } from "./RouteBoard";
import { VoiceLine } from "./VoiceLine";
import { memoryInteractionCue, visibleDialogue } from "@/lib/memory-media";
import { FieldKitBrief } from "./FieldKitBrief";
import { TestimonyBrief } from "./TestimonyBrief";
import { ArchiveBrief } from "./ArchiveBrief";
import { TransferBrief } from "./TransferBrief";
import { relationshipCoda } from "@/lib/relationships";
import { aftermath, memoryDisposition } from "@/lib/evidence";
import { endingCoda } from "@/lib/story";
import { speakerRole } from "@/lib/story/cast";
import { actName, currentGoal } from "@/lib/story/goal";
import { nightRetell } from "@/lib/story/retell";
import type { GameState } from "@/lib/types";

export function PlayScreen({
  state,
  restoreNotice,
  onChange,
  onAbandon,
  onTitle,
  onNewRun,
  saveFailed,
  preferences,
  modalOpen,
  onSettings,
  onSaves,
}: {
  state: GameState;
  restoreNotice?: string | null;
  onChange: (state: GameState) => void;
  onAbandon: () => void;
  onTitle: () => void;
  onNewRun: () => void;
  saveFailed: boolean;
  preferences: Preferences;
  modalOpen: boolean;
  onSettings: () => void;
  onSaves: () => void;
}) {
  const scene = getScene(state.sceneId);
  const illustration = sceneIllustration(scene.id);
  const choices = presentChoices(state, scene);
  const [pending, setPending] = useState<VisibleChoice | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const sound = preferences.sound;
  const mood = sceneMood(scene.location, actName(state));
  const [fault, setFault] = useState("");
  const [delta, setDelta] = useState<string[]>([]);
  const [flash, setFlash] = useState(false);
  const [shown, setShown] = useState(1);
  const [reduceMotion, setReduceMotion] = useState(false);
  const prior = useRef(state);
  const priorSound = useRef<{ location: string; on: boolean; ending: boolean } | null>(null);
  const prose = sceneText(scene, state);
  const paragraphs = prose.split(/\n\n+/).filter((paragraph) => paragraph.length > 0);
  const visibleCount = preferences.reading === "all" ? paragraphs.length : Math.min(shown, paragraphs.length);
  const dialogue = visibleDialogue(scene.id, scene.speaker, paragraphs.slice(0, visibleCount).join("\n\n"));
  const recordedChoice = state.pendingCheck ? choices.find((choice) => choice.id === state.pendingCheck?.choiceId) : null;
  const activeChoice = recordedChoice ?? pending;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(preferences.motion === "reduce" || media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [preferences.motion]);

  useEffect(() => {
    setBed(sound, mood);
    const previous = priorSound.current;
    if (sound && (!previous?.on || previous.location !== scene.location || Boolean(scene.ending) !== previous.ending)) playCue(locationCue(scene.location, Boolean(scene.ending)));
    priorSound.current = { location: scene.location, on: sound, ending: Boolean(scene.ending) };
  }, [sound, mood, scene.id, scene.location, scene.ending]);

  useEffect(() => () => { setBed(false); }, []);

  useEffect(() => {
    if (prior.current !== state) {
      setDelta(prior.current.sceneId === state.sceneId ? [] : runDelta(prior.current, state));
      prior.current = state;
    }
  }, [state]);

  useEffect(() => {
    setSheetOpen(false);
    setPending(null);
    const reduce = preferences.motion === "reduce" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setFlash(!reduce);
    const sceneTop = document.getElementById("scene-top");
    const header = document.querySelector(".topbar");
    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    document.documentElement.style.setProperty("--header-h", `${headerHeight + 12}px`);
    if (sceneTop) {
      const top = sceneTop.getBoundingClientRect().top + window.scrollY - (headerHeight + 12);
      window.scrollTo({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });
    }
    if (scene.ending && scene.endingTitle) document.title = `${scene.endingTitle} — Saint Shard`;
    else document.title = "Saint Shard — Kite City 3055";
    sceneTop?.focus({ preventScroll: true });
  }, [scene.id, preferences.motion]);

  useEffect(() => {
    if (scene.id.startsWith("ending_") && scene.endingTitle) {
      rememberEnding(scene.id, scene.endingTitle, scene.finale ? state.items : undefined);
    }
  }, [scene.endingTitle, scene.finale, scene.id, state.items]);

  useEffect(() => {
    setShown(1);
  }, [state.sceneId, prose]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (confirmAbandon) setConfirmAbandon(false);
        if (sheetOpen) setSheetOpen(false);
        return;
      }
      if (activeChoice || confirmAbandon || sheetOpen || modalOpen || choices.length === 0) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable=true], #runner-sheet")) return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      const number = Number(event.key);
      if (!Number.isInteger(number) || number < 1 || number > 9) return;
      const choice = choices[number - 1];
      if (choice?.enabled) pick(choice);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const openPromises = unresolvedPromises(state);

  function pick(choice: VisibleChoice) {
    if (!choice.enabled) return;
    setFault("");
    if (choice.check) {
      setPending(choice);
      return;
    }
    try {
      const next = commitChoice(state, choice).state;
      onChange(next);
      const cue = memoryInteractionCue(state, choice.id, next);
      if (cue) playCue(cue);
    } catch {
      setFault("The city glitched on that choice. Reload this page and continue the save.");
    }
  }

  return (
    <div className="screen">
      <a className="skip" href="#choices">
        Skip to choices
      </a>
      <header className="topbar">
        <div className="brand">
          <Mark accent={originAccent(state.origin)} />
          <div>
            Saint Shard
            <small>Kite City 3055</small>
          </div>
        </div>
        <div className="meters">
          <div className="strain-readout">
            <span className="stat-name">Strain</span>
            <div className={state.strain >= 4 ? "pips hot" : "pips"} data-testid="strain" role="meter" aria-valuemin={0} aria-valuemax={STRAIN_MAX} aria-valuenow={state.strain} aria-label={`Strain ${state.strain} of ${STRAIN_MAX}`}>
              {Array.from({ length: STRAIN_MAX }, (_, index) => (
                <span key={index} className={index < state.strain ? "on" : ""} />
              ))}
            </div>
          </div>
          <div className="creds" data-testid="creds">
            {state.creds} cr
          </div>
        </div>
        <div className="top-actions">
          <button className="ghost" type="button" onClick={onSettings}>
            Settings
          </button>
          <button className="ghost" type="button" onClick={onSaves}>
            Saves
          </button>
          <button className="ghost sheet-toggle" type="button" data-testid="sheet-toggle" aria-expanded={sheetOpen} aria-controls="runner-sheet" onClick={() => setSheetOpen(true)}>
            Sheet
          </button>
          <button className="ghost" type="button" onClick={() => setConfirmAbandon(true)}>
            Abandon
          </button>
        </div>
      </header>
      {saveFailed && (
        <p className="form-error" role="status">
          This run could not be saved in this browser. Keep this page open to keep your progress.
        </p>
      )}
      <div className="layout">
        <main>
          <article
            className={`${flash ? "scene flash" : "scene"}${scene.memory || scene.id === "memo" ? " memory-scene" : ""}`}
            id="scene-top"
            tabIndex={-1}
            data-testid="scene"
            style={{ backgroundImage: preferences.artwork === "none" || illustration ? undefined : `linear-gradient(180deg, rgba(9,8,13,0.72), rgba(9,8,13,0.94)), url(${placeArt(scene.location)})` }}
          >
            <div className="scene-row">
              <Portrait speaker={scene.speaker} sceneId={scene.id} origin={state.origin} handle={state.handle} artwork={preferences.artwork !== "none"} />
              <div>
                <p className="kicker">
                  {scene.location}
                  <span className="act-chip"> · {actName(state)}</span>
                </p>
                {!scene.endingTitle && <h1 className="sr-only">{scene.location} · {actName(state)}</h1>}
                <p className="goal" data-testid="goal">{currentGoal(state)}</p>
                <p className="sr-only" aria-live="polite">
                  {scene.location}. {actName(state)}. {currentGoal(state)}
                </p>
                {scene.ending && state.chapters.length > 0 && (
                  <ol className="chapter-stack" data-testid="chapter-stack">
                    {state.chapters.map((title) => (
                      <li key={title}>{title}</li>
                    ))}
                  </ol>
                )}
                {scene.ending && (
                  <>
                    <p className="ending-kicker">{scene.finale ? "Ending" : "Chapter"}</p>
                    <h1 data-testid="ending-title">{scene.endingTitle}</h1>
                  </>
                )}
                {scene.speaker && (
                  <p className="speaker">
                    {scene.speaker}
                    {speakerRole(scene.speaker) ? ` · ${speakerRole(scene.speaker)}` : ""}
                  </p>
                )}
                {delta.length > 0 && (
                  <p className="delta" data-testid="run-delta">
                    {delta.join(" · ")}
                  </p>
                )}
                {scene.ending && (
                  <ul className="recap" data-testid="ending-recap">
                    <li>{ORIGINS[state.origin].name}</li>
                    <li>{state.creds} cr</li>
                    <li>
                      Strain {state.strain}/{STRAIN_MAX}
                    </li>
                    <li>{endingCoda(scene.id)}</li>
                    {scene.finale &&
                      nightRetell(state).map((line) => (
                        <li key={line} data-testid="night-retell">
                          {line}
                        </li>
                      ))}
                  </ul>
                )}

              </div>
            </div>
            {restoreNotice && <p className="restore-notice" role="status" data-testid="restore-notice">{restoreNotice}</p>}
            {preferences.artwork !== "none" && illustration && <SceneIllustration art={illustration} />}
            <ObjectiveBrief state={state} />
            <TransferBrief state={state} />
            <ArchiveBrief state={state} />
            {!scene.memory && <TestimonyBrief state={state} />}
            <FieldKitBrief state={state} />
            {scene.id === "memory_table" && <MemoryPlate key={scene.id} state={state} choices={choices} onInspect={pick} artwork={preferences.artwork !== "none"} />}
            <div className="prose" data-testid="scene-text">
              {paragraphs.slice(0, visibleCount).map((paragraph, index) => (
                <p key={`${scene.id}-${index}`}>{paragraph}</p>
              ))}
            </div>
            {visibleCount < paragraphs.length && (
              <div className="prose-controls">
                <button className="ghost" type="button" data-testid="next-paragraph" onClick={() => setShown((count) => count + 1)}>
                  Next line
                </button>
                <button className="ghost" type="button" data-testid="show-rest" onClick={() => setShown(paragraphs.length)}>
                  Show the rest
                </button>
              </div>
            )}
            {dialogue && <VoiceLine key={`${scene.id}-${dialogue.id}`} line={dialogue} enabled={sound && preferences.voices > 0 && !modalOpen && !sheetOpen && !confirmAbandon && !activeChoice} />}
            {scene.id === "memory_sequence" && <MemoryTimeline state={state} choices={choices} onPlace={pick} artwork={preferences.artwork !== "none"} reducedMotion={reduceMotion} />}
            {["act2_route_map", "act2_route_exit", "act2_route_review", "act2_route_crossing"].includes(scene.id) && <RouteBoard state={state} />}
            {scene.finale && campaignCoda(state) && <p data-testid="campaign-coda">{campaignCoda(state)}</p>}
            {scene.finale && relationshipCoda(state) && <p className="relationship-coda" data-testid="relationship-coda">{relationshipCoda(state)}</p>}
            {scene.finale && <section className="aftermath" aria-label="What your choices changed"><h2>What remains</h2><details data-testid="aftermath-details"><summary>Review the factual aftermath</summary>{aftermath(state).map((row) => <section key={row.title}><h3>{row.title}</h3><p>{row.text}</p></section>)}</details></section>}
            {fault && <p className="form-error">{fault}</p>}
            {choices.length > 0 && (
              <div className={scene.id === "districts" ? "choices cards" : "choices"} id="choices" tabIndex={-1}>
                {choices.map((choice, index) => {
                  if (scene.memory && choice.id.startsWith("inspect-")) return null;
                  if (scene.id === "memory_sequence" && choice.id.startsWith("place-")) return null;
                  const odds = choice.check ? previewCheck(state, choice.check) : null;
                  const chance = !odds ? null : odds.hits === 10 ? "certain" : odds.hits === 0 ? "no chance" : `${odds.hits} in 10`;
                  return (
                    <button
                      key={choice.id}
                      className="choice"
                      type="button"
                      data-testid={`choice-${choice.id}`}
                      disabled={!choice.enabled || activeChoice !== null}
                      onClick={() => pick(choice)}
                    >
                      {preferences.artwork !== "none" && scene.id === "districts" && DISTRICT_ART[choice.id] && (
                        <img className="card-art" src={DISTRICT_ART[choice.id]} alt="" loading="lazy" width={320} height={180} />
                      )}
                      <span className="index">{index + 1}</span>
                      <span className="label">{choice.label}</span>
                      <span className="odds">
                        {choice.disabledReason ??
                          [
                            odds ? `${STAT_INFO[odds.stat].name} · DC ${odds.dc} · ${chance}` : null,
                            choice.detail,
                            openPromises.length && [choice.next, choice.nextSuccess, choice.nextFail].some((next) => typeof next === "string" && ["ending_week_wards", "ending_week_deal", "ending_exposed"].includes(next)) ? `${openPromises.length} campaign ${openPromises.length === 1 ? "promise remains" : "promises remain"} unresolved if the week closes` : null,
                            effectPreview(state, choice).join(" · ") || null,
                            checkResourceCosts(state, choice).join("; ") || null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {scene.memory && scene.id !== "memory_table" && <details className="memory-review" data-testid="memory-review"><summary>Review the inspected memory · {memoryDisposition(state)}</summary><TestimonyBrief state={state} /><MemoryPlate key={scene.id} state={state} choices={choices} onInspect={pick} artwork={preferences.artwork !== "none"} /></details>}
            {scene.ending && (
              <div className="actions">
                <button className="primary" type="button" onClick={onNewRun}>
                  New run
                </button>
                <button className="ghost" type="button" onClick={onTitle}>
                  Title
                </button>
              </div>
            )}
          </article>
        </main>
        <Sheet state={state} speaker={scene.speaker} open={sheetOpen} onClose={() => setSheetOpen(false)} />
      </div>
      {activeChoice?.check && (
        <CheckDialog
          state={state}
          choice={activeChoice}
          sound={sound}
          reducedMotion={reduceMotion}
          artwork={preferences.artwork !== "none"}
          onStage={onChange}
          speaker={scene.speaker}
          onClose={() => setPending(null)}
          onCommit={(next) => {
            setPending(null);
            onChange(next);
          }}
        />
      )}
      {confirmAbandon && (
        <DialogFrame titleId="abandon-title" onEscape={() => setConfirmAbandon(false)}>
          <h2 id="abandon-title">Abandon this run?</h2>
          <p>This clears {state.handle}&apos;s active run and automatic backup. Manual save slots remain available.</p>
          <div className="dialog-actions">
            <button className="primary" type="button" data-testid="confirm-abandon" onClick={onAbandon}>
              Wipe it
            </button>
            <button className="ghost" type="button" onClick={() => setConfirmAbandon(false)}>
              Keep going
            </button>
          </div>
        </DialogFrame>
      )}
    </div>
  );
}
