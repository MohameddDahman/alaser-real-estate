import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FileSignature, KeyRound, MessageCircle, Store, Tag, type LucideIcon } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { PageIntro } from "@/components/ui/PageIntro";
import { office } from "@/content/client-facts";
import { waHref } from "@/lib/contact";
import { getBusinessDetails } from "@/lib/data/site-settings";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "services" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

/**
 * Four services. Buying, selling, leasing and commercial are alternatives,
 * not a sequence, so they sit side by side rather than numbered.
 */
const SERVICES: Array<{ key: "buy" | "sell" | "rent" | "commercial"; icon: LucideIcon }> = [
  { key: "buy", icon: KeyRound },
  { key: "sell", icon: Tag },
  { key: "rent", icon: FileSignature },
  { key: "commercial", icon: Store },
];

export default async function ServicesPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations("services");
  const tn = await getTranslations("nav");
  const tw = await getTranslations("whatsapp");
  const waLink = waHref(await getBusinessDetails(), tw("templateGeneral", { area: office.city[locale] }), locale);
  const external = waLink.startsWith("http");

  return (
    <>
      <PageIntro
        rtl={locale === "ar"}
        crumbs={[{ label: tn("home"), href: "/" }, { label: t("title") }]}
        title={t("metaTitle")}
        lead={t("intro")}
      />

      <div className="shell py-10 lg:py-14">
        <ul className="grid gap-5 md:grid-cols-2">
          {SERVICES.map(({ key, icon: Icon }) => (
            <li key={key} className="rounded-lg border border-line bg-canvas p-6 shadow-card sm:p-7">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Icon className="size-6" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-xl font-bold text-fg">{t(`${key}Title` as "buyTitle")}</h2>
              <p className="mt-2 text-fg-muted">{t(`${key}Body` as "buyBody")}</p>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col gap-5 rounded-xl bg-navy p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <p className="text-heading font-bold">{t("askCta")}</p>
          <div className="on-navy flex flex-wrap gap-3">
            <a
              href={waLink}
              target={external ? "_blank" : undefined}
              rel={external ? "noreferrer" : undefined}
              className="btn btn-whatsapp btn-lg"
            >
              <MessageCircle className="size-5" strokeWidth={2} aria-hidden="true" />
              {locale === "ar" ? "واتساب" : "WhatsApp"}
            </a>
            <Link href="/contact" className="btn btn-on-navy btn-lg">
              {tn("contact")}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
