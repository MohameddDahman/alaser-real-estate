"use server";

import { headers } from "next/headers";

import { saveInquiry } from "@/lib/data/inquiries";
import { isEgyptianMobile, toLatinDigits } from "@/lib/utils";

/**
 * Public enquiry submission.
 *
 * Three defences, none of them a visible captcha - a captcha on a property
 * enquiry form costs more real leads than the spam it stops:
 *   1. honeypot field that a human never sees and never fills
 *   2. timing check: a form completed in under 2.5s was not typed by a person
 *   3. per-IP rate limit
 *
 * Validation runs here, on the server, regardless of what the client checked.
 */

export type InquiryState = {
  ok: boolean;
  /** Translation keys, resolved in the component so errors stay bilingual. */
  fieldErrors?: Partial<Record<"name" | "phone", "required" | "phone">>;
  formError?: "generic" | "rate";
};

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 3;
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear(); // crude ceiling; Convex replaces this
  return recent.length > MAX_PER_WINDOW;
}

export async function submitInquiry(
  _prev: InquiryState,
  formData: FormData,
): Promise<InquiryState> {
  // 1. Honeypot. Accept silently so a bot learns nothing from the response.
  if (String(formData.get("company") ?? "").trim() !== "") {
    return { ok: true };
  }

  // 2. Timing.
  const startedAt = Number(formData.get("startedAt") ?? 0);
  if (!startedAt || Date.now() - startedAt < 2_500) {
    return { ok: false, formError: "generic" };
  }

  // 3. Rate limit.
  const head = await headers();
  const ip = (head.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  if (rateLimited(ip)) {
    return { ok: false, formError: "rate" };
  }

  const name = String(formData.get("name") ?? "").trim();
  // Stored with Latin digits, so the tel: and WhatsApp links work whatever keyboard typed it.
  const phone = toLatinDigits(String(formData.get("phone") ?? "")).trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const propertyRefCode = String(formData.get("refCode") ?? "").trim();
  const locale = String(formData.get("locale") ?? "en");

  const fieldErrors: InquiryState["fieldErrors"] = {};
  if (!name) fieldErrors.name = "required";
  if (!phone) fieldErrors.phone = "required";
  else if (!isEgyptianMobile(phone)) fieldErrors.phone = "phone";

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  try {
    await saveInquiry({
      name,
      phone,
      email: email || undefined,
      message: message || undefined,
      propertyRefCode: propertyRefCode || undefined,
      source: "form",
      locale,
    });
    return { ok: true };
  } catch {
    return { ok: false, formError: "generic" };
  }
}
