"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";

import { changeStatus } from "@/app/actions/admin";
import type { PropertyStatus } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const STATUSES: PropertyStatus[] = [
  "available",
  "reserved",
  "sold",
  "rented",
  "draft",
  "archived",
];

const TONE: Record<PropertyStatus, string> = {
  available: "text-available",
  reserved: "text-reserved",
  sold: "text-ink/50",
  rented: "text-ink/50",
  draft: "text-ink/50",
  archived: "text-ink/40",
};

/**
 * Status change from the list, one interaction, no record to open. The brief
 * singles this out because "mark it sold" is the thing the client does most,
 * usually on a phone, usually while doing something else.
 */
export function StatusSelect({
  id,
  status,
}: {
  id: string;
  status: PropertyStatus;
}) {
  const t = useTranslations("property.status");
  const ta = useTranslations("admin");
  const [pending, start] = useTransition();

  return (
    <label className="inline-flex items-center">
      <span className="sr-only">{ta("changeStatus")}</span>
      <select
        defaultValue={status}
        disabled={pending}
        onChange={(event) => {
          const data = new FormData();
          data.set("id", id);
          data.set("status", event.target.value);
          start(() => {
            void changeStatus(data);
          });
        }}
        className={cn(
          "label min-h-11 cursor-pointer border border-sheet-edge bg-sheet px-2.5 outline-none transition-colors focus:border-ink disabled:opacity-50",
          TONE[status],
        )}
      >
        {STATUSES.map((value) => (
          <option key={value} value={value}>
            {t(value)}
          </option>
        ))}
      </select>
    </label>
  );
}
