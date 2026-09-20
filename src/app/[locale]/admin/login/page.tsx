import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { isAdminConfigured, isAuthed } from "@/lib/admin-auth";
import { LoginForm } from "@/components/admin/LoginForm";
import { Mark } from "@/components/brand/Mark";
import type { Locale } from "@/i18n/routing";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  if (await isAuthed()) redirect(`/${locale}/admin`);

  const t = await getTranslations("admin");

  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-24">
      <div className="w-full max-w-sm">
        <Mark className="h-10 w-auto text-survey" />
        <h1 className="mt-6 text-d3 text-sheet">{t("signInTitle")}</h1>
        <p className="mt-3 text-giza-dim">{t("signInIntro")}</p>

        {!isAdminConfigured() ? (
          <p className="mt-8 border border-reserved/50 bg-reserved/10 p-4 text-[0.9rem] text-reserved">
            {t("notConfigured")}
          </p>
        ) : (
          <div className="mt-8">
            <LoginForm locale={locale} />
          </div>
        )}
      </div>
    </div>
  );
}
