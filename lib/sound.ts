let bed: HTMLAudioElement | null = null;
let rain: HTMLAudioElement | null = null;

export function setBed(on: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (!on) {
      bed?.pause();
      rain?.pause();
      return;
    }
    if (!bed) {
      bed = new Audio("/audio/theme.wav");
      bed.loop = true;
      bed.volume = 0.22;
      rain = new Audio("/audio/rain.wav");
      rain.loop = true;
      rain.volume = 0.16;
    }
    void bed.play();
    void rain?.play();
  } catch {
    // A blocked audio context should never stop the scene.
  }
}

export function playCue(name: string) {
  try {
    const audio = new Audio(`/audio/${name}.wav`);
    audio.volume = name === "dice-tick" ? 0.18 : 0.42;
    void audio.play();
  } catch {
    // Missing or blocked audio stays cosmetic.
  }
}

export function locationCue(location: string, ending: boolean): string {
  if (ending) return "sting-ending";
  const value = location.toLowerCase();
  if (value.includes("chapel") || value.includes("chair") || value.includes("stair")) return "sting-chapel";
  if (value.includes("ward") || value.includes("alley") || value.includes("canal") || value.includes("hatch")) return "sting-alley";
  if (value.includes("spire") || value.includes("helion")) return "sting-ending";
  return "sting-stall";
}
