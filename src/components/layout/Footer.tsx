import { getLocale, getTranslations } from "next-intl/server";
import { ExternalLink, MapPin, MessageCircle, Phone } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Mark } from "@/components/brand/Mark";
import { areas, brand, office } from "@/content/client-facts";
import { hasVerifiedContact, linkName, telHref, waHref } from "@/lib/contact";
import { getBusinessDetails } from "@/lib/data/site-settings";
import type { Locale } from "@/i18n/routing";

const PAGES = ["properties", "portfolio", "areas", "services", "about", "contact"] as const;

export async function Footer() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("footer");
  const tn = await getTranslations("nav");
  const tw = await getTranslations("whatsapp");
  const details = await getBusinessDetails();

  const waLink = waHref(details, tw("templateGeneral", { area: office.city[locale] }), locale);
  const external = waLink.startsWith("http");

  return (
    <footer className="border-t border-line bg-surface text-sm">
      <div className="shell grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr] lg:py-14">
        <div>
          <Link href="/" className="inline-flex items-center gap-3 rounded-md text-navy">
            <Mark className="h-8 w-auto" />
            <span className="leading-none">
              <span className="block font-display text-[1rem] tracking-[0.26em] [font-variation-settings:'wdth'_100,'wght'_600]">
                ALASER
              </span>
              <span className="mt-1 block text-[0.6875rem] text-fg-muted">
                {brand.descriptor[locale]}
              </span>
            </span>
          </Link>
          <p className="mt-4 max-w-[30ch] text-fg-muted">{t("tagline")}</p>
        </div>

        <nav aria-labelledby="footer-areas">
          <h2 id="footer-areas" className="font-semibold text-fg">
            {t("areas")}
          </h2>
          <ul className="mt-3 space-y-2">
            {areas.map((area) => (
              <li key={area.slug}>
                <Link
                  href={{ pathname: "/properties", query: { area: area.slug } }}
                  className="text-fg-muted transition-colors hover:text-primary hover:underline"
                >
                  {area.name[locale]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-company">
          <h2 id="footer-company" className="font-semibold text-fg">
            {t("company")}
          </h2>
          <ul className="mt-3 space-y-2">
            {PAGES.map((key) => (
              <li key={key}>
                <Link
                  href={`/${key}`}
                  className="text-fg-muted transition-colors hover:text-primary hover:underline"
                >
                  {tn(key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-semibold text-fg">{t("getInTouch")}</h2>
          <ul className="mt-3 space-y-3">
            <li>
              {/* With a map pin saved, the address opens it. */}
              {details.mapUrl ? (
                <a
                  href={details.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex gap-2.5 text-fg-muted transition-colors hover:text-primary"
                >
                  <MapPin className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  {details.address[locale]}
                </a>
              ) : (
                <span className="flex gap-2.5 text-fg-muted">
                  <MapPin className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  {details.address[locale]}
                </span>
              )}
            </li>
            {hasVerifiedContact && (
              <li>
                <a
                  href={telHref(details, locale)}
                  className="inline-flex gap-2.5 text-fg-muted transition-colors hover:text-primary"
                >
                  <Phone className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  <span dir="ltr" className="tabular-nums">
                    {details.phone}
                  </span>
                </a>
              </li>
            )}
            <li>
              <a
                href={waLink}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                className="inline-flex gap-2.5 text-fg-muted transition-colors hover:text-primary"
              >
                <MessageCircle className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                {locale === "ar" ? "واتساب" : "WhatsApp"}
              </a>
            </li>
            {details.links.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex gap-2.5 text-fg-muted transition-colors hover:text-primary"
                >
                  <ExternalLink className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  <span dir="auto">{linkName(link)}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="shell flex flex-col gap-2 py-5 text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>{t("rights", { year: new Date().getFullYear() })}</p>
          <p>{t("builtNote")}</p>
        </div>
      </div>
    </footer>
  );
}
