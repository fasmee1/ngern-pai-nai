"use client";

import { useSyncExternalStore } from "react";
import { IconMoon, IconSun, IconSystem } from "./icons";

type Mode = "system" | "light" | "dark";
const KEY = "jarvis-theme";
const LABELS: Record<Mode, string> = { system: "ตามเครื่อง", light: "สว่าง", dark: "มืด" };
const ICONS = { system: IconSystem, light: IconSun, dark: IconMoon };

function apply(mode: Mode) {
  const dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  if (dark) document.documentElement.setAttribute("data-theme", "dark");
  else document.documentElement.removeAttribute("data-theme");
}

function readMode(): Mode {
  const saved = localStorage.getItem(KEY);
  return saved === "light" || saved === "dark" ? saved : "system";
}

// Subscribe to storage changes so every control stays in sync.
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export function ThemePicker() {
  const mode = useSyncExternalStore(subscribe, readMode, (): Mode => "system");

  function choose(next: Mode) {
    if (next === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, next);
    apply(next);
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
  }

  return (
    <div className="segmented theme-picker" role="group" aria-label="โหมดแสดงผล">
      {(Object.keys(LABELS) as Mode[]).map((m) => {
        const Icon = ICONS[m];
        return (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => choose(m)}>
            <Icon size={18} />
            <span>{LABELS[m]}</span>
          </button>
        );
      })}
    </div>
  );
}
