import { setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { UnitEditor } from "@/components/admin/UnitEditor";
import { nextRefCode } from "@/lib/data/store";

/**
 * A new unit: the same editor, empty, with the next reference code reserved
 * for it so photographs can be added before the first save. Nothing is
 * stored until Save.
 */
export default async function AdminNewPropertyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return <UnitEditor unit={null} refCode={await nextRefCode()} />;
}
