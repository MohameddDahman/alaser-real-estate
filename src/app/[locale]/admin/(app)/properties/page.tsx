import { getTranslations, setRequestLocale } from "next-intl/server";
import { ExternalLink, Pencil } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { allProperties } from "@/lib/data/store";
import { areas } from "@/content/client-facts";
import { formatPrice } from "@/lib/utils";

export default async function AdminPropertiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations("admin");
  const properties = await allProperties();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-d3">{t("propertiesTitle")}</h1>
        <p className="font-data text-data text-ink/55 tabular-nums">{properties.length}</p>
      </div>

      {/* A table on a laptop, stacked cards on a phone. Same data, no
          horizontal scrolling on a device held in one hand. */}
      <div className="mt-8 border-t border-sheet-edge">
        <div className="hidden grid-cols-[7rem_1fr_9rem_9rem_10rem_5rem] items-center gap-4 border-b border-sheet-edge py-2.5 lg:grid">
          {(["colRef", "colTitle", "colArea", "colStatus", "colPrice", ""] as const).map(
            (key, i) => (
              <span key={i} className="label text-ink/50">
                {key ? t(key) : ""}
              </span>
            ),
          )}
        </div>

        <ul className="divide-y divide-sheet-edge">
          {properties.map((property) => {
            const area = areas.find((a) => a.slug === property.location.area);
            const price = property.price.onRequest
              ? "—"
              : formatPrice(property.price.amount!, locale, property.price.currency);

            return (
              <li
                key={property._id}
                className="grid gap-x-4 gap-y-3 py-4 lg:grid-cols-[7rem_1fr_9rem_9rem_10rem_5rem] lg:items-center lg:py-2.5"
              >
                <span className="font-data text-data text-ink/60 tabular-nums" dir="ltr">
                  {property.refCode}
                </span>

                <span className="min-w-0">
                  <Link
                    href={`/admin/properties/${property._id}`}
                    className="block truncate font-medium underline-offset-4 hover:underline"
                  >
                    {property.title[locale] || property.title.en}
                  </Link>
                  {!property.title.ar.trim() && (
                    <span className="label text-danger">{t("nagArabic")}</span>
                  )}
                </span>

                <span className="label text-ink/60">{area?.name[locale]}</span>

                <StatusSelect id={property._id} status={property.status} />

                <span className="font-data text-data tabular-nums" dir="ltr">
                  {price}
                </span>

                <span className="flex items-center gap-1">
                  <Link
                    href={`/admin/properties/${property._id}`}
                    className="flex size-11 items-center justify-center text-ink/60 transition-colors hover:text-ink"
                  >
                    <span className="sr-only">{t("edit")}</span>
                    <Pencil className="size-4" strokeWidth={1.75} aria-hidden="true" />
                  </Link>
                  <Link
                    href={`/properties/${property.slug}`}
                    className="flex size-11 items-center justify-center text-ink/60 transition-colors hover:text-ink"
                  >
                    <span className="sr-only">{t("open")}</span>
                    <ExternalLink className="size-4" strokeWidth={1.75} aria-hidden="true" />
                  </Link>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
