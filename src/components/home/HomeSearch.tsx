"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Building2, MapPin, Search, Wallet } from "lucide-react";

import { useRouter } from "@/i18n/navigation";
import { Select } from "@/components/ui/Select";
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

// Figures in Latin digits, the way every price on the site is written.
const SALE_BUDGETS = [
  { value: "0-2500000", en: "Up to 2.5M EGP", ar: "حتى 2.5 مليون جنيه" },
  { value: "2500000-5000000", en: "2.5M – 5M EGP", ar: "2.5 – 5 مليون جنيه" },
  { value: "5000000-10000000", en: "5M – 10M EGP", ar: "5 – 10 مليون جنيه" },
  { value: "10000000-", en: "Over 10M EGP", ar: "أكثر من 10 مليون جنيه" },
];

const RENT_BUDGETS = [
  { value: "0-15000", en: "Up to 15,000 EGP / month", ar: "حتى 15,000 جنيه شهريًا" },
  { value: "15000-30000", en: "15,000 – 30,000 EGP / month", ar: "15,000 – 30,000 جنيه شهريًا" },
  { value: "30000-", en: "Over 30,000 EGP / month", ar: "أكثر من 30,000 جنيه شهريًا" },
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
        <Select
          icon={MapPin}
          label={t("area")}
          value={area}
          onChange={setArea}
          options={[
            { value: "", label: t("anyArea") },
            ...areas.map((a) => ({ value: a.slug, label: a.name[locale] })),
          ]}
        />

        <Select
          icon={Building2}
          label={t("type")}
          value={type}
          onChange={setType}
          options={[
            { value: "", label: t("anyType") },
            ...propertyTypes.map((p) => ({ value: p.slug, label: p.name[locale] })),
          ]}
        />

        <Select
          icon={Wallet}
          label={t("budget")}
          value={budget}
          onChange={setBudget}
          options={[
            { value: "", label: t("anyBudget") },
            ...budgets.map((b) => ({ value: b.value, label: locale === "ar" ? b.ar : b.en })),
          ]}
        />

        <button type="submit" className="btn btn-primary min-h-14 rounded-lg px-8 text-base">
          <Search className="size-5" strokeWidth={2.25} aria-hidden="true" />
          {t("submit")}
        </button>
      </form>
    </div>
  );
}
