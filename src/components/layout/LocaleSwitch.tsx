"use client";

import { useParams } from "next/navigation";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Globe } from "lucide-react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { localeMeta, routing, type Locale } from "@/i18n/routing";
import { announceNavigation } from "@/lib/navigation-events";
import { cn } from "@/lib/utils";

/** Set once a visitor picks a language themselves; the site stops suggesting one. */
export const LANGUAGE_CHOSEN_KEY = "alaser-language-chosen";

export function rememberLanguageChoice() {
  try {
    localStorage.setItem(LANGUAGE_CHOSEN_KEY, "1");
  } catch {
    /* storage can be blocked; the choice still applies to this visit */
  }
}

/** The current locale, the other one, and a switch to it that keeps the page. */
export function useSwitchLocale() {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const current = (params.locale as Locale) ?? routing.defaultLocale;
  const other = routing.locales.find((l) => l !== current)!;

  const switchLocale = () => {
    rememberLanguageChoice();
    announceNavigation();
    startTransition(() => {
      // Keep the query string: switching language must not drop the
      // visitor's filters and land them back on an unfiltered list.
      const search = typeof window === "undefined" ? "" : window.location.search;
      router.replace(`${pathname}${search}`, { locale: other });
    });
  };

  return { current, other, pending, switchLocale };
}

/**
 * Switches locale on the current route, keeping the path and query. Set as a
 * link-style control rather than a dropdown: there are two locales, and a menu
 * for two options is a menu too many.
 */
export function LocaleSwitch({
  className,
  withIcon = false,
}: {
  className?: string;
  withIcon?: boolean;
}) {
  const { other, pending, switchLocale } = useSwitchLocale();
  const t = useTranslations("nav");

  return (
    <button
      type="button"
      disabled={pending}
      onClick={switchLocale}
      aria-label={t("switchLanguage", { language: localeMeta[other].label })}
      className={cn("cursor-pointer whitespace-nowrap disabled:opacity-50", className)}
    >
      {withIcon && <Globe className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />}
      {/* The label is the language you get, written in that language -
          abbreviated beside the icon where a phone has no room for it. */}
      {withIcon ? (
        <>
          <span lang={other} className="sm:hidden">
            {localeMeta[other].short}
          </span>
          <span lang={other} className="hidden sm:inline">
            {localeMeta[other].label}
          </span>
        </>
      ) : (
        <span lang={other}>{localeMeta[other].label}</span>
      )}
    </button>
  );
}
