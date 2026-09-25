"use client";

import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/** The search box at the top of a list. */
export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const t = useTranslations("admin");
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute start-3.5 top-1/2 size-[1.125rem] -translate-y-1/2 text-fg-subtle"
        strokeWidth={2}
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="field ps-10 pe-10 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute end-1 top-1/2 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-fg-muted hover:bg-surface hover:text-fg"
        >
          <span className="sr-only">{t("clearSearch")}</span>
          <X className="size-4" strokeWidth={2} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/**
 * One row of filters with how many are in each - on a phone it scrolls
 * sideways rather than wrapping into a wall of buttons.
 */
export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: T; label: string; count: number; tone?: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-2 pb-0.5">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <li key={option.value} className="shrink-0">
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onChange(option.value)}
                className={cn(
                  "inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-line-strong bg-canvas text-fg hover:border-fg-subtle",
                )}
              >
                {option.tone && !active && (
                  <span aria-hidden="true" className={cn("size-2 rounded-full bg-current", option.tone)} />
                )}
                {option.label}
                <span
                  className={cn(
                    "min-w-5 rounded-full px-1.5 text-center text-xs font-semibold leading-5 tabular-nums",
                    active ? "bg-white/20 text-white" : "bg-surface-2 text-fg-muted",
                  )}
                >
                  {option.count}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
