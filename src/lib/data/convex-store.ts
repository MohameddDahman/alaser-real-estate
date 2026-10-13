import "server-only";
import { ConvexHttpClient } from "convex/browser";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

/**
 * Durable storage for the dashboard: the client's Convex project
 * (alaser-realestate), which holds the edits, the enquiries and every
 * photograph. See convex/store.ts for the functions and convex/schema.ts for
 * how each shape is kept:
 *
 *   - documents (the edits made in admin): every save is a new version; the
 *     newest is the document, and ten older ones are kept as history.
 *   - records (the enquiries): one row each, never rewritten, so two
 *     visitors sending the form in the same second cannot clobber each other.
 *   - files: photographs, in Convex file storage.
 *
 * Every call carries ALASER_SERVER_KEY, which only this server and the
 * Convex deployment know. Production and preview point at different Convex
 * deployments (CONVEX_URL), so a preview can never touch real leads.
 *
 * Used on Vercel whenever Convex is configured; locally only when
 * ALASER_STORE=convex, so development never writes to live data.
 */

const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
const KEY = process.env.ALASER_SERVER_KEY;

export const STORE_ENABLED =
  Boolean(CONVEX_URL && KEY) && (Boolean(process.env.VERCEL) || process.env.ALASER_STORE === "convex");

let client: ConvexHttpClient | null = null;
function convex(): ConvexHttpClient {
  if (!CONVEX_URL || !KEY) throw new Error("CONVEX_URL and ALASER_SERVER_KEY must be set to use Convex.");
  client ??= new ConvexHttpClient(CONVEX_URL);
  return client;
}
const key = () => KEY as string;

/** The current version of a document, or null if it was never saved. */
export async function readDocument<T>(name: string): Promise<T | null> {
  const text = await convex().query(api.store.readDocument, { key: key(), name });
  return text === null ? null : (JSON.parse(text) as T);
}

/** Save a new version of a document; the oldest beyond ten are let go. */
export async function writeDocument(name: string, value: unknown): Promise<void> {
  await convex().mutation(api.store.writeDocument, { key: key(), name, text: JSON.stringify(value) });
}

/** Add one record to a collection. It is never rewritten. */
export async function appendRecord(name: string, value: unknown): Promise<void> {
  await convex().mutation(api.store.appendRecord, { key: key(), collection: name, json: JSON.stringify(value) });
}

/** Every record in a collection, oldest first. */
export async function readRecords<T>(name: string): Promise<T[]> {
  const rows = await convex().query(api.store.readRecords, { key: key(), collection: name });
  return rows.map((json) => JSON.parse(json) as T);
}

/** A one-time URL the dashboard can send one photograph to. */
export async function photoUploadUrl(): Promise<string> {
  return convex().mutation(api.store.uploadUrl, { key: key() });
}

/** Record an uploaded photograph; returns the URL the listing will use. */
export async function registerPhoto(storageId: string, path: string): Promise<string> {
  return convex().mutation(api.store.registerFile, {
    key: key(),
    storageId: storageId as Id<"_storage">,
    path,
  });
}

/**
 * Delete uploaded files for good - photographs the client has deleted from
 * Deleted items. Only files in this deployment's storage are touched, and
 * only where the store is in use: a development copy never deletes live
 * photos.
 */
export async function deleteFiles(urls: string[]): Promise<void> {
  if (!STORE_ENABLED) return;
  const ours = urls.filter((url) => {
    try {
      return new URL(url).hostname === new URL(CONVEX_URL as string).hostname;
    } catch {
      return false;
    }
  });
  if (ours.length > 0) await convex().mutation(api.store.deleteFiles, { key: key(), urls: ours });
}
