import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { revalidateTag, unstable_cache } from "next/cache";

import { DEFAULT_DETAILS, type BusinessDetails } from "@/lib/contact";
import { DATA_DIR } from "./data-dir";
import { BLOB_STORE_ENABLED, readDocument, writeDocument } from "./blob-store";

/**
 * The business details the client edits in Settings, stored like the rest
 * of the dashboard's data (a versioned, encrypted document in the Blob store;
 * .data/ in development) and read through the data cache - every page shows
 * the phone number, and the store is asked again only after a save.
 */

const FILE = `${DATA_DIR}/settings.json`;
const TAG = "alaser-settings";

async function load(): Promise<Partial<BusinessDetails>> {
  if (BLOB_STORE_ENABLED) return (await readDocument<Partial<BusinessDetails>>("settings")) ?? {};
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as Partial<BusinessDetails>;
  } catch {
    return {};
  }
}

const cached = unstable_cache(load, ["alaser-settings"], { tags: [TAG] });

export async function getBusinessDetails(): Promise<BusinessDetails> {
  return { ...DEFAULT_DETAILS, ...(await cached()) };
}

export async function saveBusinessDetails(details: BusinessDetails): Promise<void> {
  if (BLOB_STORE_ENABLED) {
    await writeDocument("settings", details);
  } else {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(FILE, JSON.stringify(details, null, 2), "utf8");
  }
  revalidateTag(TAG);
}
