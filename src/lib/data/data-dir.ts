import "server-only";
import os from "node:os";
import path from "node:path";

import { BLOB_STORE_ENABLED } from "./blob-store";

/**
 * Where the JSON store lives when the Blob store is not in use.
 *
 * Locally that is .data/ (gitignored: leads carry phone numbers). Deployed,
 * the Blob store takes over (see blob-store.ts); only a deployment without
 * one falls back to `os.tmpdir()`, which a serverless function may write but
 * does not keep across a cold start or a redeploy.
 */
const ON_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

export const DATA_DIR = ON_SERVERLESS
  ? path.join(os.tmpdir(), "alaser-data")
  : path.join(process.cwd(), ".data");

/** True only when the data would vanish: serverless, and no Blob store. */
export const IS_EPHEMERAL_STORE = ON_SERVERLESS && !BLOB_STORE_ENABLED;
