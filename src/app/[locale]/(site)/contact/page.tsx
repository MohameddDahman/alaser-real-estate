import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ExternalLink, MapPin, MessageCircle, Phone } from "lucide-react";

import type { Locale } from "@/i18n/routing";
import { PageIntro } from "@/components/ui/PageIntro";
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
  const tn = await getTranslations("nav");
  const tp = await getTranslations("property");
  const tw = await getTranslations("whatsapp");

  const waLink = waHref(tw("templateGeneral", { area: office.city[locale] }), locale);
  const external = waLink.startsWith("http");

  return (
    <>
      <PageIntro
        rtl={locale === "ar"}
        crumbs={[{ label: tn("home"), href: "/" }, { label: t("title") }]}
        title={t("metaTitle")}
        lead={t("intro")}
      />

      <div className="shell grid gap-8 py-10 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-12 lg:py-14">
        <div className="space-y-4">
          <div className="rounded-lg border border-line bg-canvas p-5 shadow-card">
            <p className="flex items-center gap-2 font-semibold text-fg">
              <MessageCircle className="size-5 text-whatsapp" strokeWidth={1.75} aria-hidden="true" />
              {locale === "ar" ? "واتساب" : "WhatsApp"}
            </p>
            <p className="mt-1.5 text-sm text-fg-muted">{tp("agentReply")}</p>
            <a
              href={waLink}
              target={external ? "_blank" : undefined}
              rel={external ? "noreferrer" : undefined}
              className="btn btn-whatsapp mt-4 w-full"
            >
              <MessageCircle className="size-4" strokeWidth={2} aria-hidden="true" />
              {tp("whatsappShort")}
            </a>
          </div>

          {hasVerifiedContact && (
            <div className="rounded-lg border border-line bg-canvas p-5">
              <p className="flex items-center gap-2 font-semibold text-fg">
                <Phone className="size-5 text-primary" strokeWidth={1.75} aria-hidden="true" />
                {tp("call")}
              </p>
              <a href={telHref(locale)} className="link mt-1.5 inline-block text-lg tabular-nums" dir="ltr">
                {contact.phone}
              </a>
            </div>
          )}

          <div className="rounded-lg border border-line bg-canvas p-5">
            <p className="flex items-center gap-2 font-semibold text-fg">
              <MapPin className="size-5 text-primary" strokeWidth={1.75} aria-hidden="true" />
              {t("officeTitle")}
            </p>
            <p className="mt-1.5 text-fg-muted">{office.address[locale]}</p>
          </div>

          {social.facebook && (
            <a
              href={social.facebook}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-3 rounded-lg border border-line bg-canvas p-5 font-semibold text-fg transition-colors hover:border-primary hover:text-primary"
            >
              Facebook
              <ExternalLink className="size-4" strokeWidth={2} aria-hidden="true" />
            </a>
          )}
        </div>

        <section aria-labelledby="form-title" className="rounded-lg border border-line bg-canvas p-5 shadow-card sm:p-8">
          <h2 id="form-title" className="text-heading font-bold text-fg">
            {t("formTitle")}
          </h2>
          <div className="mt-5 max-w-xl">
            <EnquiryForm />
          </div>
        </section>
      </div>
    </>
  );
}
