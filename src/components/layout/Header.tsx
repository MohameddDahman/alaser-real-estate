"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { Menu, X, MessageCircle } from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import { Mark } from "@/components/brand/Mark";
import { LocaleSwitch } from "./LocaleSwitch";
import { areas, office } from "@/content/client-facts";
import { waHref } from "@/lib/contact";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

const NAV = [
  { href: "/properties", key: "properties" },
  { href: "/portfolio", key: "portfolio" },
  { href: "/areas", key: "areas" },
  { href: "/services", key: "services" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const tw = useTranslations("whatsapp");
  const pathname = usePathname();
  const locale = (useParams().locale as Locale) ?? "en";
  const [settled, setSettled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => setSettled(y > 24));

  // Close the menu on navigation, and never leave the page locked.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
          settled || open
            ? "bg-navy/97 border-b border-navy-edge"
            : "border-b border-transparent",
        )}
      >
        <div className="mx-auto flex max-w-[92rem] items-center gap-6 px-4 py-3.5 sm:px-6 lg:px-10">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-sheet"
            aria-label={locale === "ar" ? "الأسر — الصفحة الرئيسية" : "Alaser — home"}
          >
            <Mark className="h-6 w-auto sm:h-7" />
            <span className="font-display text-[0.8rem] leading-none tracking-[0.3em] [font-variation-settings:'wdth'_100,'wght'_500] sm:text-[0.9rem]">
              ALASER
            </span>
          </Link>

          <nav className="ms-auto hidden items-center gap-7 lg:flex" aria-label={t("menu")}>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "label relative py-1 transition-colors duration-200",
                  isActive(item.href) ? "text-sheet" : "text-giza-dim hover:text-giza",
                )}
              >
                {t(item.key)}
                {/* Active state is a dimension tick, not an underline - the same
                    device that measures every other quantity on the site. */}
                {isActive(item.href) && (
                  <motion.span
                    layoutId="nav-tick"
                    className="absolute -bottom-0.5 inset-inline-0 block h-px bg-survey"
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span className="absolute -top-1 start-0 h-2 w-px bg-survey" />
                    <span className="absolute -top-1 end-0 h-2 w-px bg-survey" />
                  </motion.span>
                )}
              </Link>
            ))}
          </nav>

          <div className="ms-auto flex items-center gap-4 lg:ms-0 lg:gap-5">
            <LocaleSwitch className="text-giza-dim hover:text-sheet" />

            <a
              href={waHref(tw("templateGeneral", { area: office.city[locale] }), locale)}
              target={waHref("", locale).startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="label hidden items-center gap-2 border border-giza-dim/50 px-3.5 py-2 text-sheet transition-colors duration-200 hover:border-survey hover:text-survey sm:inline-flex"
            >
              <MessageCircle className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
              {locale === "ar" ? "واتساب" : "WhatsApp"}
            </a>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              className="-me-1 flex size-11 cursor-pointer items-center justify-center text-sheet lg:hidden"
            >
              <span className="sr-only">{open ? t("close") : t("menu")}</span>
              {open ? (
                <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
              ) : (
                <Menu className="size-5" strokeWidth={1.5} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 flex flex-col bg-navy pt-20 lg:hidden"
          >
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-6 py-8" aria-label={t("menu")}>
              {NAV.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.045, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={item.href}
                    className="block border-b border-navy-edge py-4 font-display text-d3 text-sheet [font-variation-settings:'wdth'_112]"
                  >
                    {t(item.key)}
                  </Link>
                </motion.div>
              ))}

              <motion.ul
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="mt-8 flex flex-wrap gap-x-5 gap-y-2"
              >
                {areas.map((area) => (
                  <li key={area.slug}>
                    <Link
                      href={{ pathname: "/properties", query: { area: area.slug } }}
                      className="label text-giza-dim"
                    >
                      {area.name[locale]}
                    </Link>
                  </li>
                ))}
              </motion.ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
