import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Building2, KeyRound, MapPin, Users } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { PageIntro } from "@/components/ui/PageIntro";
import { Mark } from "@/components/brand/Mark";
import { areas, brand, office, stats, team, tenures } from "@/content/client-facts";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function AboutPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations("about");
  const tn = await getTranslations("nav");
  const ts = await getTranslations("search");

  return (
    <>
      <PageIntro
        rtl={locale === "ar"}
        crumbs={[{ label: tn("home"), href: "/" }, { label: t("title") }]}
        title={t("intro")}
      />

      <div className="shell grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14 lg:py-14">
        <div className="min-w-0">
          <p className="max-w-3xl text-lg leading-relaxed text-fg">{t("body")}</p>

          <h2 className="mt-10 text-heading font-bold text-fg">{t("areasLabel")}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {areas.map((area) => (
              <li key={area.slug}>
                <Link
                  href={{ pathname: "/properties", query: { area: area.slug } }}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line-strong px-4 text-sm font-medium text-fg transition-colors hover:border-primary hover:text-primary"
                >
                  <MapPin className="size-4 text-fg-subtle" strokeWidth={1.75} aria-hidden="true" />
                  {area.name[locale]}
                </Link>
              </li>
            ))}
          </ul>

          <h2 className="mt-10 text-heading font-bold text-fg">{ts("tenure")}</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {tenures.map((tenure) => (
              <li key={tenure.slug} className="rounded-lg border border-line p-5">
                <p className="flex items-center gap-2 font-semibold text-fg">
                  <KeyRound className="size-4 text-primary" strokeWidth={1.75} aria-hidden="true" />
                  {tenure.name[locale]}
                </p>
                <p className="mt-1.5 text-sm text-fg-muted">{tenure.note[locale]}</p>
              </li>
            ))}
          </ul>

          {/* Numbers and faces render only when they are real. An unverified
              "500+ happy clients" is precisely the tell to avoid, so the
              honest empty state ships instead. */}
          <h2 className="mt-10 text-heading font-bold text-fg">{t("teamLabel")}</h2>
          {team.length === 0 ? (
            <p className="mt-3 flex items-center gap-2.5 text-fg-muted">
              <Users className="size-5 text-fg-subtle" strokeWidth={1.75} aria-hidden="true" />
              {t("teamEmpty")}
            </p>
          ) : (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((member) => (
                <li key={member.name.en} className="rounded-lg border border-line p-5">
                  <p className="font-semibold text-fg">{member.name[locale]}</p>
                  <p className="text-sm text-fg-muted">{member.role[locale]}</p>
                </li>
              ))}
            </ul>
          )}
          {!stats.verified && <p className="mt-3 text-sm text-fg-subtle">{t("statsEmpty")}</p>}
        </div>

        <aside className="lg:pt-1">
          <div className="rounded-lg border border-line bg-canvas p-6 shadow-card">
            <div className="flex items-center gap-3 text-navy">
              <Mark className="h-9 w-auto" />
              <span className="leading-none">
                <span className="block font-display text-[1rem] tracking-[0.26em] [font-variation-settings:'wdth'_100,'wght'_600]">
                  {brand.latin}
                </span>
                <span lang="ar" className="mt-1.5 block text-sm text-fg-muted">
                  {brand.legalName.ar}
                </span>
              </span>
            </div>

            <ul className="mt-6 space-y-4 text-sm">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
                <p>
                  <span className="block text-xs text-fg-subtle">{t("officeLabel")}</span>
                  <span className="font-medium text-fg">{office.address[locale]}</span>
                </p>
              </li>
              <li className="flex gap-3">
                <Building2 className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
                <p>
                  <span className="block text-xs text-fg-subtle">{t("areasLabel")}</span>
                  <span className="font-medium text-fg">
                    {areas.map((a) => a.name[locale]).join(locale === "ar" ? "، " : ", ")}
                  </span>
                </p>
              </li>
            </ul>

            <Link href="/contact" className="btn btn-primary mt-6 w-full">
              {tn("contact")}
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
