"use client";
import { useEffect } from "react";

export function useController(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !navigator.getGamepads) return;
    let frame = 0;
    const prior = new Map<number, boolean[]>();
    function tick() {
      for (const pad of navigator.getGamepads()) {
        if (!pad || pad.mapping !== "standard") continue;
        const pressed = pad.buttons.map((button) => button.pressed);
        const previous = prior.get(pad.index) ?? [];
        prior.set(pad.index, pressed);
        if (document.visibilityState !== "visible") continue;
        const root = document.querySelector("dialog[open]") ?? document;
        const targets = [...root.querySelectorAll<HTMLElement>("button:not([disabled]), select, input, a[href]")].filter((node) => node.tabIndex >= 0 && node.getClientRects().length > 0);
        const index = targets.indexOf(document.activeElement as HTMLElement);
        const edge = (id: number) => pressed[id] && !previous[id];
        if (edge(12) || edge(14)) targets[(index - 1 + targets.length) % targets.length]?.focus();
        if (edge(13) || edge(15)) targets[(index + 1) % targets.length]?.focus();
        if (edge(0)) {
          const active = document.activeElement as HTMLElement | null;
          if (active && root.contains(active)) active.click();
        }
        if (edge(1)) {
          const dialog = document.querySelector("dialog[open]");
          if (dialog) dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
        }
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [enabled]);
}
