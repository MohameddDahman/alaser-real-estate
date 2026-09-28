import { setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { allProperties } from "@/lib/data/store";
import { toUnitRow } from "@/lib/data/admin-rows";
import { UnitList } from "@/components/admin/UnitList";

export default async function AdminPropertiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ deleted?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const all = await allProperties();
  // Deleted units wait in Deleted items, not here.
  const deleted = all.filter((unit) => unit.status === "archived");
  // Codes are handed out in order, so the highest first puts a unit added today at the top.
  const units = all
    .filter((unit) => unit.status !== "archived")
    .map(toUnitRow)
    .sort((a, b) => b.refCode.localeCompare(a.refCode));

  const { deleted: deletedId } = await searchParams;
  const justDeleted = deleted.find((unit) => unit._id === deletedId);

  return (
    <UnitList
      units={units}
      deletedCount={deleted.length}
      justDeleted={justDeleted && { id: justDeleted._id, ref: justDeleted.refCode }}
    />
  );
}
