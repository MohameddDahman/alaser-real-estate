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

type Overrides = Record<string, Partial<Property>>;

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

/** Every property the system knows about, including drafts and archived. */
export async function allProperties(): Promise<Property[]> {
  const overrides = await readOverrides();
  const seeded = SEED_PROPERTIES.map((property) =>
    overrides[property._id] ? { ...property, ...overrides[property._id] } : property,
  );

  // Anything created in admin that has no seed counterpart.
  const extra = Object.entries(overrides)
    .filter(([id]) => !SEED_PROPERTIES.some((p) => p._id === id))
    .map(([, value]) => value as Property);

  return [...extra, ...seeded];
}

export async function getPropertyById(id: string): Promise<Property | null> {
  return (await allProperties()).find((p) => p._id === id) ?? null;
}

export async function updateProperty(id: string, patch: Partial<Property>): Promise<void> {
  const overrides = await loadOverrides();
  overrides[id] = { ...overrides[id], ...patch };
  await writeOverrides(overrides);
}

export async function setStatus(id: string, status: PropertyStatus): Promise<void> {
  await updateProperty(id, {
    status,
    publishedAt: status === "available" ? Date.now() : undefined,
  });
}

export async function createProperty(property: Property): Promise<void> {
  const overrides = await loadOverrides();
  overrides[property._id] = property;
  await writeOverrides(overrides);
}

/**
 * Reference codes are generated, unique and immutable once published.
 * Sequential rather than random, because the client reads them down a phone.
 */
export async function nextRefCode(): Promise<string> {
  const rows = await allProperties();
  const highest = rows.reduce((max, p) => {
    const n = Number(p.refCode.replace(/\D/g, ""));
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return `ALS-${String(highest + 1).padStart(4, "0")}`;
}
