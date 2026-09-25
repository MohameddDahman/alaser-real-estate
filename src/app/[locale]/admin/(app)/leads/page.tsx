import { setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { listInquiries } from "@/lib/data/inquiries";
import { IS_EPHEMERAL_STORE } from "@/lib/data/data-dir";
import { toLeadRows } from "@/lib/data/lead-rows";
import { allProperties } from "@/lib/data/store";
import { LeadList } from "@/components/admin/LeadList";

export default async function AdminLeadsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const [inquiries, properties] = await Promise.all([listInquiries(), allProperties()]);

  return (
    <LeadList
      leads={await toLeadRows(inquiries, properties)}
      now={Date.now()}
      ephemeral={IS_EPHEMERAL_STORE}
    />
  );
}
