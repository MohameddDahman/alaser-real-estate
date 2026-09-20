"use client";

import { useTranslations } from "next-intl";
import { Building2, Inbox, LayoutDashboard, Settings } from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", key: "navDashboard", Icon: LayoutDashboard },
  { href: "/admin/properties", key: "navProperties", Icon: Building2 },
  { href: "/admin/leads", key: "navLeads", Icon: Inbox },
  { href: "/admin/settings", key: "navSettings", Icon: Settings },
] as const;

/**
 * Side rail on a laptop, bottom bar on a phone - the client edits from the car,
 * so the phone layout is not an afterthought. Four destinations, under the
 * five-item ceiling, every one with an icon AND a label.
 */
export function AdminNav() {
  const t = useTranslations("admin");
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      <nav aria-label={t("title")} className="hidden w-52 shrink-0 lg:block">
        <ul className="sticky top-24 space-y-1">
          {ITEMS.map(({ href, key, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 px-3 transition-colors duration-150",
                  isActive(href)
                    ? "bg-ink text-sheet"
                    : "text-ink/70 hover:bg-sheet-2 hover:text-ink",
                )}
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span className="label">{t(key)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <nav
        aria-label={t("title")}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-sheet-edge bg-sheet lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="flex">
          {ITEMS.map(({ href, key, Icon }) => (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 transition-colors duration-150",
                  isActive(href) ? "text-ink" : "text-ink/50",
                )}
              >
                <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                <span className="label text-[0.6rem]">{t(key)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
