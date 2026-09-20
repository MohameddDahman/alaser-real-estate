import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * INTERIM ADMIN GATE.
 *
 * The contract specifies Better Auth with the Convex adapter, roles
 * (owner / agent / viewer) and authorisation enforced inside Convex functions.
 * None of that can exist until the client's Convex account does, and shipping
 * an unprotected /admin in the meantime is not an option - so this is a
 * deliberately small stand-in:
 *
 *   - one shared password from the environment, never in the repo
 *   - an HMAC-signed, httpOnly, sameSite=lax session cookie with an expiry
 *   - constant-time comparison on both the password and the signature
 *
 * What it is NOT: multi-user, role-aware, or a substitute for server-side
 * authorisation on each mutation. Replacing it is the first task of the Convex
 * step, and every admin mutation already routes through one module so the
 * checks have a single place to live.
 */

const COOKIE = "alaser_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12;

const SECRET = process.env.ADMIN_SESSION_SECRET ?? "";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "";

/** Without both env vars the admin refuses to authenticate at all. */
export function isAdminConfigured(): boolean {
  return SECRET.length >= 16 && PASSWORD.length >= 8;
}

function sign(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function verifyPassword(input: string): boolean {
  if (!isAdminConfigured()) return false;
  return safeEqual(input, PASSWORD);
}

export async function createSession(): Promise<void> {
  const expires = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = String(expires);
  const jar = await cookies();

  jar.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function isAuthed(): Promise<boolean> {
  if (!isAdminConfigured()) return false;

  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;

  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return false;
  if (!safeEqual(signature, sign(payload))) return false;

  return Number(payload) > Date.now();
}
