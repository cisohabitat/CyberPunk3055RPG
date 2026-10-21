"use client";

import { choiceReceipt } from "@/lib/play-feedback";
import { ConversationContext } from "./ConversationContext";
import { ArchiveCatalog } from "./ArchiveCatalog";
import { choiceSection } from "@/lib/choice-sections";
import { choicePresentation, DISTRICT_PRESENTATIONS, sceneDistrict } from "@/lib/visual-presentation";
import { chapterPresentation } from "@/lib/chapter-presentation";
import { ChapterTransition } from "./ChapterTransition";
import { CATALOG_ACTIONS } from "@/lib/archive-catalog";

import { FinaleReflection } from "./FinaleReflection";
import { finaleScene } from "@/lib/finale-direction";
import { investigationScene } from "@/lib/investigation-scenes";

import { InvestigationNotebook } from "./InvestigationNotebook";
import { canConsultSources } from "@/lib/investigation-notebook";

import { Fragment, useEffect, useRef, useState } from "react";
import { CheckDialog } from "@/components/CheckDialog";
import { DialogFrame } from "@/components/DialogFrame";
import { Mark, originAccent } from "@/components/Mark";
import { Portrait } from "@/components/Portrait";
import { Sheet } from "@/components/Sheet";
import { DISTRICT_ART, sceneBackdrop, sceneIllustration, CHAPTER_BACKDROPS, paintedActor } from "@/lib/art";
import { ArtworkContext, ArtworkViewer, type ViewableArt } from "./ArtworkViewer";
import { CityMap } from "./CityMap";
import { ResourceChange } from "./ResourceChange";
import { resourceChanges, type ResourceChanges } from "@/lib/resource-changes";
import { Symbol } from "./Symbol";
import { SceneIllustration } from "./SceneIllustration";
import { PivotalScene } from "./PivotalScene";
import { pivotalScene } from "@/lib/pivotal-scenes";
import { ORIGINS, STRAIN_MAX, STAT_INFO } from "@/lib/character";
import { commitChoice, effectPreview, checkResourceCosts, getScene, presentChoices, previewCheck, runDelta, sceneText, type VisibleChoice } from "@/lib/engine";
import { locationCue, playCue, playSceneCue, sceneSoundPlan, setBed } from "@/lib/sound";
import { sceneInteractionCue, type SceneCueName } from "@/lib/scene-cues";
import { rememberEnding } from "@/lib/storage";
import type { Preferences } from "@/lib/preferences";
import { ObjectiveBrief } from "./ObjectiveBrief";
import { weekClosingPromises } from "@/lib/objectives";
import { MemoryTimeline } from "./MemoryTimeline";
import { MemoryPlate } from "./MemoryPlate";
import { RouteBoard } from "./RouteBoard";
import { VoiceLine } from "./VoiceLine";
import { memoryInteractionCue, visibleDialogue } from "@/lib/memory-media";
import { visibleCampaignDialogue, spokenDialogueRange, type CampaignDialogue } from "@/lib/campaign-dialogue";
import { SpokenText } from "./SpokenText";
import { FieldKitBrief } from "./FieldKitBrief";
import { TestimonyBrief } from "./TestimonyBrief";
import { ArchiveBrief } from "./ArchiveBrief";
import { TransferBrief } from "./TransferBrief";
import { memoryDisposition } from "@/lib/evidence";
import { endingCoda } from "@/lib/story";
import { speakerRole } from "@/lib/story/cast";
import { actName, currentGoal } from "@/lib/story/goal";
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
  audioPaused,
  onResumeAudio,
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
  audioPaused: boolean;
  onResumeAudio: () => void;
}) {
  const scene = getScene(state.sceneId);
  const visualDistrict = sceneDistrict(scene.id);
  const districtIdentity = visualDistrict === "city" ? undefined : DISTRICT_PRESENTATIONS[visualDistrict];
  const act = actName(state);
  const locationLabel = scene.location === act ? act : `${scene.location} · ${act}`;
  const illustration = sceneIllustration(scene.id, state.flags);
  const finale = finaleScene(scene.id);
  const investigation = investigationScene(scene.id);
  const direction = pivotalScene(scene.id) ?? finale ?? investigation;
  const choices = presentChoices(state, scene);
  const choiceMarks = choices.map(choice => choicePresentation(scene.id, choice));
  const choiceLegend = choiceMarks.filter((mark, index) => choiceMarks.findIndex(other => other.kind === mark.kind) === index);
  const decisionTitle = scene.id === "act2_middle" ? "Street or silence" : scene.id === "act3_arrival" ? "At the wall" : null;
  const decisionIds = scene.id === "act2_middle" ? ["stand", "deal"] : ["read-names", "confirm-leak", "read-wall", "let-ives", "say-anyway", "leave-wall"];
  const decisionIndex = decisionTitle ? choices.findIndex(choice => decisionIds.includes(choice.id)) : -1;
  const [pending, setPending] = useState<VisibleChoice | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [notebookOpen, setNotebookOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [viewedArt, setViewedArt] = useState<{ art: ViewableArt; scene: string } | null>(null);
  const artworkOpen = preferences.artwork !== "none" && viewedArt?.scene === scene.id;
  const compactHeader = preferences.artwork !== "none" && paintedActor(illustration, scene.speaker) && !scene.finale;
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const sound = preferences.sound && !audioPaused;
  const { mood, district } = sceneSoundPlan(state, scene.location, actName(state));
  const [fault, setFault] = useState("");
  const [receipt, setReceipt] = useState<{ state: GameState; values: ResourceChanges } | null>(null);
  const changes = receipt?.state === state ? receipt.values : {};
  const [delta, setDelta] = useState<string[]>([]);
  const [flash, setFlash] = useState(false);
  const [shown, setShown] = useState<{ sceneId: string; prose: string; count: number } | null>(null);
  const [speaking, setSpeaking] = useState<CampaignDialogue | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [decisionReceipt, setDecisionReceipt] = useState<{ state: GameState; lines: string[] } | null>(null);
  const enteredScene = useRef<string | null>(null);
  const readingFocus = useRef<{ sceneId: string; index: number } | null>(null);
  const priorSound = useRef<{ location: string; on: boolean; ending: boolean } | null>(null);
  const queuedSceneCue = useRef<{ state: GameState; name: SceneCueName } | null>(null);
  const prose = sceneText(scene, state);
  const paragraphs = prose.split(/\n\n+/).filter((paragraph) => paragraph.length > 0);
  const visibleCount = preferences.reading === "all" ? paragraphs.length : Math.min(shown?.sceneId === scene.id && shown.prose === prose ? shown.count : 1, paragraphs.length);
  const visibleText = paragraphs.slice(0, visibleCount).join("\n\n");
  const dialogue = visibleDialogue(scene.id, scene.speaker, visibleText);
  const dialogueQueue = visibleCampaignDialogue(scene.id, scene.speaker, visibleText);
  const recordedChoice = state.pendingCheck ? choices.find((choice) => choice.id === state.pendingCheck?.choiceId) : null;
  const activeChoice = recordedChoice ?? pending;
  const voicesEnabled = sound && preferences.voices > 0 && !modalOpen && !sheetOpen && !notebookOpen && !mapOpen && !artworkOpen && !confirmAbandon && !activeChoice;
  const sceneCuesEnabled = sound && preferences.effects > 0 && !modalOpen && !sheetOpen && !notebookOpen && !mapOpen && !artworkOpen && !confirmAbandon && !activeChoice;
  const playing = voicesEnabled && speaking?.scene === scene.id && dialogueQueue.some(line => line.key === speaking.key) ? speaking : null;
  const spokenRange = playing ? spokenDialogueRange(visibleText, playing) : undefined;
  let paragraphOffset = 0;
  const visibleParagraphs = paragraphs.slice(0, visibleCount).map(text => { const offset = paragraphOffset; paragraphOffset += text.length + 2; return { text, offset }; });
  const quotedRanges = direction ? dialogueQueue.map(line => spokenDialogueRange(visibleText, line)).filter(range => range !== undefined) : [];
  const narrative = <div className="prose" data-testid="scene-text">
    {visibleParagraphs.map(({ text, offset }, index) => (
      <p key={`${scene.id}-${index}`} id={`reading-paragraph-${index}`} tabIndex={-1}
        className={quotedRanges.some(range => range.end > offset && range.start < offset + text.length) ? "pivotal-dialogue" : undefined}>
        <SpokenText text={text} offset={offset} range={spokenRange} />
      </p>
    ))}
  </div>;
  const unavailableChoices = choices.filter((choice) => !choice.enabled && !(scene.id === "act2_archive_compare" && CATALOG_ACTIONS.has(choice.id)));

  useEffect(() => {
    const target = readingFocus.current;
    if (!target) return;
    readingFocus.current = null;
    if (target.sceneId === scene.id) document.getElementById(`reading-paragraph-${target.index}`)?.focus();
  }, [visibleCount, scene.id]);

  function revealParagraphs(count: number) {
    readingFocus.current = { sceneId: scene.id, index: visibleCount };
    setShown({ sceneId: scene.id, prose, count });
  }

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(preferences.motion === "reduce" || media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [preferences.motion]);

  useEffect(() => {
    setBed(sound, mood, district, undefined, finale ? "closing" : direction ? "intimate" : "normal");
    const previous = priorSound.current;
    if (sound && (!previous?.on || previous.location !== scene.location || Boolean(scene.ending) !== previous.ending)) playCue(locationCue(scene.location, Boolean(scene.ending)));
    priorSound.current = { location: scene.location, on: preferences.sound, ending: Boolean(scene.ending) };
  }, [sound, preferences.sound, mood, district, scene.id, scene.location, scene.ending, direction, finale]);

  useEffect(() => () => { setBed(false); }, []);

  useEffect(() => {
    const queued = queuedSceneCue.current;
    queuedSceneCue.current = null;
    if (sceneCuesEnabled && queued?.state === state) return playSceneCue(queued.name);
  }, [state, sceneCuesEnabled]);


  useEffect(() => {
    // Preferences can change while reading; only a new scene owns navigation.
    if (enteredScene.current === scene.id) return;
    enteredScene.current = scene.id;
    setSheetOpen(false);
    setNotebookOpen(false);
    setMapOpen(false);
    setViewedArt(null);
    setPending(null);
    const reduce = preferences.motion === "reduce" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setFlash(!reduce);
    const sceneTop = document.getElementById("scene-top");
    const header = document.querySelector(".topbar");
    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    document.documentElement.style.setProperty("--header-h", `${headerHeight + 12}px`);
    if (sceneTop) {
      const top = sceneTop.getBoundingClientRect().top + window.scrollY - (headerHeight + 12);
      window.scrollTo({ top: Math.max(0, top), behavior: reduce || window.matchMedia("(pointer: coarse)").matches ? "instant" : "smooth" });
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
    setShown(null);
  }, [state.sceneId, prose]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (artworkOpen || mapOpen) return;
        if (confirmAbandon) setConfirmAbandon(false);
        if (sheetOpen) setSheetOpen(false);
        if (notebookOpen) setNotebookOpen(false);
        return;
      }
      if (!preferences.numberShortcuts || activeChoice || confirmAbandon || sheetOpen || notebookOpen || mapOpen || artworkOpen || modalOpen || choices.length === 0) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable=true], #runner-sheet")) return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      const number = Number(event.key);
      if (!Number.isInteger(number) || number < 1 || number > 9) return;
      const choice = choices[number - 1];
      if (choice?.enabled) {
        event.preventDefault();
        pick(choice);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const openPromises = weekClosingPromises(state);

  function commit(next: GameState, choiceId: string) {
    setReceipt({ state: next, values: resourceChanges(state, next) });
    setDelta(runDelta(state, next));
    setDecisionReceipt({ state: next, lines: choiceReceipt(state, next) });
    const cue = sound && preferences.effects > 0 ? sceneInteractionCue(state, choiceId, next) : undefined;
    queuedSceneCue.current = cue ? { state: next, name: cue } : null;
    onChange(next);
  }

  function pick(choice: VisibleChoice) {
    if (!choice.enabled) return;
    setFault("");
    if (choice.check) {
      setPending(choice);
      return;
    }
    try {
      const next = commitChoice(state, choice).state;
      commit(next, choice.id);
      const cue = memoryInteractionCue(state, choice.id, next);
      if (cue) playCue(cue);
    } catch {
      setFault("The city glitched on that choice. Reload this page and continue the save.");
    }
  }

  return (
    <ArtworkContext.Provider value={preferences.artwork !== "none" ? art => setViewedArt({ art, scene: scene.id }) : undefined}><div className="screen">
      <a className="skip" href={choices.length > 0 ? "#choices" : "#scene-top"}>
        {choices.length > 0 ? "Skip to choices" : scene.finale ? "Skip to ending" : "Skip to scene"}
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
            <span className="stat-name"><Symbol name="strain" /> Strain <ResourceChange amount={changes.strain} label="Strain" /></span>
            <div className={state.strain >= 4 ? "pips hot" : "pips"} data-testid="strain" role="meter" aria-valuemin={0} aria-valuemax={STRAIN_MAX} aria-valuenow={state.strain} aria-label={`Strain ${state.strain} of ${STRAIN_MAX}`}>
              {Array.from({ length: STRAIN_MAX }, (_, index) => (
                <span key={index} className={index < state.strain ? "on" : ""} />
              ))}
            </div>
          </div>
          <div className="creds" data-testid="creds">
            <Symbol name="money" /> {state.creds} cr <ResourceChange amount={changes.creds} label="Creds" />
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
            className={`${flash ? "scene flash" : "scene"}${scene.memory || scene.id === "memo" ? " memory-scene" : ""}${direction ? " pivotal-scene" : ""}${finale ? " finale" : ""}${Object.hasOwn(CHAPTER_BACKDROPS, scene.id) ? " chapter-scene" : ""}`}
            id="scene-top"
            tabIndex={-1}
            data-testid="scene"
            data-district={visualDistrict}
            style={{ backgroundImage: preferences.artwork === "none" || illustration ? undefined : `linear-gradient(180deg, rgba(9,8,13,0.72), rgba(9,8,13,0.94)), url(${sceneBackdrop(scene.id, scene.location)})` }}
          >
            <div className="scene-row" data-compact={compactHeader ? "true" : "false"} data-composition={!direction && !chapterPresentation(scene.id) ? "reading" : "feature"}>
              <Portrait compact={!scene.finale} speaker={playing?.speaker ?? scene.speaker} speaking={Boolean(playing)} sceneId={scene.id} flags={state.flags} origin={state.origin} handle={state.handle} artwork={preferences.artwork !== "none"} />
              <div>
                <p className="kicker"><span key={locationLabel} className="location-entry" aria-hidden="true" />
                  {districtIdentity && <span className="district-emblem"><Symbol name={districtIdentity.symbol} /></span>}
                  {scene.location}
                  {scene.location !== act && <span className="act-chip"> · {act}</span>}
                </p>
                {!scene.endingTitle && <h1 className="sr-only">{locationLabel}</h1>}
                <p className="goal" data-testid="goal">{currentGoal(state)}</p>
                {audioPaused && preferences.sound && <div className="audio-paused" data-testid="audio-paused"><p role="status">Sound paused while you were away.</p><button className="ghost" type="button" onClick={() => { onResumeAudio(); document.getElementById("scene-top")?.focus({ preventScroll: true }); }}>Resume sound</button></div>}
                <p className="sr-only" aria-live="polite">
                  {locationLabel}. {currentGoal(state)}
                </p>
                {scene.ending && !scene.finale && state.chapters.length > 0 && (
                  <ol className="chapter-stack" data-testid="chapter-stack">
                    {state.chapters.map((title) => (
                      <li key={title}>{title}</li>
                    ))}
                  </ol>
                )}
                {scene.ending && !scene.finale && (
                  <>
                    <p className="ending-kicker">{scene.finale ? "Ending" : "Chapter"}</p>
                    <h1 data-testid="ending-title">{scene.endingTitle}</h1>
                  </>
                )}
                {scene.speaker && !scene.finale && (!compactHeader || dialogueQueue.some(line => line.speaker !== scene.speaker)) && (
                  <p className="speaker" data-role-only={!dialogueQueue.some(line => line.speaker !== scene.speaker)}>
                    {dialogueQueue.some(line => line.speaker !== scene.speaker)
                      ? `With ${scene.speaker}${speakerRole(scene.speaker) ? ` · ${speakerRole(scene.speaker)}` : ""}`
                      : speakerRole(scene.speaker)}
                  </p>
                )}
                {delta.length > 0 && (
                  <p className="delta" data-testid="run-delta">
                    {delta.join(" · ")}
                  </p>
                )}
                {scene.ending && !scene.finale && (
                  <ul className="recap" data-testid="ending-recap">
                    <li>{ORIGINS[state.origin].name}</li>
                    <li>{state.creds} cr</li>
                    <li>
                      Strain {state.strain}/{STRAIN_MAX}
                    </li>
                    <li>{endingCoda(scene.id)}</li>
                  </ul>
                )}

              </div>
            </div>
            {scene.finale && <h1 className="finale-title" data-testid="ending-title">{scene.endingTitle}</h1>}
            {restoreNotice && <p className="restore-notice" role="status" data-testid="restore-notice">{restoreNotice}</p>}
            <ChapterTransition sceneId={scene.id} />
            {direction ? <PivotalScene direction={direction} finale={Boolean(finale)} investigation={Boolean(investigation)} art={preferences.artwork !== "none" ? illustration : undefined}>{narrative}</PivotalScene>
              : preferences.artwork !== "none" && illustration && <SceneIllustration art={illustration} reading />}
            {canConsultSources(state) && <div className="investigation-tools"><button className="ghost" type="button" data-testid="consult-sources" aria-haspopup="dialog" disabled={Boolean(activeChoice) || modalOpen} onClick={() => setNotebookOpen(true)}>Consult acquired sources</button></div>}
            {scene.id === "memory_table" && <MemoryPlate key={scene.id} state={state} choices={choices} onInspect={pick} artwork={preferences.artwork !== "none"} numberShortcuts={preferences.numberShortcuts} />}
            {!direction && narrative}
            {visibleCount < paragraphs.length && (
              <div className="prose-controls">
                <button className="ghost" type="button" data-testid="next-paragraph" onClick={() => revealParagraphs(visibleCount + 1)}>
                  Next line
                </button>
                <button className="ghost" type="button" data-testid="show-rest" onClick={() => revealParagraphs(paragraphs.length)}>
                  Show the rest
                </button>
              </div>
            )}
            {preferences.reading === "paragraph" && paragraphs.length > 1 && <p className="reading-progress hint" role="status" aria-atomic="true">{visibleCount} of {paragraphs.length} paragraphs shown</p>}
            {dialogueQueue.length > 0 && <VoiceLine key={scene.id} line={dialogue} lines={dialogueQueue} automatic={preferences.autoVoices} paused={audioPaused && preferences.sound} enabled={voicesEnabled} onSpeaking={setSpeaking} />}
            {visibleCount === paragraphs.length && <ConversationContext state={state} speaker={scene.speaker} />}
            {!scene.finale && <div className="decision-context" data-testid="decision-context">
              <ObjectiveBrief state={state} />
              <TransferBrief state={state} />
              <ArchiveBrief state={state} />
              {!scene.memory && <TestimonyBrief state={state} />}
              <FieldKitBrief state={state} />
            </div>}
            {scene.id === "act2_archive_compare" && <ArchiveCatalog state={state} choices={choices} onChoose={pick} numberShortcuts={preferences.numberShortcuts} />}
            {scene.id === "memory_sequence" && <MemoryTimeline state={state} choices={choices} onPlace={pick} artwork={preferences.artwork !== "none"} reducedMotion={reduceMotion} numberShortcuts={preferences.numberShortcuts} />}
            {["act2_route_map", "act2_route_exit", "act2_route_review", "act2_route_crossing"].includes(scene.id) && <RouteBoard state={state} />}
            {scene.finale && <FinaleReflection state={state} artwork={preferences.artwork !== "none"} />}
            {decisionReceipt?.state === state && decisionReceipt.lines.length > 0 && <details className="decision-receipt" data-testid="decision-receipt">
              <summary><span role="status">Last choice · {decisionReceipt.lines.length} {decisionReceipt.lines.length === 1 ? "update" : "updates"}</span></summary>
              <ul>{decisionReceipt.lines.map((line, index) => <li key={index}>{line}</li>)}</ul>
              <p className="hint">Changes already applied. Faction numbers are standing, not a guarantee of trust or consent.</p>
            </details>}
            {fault && <p className="form-error">{fault}</p>}
            {choices.length > 0 && (
              <div className={scene.id === "districts" ? "choices cards" : "choices"} id="choices" tabIndex={-1} role="region" aria-labelledby="choices-title">
                <div className="decision-help">
                  <h2 id="choices-title">Your next move</h2>
                  <p className="hint">Selecting an option commits it. For a check, review the odds and costs first; Back leaves it unrolled.</p>
                  {choiceLegend.length > 1 && <p className="choice-legend" aria-label="Choice markers">{choiceLegend.map(mark => <span key={mark.kind}><Symbol name={mark.symbol} /> {mark.label}</span>)}</p>}
                  {unavailableChoices.length > 0 && <details data-testid="unavailable-choices"><summary>Review unavailable approaches ({unavailableChoices.length})</summary><ul>{unavailableChoices.map((choice) => <li key={choice.id}><strong>{choice.label}</strong><p>{choice.disabledReason}</p></li>)}</ul></details>}
                  {decisionIndex > 0 && <a href="#chapter-decision" data-testid="decision-jump" onClick={event => {
                    const target = document.getElementById("chapter-decision");
                    if (!target) return;
                    event.preventDefault();
                    target.focus({ preventScroll: true });
                    target.scrollIntoView({ block: "start", behavior: "instant" });
                  }}>Go to {decisionTitle === "Street or silence" ? "street or silence decision" : "final decision"}</a>}
                </div>
                {decisionIndex > 0 && <h3 className="choice-group-title">People and unfinished work</h3>}
                {choices.map((choice, index) => {
                  if (scene.memory && choice.id.startsWith("inspect-")) return null;
                  if (scene.id === "act2_archive_compare" && CATALOG_ACTIONS.has(choice.id)) return null;
                  if (scene.id === "memory_sequence" && choice.id.startsWith("place-")) return null;
                  const section = choiceSection(scene.id, choice.id);
                  const startsSection = section && section !== choiceSection(scene.id, choices[index - 1]?.id ?? "");
                  const odds = choice.check ? previewCheck(state, choice.check) : null;
                  const presentation = choiceMarks[index];
                  const effects = choice.disabledReason !== undefined ? [] : effectPreview(state, choice);
                  const costs = choice.disabledReason !== undefined ? [] : checkResourceCosts(state, choice);
                  const chance = !odds ? null : odds.hits === 10 ? "certain" : odds.hits === 0 ? "no chance" : `${odds.hits} in 10`;
                  return (
                    <Fragment key={choice.id}>
                      {startsSection && <h3 className="choice-group-title" data-testid="choice-section">{section}</h3>}
                      {index === decisionIndex && <h3 id="chapter-decision" className="choice-group-title" tabIndex={-1}>{decisionTitle}</h3>}
                      <button
                        className="choice"
                        data-choice-kind={presentation.kind}
                        data-available={choice.enabled ? "true" : "false"}
                        type="button"
                        id={choice.id === "open-archive-catalog" ? "archive-catalog-toggle" : undefined}
                        data-testid={`choice-${choice.id}`}
                        aria-labelledby={`choice-label-${choice.id}`}
                        aria-describedby={`choice-detail-${choice.id}`}
                        aria-keyshortcuts={preferences.numberShortcuts && choice.enabled && index < 9 ? String(index + 1) : undefined}
                        disabled={!choice.enabled || activeChoice !== null}
                        onClick={() => pick(choice)}
                      >
                        {preferences.artwork !== "none" && scene.id === "districts" && DISTRICT_ART[choice.id] && (
                          <img className="card-art" src={DISTRICT_ART[choice.id]} alt="" loading="lazy" width={320} height={180} />
                        )}
                        <span className="index">{index + 1}</span>
                        <span className="label" id={`choice-label-${choice.id}`}>{choice.label}</span>
                        <span className="choice-action-mark" aria-hidden="true" title={presentation.label}><Symbol name={presentation.symbol} /></span>
                        <span className="odds" id={`choice-detail-${choice.id}`}>
                          {choice.disabledReason !== undefined ? <span className="choice-meta" data-kind="unavailable">{choice.disabledReason}</span> : <>
                            {odds && <span className="choice-meta" data-kind="check">{STAT_INFO[odds.stat].name} · DC {odds.dc} · {chance}</span>}{" "}
                            {choice.detail && <span className="choice-meta" data-kind="detail">{choice.detail}</span>}{" "}
                            {openPromises.length > 0 && [choice.next, choice.nextSuccess, choice.nextFail].some(next => typeof next === "string" && ["ending_week_wards", "ending_week_deal", "ending_exposed"].includes(next)) && <span className="choice-meta" data-kind="promise">{`${openPromises.length} campaign ${openPromises.length === 1 ? "promise remains" : "promises remain"} unresolved if the week closes: ${openPromises.map(row => row.title).join("; ")}`}</span>}{" "}
                            {effects.length > 0 && <span className="choice-meta" data-kind="effects">{effects.join(" · ")}</span>}{" "}
                            {costs.length > 0 && <span className="choice-meta" data-kind="costs">{costs.join("; ")}</span>}
                          </>}
                        </span>
                      </button>
                    </Fragment>
                  );
                })}
              </div>
            )}
            {scene.memory && scene.id !== "memory_table" && <details className="memory-review" data-testid="memory-review"><summary>Review the inspected memory · {memoryDisposition(state)}</summary><TestimonyBrief state={state} /><MemoryPlate key={scene.id} state={state} choices={choices} onInspect={pick} artwork={preferences.artwork !== "none"} numberShortcuts={preferences.numberShortcuts} /></details>}
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
        <Sheet state={state} changes={changes} speaker={scene.speaker} visibleText={visibleText} artwork={preferences.artwork !== "none"} open={sheetOpen} onClose={() => setSheetOpen(false)} onMap={() => setMapOpen(true)} />
      </div>
      {notebookOpen && <InvestigationNotebook state={state} onClose={() => setNotebookOpen(false)} />}
      {artworkOpen && viewedArt && <ArtworkViewer key={`${viewedArt.art.src}-${viewedArt.art.tile ?? "scene"}`} art={viewedArt.art} onClose={() => setViewedArt(null)} />}
      {mapOpen && <CityMap state={state} artwork={preferences.artwork !== "none"} onClose={() => setMapOpen(false)} onFind={id => {
        setMapOpen(false); setSheetOpen(false);
        requestAnimationFrame(() => { const target = document.getElementById(`choice-label-${id}`)?.closest("button"); target?.focus(); target?.scrollIntoView({ block: "center", behavior: "instant" }); });
      }} />}
      {activeChoice?.check && (
        <CheckDialog
          state={state}
          choice={activeChoice}
          sound={sound}
          voicesEnabled={preferences.voices > 0}
          automaticVoices={preferences.autoVoices}
          reducedMotion={reduceMotion}
          artwork={preferences.artwork !== "none"}
          onStage={onChange}
          speaker={scene.speaker}
          onClose={() => setPending(null)}
          onCommit={(next) => {
            setPending(null);
            commit(next, activeChoice.id);
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
            <button className="ghost" type="button" data-dialog-initial-focus onClick={() => setConfirmAbandon(false)}>
              Keep going
            </button>
          </div>
        </DialogFrame>
      )}
    </div></ArtworkContext.Provider>
  );
}
