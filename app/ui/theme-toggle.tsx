"use client";

import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme";

type Theme = "light" | "dark";

const STORAGE_KEY = THEME_STORAGE_KEY;

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  window.dispatchEvent(new Event("brand-studio-theme-change"));
}

function getCurrentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribeToTheme(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const syncPreference = () => {
    let saved: string | null = null;
    try { saved = window.localStorage.getItem(STORAGE_KEY); } catch { /* Private browsing. */ }
    applyTheme(saved === "light" || saved === "dark" ? saved : media.matches ? "dark" : "light");
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) syncPreference();
  };
  media.addEventListener("change", syncPreference);
  window.addEventListener("storage", onStorage);
  window.addEventListener("brand-studio-theme-change", onStoreChange);
  return () => {
    media.removeEventListener("change", syncPreference);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("brand-studio-theme-change", onStoreChange);
  };
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToTheme, getCurrentTheme, () => "light");

  function toggleTheme() {
    const nextTheme: Theme = getCurrentTheme() === "dark" ? "light" : "dark";
    try { window.localStorage.setItem(STORAGE_KEY, nextTheme); } catch { /* Keep the toggle usable. */ }
    applyTheme(nextTheme);
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
      aria-pressed={isDark}
      title={isDark ? "Mode clair" : "Mode sombre"}
      className="bs-theme-toggle"
    >
      {isDark ? (
        <SunIcon className="h-4 w-4" aria-hidden="true" />
      ) : (
        <MoonIcon className="h-4 w-4" aria-hidden="true" />
      )}
      <span>{isDark ? "Clair" : "Sombre"}</span>
    </button>
  );
}
