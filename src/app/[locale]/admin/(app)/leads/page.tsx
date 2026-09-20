import { getTranslations, setRequestLocale } from "next-intl/server";
import { Download, MessageCircle } from "lucide-react";

import type { Locale } from "@/i18n/routing";
import { listInquiries } from "@/lib/data/inquiries";
import { whatsappLink } from "@/lib/utils";

export default async function AdminLeadsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations("admin");
  const leads = await listInquiries();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-d3">{t("leadsTitle")}</h1>
        {leads.length > 0 && (
          <a
            href="/api/admin/leads"
            download
            className="label inline-flex min-h-11 items-center gap-2 border border-sheet-edge px-4 text-ink transition-colors hover:border-ink"
          >
            <Download className="size-4" strokeWidth={1.75} aria-hidden="true" />
            {t("exportCsv")}
          </a>
        )}
      </div>

      {leads.length === 0 ? (
        <p className="mt-10 border border-sheet-edge px-6 py-16 text-center text-ink/60">
          {t("leadsEmpty")}
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-sheet-edge border-y border-sheet-edge">
          {leads.map((lead) => {
            // One tap to reply, with the unit's reference already in the
            // message. This is the feature that makes the site feel like it
            // earns money.
            const reply = whatsappLink(
              lead.phone,
              lead.propertyRefCode
                ? locale === "ar"
                  ? `أهلاً ${lead.name}، بخصوص استفسارك عن الوحدة ${lead.propertyRefCode}`
                  : `Hello ${lead.name}, about your enquiry on ${lead.propertyRefCode}`
                : locale === "ar"
                  ? `أهلاً ${lead.name}، بخصوص استفسارك`
                  : `Hello ${lead.name}, about your enquiry`,
            );

            return (
              <li key={lead._id} className="grid gap-x-6 gap-y-2 py-4 lg:grid-cols-[1fr_9rem_8rem_9rem_auto] lg:items-baseline">
                <div className="min-w-0">
                  <p className="font-medium">{lead.name}</p>
                  {lead.message && (
                    <p className="mt-1 text-[0.9rem] text-ink/65">{lead.message}</p>
                  )}
                </div>

                <a
                  href={`tel:${lead.phone}`}
                  dir="ltr"
                  className="font-data text-data tabular-nums underline-offset-4 hover:underline"
                >
                  {lead.phone}
                </a>

                <span className="font-data text-data text-ink/60 tabular-nums" dir="ltr">
                  {lead.propertyRefCode ?? "—"}
                </span>

                <span className="label text-ink/50">
                  {new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(lead.createdAt)}
                </span>

                <a
                  href={reply}
                  target="_blank"
                  rel="noreferrer"
                  className="label inline-flex min-h-11 items-center gap-2 border border-sheet-edge px-3 text-ink transition-colors hover:border-ink"
                >
                  <MessageCircle className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                  {t("replyWhatsapp")}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
