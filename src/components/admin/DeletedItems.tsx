"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Trash2, Undo2 } from "lucide-react";

import { purgePhoto, purgeUnit, restorePhoto, restoreUnit, type TrashResult } from "@/app/actions/admin";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { BLUR } from "@/content/photos";
import type { DeletedPhotoRow, DeletedUnitRow } from "@/lib/data/admin-rows";
import { isOptimisable } from "@/lib/images";
import { timeAgo } from "@/lib/time-ago";
import { cn } from "@/lib/utils";
import { Card, EmptyState, PageHeader } from "./ui";
import { UnitThumb } from "./UnitThumb";

/**
 * Deleted items: every unit deleted and every photograph taken off a unit,
 * newest first, until the client restores it or deletes it for good.
 *
 * Restoring is one tap. Deleting for good asks first, says it cannot be
 * undone, and also deletes the photographs' files from storage.
 */
export function DeletedItems({
  units,
  photos,
  now,
}: {
  units: DeletedUnitRow[];
  photos: DeletedPhotoRow[];
  now: number;
}) {
  const t = useTranslations("admin");
  const ts = useTranslations("property.status");
  const locale = useLocale() as Locale;
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();
  const [notice, setNotice] = useState<{ text: string; href?: string } | null>(null);

  const title = (text: { en: string; ar: string }) => text[locale] || text.en || text.ar || t("untitled");

  /** Run one action on one item, then say what happened. */
  const act = (
    key: string,
    action: (data: FormData) => Promise<TrashResult>,
    fields: Record<string, string>,
    done: (result: TrashResult) => { text: string; href?: string },
  ) => {
    const data = new FormData();
    for (const [name, value] of Object.entries(fields)) data.set(name, value);
    setBusy(key);
    start(async () => {
      const result = await action(data).catch(() => ({ ok: false }) as TrashResult);
      setNotice(result.ok ? done(result) : { text: t("actionFailed") });
      setBusy(null);
    });
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader title={t("deletedTitle")} subtitle={t("deletedIntro")} />

      {notice && (
        <p role="status" className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-canvas p-3 text-sm font-medium text-fg shadow-card">
          <CheckCircle2 className="size-4 shrink-0 text-success" strokeWidth={2} aria-hidden="true" />
          {notice.text}
          {notice.href && (
            <Link href={notice.href} className="link">
              {t("openUnit")}
            </Link>
          )}
        </p>
      )}

      <Card title={`${t("deletedUnits")} (${units.length})`}>
        {units.length === 0 ? (
          <EmptyState>{t("noDeletedUnits")}</EmptyState>
        ) : (
          <ul className="-my-3 divide-y divide-line">
            {units.map((unit) => {
              const key = `unit:${unit.id}`;
              return (
                <li key={unit.id} className="flex flex-wrap items-center gap-3 py-3">
                  <UnitThumb src={unit.cover} className="h-14 w-18 opacity-75" sizes="4.5rem" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-fg">{title(unit.title)}</p>
                    <p className="mt-0.5 text-sm text-fg-muted">
                      <span dir="ltr" className="tabular-nums">
                        {unit.refCode}
                      </span>
                      {unit.deletedAt && ` · ${t("deletedWhen", { when: timeAgo(unit.deletedAt, now, locale) })}`}
                    </p>
                  </div>
                  <div className="flex w-full gap-2 sm:w-auto">
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() =>
                        act(key, restoreUnit, { id: unit.id }, (result) => ({
                          text: t("restoredUnit", {
                            ref: unit.refCode,
                            status: ts(result.restoredAs ?? "draft"),
                          }),
                          href: `/admin/properties/${unit.id}`,
                        }))
                      }
                      className="btn btn-outline btn-sm flex-1 sm:flex-none"
                    >
                      <Undo2 className="size-4 rtl:-scale-x-100" strokeWidth={2} aria-hidden="true" />
                      {t("restore")}
                    </button>
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => {
                        if (!window.confirm(t("confirmDeleteForeverUnit", { ref: unit.refCode }))) return;
                        act(key, purgeUnit, { id: unit.id }, () => ({ text: t("deletedForever") }));
                      }}
                      className="btn btn-quiet btn-sm flex-1 text-danger hover:border-danger hover:bg-danger/5 sm:flex-none"
                    >
                      <Trash2 className="size-4" strokeWidth={2} aria-hidden="true" />
                      {t("deleteForever")}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card title={`${t("deletedPhotos")} (${photos.length})`} description={t("deletedPhotosHint")}>
        {photos.length === 0 ? (
          <EmptyState>{t("noDeletedPhotos")}</EmptyState>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {photos.map((photo) => {
              const key = `photo:${photo.unitId}:${photo.src}`;
              const fields = { id: photo.unitId, src: photo.src };
              return (
                <li
                  key={key}
                  className={cn(
                    "flex min-w-0 flex-col overflow-hidden rounded-lg border border-line bg-canvas",
                    busy === key && "opacity-60",
                  )}
                >
                  <div className="relative aspect-[4/3] bg-surface-2">
                    <Image
                      src={photo.src}
                      alt=""
                      fill
                      sizes="(min-width: 1280px) 14rem, (min-width: 640px) 30vw, 45vw"
                      placeholder="blur"
                      blurDataURL={photo.blurDataURL || BLUR}
                      unoptimized={!isOptimisable(photo.src)}
                      className="graded object-cover"
                    />
                  </div>
                  <div className="p-2">
                    <p className="truncate text-xs font-medium text-fg">
                      {t("fromUnit")}{" "}
                      <span dir="ltr" className="tabular-nums">
                        {photo.refCode}
                      </span>
                    </p>
                    <p className="truncate text-xs text-fg-subtle">
                      {t("deletedWhen", { when: timeAgo(photo.removedAt, now, locale) })}
                    </p>
                    <div className="mt-2 flex gap-1.5">
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() =>
                          act(key, restorePhoto, fields, () => ({
                            text: t("restoredPhoto", { ref: photo.refCode }),
                            href: `/admin/properties/${photo.unitId}`,
                          }))
                        }
                        className="btn btn-outline btn-sm min-h-9 flex-1 px-2"
                      >
                        <Undo2 className="size-3.5 rtl:-scale-x-100" strokeWidth={2} aria-hidden="true" />
                        {t("restore")}
                      </button>
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() => {
                          if (!window.confirm(t("confirmDeleteForeverPhoto"))) return;
                          act(key, purgePhoto, fields, () => ({ text: t("deletedForever") }));
                        }}
                        className="btn btn-quiet btn-sm min-h-9 px-2.5 text-danger hover:border-danger hover:bg-danger/5"
                      >
                        <span className="sr-only">{t("deleteForever")}</span>
                        <Trash2 className="size-3.5" strokeWidth={2} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
