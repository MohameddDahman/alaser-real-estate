import { setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { allProperties } from "@/lib/data/store";
import { toUnitRow } from "@/lib/data/admin-rows";
import { UnitList } from "@/components/admin/UnitList";

export default async function AdminPropertiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  // Codes are handed out in order, so the highest first puts a unit added today at the top.
  const units = (await allProperties())
    .map(toUnitRow)
    .sort((a, b) => b.refCode.localeCompare(a.refCode));

  return <UnitList units={units} />;
}
