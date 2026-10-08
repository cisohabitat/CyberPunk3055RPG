"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function DialogFrame({
  titleId,
  className,
  onEscape,
  children,
}: {
  titleId: string;
  className?: string;
  onEscape?: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const escape = useRef(onEscape);
  escape.current = onEscape;

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const focusable = () =>
      [...root.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input, select, textarea")];
    focusable()[0]?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        escape.current?.();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = focusable();
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    root.addEventListener("keydown", onKey);
    return () => root.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="overlay">
      <div ref={ref} className={className ? `dialog ${className}` : "dialog"} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        {children}
      </div>
    </div>
  );
}
