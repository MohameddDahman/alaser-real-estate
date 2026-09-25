import { cn } from "@/lib/utils";

/** The top of every dashboard page: what it is, and its one main action. */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-[1.5rem] font-bold leading-tight text-fg sm:text-[1.75rem]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** A white panel with a heading - the dashboard's one container. */
export function Card({
  title,
  description,
  action,
  children,
  className,
  id,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn("scroll-mt-20 rounded-xl border border-line bg-canvas p-4 shadow-card sm:p-5", className)}
    >
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="text-[1.0625rem] font-semibold leading-snug text-fg">{title}</h2>}
            {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("rounded-lg border border-dashed border-line-strong px-4 py-8 text-center text-sm text-fg-muted", className)}>
      {children}
    </p>
  );
}
