"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpDown, Check, Search, SlidersHorizontal, X } from "lucide-react";

import { filterParsers, SORTS, activeFilterCount, type RawFilters } from "@/lib/filters";
import { areas, propertyTypes, tenures } from "@/content/client-facts";
import { useFilterTransition } from "./FiltersProvider";
import { Select } from "@/components/ui/Select";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

function useFilters() {
  const { start } = useFilterTransition();
  return useQueryStates(filterParsers, {
    shallow: false,
    history: "push",
    startTransition: start,
    clearOnDefault: true,
  });
}

const CLEARED = {
  q: null,
  area: null,
  type: null,
  tenure: null,
  listingType: null,
  minPrice: null,
  maxPrice: null,
  beds: null,
} as const;

/* ------------------------------------------------------------------ */

function Group({ legend, children }: { legend: string; children: React.ReactNode }) {
  // The rule sits on a wrapper: on the fieldset itself the legend would be
  // drawn cutting through it.
  return (
    <div className="border-t border-line px-4 py-4">
      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-semibold text-fg">{legend}</legend>
        {children}
      </fieldset>
    </div>
  );
}

function Tick({
  checked,
  onChange,
  label,
  count,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  count?: number;
}) {
  return (
    <label className="group/tick flex min-h-10 cursor-pointer items-center gap-3 text-sm text-fg">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        aria-hidden="true"
        className={cn(
          "flex size-[1.125rem] shrink-0 items-center justify-center rounded-[4px] border transition-colors",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary",
          checked
            ? "border-primary bg-primary text-white"
            : "border-line-strong bg-canvas group-hover/tick:border-primary",
        )}
      >
        {checked && <Check className="size-3.5" strokeWidth={3} />}
      </span>
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="text-fg-subtle tabular-nums">{count}</span>}
    </label>
  );
}

function Segmented({
  options,
  value,
  onChange,
  legend,
}: {
  options: { value: string | null; label: string }[];
  value: string | null;
  onChange: (v: string | null) => void;
  legend: string;
}) {
  return (
    <Group legend={legend}>
      <div className="flex flex-wrap gap-2" role="group" aria-label={legend}>
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={String(option.value)}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={cn(
                "min-h-9 cursor-pointer rounded-full border px-3.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-line-strong bg-canvas text-fg hover:border-primary",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </Group>
  );
}

/* ------------------------------------------------------------------ */

export function FilterControls({
  counts,
  showHeader = true,
}: {
  counts: Record<string, number>;
  /** The phone sheet has its own title bar. */
  showHeader?: boolean;
}) {
  const t = useTranslations("search");
  const tl = useTranslations("listings");
  const locale = (useParams().locale as Locale) ?? "en";
  const [filters, setFilters] = useFilters();

  const toggle = (key: "area" | "type" | "tenure", value: string) => {
    const current = filters[key] as string[];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFilters({ [key]: next.length ? next : null } as never);
  };

  const active = activeFilterCount(filters as RawFilters);

  return (
    // In the sheet, the first rule tucks under the title bar's own.
    <div className={cn(!showHeader && "-mt-px")}>
      <div className={cn("flex min-h-12 items-center justify-between gap-3 px-4 py-2", !showHeader && active === 0 && "hidden")}>
        {showHeader && <h2 className="text-base font-bold text-fg">{tl("filterBy")}</h2>}
        {active > 0 && (
          <button
            type="button"
            onClick={() => setFilters(CLEARED)}
            className="cursor-pointer text-sm font-medium text-primary hover:underline"
          >
            {tl("clearAll")}
          </button>
        )}
      </div>

      <Segmented
        legend={t("listingType")}
        value={filters.listingType}
        onChange={(v) => setFilters({ listingType: v as "sale" | "rent" | null })}
        options={[
          { value: null, label: t("any") },
          { value: "sale", label: t("forSale") },
          { value: "rent", label: t("forRent") },
        ]}
      />

      <Group legend={t("budget")}>
        <div className="flex items-center gap-2">
          <PriceInput
            label={t("minPrice")}
            placeholder={t("min")}
            value={filters.minPrice}
            onCommit={(v) => setFilters({ minPrice: v })}
          />
          <span aria-hidden="true" className="text-fg-subtle">
            –
          </span>
          <PriceInput
            label={t("maxPrice")}
            placeholder={t("max")}
            value={filters.maxPrice}
            onCommit={(v) => setFilters({ maxPrice: v })}
          />
        </div>
      </Group>

      <Group legend={t("area")}>
        {areas.map((area) => (
          <Tick
            key={area.slug}
            label={area.name[locale]}
            count={counts[area.slug]}
            checked={(filters.area as string[]).includes(area.slug)}
            onChange={() => toggle("area", area.slug)}
          />
        ))}
      </Group>

      <Group legend={t("type")}>
        {propertyTypes.map((type) => (
          <Tick
            key={type.slug}
            label={type.name[locale]}
            checked={(filters.type as string[]).includes(type.slug)}
            onChange={() => toggle("type", type.slug)}
          />
        ))}
      </Group>

      <Segmented
        legend={t("beds")}
        value={filters.beds ? String(filters.beds) : null}
        onChange={(v) => setFilters({ beds: v ? Number(v) : null })}
        options={[
          { value: null, label: t("anyBeds") },
          { value: "1", label: "1+" },
          { value: "2", label: "2+" },
          { value: "3", label: "3+" },
          { value: "4", label: "4+" },
        ]}
      />

      {/* Tenure is the first thing an Egyptian buyer asks, and no
          international template has a field for it. */}
      <Group legend={t("tenure")}>
        {tenures.map((tenure) => (
          <Tick
            key={tenure.slug}
            label={tenure.name[locale]}
            checked={(filters.tenure as string[]).includes(tenure.slug)}
            onChange={() => toggle("tenure", tenure.slug)}
          />
        ))}
      </Group>
    </div>
  );
}

/** Commits on blur, not on keystroke - typing "2500000" must not fire six
 *  server queries on the way. */
function PriceInput({
  label,
  placeholder,
  value,
  onCommit,
}: {
  label: string;
  placeholder: string;
  value: number | null;
  onCommit: (v: number | null) => void;
}) {
  const [draft, setDraft] = useState(value?.toString() ?? "");
  useEffect(() => setDraft(value?.toString() ?? ""), [value]);

  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={label}
      placeholder={placeholder}
      value={draft}
      dir="ltr"
      onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
      onBlur={() => onCommit(draft ? Number(draft) : null)}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      className="field min-h-10 px-3 py-2 tabular-nums"
    />
  );
}

/* ------------------------------------------------------------------ */

/** Free text over reference code, street, area and type. */
export function KeywordSearch() {
  const t = useTranslations("search");
  const [filters, setFilters] = useFilters();
  const [draft, setDraft] = useState(filters.q);
  useEffect(() => setDraft(filters.q), [filters.q]);

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        setFilters({ q: draft.trim() || null });
      }}
      className="flex gap-1 rounded-lg border-4 border-gold bg-gold"
    >
      <label className="relative flex-1">
        <span className="sr-only">{t("keyword")}</span>
        <Search
          className="pointer-events-none absolute start-3.5 top-1/2 size-5 -translate-y-1/2 text-fg-subtle"
          strokeWidth={2}
          aria-hidden="true"
        />
        <input
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("keywordPlaceholder")}
          autoComplete="off"
          className="h-12 w-full rounded-md bg-canvas ps-11 pe-3 text-base text-fg outline-none placeholder:text-fg-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
        />
      </label>
      <button type="submit" className="btn btn-primary h-12 rounded-md px-6">
        {t("submit")}
      </button>
    </form>
  );
}

