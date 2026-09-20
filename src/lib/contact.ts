import { contact } from "@/content/client-facts";
import { whatsappLink } from "./utils";

export const hasVerifiedContact = contact.verified;

/**
 * Every WhatsApp CTA routes through here.
 *
 * Until the client confirms their real number, these fall back to the contact
 * page rather than deep-linking a placeholder — a CTA that opens WhatsApp to a
 * number nobody answers is worse than one that opens a form.
 */
export function waHref(text: string, locale: string) {
  if (!contact.verified) return `/${locale}/contact`;
  return whatsappLink(contact.whatsapp, text);
}

export function telHref(locale: string) {
  if (!contact.verified) return `/${locale}/contact`;
  return `tel:${contact.phone.replace(/\s/g, "")}`;
}
