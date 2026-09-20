"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";

import { useRouter } from "@/i18n/navigation";
import { areas, propertyTypes } from "@/content/client-facts";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Three fields and a button, within a thumb's reach of the fold on mobile.
 * This is the one thing a buyer actually wants on arrival, so it sits directly
 * under the hero and nothing decorative is allowed above it.
 */

const BUDGETS = [
  { value: "", labelEn: "Any budget", labelAr: "أي ميزانية" },
  { value: "0-2500000", labelEn: "Up to 2.5M", labelAr: "حتى ٢.٥ مليون" },
  { value: "2500000-5000000", labelEn: "2.5M – 5M", labelAr: "٢.٥ – ٥ مليون" },
  { value: "5000000-10000000", labelEn: "5M – 10M", labelAr: "٥ – ١٠ مليون" },
  { value: "10000000-", labelEn: "Over 10M", labelAr: "أكثر من ١٠ مليون" },
];

export function QuickSearch({ locale }: { locale: Locale }) {
  const t = useTranslations("search");
  const router = useRouter();
  const [area, setArea] = useState("");
  const [type, setType] = useState("");
  const [budget, setBudget] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (area) params.set("area", area);
    if (type) params.set("type", type);
    if (budget) {
      const [min, max] = budget.split("-");
      if (min) params.set("minPrice", min);
      if (max) params.set("maxPrice", max);
    }
    router.push(`/properties${params.size ? `?${params}` : ""}`);
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-px border border-navy-edge bg-navy-edge sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]"
    >
      <Field label={t("area")} id="qs-area">
        <select
          id="qs-area"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className={selectClass}
        >
          <option value="">{t("anyArea")}</option>
          {areas.map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.name[locale]}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t("type")} id="qs-type">
        <select
          id="qs-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={selectClass}
        >
          <option value="">{t("anyType")}</option>
          {propertyTypes.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name[locale]}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t("budget")} id="qs-budget">
        <select
          id="qs-budget"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className={selectClass}
        >
          {BUDGETS.map((b) => (
            <option key={b.value} value={b.value}>
              {locale === "ar" ? b.labelAr : b.labelEn}
            </option>
          ))}
        </select>
      </Field>

      <button
        type="submit"
        className="label flex min-h-[4.5rem] cursor-pointer items-center justify-center gap-2.5 bg-survey-deep px-8 text-sheet transition-colors duration-200 hover:bg-survey hover:text-navy"
      >
        <Search className="size-4" strokeWidth={2} aria-hidden="true" />
        {t("submit")}
      </button>
    </form>
  );
}

const selectClass = cn(
  "w-full cursor-pointer appearance-none bg-transparent pt-1 text-sheet outline-none",
  "text-[1rem]", // 16px minimum, or iOS zooms the page on focus
);

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-navy px-5 py-3.5">
      <label htmlFor={id} className="label block text-giza-dim">
        {label}
      </label>
      {children}
    </div>
  );
}
