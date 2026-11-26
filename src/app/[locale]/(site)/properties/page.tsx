import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SearchX } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { PropertyRow } from "@/components/property/PropertyCard";
import { FiltersProvider } from "@/components/property/FiltersProvider";
import { FilterControls, KeywordSearch, SortSelect } from "@/components/property/Filters";
import { FilterSync } from "@/components/property/filter-state";
import {
  ListingsProvider,
  LiveFilterSheet,
  ResultsList,
  ResultsTitle,
  type ListingItem,
} from "@/components/property/Listings";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { getAreaCounts, getPublicProperties } from "@/lib/data";
import { factsOf, queryProperties } from "@/lib/data/query";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "listings" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

/**
 * Built once per language with every public unit, and filtered in the browser.
 *
 * It used to read the query string and filter on the server, which made it the
 * one page on the site rendered fresh for every visit and every filter click.
 * The admin's saves purge it from the root layout like every other page (see
 * refreshSite in app/actions/admin.ts), so a new unit still appears at once.
 */
export default async function PropertiesPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations("listings");
  const tn = await getTranslations("nav");

  // Unsorted, in the store's own order: the browser sorts from the same input
  // the server always did, so units that tie on price or area keep their order.
  const [properties, counts] = await Promise.all([getPublicProperties(), getAreaCounts()]);

  // The two units the page opens with get their photos loaded first.
  const opening = new Set(
    queryProperties(properties)
      .slice(0, 2)
      .map((property) => property._id),
  );

  const items: ListingItem[] = properties.map((property) => ({
    facts: factsOf(property),
    row: <PropertyRow property={property} priority={opening.has(property._id)} />,
  }));

  return (
    <FiltersProvider>
      {/* The only reader of the query string; renders nothing. */}
      <Suspense fallback={null}>
        <FilterSync />
      </Suspense>

      <ListingsProvider items={items}>
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
                <ResultsTitle />
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-fg-muted">{t("lead")}</p>

              <div className="mt-4 flex items-center justify-between gap-3 border-b border-line pb-4">
                <LiveFilterSheet counts={counts} />
                <div className="ms-auto min-w-0">
                  <SortSelect />
                </div>
              </div>

              <div className="mt-4">
                <ResultsList empty={<EmptyState />} />
              </div>
            </section>
          </div>
        </div>
      </ListingsProvider>
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
