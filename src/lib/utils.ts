import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Locale } from "@/i18n/routing";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Numbers on this site are data, and data uses Latin digits in both locales.
 * Egyptian price lists, contracts and agents' boards all do - and it keeps the
 * tabular figures in IBM Plex Mono doing their job, which is stopping a price
 * column from reflowing as digits change.
 */
function numberLocale(locale: Locale) {
  return locale === "ar" ? "ar-EG-u-nu-latn" : "en-EG";
}

export function formatNumber(value: number, locale: Locale, maximumFractionDigits = 0) {
  return new Intl.NumberFormat(numberLocale(locale), { maximumFractionDigits }).format(value);
}

export function formatPrice(
  amount: number,
  locale: Locale,
  currency: "EGP" | "USD" = "EGP",
) {
  const n = formatNumber(amount, locale);
  if (currency === "USD") return `$${n}`;
  return locale === "ar" ? `${n} جنيه` : `${n} EGP`;
}

/** Price per built-up metre. The number Egyptian buyers actually compare on. */
export function pricePerMeter(amount: number, area: number, locale: Locale) {
  if (!area) return null;
  return formatPrice(Math.round(amount / area), locale);
}

export function formatArea(value: number, locale: Locale) {
  return `${formatNumber(value, locale)} m²`;
}

/** "2027-06" -> "June 2027" / "يونيو ٢٠٢٧" */
export function formatDeliveryDate(value: string, locale: Locale) {
  const [year, month] = value.split("-").map(Number);
  if (!year) return value;
  const date = new Date(Date.UTC(year, (month ?? 1) - 1, 1));
  return new Intl.DateTimeFormat(numberLocale(locale), {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/**
 * wa.me deep-link carrying the reference code, so the first message the client
 * receives already says which unit it is about. This is the single most
 * important conversion path on the site.
 */
export function whatsappLink(phone: string, text: string) {
  return `https://wa.me/${internationalDigits(phone)}?text=${encodeURIComponent(text)}`;
}

/**
 * wa.me only understands the full international number, but visitors type
 * their mobile the local way: 010..., or 10... without the zero. Both become
 * 2010...; anything already international is left alone.
 */
export function internationalDigits(phone: string) {
  const digits = toLatinDigits(phone).replace(/\D/g, "");
  if (/^01[0125]\d{8}$/.test(digits)) return `2${digits}`;
  if (/^1[0125]\d{8}$/.test(digits)) return `20${digits}`;
  return digits;
}

/** Arabic-Indic and Persian digits as 0-9, so a number typed on an Arabic keyboard still counts. */
export function toLatinDigits(value: string) {
  return value.replace(/[٠-٩۰-۹]/g, (d) => String(d.charCodeAt(0) & 0xf));
}

/** Egyptian mobile: 010, 011, 012, 015, eleven digits. */
export function isEgyptianMobile(value: string) {
  return /^(?:\+?20|0)?1[0125]\d{8}$/.test(toLatinDigits(value).replace(/[\s-]/g, ""));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
