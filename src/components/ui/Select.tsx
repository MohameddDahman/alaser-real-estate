"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

const LIST_MAX = 288; // px - the list's max-h-72
const ROW = 44; // px - one option, for deciding which way to open

/**
 * A dropdown that looks like the rest of the site.
 *
 * The browser's own option list cannot be styled consistently - on Windows
 * it is a square system panel narrower than the field it belongs to - so
 * this draws its own, following the WAI-ARIA "select-only combobox"
 * pattern: focus stays on the trigger, which points at the highlighted
 * option with aria-activedescendant.
 *
 * Keyboard: Enter, Space or the arrows open it; the arrows, Home and End
 * move; typing jumps to the first option that starts with what was typed;
 * Enter or Space chooses; Escape and Tab close it. It opens upward when
 * there is no room below, and every edge is logical, so it is correct in
 * Arabic with no extra rules.
 */
export function Select({
  label,
  value,
  options,
  onChange,
  icon: Icon,
  variant = "field",
  name,
  className,
  triggerClassName,
  leading,
  disabled,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  icon?: LucideIcon;
  /**
   * `field`: a search-box field, label above value. `pill`: a compact control.
   * `form`: a bordered form field with its label shown above it.
   */
  variant?: "field" | "pill" | "form";
  /** Submits the value with a surrounding form. */
  name?: string;
  className?: string;
  /** Extra classes for the button, e.g. to colour a status. */
  triggerClassName?: string;
  /** Drawn before the chosen value, e.g. a status dot. */
  leading?: React.ReactNode;
  disabled?: boolean;
}) {
  const id = useId();
  const labelId = `${id}-label`;
  const listId = `${id}-list`;
  const optionId = (i: number) => `${id}-opt-${i}`;

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [up, setUp] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", at: 0 });

  const found = options.findIndex((option) => option.value === value);
  const selectedIndex = found === -1 ? 0 : found;
  const selected = options[selectedIndex];

  function openAt(index: number) {
    // Decide the side before the list exists, so it never flashes the wrong
    // way. It drops down unless fewer than about three rows would show below
    // - a list cut short at the fold is one scroll away, a list that jumps
    // over the field is not what anyone expects from a dropdown.
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const want = Math.min(LIST_MAX, options.length * ROW + 14);
      const below = window.innerHeight - rect.bottom;
      setUp(below < Math.min(want, 3 * ROW + 14) + 8 && rect.top > below);
    }
    setActive(index);
    setOpen(true);
  }

  function choose(index: number) {
    const option = options[index];
    if (option && option.value !== value) onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  /** Type-ahead: the next option whose label starts with what was typed. */
  function match(key: string): number | undefined {
    const now = Date.now();
    const t = typed.current;
    t.text = now - t.at > 600 ? key : t.text + key;
    t.at = now;
    const query = t.text.toLocaleLowerCase();
    // A single repeated letter steps through the options that start with it.
    const from = (open ? active : selectedIndex) + (query.length === 1 ? 1 : 0);
    for (let step = 0; step < options.length; step++) {
      const i = (from + step) % options.length;
      if (options[i].label.toLocaleLowerCase().startsWith(query)) return i;
    }
    return undefined;
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const last = options.length - 1;
    const typing = Date.now() - typed.current.at < 600 && typed.current.text !== "";

    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && (event.key !== " " || typing)) {
      const hit = match(event.key);
      if (hit !== undefined) {
        event.preventDefault();
        if (open) setActive(hit);
        else openAt(hit);
      }
      return;
    }

    if (!open) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openAt(selectedIndex);
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        openAt(event.key === "Home" ? 0 : last);
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActive((i) => Math.min(last, i + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        break;
      case "Home":
      case "PageUp":
        event.preventDefault();
        setActive(0);
        break;
      case "End":
      case "PageDown":
        event.preventDefault();
        setActive(last);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        choose(active);
        break;
      case "Escape":
        event.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  // A press anywhere else closes it.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // Keep the highlighted option in view - by scrolling the list, never the page.
  useEffect(() => {
    const list = listRef.current;
    const row = list?.children[active] as HTMLElement | undefined;
    if (!open || !list || !row) return;
    if (row.offsetTop < list.scrollTop) list.scrollTop = row.offsetTop - 6;
    else if (row.offsetTop + row.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = row.offsetTop + row.offsetHeight - list.clientHeight + 6;
  }, [open, active]);

  const pill = variant === "pill";
  const form = variant === "form";

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {name && <input type="hidden" name={name} value={value} />}

      {form && (
        <span id={labelId} className="mb-1.5 block text-sm font-medium text-fg">
          {label}
        </span>
      )}

      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={labelId}
        aria-activedescendant={open ? optionId(active) : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openAt(selectedIndex))}
        onKeyDown={onKeyDown}
        onBlur={() => setOpen(false)}
        className={cn(
          "flex w-full cursor-pointer items-center text-start transition-colors disabled:cursor-default disabled:opacity-60",
          pill &&
            "min-h-10 gap-2 rounded-full border border-line-strong bg-canvas px-3.5 text-sm font-medium text-fg hover:border-fg-subtle aria-expanded:border-primary",
          form &&
            "min-h-11 gap-2 rounded-md border border-line-strong bg-canvas px-3.5 text-[1rem] text-fg outline-none hover:border-fg-subtle focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_rgb(31_90_209/0.18)] aria-expanded:border-primary",
          !pill &&
            !form &&
            "min-h-12 gap-2.5 rounded-lg bg-canvas px-3.5 md:min-h-14 md:gap-3 md:px-4 md:py-1.5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary aria-expanded:outline-2 aria-expanded:-outline-offset-2 aria-expanded:outline-primary",
          triggerClassName,
        )}
      >
        {Icon && (
          <Icon
            className={cn("shrink-0", pill ? "size-4 text-fg-muted" : "size-[1.125rem] text-fg-subtle md:size-5")}
            strokeWidth={pill ? 2 : 1.75}
            aria-hidden="true"
          />
        )}
        {leading}

        <span className="min-w-0 flex-1">
          {!form && (
            <span
              id={labelId}
              className={pill ? "sr-only" : "sr-only md:not-sr-only md:block md:text-xs md:text-fg-subtle"}
            >
              {label}
            </span>
          )}
          <span
            className={cn(
              "block truncate",
              !pill && !form && "text-[0.9375rem] font-medium text-fg md:text-[1rem]",
            )}
          >
            {selected?.label}
          </span>
        </span>

        <ChevronDown
          className={cn(
            "shrink-0 text-fg-muted transition-transform duration-200",
            pill ? "size-4" : "size-4 md:size-5",
            open && "rotate-180",
          )}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>

      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        aria-labelledby={labelId}
        tabIndex={-1}
        hidden={!open}
        // Keep focus on the trigger while the list is pressed.
        onPointerDown={(event) => event.preventDefault()}
        className={cn(
          "animate-pop-in absolute z-50 max-h-72 min-w-full overflow-y-auto overscroll-contain rounded-lg border border-line bg-canvas p-1.5 shadow-pop",
          up ? "bottom-full mb-1.5 origin-bottom" : "top-full mt-1.5 origin-top",
          pill ? "end-0 w-max min-w-full max-w-[min(20rem,calc(100vw-2rem))]" : "start-0",
        )}
      >
        {options.map((option, i) => {
          const isSelected = i === selectedIndex;
          return (
            <li
              key={option.value}
              id={optionId(i)}
              role="option"
              aria-selected={isSelected}
              onPointerMove={() => setActive(i)}
              onClick={() => choose(i)}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2.5 text-[0.9375rem] leading-snug text-fg",
                i === active && "bg-surface-2",
                isSelected && "font-semibold text-primary",
              )}
            >
              <span className="min-w-0">{option.label}</span>
              <Check
                className={cn("size-4 shrink-0", isSelected ? "opacity-100" : "opacity-0")}
                strokeWidth={2.5}
                aria-hidden="true"
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
