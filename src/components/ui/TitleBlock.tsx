import { cn } from "@/lib/utils";

/**
 * The title block.
 *
 * Every architectural drawing carries one in its corner: reference number,
 * scale, date, sheet. It is the site's structural device in place of the
 * `(01) / (02) / (03)` eyebrow, because a listing genuinely HAS a reference
 * number, an area and a date - the numbering encodes something true instead of
 * decorating a list that has no order.
 *
 * Used on listing cards, unit pages, area pages and the hero.
 */

export type TitleBlockField = {
  label: string;
  value: string;
  /** Data values get tabular figures and stay LTR even in Arabic. */
  numeric?: boolean;
};

export function TitleBlock({
  fields,
  className,
  compact = false,
}: {
  fields: TitleBlockField[];
  className?: string;
  compact?: boolean;
}) {
  return (
    <dl
      className={cn(
        "grid border-t border-s border-current/20",
        compact ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-4",
        className,
      )}
    >
      {fields.map((field) => (
        <div
          key={field.label}
          className="min-w-0 border-b border-e border-current/20 px-3 py-2.5"
        >
          <dt className="label text-current/55">{field.label}</dt>
          <dd
            className={cn(
              "mt-1 truncate",
              field.numeric
                ? "font-data text-data tabular-nums"
                : "font-display text-[0.9rem] [font-variation-settings:'wdth'_100,'wght'_500]",
            )}
            dir={field.numeric ? "ltr" : undefined}
          >
            {field.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
