import type { Property } from "./types";

/**
 * Which bilingual fields are still empty.
 *
 * Publishing is blocked on this list and the admin names the missing fields
 * rather than just refusing - a half-translated listing shows an Arabic
 * visitor an empty page, and that is the failure mode this client will
 * actually hit.
 *
 * Lives here rather than in the server-actions module because a `"use server"`
 * file may only export async functions, and this is a plain predicate that the
 * editor and the dashboard both want to call.
 */
export function missingBilingualFields(property: Property): string[] {
  const missing: string[] = [];
  if (!property.title.en.trim() || !property.title.ar.trim()) missing.push("title");
  if (!property.description.en.trim() || !property.description.ar.trim()) {
    missing.push("description");
  }
  return missing;
}
