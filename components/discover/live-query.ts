"use client";

import { useSyncExternalStore } from "react";

/**
 * What is in the search box right now, shared between the box and the board.
 *
 * The board used to filter on the query the server rendered with, so clearing
 * the box left "Nothing matches" on screen for the whole round trip, which on
 * a slow request read as clearing doing nothing. The feeds are already in the
 * browser, so the board can follow the box on every keystroke and the server
 * trip is left to do the one thing only it can: search our own pool index.
 *
 * `null` until the box has been touched, so the board renders exactly what the
 * server sent on a cold load.
 */
let current: string | null = null;
const listeners = new Set<() => void>();

/** Back to "untouched", for when the page that owns the box goes away. */
export function resetLiveQuery() {
  setLiveQuery(null);
}

export function setLiveQuery(text: string | null) {
  if (text === current) return;
  current = text;
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The live query, or `fallback` (the server's) before anyone has typed. */
export function useLiveQuery(fallback: string): string {
  const live = useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
  return live ?? fallback;
}

/**
 * Renders its children only while the box holds a search.
 *
 * For the server-rendered index results under the board: they belong to the
 * query the server saw, so once the box is cleared they go at the same moment
 * the board comes back, rather than lingering until the round trip lands.
 */
export function WhileSearching({
  query,
  children,
}: {
  query: string;
  children: React.ReactNode;
}) {
  return useLiveQuery(query).trim() ? children : null;
}
