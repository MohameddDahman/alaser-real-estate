import { getTranslations, setRequestLocale } from "next-intl/server";
import { Check, ExternalLink, LogOut, X } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { signOut } from "@/app/actions/admin";
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
import { Card, PageHeader } from "@/components/admin/ui";
import { LocaleSwitch } from "@/components/layout/LocaleSwitch";

/**
 * Settings: the account on a phone (language, the site, signing out - the
 * header has no room for them there), then the business details the site
 * is built from, and what is still needed from the client.
 */
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
    { label: t("factBrand"), value: `${brand.latin} · ${brand.arabic}`, verified: true },
    { label: t("factLegalName"), value: brand.legalName[locale], verified: true },
    { label: t("factOffice"), value: office.address[locale], verified: true },
    { label: t("factAreas"), value: areas.map((a) => a.name[locale]).join(" · "), verified: true },
    { label: t("factTypes"), value: propertyTypes.map((p) => p.name[locale]).join(" · "), verified: true },
    { label: t("factTenure"), value: tenures.map((x) => x.name[locale]).join(" · "), verified: true },
    { label: t("factWhatsapp"), value: contact.whatsapp, verified: contact.verified },
    { label: t("factPhone"), value: contact.phone, verified: contact.verified },
    { label: t("factYears"), value: String(stats.yearsActive ?? "—"), verified: stats.verified },
    { label: t("factSold"), value: String(stats.unitsSold ?? "—"), verified: stats.verified },
  ];

  const rowClass = "flex min-h-14 w-full items-center justify-between gap-3 px-4 text-[0.9375rem] font-medium text-fg transition-colors hover:bg-surface";

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader title={t("settingsTitle")} />

      <section className="overflow-hidden rounded-xl border border-line bg-canvas shadow-card">
        <h2 className="px-4 pb-3 pt-4 text-[1.0625rem] font-semibold text-fg sm:px-5 sm:pt-5">{t("account")}</h2>
        <ul className="divide-y divide-line border-t border-line">
          <li className="flex min-h-14 items-center justify-between gap-3 px-4 sm:px-5">
            <span className="text-[0.9375rem] font-medium text-fg">{t("language")}</span>
            <LocaleSwitch withIcon className="btn btn-quiet btn-sm" />
          </li>
          <li>
            <Link href="/" className={cn(rowClass, "sm:px-5")}>
              {t("viewSite")}
              <ExternalLink className="size-4 text-fg-muted" strokeWidth={2} aria-hidden="true" />
            </Link>
          </li>
          <li>
            <form action={signOut}>
              <input type="hidden" name="locale" value={locale} />
              <button type="submit" className={cn(rowClass, "cursor-pointer text-danger sm:px-5")}>
                {t("signOut")}
                <LogOut className="size-4 rtl:-scale-x-100" strokeWidth={2} aria-hidden="true" />
              </button>
            </form>
          </li>
        </ul>
      </section>

      <Card title={t("businessDetails")} description={t("settingsIntro")}>
        <dl className="-my-3 divide-y divide-line">
          {rows.map((row) => (
            <div key={row.label} className="grid gap-1 py-3 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-baseline sm:gap-4">
              <dt className="text-sm text-fg-muted">{row.label}</dt>
              <dd className={cn("text-[0.9375rem]", row.verified ? "text-fg" : "text-fg-subtle")} dir="auto">
                {row.value}
              </dd>
              <dd
                className={cn(
                  "inline-flex items-center gap-1.5 text-sm font-medium",
                  row.verified ? "text-success" : "text-warning",
                )}
              >
                {row.verified ? (
                  <Check className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
                ) : (
                  <X className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
                )}
                {row.verified ? t("confirmed") : t("unconfirmed")}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card title={t("openQuestions")}>
        <ul className="-my-3 divide-y divide-line">
          {OPEN_QUESTIONS.map((q) => (
            <li key={q.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-4">
              <span
                className={cn(
                  "w-32 shrink-0 text-sm font-medium",
                  q.blocking ? "text-danger" : "text-fg-subtle",
                )}
              >
                {q.blocking ? t("blocking") : t("nonBlocking")}
              </span>
              <span className="text-[0.9375rem] text-fg">{q.q}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
