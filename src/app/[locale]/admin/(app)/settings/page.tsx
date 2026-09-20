import { getTranslations, setRequestLocale } from "next-intl/server";
import { Check, X } from "lucide-react";

import type { Locale } from "@/i18n/routing";
import {
  areas,
  brand,
  contact,
  office,
  OPEN_QUESTIONS,
  propertyTypes,
  stats,
  tenures,
} from "@/content/client-facts";
import { cn } from "@/lib/utils";

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations("admin");

  const rows: Array<{ label: string; value: string; verified: boolean }> = [
    { label: "Brand (Latin)", value: brand.latin, verified: true },
    { label: "Brand (Arabic)", value: brand.arabic, verified: true },
    { label: "Legal name", value: brand.legalName[locale], verified: true },
    { label: "Office", value: office.address[locale], verified: true },
    { label: "Areas", value: areas.map((a) => a.name[locale]).join(" · "), verified: true },
    { label: "Types", value: propertyTypes.map((p) => p.name[locale]).join(" · "), verified: true },
    { label: "Tenure", value: tenures.map((x) => x.name[locale]).join(" · "), verified: true },
    { label: "WhatsApp", value: contact.whatsapp, verified: contact.verified },
    { label: "Phone", value: contact.phone, verified: contact.verified },
    { label: "Years active", value: String(stats.yearsActive ?? "—"), verified: stats.verified },
    { label: "Units sold", value: String(stats.unitsSold ?? "—"), verified: stats.verified },
  ];

  return (
    <div>
      <h1 className="text-d3">{t("settingsTitle")}</h1>
      <p className="measure mt-3 text-ink/65">{t("settingsIntro")}</p>

      <ul className="mt-8 divide-y divide-sheet-edge border-y border-sheet-edge">
        {rows.map((row) => (
          <li key={row.label} className="flex flex-wrap items-baseline gap-x-6 gap-y-1 py-3.5">
            <span className="label w-32 shrink-0 text-ink/50">{row.label}</span>
            <span className={cn("flex-1", !row.verified && "text-ink/40")} dir="auto">
              {row.value}
            </span>
            <span
              className={cn(
                "label inline-flex items-center gap-1.5",
                row.verified ? "text-available" : "text-reserved",
              )}
            >
              {row.verified ? (
                <Check className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
              ) : (
                <X className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
              )}
              {row.verified ? t("confirmed") : t("unconfirmed")}
            </span>
          </li>
        ))}
      </ul>

      <h2 className="label mt-12 text-ink/55">{t("openQuestions")}</h2>
      <ul className="mt-3 divide-y divide-sheet-edge border-y border-sheet-edge">
        {OPEN_QUESTIONS.map((q) => (
          <li key={q.id} className="flex gap-4 py-3.5">
            <span
              className={cn(
                "label mt-0.5 w-28 shrink-0",
                q.blocking ? "text-danger" : "text-ink/45",
              )}
            >
              {q.blocking ? t("blocking") : t("nonBlocking")}
            </span>
            <span className="text-[0.92rem] text-ink/80">{q.q}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
