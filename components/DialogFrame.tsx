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
    const viewport = window.visualViewport;
    function fitViewport() {
      if (!viewport || viewport.scale !== 1) {
        root!.style.removeProperty("--dialog-viewport-height");
        root!.style.removeProperty("top");
        return;
      }
      root!.style.setProperty("--dialog-viewport-height", `${viewport.height}px`);
      root!.style.top = `${viewport.offsetTop}px`;
    }
    fitViewport();
    viewport?.addEventListener("resize", fitViewport);
    viewport?.addEventListener("scroll", fitViewport, { passive: true });
    root.querySelector<HTMLElement>("[data-dialog-initial-focus]")?.focus({ preventScroll: true });
    if (!root.querySelector("button, input, select, textarea")) root.focus();
    return () => {
      viewport?.removeEventListener("resize", fitViewport);
      viewport?.removeEventListener("scroll", fitViewport);
      root.close();
      if (opener?.isConnected) opener.focus({ preventScroll: true });
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
