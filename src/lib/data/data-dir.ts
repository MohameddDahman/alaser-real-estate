import "server-only";
import os from "node:os";
import path from "node:path";

import { STORE_ENABLED } from "./convex-store";

/**
 * Where the JSON store lives when Convex is not in use.
 *
 * Locally that is .data/ (gitignored: leads carry phone numbers). Deployed,
 * Convex takes over (see convex-store.ts); only a deployment without
 * one falls back to `os.tmpdir()`, which a serverless function may write but
 * does not keep across a cold start or a redeploy.
 */
const ON_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

export const DATA_DIR = ON_SERVERLESS
  ? path.join(os.tmpdir(), "alaser-data")
  : path.join(process.cwd(), ".data");

/** True only when the data would vanish: serverless, and no Convex. */
export const IS_EPHEMERAL_STORE = ON_SERVERLESS && !STORE_ENABLED;
