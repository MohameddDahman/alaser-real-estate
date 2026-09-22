/**
 * Client-side image preparation, before a byte leaves the browser.
 *
 * The brief asks for this explicitly and it is not a nicety: the client will
 * be uploading 6MB photographs from a phone over Egyptian mobile data. Doing
 * the work here means we send roughly a tenth of that, and it costs the
 * client nothing in bandwidth or waiting.
 *
 * Three things come back alongside the bytes, all of which the gallery needs
 * and none of which the server could cheaply work out later:
 *   - real pixel dimensions, so nothing ever guesses an aspect ratio
 *   - a tiny blurDataURL generated from the actual photograph, so the
 *     placeholder is the picture's own colours rather than a flat chip
 *   - a normalised content type
 */

export type PreparedImage = {
  blob: Blob;
  width: number;
  height: number;
  blurDataURL: string;
  type: string;
};

const MAX_EDGE = 2560;
const BLUR_EDGE = 12;

function canvasOf(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

async function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("encode-failed"))),
      type,
      quality,
    );
  });
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  // createImageBitmap handles EXIF orientation, which <img> decoding does not.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const full = canvasOf(width, height);
  const ctx = full.getContext("2d");
  if (!ctx) throw new Error("no-canvas");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);

  // WebP where the browser supports it; every target browser for this site
  // does, and it is roughly a third smaller than JPEG at the same quality.
  const type = full.toDataURL("image/webp", 0.5).startsWith("data:image/webp")
    ? "image/webp"
    : "image/jpeg";
  const blob = await toBlob(full, type, 0.82);

  // The blur placeholder, drawn from the photograph itself.
  const ratio = height / width;
  const small = canvasOf(BLUR_EDGE, Math.max(1, Math.round(BLUR_EDGE * ratio)));
  const smallCtx = small.getContext("2d");
  if (!smallCtx) throw new Error("no-canvas");
  smallCtx.drawImage(bitmap, 0, 0, small.width, small.height);
  const blurDataURL = small.toDataURL("image/webp", 0.4);

  bitmap.close();

  return { blob, width, height, blurDataURL, type };
}

/** A filename that is safe in a URL and still recognisable in the store. */
export function safeFilename(refCode: string, original: string, type: string): string {
  const ext = type === "image/webp" ? "webp" : "jpg";
  const stem = original
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${refCode.toLowerCase()}/${stem || "photo"}.${ext}`;
}
