import { defineRouting } from "next-intl/routing";

/**
 * Both locales are first-class. `en` is the default per the build decision, but
 * the client's own audience in Faisal, Haram and Hadayek El-Ahram is Arabic-
 * speaking - flipping `defaultLocale` to "ar" is a one-word change here and
 * nothing else in the codebase needs to move.
 */
export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "en",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

export const localeMeta: Record<Locale, { dir: "ltr" | "rtl"; label: string; short: string }> = {
  en: { dir: "ltr", label: "English", short: "EN" },
  ar: { dir: "rtl", label: "العربية", short: "ع" },
};
