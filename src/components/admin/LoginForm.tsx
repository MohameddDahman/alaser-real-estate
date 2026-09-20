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
        <label htmlFor="password" className="label block text-giza-dim">
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
          className="mt-2 min-h-12 w-full border border-navy-edge bg-navy-lift px-3.5 text-[1rem] text-sheet outline-none transition-colors duration-150 focus:border-survey"
        />
      </div>

      {state.error && (
        <p id="login-error" role="alert" className="text-[0.9rem] text-danger">
          {state.error === "unconfigured" ? t("notConfigured") : t("wrongPassword")}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="label min-h-12 w-full cursor-pointer bg-survey-deep px-6 text-sheet transition-colors duration-200 hover:bg-survey hover:text-navy disabled:opacity-60"
      >
        {t("signIn")}
      </button>
    </form>
  );
}
