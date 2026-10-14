import type { BedStatus } from "@/lib/sound";

export type MenuMusicProps = {
  status?: BedStatus;
  muted?: boolean;
  paused?: boolean;
  waiting?: boolean;
  onToggle?: () => void;
};

export function MenuMusic({ status = "idle", muted = false, paused = false, waiting = false, onToggle }: MenuMusicProps) {
  if (!onToggle) return null;
  return <div className="title-music" data-testid="title-music">
    <button className="ghost" type="button" disabled={muted} onClick={onToggle}>
      {status === "playing" || status === "loading" ? "Stop menu music" : paused ? "Resume menu music" : "Play menu music"}
    </button>
    <p className="hint" role={muted || status === "loading" || status === "unavailable" || paused ? "status" : undefined}>
      {muted ? "Music volume is off. Adjust it in Settings to listen." : status === "loading" ? "Loading Under the Awning…" : status === "unavailable" ? "Music unavailable. You can still start the game." : paused ? "Music paused while you were away." : waiting ? "Under the Awning · autoplay is waiting for your first menu interaction." : status === "playing" ? "Under the Awning · now playing" : "Under the Awning · menu theme"}
    </p>
  </div>;
}
