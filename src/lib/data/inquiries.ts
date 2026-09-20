import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";

import { DATA_DIR } from "./data-dir";
import type { Inquiry } from "./types";

/**
 * Lead storage - the second swap point for Convex.
 *
 * Until the client's Convex account exists this writes to a local JSON file so
 * nothing is lost during development and the admin inbox has something to
 * render. It is NOT durable on serverless, which is why the WhatsApp deep-link
 * - not this form - is the primary conversion path on every listing.
 *
 * When Convex is wired, `saveInquiry` becomes a single `mutation` call and
 * `listInquiries` a `query`. Nothing else changes.
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
   * Log every lead before persisting it.
   *
   * On serverless the JSON store lives in the instance's temp directory, so a
   * lead written by one instance is invisible to the instance that later
   * renders the admin inbox. The visitor is told "Sent" either way, so the
   * lead must not be recoverable ONLY from that file - this line puts it in
   * the platform's runtime logs as well, where it can always be retrieved.
   *
   * This is a safety net for the interim store, not a lead pipeline. Convex
   * removes the need for it.
   */
  console.info("[lead]", JSON.stringify(row));

  try {
    rows.unshift(row);
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(FILE, JSON.stringify(rows, null, 2), "utf8");
  } catch (error) {
    // A failed write must never turn into an error for the visitor: the lead
    // is already logged above, and losing the enquiry is the only real failure.
    console.error("[lead] persist failed", error);
  }

  return row;
}

export async function listInquiries(): Promise<StoredInquiry[]> {
  return readAll();
}
