import type { LeadStatus } from "@/lib/data/inquiries";
import type { PropertyStatus } from "@/lib/data/types";
import { cn } from "@/lib/utils";

/**
 * One colour per state, used for the dot, the badge and the chosen option,
 * so a status reads the same on every page of the dashboard.
 */
export const UNIT_TONE: Record<PropertyStatus, string> = {
  available: "text-success",
  reserved: "text-warning",
  sold: "text-fg",
  rented: "text-primary",
  draft: "text-fg-subtle",
  archived: "text-fg-subtle",
};

export const LEAD_TONE: Record<LeadStatus, string> = {
  new: "text-primary",
  contacted: "text-warning",
  viewing_booked: "text-gold-deep",
  won: "text-success",
  lost: "text-fg-subtle",
};

export const UNIT_STATUS_ORDER: PropertyStatus[] = [
  "available",
  "reserved",
  "sold",
  "rented",
  "draft",
  "archived",
];

export const LEAD_STATUS_ORDER: LeadStatus[] = ["new", "contacted", "viewing_booked", "won", "lost"];

export function Dot({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full bg-current", className)} />;
}

/** A status as a quiet label: coloured dot, plain words. */
export function StatusBadge({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", tone)}>
      <Dot />
      <span className="text-fg">{children}</span>
    </span>
  );
}
