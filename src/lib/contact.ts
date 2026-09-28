import { contact, office, social, stats, type I18nText } from "@/content/client-facts";
import { whatsappLink } from "./utils";

/**
 * The business details the client edits in the dashboard (Settings): the
 * number shown and called, the WhatsApp number, email, the office address
 * and its pin on Google Maps, the Facebook page, and the company's numbers.
 * Stored with the rest of the dashboard's data; until the client saves their
 * own, the confirmed ones in client-facts.ts stand.
 *
 * The company's name, areas, property types and tenures are not here: they
 * are the site's structure - pages, filters, photographs - not settings.
 */
export type BusinessDetails = {
  /** As it is shown, e.g. "+20 109 511 5184". */
  phone: string;
  /** International digits, the form wa.me needs: 201095115184. */
  whatsapp: string;
  email?: string;
  address: I18nText;
  /** A Google Maps link to the office, if the client has given one. */
  mapUrl?: string;
  /** Any pages the client wants linked - Instagram, Facebook, a listings profile. */
  links: SiteLink[];
  /** Shown only once the client has entered them - never estimated. */
  yearsActive?: number;
  unitsSold?: number;
};

export type SiteLink = { url: string; label?: string };

export const DEFAULT_DETAILS: BusinessDetails = {
  phone: contact.phone,
  whatsapp: contact.whatsapp,
  email: contact.email || undefined,
  address: office.address,
  links: social.facebook ? [{ url: social.facebook }] : [],
  yearsActive: stats.verified ? (stats.yearsActive ?? undefined) : undefined,
  unitsSold: stats.verified ? (stats.unitsSold ?? undefined) : undefined,
};

/** Sites a link is named after without the client having to type a name. */
const KNOWN_SITES: Array<[RegExp, string]> = [
  [/(^|\.)(facebook|fb)\.com$/, "Facebook"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)tiktok\.com$/, "TikTok"],
  [/(^|\.)youtube\.com$|^youtu\.be$/, "YouTube"],
  [/(^|\.)(x|twitter)\.com$/, "X"],
  [/(^|\.)linkedin\.com$/, "LinkedIn"],
  [/^t\.me$|(^|\.)telegram\.(me|org)$/, "Telegram"],
  [/(^|\.)snapchat\.com$/, "Snapchat"],
  [/(^|\.)threads\.(net|com)$/, "Threads"],
  [/(^|\.)pinterest\.com$/, "Pinterest"],
  [/(^|\.)propertyfinder\.eg$/, "Property Finder"],
  [/(^|\.)aqarmap\.com\.eg$/, "Aqarmap"],
  [/(^|\.)(dubizzle|olx)\.com\.eg$/, "Dubizzle"],
];

/** The name a link is shown under: the client's own, the site's, or its address. */
export function linkName(link: SiteLink): string {
  if (link.label) return link.label;
  try {
    const host = new URL(link.url).hostname.replace(/^www\./, "");
    return KNOWN_SITES.find(([pattern]) => pattern.test(host))?.[1] ?? host;
  } catch {
    return link.url;
  }
}

export const hasVerifiedContact = contact.verified;

/**
 * Every WhatsApp CTA routes through here.
 *
 * Until the client confirms their real number, these fall back to the contact
 * page rather than deep-linking a placeholder — a CTA that opens WhatsApp to a
 * number nobody answers is worse than one that opens a form.
 */
export function waHref(details: BusinessDetails, text: string, locale: string) {
  if (!contact.verified) return `/${locale}/contact`;
  return whatsappLink(details.whatsapp, text);
}

export function telHref(details: BusinessDetails, locale: string) {
  if (!contact.verified) return `/${locale}/contact`;
  return `tel:${details.phone.replace(/[^\d+]/g, "")}`;
}
