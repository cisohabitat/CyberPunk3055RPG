export function Mark({ accent = "#5ef2ff" }: { accent?: string }) {
  return (
    <svg className="mark" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 6 L58 32 L32 58 L6 32 Z" fill="none" stroke={accent} strokeWidth="3" />
      <circle cx="32" cy="32" r="5" fill={accent} />
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
