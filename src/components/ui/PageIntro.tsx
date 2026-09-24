import { Breadcrumbs } from "./Breadcrumbs";

/** The top of every inner page: where you are, what the page is, one line on it. */
export function PageIntro({
  title,
  lead,
  crumbs,
  rtl,
  children,
}: {
  title: string;
  lead?: string;
  crumbs: Array<{ label: string; href?: string }>;
  rtl: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-line bg-surface">
      <div className="shell py-7 lg:py-10">
        <Breadcrumbs items={crumbs} rtl={rtl} />
        <h1 className="mt-3 max-w-3xl text-title font-bold text-fg">{title}</h1>
        {lead && <p className="mt-2 max-w-2xl text-fg-muted sm:text-lg">{lead}</p>}
        {children}
      </div>
    </div>
  );
}
