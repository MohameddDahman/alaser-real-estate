"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { announceNavigation } from "@/lib/navigation-events";
import { cn } from "@/lib/utils";

/**
 * Reference-code lookup. Every unit on the site carries a code like ALS-0412
 * and the client quotes it on WhatsApp and on the phone, so it is the fastest
 * way back to a unit someone half-remembers.
 */
export function RefCodeSearch({ className }: { className?: string }) {
  const t = useTranslations("notFound");
  const router = useRouter();
  const [value, setValue] = useState("");
  const id = useId();

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        if (!q) return;
        announceNavigation();
        router.push(`/properties?q=${encodeURIComponent(q)}`);
      }}
      className={cn("flex max-w-md gap-2", className)}
    >
      <label htmlFor={id} className="sr-only">
        {t("searchLabel")}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="ALS-0412"
        dir="ltr"
        autoComplete="off"
        className="field flex-1 tabular-nums"
      />
      <button type="submit" className="btn btn-primary">
        {t("searchAction")}
      </button>
    </form>
  );
}
