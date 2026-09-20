import { NextResponse } from "next/server";

import { isAuthed } from "@/lib/admin-auth";
import { listInquiries } from "@/lib/data/inquiries";

/**
 * Lead export.
 *
 * Authorisation is checked here, on the server, not merely by hiding the
 * button - the export contains customers' phone numbers and must never be
 * reachable by URL alone.
 */
function csvCell(value: unknown): string {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  if (!(await isAuthed())) {
    return new NextResponse("Not authorised", { status: 401 });
  }

  const leads = await listInquiries();
  const header = ["date", "name", "phone", "email", "unit", "source", "locale", "status", "message"];

  const rows = leads.map((lead) =>
    [
      new Date(lead.createdAt).toISOString(),
      lead.name,
      lead.phone,
      lead.email ?? "",
      lead.propertyRefCode ?? "",
      lead.source,
      lead.locale,
      lead.status,
      lead.message ?? "",
    ]
      .map(csvCell)
      .join(","),
  );

  // BOM so Excel on a Windows machine opens Arabic names correctly rather than
  // as mojibake - the client will open this in Excel.
  const body = `﻿${[header.join(","), ...rows].join("\r\n")}`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="alaser-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
