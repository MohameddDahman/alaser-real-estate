"use client";

import { useTranslations } from "next-intl";

import type { PropertyStatus } from "@/lib/data/types";
import { cn } from "@/lib/utils";

/**
 * Status is data, so it is rendered as an annotation - a coloured tick AND a
 * word, never colour alone. A colourblind visitor reads "Sold" exactly as
 * clearly as anyone else.
 */
const TONE: Record<PropertyStatus, string> = {
  available: "text-available",
  reserved: "text-reserved",
  sold: "text-sold",
  rented: "text-sold",
  draft: "text-giza-dim",
  archived: "text-giza-dim",
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
        "label inline-flex items-center gap-2 bg-navy/60 px-2.5 py-1.5",
        TONE[status],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "block size-1.5 shrink-0 bg-current",
          status === "sold" || status === "rented" ? "opacity-50" : "",
        )}
      />
      {t(status)}
    </span>
  );
}
