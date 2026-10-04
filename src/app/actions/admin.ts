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
import { deleteFiles } from "@/lib/data/blob-store";
import { readDetailsForm, type DetailField } from "@/lib/data/details-form";
import { LEAD_STATUSES, setLeadStatus, type LeadStatus } from "@/lib/data/inquiries";
import {
  PUBLIC_STATUSES,
  createProperty,
  freeRefCode,
  getPropertyById,
  publishedAtFor,
  purgeProperty,
  setStatus,
  updateProperty,
} from "@/lib/data/store";
import type { Property, PropertyStatus } from "@/lib/data/types";
import { saveBusinessDetails } from "@/lib/data/site-settings";
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
  // Deleting is its own action, so a deleted unit always has somewhere to go back to.
  if (!unit || !UNIT_STATUSES.includes(status) || status === "archived") return {};

  if (PUBLIC_STATUSES.includes(status)) {
    const missing = missingForSite(unit);
    if (missing.length > 0) return { blocked: missing };
  }

  await setStatus(id, status);
  refreshSite();
  return { ok: true };
}

/** Put a unit on the home page's featured row, or take it off - from the list, in one tap. */
export async function setFeatured(formData: FormData): Promise<{ ok?: boolean }> {
  await assertAuthed();

  const id = String(formData.get("id") ?? "");
  const unit = await getPropertyById(id);
  if (!unit) return {};

  await updateProperty(id, { featured: formData.get("featured") === "1" });
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
    // Photographs taken off the unit wait in Deleted items; one that is
    // back in the gallery leaves them.
    const kept = new Set(fields.gallery.map((photo) => photo.src));
    const now = Date.now();
    const removedPhotos = [
      ...existing.gallery.map((photo) => ({ ...photo, removedAt: now })),
      ...(existing.removedPhotos ?? []),
    ]
      .filter((photo, i, all) => !kept.has(photo.src) && all.findIndex((p) => p.src === photo.src) === i)
      .slice(0, 60);

    // A plan or cover taken off is stored as cleared, not merely left out.
    await updateProperty(existing._id, {
      ...fields,
      paymentPlan: fields.paymentPlan ?? null,
      coverImage: fields.coverImage ?? null,
      removedPhotos,
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

/* ------------------------------------------------------------------ */
/* Deleted items                                                       */
/* ------------------------------------------------------------------ */

/**
 * Delete a unit: it comes off the site and out of the lists, keeps
 * everything, and remembers what it was - restoring puts it back as it was.
 * Lands on the list, which offers to undo it.
 */
export async function deleteUnit(formData: FormData): Promise<void> {
  await assertAuthed();

  const id = String(formData.get("id") ?? "");
  const unit = await getPropertyById(id);
  if (unit && unit.status !== "archived") {
    await updateProperty(id, { status: "archived", deletedAt: Date.now(), restoreStatus: unit.status });
    refreshSite();
  }
  redirect(`/${String(formData.get("locale") ?? "en")}/admin/properties?deleted=${encodeURIComponent(id)}`);
}

export type TrashResult = { ok?: boolean; restoredAs?: PropertyStatus };

export async function restoreUnit(formData: FormData): Promise<TrashResult> {
  await assertAuthed();

  const unit = await getPropertyById(String(formData.get("id") ?? ""));
  if (!unit || unit.status !== "archived") return {};
  const wanted = unit.restoreStatus && unit.restoreStatus !== "archived" ? unit.restoreStatus : "draft";
  // One no longer complete enough to show comes back as a draft.
  const status = PUBLIC_STATUSES.includes(wanted) && missingForSite(unit).length > 0 ? "draft" : wanted;

  await updateProperty(unit._id, {
    status,
    deletedAt: null,
    restoreStatus: null,
    publishedAt: publishedAtFor(status, unit.publishedAt),
  });
  refreshSite();
  return { ok: true, restoredAs: status };
}

/**
 * Delete a unit for good, photographs and all. Only from Deleted items:
 * nothing on the site can be destroyed in a single step.
 */
export async function purgeUnit(formData: FormData): Promise<TrashResult> {
  await assertAuthed();

  const unit = await getPropertyById(String(formData.get("id") ?? ""));
  if (!unit || unit.status !== "archived") return {};

  const files = [...unit.gallery, ...(unit.removedPhotos ?? [])].map((photo) => photo.src);
  await deleteFiles(files).catch((error) => console.error("[purge] photos not deleted", error));
  await purgeProperty(unit._id, unit.refCode);
  refreshSite();
  return { ok: true };
}

/** Put a removed photograph back, at the end of its unit's photographs. */
export async function restorePhoto(formData: FormData): Promise<TrashResult> {
  await assertAuthed();

  const unit = await getPropertyById(String(formData.get("id") ?? ""));
  const src = String(formData.get("src") ?? "");
  const photo = unit?.removedPhotos?.find((p) => p.src === src);
  if (!unit || !photo) return {};

  const gallery = [
    ...unit.gallery,
    {
      src: photo.src,
      alt: photo.alt,
      room: photo.room,
      width: photo.width,
      height: photo.height,
      blurDataURL: photo.blurDataURL,
      order: unit.gallery.length,
    },
  ].slice(0, 40);

  await updateProperty(unit._id, {
    gallery,
    coverImage: gallery[0],
    removedPhotos: unit.removedPhotos!.filter((p) => p.src !== src),
  });
  refreshSite();
  return { ok: true };
}

export async function purgePhoto(formData: FormData): Promise<TrashResult> {
  await assertAuthed();

  const unit = await getPropertyById(String(formData.get("id") ?? ""));
  const src = String(formData.get("src") ?? "");
  if (!unit?.removedPhotos?.some((p) => p.src === src)) return {};

  await deleteFiles([src]).catch((error) => console.error("[purge] photo not deleted", error));
  await updateProperty(unit._id, { removedPhotos: unit.removedPhotos.filter((p) => p.src !== src) });
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Business details                                                    */
/* ------------------------------------------------------------------ */

export type DetailsState = { ok?: boolean; savedAt?: number; errors?: DetailField[] };

/**
 * The phone number, WhatsApp, email, address, map pin, Facebook page and the
 * company's numbers - everywhere on the site, from one save.
 */
export async function saveDetails(_prev: DetailsState, formData: FormData): Promise<DetailsState> {
  await assertAuthed();

  const result = readDetailsForm(formData);
  if (result.errors) return { errors: result.errors };

  await saveBusinessDetails(result.details);
  refreshSite();
  return { ok: true, savedAt: Date.now() };
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
