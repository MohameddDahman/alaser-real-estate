import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";

import { DATA_DIR } from "./data-dir";
import { SEED_PROPERTIES } from "./seed";
import type { Property, PropertyStatus } from "./types";

/**
 * Effective inventory = seed content + whatever the client has edited in admin.
 *
 * This is the third and last Convex swap point. Today it merges a local JSON
 * file over the seed so the admin is genuinely usable - the client can change a
 * status, fix Arabic copy, publish a draft, and see it on the public site
 * immediately. That matters because the brief says to hand the dashboard over
 * early and watch them use it; a read-only mock teaches nothing.
 *
 * When Convex is wired: `allProperties` becomes a query, `updateProperty` and
 * `createProperty` become mutations with the authorisation checks moved inside
 * them, and this file is deleted.
 */

const FILE = `${DATA_DIR}/properties.json`;

type Overrides = Record<string, Partial<Property>>;

async function readOverrides(): Promise<Overrides> {
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as Overrides;
  } catch {
    return {};
  }
}

async function writeOverrides(overrides: Overrides): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(FILE, JSON.stringify(overrides, null, 2), "utf8");
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
  const overrides = await readOverrides();
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
  const overrides = await readOverrides();
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
