"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

import { submitInquiry, type InquiryState } from "@/app/actions/inquiry";
import { HouseLoader } from "@/components/ui/HouseLoader";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const initial: InquiryState = { ok: false };

export function EnquiryForm({
  refCode,
  title,
  compact = false,
}: {
  refCode?: string;
  title?: string;
  compact?: boolean;
}) {
  const t = useTranslations("contact");
  const locale = (useParams().locale as Locale) ?? "en";
  const [state, action, pending] = useActionState(submitInquiry, initial);
  const [startedAt, setStartedAt] = useState("");
  const summaryRef = useRef<HTMLDivElement>(null);

  // Timing check baseline. Set on mount so it measures a real person typing.
  useEffect(() => setStartedAt(String(Date.now())), []);

  // After a failed submit, move focus to the summary so a screen reader user
  // hears what went wrong instead of being left at the button.
  useEffect(() => {
    if (state.fieldErrors || state.formError) summaryRef.current?.focus();
  }, [state]);

  if (state.ok) {
    return (
      <div className="rounded-lg border border-success/30 bg-success-soft p-5" role="status">
        <p className="flex items-center gap-2 font-semibold text-success">
          <Check className="size-5" strokeWidth={2.5} aria-hidden="true" />
          {t("successTitle")}
        </p>
        <p className="mt-2 text-fg-muted">{t("successBody")}</p>
      </div>
    );
  }

  const hasErrors = Boolean(state.fieldErrors || state.formError);

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="startedAt" value={startedAt} />
      <input type="hidden" name="locale" value={locale} />
      {refCode && <input type="hidden" name="refCode" value={refCode} />}

      {/* Honeypot. Hidden from sight and from assistive tech; bots fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div
        ref={summaryRef}
        tabIndex={-1}
        role={hasErrors ? "alert" : undefined}
        aria-live="polite"
        className={cn("outline-none", !hasErrors && "sr-only")}
      >
        {hasErrors && (
          <p className="rounded-md border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
            {state.formError === "rate"
              ? t("errorGeneric")
              : state.formError
                ? t("errorGeneric")
                : state.fieldErrors?.phone === "phone"
                  ? t("errorPhone")
                  : t("errorRequired", { field: t("name") })}
          </p>
        )}
      </div>

      {refCode && title && (
        <p className="text-sm font-medium text-fg-muted">
          {t("aboutUnit", { ref: refCode })}
        </p>
      )}

      <Field
        name="name"
        label={t("name")}
        placeholder={t("namePlaceholder")}
        autoComplete="name"
        required
        error={state.fieldErrors?.name ? t("errorRequired", { field: t("name") }) : undefined}
      />

      <Field
        name="phone"
        label={t("phone")}
        placeholder={t("phonePlaceholder")}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        dir="ltr"
        required
        error={
          state.fieldErrors?.phone === "phone"
            ? t("errorPhone")
            : state.fieldErrors?.phone
              ? t("errorRequired", { field: t("phone") })
              : undefined
        }
      />

      {!compact && (
        <Field
          name="email"
          label={t("emailOptional")}
          type="email"
          inputMode="email"
          autoComplete="email"
          dir="ltr"
        />
      )}

      <Field
        name="message"
        label={t("message")}
        placeholder={t("messagePlaceholder")}
        textarea
      />

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary btn-lg w-full disabled:cursor-wait sm:w-auto"
      >
        {pending && <HouseLoader className="h-5 text-white" />}
        {pending ? t("submitting") : t("submit")}
      </button>

      <p className="text-xs text-fg-subtle">{t("consent")}</p>
    </form>
  );
}

function Field({
  name,
  label,
  error,
  textarea,
  required,
  ...rest
}: {
  name: string;
  label: string;
  error?: string;
  textarea?: boolean;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement & HTMLTextAreaElement>) {
  const errorId = `${name}-error`;
  const shared = "field";

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-fg">
        {label}
        {required && (
          <span className="ms-1 text-danger" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className="mt-1.5">
        {textarea ? (
          <textarea
            id={name}
            name={name}
            rows={4}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={shared}
            {...rest}
          />
        ) : (
          <input
            id={name}
            name={name}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            aria-required={required}
            className={shared}
            {...rest}
          />
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
