"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";
import { AnimatePresence, motion } from "motion/react";
import { Check, SlidersHorizontal, X } from "lucide-react";

import { filterParsers, SORTS, activeFilterCount, type RawFilters } from "@/lib/filters";
import { areas, propertyTypes, tenures } from "@/content/client-facts";
import { useFilterTransition } from "./FiltersProvider";
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

/* ------------------------------------------------------------------ */

function Group({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-navy-edge py-5">
      <legend className="label float-none mb-3 text-giza-dim">{legend}</legend>
      {children}
    </fieldset>
  );
}

/** A checkbox drawn as a survey tick rather than a browser default. */
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
    <label className="flex min-h-11 cursor-pointer items-center gap-3 py-1 text-sheet transition-colors duration-150 hover:text-survey">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "flex size-4 shrink-0 items-center justify-center border transition-colors duration-150",
          "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-survey",
          checked ? "border-survey bg-survey text-navy" : "border-giza-dim/60",
        )}
      >
        {checked && <Check className="size-3" strokeWidth={3} />}
      </span>
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span className="font-data text-data text-giza-dim tabular-nums">{count}</span>
      )}
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
      <div className="flex flex-wrap gap-px bg-navy-edge" role="group" aria-label={legend}>
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={String(option.value)}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={cn(
                "label min-h-11 flex-1 cursor-pointer px-3 transition-colors duration-150",
                active ? "bg-survey text-navy" : "bg-navy text-giza hover:text-survey",
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

export function FilterControls({ counts }: { counts: Record<string, number> }) {
  const t = useTranslations("search");
  const tl = useTranslations("listings");
  const tp = useTranslations("property");
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
    <div>
      <div className="flex items-center justify-between pb-1">
        <h2 className="label text-sheet">{tl("filters")}</h2>
        {active > 0 && (
          <button
            type="button"
            onClick={() =>
              setFilters({
                q: null, area: null, type: null, tenure: null,
                listingType: null, minPrice: null, maxPrice: null, beds: null,
              })
            }
            className="label cursor-pointer text-survey underline-offset-4 hover:underline"
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

      {/* Tenure has no equivalent on any international template, and it is the
          first thing an Egyptian buyer asks. It gets a top-level facet. */}
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

      <Group legend={t("budget")}>
        <div className="flex items-center gap-3">
          <PriceInput
            label={`${t("budget")} — ${tp("calcPrice")} min`}
            placeholder="0"
            value={filters.minPrice}
            onCommit={(v) => setFilters({ minPrice: v })}
          />
          <span aria-hidden="true" className="text-giza-dim">
            —
          </span>
          <PriceInput
            label={`${t("budget")} — ${tp("calcPrice")} max`}
            placeholder="∞"
            value={filters.maxPrice}
            onCommit={(v) => setFilters({ maxPrice: v })}
          />
        </div>
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
      className="min-h-11 w-full border border-navy-edge bg-navy-lift px-3 font-data text-[1rem] text-sheet tabular-nums outline-none transition-colors duration-150 focus:border-survey"
    />
  );
}

/* ------------------------------------------------------------------ */

export function SortSelect() {
  const tl = useTranslations("listings");
  const [filters, setFilters] = useFilters();

  return (
    <label className="flex items-center gap-2.5">
      <span className="label text-giza-dim">{tl("sort")}</span>
      <select
        value={filters.sort}
        onChange={(e) => setFilters({ sort: e.target.value as (typeof SORTS)[number] })}
        className="label min-h-11 cursor-pointer border border-navy-edge bg-navy px-3 text-sheet outline-none transition-colors duration-150 focus:border-survey"
      >
        <option value="newest">{tl("sortNewest")}</option>
        <option value="price-asc">{tl("sortPriceAsc")}</option>
        <option value="price-desc">{tl("sortPriceDesc")}</option>
        <option value="area-desc">{tl("sortAreaDesc")}</option>
      </select>
    </label>
  );
}

/** Mobile: a button, then a full-height sheet. Filtering on a phone should not
 *  mean scrolling past a rail to reach the results. */
export function FilterSheet({
  counts,
  resultCount,
}: {
  counts: Record<string, number>;
  resultCount: number;
}) {
  const tl = useTranslations("listings");
  const [open, setOpen] = useState(false);
  const [filters] = useFilters();
  const active = activeFilterCount(filters as RawFilters);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="label flex min-h-11 cursor-pointer items-center gap-2.5 border border-navy-edge px-4 text-sheet lg:hidden"
      >
        <SlidersHorizontal className="size-4" strokeWidth={1.75} aria-hidden="true" />
        {tl("filters")}
        {active > 0 && (
          <span className="flex size-5 items-center justify-center bg-survey font-data text-[0.65rem] text-navy tabular-nums">
            {active}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[70] bg-ink/70 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={tl("filters")}
              className="fixed inset-x-0 bottom-0 z-[71] flex max-h-[88dvh] flex-col border-t border-navy-edge bg-navy lg:hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between border-b border-navy-edge px-5 py-3">
                <h2 className="label text-sheet">{tl("filters")}</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="-me-2 flex size-11 cursor-pointer items-center justify-center text-sheet"
                >
                  <span className="sr-only">{tl("clearAll")}</span>
                  <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5">
                <FilterControls counts={counts} />
              </div>

              <div className="border-t border-navy-edge p-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="label min-h-12 w-full cursor-pointer bg-survey-deep px-6 text-sheet transition-colors duration-200 hover:bg-survey hover:text-navy"
                >
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
