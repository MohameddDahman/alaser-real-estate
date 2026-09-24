import { cn } from "@/lib/utils";

/** A section's title, a line under it, and optionally a link at the far end. */
export function SectionHeader({
  title,
  sub,
  action,
  as: Tag = "h2",
  id,
  className,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
  as?: "h1" | "h2";
  id?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-2", className)}>
      <div className="max-w-2xl">
        <Tag id={id} className={cn("font-bold text-fg", Tag === "h1" ? "text-title" : "text-heading")}>
          {title}
        </Tag>
        {sub && <p className="mt-1 text-fg-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
