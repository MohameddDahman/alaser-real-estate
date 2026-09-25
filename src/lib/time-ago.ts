import type { Locale } from "@/i18n/routing";

/**
 * "5 minutes ago", "yesterday", then a plain date after a week - how long an
 * enquiry has waited matters more than when it arrived.
 *
 * `now` is passed in rather than read, so the server and the browser agree
 * on the words and nothing flickers when the page wakes up.
 */
export function timeAgo(then: number, now: number, locale: Locale): string {
  const tag = locale === "ar" ? "ar-EG-u-nu-latn" : "en";
  const seconds = Math.round((then - now) / 1000);
  const abs = Math.abs(seconds);
  const rtf = new Intl.RelativeTimeFormat(tag, { numeric: "auto" });

  if (abs < 60) return rtf.format(0, "second");
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return rtf.format(Math.round(seconds / 3600), "hour");
  if (abs < 7 * 86_400) return rtf.format(Math.round(seconds / 86_400), "day");
  return new Intl.DateTimeFormat(tag, { day: "numeric", month: "short" }).format(then);
}
