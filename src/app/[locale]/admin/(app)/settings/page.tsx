import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChevronRight, ExternalLink, Lock, LogOut, Trash2 } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { signOut } from "@/app/actions/admin";
import { areas, brand, OPEN_QUESTIONS, propertyTypes, tenures } from "@/content/client-facts";
import { getBusinessDetails } from "@/lib/data/site-settings";
import { cn } from "@/lib/utils";
import { BusinessDetailsForm } from "@/components/admin/BusinessDetailsForm";
import { Card, PageHeader } from "@/components/admin/ui";
import { LocaleSwitch } from "@/components/layout/LocaleSwitch";

/**
 * Settings: the account on a phone (language, the site, Deleted items,
 * signing out - the header has no room for them there), the business
 * details the client edits, what is fixed and why, and what is still needed
 * from the client.
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
  const details = await getBusinessDetails();

  // The site's structure: each is pages, filters and photographs, not a setting.
  const fixed: Array<{ label: string; value: string }> = [
    { label: t("factBrand"), value: `${brand.latin} · ${brand.arabic}` },
    { label: t("factLegalName"), value: brand.legalName[locale] },
    { label: t("factAreas"), value: areas.map((a) => a.name[locale]).join(" · ") },
    { label: t("factTypes"), value: propertyTypes.map((p) => p.name[locale]).join(" · ") },
    { label: t("factTenure"), value: tenures.map((x) => x.name[locale]).join(" · ") },
  ];

  const rowClass = "flex min-h-14 w-full items-center justify-between gap-3 px-4 text-[0.9375rem] font-medium text-fg transition-colors hover:bg-surface sm:px-5";

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
            <Link href="/admin/deleted" className={rowClass}>
              <span className="inline-flex items-center gap-2.5">
                <Trash2 className="size-4 text-fg-muted" strokeWidth={2} aria-hidden="true" />
                {t("navDeleted")}
              </span>
              <ChevronRight className="size-4 text-fg-muted rtl:-scale-x-100" strokeWidth={2} aria-hidden="true" />
            </Link>
          </li>
          <li>
            <Link href="/" className={rowClass}>
              {t("viewSite")}
              <ExternalLink className="size-4 text-fg-muted" strokeWidth={2} aria-hidden="true" />
            </Link>
          </li>
          <li>
            <form action={signOut}>
              <input type="hidden" name="locale" value={locale} />
              <button type="submit" className={cn(rowClass, "cursor-pointer text-danger")}>
                {t("signOut")}
                <LogOut className="size-4 rtl:-scale-x-100" strokeWidth={2} aria-hidden="true" />
              </button>
            </form>
          </li>
        </ul>
      </section>

      <Card id="details" title={t("businessDetails")} description={t("businessDetailsIntro")}>
        <BusinessDetailsForm details={details} />
      </Card>

      <Card title={t("fixedTitle")} description={t("fixedIntro")}>
        <dl className="-my-3 divide-y divide-line">
          {fixed.map((row) => (
            <div key={row.label} className="grid gap-1 py-3 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-baseline sm:gap-4">
              <dt className="text-sm text-fg-muted">{row.label}</dt>
              <dd className="text-[0.9375rem] text-fg" dir="auto">
                {row.value}
              </dd>
              <dd className="hidden sm:block">
                <Lock className="size-3.5 text-fg-subtle" strokeWidth={2} aria-hidden="true" />
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
