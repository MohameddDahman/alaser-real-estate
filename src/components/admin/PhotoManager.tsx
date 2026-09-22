"use client";

import Image from "next/image";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Reorder, useDragControls } from "motion/react";
import { upload } from "@vercel/blob/client";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  GripVertical,
  Plus,
  Star,
  Trash2,
  UploadCloud,
} from "lucide-react";

import { saveGallery, type GalleryState } from "@/app/actions/admin";
import { BLUR, ROOM_KEYS, ROOM_WORDS, type RoomKey } from "@/content/photos";
import { isOptimisable, isValidImageSrc } from "@/lib/images";
import { prepareImage, safeFilename } from "@/lib/resize-image";
import type { GalleryImage } from "@/lib/data/types";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type Row = {
  /** Stable key for reordering - src is unique per unit. */
  id: string;
  src: string;
  altEn: string;
  altAr: string;
  room: string;
  width?: number;
  height?: number;
  blurDataURL?: string;
};

type Pending = { name: string; progress: number; failed?: boolean };

function toRows(gallery: GalleryImage[]): Row[] {
  return gallery.map((image) => ({
    id: image.src,
    src: image.src,
    altEn: image.alt.en,
    altAr: image.alt.ar,
    room: image.room ?? "",
    width: image.width,
    height: image.height,
    blurDataURL: image.blurDataURL,
  }));
}

