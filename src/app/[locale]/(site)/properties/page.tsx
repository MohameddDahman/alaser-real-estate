import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { PropertyCard } from "@/components/property/PropertyCard";
import { FiltersProvider } from "@/components/property/FiltersProvider";
import { FilterControls, FilterSheet, SortSelect } from "@/components/property/Filters";
import { ResultsShell } from "@/components/property/ResultsShell";
import { filterCache } from "@/lib/filters.server";
import { toPropertyFilters, type RawFilters } from "@/lib/filters";
import { getAreaCounts, getProperties, planForProperty } from "@/lib/data";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "listings" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function PropertiesPage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const parsed = (await filterCache.parse(searchParams)) as unknown as RawFilters;
  const t = await getTranslations("listings");

  const [properties, counts] = await Promise.all([
    getProperties(toPropertyFilters(parsed)),
    getAreaCounts(),
  ]);

  // Changes whenever the query changes, which is what re-triggers the grid's
  // entrance so results arrive rather than snap.
  const signature = JSON.stringify(parsed);

  return (
    <FiltersProvider>
      <div className="mx-auto w-full max-w-[92rem] px-4 pb-24 pt-32 sm:px-6 lg:px-10 lg:pb-32 lg:pt-40">
        <header>
          <p className="label text-survey">{t("title")}</p>
          <h1 className="mt-3 text-d2 text-sheet">{t("metaTitle")}</h1>
          <p className="measure mt-5 text-lead text-giza-dim">{t("lead")}</p>
        </header>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-b border-navy-edge pb-4">
          <p className="font-data text-data text-giza tabular-nums">
            {t("count", { count: properties.length })}
          </p>
          <div className="flex items-center gap-3">
            <FilterSheet counts={counts} resultCount={properties.length} />
            <SortSelect />
          </div>
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-[17rem_1fr] lg:gap-14">
          <aside className="hidden lg:block">
            <div className="sticky top-28 max-h-[calc(100dvh-9rem)] overflow-y-auto pe-2">
              <FilterControls counts={counts} />
            </div>
          </aside>

          <section aria-label={t("title")}>
            <ResultsShell signature={signature} count={properties.length}>
              {properties.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                  {properties.map((property, i) => (
                    <PropertyCard
                      key={property._id}
                      property={property}
                      plan={planForProperty(property)}
                      priority={i < 3}
                    />
                  ))}
                </div>
              )}
            </ResultsShell>
          </section>
        </div>
      </div>
    </FiltersProvider>
  );
}

/** An empty screen is an invitation to act, and it names the two filters that
 *  actually move this list rather than apologising. */
async function EmptyState() {
  const t = await getTranslations("listings");

  return (
    <div className="border border-navy-edge px-6 py-16 text-center sm:py-24">
      <h2 className="text-d3 text-sheet">{t("emptyTitle")}</h2>
      <p className="measure mx-auto mt-4 text-giza-dim">{t("emptyBody")}</p>
      <Link
        href="/properties"
        className="label mt-8 inline-flex min-h-12 items-center border border-giza-dim/50 px-6 text-sheet transition-colors duration-300 hover:border-survey hover:text-survey"
      >
        {t("emptyAction")}
      </Link>
    </div>
  );
}
