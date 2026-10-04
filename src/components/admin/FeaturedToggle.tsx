"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";

import { setFeatured } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

/**
 * The star on a unit in the list: on the home page's featured row or not,
 * in one tap, saved at once. It springs back if the save fails.
 */
export function FeaturedToggle({
  id,
  featured: saved,
  onChanged,
}: {
  id: string;
  featured: boolean;
  onChanged?: (featured: boolean) => void;
}) {
  const t = useTranslations("admin");
  const [featured, setLocal] = useState(saved);
  const [pending, start] = useTransition();
  const label = featured ? t("removeFromHomePage") : t("fieldFeatured");

  return (
    <button
      type="button"
      aria-pressed={featured}
      disabled={pending}
      title={label}
      onClick={() => {
        const next = !featured;
        setLocal(next);
        onChanged?.(next);
        const data = new FormData();
        data.set("id", id);
        data.set("featured", next ? "1" : "0");
        start(async () => {
          const result = await setFeatured(data).catch(() => ({ ok: false }));
          if (!result.ok) {
            setLocal(!next);
            onChanged?.(!next);
          }
        });
      }}
      className={cn(
        "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors disabled:opacity-60",
        featured
          ? "border-primary bg-primary-soft text-primary"
          : "border-line-strong bg-canvas text-fg-subtle hover:border-fg-subtle hover:text-fg",
      )}
    >
      <span className="sr-only">{label}</span>
      <Star className="size-4" strokeWidth={2} fill={featured ? "currentColor" : "none"} aria-hidden="true" />
    </button>
  );
}
