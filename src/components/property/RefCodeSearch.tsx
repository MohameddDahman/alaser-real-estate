"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";

/**
 * Reference-code lookup. Every unit on the site carries a code like ALS-0412
 * and the client quotes it on WhatsApp and on the phone, so it is the fastest
 * way back to a unit someone half-remembers.
 */
export function RefCodeSearch() {
  const t = useTranslations("notFound");
  const router = useRouter();
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        if (q) router.push(`/properties?q=${encodeURIComponent(q)}`);
      }}
      className="flex gap-px bg-navy-edge"
    >
      <label htmlFor="refcode" className="sr-only">
        {t("searchLabel")}
      </label>
      <input
        id="refcode"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="ALS-0412"
        dir="ltr"
        autoComplete="off"
        className="min-h-12 flex-1 bg-navy px-4 font-data text-[1rem] text-sheet tabular-nums outline-none placeholder:text-giza-dim/60 focus:bg-navy-lift"
      />
      <button
        type="submit"
        className="label min-h-12 cursor-pointer bg-survey-deep px-5 text-sheet transition-colors duration-200 hover:bg-survey hover:text-navy"
      >
        {t("searchAction")}
      </button>
    </form>
  );
}
