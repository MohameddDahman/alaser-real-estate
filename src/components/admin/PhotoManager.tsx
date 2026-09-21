"use client";

import Image from "next/image";
import { useActionState, useEffect, useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Reorder, useDragControls } from "motion/react";
import { Check, ChevronDown, GripVertical, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

import { saveGallery, type GalleryState } from "@/app/actions/admin";
import { BLUR, ROOM_KEYS, ROOM_WORDS, type RoomKey } from "@/content/photos";
import { isOptimisable, isValidImageSrc } from "@/lib/images";
import type { GalleryImage } from "@/lib/data/types";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type Row = {
  /** Stable key for reordering — src is unique per unit. */
  id: string;
  src: string;
  altEn: string;
  altAr: string;
  room: string;
};

function toRows(gallery: GalleryImage[]): Row[] {
  return gallery.map((image) => ({
    id: image.src,
    src: image.src,
    altEn: image.alt.en,
    altAr: image.alt.ar,
    room: image.room ?? "",
  }));
}

/**
 * The photo editor.
 *
 * Ordering, cover, room labels, alt text and removal - everything about a
 * unit's photographs except the bytes themselves. "Set cover" is deliberately
 * not a separate control: the first frame is the cover, so moving a photo to
 * the top IS setting it. One concept instead of two.
 *
 * Reordering works by drag AND by buttons. Drag alone would be unusable on a
 * keyboard, and the client edits from a phone.
 *
 * File upload needs somewhere to put the bytes, which is Convex storage and
 * does not exist yet - so today photographs are added by URL, which is enough
 * to put the agency's real images on the site from any host they already use.
 */
export function PhotoManager({
  propertyId,
  gallery,
  titleEn,
  titleAr,
  refCode,
}: {
  propertyId: string;
  gallery: GalleryImage[];
  titleEn: string;
  titleAr: string;
  refCode: string;
}) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const [rows, setRows] = useState<Row[]>(() => toRows(gallery));
  const [draft, setDraft] = useState("");
  const [addError, setAddError] = useState<"invalid" | "duplicate" | null>(null);
  const [dirty, setDirty] = useState(false);
  const [state, action, pending] = useActionState<GalleryState, FormData>(saveGallery, {});
  const inputId = useId();

  // A successful save makes the current rows the new baseline.
  useEffect(() => {
    if (state.ok) setDirty(false);
  }, [state.ok]);

  const update = (next: Row[]) => {
    setRows(next);
    setDirty(true);
  };

  /**
   * Mirrors `normaliseGallery` on the server exactly, so the two can never
   * disagree about what an auto-written alt looks like.
   */
  const autoAlt = (room: string) => {
    const words = room ? ROOM_WORDS[room as RoomKey] : null;
    return {
      en: words
        ? `${words.en[0].toUpperCase()}${words.en.slice(1)} — ${titleEn}, ref ${refCode}`
        : `${titleEn}, ref ${refCode}`,
      ar: words ? `${words.ar} — ${titleAr}، كود ${refCode}` : `${titleAr}، كود ${refCode}`,
    };
  };

  /**
   * Changing the room rewrites the alt text — but only when the client never
   * wrote their own. Otherwise a frame relabelled "view" would keep reading
   * "Reception — …" to a screen reader and to Google.
   */
  const setRoom = (row: Row, room: string) => {
    const wasAuto = autoAlt(row.room);
    const next = autoAlt(room);

    update(
      rows.map((r) =>
        r.id === row.id
          ? {
              ...r,
              room,
              altEn: !r.altEn.trim() || r.altEn.trim() === wasAuto.en ? next.en : r.altEn,
              altAr: !r.altAr.trim() || r.altAr.trim() === wasAuto.ar ? next.ar : r.altAr,
            }
          : r,
      ),
    );
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    update(next);
  };

  const add = () => {
    const src = draft.trim();
    if (!isValidImageSrc(src)) return setAddError("invalid");
    if (rows.some((row) => row.src === src)) return setAddError("duplicate");
    setAddError(null);
    setDraft("");
    update([...rows, { id: src, src, altEn: "", altAr: "", room: "" }]);
  };

  return (
    <section className="mt-12 border-t border-sheet-edge pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-d3">{t("photosTitle")}</h2>
        <span className="font-data text-data text-ink/50 tabular-nums" dir="ltr">
          {rows.length}
        </span>
      </div>
      <p className="measure mt-2 text-[0.92rem] text-ink/65">{t("photosIntro")}</p>

      {/* Add by URL ---------------------------------------------------- */}
      <div className="mt-6">
        <label htmlFor={inputId} className="label block text-ink/55">
          {t("addByUrl")}
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            id={inputId}
            value={draft}
            dir="ltr"
            inputMode="url"
            placeholder={t("addUrlPlaceholder")}
            onChange={(event) => {
              setDraft(event.target.value);
              setAddError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                add();
              }
            }}
            aria-invalid={!!addError}
            aria-describedby={addError ? `${inputId}-error` : undefined}
            className={cn(
              "min-h-12 flex-1 border bg-sheet px-3 font-data text-[0.9rem] outline-none transition-colors",
              addError ? "border-danger" : "border-sheet-edge focus:border-ink",
            )}
          />
          <button
            type="button"
            onClick={add}
            className="label flex min-h-12 cursor-pointer items-center gap-2 bg-ink px-5 text-sheet transition-colors hover:bg-survey-deep"
          >
            <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
            {t("addPhoto")}
          </button>
        </div>
        {addError && (
          <p id={`${inputId}-error`} role="alert" className="mt-2 text-[0.85rem] text-danger">
            {addError === "invalid" ? t("addInvalid") : t("addDuplicate")}
          </p>
        )}
        <p className="measure mt-3 text-[0.82rem] text-ink/50">{t("uploadLater")}</p>
      </div>

      {/* The list ------------------------------------------------------ */}
      {rows.length === 0 ? (
        <p className="mt-8 border border-sheet-edge px-5 py-10 text-center text-ink/55">
          {t("photosEmpty")}
        </p>
      ) : (
        <Reorder.Group
          axis="y"
          values={rows}
          onReorder={update}
          className="mt-8 space-y-2"
        >
          {rows.map((row, index) => (
            <PhotoRow
              key={row.id}
              row={row}
              index={index}
              total={rows.length}
              locale={locale}
              onMove={move}
              onChange={(patch) =>
                patch.room !== undefined
                  ? setRoom(row, patch.room)
                  : update(rows.map((r) => (r.id === row.id ? { ...r, ...patch } : r)))
              }
              onRemove={() => {
                // Destructive, so it asks - once.
                if (!window.confirm(t("confirmRemove"))) return;
                update(rows.filter((r) => r.id !== row.id));
              }}
            />
          ))}
        </Reorder.Group>
      )}

      {/* Save ---------------------------------------------------------- */}
      <form action={action} className="mt-8 flex flex-wrap items-center gap-4">
        <input type="hidden" name="id" value={propertyId} />
        <input
          type="hidden"
          name="gallery"
          value={JSON.stringify(
            rows.map(({ src, altEn, altAr, room }) => ({ src, altEn, altAr, room })),
          )}
        />
        <button
          type="submit"
          disabled={pending}
          className="label min-h-12 cursor-pointer bg-ink px-6 text-sheet transition-colors hover:bg-survey-deep disabled:opacity-60"
        >
          {pending ? t("saving") : t("savePhotos")}
        </button>

        {state.ok && !dirty && (
          <span role="status" className="flex items-center gap-2 text-available">
            <Check className="size-4" strokeWidth={2.5} aria-hidden="true" />
            {t("photosSaved")}
          </span>
        )}
        {state.error && (
          <span role="alert" className="text-danger">
            {t("photosSaveFailed")}
          </span>
        )}
        {dirty && !pending && (
          <span className="text-[0.88rem] text-reserved">{t("unsavedPhotos")}</span>
        )}
      </form>
    </section>
  );
}

