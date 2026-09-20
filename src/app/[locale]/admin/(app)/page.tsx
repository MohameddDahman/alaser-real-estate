import { getTranslations, setRequestLocale } from "next-intl/server";
import { AlertTriangle, Check } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { allProperties } from "@/lib/data/store";
import { listInquiries } from "@/lib/data/inquiries";
import { OPEN_QUESTIONS } from "@/content/client-facts";
import type { PropertyStatus } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const STATUSES: PropertyStatus[] = [
  "available",
  "reserved",
  "sold",
  "rented",
  "draft",
  "archived",
];

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

  const [properties, leads] = await Promise.all([allProperties(), listInquiries()]);

  const counts = Object.fromEntries(
    STATUSES.map((s) => [s, properties.filter((p) => p.status === s).length]),
  ) as Record<PropertyStatus, number>;

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const leadsThisWeek = leads.filter((l) => l.createdAt > weekAgo).length;

  // The nag list: only counts units that are actually live, because an
  // incomplete draft is not a problem - an incomplete published unit is.
  const live = properties.filter((p) => p.status !== "draft" && p.status !== "archived");
  const missingArabic = live.filter((p) => !p.title.ar.trim() || !p.description.ar.trim());
  const missingPhotos = live.filter((p) => p.gallery.length === 0);

  const blocking = OPEN_QUESTIONS.filter((q) => q.blocking);
  const nonBlocking = OPEN_QUESTIONS.filter((q) => !q.blocking);

  return (
    <div>
      <h1 className="text-d3">{t("title")}</h1>

      <section className="mt-8">
        <h2 className="label text-ink/55">{t("byStatus")}</h2>
        <dl className="mt-3 grid grid-cols-2 border-s border-t border-sheet-edge sm:grid-cols-3 lg:grid-cols-6">
          {STATUSES.map((status) => (
            <Link
              key={status}
              href="/admin/properties"
              className="border-b border-e border-sheet-edge px-4 py-4 transition-colors hover:bg-sheet-2"
            >
              <dt className="label text-ink/55">{tp(status)}</dt>
              <dd className="mt-1.5 font-data text-[1.6rem] leading-none tabular-nums">
                {counts[status]}
              </dd>
            </Link>
          ))}
        </dl>
      </section>

      <section className="mt-10 grid gap-px border border-sheet-edge bg-sheet-edge sm:grid-cols-2">
        <Link href="/admin/leads" className="bg-sheet px-5 py-5 transition-colors hover:bg-sheet-2">
          <p className="label text-ink/55">{t("leadsWeek")}</p>
          <p className="mt-2 font-data text-[1.8rem] leading-none tabular-nums">{leadsThisWeek}</p>
        </Link>
        <Link href="/admin/leads" className="bg-sheet px-5 py-5 transition-colors hover:bg-sheet-2">
          <p className="label text-ink/55">{t("leadsAll")}</p>
          <p className="mt-2 font-data text-[1.8rem] leading-none tabular-nums">{leads.length}</p>
        </Link>
      </section>

      {/* Nag list. The client can clear it, which is the point. */}
      <section className="mt-12">
        <h2 className="label text-ink/55">{t("needsAttention")}</h2>

        {missingArabic.length === 0 && missingPhotos.length === 0 ? (
          <p className="mt-3 flex items-center gap-2 text-available">
            <Check className="size-4" strokeWidth={2} aria-hidden="true" />
            {t("nothingToFix")}
          </p>
        ) : (
          <ul className="mt-3 space-y-px bg-sheet-edge">
            {missingArabic.length > 0 && (
              <Nag
                title={t("nagArabic")}
                body={t("nagArabicBody", { count: missingArabic.length })}
                items={missingArabic.map((p) => p.refCode)}
              />
            )}
            {missingPhotos.length > 0 && (
              <Nag
                title={t("nagPhotos")}
                body={t("nagPhotosBody", { count: missingPhotos.length })}
                items={missingPhotos.map((p) => p.refCode)}
              />
            )}
          </ul>
        )}
      </section>

      {/* Outstanding client facts, straight from client-facts.ts, so nothing
          unverified quietly ships. */}
      <section className="mt-12">
        <h2 className="label text-ink/55">{t("openQuestions")}</h2>
        <ul className="mt-3 divide-y divide-sheet-edge border-y border-sheet-edge">
          {[...blocking, ...nonBlocking].map((q) => (
            <li key={q.id} className="flex gap-4 py-3.5">
              <span
                className={cn(
                  "label mt-0.5 w-28 shrink-0",
                  q.blocking ? "text-danger" : "text-ink/45",
                )}
              >
                {q.blocking ? t("blocking") : t("nonBlocking")}
              </span>
              <span className="text-[0.92rem] text-ink/80">{q.q}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Nag({ title, body, items }: { title: string; body: string; items: string[] }) {
  return (
    <li className="bg-sheet px-5 py-4">
      <p className="flex items-center gap-2 font-medium text-reserved">
        <AlertTriangle className="size-4" strokeWidth={1.75} aria-hidden="true" />
        {title}
      </p>
      <p className="mt-1.5 text-[0.92rem] text-ink/70">{body}</p>
      <p className="mt-2 font-data text-data text-ink/50 tabular-nums" dir="ltr">
        {items.join("  ·  ")}
      </p>
    </li>
  );
}
