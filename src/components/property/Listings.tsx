"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";

import { areas } from "@/content/client-facts";
import { queryProperties, type ListingFacts } from "@/lib/data/query";
import { toPropertyFilters } from "@/lib/filters";
import type { Locale } from "@/i18n/routing";
import { useFilters } from "./filter-state";
import { FilterSheet } from "./Filters";
import { ResultsShell } from "./ResultsShell";

/* ==========================================================================
   THE RESULT LIST, FILTERED IN THE BROWSER

   The page hands over every public unit once: the facts a query needs, and
   the unit's row already rendered on the server. Filtering picks and orders
   rows; it never renders one, so the rows stay server components and the
   page does not ship the card code or full listing data twice.
   ========================================================================== */

export type ListingItem = {
  facts: ListingFacts;
  /** The unit's result row, rendered on the server. */
  row: ReactNode;
};

type Listings = {
  shown: ListingItem[];
  filters: ReturnType<typeof useFilters>[0];
};

const ListingsContext = createContext<Listings | null>(null);

export function ListingsProvider({
  items,
  children,
}: {
  items: ListingItem[];
  children: ReactNode;
}) {
  const [filters] = useFilters();

  const value = useMemo(() => {
    const byId = new Map(items.map((item) => [item.facts._id, item]));
    const order = queryProperties(
      items.map((item) => item.facts),
      toPropertyFilters(filters),
    );
    return { shown: order.map((facts) => byId.get(facts._id)!), filters };
  }, [items, filters]);

  return <ListingsContext.Provider value={value}>{children}</ListingsContext.Provider>;
}

function useListings(): Listings {
  const listings = useContext(ListingsContext);
  if (!listings) throw new Error("Listing components must sit inside <ListingsProvider>.");
  return listings;
}

/** "Faisal: 3 properties found" when one area is chosen; Giza otherwise. */
export function ResultsTitle() {
  const { shown, filters } = useListings();
  const t = useTranslations("listings");
  const locale = useLocale() as Locale;

  const onlyArea = filters.area.length === 1 ? areas.find((a) => a.slug === filters.area[0]) : null;
  const place = onlyArea ? onlyArea.name[locale] : t("placeAll");

  return <>{t("resultsTitle", { place, count: shown.length })}</>;
}

/** The phone's filter button, showing how many results its filters leave. */
export function LiveFilterSheet({ counts }: { counts: Record<string, number> }) {
  const { shown } = useListings();
  return <FilterSheet counts={counts} resultCount={shown.length} />;
}

export function ResultsList({ empty }: { empty: ReactNode }) {
  const { shown, filters } = useListings();

  // Changes whenever the filters change, which is what re-triggers the list's
  // entrance so results arrive rather than snap. Keys are sorted so the empty
  // search the page was built with and the one the URL parses to compare equal.
  const signature = JSON.stringify(filters, Object.keys(filters).sort());

  return (
    <ResultsShell signature={signature} count={shown.length}>
      {shown.length === 0 ? (
        empty
      ) : (
        <ol className="space-y-4">
          {shown.map((item) => (
            <li key={item.facts._id}>{item.row}</li>
          ))}
        </ol>
      )}
    </ResultsShell>
  );
}