function PhotoRow({
  row,
  index,
  total,
  locale,
  onChange,
  onRemove,
  onMove,
}: {
  row: Row;
  index: number;
  total: number;
  locale: Locale;
  onChange: (patch: Partial<Row>) => void;
  onRemove: () => void;
  onMove: (index: number, delta: number) => void;
}) {
  const t = useTranslations("admin");
  const tRoom = useTranslations("property.room");
  const controls = useDragControls();
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <Reorder.Item
      value={row}
      dragListener={false}
      dragControls={controls}
      className="border border-sheet-edge bg-sheet"
    >
      <div className="flex items-center gap-3 p-2">
        {/* Drag handle. Pointer only - the arrows below are the keyboard path. */}
        <button
          type="button"
          onPointerDown={(event) => controls.start(event)}
          aria-hidden="true"
          tabIndex={-1}
          className="hidden cursor-grab touch-none p-1 text-ink/35 active:cursor-grabbing sm:block"
        >
          <GripVertical className="size-4" strokeWidth={1.75} />
        </button>

        <span className="relative block size-16 shrink-0 overflow-hidden border border-sheet-edge bg-navy">
          <Image
            src={row.src}
            alt=""
            fill
            sizes="4rem"
            placeholder="blur"
            blurDataURL={BLUR}
            unoptimized={!isOptimisable(row.src)}
            className="graded object-cover"
          />
          {index === 0 && (
            <span className="label absolute inset-x-0 bottom-0 bg-navy/85 py-0.5 text-center text-[0.5rem] text-giza">
              {t("coverBadge")}
            </span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <label htmlFor={`${id}-room`} className="sr-only">
            {t("photoRoom")}
          </label>
          <select
            id={`${id}-room`}
            value={row.room}
            onChange={(event) => onChange({ room: event.target.value })}
            className="label min-h-11 w-full max-w-[14rem] cursor-pointer border border-sheet-edge bg-sheet px-2 outline-none focus:border-ink"
          >
            <option value="">{t("photoRoomNone")}</option>
            {ROOM_KEYS.map((key) => (
              <option key={key} value={key}>
                {tRoom(key as RoomKey)}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="label mt-1 flex cursor-pointer items-center gap-1 text-ink/50 hover:text-ink"
          >
            <ChevronDown
              className={cn("size-3 transition-transform", open && "rotate-180")}
              strokeWidth={2}
              aria-hidden="true"
            />
            {t("photoAlt")}
          </button>
        </div>

        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={() => onMove(index, -1)}
            disabled={index === 0}
            className="flex size-11 cursor-pointer items-center justify-center text-ink/55 transition-colors hover:text-ink disabled:opacity-25"
          >
            <span className="sr-only">{t("moveUp")}</span>
            <ArrowUp className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onMove(index, 1)}
            disabled={index === total - 1}
            className="flex size-11 cursor-pointer items-center justify-center text-ink/55 transition-colors hover:text-ink disabled:opacity-25"
          >
            <span className="sr-only">{t("moveDown")}</span>
            <ArrowDown className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="flex size-11 cursor-pointer items-center justify-center text-ink/45 transition-colors hover:text-danger"
          >
            <span className="sr-only">{t("removePhoto")}</span>
            <Trash2 className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>

      {open && (
        <div className="grid gap-3 border-t border-sheet-edge p-3 sm:grid-cols-2">
          <div>
            <label htmlFor={`${id}-en`} className="label block text-ink/45">
              {t("fieldsEnglish")}
            </label>
            <input
              id={`${id}-en`}
              dir="ltr"
              value={row.altEn}
              onChange={(event) => onChange({ altEn: event.target.value })}
              className="mt-1 min-h-11 w-full border border-sheet-edge bg-sheet px-2.5 text-[0.9rem] outline-none focus:border-ink"
            />
          </div>
          <div>
            <label htmlFor={`${id}-ar`} className="label block text-ink/45" lang="ar">
              {t("fieldsArabic")}
            </label>
            <input
              id={`${id}-ar`}
              dir="rtl"
              lang="ar"
              value={row.altAr}
              onChange={(event) => onChange({ altAr: event.target.value })}
              className="mt-1 min-h-11 w-full border border-sheet-edge bg-sheet px-2.5 text-[0.9rem] outline-none focus:border-ink"
            />
          </div>
          <p className="text-[0.8rem] text-ink/45 sm:col-span-2">
            {locale === "ar"
              ? "اتركه فارغًا وسيُكتب تلقائيًا من اسم الغرفة والوحدة."
              : "Leave blank and it is written for you from the room and the unit."}
          </p>
        </div>
      )}
    </Reorder.Item>
  );
}
