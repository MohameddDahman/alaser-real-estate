import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ExternalLink } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { isAuthed } from "@/lib/admin-auth";
import { signOut } from "@/app/actions/admin";
import { AdminNav } from "@/components/admin/AdminNav";
import { Mark } from "@/components/brand/Mark";
import { LocaleSwitch } from "@/components/layout/LocaleSwitch";
import type { Locale } from "@/i18n/routing";

export const metadata = { robots: { index: false, follow: false } };

/**
 * Admin shell.
 *
 * Deliberately light, flat and quiet: this is a tool the client uses from a
 * laptop and from the car, not a piece of marketing. It borrows the public
 * site's type and spacing so it feels like the same product, and none of its
 * motion.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  if (!(await isAuthed())) redirect(`/${locale}/admin/login`);

  const t = await getTranslations("admin");

  return (
    <div className="on-sheet min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-sheet-edge bg-sheet/95 backdrop-blur-[2px]">
        <div className="mx-auto flex max-w-[92rem] items-center gap-4 px-4 py-3 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2.5 text-ink">
            <Mark className="h-6 w-auto" />
            <span className="label">{t("brand")}</span>
          </Link>

          <div className="ms-auto flex items-center gap-4">
            <LocaleSwitch className="text-ink/60 hover:text-ink" />
            <Link
              href="/"
              className="label hidden items-center gap-1.5 text-ink/60 transition-colors hover:text-ink sm:inline-flex"
            >
              {t("viewSite")}
              <ExternalLink className="size-3" strokeWidth={1.75} aria-hidden="true" />
            </Link>
            <form action={signOut}>
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                className="label min-h-11 cursor-pointer border border-sheet-edge px-3 text-ink transition-colors hover:border-ink"
              >
                {t("signOut")}
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[92rem] gap-10 px-4 pb-28 pt-8 sm:px-6 lg:pb-16">
        <AdminNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