/**
 * The photo editor.
 *
 * Drag photographs in from the desktop, reorder them, choose the cover, label
 * the room, write the alt text, remove one.
 *
 * Uploads go straight from the browser to Blob storage using a short-lived
 * token minted by /api/admin/upload - the bytes never pass through a server
 * action, so ten photographs upload in parallel with real progress and a 4MB
 * file is not a problem. Each one is resized to 2560px and given a blur
 * placeholder generated from the photograph itself before it is sent.
 *
 * Reordering works by drag AND by buttons, because drag alone is unusable on
 * a keyboard and the client edits from a phone.
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
  const [pendingFiles, setPendingFiles] = useState<Pending[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [state, action, saving] = useActionState<GalleryState, FormData>(saveGallery, {});
  const fileInput = useRef<HTMLInputElement>(null);
  const inputId = useId();

  useEffect(() => {
    if (state.ok) setDirty(false);
  }, [state.ok]);

  const update = (next: Row[]) => {
    setRows(next);
    setDirty(true);
  };

  /** Mirrors `normaliseGallery` on the server, so the two cannot disagree. */
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
   * Changing the room rewrites the alt text, but only when the client never
   * wrote their own - otherwise a frame relabelled "view" would keep reading
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

  /** The cover is simply the first frame, so this lifts it to the top. */
  const makeCover = (index: number) => {
    if (index === 0) return;
    const next = [...rows];
    const [picked] = next.splice(index, 1);
    update([picked, ...next]);
  };

  const addByUrl = () => {
    const src = draft.trim();
    if (!isValidImageSrc(src)) return setAddError("invalid");
    if (rows.some((row) => row.src === src)) return setAddError("duplicate");
    setAddError(null);
    setDraft("");
    update([...rows, { id: src, src, altEn: "", altAr: "", room: "" }]);
  };

  /* -------------------------------------------------------------- */

  async function ingest(fileList: FileList | File[]) {
    const files = [...fileList];
    if (files.length === 0) return;

    setPendingFiles(files.map((file) => ({ name: file.name, progress: 0 })));

    const track = (name: string, patch: Partial<Pending>) =>
      setPendingFiles((list) =>
        list.map((item) => (item.name === name ? { ...item, ...patch } : item)),
      );

    // Uploaded in parallel: ten photographs of a flat should not queue.
    const settled = await Promise.all(
      files.map(async (file) => {
        if (!file.type.startsWith("image/")) {
          track(file.name, { failed: true, progress: 0 });
          return null;
        }

        try {
          const prepared = await prepareImage(file);
          const blob = await upload(
            safeFilename(refCode, file.name, prepared.type),
            prepared.blob,
            {
              access: "public",
              handleUploadUrl: "/api/admin/upload",
              contentType: prepared.type,
              onUploadProgress: ({ percentage }) =>
                track(file.name, { progress: Math.round(percentage) }),
            },
          );

          track(file.name, { progress: 100 });
          const added: Row = {
            id: blob.url,
            src: blob.url,
            altEn: "",
            altAr: "",
            room: "",
            width: prepared.width,
            height: prepared.height,
            blurDataURL: prepared.blurDataURL,
          };
          return added;
        } catch {
          track(file.name, { failed: true });
          return null;
        }
      }),
    );

    const added = settled.filter((row): row is Row => row !== null);
    if (added.length > 0) {
      setRows((current) => [...current, ...added]);
      setDirty(true);
    }

    // Leave failures on screen; clear the successes.
    setPendingFiles((list) => list.filter((item) => item.failed));
  }

  const busy = pendingFiles.some((file) => !file.failed);

  return (
    <section className="mt-12 border-t border-sheet-edge pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-d3">{t("photosTitle")}</h2>
        <span className="font-data text-data text-ink/50 tabular-nums" dir="ltr">
          {rows.length}
        </span>
      </div>
      <p className="measure mt-2 text-[0.92rem] text-ink/65">{t("photosIntro")}</p>

      {/* Drop zone ----------------------------------------------------- */}
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          void ingest(event.dataTransfer.files);
        }}
        className={cn(
          "mt-6 border border-dashed px-6 py-10 text-center transition-colors",
          dragOver ? "border-ink bg-sheet-2" : "border-sheet-edge",
        )}
      >
        <UploadCloud className="mx-auto size-7 text-ink/35" strokeWidth={1.5} aria-hidden="true" />
        <p className="mt-3 font-medium">{t("dropHere")}</p>
        <p className="label mt-1 text-ink/45">{t("orChoose")}</p>

        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={busy}
          className="label mt-3 inline-flex min-h-11 cursor-pointer items-center border border-sheet-edge px-5 transition-colors hover:border-ink disabled:opacity-50"
        >
          {t("chooseFiles")}
        </button>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => {
            if (event.target.files) void ingest(event.target.files);
            event.target.value = "";
          }}
        />

        <p className="measure mx-auto mt-4 text-[0.8rem] text-ink/45">{t("uploadNote")}</p>
      </div>

      {/* Per-file progress --------------------------------------------- */}
      {pendingFiles.length > 0 && (
        <ul className="mt-4 space-y-2" aria-live="polite">
          {pendingFiles.map((file) => (
            <li key={file.name} className="border border-sheet-edge px-4 py-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-[0.88rem]">{file.name}</span>
                <span
                  className={cn(
                    "label shrink-0 tabular-nums",
                    file.failed ? "text-danger" : "text-ink/50",
                  )}
                  dir="ltr"
                >
                  {file.failed ? "—" : `${file.progress}%`}
                </span>
              </div>
              {file.failed ? (
                <p className="mt-1 text-[0.82rem] text-danger">
                  {t("uploadFailed", { name: file.name })}
                </p>
              ) : (
                <div className="mt-2 h-px w-full bg-sheet-edge">
                  <div
                    className="h-px bg-ink transition-[width] duration-200"
                    style={{ width: `${Math.max(file.progress, 4)}%` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

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
                addByUrl();
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
            onClick={addByUrl}
            className="label flex min-h-12 cursor-pointer items-center gap-2 border border-sheet-edge px-5 transition-colors hover:border-ink"
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
      </div>

      {/* The list ------------------------------------------------------ */}
      {rows.length === 0 ? (
        <p className="mt-8 border border-sheet-edge px-5 py-10 text-center text-ink/55">
          {t("photosEmpty")}
        </p>
      ) : (
        <Reorder.Group axis="y" values={rows} onReorder={update} className="mt-8 space-y-2">
          {rows.map((row, index) => (
            <PhotoRow
              key={row.id}
              row={row}
              index={index}
              total={rows.length}
              locale={locale}
              onMove={move}
              onMakeCover={() => makeCover(index)}
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
            rows.map(({ src, altEn, altAr, room, width, height, blurDataURL }) => ({
              src,
              altEn,
              altAr,
              room,
              width,
              height,
              blurDataURL,
            })),
          )}
        />
        <button
          type="submit"
          disabled={saving || busy}
          className="label min-h-12 cursor-pointer bg-ink px-6 text-sheet transition-colors hover:bg-survey-deep disabled:opacity-60"
        >
          {saving ? t("saving") : t("savePhotos")}
        </button>

        {busy && (
          <span className="text-[0.88rem] text-ink/55">
            {t("uploadBusy", {
              done: pendingFiles.filter((f) => f.progress === 100).length,
              total: pendingFiles.length,
            })}
          </span>
        )}
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
        {dirty && !saving && !busy && (
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
  onMakeCover,
}: {
  row: Row;
  index: number;
  total: number;
  locale: Locale;
  onChange: (patch: Partial<Row>) => void;
  onRemove: () => void;
  onMove: (index: number, delta: number) => void;
  onMakeCover: () => void;
}) {
  const t = useTranslations("admin");
  const tRoom = useTranslations("property.room");
  const controls = useDragControls();
  const [open, setOpen] = useState(false);
  const id = useId();
  const isCover = index === 0;

  return (
    <Reorder.Item
      value={row}
      dragListener={false}
      dragControls={controls}
      className={cn("border bg-sheet", isCover ? "border-ink" : "border-sheet-edge")}
    >
      <div className="flex items-center gap-3 p-2">
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
            blurDataURL={row.blurDataURL || BLUR}
            unoptimized={!isOptimisable(row.src)}
            className="graded object-cover"
          />
          {isCover && (
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
            onClick={onMakeCover}
            disabled={isCover}
            aria-pressed={isCover}
            className={cn(
              "flex size-11 cursor-pointer items-center justify-center transition-colors",
              isCover ? "text-reserved" : "text-ink/45 hover:text-reserved",
              "disabled:cursor-default",
            )}
          >
            <span className="sr-only">{isCover ? t("coverBadge") : t("setCover")}</span>
            <Star
              className="size-4"
              strokeWidth={1.75}
              fill={isCover ? "currentColor" : "none"}
              aria-hidden="true"
            />
          </button>
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
