"use client";

import * as React from "react";

/** Layout for the My-loans summary + documents: a single stacked column or a
 *  side-by-side grid (loan card left, documents right). */
export type LoansView = "stacked" | "grid";

const STORAGE_KEY = "my-loans:view";
const EVENT = "my-loans:view-change";

function read(): LoansView {
  if (typeof window === "undefined") return "stacked";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === "grid" || saved === "stacked" ? saved : "stacked";
}

function subscribe(onChange: () => void) {
  // Same-tab updates fire a custom event; other tabs fire the native `storage`
  // event. Listen to both so every consumer stays in sync.
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Shared My-loans layout preference, persisted to localStorage and synced across
 * every component that reads it (the page and the profile menu both drive it).
 */
export function useLoansView(): [LoansView, (next: LoansView) => void] {
  const view = React.useSyncExternalStore(subscribe, read, () => "stacked" as LoansView);

  const setView = React.useCallback((next: LoansView) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return [view, setView];
}
