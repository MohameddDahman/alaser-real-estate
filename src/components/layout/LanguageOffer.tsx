"use client";

import { useEffect, useState } from "react";
import { Languages, X } from "lucide-react";

import type { Locale } from "@/i18n/routing";
import { LANGUAGE_CHOSEN_KEY, rememberLanguageChoice, useSwitchLocale } from "./LocaleSwitch";

/**
 * The site's own answer to the browser's translate bar.
 *
 * A visitor whose phone is in Arabic can still land on an English page - a
 * shared link, or English remembered from an earlier visit - and Chrome then
 * machine-translates it, badly ("Haram" becomes "حرام"). The pages ask the
 * browser not to (`translate="no"` on <html>), and this offers the real
 * translation instead, written in the language it offers.
 *
 * Shown only when the browser's first language differs from the page's,
 * and never again once the visitor has picked a language themselves.
 */
const OFFER: Record<Locale, { text: string; action: string; close: string }> = {
  ar: { text: "هذه الصفحة متاحة بالعربية.", action: "اعرضها بالعربية", close: "إغلاق" },
  en: { text: "This page is also in English.", action: "View in English", close: "Close" },
};

export function LanguageOffer() {
  const { current, other, pending, switchLocale } = useSwitchLocale();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let chosen = false;
    try {
      chosen = localStorage.getItem(LANGUAGE_CHOSEN_KEY) === "1";
    } catch {
      /* no storage: offer it, it is only a suggestion */
    }
    const first = (navigator.languages?.[0] ?? navigator.language ?? "").toLowerCase();
    const wanted: Locale = first.startsWith("ar") ? "ar" : "en";
    setShow(!chosen && wanted !== current);
  }, [current]);

  if (!show) return null;
  const copy = OFFER[other];

  return (
    <div lang={other} dir={other === "ar" ? "rtl" : "ltr"} className="border-b border-line bg-primary-soft text-fg">
      <div className="shell flex min-h-12 items-center gap-3 py-1.5">
        <Languages className="size-[1.125rem] shrink-0 text-primary" strokeWidth={2} aria-hidden="true" />
        <p className="min-w-0 flex-1 text-sm font-medium">{copy.text}</p>
        <button type="button" onClick={switchLocale} disabled={pending} className="btn btn-primary btn-sm shrink-0">
          {copy.action}
        </button>
        <button
          type="button"
          onClick={() => {
            rememberLanguageChoice();
            setShow(false);
          }}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-white hover:text-fg"
        >
          <span className="sr-only">{copy.close}</span>
          <X className="size-4" strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
