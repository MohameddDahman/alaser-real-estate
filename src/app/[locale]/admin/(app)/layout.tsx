import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ExternalLink, LogOut } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { isAuthed } from "@/lib/admin-auth";
import { signOut } from "@/app/actions/admin";
import { listInquiries } from "@/lib/data/inquiries";
import { AdminNav } from "@/components/admin/AdminNav";
import { Mark } from "@/components/brand/Mark";
import { LocaleSwitch } from "@/components/layout/LocaleSwitch";
import type { Locale } from "@/i18n/routing";

export const metadata = { robots: { index: false, follow: false } };

/**
 * Admin shell.
 *
 * The same light, navy-topped look as the public site, so the dashboard
 * feels like the back office of the same company. It is used every day and
 * mostly from a phone: a tab bar under the thumb, big targets, and the
 * count of new enquiries always in sight.
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
  const newLeads = (await listInquiries()).filter((lead) => lead.status === "new").length;

  return (
    <div className="min-h-dvh bg-surface text-fg">
      <header className="on-navy sticky top-0 z-30 bg-navy text-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:px-6">
          <Link href="/admin" className="flex min-w-0 items-center gap-2.5 rounded-md">
            <Mark className="h-6 w-auto shrink-0" />
            <span className="truncate text-[0.95rem] font-semibold">{t("brand")}</span>
          </Link>

          <div className="ms-auto flex shrink-0 items-center gap-1">
            <LocaleSwitch
              withIcon
              className="inline-flex min-h-10 items-center gap-2 rounded-md px-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
            />
            <Link
              href="/"
              className="hidden min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-white transition-colors hover:bg-white/10 sm:inline-flex"
            >
              {t("viewSite")}
              <ExternalLink className="size-3.5" strokeWidth={2} aria-hidden="true" />
            </Link>
            <form action={signOut} className="hidden lg:block">
              <input type="hidden" name="locale" value={locale} />
              <button type="submit" className="btn btn-sm btn-on-navy ms-1">
                <LogOut className="size-4 rtl:-scale-x-100" strokeWidth={2} aria-hidden="true" />
                {t("signOut")}
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 pb-28 pt-5 sm:px-6 sm:pt-6 lg:pb-16 lg:pt-8">
        <AdminNav newLeads={newLeads} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
