"use client";
import { useEffect } from "react";

function adjustControl(active: Element | null, direction: number): boolean {
  if (active instanceof HTMLSelectElement && !active.disabled) {
    const options = [...active.options].filter((option) => !option.disabled && !(option.parentElement instanceof HTMLOptGroupElement && option.parentElement.disabled));
    const index = options.findIndex((option) => option.value === active.value);
    const option = options[Math.max(0, Math.min(options.length - 1, index + direction))];
    if (option && option.value !== active.value) {
      active.value = option.value;
      active.dispatchEvent(new Event("change", { bubbles: true }));
    }
    return true;
  }
  if (active instanceof HTMLInputElement && active.type === "range" && !active.disabled) {
    const step = active.step === "any" ? 1 : Number(active.step || 1);
    const value = Math.max(Number(active.min || 0), Math.min(Number(active.max || 100), Number(active.value) + direction * step));
    // Use the native setter so React receives the same change as a physical slider.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(active, String(value));
    active.dispatchEvent(new Event("input", { bubbles: true }));
    active.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }
  if (active?.getAttribute("role") === "tab") {
    active.dispatchEvent(new KeyboardEvent("keydown", { key: direction < 0 ? "ArrowLeft" : "ArrowRight", bubbles: true }));
    return true;
  }
  return false;
}

export function useController(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !navigator.getGamepads) return;
    let frame = 0;
    const prior = new Map<number, boolean[]>();
    function tick() {
      const connected = new Set<number>();
      for (const pad of navigator.getGamepads()) {
        if (!pad || pad.mapping !== "standard") continue;
        connected.add(pad.index);
        const pressed = pad.buttons.map((button) => button.pressed);
        const previous = prior.get(pad.index) ?? [];
        prior.set(pad.index, pressed);
        if (document.visibilityState !== "visible") continue;
        const dialogs = [...document.querySelectorAll("dialog[open]")];
        const root = dialogs.at(-1) ?? document;
        const targets = [...root.querySelectorAll<HTMLElement>("button:not([disabled]), select:not([disabled]), input:not([disabled]), a[href], summary")]
          .filter((node) => node.tabIndex >= 0 && node.getClientRects().length > 0 && !node.closest("[inert]"));
        const active = document.activeElement;
        const index = targets.indexOf(active as HTMLElement);
        const edge = (id: number) => pressed[id] && !previous[id];
        const horizontal = edge(14) ? -1 : edge(15) ? 1 : 0;
        const adjusted = horizontal !== 0 && adjustControl(active, horizontal);
        if (edge(12) || horizontal === -1 && !adjusted) targets[index < 0 ? targets.length - 1 : (index - 1 + targets.length) % targets.length]?.focus();
        if (edge(13) || horizontal === 1 && !adjusted) targets[(index + 1) % targets.length]?.focus();
        if (edge(0) && active instanceof HTMLElement && root.contains(active)) active.click();
        if (edge(1) && root instanceof HTMLDialogElement) root.dispatchEvent(new Event("cancel", { cancelable: true }));
      }
      for (const index of prior.keys()) if (!connected.has(index)) prior.delete(index);
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [enabled]);
}
