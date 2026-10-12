"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { Check, Minus, Plus } from "lucide-react";

import { cn, toLatinDigits } from "@/lib/utils";

/**
 * The editor's controls. Every one is at least 44px tall, labels sit above
 * their fields, and anything numeric accepts Arabic-Indic digits - the
 * client's phone keyboard is as likely to be Arabic as not.
 */

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-fg">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">{hint}</p>}
    </div>
  );
}

/** Digits only, typed on any keyboard, with the unit it is in beside it. */
export function NumberInput({
  id,
  name,
  value,
  onChange,
  suffix,
  placeholder,
  invalid,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  placeholder?: string;
  invalid?: boolean;
}) {
  return (
    <div className="relative" dir="ltr">
      <input
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        onChange={(event) => onChange(toLatinDigits(event.target.value).replace(/[^\d]/g, ""))}
        className={cn("field tabular-nums", suffix && "pe-16")}
      />
      {suffix && (
        <span className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2 text-sm text-fg-subtle">
          {suffix}
        </span>
      )}
    </div>
  );
}

/** Bedrooms and bathrooms: a tap each way instead of a keyboard. */
export function Stepper({
  id,
  name,
  label,
  value,
  onChange,
  max = 20,
}: {
  id: string;
  name: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
}) {
  const t = useTranslations("admin");
  const selectOnFocus = useRef(false);
  const step = "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md border border-line-strong bg-canvas text-fg transition-colors hover:bg-surface disabled:cursor-default disabled:opacity-40";
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-fg">
        {label}
      </label>
      <div className="flex items-center gap-2" dir="ltr">
        <button type="button" className={step} disabled={value <= 0} onClick={() => onChange(Math.max(0, value - 1))}>
          <span className="sr-only">{t("decrease", { label })}</span>
          <Minus className="size-4" strokeWidth={2.25} aria-hidden="true" />
        </button>
        <input
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={String(value)}
          // Clicking in selects the count, so typing "4" over "3" gives 4,
          // not 34. The mouseup that follows the click would otherwise drop
          // the selection again.
          onFocus={(event) => {
            selectOnFocus.current = true;
            event.currentTarget.select();
          }}
          onMouseUp={(event) => {
            if (selectOnFocus.current) event.preventDefault();
            selectOnFocus.current = false;
          }}
          onBlur={() => (selectOnFocus.current = false)}
          onChange={(event) => {
            const digits = toLatinDigits(event.target.value).replace(/[^\d]/g, "");
            onChange(Math.min(max, Number(digits || 0)));
          }}
          // Never narrower than two digits: squeezed by a tight column, the
          // box once shrank to its own padding and showed nothing at all.
          className="field w-16 min-w-16 shrink-0 px-1 text-center tabular-nums"
        />
        <button type="button" className={step} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>
          <span className="sr-only">{t("increase", { label })}</span>
          <Plus className="size-4" strokeWidth={2.25} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/** On or off, with the words saying what "on" means. */
export function Toggle({
  name,
  label,
  hint,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span className="min-w-0">
        <span className="block text-[0.9375rem] font-medium text-fg">{label}</span>
        {hint && <span className="mt-0.5 block text-sm text-fg-muted">{hint}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          type="checkbox"
          role="switch"
          name={name}
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="h-7 w-12 rounded-full bg-line-strong transition-colors peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary"
        />
        <span
          aria-hidden="true"
          className="absolute start-1 top-1 size-5 rounded-full bg-white shadow-card transition-[inset-inline-start] duration-150 peer-checked:start-6"
        />
      </span>
    </label>
  );
}

/** Two or three choices side by side - one tap, nothing hidden in a list. */
export function Segmented<T extends string>({
  name,
  label,
  value,
  options,
  onChange,
}: {
  name: string;
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 text-sm font-medium text-fg">{label}</legend>
      <div className="flex rounded-lg border border-line-strong bg-surface p-1">
        {options.map((option) => (
          <label key={option.value} className="flex-1">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span className="flex min-h-10 cursor-pointer items-center justify-center rounded-md px-3 text-center text-sm font-medium text-fg-muted transition-colors peer-checked:bg-canvas peer-checked:text-fg peer-checked:shadow-card peer-focus-visible:outline-2 peer-focus-visible:outline-primary">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** A choice from a handful shown as chips - for one (radio) or many (checkbox). */
export function ChipChoice({
  type,
  name,
  value,
  checked,
  onChange,
  children,
}: {
  type: "radio" | "checkbox";
  name: string;
  value: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="shrink-0">
      <input
        type={type}
        name={name}
        value={value}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-line-strong bg-canvas px-3.5 text-sm font-medium text-fg transition-colors hover:border-fg-subtle peer-checked:border-primary peer-checked:bg-primary-soft peer-checked:text-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary">
        {type === "checkbox" && checked && <Check className="size-3.5" strokeWidth={2.75} aria-hidden="true" />}
        {children}
      </span>
    </label>
  );
}
