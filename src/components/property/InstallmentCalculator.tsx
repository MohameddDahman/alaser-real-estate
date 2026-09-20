"use client";

import { useId, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

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
    <div className="border border-navy-edge">
      <h3 className="label border-b border-navy-edge px-5 py-3.5 text-giza-dim">
        {t("calcTitle")}
      </h3>

      <div className="space-y-6 px-5 py-6">
        <Row label={t("calcPrice")}>
          <span className="font-data text-[0.95rem] text-sheet tabular-nums" dir="ltr">
            {formatPrice(price, locale, currency)}
          </span>
        </Row>

        <div>
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor={`${id}-down`} className="label text-giza-dim">
              {t("calcDown")}
            </label>
            <span className="font-data text-data text-sheet tabular-nums" dir="ltr">
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
            className="mt-3 h-11 w-full cursor-pointer accent-[var(--color-survey)]"
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor={`${id}-years`} className="label text-giza-dim">
              {t("calcYears")}
            </label>
            <span className="font-data text-data text-sheet tabular-nums" dir="ltr">
              {formatNumber(years, locale)}
            </span>
          </div>
          <input
            id={`${id}-years`}
            type="range"
            min={1}
            max={10}
            step={1}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="mt-3 h-11 w-full cursor-pointer accent-[var(--color-survey)]"
          />
        </div>

        <div className="border-t border-navy-edge pt-5">
          <Row label={t("calcMonthly")}>
            <span
              className="font-data text-[1.35rem] text-survey tabular-nums"
              dir="ltr"
              aria-live="polite"
            >
              {formatPrice(monthly, locale, currency)}
            </span>
          </Row>
        </div>

        <p className="text-[0.82rem] leading-relaxed text-giza-dim">{t("calcNote")}</p>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="label text-giza-dim">{label}</span>
      {children}
    </div>
  );
}
