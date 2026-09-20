import type { ReactNode } from "react";

/**
 * Passthrough root layout.
 *
 * The real root is `app/[locale]/layout.tsx`, which owns <html> because `lang`
 * and `dir` depend on the locale segment and must be correct in the very first
 * byte of the response - not patched in on the client. Next requires a file
 * here regardless, and it needs one so `app/not-found.tsx` (the global 404 for
 * paths the locale middleware could not route) has a root to attach to.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
