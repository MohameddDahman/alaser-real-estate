import { v } from "convex/values";

import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

/**
 * The site's storage functions.
 *
 * Convex functions can be called by anyone who knows the deployment's URL,
 * so every one of these takes `key` and refuses to run without the right
 * one. The key is ALASER_SERVER_KEY, set on this deployment and in the
 * site's server environment only - the browser never sees it, and is handed
 * nothing but a one-time upload URL after the site has checked the session.
 */

/** Versions of a document kept after each save. */
const KEEP = 10;
/**
 * Characters per chunk. Arabic is two bytes a character in UTF-8, so this
 * keeps every chunk well under Convex's 1 MiB per document.
 */
const CHUNK = 300_000;
/** The uploader resizes to 2560px first, so nothing larger is a photograph. */
const MAX_UPLOAD = 8 * 1024 * 1024;
const UPLOAD_TYPES = ["image/webp", "image/jpeg", "image/png", "image/avif"];

function allow(key: string) {
  const expected = process.env.ALASER_SERVER_KEY;
  if (!expected || expected.length < 32) throw new Error("ALASER_SERVER_KEY is not set on this deployment.");
  // Same time whatever the key: no hint from how quickly it is refused.
  let diff = key.length ^ expected.length;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ (key.charCodeAt(i) || 0);
  if (diff !== 0) throw new Error("Not authorised");
}

const keyArg = { key: v.string() };

/* ------------------------------------------------------------------ */
/* Documents                                                           */
/* ------------------------------------------------------------------ */

async function newest(ctx: QueryCtx, name: string) {
  return ctx.db
    .query("versions")
    .withIndex("by_name_at", (q) => q.eq("name", name))
    .order("desc")
    .first();
}

async function textOf(ctx: QueryCtx, name: string, at: number, parts: number): Promise<string> {
  const chunks = await ctx.db
    .query("chunks")
    .withIndex("by_version", (q) => q.eq("name", name).eq("at", at))
    .collect();
  if (chunks.length !== parts) throw new Error(`Version ${name}@${at} is incomplete.`);
  return chunks.map((chunk) => chunk.text).join("");
}

async function insertVersion(ctx: MutationCtx, name: string, at: number, text: string, source?: string) {
  const parts = Math.max(1, Math.ceil(text.length / CHUNK));
  for (let part = 0; part < parts; part++) {
    await ctx.db.insert("chunks", { name, at, part, text: text.slice(part * CHUNK, (part + 1) * CHUNK) });
  }
  await ctx.db.insert("versions", { name, at, parts, source });
}

/** The current version of a document, or null if it was never saved. */
export const readDocument = query({
  args: { ...keyArg, name: v.string() },
  handler: async (ctx, { key, name }) => {
    allow(key);
    const version = await newest(ctx, name);
    return version ? textOf(ctx, name, version.at, version.parts) : null;
  },
});

/** Save a new version of a document, and let the oldest ones go. */
export const writeDocument = mutation({
  args: { ...keyArg, name: v.string(), text: v.string() },
  handler: async (ctx, { key, name, text }) => {
    allow(key);
    const latest = await newest(ctx, name);
    // Strictly after the newest, so two saves in one millisecond still order.
    const at = Math.max(Date.now(), (latest?.at ?? 0) + 1);
    await insertVersion(ctx, name, at, text);

    const versions = await ctx.db
      .query("versions")
      .withIndex("by_name_at", (q) => q.eq("name", name))
      .order("desc")
      .collect();
    for (const stale of versions.slice(KEEP + 1)) {
      const chunks = await ctx.db
        .query("chunks")
        .withIndex("by_version", (q) => q.eq("name", name).eq("at", stale.at))
        .collect();
      for (const chunk of chunks) await ctx.db.delete(chunk._id);
      await ctx.db.delete(stale._id);
    }
    return at;
  },
});

/** Every kept version of a document, oldest first - for checking a copy. */
export const documentHistory = query({
  args: { ...keyArg, name: v.string() },
  handler: async (ctx, { key, name }) => {
    allow(key);
    const versions = await ctx.db
      .query("versions")
      .withIndex("by_name_at", (q) => q.eq("name", name))
      .collect();
    return Promise.all(
      versions.map(async (version) => ({
        at: version.at,
        source: version.source ?? null,
        text: await textOf(ctx, name, version.at, version.parts),
      })),
    );
  },
});

