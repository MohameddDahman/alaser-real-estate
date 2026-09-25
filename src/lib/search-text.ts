import { toLatinDigits } from "@/lib/utils";

/**
 * Text folded for searching, so the way a word happens to be typed does not
 * matter: case, Arabic-Indic digits, the forms of alef, taa marbuta and
 * alef maqsura, and the short vowel marks.
 */
export function foldForSearch(value: string): string {
  return toLatinDigits(value)
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim();
}

/** Every word of the query appears somewhere in the haystack. */
export function matchesSearch(haystack: string, query: string): boolean {
  const words = foldForSearch(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const folded = foldForSearch(haystack);
  return words.every((word) => folded.includes(word));
}
