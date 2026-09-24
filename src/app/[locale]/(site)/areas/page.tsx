import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, ArrowRight, Grid3x3 } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { PageIntro } from "@/components/ui/PageIntro";
import { Photo } from "@/components/ui/Photo";
import { areas } from "@/content/client-facts";
import { AREA_PHOTOS, photo } from "@/content/photos";
import { getAreaCounts } from "@/lib/data";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "areasPage" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function AreasPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations("areasPage");
  const tn = await getTranslations("nav");
  const th = await getTranslations("home");
  const counts = await getAreaCounts();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <>
      <PageIntro
        rtl={locale === "ar"}
        crumbs={[{ label: tn("home"), href: "/" }, { label: t("title") }]}
        title={t("metaTitle")}
        lead={t("intro")}
      />

      <div className="shell py-10 lg:py-14">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area, i) => (
            <li key={area.slug} className="flex">
              <article className="group relative flex w-full flex-col overflow-hidden rounded-lg border border-line bg-canvas shadow-card transition-shadow hover:shadow-raised has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-primary">
                <div className="relative h-48 overflow-hidden bg-surface-2">
                  <Photo
                    src={photo(AREA_PHOTOS[area.slug], 1000)}
                    alt=""
                    priority={i < 3}
                    sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 24rem"
                    className="transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                  />
                  <span className="absolute start-3 top-3 rounded-md bg-white/95 px-2 py-1 text-xs font-semibold text-fg shadow-card">
                    {th("count", { count: counts[area.slug] })}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-lg font-bold text-fg">
                    <Link
                      href={{ pathname: "/properties", query: { area: area.slug } }}
                      className="after:absolute after:inset-0 focus-visible:outline-none group-hover:text-primary"
                    >
                      {area.name[locale]}
                    </Link>
                  </h2>
                  <p className="text-sm text-fg-subtle">{area.governorate[locale]}</p>
                  <p className="mt-3 text-sm text-fg-muted">{area.character[locale]}</p>
                  {"isGrid" in area && area.isGrid && (
                    <p className="mt-3 flex items-start gap-2 text-xs text-fg-muted">
                      <Grid3x3 className="mt-0.5 size-3.5 shrink-0 text-primary" strokeWidth={2} aria-hidden="true" />
                      {t("gridNote")}
                    </p>
                  )}
                  <p className="mt-auto flex items-center gap-1.5 pt-5 text-sm font-semibold text-primary">
                    {t("viewUnits", { area: area.name[locale] })}
                    <Arrow className="size-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" strokeWidth={2} aria-hidden="true" />
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
