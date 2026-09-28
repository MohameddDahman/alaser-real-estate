import "server-only";

import type { BusinessDetails, SiteLink } from "@/lib/contact";
import { internationalDigits, toLatinDigits } from "@/lib/utils";

/**
 * What the Settings form submits, checked and tidied on the server: numbers
 * typed on an Arabic keyboard count, a WhatsApp number typed the local way
 * (010...) is stored the way wa.me needs it, a link typed without "https://"
 * gets it, and only real web addresses are kept - a map link has to open
 * Google Maps, and nothing can smuggle a script in as a link.
 */

export type DetailField =
  | "phone"
  | "whatsapp"
  | "email"
  | "address"
  | "mapUrl"
  | "links"
  | "yearsActive"
  | "unitsSold";

const MAX_LINKS = 12;

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

/** A web address, read the way people type them: "instagram.com/alaser" counts. */
function web(value: string): URL | null {
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`);
    return (url.protocol === "https:" || url.protocol === "http:") && url.hostname.includes(".") ? url : null;
  } catch {
    return null;
  }
}

/** A Google Maps link: a shared short link, or a maps page on any Google domain. */
export function isMapLink(value: string): boolean {
  const url = web(value);
  if (!url) return false;
  const host = url.hostname.replace(/^www\./, "");
  if (host === "maps.app.goo.gl" || /^maps\.google\.[a-z.]+$/.test(host)) return true;
  if (host === "goo.gl" || /^google\.[a-z.]+$/.test(host)) return url.pathname.startsWith("/maps");
  return false;
}

/** The client's links: any site, each with an optional name, in their order. */
function readLinks(form: FormData): SiteLink[] | false {
  let raw: unknown;
  try {
    raw = JSON.parse(text(form, "links") || "[]");
  } catch {
    return false;
  }
  if (!Array.isArray(raw)) return false;

  const links: SiteLink[] = [];
  for (const item of raw.slice(0, MAX_LINKS) as Array<{ url?: unknown; label?: unknown }>) {
    const typed = String(item?.url ?? "").trim();
    const label = String(item?.label ?? "").trim().slice(0, 40);
    if (!typed && !label) continue; // an empty row left in the form
    const url = web(typed);
    if (!url) return false;
    if (!links.some((link) => link.url === url.href)) links.push({ url: url.href, label: label || undefined });
  }
  return links;
}

/** A whole number from what was typed, blank meaning "not given". */
function count(raw: string): number | undefined | false {
  const value = toLatinDigits(raw).replace(/[\s,]/g, "");
  if (!value) return undefined;
  if (!/^\d{1,6}$/.test(value)) return false;
  return Number(value);
}

export function readDetailsForm(
  form: FormData,
): { details: BusinessDetails; errors?: undefined } | { errors: DetailField[]; details?: undefined } {
  const phone = toLatinDigits(text(form, "phone")).replace(/\s+/g, " ");
  const phoneDigits = phone.replace(/\D/g, "");
  const whatsapp = internationalDigits(text(form, "whatsapp"));
  const email = text(form, "email");
  const address = { en: text(form, "address.en"), ar: text(form, "address.ar") };
  const mapTyped = text(form, "mapUrl");
  const links = readLinks(form);
  const yearsActive = count(text(form, "yearsActive"));
  const unitsSold = count(text(form, "unitsSold"));

  const errors: DetailField[] = [];
  if (!/^\+?[\d\s()-]+$/.test(phone) || phoneDigits.length < 8 || phoneDigits.length > 15) errors.push("phone");
  if (!/^\d{10,15}$/.test(whatsapp)) errors.push("whatsapp");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("email");
  if (!address.en || !address.ar) errors.push("address");
  if (mapTyped && !isMapLink(mapTyped)) errors.push("mapUrl");
  if (links === false) errors.push("links");
  if (yearsActive === false) errors.push("yearsActive");
  if (unitsSold === false) errors.push("unitsSold");
  if (errors.length > 0 || links === false) return { errors };

  return {
    details: {
      phone,
      whatsapp,
      email: email || undefined,
      address,
      mapUrl: mapTyped ? web(mapTyped)!.href : undefined,
      links,
      yearsActive: yearsActive || undefined,
      unitsSold: unitsSold || undefined,
    },
  };
}
