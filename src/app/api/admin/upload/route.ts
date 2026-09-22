import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { isAuthed } from "@/lib/admin-auth";

/**
 * Mints short-lived upload tokens so the browser can send photographs
 * straight to Blob storage.
 *
 * The bytes never pass through this route - which is the point. A server
 * action would cap out at a 1MB body and serialise every upload through the
 * function; this way ten photographs upload in parallel, with real progress,
 * and a 4MB file is not a problem.
 *
 * Authorisation is checked HERE, when the token is minted. Without it anyone
 * who found this URL could write to the client's storage.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        if (!(await isAuthed())) {
          throw new Error("Not authorised");
        }

        return {
          // Images only, and only formats a browser can actually render.
          allowedContentTypes: ["image/webp", "image/jpeg", "image/png", "image/avif"],
          // The client resizes to 2560px before sending, so anything above
          // this is not a photograph of a flat.
          maximumSizeInBytes: 8 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // Nothing to do: the gallery is saved explicitly by the client after
        // the upload resolves. This callback cannot reach localhost during
        // development anyway, so nothing may depend on it.
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "upload-failed" },
      { status: 400 },
    );
  }
}
