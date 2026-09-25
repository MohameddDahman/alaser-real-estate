import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";

import { DATA_DIR, IS_EPHEMERAL_STORE } from "./data-dir";
import { BLOB_STORE_ENABLED, appendRecord, readRecords } from "./blob-store";
import type { Inquiry } from "./types";

/**
 * Lead storage.
 *
 * Deployed, each enquiry is its own sealed file in the project's Blob store
 * (see blob-store.ts): durable, and two enquiries sent at once can never
 * overwrite each other. In development it is a JSON file in .data/.
 */

const FILE = `${DATA_DIR}/inquiries.json`;

export type StoredInquiry = Inquiry & {
  _id: string;
  status: "new" | "contacted" | "viewing_booked" | "won" | "lost";
  createdAt: number;
};

async function readAll(): Promise<StoredInquiry[]> {
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as StoredInquiry[];
  } catch {
    return [];
  }
}

export async function saveInquiry(inquiry: Inquiry): Promise<StoredInquiry> {
  const rows = await readAll();
  const row: StoredInquiry = {
    ...inquiry,
    _id: `inq_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    status: "new",
    createdAt: Date.now(),
  };
  /**
   * The visitor is told "Sent" whatever happens next, so a lead must never
   * exist only in a store that may not keep it. Where the store is only a
   * serverless instance's temp directory, or the write fails, the whole
   * record goes to the runtime logs, where it can always be recovered.
   * Otherwise the logs carry no phone numbers.
   */
  const durable = BLOB_STORE_ENABLED || !IS_EPHEMERAL_STORE;
  if (!durable) console.info("[lead]", JSON.stringify(row));

  try {
    if (BLOB_STORE_ENABLED) {
      await appendRecord("inquiries", row);
    } else {
      rows.unshift(row);
      await mkdir(DATA_DIR, { recursive: true });
      await writeFile(FILE, JSON.stringify(rows, null, 2), "utf8");
    }
    if (durable) console.info("[lead] saved", row._id);
  } catch (error) {
    // A failed write must never turn into an error for the visitor; losing
    // the enquiry is the only real failure, so the record goes to the logs.
    console.error("[lead] persist failed", durable ? JSON.stringify(row) : "", error);
  }

  return row;
}

/** Newest first. */
export async function listInquiries(): Promise<StoredInquiry[]> {
  const rows = BLOB_STORE_ENABLED ? await readRecords<StoredInquiry>("inquiries") : await readAll();
  return rows.sort((a, b) => b.createdAt - a.createdAt);
}
