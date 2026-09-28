"use client";

import { useSyncExternalStore } from "react";

// Saved listings live on the device (localStorage) so visitors can shortlist
// properties without an account, and the list works offline in the installed app.
const KEY = "found:saved";
const EMPTY: string[] = [];
let cache: string[] | null = null;
const listeners = new Set<() => void>();

function read(): string[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(ids: string[]) {
  cache = ids;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* storage full or blocked — keep in memory */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useSaved() {
  const ids = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    ids,
    has: (id: string) => ids.includes(id),
    toggle: (id: string) => write(ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids].slice(0, 100)),
    clear: () => write([]),
  };
}
