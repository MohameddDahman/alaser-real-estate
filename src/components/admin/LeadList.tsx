"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { parseAsString, useQueryState } from "nuqs";
import { Download, Mail } from "lucide-react";

import { changeLeadStatus } from "@/app/actions/admin";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { LeadStatus } from "@/lib/data/inquiries";
import type { LeadRow } from "@/lib/data/lead-rows";
import { matchesSearch } from "@/lib/search-text";
import { timeAgo } from "@/lib/time-ago";
import { Select } from "@/components/ui/Select";
import { EmptyState, PageHeader } from "./ui";
import { FilterChips, SearchBox } from "./FilterBar";
import { LeadActions } from "./LeadActions";
import { Dot, LEAD_STATUS_ORDER, LEAD_TONE } from "./status";

type Filter = "all" | LeadStatus;

/**
 * The enquiry inbox. It opens on the ones nobody has answered yet; each
 * enquiry can be called or answered on WhatsApp in one tap, and moved along
 * - contacted, viewing booked, won, lost - so the list of new ones is always
 * the list of people still waiting.
 */
export function LeadList({
  leads,
  now,
  ephemeral,
}: {
  leads: LeadRow[];
  now: number;
  ephemeral: boolean;
}) {
  const t = useTranslations("admin");
  const tl = useTranslations("admin.leadStatus");
  const locale = useLocale() as Locale;

  const [param, setParam] = useQueryState("status", parseAsString.withDefault(""));
  const [query, setQuery] = useQueryState("q", parseAsString.withDefault(""));
  // Status changes show at once, before the server has answered.
  const [changed, setChanged] = useState<Record<string, LeadStatus>>({});
  // ...and a lead just moved on stays in view until the filter changes.
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const statusOf = (lead: LeadRow) => changed[lead.id] ?? lead.status;

  const counts = useMemo(() => {
    const byStatus = Object.fromEntries(LEAD_STATUS_ORDER.map((s) => [s, 0])) as Record<LeadStatus, number>;
    for (const lead of leads) byStatus[changed[lead.id] ?? lead.status]++;
    return byStatus;
  }, [leads, changed]);

  const filter: Filter =
    param === "all" || LEAD_STATUS_ORDER.includes(param as LeadStatus)
      ? (param as Filter)
      : counts.new > 0
        ? "new"
        : "all";

  const shown = leads.filter(
    (lead) =>
      (filter === "all" || statusOf(lead) === filter || touched.has(lead.id)) &&
      matchesSearch(
        [lead.name, lead.phone, lead.email, lead.ref, lead.unit?.title.en, lead.unit?.title.ar, lead.message].join(" "),
        query,
      ),
  );

  return (
    <div>
      <PageHeader
        title={t("leadsTitle")}
        subtitle={counts.new > 0 ? t("leadsWaiting", { count: counts.new }) : t("leadsAllAnswered")}
        action={
          leads.length > 0 && (
            <a href="/api/admin/leads" download className="btn btn-quiet btn-sm">
              <Download className="size-4" strokeWidth={2} aria-hidden="true" />
              {t("exportCsv")}
            </a>
          )
        }
      />

      {/* An empty inbox must not be mistaken for "nobody enquired" while the
          store is only a temporary one. */}
      {ephemeral && (
        <p className="mt-4 rounded-xl border border-warning/40 bg-warning-soft p-4 text-sm text-fg">{t("leadsEphemeral")}</p>
      )}

      {leads.length === 0 ? (
        <EmptyState className="mt-4">{t("leadsEmpty")}</EmptyState>
      ) : (
        <>
          <div className="mt-4 space-y-3">
            <SearchBox value={query} onChange={(value) => void setQuery(value || null)} placeholder={t("searchLeads")} />
            <FilterChips<Filter>
              label={t("filterByStatus")}
              value={filter}
              onChange={(value) => {
                setTouched(new Set());
                void setParam(value);
              }}
              options={[
                ...LEAD_STATUS_ORDER.map((status) => ({
                  value: status,
                  label: tl(status),
                  count: counts[status],
                  tone: LEAD_TONE[status],
                })),
                { value: "all" as const, label: t("filterAll"), count: leads.length },
              ]}
            />
          </div>

          {shown.length === 0 ? (
            <EmptyState className="mt-4">{query ? t("noLeadsMatch") : t("noLeadsHere")}</EmptyState>
          ) : (
            <ul className="mt-4 grid gap-3 xl:grid-cols-2">
              {shown.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  status={statusOf(lead)}
                  locale={locale}
                  now={now}
                  onStatus={(status) => {
                    setChanged((map) => ({ ...map, [lead.id]: status }));
                    setTouched((ids) => new Set(ids).add(lead.id));
                  }}
                  onFailed={(previous) => setChanged((map) => ({ ...map, [lead.id]: previous }))}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function LeadCard({
  lead,
  status,
  locale,
  now,
  onStatus,
  onFailed,
}: {
  lead: LeadRow;
  status: LeadStatus;
  locale: Locale;
  now: number;
  onStatus: (status: LeadStatus) => void;
  onFailed: (previous: LeadStatus) => void;
}) {
  const t = useTranslations("admin");
  const tl = useTranslations("admin.leadStatus");
  const [pending, start] = useTransition();

  return (
    <li className="flex flex-col rounded-xl border border-line bg-canvas p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[1.0625rem] font-semibold text-fg">{lead.name}</p>
          <p className="mt-0.5 text-sm text-fg-muted">
            {timeAgo(lead.createdAt, now, locale)} · {lead.locale === "ar" ? t("wroteArabic") : t("wroteEnglish")}
          </p>
        </div>
        <Select
          variant="pill"
          label={t("changeLeadStatus")}
          value={status}
          disabled={pending}
          className="shrink-0"
          leading={<Dot className={LEAD_TONE[status]} />}
          options={LEAD_STATUS_ORDER.map((value) => ({ value, label: tl(value) }))}
          onChange={(value) => {
            const next = value as LeadStatus;
            const previous = status;
            onStatus(next);
            const data = new FormData();
            data.set("id", lead.id);
            data.set("status", next);
            start(async () => {
              const result = await changeLeadStatus(data).catch(() => ({ ok: false }));
              if (!result.ok) onFailed(previous);
            });
          }}
        />
      </div>

      <a href={`tel:${lead.phone}`} dir="ltr" className="mt-3 self-start text-[1.0625rem] font-semibold text-primary tabular-nums hover:underline">
        {lead.phone}
      </a>
      {lead.email && (
        <a href={`mailto:${lead.email}`} className="mt-1 inline-flex items-center gap-1.5 self-start text-sm text-fg-muted hover:text-fg">
          <Mail className="size-3.5" strokeWidth={2} aria-hidden="true" />
          <span dir="ltr">{lead.email}</span>
        </a>
      )}

      {lead.ref && (
        <p className="mt-2 text-sm text-fg-muted">
          {t("aboutUnit")}{" "}
          {lead.unit ? (
            <Link href={`/admin/properties/${lead.unit.id}`} className="link">
              <span dir="ltr" className="tabular-nums">
                {lead.ref}
              </span>
              {" · "}
              {lead.unit.title[locale] || lead.unit.title.en}
            </Link>
          ) : (
            <span dir="ltr" className="font-medium text-fg tabular-nums">
              {lead.ref}
            </span>
          )}
        </p>
      )}

      {lead.message && (
        <p className="mt-3 whitespace-pre-line rounded-lg bg-surface p-3 text-sm leading-relaxed text-fg" dir="auto">
          {lead.message}
        </p>
      )}

      <LeadActions phone={lead.phone} whatsapp={lead.whatsapp} className="mt-auto pt-4" />
    </li>
  );
}
