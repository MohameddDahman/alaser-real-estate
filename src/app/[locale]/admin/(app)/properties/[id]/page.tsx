import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { PropertyEditor } from "@/components/admin/PropertyEditor";
import { getPropertyById } from "@/lib/data/store";
import { attachPhotos, planForProperty } from "@/lib/data";

export default async function AdminPropertyEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const stored = await getPropertyById(id);
  if (!stored) notFound();

  // The preview has to show the photography visitors get, or it is not a
  // preview. Admin skips `toPublic` so drafts and owner-private fields stay.
  const property = attachPhotos(stored);

  const t = await getTranslations("admin");
  const Arrow = locale === "ar" ? ArrowRight : ArrowLeft;

  return (
    <div>
      <Link
        href="/admin/properties"
        className="label inline-flex items-center gap-2 text-ink/55 transition-colors hover:text-ink"
      >
        <Arrow className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
        {t("propertiesTitle")}
      </Link>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-d3">{t("editorTitle")}</h1>
          <p className="mt-1 font-data text-data text-ink/55 tabular-nums" dir="ltr">
            {property.refCode}
          </p>
        </div>
        <Link
          href={`/properties/${property.slug}`}
          className="label inline-flex items-center gap-1.5 text-ink/60 transition-colors hover:text-ink"
        >
          {t("open")}
          <ExternalLink className="size-3" strokeWidth={1.75} aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-10">
        <PropertyEditor
          property={property}
          plan={planForProperty(property)}
          locale={locale}
        />
      </div>
    </div>
  );
}
