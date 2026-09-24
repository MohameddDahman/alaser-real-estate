"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Building2, MapPin, Search, Wallet, type LucideIcon } from "lucide-react";

import { useRouter } from "@/i18n/navigation";
import { areas, propertyTypes } from "@/content/client-facts";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * The home page search: sale or rent, then area, type and budget - the one
 * thing a visitor came to do, sitting where the eye lands first.
 *
 * Budgets change with the tab, because a monthly rent and a purchase price
 * are different numbers: "up to 2.5M" means nothing to someone renting.
 */

type Mode = "all" | "sale" | "rent";

const SALE_BUDGETS = [
  { value: "0-2500000", en: "Up to 2.5M EGP", ar: "حتى ٢٫٥ مليون جنيه" },
  { value: "2500000-5000000", en: "2.5M – 5M EGP", ar: "٢٫٥ – ٥ مليون جنيه" },
  { value: "5000000-10000000", en: "5M – 10M EGP", ar: "٥ – ١٠ مليون جنيه" },
  { value: "10000000-", en: "Over 10M EGP", ar: "أكثر من ١٠ مليون جنيه" },
];

const RENT_BUDGETS = [
  { value: "0-15000", en: "Up to 15,000 EGP / month", ar: "حتى ١٥ ألف جنيه شهريًا" },
  { value: "15000-30000", en: "15,000 – 30,000 EGP / month", ar: "١٥ – ٣٠ ألف جنيه شهريًا" },
  { value: "30000-", en: "Over 30,000 EGP / month", ar: "أكثر من ٣٠ ألف جنيه شهريًا" },
];

export function HomeSearch({ locale, className }: { locale: Locale; className?: string }) {
  const t = useTranslations("search");
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("all");
  const [area, setArea] = useState("");
  const [type, setType] = useState("");
  const [budget, setBudget] = useState("");

  const budgets = mode === "rent" ? RENT_BUDGETS : SALE_BUDGETS;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (mode !== "all") params.set("listingType", mode);
    if (area) params.set("area", area);
    if (type) params.set("type", type);
    if (budget) {
      const [min, max] = budget.split("-");
      if (min && min !== "0") params.set("minPrice", min);
      if (max) params.set("maxPrice", max);
    }
    router.push(`/properties${params.size ? `?${params}` : ""}`);
  }

  const tabs: { value: Mode; label: string }[] = [
    { value: "all", label: t("tabAll") },
    { value: "sale", label: t("tabBuy") },
    { value: "rent", label: t("tabRent") },
  ];

  return (
    <div className={className}>
      <div role="radiogroup" aria-label={t("listingType")} className="on-navy mb-3 flex gap-1.5">
        {tabs.map((tab) => {
          const active = mode === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                setMode(tab.value);
                setBudget("");
              }}
              className={cn(
                "min-h-10 cursor-pointer rounded-full border px-5 text-sm font-semibold transition-colors",
                active
                  ? "border-white bg-white text-navy"
                  : "border-white/40 text-white hover:bg-white/10",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <form
        onSubmit={submit}
        role="search"
        className="grid gap-1 rounded-xl border-4 border-gold bg-gold shadow-pop md:grid-cols-[1fr_1fr_1fr_auto]"
      >
        <Field icon={MapPin} label={t("area")} id="hs-area">
          <select id="hs-area" value={area} onChange={(e) => setArea(e.target.value)} className={selectClass}>
            <option value="">{t("anyArea")}</option>
            {areas.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.name[locale]}
              </option>
            ))}
          </select>
        </Field>

        <Field icon={Building2} label={t("type")} id="hs-type">
          <select id="hs-type" value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
            <option value="">{t("anyType")}</option>
            {propertyTypes.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name[locale]}
              </option>
            ))}
          </select>
        </Field>

        <Field icon={Wallet} label={t("budget")} id="hs-budget">
          <select id="hs-budget" value={budget} onChange={(e) => setBudget(e.target.value)} className={selectClass}>
            <option value="">{t("anyBudget")}</option>
            {budgets.map((b) => (
              <option key={b.value} value={b.value}>
                {locale === "ar" ? b.ar : b.en}
              </option>
            ))}
          </select>
        </Field>

        <button type="submit" className="btn btn-primary min-h-14 rounded-lg px-8 text-base">
          <Search className="size-5" strokeWidth={2.25} aria-hidden="true" />
          {t("submit")}
        </button>
      </form>
    </div>
  );
}

// 16px minimum, or iOS zooms the page on focus.
const selectClass =
  "w-full cursor-pointer appearance-none bg-transparent text-[1rem] font-medium text-fg outline-none";

function Field({
  icon: Icon,
  label,
  id,
  children,
}: {
  icon: LucideIcon;
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-14 items-center gap-3 rounded-lg bg-canvas px-4 py-1.5 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
      <Icon className="size-5 shrink-0 text-fg-subtle" strokeWidth={1.75} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block text-xs text-fg-subtle">
          {label}
        </label>
        {children}
      </div>
    </div>
  );
}
