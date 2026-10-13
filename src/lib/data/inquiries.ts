import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { revalidateTag, unstable_cache } from "next/cache";

import { DATA_DIR, IS_EPHEMERAL_STORE } from "./data-dir";
import { STORE_ENABLED, appendRecord, readDocument, readRecords, writeDocument } from "./convex-store";
import type { Inquiry } from "./types";

/**
 * Lead storage.
 *
 * Deployed, each enquiry is its own row in the client's Convex project
 * (see convex-store.ts): durable, and two enquiries sent at once can never
 * overwrite each other. In development it is a JSON file in .data/.
 *
 * An enquiry is never rewritten. Where the client has got to with it - called,
 * viewing booked, won, lost - is a separate small document of statuses by
 * enquiry id, so marking a lead never touches the lead itself.
 *
 * Both are read through Next's data cache: the dashboard is opened many
 * times a day, and the store is only asked again after a new enquiry or a
 * status change.
 */

export const LEAD_STATUSES = ["new", "contacted", "viewing_booked", "won", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type StoredInquiry = Inquiry & {
  _id: string;
  status: LeadStatus;
  createdAt: number;
};

type StatusMap = Record<string, { status: LeadStatus; at: number }>;

const FILE = `${DATA_DIR}/inquiries.json`;
const STATUS_FILE = `${DATA_DIR}/lead-status.json`;
const LEADS_TAG = "alaser-leads";
const STATUS_TAG = "alaser-lead-status";

async function readAll(): Promise<StoredInquiry[]> {
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as StoredInquiry[];
  } catch {
    return [];
  }
}

async function loadRecords(): Promise<StoredInquiry[]> {
  return STORE_ENABLED ? readRecords<StoredInquiry>("inquiries") : readAll();
}

async function loadStatuses(): Promise<StatusMap> {
  if (STORE_ENABLED) return (await readDocument<StatusMap>("lead-status")) ?? {};
  try {
    return JSON.parse(await readFile(STATUS_FILE, "utf8")) as StatusMap;
  } catch {
    return {};
  }
}

const cachedRecords = unstable_cache(loadRecords, ["alaser-leads"], { tags: [LEADS_TAG] });
const cachedStatuses = unstable_cache(loadStatuses, ["alaser-lead-status"], { tags: [STATUS_TAG] });

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
  const durable = STORE_ENABLED || !IS_EPHEMERAL_STORE;
  if (!durable) console.info("[lead]", JSON.stringify(row));

  try {
    if (STORE_ENABLED) {
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
  revalidateTag(LEADS_TAG);

  return row;
}

/** Newest first, each with where the client has got to with it. */
export async function listInquiries(): Promise<StoredInquiry[]> {
  const [rows, statuses] = await Promise.all([cachedRecords(), cachedStatuses()]);
  return rows
    .map((row) => (statuses[row._id] ? { ...row, status: statuses[row._id].status } : row))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function setLeadStatus(id: string, status: LeadStatus): Promise<void> {
  // Straight from the store, so the write builds on what is really there.
  const statuses = await loadStatuses();
  statuses[id] = { status, at: Date.now() };
  if (STORE_ENABLED) {
    await writeDocument("lead-status", statuses);
  } else {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(STATUS_FILE, JSON.stringify(statuses, null, 2), "utf8");
  }
  revalidateTag(STATUS_TAG);
}
