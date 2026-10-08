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
  const ref = useRef<HTMLDialogElement>(null);
  const escape = useRef(onEscape);
  escape.current = onEscape;

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    root.showModal();
    if (!root.querySelector("button, input, select, textarea")) root.focus();
    return () => {
      root.close();
      if (opener?.isConnected) opener.focus();
      else document.getElementById("scene-top")?.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog ref={ref} className="overlay" aria-labelledby={titleId} aria-modal="true" tabIndex={-1} onCancel={(event) => { event.preventDefault(); escape.current?.(); }}>
      <div className={className ? `dialog ${className}` : "dialog"}>
        {children}
      </div>
    </dialog>
  );
}
