import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { UnitEditor } from "@/components/admin/UnitEditor";
import { getPropertyById } from "@/lib/data/store";
import { attachPhotos } from "@/lib/data";

export default async function AdminPropertyEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);

  const unit = await getPropertyById(id);
  if (!unit) notFound();

  // The editor works on the unit's OWN photographs. Stand-ins are only
  // shown, never handed to it - saving must not store them as if they were
  // real photographs of this flat.
  const standInCover = unit.gallery.length === 0 ? attachPhotos(unit).gallery[0]?.src : undefined;

  return (
    <UnitEditor
      // Deleting or restoring starts the editor afresh from what is stored.
      key={unit.status === "archived" ? "deleted" : "live"}
      unit={unit}
      refCode={unit.refCode}
      standInCover={standInCover}
      created={(await searchParams).created === "1"}
    />
  );
}
