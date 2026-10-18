/** Decorative die geometry. CheckDialog owns the one saved roll and its timing. */
export function CheckDie({ value, rolling = false, reducedMotion = false, success, critical }: {
  value: number | null;
  rolling?: boolean;
  reducedMotion?: boolean;
  success?: boolean;
  critical?: "success" | "fail" | null;
}) {
  return <div className={`die plate${success === undefined ? "" : success ? " good" : " bad"}`}
    data-testid="check-die" data-phase={rolling ? "rolling" : "settled"}
    data-reduced-motion={reducedMotion} data-critical={critical ?? undefined} aria-hidden="true">
    <div className="die-form">
      <svg viewBox="0 0 120 120" focusable="false" aria-hidden="true" className="die-geometry">
        <path className="die-body" d="M60 5 111 36 97 94 60 116 23 94 9 36Z" />
        <path className="die-facet die-facet--light" d="M60 5 111 36 88 60 60 22Z" />
        <path className="die-facet die-facet--mid" d="M60 5 60 22 32 60 9 36Z" />
        <path className="die-facet die-facet--dark" d="M9 36 32 60 23 94Z M111 36 97 94 88 60Z" />
        <path className="die-facet die-facet--low" d="M32 60 60 98 60 116 23 94Z M88 60 97 94 60 116 60 98Z" />
        <path className="die-center" d="M60 22 88 60 60 98 32 60Z" />
        <path className="die-edges" d="M60 5 111 36 97 94 60 116 23 94 9 36Z M60 5V22L32 60 9 36 M111 36 88 60 60 22 M32 60 23 94 M88 60 97 94 M32 60 60 98 88 60 M60 98V116" />
      </svg>
      <span className="die-face">{value ?? "·"}</span>
    </div>
  </div>;
}
