import "server-only";
import os from "node:os";
import path from "node:path";

/**
 * Where the interim JSON store lives.
 *
 * A serverless filesystem is read-only apart from the temp directory, so on
 * Vercel this points at `os.tmpdir()`. Writes then succeed and the deployed
 * preview is fully usable - the enquiry form saves, the admin can publish and
 * change status - but the data is per-instance and does not survive a cold
 * start or a new deployment.
 *
 * That is acceptable ONLY because it is temporary. Convex replaces this whole
 * layer, and until it does, the WhatsApp deep-link (not the form) is the
 * primary conversion path on every listing.
 */
const ON_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

export const DATA_DIR = ON_SERVERLESS
  ? path.join(os.tmpdir(), "alaser-data")
  : path.join(process.cwd(), ".data");

export const IS_EPHEMERAL_STORE = ON_SERVERLESS;
