"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

import { submitInquiry, type InquiryState } from "@/app/actions/inquiry";
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
      <div className="border border-available/40 bg-available/5 p-6" role="status">
        <p className="label flex items-center gap-2 text-available">
          <Check className="size-4" strokeWidth={2.5} aria-hidden="true" />
          {t("successTitle")}
        </p>
        <p className="measure mt-3 text-giza">{t("successBody")}</p>
      </div>
    );
  }

  const hasErrors = Boolean(state.fieldErrors || state.formError);

  return (
    <form action={action} className="space-y-5" noValidate>
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
          <p className="border border-danger/50 bg-danger/10 px-4 py-3 text-danger">
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
        <p className="label text-survey" dir="ltr">
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
        className="label min-h-12 w-full cursor-pointer bg-survey-deep px-6 text-sheet transition-colors duration-200 hover:bg-survey hover:text-navy disabled:cursor-wait disabled:opacity-60 sm:w-auto"
      >
        {pending ? t("submitting") : t("submit")}
      </button>

      <p className="text-[0.8rem] text-giza-dim">{t("consent")}</p>
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
  const shared = cn(
    "min-h-12 w-full border bg-navy-lift px-3.5 py-3 text-[1rem] text-sheet outline-none transition-colors duration-150",
    "placeholder:text-giza-dim/60",
    error ? "border-danger" : "border-navy-edge focus:border-survey",
  );

  return (
    <div>
      <label htmlFor={name} className="label block text-giza-dim">
        {label}
        {required && (
          <span className="ms-1 text-danger" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className="mt-2">
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
        <p id={errorId} className="mt-2 text-[0.85rem] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
