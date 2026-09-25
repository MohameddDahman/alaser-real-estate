"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { changeStatus } from "@/app/actions/admin";
import type { PropertyStatus } from "@/lib/data/types";
import type { SiteRequirement } from "@/lib/data/validation";
import { Select } from "@/components/ui/Select";
import { Dot, UNIT_STATUS_ORDER, UNIT_TONE } from "./status";

/**
 * Change a unit's status from the list - one tap to open, one to choose.
 * The new status shows at once; if the server refuses it (a visible status
 * on a unit that is not finished) it springs back and says what is missing.
 */
export function UnitStatusControl({
  id,
  status: saved,
  onChanged,
  onBlocked,
}: {
  id: string;
  status: PropertyStatus;
  onChanged?: (status: PropertyStatus) => void;
  onBlocked?: (missing: SiteRequirement[]) => void;
}) {
  const t = useTranslations("property.status");
  const ta = useTranslations("admin");
  const [status, setStatus] = useState(saved);
  const [pending, start] = useTransition();

  return (
    <Select
      variant="pill"
      label={ta("changeStatus")}
      value={status}
      disabled={pending}
      options={UNIT_STATUS_ORDER.map((value) => ({ value, label: t(value) }))}
      leading={<Dot className={UNIT_TONE[status]} />}
      onChange={(value) => {
        const next = value as PropertyStatus;
        const previous = status;
        setStatus(next);
        const data = new FormData();
        data.set("id", id);
        data.set("status", next);
        start(async () => {
          const result = await changeStatus(data).catch(() => ({ ok: false, blocked: undefined }));
          if (result.ok) {
            onChanged?.(next);
          } else {
            setStatus(previous);
            if (result.blocked) onBlocked?.(result.blocked);
          }
        });
      }}
    />
  );
}
