import { getLocale, getTranslations } from "next-intl/server";
import { MessageCircle, Phone, MapPin } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Mark } from "@/components/brand/Mark";
import { areas, brand, contact, office, social } from "@/content/client-facts";
import { waHref, telHref, hasVerifiedContact } from "@/lib/contact";
import type { Locale } from "@/i18n/routing";

export async function Footer() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("footer");
  const tn = await getTranslations("nav");
  const tw = await getTranslations("whatsapp");

  const waLink = waHref(tw("templateGeneral", { area: office.city[locale] }), locale);
  const external = waLink.startsWith("http");

  return (
    <footer className="bg-ink text-giza">
      <div className="mx-auto max-w-[92rem] px-4 py-16 sm:px-6 lg:px-10 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:gap-10">
          <div>
            <Mark className="h-9 w-auto text-sheet" />
            <p className="mt-4 font-display text-[1rem] leading-none tracking-[0.3em] text-sheet [font-variation-settings:'wdth'_100,'wght'_500]">
              ALASER
            </p>
            <p className="mt-3 max-w-[26ch] text-giza-dim">{t("tagline")}</p>
          </div>

          <div>
            <h2 className="label text-sheet">{t("areas")}</h2>
            <ul className="mt-4 space-y-2.5">
              {areas.map((area) => (
                <li key={area.slug}>
                  <Link
                    href={{ pathname: "/properties", query: { area: area.slug } }}
                    className="text-giza-dim transition-colors duration-200 hover:text-sheet"
                  >
                    {area.name[locale]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="label text-sheet">{t("company")}</h2>
            <ul className="mt-4 space-y-2.5">
              {(["properties", "areas", "services", "about", "contact"] as const).map((key) => (
                <li key={key}>
                  <Link
                    href={key === "properties" ? "/properties" : `/${key}`}
                    className="text-giza-dim transition-colors duration-200 hover:text-sheet"
                  >
                    {tn(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="label text-sheet">{t("getInTouch")}</h2>
            <ul className="mt-4 space-y-3.5">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-giza-dim" strokeWidth={1.5} aria-hidden="true" />
                <span className="text-giza-dim">{office.address[locale]}</span>
              </li>

              {hasVerifiedContact && (
                <li className="flex gap-3">
                  <Phone className="mt-0.5 size-4 shrink-0 text-giza-dim" strokeWidth={1.5} aria-hidden="true" />
                  <a
                    href={telHref(locale)}
                    dir="ltr"
                    className="font-data text-data text-sheet transition-colors duration-200 hover:text-survey"
                  >
                    {contact.phone}
                  </a>
                </li>
              )}

              <li className="flex gap-3">
                <MessageCircle className="mt-0.5 size-4 shrink-0 text-giza-dim" strokeWidth={1.5} aria-hidden="true" />
                <a
                  href={waLink}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noreferrer" : undefined}
                  className="text-sheet transition-colors duration-200 hover:text-survey"
                >
                  {locale === "ar" ? "واتساب" : "WhatsApp"}
                </a>
              </li>

              {social.facebook && (
                <li>
                  <a
                    href={social.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="text-giza-dim transition-colors duration-200 hover:text-sheet"
                  >
                    Facebook
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-navy-edge pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="label text-giza-dim">
            {t("rights", { year: new Date().getFullYear() })}
          </p>
          <p className="label text-giza-dim/70">{t("builtNote")}</p>
        </div>

        <p className="sr-only">{brand.legalName[locale]}</p>
      </div>
    </footer>
  );
}
