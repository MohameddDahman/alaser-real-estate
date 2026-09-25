import "server-only";
import { getTranslations } from "next-intl/server";

import type { I18nText } from "@/content/client-facts";
import { whatsappLink } from "@/lib/utils";
import type { LeadStatus, StoredInquiry } from "./inquiries";
import type { Property } from "./types";

/**
 * An enquiry as the dashboard shows it, with the unit it is about and a
 * WhatsApp reply ready to send - written in the language the visitor used
 * on the site, whichever language the dashboard is in.
 */
export type LeadRow = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  message?: string;
  ref?: string;
  unit?: { id: string; title: I18nText };
  locale: "en" | "ar";
  status: LeadStatus;
  createdAt: number;
  whatsapp: string;
};

export async function toLeadRows(leads: StoredInquiry[], units: Property[]): Promise<LeadRow[]> {
  const byRef = new Map(units.map((unit) => [unit.refCode, unit]));
  const t = {
    en: await getTranslations({ locale: "en", namespace: "admin" }),
    ar: await getTranslations({ locale: "ar", namespace: "admin" }),
  };

  return leads.map((lead) => {
    const locale = lead.locale === "ar" ? "ar" : "en";
    const unit = lead.propertyRefCode ? byRef.get(lead.propertyRefCode) : undefined;
    const text = lead.propertyRefCode
      ? t[locale]("replyAboutUnit", { name: lead.name, ref: lead.propertyRefCode })
      : t[locale]("replyGeneral", { name: lead.name });

    return {
      id: lead._id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      message: lead.message,
      ref: lead.propertyRefCode,
      unit: unit ? { id: unit._id, title: unit.title } : undefined,
      locale,
      status: lead.status,
      createdAt: lead.createdAt,
      whatsapp: whatsappLink(lead.phone, text),
    };
  });
}
