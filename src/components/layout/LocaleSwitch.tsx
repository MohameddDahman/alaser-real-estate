"use client";

import { useParams } from "next/navigation";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeMeta, routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Switches locale on the current route, keeping the path and query. Set as a
 * link-style control rather than a dropdown: there are two locales, and a menu
 * for two options is a menu too many.
 */
export function LocaleSwitch({ className }: { className?: string }) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const current = (params.locale as Locale) ?? routing.defaultLocale;
  const other = routing.locales.find((l) => l !== current)!;

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(() => {
          // Keep the query string: switching language must not drop the
          // visitor's filters and land them back on an unfiltered list.
          const search = typeof window === "undefined" ? "" : window.location.search;
          router.replace(`${pathname}${search}`, { locale: other });
        })
      }
      // The label is the language you get, written in that language.
      lang={other}
      aria-label={`Switch to ${localeMeta[other].label}`}
      className={cn(
        "label cursor-pointer whitespace-nowrap transition-opacity duration-200",
        "hover:opacity-100 disabled:opacity-40",
        "opacity-70",
        className,
      )}
    >
      {localeMeta[other].label}
    </button>
  );
}
