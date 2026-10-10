import { speakerRole } from "@/lib/story/cast";
import { portraitArt } from "@/lib/art";
import type { OriginId } from "@/lib/types";

const ORIGIN_ART: Record<OriginId, { src: string; label: string }> = {
  gutterwire: { src: "/art/stall.jpg", label: "Gutterwire" },
  spire: { src: "/art/spire.jpg", label: "Spire" },
  dustline: { src: "/art/canal.jpg", label: "Dustline" },
};

export function Portrait({ speaker, sceneId, origin, handle, artwork = true }: { speaker?: string; sceneId?: string; origin: OriginId; handle?: string; artwork?: boolean }) {
  const face = portraitArt(speaker, sceneId);
  const plate = ORIGIN_ART[origin];
  const src = face ?? plate.src;
  const role = speaker ? speakerRole(speaker) : undefined;
  const name = speaker === "Sister Lumen" ? "Lumen" : speaker;
  const label = name ? `${name}${role ? ` · ${role}` : ""}` : `${handle ?? plate.label} · ${plate.label}`;
  return (
    <figure className="portrait-frame">
      {artwork ? <img className="portrait" src={src} alt="" width={220} height={294} decoding="async" /> : <div className="portrait-placeholder" aria-hidden="true" />}
      <figcaption>{label}</figcaption>
    </figure>
  );
}

export function reactionLine(speaker: string | undefined, success: boolean): string {
  const lines: Record<string, [string, string]> = {
    Quill: [
      "Quill tips the bowl, which is as close as he comes to applause.",
      "Quill watches the rain like it just took your side against you.",
    ],
    Orderly: [
      "The orderly's pen stops. You are, briefly, a person.",
      "The orderly writes something small and does not show it to you.",
    ],
    "Sister Lumen": [
      "Lumen's optic eases. She believes the room, if not the tower.",
      "Lumen's optic tightens. She has already started the next version of you.",
    ],
    Kerr: ["Kerr's knee shifts. The door is still a door.", "Kerr does not smile. The knee does the talking."],
    Mara: [
      "Under the halo, Mara's breath catches like she heard her own name.",
      "Mara keeps the four-count. The chair does not take sides.",
    ],
    Ives: ["Ives ticks a box that was already going to be ticked.", "Ives closes the folio. Your name stays on the page."],
    Sera: ["Sera nods at the wall, not at you. That is the better nod.", "Sera looks at the names so she does not have to look at you."],
  };
  const pair = speaker ? lines[speaker] : undefined;
  if (!pair) return success ? "The room lets the roll stand." : "The room hears the miss and files it.";
  return success ? pair[0] : pair[1];
}
