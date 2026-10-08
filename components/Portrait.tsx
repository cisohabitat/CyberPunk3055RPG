import type { ReactNode } from "react";
import type { OriginId } from "@/lib/types";

const ACCENTS: Record<string, string> = {
  Quill: "#ffb020",
  Orderly: "#d7fff6",
  "Sister Lumen": "#ff3d9a",
  Kerr: "#ffb020",
  Mara: "#5ef2ff",
  Ives: "#5ef2ff",
  Sera: "#9dffc4",
  gutterwire: "#ffb020",
  spire: "#5ef2ff",
  dustline: "#ff3d9a",
};

function Frame({
  accent,
  label,
  children,
}: {
  accent: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <svg className="portrait" viewBox="0 0 160 200" role="img" aria-label={label}>
      <rect width="160" height="200" fill="#100f16" />
      <rect x="5" y="5" width="150" height="190" fill="none" stroke={accent} strokeWidth="2" />
      <rect x="5" y="168" width="150" height="27" fill={accent} opacity="0.16" />
      <text x="12" y="186" fill={accent} fontSize="11" letterSpacing="1.5" style={{ fontFamily: "var(--font-display), sans-serif" }}>
        {label.toUpperCase().slice(0, 16)}
      </text>
      {children}
    </svg>
  );
}

function Quill() {
  return (
    <Frame accent={ACCENTS.Quill} label="Quill">
      <path d="M28 150 C40 78 120 78 132 150" fill="#2a2118" />
      <ellipse cx="80" cy="78" rx="34" ry="40" fill="#e6c2a0" />
      <path d="M48 62 Q80 28 114 66 Q100 48 80 46 Q58 48 46 66" fill="#3a2a22" />
      <path d="M58 78 H102" stroke="#6b3a32" strokeWidth="2" />
      <circle cx="68" cy="76" r="2" fill="#1a120e" />
      <circle cx="92" cy="76" r="2" fill="#1a120e" />
      <path d="M70 96 Q80 102 90 96" fill="none" stroke="#6b3a32" strokeWidth="2" />
      <ellipse cx="80" cy="146" rx="22" ry="8" fill="#ffb020" opacity="0.85" />
    </Frame>
  );
}

function Orderly() {
  return (
    <Frame accent={ACCENTS.Orderly} label="Orderly">
      <path d="M40 160 L80 118 L120 160" fill="#f4f7f6" />
      <ellipse cx="80" cy="78" rx="30" ry="36" fill="#f0d2bd" />
      <path d="M52 58 H108 V74 H52 Z" fill="#f7f7f2" />
      <circle cx="80" cy="92" r="10" fill="none" stroke="#5ef2ff" strokeWidth="3" />
      <path d="M80 84 V100 M72 92 H88" stroke="#5ef2ff" strokeWidth="2" />
    </Frame>
  );
}

function Lumen() {
  return (
    <Frame accent={ACCENTS["Sister Lumen"]} label="Lumen">
      <path d="M36 162 L80 110 L124 162" fill="#2a2030" />
      <ellipse cx="80" cy="74" rx="32" ry="38" fill="#e7c3aa" />
      <path d="M48 70 Q80 36 112 70 L104 48 Q80 28 56 48 Z" fill="#1b141c" />
      <circle cx="68" cy="78" r="2.4" fill="#1a120e" />
      <circle cx="96" cy="78" r="7" fill="#120810" stroke="#ff3d9a" strokeWidth="3" />
      <circle cx="96" cy="78" r="2" fill="#ff3d9a" />
    </Frame>
  );
}