/** Copy one version saved on Blob. Running it twice changes nothing. */
export const importVersion = mutation({
  args: { ...keyArg, name: v.string(), at: v.number(), text: v.string(), source: v.string() },
  handler: async (ctx, { key, name, at, text, source }) => {
    allow(key);
    const copied = await ctx.db
      .query("versions")
      .withIndex("by_source", (q) => q.eq("source", source))
      .first();
    if (copied) return "exists";
    await insertVersion(ctx, name, at, text, source);
    return "copied";
  },
});

/* ------------------------------------------------------------------ */
/* Records                                                             */
/* ------------------------------------------------------------------ */

/** Add one record to a collection. It is never rewritten. */
export const appendRecord = mutation({
  args: { ...keyArg, collection: v.string(), json: v.string(), source: v.optional(v.string()), at: v.optional(v.number()) },
  handler: async (ctx, { key, collection, json, source, at }) => {
    allow(key);
    if (source) {
      const copied = await ctx.db
        .query("records")
        .withIndex("by_source", (q) => q.eq("source", source))
        .first();
      if (copied) return "exists";
    }
    await ctx.db.insert("records", { collection, at: at ?? Date.now(), json, source });
    return "saved";
  },
});

/** Every record in a collection, oldest first. */
export const readRecords = query({
  args: { ...keyArg, collection: v.string() },
  handler: async (ctx, { key, collection }) => {
    allow(key);
    const rows = await ctx.db
      .query("records")
      .withIndex("by_collection_at", (q) => q.eq("collection", collection))
      .collect();
    return rows.map((row) => row.json);
  },
});

/* ------------------------------------------------------------------ */
/* Files                                                               */
/* ------------------------------------------------------------------ */

/** A one-time URL the browser can send one photograph to. */
export const uploadUrl = mutation({
  args: keyArg,
  handler: async (ctx, { key }) => {
    allow(key);
    return ctx.storage.generateUploadUrl();
  },
});

/**
 * Record a file that has just been uploaded, and hand back the URL the
 * listing will use. Anything that is not a photograph of sensible size is
 * deleted on the spot. Copies from Blob pass `legacyUrl` and are recorded
 * once, however often the copy is run.
 */
export const registerFile = mutation({
  args: { ...keyArg, storageId: v.id("_storage"), path: v.string(), legacyUrl: v.optional(v.string()) },
  handler: async (ctx, { key, storageId, path, legacyUrl }) => {
    allow(key);
    const meta = await ctx.db.system.get(storageId);
    if (!meta) throw new Error("Upload not found");

    if (legacyUrl) {
      const copied = await ctx.db
        .query("files")
        .withIndex("by_legacy", (q) => q.eq("legacyUrl", legacyUrl))
        .first();
      if (copied) {
        if (copied.storageId !== storageId) await ctx.storage.delete(storageId);
        return copied.url;
      }
    } else if (meta.size > MAX_UPLOAD || !UPLOAD_TYPES.includes(meta.contentType ?? "")) {
      await ctx.storage.delete(storageId);
      throw new Error("Not a photograph");
    }

    const url = await ctx.storage.getUrl(storageId);
    if (!url) throw new Error("Upload not found");
    await ctx.db.insert("files", {
      storageId,
      url,
      path,
      contentType: meta.contentType,
      size: meta.size,
      legacyUrl,
    });
    return url;
  },
});

/** Every stored file, with its checksum - for checking a copy. */
export const listFiles = query({
  args: keyArg,
  handler: async (ctx, { key }) => {
    allow(key);
    const rows = await ctx.db.query("files").collect();
    return Promise.all(
      rows.map(async (row) => {
        const meta = await ctx.db.system.get(row.storageId);
        return {
          url: row.url,
          path: row.path,
          legacyUrl: row.legacyUrl ?? null,
          size: meta?.size ?? -1,
          sha256: meta?.sha256 ?? null,
        };
      }),
    );
  },
});

/** Delete photographs for good - ones the client deleted from Deleted items. */
export const deleteFiles = mutation({
  args: { ...keyArg, urls: v.array(v.string()) },
  handler: async (ctx, { key, urls }) => {
    allow(key);
    for (const url of urls) {
      const row = await ctx.db
        .query("files")
        .withIndex("by_url", (q) => q.eq("url", url))
        .first();
      if (!row) continue;
      await ctx.storage.delete(row.storageId);
      await ctx.db.delete(row._id);
    }
  },
});
