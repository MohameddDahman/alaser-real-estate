import "server-only";
import { createSearchParamsCache } from "nuqs/server";

import { filterParsers } from "./filters";

/**
 * Server-side parse of the same parsers the filter UI writes with. Kept in its
 * own module because `createSearchParamsCache` must never reach the client
 * bundle, while the parsers themselves are shared by both sides.
 */
export const filterCache = createSearchParamsCache(filterParsers);
