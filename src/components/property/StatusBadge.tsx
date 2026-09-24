import { useTranslations } from "next-intl";

import type { PropertyStatus } from "@/lib/data/types";
import { cn } from "@/lib/utils";

/**
 * Status is data, so it is a word as well as a colour - a colourblind visitor
 * reads "Sold" exactly as clearly as anyone else.
 */
const TONE: Record<PropertyStatus, string> = {
  available: "bg-success-soft text-success",
  reserved: "bg-warning-soft text-warning",
  sold: "bg-surface-2 text-fg-muted",
  rented: "bg-surface-2 text-fg-muted",
  draft: "bg-surface-2 text-fg-muted",
  archived: "bg-surface-2 text-fg-muted",
};

export function StatusBadge({
  status,
  className,
}: {
  status: PropertyStatus;
  className?: string;
}) {
  const t = useTranslations("property.status");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold",
        TONE[status],
        className,
      )}
    >
      <span aria-hidden="true" className="block size-1.5 shrink-0 rounded-full bg-current" />
      {t(status)}
    </span>
  );
}
