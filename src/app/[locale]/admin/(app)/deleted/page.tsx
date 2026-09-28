import { setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { allProperties } from "@/lib/data/store";
import { deletedItems } from "@/lib/data/admin-rows";
import { DeletedItems } from "@/components/admin/DeletedItems";

export default async function AdminDeletedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const { units, photos } = deletedItems(await allProperties());
  return <DeletedItems units={units} photos={photos} now={Date.now()} />;
}
