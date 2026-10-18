"use client";

import { useState } from "react";
import type { CastMember } from "@/lib/story/cast";
import type { CharacterProfile } from "@/lib/character-profiles";
import { journalKind, journalTitle, promiseStatus } from "@/lib/journal";
import type { GameState } from "@/lib/types";
import { portraitFinish } from "@/lib/art-finish";

export function CastCard({ person, history, artwork, profile, state }: { person: CastMember; history?: string; artwork: boolean; profile?: CharacterProfile; state: GameState }) {
  const [failed, setFailed] = useState(false);
  const [portraitFailed, setPortraitFailed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  return (
    <li className="cast-card" data-speaker={person.speaker}>
      {artwork && !failed ? (
        <img className="cast-portrait" data-finish={portraitFinish(profile?.portrait ?? "")} src={person.thumbnail} alt="" width={80} height={107}
          loading="lazy" decoding="async" onError={() => setFailed(true)} />
      ) : <span className="cast-placeholder" aria-hidden="true">{person.name.slice(0, 1)}</span>}
      <div className="cast-card-copy">
        <strong>{person.name}</strong>
        <span>{person.role}</span>
        {history && <small className="cast-conduct">Shared history · {history}</small>}
      </div>
      {profile && <details className="cast-profile" open={profileOpen} onToggle={event => setProfileOpen(event.currentTarget.open)}>
        <summary>About {person.name}</summary>
        {profileOpen && <div className="cast-profile-content" data-testid="character-profile">
          {artwork && !portraitFailed && <img className="cast-profile-portrait" data-finish={portraitFinish(profile.portrait)} src={profile.portrait} alt=""
            width={300} height={400} loading="lazy" decoding="async" onError={() => setPortraitFailed(true)} />}
          <p>{profile.introduction}</p>
          {profile.notes.length > 0 ? <details className="cast-profile-notes">
            <summary>Encounter notes · {profile.notes.length}</summary>
            <ul className="journal">
              {profile.notes.map(entry => <li key={entry.id}>
                <strong>{journalTitle(entry)}</strong>
                <small className="journal-kind">{journalKind(entry)}{journalKind(entry) === "promise" ? ` · ${promiseStatus(entry.id, state.flags, state.journal)}` : ""}</small>
                <span>{entry.text}</span>
              </li>)}
            </ul>
          </details> : <p className="hint">Your journal has no further encounter notes for {person.name} yet.</p>}
        </div>}
      </details>}
    </li>
  );
}
