"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { BookOpen, Building2, Handshake, Info, MapPin, MessageCircle, Phone } from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import { Mark } from "@/components/brand/Mark";
import { LocaleSwitch } from "./LocaleSwitch";
import { brand, contact, office } from "@/content/client-facts";
import { hasVerifiedContact, telHref, waHref } from "@/lib/contact";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

const NAV = [
  { href: "/properties", key: "properties", icon: Building2 },
  { href: "/portfolio", key: "portfolio", icon: BookOpen },
  { href: "/areas", key: "areas", icon: MapPin },
  { href: "/services", key: "services", icon: Handshake },
  { href: "/about", key: "about", icon: Info },
  { href: "/contact", key: "contact", icon: Phone },
] as const;

/**
 * The brand bar: the logo's own navy, the ways to reach the office, and the
 * sections of the site as tabs underneath - the arrangement people already
 * know from every large booking site, so nobody has to learn this one.
 *
 * There is no hamburger. Six tabs fit a phone as a row that scrolls
 * sideways, and a menu hidden behind an icon is a menu half the visitors
 * never open.
 */
export function Header() {
  const t = useTranslations("nav");
  const tw = useTranslations("whatsapp");
  const pathname = usePathname();
  const locale = (useParams().locale as Locale) ?? "en";

  const wa = waHref(tw("templateGeneral", { area: office.city[locale] }), locale);
  const external = wa.startsWith("http");
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="on-navy bg-navy text-white">
      <div className="shell flex h-16 items-center gap-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 rounded-md"
          aria-label={locale === "ar" ? "الأسر — الصفحة الرئيسية" : "Alaser — home"}
        >
          <Mark className="h-7 w-auto sm:h-8" />
          <span className="leading-none">
            <span className="block font-display text-[1rem] tracking-[0.26em] [font-variation-settings:'wdth'_100,'wght'_600]">
              ALASER
            </span>
            <span className="mt-1 hidden text-[0.6875rem] text-white/65 sm:block">
              {brand.descriptor[locale]}
            </span>
          </span>
        </Link>

        <div className="ms-auto flex items-center gap-1 sm:gap-2">
          <LocaleSwitch
            withIcon
            className="inline-flex min-h-10 items-center gap-2 rounded-md px-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10 sm:px-3"
          />

          {hasVerifiedContact && (
            <a
              href={telHref(locale)}
              className="hidden min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors hover:bg-white/10 md:inline-flex"
            >
              <Phone className="size-4" strokeWidth={1.75} aria-hidden="true" />
              <span dir="ltr" className="tabular-nums">
                {contact.phone}
              </span>
            </a>
          )}

          <a
            href={wa}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
            className="btn btn-sm bg-white text-navy hover:bg-white/90"
          >
            <MessageCircle className="size-4" strokeWidth={2} aria-hidden="true" />
            {locale === "ar" ? "واتساب" : "WhatsApp"}
          </a>
        </div>
      </div>

      <nav aria-label={t("menu")} className="shell">
        <ul className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 pb-3">
          {NAV.map(({ href, key, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href} className="shrink-0">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
                    active
                      ? "border-white bg-white/10"
                      : "border-transparent text-white/85 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
                  {t(key)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
