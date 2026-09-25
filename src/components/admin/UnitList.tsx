"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { parseAsString, useQueryState } from "nuqs";
import { AlertTriangle, ImageOff, Pencil, Plus } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { areas, propertyTypes } from "@/content/client-facts";
import type { UnitRow } from "@/lib/data/admin-rows";
import type { PropertyStatus } from "@/lib/data/types";
import type { SiteRequirement } from "@/lib/data/validation";
import { matchesSearch } from "@/lib/search-text";
import { formatPrice } from "@/lib/utils";
import { EmptyState, PageHeader } from "./ui";
import { FilterChips, SearchBox } from "./FilterBar";
import { UNIT_STATUS_ORDER, UNIT_TONE } from "./status";
import { UnitStatusControl } from "./UnitStatusControl";
import { UnitThumb } from "./UnitThumb";

type Filter = "all" | PropertyStatus;

/**
 * Every unit, found in a keystroke: search by code, title or area, filter by
 * status, and change a status without opening anything. "All" leaves the
 * archive out - that is what the Archived filter is for.
 *
 * The search and filter live in the address, so the dashboard's counts can
 * link straight to "Reserved" and the back button returns to the same list.
 */
export function UnitList({ units }: { units: UnitRow[] }) {
  const t = useTranslations("admin");
  const ts = useTranslations("property.status");
  const locale = useLocale() as Locale;

  const [param, setFilterParam] = useQueryState("status", parseAsString.withDefault("all"));
  const filter: Filter = UNIT_STATUS_ORDER.includes(param as PropertyStatus) ? (param as PropertyStatus) : "all";
  const [query, setQuery] = useQueryState("q", parseAsString.withDefault(""));
  // A unit whose status was just changed stays in view until the filter
  // changes, so it does not vanish from under the thumb that changed it.
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [blocked, setBlocked] = useState<{ unit: UnitRow; missing: SiteRequirement[] } | null>(null);

  const setFilter = (value: Filter) => {
    setTouched(new Set());
    void setFilterParam(value === "all" ? null : value);
  };

  const counts = useMemo(() => {
    const byStatus = Object.fromEntries(UNIT_STATUS_ORDER.map((s) => [s, 0])) as Record<PropertyStatus, number>;
    for (const unit of units) byStatus[unit.status]++;
    return byStatus;
  }, [units]);

  const shown = units.filter((unit) => {
    const inFilter =
      touched.has(unit.id) ||
      (filter === "all" ? unit.status !== "archived" : unit.status === filter);
    if (!inFilter) return false;
    const area = areas.find((a) => a.slug === unit.area);
    const type = propertyTypes.find((p) => p.slug === unit.propertyType);
    return matchesSearch(
      [unit.refCode, unit.title.en, unit.title.ar, area?.name.en, area?.name.ar, type?.name.en, type?.name.ar].join(" "),
      query,
    );
  });

  return (
    <div>
      <PageHeader
        title={t("propertiesTitle")}
        subtitle={t("unitsCount", { count: units.length })}
        action={
          <Link href="/admin/properties/new" className="btn btn-primary hidden sm:inline-flex">
            <Plus className="size-4" strokeWidth={2.25} aria-hidden="true" />
            {t("newProperty")}
          </Link>
        }
      />

      <div className="mt-4 space-y-3">
        <SearchBox value={query} onChange={(value) => void setQuery(value || null)} placeholder={t("searchUnits")} />
        <FilterChips<Filter>
          label={t("filterByStatus")}
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: t("filterAll"), count: units.length - counts.archived },
            ...UNIT_STATUS_ORDER.map((status) => ({
              value: status,
              label: ts(status),
              count: counts[status],
              tone: UNIT_TONE[status],
            })),
          ]}
        />
      </div>

      {blocked && (
        <div role="alert" className="mt-4 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning-soft p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" strokeWidth={2} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-fg">
              {t("statusBlocked", { ref: blocked.unit.refCode })}
            </p>
            <p className="mt-1 text-fg-muted">
              {t("stillMissing", { fields: blocked.missing.map((m) => t(`req.${m}`)).join(t("listJoin")) })}
            </p>
            <Link href={`/admin/properties/${blocked.unit.id}`} className="link mt-2 inline-block font-semibold">
              {t("finishUnit")}
            </Link>
          </div>
          <button type="button" onClick={() => setBlocked(null)} className="btn btn-sm btn-quiet shrink-0">
            {t("dismiss")}
          </button>
        </div>
      )}

      {shown.length === 0 ? (
        <EmptyState className="mt-4">{query ? t("noUnitsMatch") : t("noUnitsHere")}</EmptyState>
      ) : (
        <ul className="mt-4 grid gap-3 xl:grid-cols-2">
          {shown.map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              locale={locale}
              onChanged={() => setTouched((ids) => new Set(ids).add(unit.id))}
              onBlocked={(missing) => setBlocked({ unit, missing })}
            />
          ))}
        </ul>
      )}

      {/* On a phone the add button stays under the thumb however far down
          the list is. */}
      <Link
        href="/admin/properties/new"
        className="fixed end-4 z-20 flex size-14 items-center justify-center rounded-full bg-primary text-white shadow-pop transition-colors hover:bg-primary-hover sm:hidden"
        style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
      >
        <span className="sr-only">{t("newProperty")}</span>
        <Plus className="size-6" strokeWidth={2.25} aria-hidden="true" />
      </Link>
    </div>
  );
}

function UnitCard({
  unit,
  locale,
  onChanged,
  onBlocked,
}: {
  unit: UnitRow;
  locale: Locale;
  onChanged: () => void;
  onBlocked: (missing: SiteRequirement[]) => void;
}) {
  const t = useTranslations("admin");
  const tp = useTranslations("property");
  const area = areas.find((a) => a.slug === unit.area);
  const type = propertyTypes.find((p) => p.slug === unit.propertyType);
  const href = `/admin/properties/${unit.id}`;
  const title = unit.title[locale] || unit.title.en || unit.title.ar || t("untitled");

  const price = unit.price.onRequest
    ? t("priceOnRequestShort")
    : unit.price.amount
      ? formatPrice(unit.price.amount, locale, unit.price.currency) +
        (unit.listingType === "rent" ? ` ${unit.price.period === "year" ? tp("perYear") : tp("perMonth")}` : "")
      : "—";

  return (
    <li className="flex flex-col rounded-xl border border-line bg-canvas shadow-card">
      <div className="flex gap-3 p-3">
        <Link href={href} tabIndex={-1} aria-hidden="true" className="shrink-0">
          <UnitThumb src={unit.cover} className="h-20 w-24 sm:h-24 sm:w-32" sizes="8rem" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={href} className="line-clamp-2 font-semibold leading-snug text-fg hover:text-primary">
            {title}
          </Link>
          <p className="mt-0.5 truncate text-sm text-fg-muted">
            <span dir="ltr" className="tabular-nums">
              {unit.refCode}
            </span>
            {area && ` · ${area.name[locale]}`}
            {type && ` · ${type.name[locale]}`}
          </p>
          <p className="mt-1 font-semibold text-fg tabular-nums">{price}</p>
          {unit.standIn && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-warning" title={t("standInHint")}>
              <ImageOff className="size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
              {t("standInShort")}
            </p>
          )}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line px-3 py-2.5">
        <UnitStatusControl id={unit.id} status={unit.status} onChanged={onChanged} onBlocked={onBlocked} />
        <Link href={href} className="btn btn-sm btn-quiet shrink-0">
          <Pencil className="size-3.5" strokeWidth={2} aria-hidden="true" />
          {t("edit")}
        </Link>
      </div>
    </li>
  );
}