export function SortSelect() {
  const tl = useTranslations("listings");
  const [filters, setFilters] = useFilters();

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span aria-hidden="true" className="hidden shrink-0 text-sm text-fg-muted sm:inline">
        {tl("sort")}
      </span>
      <Select
        variant="pill"
        icon={ArrowUpDown}
        label={tl("sort")}
        value={filters.sort}
        onChange={(value) => setFilters({ sort: value as (typeof SORTS)[number] })}
        options={[
          { value: "newest", label: tl("sortNewest") },
          { value: "price-asc", label: tl("sortPriceAsc") },
          { value: "price-desc", label: tl("sortPriceDesc") },
          { value: "area-desc", label: tl("sortAreaDesc") },
        ]}
        className="min-w-0 max-w-[15rem]"
      />
    </div>
  );
}

/** Mobile: a button, then a sheet from the bottom. Filtering on a phone
 *  should not mean scrolling past a rail to reach the results. */
export function FilterSheet({
  counts,
  resultCount,
}: {
  counts: Record<string, number>;
  resultCount: number;
}) {
  const tl = useTranslations("listings");
  const tn = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const [filters] = useFilters();
  const active = activeFilterCount(filters as RawFilters);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-line-strong bg-canvas px-4 text-sm font-medium text-fg transition-colors hover:border-primary lg:hidden"
      >
        <SlidersHorizontal className="size-4" strokeWidth={2} aria-hidden="true" />
        {tl("filters")}
        {active > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[0.6875rem] font-bold text-white tabular-nums">
            {active}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[70] bg-ink/50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={tl("filters")}
              className="fixed inset-x-0 bottom-0 z-[71] flex max-h-[88dvh] flex-col rounded-t-2xl bg-canvas shadow-pop lg:hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between border-b border-line px-4 py-2">
                <h2 className="text-base font-bold">{tl("filters")}</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="-me-2 flex size-11 cursor-pointer items-center justify-center rounded-full text-fg hover:bg-surface"
                >
                  <span className="sr-only">{tn("close")}</span>
                  <X className="size-5" strokeWidth={2} aria-hidden="true" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <FilterControls counts={counts} showHeader={false} />
              </div>

              <div className="border-t border-line p-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
                <button type="button" onClick={() => setOpen(false)} className="btn btn-primary btn-lg w-full">
                  {tl("applyFilters", { count: resultCount })}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
