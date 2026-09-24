import { getTranslations } from "next-intl/server";
import { SearchX } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { RefCodeSearch } from "@/components/property/RefCodeSearch";

/**
 * 404 in the same voice as the rest of the site: it explains what probably
 * happened (the unit sold and was archived), and hands over the fastest way
 * back in - the reference code. Direction, not apology.
 */
export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="shell flex flex-col items-start py-16 lg:py-24">
      <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
        <SearchX className="size-7" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <p className="mt-6 text-sm font-semibold text-fg-subtle" dir="ltr">
        404
      </p>
      <h1 className="mt-1 max-w-2xl text-title font-bold text-fg">{t("title")}</h1>
      <p className="mt-3 max-w-xl text-fg-muted">{t("body")}</p>

      <RefCodeSearch className="mt-8 w-full" />

      <Link href="/properties" className="link mt-6">
        {t("browse")}
      </Link>
    </div>
  );
}
