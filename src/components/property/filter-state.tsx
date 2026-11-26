"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useQueryStates } from "nuqs";

import { filterParsers } from "@/lib/filters";

/* ==========================================================================
   FILTER STATE

   The listings page is static: it is built once with every public unit, and
   the browser does the filtering. The URL is still the single source of truth
   - links stay shareable and the back button still restores a search - but
   only one component reads it.

   Reading the query string on a static page forces whatever reads it to be
   rendered in the browser alone. If every control read it, the sidebar, the
   search box and the result list would all arrive empty and pop in once the
   script loaded. So <FilterSync /> reads the URL and publishes it here, and
   everything else reads from here. Before the script runs, that is the empty
   search - exactly what the static page was built with - so the whole page,
   every listing included, ships as finished HTML.
   ========================================================================== */

function useUrlFilters() {
  // Shallow: changing a filter updates the address and re-filters in place.
  // Nothing is sent to the server.
  return useQueryStates(filterParsers, { history: "push", clearOnDefault: true });
}

type FilterState = ReturnType<typeof useUrlFilters>;

/** What an address with no query string parses to, derived from the parsers
 *  themselves so a new filter needs no second edit here. */
const EMPTY = Object.fromEntries(
  Object.entries(filterParsers).map(([key, parser]) => [
    key,
    "defaultValue" in parser ? parser.defaultValue : null,
  ]),
) as FilterState[0];

const UNSYNCED = (() => Promise.resolve(new URLSearchParams())) as FilterState[1];

const INITIAL: FilterState = [EMPTY, UNSYNCED];

let current: FilterState = INITIAL;
const listeners = new Set<() => void>();

function publish(next: FilterState) {
  if (next[0] === current[0] && next[1] === current[1]) return;
  current = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => current;
const getServerSnapshot = () => INITIAL;

/** The one reader of the URL. Render it inside a <Suspense> boundary. */
export function FilterSync() {
  const [values, setValues] = useUrlFilters();

  useEffect(() => {
    publish([values, setValues]);
  }, [values, setValues]);

  // Leaving the page forgets the search, so arriving later from a link with
  // its own filters never shows the previous visit's results first.
  useEffect(
    () => () => {
      publish(INITIAL);
    },
    [],
  );

  return null;
}

/** The current filters and their setter, for any component on the page. */
export function useFilters(): FilterState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
