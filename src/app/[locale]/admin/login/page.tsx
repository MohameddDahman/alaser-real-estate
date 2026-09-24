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
    <div className="flex min-h-dvh items-center justify-center bg-surface px-5 py-24">
      <div className="w-full max-w-sm rounded-xl border border-line bg-canvas p-7 shadow-raised">
        <Mark className="h-9 w-auto text-navy" />
        <h1 className="mt-5 text-heading font-bold text-fg">{t("signInTitle")}</h1>
        <p className="mt-2 text-sm text-fg-muted">{t("signInIntro")}</p>

        {!isAdminConfigured() ? (
          <p className="mt-6 rounded-md border border-warning/30 bg-warning-soft p-4 text-sm text-warning">
            {t("notConfigured")}
          </p>
        ) : (
          <div className="mt-6">
            <LoginForm locale={locale} />
          </div>
        )}
      </div>
    </div>
  );
}
