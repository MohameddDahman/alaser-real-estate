import "server-only";
import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from "node:crypto";
import { del, list, put } from "@vercel/blob";

/**
 * Durable storage for the dashboard, on the Blob store the project already
 * has for photographs - no database account to create.
 *
 * Two shapes of data, each stored the way that cannot lose a write:
 *
 *   - documents (the edits made in admin): every save is a new, immutable
 *     file; the newest one is the document, and a few older ones are kept
 *     as history. Nothing is ever overwritten in place, so no read can see a
 *     half-written or cached-stale version.
 *   - records (the enquiries): one file each. Two visitors sending the form
 *     in the same second write two files; neither can clobber the other.
 *
 * Everything is sealed with AES-256-GCM before it leaves the server. The
 * store is public - it serves the listing photographs - so a file's URL
 * alone must never be enough to read a customer's phone number. The key is
 * derived from DATA_SECRET, or ADMIN_SESSION_SECRET when that is not set:
 * change either and what is stored becomes unreadable, so rotate sessions by
 * setting DATA_SECRET to the old value first. Files also live under a folder
 * derived from the same secret, and each deployment environment (production,
 * preview) has its own, so a preview can never touch real leads.
 *
 * Used on Vercel whenever the Blob store is connected; locally only when
 * ALASER_STORE=blob, so development never writes to live data.
 */

export const BLOB_STORE_ENABLED =
  Boolean(process.env.BLOB_READ_WRITE_TOKEN) &&
  (Boolean(process.env.VERCEL) || process.env.ALASER_STORE === "blob");

/** Versions of a document kept after each save. */
const KEEP = 10;

function secret(): string {
  const value = process.env.DATA_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!value) throw new Error("DATA_SECRET or ADMIN_SESSION_SECRET must be set to use the Blob store.");
  return value;
}

function folder(name: string): string {
  const env = process.env.VERCEL_ENV || "development";
  const hidden = createHmac("sha256", secret()).update("alaser-store-folder").digest("hex").slice(0, 32);
  return `alaser-data/${env}/${hidden}/${name}/`;
}

function key(): Buffer {
  return Buffer.from(hkdfSync("sha256", secret(), "alaser-store", "data-v1", 32));
}

function seal(value: unknown): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]);
}

function unseal<T>(bytes: Buffer): T {
  const decipher = createDecipheriv("aes-256-gcm", key(), bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(12, 28));
  const plain = Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]);
  return JSON.parse(plain.toString("utf8")) as T;
}

/** Sorts in time order as text: a fixed-width timestamp, then a tiebreak. */
function stamp(): string {
  return `${String(Date.now()).padStart(15, "0")}-${randomBytes(4).toString("hex")}`;
}

async function write(pathname: string, value: unknown) {
  await put(pathname, seal(value), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/octet-stream",
    // Every file is written once and never changed, so caching it is safe.
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  });
}

async function read<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Blob read failed: ${response.status}`);
  return unseal<T>(Buffer.from(await response.arrayBuffer()));
}

/** Every file under a folder, oldest first. */
async function all(prefix: string) {
  const files: Array<{ pathname: string; url: string }> = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    files.push(...page.blobs.map(({ pathname, url }) => ({ pathname, url })));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return files.sort((a, b) => a.pathname.localeCompare(b.pathname));
}

/* ------------------------------------------------------------------ */

/** The current version of a document, or null if it was never saved. */
export async function readDocument<T>(name: string): Promise<T | null> {
  const files = await all(folder(name));
  const newest = files.at(-1);
  return newest ? read<T>(newest.url) : null;
}

/** Save a new version of a document, and let the oldest ones go. */
export async function writeDocument(name: string, value: unknown): Promise<void> {
  const prefix = folder(name);
  await write(`${prefix}${stamp()}.bin`, value);
  const files = await all(prefix);
  const stale = files.slice(0, Math.max(0, files.length - KEEP)).map((file) => file.url);
  if (stale.length) await del(stale).catch(() => undefined);
}

/** Add one record to a collection. It is never rewritten. */
export async function appendRecord(name: string, value: unknown): Promise<void> {
  await write(`${folder(name)}${stamp()}.bin`, value);
}

/** Every record in a collection, oldest first. */
export async function readRecords<T>(name: string): Promise<T[]> {
  const files = await all(folder(name));
  const out: T[] = [];
  // A few at a time: enough to be quick, few enough to be polite.
  for (let i = 0; i < files.length; i += 8) {
    const batch = await Promise.all(
      files.slice(i, i + 8).map((file) => read<T>(file.url).catch(() => null)),
    );
    for (const record of batch) if (record !== null) out.push(record);
  }
  return out;
}
