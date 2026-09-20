"use client";

import { createContext, useContext, useTransition, type ReactNode } from "react";

/**
 * Shares one pending flag between the filter controls and the results grid.
 *
 * The controls write to the URL with `shallow: false`, which re-runs the server
 * query; this transition is what lets the results show skeletons at the exact
 * final dimensions instead of snapping or collapsing to zero height.
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
