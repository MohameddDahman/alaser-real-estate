import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Crumb = { label: string; href?: string };

/** Where you are, and one click back up. The last crumb is the page itself. */
export function Breadcrumbs({
  items,
  rtl = false,
  className,
}: {
  items: Crumb[];
  rtl?: boolean;
  className?: string;
}) {
  const t = useTranslations("nav");
  const Sep = rtl ? ChevronLeft : ChevronRight;

  return (
    <nav aria-label={t("breadcrumb")} className={cn("text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
              {item.href && !last ? (
                <Link href={item.href} className="text-primary hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className="truncate text-fg-muted">
                  {item.label}
                </span>
              )}
              {!last && (
                <Sep className="size-3.5 shrink-0 text-fg-subtle" strokeWidth={2} aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
