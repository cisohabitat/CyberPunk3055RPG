import { BRAND_MARK } from "@/lib/brand-mark";

export function Mark({ accent = "#5ef2ff" }: { accent?: string }) {
  return (
    <svg className="mark" data-brand="halo-shard" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path d={BRAND_MARK.halo} fill="#d8d5cc" />
      <path d={BRAND_MARK.shard} fill="#168ca9" stroke={accent} strokeWidth="1" strokeLinejoin="round" />
      <path d={BRAND_MARK.light} fill="#5ef2ff" />
      <path d={BRAND_MARK.facet} fill="none" stroke="#c7faff" strokeWidth=".9" strokeLinejoin="round" />
    </svg>
  );
}

const ACCENTS = {
  gutterwire: "#ffb020",
  spire: "#5ef2ff",
  dustline: "#ff3d9a",
} as const;

export function originAccent(origin: keyof typeof ACCENTS) {
  return ACCENTS[origin];
}
