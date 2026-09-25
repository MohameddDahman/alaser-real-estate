"use client";

import { useTranslations } from "next-intl";
import { Building2, Home, Inbox, Settings } from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", key: "navDashboard", Icon: Home },
  { href: "/admin/properties", key: "navProperties", Icon: Building2 },
  { href: "/admin/leads", key: "navLeads", Icon: Inbox },
  { href: "/admin/settings", key: "navSettings", Icon: Settings },
] as const;

/**
 * Side menu on a laptop, tab bar on a phone - four places, each with an icon
 * AND a label, and the number of new enquiries on Leads wherever you are.
 *
 * While a unit is open for editing the phone's tab bar steps aside: the
 * editor has its own back link, and the bottom of the screen belongs to its
 * Save button.
 */
export function AdminNav({ newLeads }: { newLeads: number }) {
  const t = useTranslations("admin");
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  const editing = /^\/admin\/properties\/[^/]+$/.test(pathname);
  const badge = (href: string) => (href === "/admin/leads" && newLeads > 0 ? newLeads : null);

  return (
    <>
      <nav aria-label={t("title")} className="hidden w-56 shrink-0 lg:block">
        <ul className="sticky top-22 space-y-1">
          {ITEMS.map(({ href, key, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-[0.9375rem] font-medium transition-colors",
                  isActive(href)
                    ? "bg-primary-soft text-primary"
                    : "text-fg-muted hover:bg-canvas hover:text-fg",
                )}
              >
                <Icon className="size-[1.125rem] shrink-0" strokeWidth={2} aria-hidden="true" />
                {t(key)}
                {badge(href) && (
                  <span className="ms-auto rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white tabular-nums">
                    <span className="sr-only">{t("newLeadsCount", { count: newLeads })}: </span>
                    {badge(href)}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <nav
        aria-label={t("title")}
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/95 backdrop-blur-sm lg:hidden",
          editing && "hidden",
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="mx-auto flex max-w-lg">
          {ITEMS.map(({ href, key, Icon }) => (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "relative flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                  isActive(href) ? "text-primary" : "text-fg-muted",
                )}
              >
                <Icon className="size-[1.375rem]" strokeWidth={isActive(href) ? 2.25 : 1.75} aria-hidden="true" />
                {t(key)}
                {badge(href) && (
                  <span className="absolute start-1/2 top-2 ms-2 min-w-5 rounded-full bg-primary px-1.5 text-center text-[0.6875rem] font-semibold leading-5 text-white tabular-nums">
                    <span className="sr-only">{t("newLeadsCount", { count: newLeads })}: </span>
                    {badge(href)}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
