import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/ui/DimensionRule";
import { TitleBlock } from "@/components/ui/TitleBlock";
import { Mark } from "@/components/brand/Mark";
import { areas, office, stats, team, brand } from "@/content/client-facts";

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

  return (
    <div className="mx-auto w-full max-w-[92rem] px-4 pb-24 pt-32 sm:px-6 lg:px-10 lg:pb-32 lg:pt-40">
      <Reveal className="text-sheet">
        <SectionHead
          eyebrow={t("title")}
          title={t("intro")}
          body={t("body")}
          className="max-w-3xl"
        />
      </Reveal>

      <Reveal delay={0.1} className="mt-16 grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
        <div>
          <Mark className="h-16 w-auto text-survey" />
          <p className="mt-5 font-display text-[1.1rem] leading-none tracking-[0.34em] text-sheet [font-variation-settings:'wdth'_100,'wght'_500]">
            {brand.latin}
          </p>
          <p lang="ar" dir="rtl" className="mt-3 text-giza">
            {brand.legalName.ar}
          </p>
        </div>

        <div>
          <h2 className="label text-giza-dim">{t("officeLabel")}</h2>
          <p className="mt-3 text-lead text-sheet">{office.address[locale]}</p>

          <h2 className="label mt-10 text-giza-dim">{t("areasLabel")}</h2>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            {areas.map((area) => (
              <li key={area.slug}>
                <Link
                  href={{ pathname: "/properties", query: { area: area.slug } }}
                  className="text-sheet underline-offset-4 transition-colors duration-200 hover:text-survey hover:underline"
                >
                  {area.name[locale]}
                </Link>
              </li>
            ))}
          </ul>

          <TitleBlock
            className="mt-10 text-giza"
            fields={[
              { label: locale === "ar" ? "المناطق" : "Areas", value: "05", numeric: true },
              {
                label: locale === "ar" ? "المحافظة" : "Governorate",
                value: office.city[locale],
              },
              {
                label: locale === "ar" ? "البيع" : "Sale",
                value: locale === "ar" ? "تمليك" : "Freehold",
              },
              {
                label: locale === "ar" ? "الإيجار" : "Rent",
                value: locale === "ar" ? "قانون جديد" : "New-law",
              },
            ]}
          />
        </div>
      </Reveal>

      {/* Numbers and faces render only when they are real. An unverified
          "500+ happy clients" is precisely the tell this project is paid to
          avoid, so the honest empty state ships instead. */}
      <Reveal delay={0.15} className="mt-20 border-t border-navy-edge pt-10">
        <h2 className="label text-giza-dim">{t("teamLabel")}</h2>
        {team.length === 0 ? (
          <p className="measure mt-4 text-giza-dim">{t("teamEmpty")}</p>
        ) : (
          <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <li key={member.name.en}>
                <p className="text-d3 text-sheet">{member.name[locale]}</p>
                <p className="label mt-2 text-giza-dim">{member.role[locale]}</p>
              </li>
            ))}
          </ul>
        )}

        {!stats.verified && (
          <p className="measure mt-8 text-giza-dim">{t("statsEmpty")}</p>
        )}
      </Reveal>
    </div>
  );
}
