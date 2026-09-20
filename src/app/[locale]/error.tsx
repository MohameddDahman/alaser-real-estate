"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

/**
 * Errors do not apologise and are never vague about whose fault it is. This one
 * says the failure is ours, offers the retry, and points at the channel that
 * still works when the site does not.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[92rem] flex-col justify-center px-4 py-32 sm:px-6 lg:px-10">
      <h1 className="max-w-3xl text-d2 text-sheet">{t("title")}</h1>
      <p className="measure mt-6 text-lead text-giza">{t("body")}</p>

      <button
        type="button"
        onClick={reset}
        className="label mt-10 inline-flex min-h-12 w-fit cursor-pointer items-center border border-giza-dim/50 px-6 text-sheet transition-colors duration-300 hover:border-survey hover:text-survey"
      >
        {t("retry")}
      </button>

      {error.digest && (
        <p className="mt-8 font-data text-data text-giza-dim/60" dir="ltr">
          {error.digest}
        </p>
      )}
    </div>
  );
}
