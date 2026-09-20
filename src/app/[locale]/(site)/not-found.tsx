import { getTranslations } from "next-intl/server";

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
    <div className="mx-auto flex min-h-dvh w-full max-w-[92rem] flex-col justify-center px-4 py-32 sm:px-6 lg:px-10">
      <p className="label text-survey" dir="ltr">
        404
      </p>
      <h1 className="mt-4 max-w-3xl text-d2 text-sheet">{t("title")}</h1>
      <p className="measure mt-6 text-lead text-giza">{t("body")}</p>

      <div className="mt-10 max-w-md">
        <RefCodeSearch />
      </div>

      <Link
        href="/properties"
        className="label mt-8 inline-flex w-fit items-center border-b border-giza-dim/50 pb-1.5 text-giza transition-colors duration-300 hover:border-survey hover:text-survey"
      >
        {t("browse")}
      </Link>
    </div>
  );
}
