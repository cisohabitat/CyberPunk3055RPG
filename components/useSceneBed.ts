"use client";

import { useEffect, useRef } from "react";
import { playCue, setBed } from "@/lib/sound";
import { locationCue, type SoundMood, type SoundDistrict } from "@/lib/scene-sound";
import type { BedFocus } from "@/lib/pivotal-scenes";

/** Own the scene bed lifetime; speech and committed interaction cues remain independent. */
export function useSceneBed({ sound, preferenceSound, mood, district, focus, sceneId, location, ending }: {
  sound: boolean;
  preferenceSound: boolean;
  mood: SoundMood;
  district: SoundDistrict;
  focus: BedFocus;
  sceneId: string;
  location: string;
  ending: boolean | undefined;
}) {
  const priorSound = useRef<{ location: string; on: boolean; ending: boolean } | null>(null);
  useEffect(() => {
    setBed(sound, mood, district, undefined, focus);
    const previous = priorSound.current;
    if (sound && (!previous?.on || previous.location !== location || Boolean(ending) !== previous.ending)) {
      playCue(locationCue(location, Boolean(ending)));
    }
    priorSound.current = { location, on: preferenceSound, ending: Boolean(ending) };
  }, [sound, preferenceSound, mood, district, focus, sceneId, location, ending]);

  useEffect(() => () => { setBed(false); }, []);
}
