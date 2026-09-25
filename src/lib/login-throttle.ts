import "server-only";

/**
 * Wrong admin passwords, counted per address.
 *
 * The password is meant to be easy to remember, so guessing it has to be
 * slow: after TRIES wrong ones inside WINDOW_MS, an address is turned away
 * until the oldest of them ages out. A right password clears the count.
 *
 * It lives in memory, so each server instance keeps its own count - enough
 * to turn a guessing script from thousands of tries a minute into a handful
 * an hour, which is what an easy password needs.
 */

const WINDOW_MS = 15 * 60_000;
const TRIES = 10;
const misses = new Map<string, number[]>();

function recent(key: string, now: number): number[] {
  return (misses.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
}

export function isLockedOut(key: string): boolean {
  return recent(key, Date.now()).length >= TRIES;
}

export function recordMiss(key: string): void {
  const now = Date.now();
  const list = recent(key, now);
  list.push(now);
  if (misses.size > 5000) misses.clear(); // crude ceiling, as for enquiries
  misses.set(key, list);
}

export function clearMisses(key: string): void {
  misses.delete(key);
}
