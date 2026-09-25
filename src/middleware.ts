import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Everything except API routes, Next internals, the generated icons and
  // anything with a file extension. /admin is matched too so it gets a
  // locale prefix like the rest.
  matcher: "/((?!api|_next|_vercel|icon|apple-icon|.*\\..*).*)",
};
