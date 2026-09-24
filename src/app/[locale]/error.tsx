"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";

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
    <div className="shell flex min-h-[60dvh] flex-col items-start justify-center py-16">
      <span className="flex size-14 items-center justify-center rounded-full bg-warning-soft text-warning">
        <TriangleAlert className="size-7" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <h1 className="mt-6 max-w-2xl text-title font-bold text-fg">{t("title")}</h1>
      <p className="mt-3 max-w-xl text-fg-muted">{t("body")}</p>

      <button type="button" onClick={reset} className="btn btn-primary mt-8">
        {t("retry")}
      </button>

      {error.digest && (
        <p className="mt-6 text-xs text-fg-subtle tabular-nums">
          <span dir="ltr">{error.digest}</span>
        </p>
      )}
    </div>
  );
}
