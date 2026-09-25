"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  createSession,
  destroySession,
  isAdminConfigured,
  isAuthed,
  verifyPassword,
} from "@/lib/admin-auth";
import { LEAD_STATUSES, setLeadStatus, type LeadStatus } from "@/lib/data/inquiries";
import {
  PUBLIC_STATUSES,
  createProperty,
  freeRefCode,
  getPropertyById,
  publishedAtFor,
  setStatus,
  updateProperty,
} from "@/lib/data/store";
import type { Property, PropertyStatus } from "@/lib/data/types";
import { UNIT_STATUSES, readUnitForm, unitSlug } from "@/lib/data/unit-form";
import { missingForSite, type SiteRequirement } from "@/lib/data/validation";
import { clearMisses, isLockedOut, recordMiss } from "@/lib/login-throttle";

/**
 * Every admin mutation passes through `assertAuthed` first.
 *
 * Deliberately one choke point: when Better Auth and Convex land, the role
 * check (owner / agent / viewer) goes here and inside the Convex mutations,
 * and nothing calling these functions has to change. Route middleware protects
 * pages; this protects data.
 */
async function assertAuthed(): Promise<void> {
  if (!(await isAuthed())) {
    throw new Error("Not authorised");
  }
}

/**
 * A unit appears on nearly every page: home, listings, its own page, areas,
 * the portfolio, and the admin. So after any change, purge from the root
 * layout.
 *
 * Targeted paths are a trap here. Cache tags are built from the file path,
 * route groups included, so "/[locale]/properties" never matches the page at
 * "/[locale]/(site)/properties" and the site would silently stay stale until
 * the next deploy. At this site's size, re-rendering everything on the next
 * visit costs nothing.
 */
function refreshSite(): void {
  revalidatePath("/", "layout");
}

export type SignInState = { error?: "wrong" | "unconfigured" | "rate" };

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  if (!isAdminConfigured()) return { error: "unconfigured" };

  const ip = ((await headers()).get("x-forwarded-for") ?? "local").split(",")[0].trim();
  if (isLockedOut(ip)) return { error: "rate" };

  const password = String(formData.get("password") ?? "");
  if (!verifyPassword(password)) {
    recordMiss(ip);
    // Every wrong password costs a moment, so a script cannot rattle through a list.
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { error: isLockedOut(ip) ? "rate" : "wrong" };
  }

  clearMisses(ip);
  await createSession();
  redirect(`/${String(formData.get("locale") ?? "en")}/admin`);
}

export async function signOut(formData: FormData): Promise<void> {
  await destroySession();
  redirect(`/${String(formData.get("locale") ?? "en")}/admin/login`);
}

/**
 * Status change from the list, without opening the unit - "mark it sold" is
 * the thing the client does most, usually on a phone. A status visitors can
 * see is refused while the unit is incomplete, and the answer says what is
 * missing so the list can say it too.
 */
export type StatusResult = { ok?: boolean; blocked?: SiteRequirement[] };

export async function changeStatus(formData: FormData): Promise<StatusResult> {
  await assertAuthed();

  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as PropertyStatus;
  const unit = await getPropertyById(id);
  if (!unit || !UNIT_STATUSES.includes(status)) return {};

  if (PUBLIC_STATUSES.includes(status)) {
    const missing = missingForSite(unit);
    if (missing.length > 0) return { blocked: missing };
  }

  await setStatus(id, status);
  refreshSite();
  return { ok: true };
}

export type SaveState = {
  ok?: boolean;
  savedAt?: number;
  blocked?: SiteRequirement[];
  error?: "not-found";
};

/**
 * Save a unit - everything on the editor, photographs included, in one go.
 *
 * Without an id it creates the unit: it keeps the reference code the editor
 * was opened with unless someone took it meanwhile, and lands on the new
 * unit's own page.
 */
export async function saveUnit(_prev: SaveState, formData: FormData): Promise<SaveState> {
  await assertAuthed();

  const id = String(formData.get("id") ?? "");
  const existing = id ? await getPropertyById(id) : null;
  if (id && !existing) return { error: "not-found" };

  const refCode = existing?.refCode ?? (await freeRefCode(String(formData.get("refCode") ?? "")));
  const fields = readUnitForm(formData, existing, refCode);

  if (PUBLIC_STATUSES.includes(fields.status)) {
    const missing = missingForSite(fields);
    if (missing.length > 0) return { blocked: missing };
  }
  const publishedAt = publishedAtFor(fields.status, existing?.publishedAt);

  if (existing) {
    // A plan or cover taken off is stored as cleared, not merely left out.
    await updateProperty(existing._id, {
      ...fields,
      paymentPlan: fields.paymentPlan ?? null,
      coverImage: fields.coverImage ?? null,
      publishedAt,
    });
    refreshSite();
    return { ok: true, savedAt: Date.now() };
  }

  const unit: Property = {
    ...fields,
    _id: `p_${refCode.replace(/\D/g, "")}`,
    refCode,
    slug: unitSlug(fields, refCode),
    floorPlans: [],
    views: 0,
    publishedAt,
  };
  await createProperty(unit);
  refreshSite();
  redirect(`/${String(formData.get("locale") ?? "en")}/admin/properties/${unit._id}?created=1`);
}

/** Where the client has got to with an enquiry: called, viewing booked, won, lost. */
export async function changeLeadStatus(formData: FormData): Promise<{ ok?: boolean }> {
  await assertAuthed();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as LeadStatus;
  if (!id || !LEAD_STATUSES.includes(status)) return {};

  await setLeadStatus(id, status);
  return { ok: true };
}
