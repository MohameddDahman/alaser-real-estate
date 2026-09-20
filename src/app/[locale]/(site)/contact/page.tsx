import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MapPin, MessageCircle, Phone } from "lucide-react";

import type { Locale } from "@/i18n/routing";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/ui/DimensionRule";
import { EnquiryForm } from "@/components/property/EnquiryForm";
import { contact, office, social } from "@/content/client-facts";
import { hasVerifiedContact, telHref, waHref } from "@/lib/contact";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function ContactPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations("contact");
  const tw = await getTranslations("whatsapp");

  const waLink = waHref(tw("templateGeneral", { area: office.city[locale] }), locale);
  const external = waLink.startsWith("http");

  return (
    <div className="mx-auto w-full max-w-[92rem] px-4 pb-24 pt-32 sm:px-6 lg:px-10 lg:pb-32 lg:pt-40">
      <Reveal className="text-sheet">
        <SectionHead
          eyebrow={t("title")}
          title={t("metaTitle")}
          body={t("intro")}
          className="max-w-3xl"
        />
      </Reveal>

      <div className="mt-16 grid gap-14 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
        <Reveal>
          <h2 className="label text-giza-dim">{t("officeTitle")}</h2>
          <ul className="mt-5 space-y-6 border-t border-navy-edge pt-6">
            <li className="flex gap-3.5">
              <MapPin className="mt-1 size-4 shrink-0 text-giza-dim" strokeWidth={1.5} aria-hidden="true" />
              <span className="text-sheet">{office.address[locale]}</span>
            </li>

            {hasVerifiedContact && (
              <li className="flex gap-3.5">
                <Phone className="mt-1 size-4 shrink-0 text-giza-dim" strokeWidth={1.5} aria-hidden="true" />
                <a
                  href={telHref(locale)}
                  dir="ltr"
                  className="font-data text-data text-sheet transition-colors duration-200 hover:text-survey"
                >
                  {contact.phone}
                </a>
              </li>
            )}

            <li>
              <a
                href={waLink}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                className="label inline-flex min-h-12 items-center gap-2.5 bg-survey-deep px-5 text-sheet transition-colors duration-200 hover:bg-survey hover:text-navy"
              >
                <MessageCircle className="size-4" strokeWidth={1.75} aria-hidden="true" />
                {locale === "ar" ? "واتساب" : "WhatsApp"}
              </a>
            </li>

            {social.facebook && (
              <li>
                <a
                  href={social.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="text-giza transition-colors duration-200 hover:text-sheet"
                >
                  Facebook
                </a>
              </li>
            )}
          </ul>
        </Reveal>

        <Reveal delay={0.08}>
          <h2 className="label text-giza-dim">{t("formTitle")}</h2>
          <div className="mt-6 border-t border-navy-edge pt-8">
            <EnquiryForm />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
