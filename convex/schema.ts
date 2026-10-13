import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Where the site keeps everything the client adds in the dashboard.
 *
 * The app's own model (src/lib/data) stays as it is - listings are a seed
 * plus one document of edits - so Convex holds the same three shapes the
 * Blob store used to:
 *
 *   - documents: the edits, business details and lead statuses. Every save
 *     is a new version (`versions`); the newest is the document, and the ten
 *     before it are kept as history. Its text is stored in `chunks`, split
 *     where a version outgrows one Convex document (1 MiB), so a save never
 *     has to read the history to prune it.
 *   - records: the enquiries, one row each, never rewritten.
 *   - files: every photograph, in Convex file storage, with the public URL
 *     the listings point at. `legacyUrl` is where it lived on Blob before.
 *
 * Every function is reached only from the site's server, with a key the
 * browser never sees - see convex/store.ts.
 */
export default defineSchema({
  versions: defineTable({
    name: v.string(),
    /** When this version was saved, ms. */
    at: v.number(),
    parts: v.number(),
    /** Blob pathname it was copied from, for versions saved before the move. */
    source: v.optional(v.string()),
  })
    .index("by_name_at", ["name", "at"])
    .index("by_source", ["source"]),

  chunks: defineTable({
    name: v.string(),
    at: v.number(),
    part: v.number(),
    text: v.string(),
  }).index("by_version", ["name", "at", "part"]),

  records: defineTable({
    collection: v.string(),
    at: v.number(),
    json: v.string(),
    source: v.optional(v.string()),
  })
    .index("by_collection_at", ["collection", "at"])
    .index("by_source", ["source"]),

  files: defineTable({
    storageId: v.id("_storage"),
    url: v.string(),
    path: v.string(),
    contentType: v.optional(v.string()),
    size: v.number(),
    legacyUrl: v.optional(v.string()),
  })
    .index("by_url", ["url"])
    .index("by_legacy", ["legacyUrl"]),
});
