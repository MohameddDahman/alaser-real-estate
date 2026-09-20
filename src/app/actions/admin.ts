"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createSession,
  destroySession,
  isAdminConfigured,
  isAuthed,
  verifyPassword,
} from "@/lib/admin-auth";
import { getPropertyById, setStatus, updateProperty } from "@/lib/data/store";
import type { Property, PropertyStatus } from "@/lib/data/types";
import { missingBilingualFields } from "@/lib/data/validation";

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

export type SignInState = { error?: "wrong" | "unconfigured" };

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  if (!isAdminConfigured()) return { error: "unconfigured" };

  const password = String(formData.get("password") ?? "");
  if (!verifyPassword(password)) return { error: "wrong" };

  await createSession();
  redirect(`/${String(formData.get("locale") ?? "en")}/admin`);
}

export async function signOut(formData: FormData): Promise<void> {
  await destroySession();
  redirect(`/${String(formData.get("locale") ?? "en")}/admin/login`);
}

/**
 * Status change from the list view, without opening the record - the brief
 * calls this out specifically, because "mark it sold" is the single most
 * frequent thing the client will do.
 */
export async function changeStatus(formData: FormData): Promise<void> {
  await assertAuthed();

  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as PropertyStatus;
  await setStatus(id, status);

  revalidatePath("/[locale]/admin/properties", "page");
  revalidatePath("/[locale]/properties", "page");
  revalidatePath("/[locale]", "page");
}

export type SaveState = { ok?: boolean; blocked?: string[]; error?: string };

export async function saveProperty(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await assertAuthed();

  const id = String(formData.get("id"));
  const existing = await getPropertyById(id);
  if (!existing) return { error: "not-found" };

  const patch: Partial<Property> = {
    title: {
      en: String(formData.get("title.en") ?? "").trim(),
      ar: String(formData.get("title.ar") ?? "").trim(),
    },
    description: {
      en: String(formData.get("description.en") ?? "").trim(),
      ar: String(formData.get("description.ar") ?? "").trim(),
    },
    specs: {
      ...existing.specs,
      builtUpArea: Number(formData.get("builtUpArea")) || existing.specs.builtUpArea,
      bedrooms: Number(formData.get("bedrooms")) || 0,
      bathrooms: Number(formData.get("bathrooms")) || 0,
    },
    price: {
      ...existing.price,
      amount: Number(formData.get("price")) || existing.price.amount,
    },
  };

  const intent = String(formData.get("intent") ?? "save");
  const next = { ...existing, ...patch } as Property;

  if (intent === "publish") {
    const missing = missingBilingualFields(next);
    if (missing.length > 0) return { blocked: missing };
    patch.status = "available";
    patch.publishedAt = Date.now();
  }
  if (intent === "unpublish") patch.status = "draft";
  if (intent === "archive") patch.status = "archived";

  await updateProperty(id, patch);

  revalidatePath("/[locale]/admin/properties", "page");
  revalidatePath("/[locale]/properties", "page");
  revalidatePath(`/[locale]/properties/${existing.slug}`, "page");

  return { ok: true };
}
