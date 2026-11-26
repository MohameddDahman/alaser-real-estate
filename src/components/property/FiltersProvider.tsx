"use client";

import { createContext, useContext, useTransition, type ReactNode } from "react";

/**
 * Shares one pending flag between the filter controls and the results grid.
 *
 * Filtering now runs in the browser (see ./filter-state.tsx), so nothing waits
 * on the server and the flag stays false: results re-animate in place. The
 * skeletons in ResultsShell stay for any future filter that does have to
 * fetch, so it can show placeholders at the final dimensions instead of
 * snapping or collapsing to zero height.
 */
const Ctx = createContext<{
  pending: boolean;
  start: React.TransitionStartFunction;
}>({ pending: false, start: (fn) => fn() });

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [pending, start] = useTransition();
  return <Ctx.Provider value={{ pending, start }}>{children}</Ctx.Provider>;
}

export function useFilterTransition() {
  return useContext(Ctx);
}
