import { cn } from "@/lib/utils";

/**
 * A dimension string: the line, its end ticks, and the quantity it measures.
 *
 *      |----------  142 m²  ----------|
 *
 * This is the site's only divider. It never appears without measuring
 * something real - an area, a count, a price per metre. If there is no
 * quantity, use whitespace instead.
 *
 * Symmetrical by construction, so RTL needs no special case.
 */
export function DimensionRule({
  children,
  className,
  tone = "current",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "current" | "survey" | "muted";
}) {
  return (
    <div
      className={cn(
        "dim select-none",
        tone === "survey" && "text-survey",
        tone === "muted" && "text-giza-dim",
        className,
      )}
    >
      <span className="dim-tick label shrink-0 px-2.5 tabular-nums" dir="ltr">
        {children}
      </span>
    </div>
  );
}

/** Section heading with its eyebrow, set the same way everywhere. */
export function SectionHead({
  eyebrow,
  title,
  body,
  className,
  align = "start",
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  className?: string;
  align?: "start" | "center";
}) {
  return (
    <div className={cn(align === "center" && "text-center", className)}>
      {eyebrow && <p className="label text-current/55">{eyebrow}</p>}
      <h2 className="mt-3 text-d2">{title}</h2>
      {body && (
        <p
          className={cn(
            "measure mt-5 text-lead text-current/70",
            align === "center" && "mx-auto",
          )}
        >
          {body}
        </p>
      )}
    </div>
  );
}
