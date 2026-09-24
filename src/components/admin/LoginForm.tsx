"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { signIn, type SignInState } from "@/app/actions/admin";
import type { Locale } from "@/i18n/routing";

export function LoginForm({ locale }: { locale: Locale }) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-fg">
          {t("password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          aria-invalid={state.error === "wrong"}
          aria-describedby={state.error ? "login-error" : undefined}
          className="field mt-1.5"
        />
      </div>

      {state.error && (
        <p id="login-error" role="alert" className="text-sm text-danger">
          {state.error === "unconfigured" ? t("notConfigured") : t("wrongPassword")}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary btn-lg w-full"
      >
        {t("signIn")}
      </button>
    </form>
  );
}
