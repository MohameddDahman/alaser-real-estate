import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { revalidateTag, unstable_cache } from "next/cache";

import { DATA_DIR } from "./data-dir";
import { BLOB_STORE_ENABLED, readDocument, writeDocument } from "./blob-store";
import { SEED_PROPERTIES } from "./seed";
import type { Property, PropertyStatus } from "./types";

/**
 * Effective inventory = seed content + whatever the client has edited in admin.
 *
 * The edits are one document of overrides merged over the seed, so the admin
 * is genuinely usable - the client can change a status, fix Arabic copy,
 * publish a draft, and see it on the public site immediately. Deployed, the
 * document lives in the project's Blob store (see blob-store.ts) and survives
 * every restart and redeploy; in development it is a JSON file in .data/.
 */

const FILE = `${DATA_DIR}/properties.json`;

/** Marks everything read from the store; every write makes it stale. */
export const STORE_TAG = "alaser-store";

/**
 * An edit stored over the seed. JSON cannot hold `undefined`, so a field the
 * seed sets and the client has since cleared - a payment plan taken off - is
 * stored as `null`, or the seed's value would show through again.
 */
export type Override = { [K in keyof Property]?: Property[K] | null };
type Overrides = Record<string, Override>;

/** An edit laid over what it edits, with cleared fields removed. */
function apply(base: Partial<Property>, override: Override): Property {
  const merged: Record<string, unknown> = { ...base, ...override };
  for (const key of Object.keys(merged)) if (merged[key] === null) delete merged[key];
  return merged as Property;
}

/** Straight from the store - for building a write on what is really there. */
async function loadOverrides(): Promise<Overrides> {
  if (BLOB_STORE_ENABLED) return (await readDocument<Overrides>("properties")) ?? {};
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as Overrides;
  } catch {
    return {};
  }
}

/**
 * Through Next's data cache: the public pages ask for the inventory on
 * every render, and the store is only asked again after something changes.
 */
const readOverrides = unstable_cache(loadOverrides, ["alaser-store-properties"], {
  tags: [STORE_TAG],
});

async function writeOverrides(overrides: Overrides): Promise<void> {
  if (BLOB_STORE_ENABLED) {
    await writeDocument("properties", overrides);
  } else {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(FILE, JSON.stringify(overrides, null, 2), "utf8");
  }
  revalidateTag(STORE_TAG);
}

/** Every unit ever made, including those deleted for good. */
async function everyUnit(): Promise<Property[]> {
  const overrides = await readOverrides();
  const seeded = SEED_PROPERTIES.map((property) =>
    overrides[property._id] ? apply(property, overrides[property._id]) : property,
  );

  // Anything created in admin that has no seed counterpart.
  const extra = Object.entries(overrides)
    .filter(([id]) => !SEED_PROPERTIES.some((p) => p._id === id))
    .map(([, value]) => apply({}, value));

  return [...extra, ...seeded];
}

/** Every property the system knows about, including drafts and deleted ones. */
export async function allProperties(): Promise<Property[]> {
  return (await everyUnit()).filter((unit) => !unit.purged);
}

export async function getPropertyById(id: string): Promise<Property | null> {
  return (await allProperties()).find((p) => p._id === id) ?? null;
}

export async function updateProperty(id: string, patch: Override): Promise<void> {
  const overrides = await loadOverrides();
  overrides[id] = { ...overrides[id], ...patch };
  await writeOverrides(overrides);
}

/** The statuses a visitor can see. */
export const PUBLIC_STATUSES: readonly PropertyStatus[] = ["available", "reserved", "sold", "rented"];

/**
 * A unit keeps the date it first went on the site: marking it reserved or
 * sold must not make it look newly listed, or lose its place in "newest".
 */
export function publishedAtFor(status: PropertyStatus, existing?: number): number | undefined {
  return existing ?? (PUBLIC_STATUSES.includes(status) ? Date.now() : undefined);
}

export async function setStatus(id: string, status: PropertyStatus): Promise<void> {
  const overrides = await loadOverrides();
  const current = await getPropertyById(id);
  overrides[id] = {
    ...overrides[id],
    status,
    publishedAt: publishedAtFor(status, current?.publishedAt),
  };
  await writeOverrides(overrides);
}

export async function createProperty(property: Property): Promise<void> {
  const overrides = await loadOverrides();
  overrides[property._id] = property;
  await writeOverrides(overrides);
}

/**
 * Delete a unit for good. Everything about it goes except its reference
 * code, which stays behind so it is never handed to another unit - an old
 * enquiry that names it must not point at a different flat.
 */
export async function purgeProperty(id: string, refCode: string): Promise<void> {
  const overrides = await loadOverrides();
  overrides[id] = { _id: id, refCode, purged: true };
  await writeOverrides(overrides);
}

/**
 * Reference codes are generated, unique and immutable once published.
 * Sequential rather than random, because the client reads them down a phone.
 * Codes of units deleted for good still count, so none is ever reused.
 */
export async function nextRefCode(): Promise<string> {
  const rows = await everyUnit();
  const highest = rows.reduce((max, p) => {
    const n = Number(p.refCode.replace(/\D/g, ""));
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return `ALS-${String(highest + 1).padStart(4, "0")}`;
}

/**
 * The code a new unit was opened with, unless someone else has taken it
 * since - two people adding a unit at once must not end up sharing one.
 */
export async function freeRefCode(wanted: string): Promise<string> {
  const rows = await everyUnit();
  if (/^ALS-\d{4,}$/.test(wanted) && !rows.some((p) => p.refCode === wanted)) return wanted;
  return nextRefCode();
}
