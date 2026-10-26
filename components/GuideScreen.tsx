"use client";

import { useState } from "react";
import Link from "next/link";
import { OPENING_ART } from "@/lib/art";
import { ORIGINS, STATS, STAT_INFO } from "@/lib/character";
import { GUIDE_CONTACTS, GUIDE_LORE, guideCheck } from "@/lib/guide";
import { SceneIllustration } from "./SceneIllustration";
import { MenuMusic, type MenuMusicProps } from "./MenuMusic";
import { ArtworkContext, ArtworkViewer, type ViewableArt } from "./ArtworkViewer";

export function GuideScreen({ artwork, music, onSettings }: { artwork: boolean; music: MenuMusicProps; onSettings: () => void }) {
  const [roll, setRoll] = useState<number | null>(null);
  const [viewedArt, setViewedArt] = useState<ViewableArt | null>(null);
  const result = roll === null ? null : guideCheck(roll);
  return <ArtworkContext.Provider value={artwork ? setViewedArt : undefined}><div className="guide-screen" data-testid="guide-screen">
    <a className="skip" href="#guide-reading">Skip to the field guide</a>
    <header className="guide-topbar">
      <Link className="brand" href="/" prefetch={false}>Saint Shard <small>Kite City · 3055</small></Link>
      <div className="actions">
        <Link className="ghost" href="/" prefetch={false} data-testid="guide-back">Back to main page</Link>
        <button className="ghost" type="button" onClick={onSettings}>Settings</button>
      </div>
    </header>
    <main className="guide-book" id="guide-reading" tabIndex={-1}>
      <div className="guide-intro">
        <p className="eyebrow">Before you take the stool</p>
        <h1 id="guide-title" tabIndex={-1}>A runner’s field guide</h1>
        <section className="guide-quick-start" aria-labelledby="guide-quick-title" data-testid="guide-quick-start">
          <h2 id="guide-quick-title">Play in four steps</h2>
          <ol>
            <li><strong>Read.</strong> Follow the visible goal and read the scene.</li>
            <li><strong>Choose.</strong> Selecting an option commits it.</li>
            <li><strong>Check.</strong> Review odds and costs before rolling 1d10.</li>
            <li><strong>Return.</strong> Progress saves in this browser; export a backup in Saves.</li>
          </ol>
        </section>
        <nav className="guide-index" aria-label="Field guide chapters">
          <a href="#guide-city">Enter the city</a><a href="#guide-first-run">Your first run</a><a href="#guide-checks">Choices & dice</a><a href="#guide-memory">Keep your word</a><a href="#guide-controls">Controls & saves</a>
        </nav>
        <p className="guide-deck">The rain is already here. The offer can wait until you know how to listen.</p>
        <p>Welcome to Saint Shard, a solo story RPG. Read, choose and carry the consequences into the next conversation. This guide introduces the city and the rules while leaving the job’s discoveries for your run.</p>
        <MenuMusic {...music} />
      </div>
      {artwork && <SceneIllustration art={OPENING_ART} />}
      <section className="guide-chapter" id="guide-city" aria-labelledby="guide-city-title">
        <p className="eyebrow">01 · Beneath the dome</p><h2 id="guide-city-title">Enter Kite City</h2>
        {GUIDE_LORE.map(entry => <section key={entry.title}><h3>{entry.title}</h3><p>{entry.text}</p></section>)}
        <h3>The people and institutions around you</h3>
        <div className="guide-cards">{GUIDE_CONTACTS.map(entry => <section className="guide-card" key={entry.title}><h4>{entry.title}</h4><p>{entry.text}</p></section>)}</div>
        <p className="guide-note">Listen for who owns an hour, who witnessed an event and who has agreed to be quoted. Those questions will matter when someone offers you a price.</p>
      </section>
      <section className="guide-chapter" id="guide-first-run" aria-labelledby="guide-first-title">
        <p className="eyebrow">02 · Find your footing</p><h2 id="guide-first-title">Your first run</h2>
        <ol className="guide-steps">
          <li><strong>Choose New run on the main page.</strong> Give your runner a street handle. A given name is optional.</li>
          <li><strong>Choose your origin.</strong> It gives you starting stats, money and a familiar way through a check.</li>
          <li><strong>Choose a complication and spend two stat points.</strong> Read the benefit and cost. Each stat has a cap of five.</li>
          <li><strong>Take the stool and begin the prologue.</strong> Follow the goal beneath the location. The opening lets you decide why you came for work before you hear Quill’s offer.</li>
        </ol>
        <div className="guide-cards guide-origins">{Object.values(ORIGINS).map(origin => <section className="guide-card" key={origin.id}><h3>{origin.name}</h3><p>{origin.blurb}</p><p className="guide-small">{origin.perkText} Starts with {origin.creds} creds, before your complication.</p></section>)}</div>
        <p>Creds are your money: fares, tools and paid help all draw on the same chip. You can read at your own pace. The whole scene appears by default; paragraph pacing is available in Settings. The game tells you when a job has a limited number of actions. Reading time spends no action.</p>
      </section>
      <section className="guide-chapter" id="guide-checks" aria-labelledby="guide-check-title">
        <p className="eyebrow">03 · Read the door</p><h2 id="guide-check-title">Choices and dice</h2>
        <p>A plain choice takes effect when you select it. A choice with a check opens its difficulty, modifiers, odds and possible costs first. You can go Back before rolling. After a roll, Continue commits its outcome. A saved roll stays the same after a reload.</p>
        <div className="guide-cards">{STATS.map(stat => <section className="guide-card" key={stat}><h3>{STAT_INFO[stat].name}</h3><p>{STAT_INFO[stat].blurb}</p></section>)}</div>
        <p>Roll one ten-sided die, add the shown stat and modifiers, and meet or beat the difficulty. Preparation, tools and favors can open different approaches. Read each option’s details before spending money, effort or trust.</p>
        <section className="guide-practice" aria-labelledby="guide-practice-title" data-testid="guide-practice">
          <h3 id="guide-practice-title">Practice a check</h3>
          <p>A fictional service hatch needs <strong>difficulty 8</strong>. Your example runner has <strong>Nerve 3</strong>, no modifiers and <strong>Strain 2</strong>. Choose a die face to see the result.</p>
          <div className="actions">{[4, 5, 10, 1].map(face => <button className="ghost" type="button" key={face} aria-pressed={roll === face} onClick={() => setRoll(face)}>Show a {face}</button>)}</div>
          <div className="guide-example-result" role="status" aria-live="polite" aria-atomic="true" data-testid="guide-result">
            {result ? <><p><strong>{result.roll} + {result.bonus} = {result.total}</strong> against difficulty {result.dc}. <strong>{result.success ? "Success." : "Miss."}</strong></p>
              <p>{result.crit === "success" ? "A successful 10 eases Strain by one: this example goes from 2 to 1." : result.crit === "fail" ? "A 1 that misses adds one Strain: this example goes from 2 to 3." : "This example has no other costs. An actual choice lists its own success and failure consequences."}</p></>
              : <p>Your first example is ready. This practice never changes your runner, saved die or progress.</p>}
          </div>
        </section>
        <h3>Keep an eye on Strain</h3>
        <p>You have five pips. Difficult work and failed checks can raise Strain; some choices ease it. At five, a bad outcome inside Glass Chapel can put you in the chair. The game warns you when the chair is close. Read the cost before pushing through another door.</p>
        <p>A miss can change the route, the price or who notices you. Read the next scene for recovery options. Some jobs allow one attempt; reloading does not turn the recorded die into a new chance.</p>
      </section>
      <section className="guide-chapter" id="guide-memory" aria-labelledby="guide-memory-title">
        <p className="eyebrow">04 · Carry what you know</p><h2 id="guide-memory-title">Keep your word</h2>
        <p>The journal keeps clues, claims and promises with their sources. The commitments panel shows what still needs your attention. Use the character sheet and, when available, Consult acquired sources to revisit what you actually learned.</p>
        <p>In the notebook, Build a Ward Nine case connects acquired sources to a claim. Test the links, correct unsupported support and carry the tested account into archive work or a hearing. A case draft grants no evidence or permission.</p>
        <p>After the archive briefing, the optional Archive mission plan lets you choose a reader or carbon approach and a failure contingency. Saving a plan is free; setup choices spend the shown money, effort or exposure. Staffed recovery keeps a paid ledger and free pause available. Withdrawal closes a failed search as unresolved. A carbon copy never authenticates an issuing key.</p>
        <p>After source custody and an acquired cancellation receipt, ask Edda about the depot from the canal. A tested notebook case can lead into this conversation; Edda also reviews the recorded sources directly. Choose what to share and whether to send a public review or a private service query. Kerr responds to what he actually knows, including earlier privacy promises. The depot offers two saved task actions: registration and work, booking and rest, or a separate correction delivery. Reading, conversation, playback and settings spend none. Payment and recovery require completion; pausing preserves the allowance, and closing the week ends unfinished opportunities.</p>
        <ul className="guide-steps"><li><strong>Read a source before making a claim.</strong> A recorded recollection, an official record and independent corroboration can support different things.</li>
          <li><strong>Check what was completed.</strong> Accepting a job, arriving at a door and observing its handover are separate events.</li>
          <li><strong>Ask for the right permission.</strong> Safe transport, a private recording, future contact and public quotation each have their own terms.</li>
          <li><strong>Leave room for unfinished work.</strong> A promise can remain open. Return visits let people answer what you actually did.</li></ul>
        <p>Your run unfolds across The Hour, The Week and The Wall. Optional work and conversations can change what you carry into the next chapter. Follow the visible goal, check your commitments before closing a chapter, and choose the ending your runner can stand behind.</p>
      </section>
      <section className="guide-chapter" id="guide-controls" aria-labelledby="guide-control-title">
        <p className="eyebrow">05 · Travel light</p><h2 id="guide-control-title">Controls, comfort and saves</h2>
        <dl className="guide-controls"><dt>Touch or mouse</dt><dd>Select a choice or open its check. Sheet, Settings and Saves stay available during play.</dd>
          <dt>Keyboard</dt><dd>Tab and Shift+Tab move between controls; Enter activates them. Escape closes a dialog. Number-key choices are enabled by default and can be switched off in Settings.</dd>
          <dt>Controller</dt><dd>Enable a standard gamepad in Settings. The D-pad moves between controls, A activates and B closes dialogs.</dd>
          <dt>Read and listen</dt><dd>Settings offers larger text, high contrast, reduced motion, paragraph pacing and text-only artwork. Music, ambience, effects and voices have separate sliders. Character dialogue is automatic by default; Stop, Listen and manual dialogue are available.</dd>
          <dt>Find your bearings</dt><dd>Open City map from the character sheet to review places introduced in your run. Find locates an available choice so you can review it before acting. Map positions are schematic.</dd>
          <dt>Save your place</dt><dd>Progress saves in this browser. Use Saves for three manual slots or export a copy to keep elsewhere. Slot artwork reflects the saved checkpoint; text-only mode keeps its runner and chapter labels. Imports and starting over ask before replacing an active run. If storage is unavailable, the game tells you that progress is session-only.</dd></dl>
        <p className="guide-note">The guide and practice are safe to revisit. They do not accept a job, spend resources, roll a campaign die or replace your save.</p>
        <div className="actions"><Link className="primary" href="/" prefetch={false}>Return to the main page</Link></div>
        <p className="fine">Corporate violence and memory editing. Original fiction. The city’s discoveries stay in the story.</p>
      </section>
    </main>
    {artwork && viewedArt && <ArtworkViewer art={viewedArt} onClose={() => setViewedArt(null)} />}
  </div></ArtworkContext.Provider>;
}
