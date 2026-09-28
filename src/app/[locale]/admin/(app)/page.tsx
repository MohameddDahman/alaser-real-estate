import { getTranslations, setRequestLocale } from "next-intl/server";
import { AlertTriangle, CheckCircle2, ChevronRight, Clock, FilePen, Inbox, Plus, Trash2 } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { allProperties } from "@/lib/data/store";
import { listInquiries } from "@/lib/data/inquiries";
import { deletedItems, toUnitRow, type UnitRow } from "@/lib/data/admin-rows";
import { toLeadRows } from "@/lib/data/lead-rows";
import { timeAgo } from "@/lib/time-ago";
import { cn } from "@/lib/utils";
import { Card, EmptyState, PageHeader } from "@/components/admin/ui";
import { LeadActions } from "@/components/admin/LeadActions";
import { LEAD_TONE, StatusBadge } from "@/components/admin/status";
import { UnitThumb } from "@/components/admin/UnitThumb";

const VISIBLE = new Set(["available", "reserved", "sold", "rented"]);

/**
 * The first screen of the day: how many people are waiting for an answer,
 * what is on the market, the newest enquiries with a way to reply, and
 * anything on the site that needs fixing - each one a tap away.
 */
export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations("admin");
  const tp = await getTranslations("property.status");
  const tl = await getTranslations("admin.leadStatus");

  const [properties, inquiries] = await Promise.all([allProperties(), listInquiries()]);
  const units = properties.map(toUnitRow);
  const leads = await toLeadRows(inquiries.slice(0, 5), properties);
  const now = Date.now();

  const count = (status: string) => units.filter((u) => u.status === status).length;
  const newLeads = inquiries.filter((lead) => lead.status === "new").length;
  const trash = deletedItems(properties);

  const live = units.filter((u) => VISIBLE.has(u.status));
  const incomplete = live.filter((u) => u.missing.length > 0);
  const standIn = live.filter((u) => u.standIn);

  const today = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);

  const stats = [
    { href: "/admin/leads", label: t("statNewLeads"), value: newLeads, Icon: Inbox, accent: newLeads > 0 },
    { href: "/admin/properties?status=available", label: tp("available"), value: count("available"), Icon: CheckCircle2 },
    { href: "/admin/properties?status=reserved", label: tp("reserved"), value: count("reserved"), Icon: Clock },
    { href: "/admin/properties?status=draft", label: t("statDrafts"), value: count("draft"), Icon: FilePen },
    // Full width under the others on a phone, fifth in the row on a laptop.
    { href: "/admin/deleted", label: t("navDeleted"), value: trash.units.length + trash.photos.length, Icon: Trash2, wide: true },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title={t("title")}
        subtitle={today}
        action={
          <Link href="/admin/properties/new" className="btn btn-primary">
            <Plus className="size-4" strokeWidth={2.25} aria-hidden="true" />
            {t("newProperty")}
          </Link>
        }
      />

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map(({ href, label, value, Icon, accent, wide }) => (
          <li key={href} className={wide ? "col-span-2 lg:col-span-1" : undefined}>
            <Link
              href={href}
              className={cn(
                "flex h-full rounded-xl border p-4 shadow-card transition-colors",
                wide ? "flex-row items-center gap-3 lg:flex-col lg:items-start lg:gap-0" : "flex-col",
                accent
                  ? "border-primary bg-primary text-white hover:bg-primary-hover"
                  : "border-line bg-canvas hover:border-line-strong",
              )}
            >
              <Icon
                className={cn("size-5", accent ? "text-white/90" : "text-fg-subtle")}
                strokeWidth={2}
                aria-hidden="true"
              />
              <span className={cn("text-[1.75rem] font-bold leading-none tabular-nums", wide ? "lg:mt-3" : "mt-3")}>
                {value}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  wide ? "lg:mt-1.5" : "mt-1.5",
                  accent ? "text-white/90" : "text-fg-muted",
                )}
              >
                {label}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid gap-5 sm:gap-6 xl:grid-cols-2">
        <Card
          title={t("latestLeads")}
          action={
            <Link href="/admin/leads" className="link shrink-0 text-sm">
              {t("seeAll")}
            </Link>
          }
        >
          {leads.length === 0 ? (
            <EmptyState>{t("leadsEmpty")}</EmptyState>
          ) : (
            <ul className="-my-3 divide-y divide-line">
              {leads.map((lead) => (
                <li key={lead.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-fg">{lead.name}</p>
                      <p className="mt-0.5 text-sm text-fg-muted">
                        {timeAgo(lead.createdAt, now, locale)}
                        {lead.ref && (
                          <>
                            {" · "}
                            <span dir="ltr" className="tabular-nums">
                              {lead.ref}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <StatusBadge tone={LEAD_TONE[lead.status]}>{tl(lead.status)}</StatusBadge>
                  </div>
                  <LeadActions phone={lead.phone} whatsapp={lead.whatsapp} className="mt-2.5" />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={t("needsAttention")}>
          {incomplete.length === 0 && standIn.length === 0 ? (
            <p className="flex items-center gap-2 text-sm font-medium text-success">
              <CheckCircle2 className="size-4" strokeWidth={2} aria-hidden="true" />
              {t("nothingToFix")}
            </p>
          ) : (
            <div className="space-y-5">
              {incomplete.length > 0 && (
                <Issue
                  title={t("issueIncomplete", { count: incomplete.length })}
                  body={t("issueIncompleteBody")}
                  units={incomplete}
                  locale={locale}
                  more={t("andMore", { count: Math.max(0, incomplete.length - 4) })}
                />
              )}
              {standIn.length > 0 && (
                <Issue
                  title={t("issueStandIn", { count: standIn.length })}
                  body={t("issueStandInBody")}
                  units={standIn}
                  locale={locale}
                  more={t("andMore", { count: Math.max(0, standIn.length - 4) })}
                />
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/** A problem, and the units it is about - each one opens straight in the editor. */
function Issue({
  title,
  body,
  units,
  locale,
  more,
}: {
  title: string;
  body: string;
  units: UnitRow[];
  locale: Locale;
  more: string;
}) {
  const shown = units.slice(0, 4);
  return (
    <div>
      <p className="flex items-center gap-2 font-semibold text-warning">
        <AlertTriangle className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
        {title}
      </p>
      <p className="mt-1 text-sm text-fg-muted">{body}</p>
      <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
        {shown.map((unit) => (
          <li key={unit.id}>
            <Link
              href={`/admin/properties/${unit.id}`}
              className="flex min-h-14 items-center gap-3 px-3 py-2 transition-colors hover:bg-surface"
            >
              <UnitThumb src={unit.cover} className="size-10" sizes="2.5rem" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-fg">
                  {unit.title[locale] || unit.title.en || unit.title.ar}
                </span>
                <span className="block text-xs text-fg-subtle tabular-nums" dir="ltr">
                  {unit.refCode}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-fg-subtle rtl:-scale-x-100" strokeWidth={2} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
      {units.length > shown.length && (
        <Link href="/admin/properties" className="link mt-2 inline-block text-sm">
          {more}
        </Link>
      )}
    </div>
  );
}
