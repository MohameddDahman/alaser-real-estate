"use client";

import { useId, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Calculator } from "lucide-react";

import { formatPrice, formatNumber } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

/**
 * Instalment calculator.
 *
 * The most-used feature on any Egyptian property site, so it is built plainly
 * and correctly rather than dressed up: straight division across the term with
 * no interest, which is exactly how developers here quote a payment plan. The
 * note under it says so, because a number a buyer cannot reproduce on their
 * own phone is worse than no number.
 */
export function InstallmentCalculator({
  price,
  currency,
  defaultDownPct = 20,
  defaultYears = 5,
}: {
  price: number;
  currency: "EGP" | "USD";
  defaultDownPct?: number;
  defaultYears?: number;
}) {
  const t = useTranslations("property");
  const locale = (useParams().locale as Locale) ?? "en";
  const id = useId();

  const [downPct, setDownPct] = useState(defaultDownPct);
  const [years, setYears] = useState(defaultYears);

  const down = Math.round((price * downPct) / 100);
  const monthly = Math.round((price - down) / (years * 12));

  return (
    <div className="rounded-lg border border-line bg-canvas p-5 shadow-card sm:p-6">
      <h3 className="flex items-center gap-2 text-lg font-bold text-fg">
        <Calculator className="size-5 text-primary" strokeWidth={1.75} aria-hidden="true" />
        {t("calcTitle")}
      </h3>

      <div className="mt-5 space-y-5">
        <Row label={t("calcPrice")}>
          <span className="font-semibold text-fg tabular-nums">{formatPrice(price, locale, currency)}</span>
        </Row>

        <div>
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor={`${id}-down`} className="text-sm text-fg-muted">
              {t("calcDown")}
            </label>
            <span className="text-sm font-semibold text-fg tabular-nums">
              {downPct}% · {formatPrice(down, locale, currency)}
            </span>
          </div>
          <input
            id={`${id}-down`}
            type="range"
            min={5}
            max={60}
            step={5}
            value={downPct}
            onChange={(e) => setDownPct(Number(e.target.value))}
            className="mt-2 h-8 w-full cursor-pointer accent-[var(--color-primary)]"
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor={`${id}-years`} className="text-sm text-fg-muted">
              {t("calcYears")}
            </label>
            <span className="text-sm font-semibold text-fg tabular-nums">{formatNumber(years, locale)}</span>
          </div>
          <input
            id={`${id}-years`}
            type="range"
            min={1}
            max={10}
            step={1}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="mt-2 h-8 w-full cursor-pointer accent-[var(--color-primary)]"
          />
        </div>

        <div className="rounded-md bg-primary-soft px-4 py-3">
          <Row label={t("calcMonthly")}>
            <span className="text-xl font-bold text-primary tabular-nums" aria-live="polite">
              {formatPrice(monthly, locale, currency)}
            </span>
          </Row>
        </div>

        <p className="text-xs leading-relaxed text-fg-subtle">{t("calcNote")}</p>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-sm text-fg-muted">{label}</span>
      {children}
    </div>
  );
}