function Kerr() {
  return (
    <Frame accent={ACCENTS.Kerr} label="Kerr">
      <path d="M24 164 L80 100 L136 164" fill="#1c2430" />
      <ellipse cx="80" cy="72" rx="36" ry="40" fill="#d7b094" />
      <path d="M44 60 Q80 24 118 64 L110 48 Q80 30 50 48 Z" fill="#1a1a1a" />
      <path d="M62 80 H74 M90 80 H102" stroke="#1a120e" strokeWidth="3" />
      <path d="M48 150 H112" stroke="#ffb020" strokeWidth="6" />
      <path d="M70 140 V160" stroke="#ffb020" strokeWidth="3" />
    </Frame>
  );
}

function Mara() {
  return (
    <Frame accent={ACCENTS.Mara} label="Mara">
      <path d="M46 40 A40 40 0 0 1 114 40" fill="none" stroke="#5ef2ff" strokeWidth="3" />
      <path d="M38 164 L80 112 L122 164" fill="#12343c" />
      <ellipse cx="80" cy="86" rx="30" ry="34" fill="#efd0b8" />
      <path d="M52 78 Q80 50 110 80 Q96 64 80 62 Q64 64 50 80" fill="#2c241c" />
      <circle cx="70" cy="90" r="2" fill="#1a120e" />
      <circle cx="92" cy="90" r="2" fill="#1a120e" />
      <path d="M72 104 Q80 108 88 104" fill="none" stroke="#8a5a52" strokeWidth="2" />
    </Frame>
  );
}

function Ives() {
  return (
    <Frame accent={ACCENTS.Ives} label="Ives">
      <rect x="46" y="118" width="68" height="46" fill="#102028" />
      <ellipse cx="80" cy="74" rx="28" ry="34" fill="#f0d0b4" />
      <path d="M54 60 H106 L100 42 H60 Z" fill="#0e1a22" />
      <rect x="102" y="128" width="28" height="36" fill="#071016" stroke="#5ef2ff" />
      <circle cx="70" cy="78" r="2" fill="#1a120e" />
      <circle cx="90" cy="78" r="2" fill="#1a120e" />
    </Frame>
  );
}

function Sera() {
  return (
    <Frame accent={ACCENTS.Sera} label="Sera">
      <path d="M30 90 Q80 28 130 90 L120 164 H40 Z" fill="#143028" />
      <ellipse cx="80" cy="96" rx="26" ry="30" fill="#e4c2a4" />
      <path d="M58 100 H102" stroke="#1a120e" strokeWidth="2" />
      <path d="M118 120 L146 150" stroke="#9dffc4" strokeWidth="3" />
      <path d="M20 40 H40 M24 52 H48" stroke="#5ef2ff" strokeWidth="2" opacity="0.7" />
    </Frame>
  );
}

function OriginPlate({ origin }: { origin: OriginId }) {
  const accent = ACCENTS[origin];
  const label = origin === "gutterwire" ? "Gutterwire" : origin === "spire" ? "Spire" : "Dustline";
  return (
    <Frame accent={accent} label={label}>
      {origin === "gutterwire" && <path d="M80 36 L124 110 L80 150 L36 110 Z" fill="none" stroke={accent} strokeWidth="4" />}
      {origin === "spire" && <path d="M80 34 L118 150 H42 Z" fill="none" stroke={accent} strokeWidth="4" />}
      {origin === "dustline" && (
        <>
          <path d="M24 120 H136" stroke={accent} strokeWidth="3" />
          <path d="M30 96 Q80 70 130 96" fill="none" stroke={accent} strokeWidth="3" />
        </>
      )}
      <circle cx="80" cy="110" r="6" fill={accent} />
    </Frame>
  );
}

const SPEAKERS: Record<string, () => ReactNode> = {
  Quill,
  Orderly,
  "Sister Lumen": Lumen,
  Kerr,
  Mara,
  Ives,
  Sera,
};

export function Portrait({ speaker, origin }: { speaker?: string; origin: OriginId }) {
  const Face = speaker ? SPEAKERS[speaker] : undefined;
  return (
    <div className="portrait-frame">
      {Face ? <Face /> : <OriginPlate origin={origin} />}
    </div>
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
