import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SearchX } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { PropertyRow } from "@/components/property/PropertyCard";
import { FiltersProvider } from "@/components/property/FiltersProvider";
import { FilterControls, FilterSheet, KeywordSearch, SortSelect } from "@/components/property/Filters";
import { ResultsShell } from "@/components/property/ResultsShell";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { filterCache } from "@/lib/filters.server";
import { toPropertyFilters, type RawFilters } from "@/lib/filters";
import { getAreaCounts, getProperties } from "@/lib/data";
import { areas } from "@/content/client-facts";

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
  const tn = await getTranslations("nav");

  const [properties, counts] = await Promise.all([
    getProperties(toPropertyFilters(parsed)),
    getAreaCounts(),
  ]);

  // "Faisal: 3 properties found" when one area is chosen; Giza otherwise.
  const onlyArea = parsed.area.length === 1 ? areas.find((a) => a.slug === parsed.area[0]) : null;
  const place = onlyArea ? onlyArea.name[locale] : t("placeAll");

  // Changes whenever the query changes, which is what re-triggers the list's
  // entrance so results arrive rather than snap.
  const signature = JSON.stringify(parsed);

  return (
    <FiltersProvider>
      <div className="shell pb-16 pt-5 lg:pb-24">
        <Breadcrumbs
          rtl={locale === "ar"}
          items={[{ label: tn("home"), href: "/" }, { label: t("title") }]}
        />

        <div className="mt-4 max-w-3xl">
          <KeywordSearch />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-8">
          <aside className="hidden lg:block">
            <div className="sticky top-4 max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-lg border border-line bg-canvas">
              <FilterControls counts={counts} />
            </div>
          </aside>

          <section aria-labelledby="results-title" className="min-w-0">
            <h1 id="results-title" className="text-title font-bold text-fg">
              {t("resultsTitle", { place, count: properties.length })}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-fg-muted">{t("lead")}</p>

            <div className="mt-4 flex items-center justify-between gap-3 border-b border-line pb-4">
              <FilterSheet counts={counts} resultCount={properties.length} />
              <div className="ms-auto min-w-0">
                <SortSelect />
              </div>
            </div>

            <div className="mt-4">
              <ResultsShell signature={signature} count={properties.length}>
                {properties.length === 0 ? (
                  <EmptyState />
                ) : (
                  <ol className="space-y-4">
                    {properties.map((property, i) => (
                      <li key={property._id}>
                        <PropertyRow property={property} priority={i < 2} />
                      </li>
                    ))}
                  </ol>
                )}
              </ResultsShell>
            </div>
          </section>
        </div>
      </div>
    </FiltersProvider>
  );
}

/** An empty list is an invitation to act, and it names the two filters that
 *  actually move this list rather than apologising. */
async function EmptyState() {
  const t = await getTranslations("listings");

  return (
    <div className="rounded-lg border border-line bg-surface px-6 py-14 text-center">
      <SearchX className="mx-auto size-10 text-fg-subtle" strokeWidth={1.5} aria-hidden="true" />
      <h2 className="mt-4 text-heading font-bold text-fg">{t("emptyTitle")}</h2>
      <p className="mx-auto mt-2 max-w-md text-fg-muted">{t("emptyBody")}</p>
      <Link href="/properties" className="btn btn-outline mt-6">
        {t("emptyAction")}
      </Link>
    </div>
  );
}
