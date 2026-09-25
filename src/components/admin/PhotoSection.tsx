"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { upload } from "@vercel/blob/client";
import { ChevronLeft, ChevronRight, ImagePlus, Star, Trash2 } from "lucide-react";

import { BLUR, ROOM_KEYS, ROOM_WORDS, type RoomKey } from "@/content/photos";
import { isOptimisable } from "@/lib/images";
import { prepareImage, safeFilename } from "@/lib/resize-image";
import { cn } from "@/lib/utils";

export type PhotoDraft = {
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

type Pending = { key: string; name: string; progress: number; failed?: boolean };

const MAX_PHOTOS = 40;

/**
 * The unit's photographs, edited in place and saved with the rest of the
 * unit by the editor's one Save button.
 *
 * "Add photos" opens the phone's library (or its camera). Each photograph is
 * resized to 2560px in the browser and sent straight to Blob storage with a
 * short-lived token from /api/admin/upload, several at once, with progress.
 * The first photograph is the cover; the star makes any other one the cover,
 * and the arrows move a photograph earlier or later - buttons, not dragging,
 * because they work the same under a thumb, a mouse and a keyboard.
 */
export function PhotoSection({
  refCode,
  titleEn,
  titleAr,
  photos,
  onChange,
  onBusyChange,
  standIn,
}: {
  refCode: string;
  titleEn: string;
  titleAr: string;
  photos: PhotoDraft[];
  onChange: (update: (photos: PhotoDraft[]) => PhotoDraft[]) => void;
  onBusyChange: (busy: boolean) => void;
  /** The site shows stand-in photographs for this unit until it has its own. */
  standIn: boolean;
}) {
  const t = useTranslations("admin");
  const tRoom = useTranslations("property.room");
  const rtl = useLocale() === "ar";
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const busy = pending.some((file) => !file.failed);
  useEffect(() => onBusyChange(busy), [busy, onBusyChange]);

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
   * A new room rewrites the description only where the client never wrote
   * their own - a photo relabelled "view" must not keep reading "Reception".
   */
  const setRoom = (id: string, room: string) =>
    onChange((list) =>
      list.map((photo) => {
        if (photo.id !== id) return photo;
        const was = autoAlt(photo.room);
        const next = autoAlt(room);
        return {
          ...photo,
          room,
          altEn: !photo.altEn.trim() || photo.altEn.trim() === was.en ? next.en : photo.altEn,
          altAr: !photo.altAr.trim() || photo.altAr.trim() === was.ar ? next.ar : photo.altAr,
        };
      }),
    );

  const move = (index: number, delta: number) =>
    onChange((list) => {
      const target = index + delta;
      if (target < 0 || target >= list.length) return list;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  /** The cover is simply the first photograph, so this lifts it to the front. */
  const makeCover = (index: number) =>
    onChange((list) => {
      const next = [...list];
      const [picked] = next.splice(index, 1);
      return [picked, ...next];
    });

  const remove = (id: string) => {
    if (!window.confirm(t("confirmRemove"))) return;
    onChange((list) => list.filter((photo) => photo.id !== id));
  };

  async function ingest(fileList: FileList | File[]) {
    const room = MAX_PHOTOS - photos.length;
    const files = [...fileList].slice(0, Math.max(0, room));
    if (files.length === 0) return;

    const batch = files.map((file, i) => ({ key: `${Date.now()}-${i}`, name: file.name, progress: 0 }));
    setPending((list) => [...list.filter((item) => !item.failed), ...batch]);
    const track = (key: string, patch: Partial<Pending>) =>
      setPending((list) => list.map((item) => (item.key === key ? { ...item, ...patch } : item)));

    // In parallel: ten photographs of a flat should not queue.
    const added = await Promise.all(
      files.map(async (file, i): Promise<PhotoDraft | null> => {
        const { key } = batch[i];
        if (!file.type.startsWith("image/")) {
          track(key, { failed: true });
          return null;
        }
        try {
          const prepared = await prepareImage(file);
          const blob = await upload(safeFilename(refCode, file.name, prepared.type), prepared.blob, {
            access: "public",
            handleUploadUrl: "/api/admin/upload",
            contentType: prepared.type,
            onUploadProgress: ({ percentage }) => track(key, { progress: Math.round(percentage) }),
          });
          track(key, { progress: 100 });
          return {
            id: blob.url,
            src: blob.url,
            altEn: "",
            altAr: "",
            room: "",
            width: prepared.width,
            height: prepared.height,
            blurDataURL: prepared.blurDataURL,
          };
        } catch {
          track(key, { failed: true });
          return null;
        }
      }),
    );

    const done = added.filter((photo): photo is PhotoDraft => photo !== null);
    if (done.length > 0) onChange((list) => [...list, ...done].slice(0, MAX_PHOTOS));
    // Failures stay on screen; successes clear.
    const keys = new Set(batch.map((item) => item.key));
    setPending((list) => list.filter((item) => item.failed || !keys.has(item.key)));
  }

  const Earlier = rtl ? ChevronRight : ChevronLeft;
  const Later = rtl ? ChevronLeft : ChevronRight;
  const full = photos.length >= MAX_PHOTOS;
  const iconButton =
    "flex min-h-10 flex-1 cursor-pointer items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface hover:text-fg disabled:cursor-default disabled:opacity-30";

  return (
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
      className={cn("rounded-lg transition-shadow", dragOver && "ring-2 ring-primary ring-offset-4")}
    >
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={full}
          className="btn btn-outline"
        >
          <ImagePlus className="size-4" strokeWidth={2} aria-hidden="true" />
          {t("addPhotos")}
        </button>
        <p className="text-sm text-fg-muted">
          {full ? t("photosFull", { max: MAX_PHOTOS }) : t("photosHint")}
        </p>
        <input
          ref={fileInput}
          id={inputId}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            if (event.target.files) void ingest(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {pending.length > 0 && (
        <ul className="mt-4 space-y-2" aria-live="polite">
          {pending.map((file) => (
            <li key={file.key} className="rounded-lg border border-line px-3 py-2.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">{file.name}</span>
                <span className={cn("shrink-0 tabular-nums", file.failed ? "text-danger" : "text-fg-muted")} dir="ltr">
                  {file.failed ? t("uploadFailedShort") : `${file.progress}%`}
                </span>
              </div>
              {!file.failed && (
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-200"
                    style={{ width: `${Math.max(file.progress, 4)}%` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {photos.length === 0 ? (
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="mt-4 flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line-strong px-4 py-10 text-center transition-colors hover:border-primary hover:bg-primary-soft"
        >
          <ImagePlus className="size-7 text-fg-subtle" strokeWidth={1.75} aria-hidden="true" />
          <span className="font-semibold text-fg">{t("photosEmpty")}</span>
          <span className="max-w-sm text-sm text-fg-muted">
            {standIn ? t("photosStandInNote") : t("photosEmptyHint")}
          </span>
        </button>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
          {photos.map((photo, index) => {
            const cover = index === 0;
            return (
              <li
                key={photo.id}
                className={cn(
                  "flex min-w-0 flex-col overflow-hidden rounded-lg border bg-canvas",
                  cover ? "border-primary ring-1 ring-primary" : "border-line",
                )}
              >
                <div className="relative aspect-[4/3] bg-surface-2">
                  <Image
                    src={photo.src}
                    alt=""
                    fill
                    sizes="(min-width: 1536px) 12rem, (min-width: 640px) 28vw, 45vw"
                    placeholder="blur"
                    blurDataURL={photo.blurDataURL || BLUR}
                    unoptimized={!isOptimisable(photo.src)}
                    className="graded object-cover"
                  />
                  <span className="absolute start-1.5 top-1.5 rounded bg-black/65 px-1.5 text-xs font-semibold leading-5 text-white tabular-nums">
                    {index + 1}
                  </span>
                  {cover && (
                    <span className="absolute end-1.5 top-1.5 inline-flex items-center gap-1 rounded bg-primary px-1.5 text-xs font-semibold leading-5 text-white">
                      <Star className="size-3" strokeWidth={2.5} fill="currentColor" aria-hidden="true" />
                      {t("coverBadge")}
                    </span>
                  )}
                </div>

                <div className="p-1.5">
                  <label className="sr-only" htmlFor={`${inputId}-${index}-room`}>
                    {t("photoRoom")}
                  </label>
                  <select
                    id={`${inputId}-${index}-room`}
                    value={photo.room}
                    onChange={(event) => setRoom(photo.id, event.target.value)}
                    className="field min-h-10 cursor-pointer px-2 py-1.5 text-sm"
                  >
                    <option value="">{t("photoRoomNone")}</option>
                    {ROOM_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {tRoom(key)}
                      </option>
                    ))}
                  </select>

                  <div className="mt-1 flex items-center">
                    <button
                      type="button"
                      onClick={() => makeCover(index)}
                      disabled={cover}
                      aria-pressed={cover}
                      className={cn(iconButton, cover && "text-primary disabled:opacity-100")}
                    >
                      <span className="sr-only">{cover ? t("coverBadge") : t("setCover")}</span>
                      <Star className="size-4" strokeWidth={2} fill={cover ? "currentColor" : "none"} aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className={iconButton}>
                      <span className="sr-only">{t("moveUp")}</span>
                      <Earlier className="size-4" strokeWidth={2} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === photos.length - 1}
                      className={iconButton}
                    >
                      <span className="sr-only">{t("moveDown")}</span>
                      <Later className="size-4" strokeWidth={2} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(photo.id)}
                      className={cn(iconButton, "hover:bg-danger/10 hover:text-danger")}
                    >
                      <span className="sr-only">{t("removePhoto")}</span>
                      <Trash2 className="size-4" strokeWidth={2} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
