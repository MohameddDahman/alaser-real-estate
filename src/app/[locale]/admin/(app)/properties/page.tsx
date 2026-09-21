import { getTranslations, setRequestLocale } from "next-intl/server";
import { ExternalLink, Pencil } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { UnitThumb } from "@/components/admin/UnitThumb";
import { allProperties } from "@/lib/data/store";
import { attachPhotos, planForProperty } from "@/lib/data";
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
  // Photography attached, so the list shows what visitors actually see.
  const properties = (await allProperties()).map(attachPhotos);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-d3">{t("propertiesTitle")}</h1>
        <p className="font-data text-data text-ink/55 tabular-nums">{properties.length}</p>
      </div>

      {/* A table on a laptop, stacked cards on a phone. Same data, no
          horizontal scrolling on a device held in one hand. */}
      <div className="mt-8 border-t border-sheet-edge">
        <div className="hidden grid-cols-[4.5rem_6rem_minmax(0,1fr)_8rem_9rem_9rem_4.5rem] items-center gap-4 border-b border-sheet-edge py-2.5 lg:grid">
          {(["", "colRef", "colTitle", "colArea", "colStatus", "colPrice", ""] as const).map(
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
                className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 py-4 lg:grid-cols-[4.5rem_6rem_minmax(0,1fr)_8rem_9rem_9rem_4.5rem] lg:items-center lg:py-2.5"
              >
                <Link
                  href={`/admin/properties/${property._id}`}
                  aria-hidden="true"
                  tabIndex={-1}
                  className="block"
                >
                  <UnitThumb
                    image={property.coverImage ?? property.gallery[0]}
                    plan={planForProperty(property)}
                    count={property.gallery.length}
                    className="aspect-[4/3] w-full"
                    sizes="5rem"
                  />
                </Link>

                {/* `lg:contents` dissolves this wrapper on a laptop so its
                    children become cells of the table grid, while on a phone
                    it keeps them stacked beside the thumbnail. */}
                <div className="min-w-0 space-y-2 lg:contents">
                  <span
                    className="block font-data text-data text-ink/60 tabular-nums"
                    dir="ltr"
                  >
                    {property.refCode}
                  </span>

                  <span className="block min-w-0">
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

                  <span className="label block text-ink/60">{area?.name[locale]}</span>

                  <span className="block">
                    <StatusSelect id={property._id} status={property.status} />
                  </span>

                  <span className="block font-data text-data tabular-nums" dir="ltr">
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
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
