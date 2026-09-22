/**
 * The book's imposition: which page goes where.
 *
 * Two rules decide it, both from how a bound book works:
 *
 * 1. Every unit is a spread. Its photograph lands on a left-hand page and its
 *    sheet on the facing right-hand one, so a photograph's folio is always
 *    odd - the front cover stands alone as page 0.
 * 2. The back cover stands alone too, so the page count is always even.
 *
 * The contents schedule grows with the listings, a page per eight units. An
 * even number of contents pages would push every photograph onto a
 * right-hand page and leave the back cover sharing a spread, so a plate goes
 * in ahead of them. One page fixes both rules.
 *
 * Folios here are reading order, whichever way the book is bound.
 */

export const CONTENTS_PER_PAGE = 8;

export type BookLayout = {
  /** Each contents page and the slice of units it lists. */
  contents: Array<{ start: number; end: number; n: number }>;
  /** Folio of the plate, when the imposition needs one. */
  plate: number | null;
  firstUnitPage: number;
  areasPage: number;
  enquirePage: number;
  /** Every page, both covers included. */
  pageCount: number;
};

export function layoutBook(unitCount: number): BookLayout {
  const pages = Math.max(1, Math.ceil(unitCount / CONTENTS_PER_PAGE));
  const plate = pages % 2 === 0 ? 2 : null;
  const firstContents = plate === null ? 2 : 3;

  // Balanced, so the last page never carries a lone straggler.
  const perPage = Math.ceil(unitCount / pages);
  const contents = Array.from({ length: pages }, (_, i) => ({
    start: i * perPage,
    end: Math.min(unitCount, (i + 1) * perPage),
    n: firstContents + i,
  }));

  const firstUnitPage = firstContents + pages;
  const areasPage = firstUnitPage + unitCount * 2;
  const enquirePage = areasPage + 1;

  return {
    contents,
    plate,
    firstUnitPage,
    areasPage,
    enquirePage,
    pageCount: enquirePage + 2,
  };
}

/** One page of the book, in reading order. Its index is its folio. */
export type BookPage =
  | { kind: "cover" }
  | { kind: "colophon"; n: number }
  | { kind: "plate"; n: number }
  | { kind: "contents"; n: number; start: number; end: number; continued: boolean }
  | { kind: "photo"; n: number; unit: number }
  | { kind: "sheet"; n: number; unit: number }
  | { kind: "areas"; n: number }
  | { kind: "enquire"; n: number }
  | { kind: "back" };

/**
 * Every page in order - the single list the book, its thumbnails and its
 * labels are all drawn from, so they cannot disagree.
 */
export function bookPages(unitCount: number): BookPage[] {
  const layout = layoutBook(unitCount);
  const pages: BookPage[] = [{ kind: "cover" }, { kind: "colophon", n: 1 }];
  if (layout.plate !== null) pages.push({ kind: "plate", n: layout.plate });
  layout.contents.forEach((c, i) =>
    pages.push({ kind: "contents", n: c.n, start: c.start, end: c.end, continued: i > 0 }),
  );
  for (let u = 0; u < unitCount; u++) {
    pages.push({ kind: "photo", n: layout.firstUnitPage + u * 2, unit: u });
    pages.push({ kind: "sheet", n: layout.firstUnitPage + u * 2 + 1, unit: u });
  }
  pages.push({ kind: "areas", n: layout.areasPage });
  pages.push({ kind: "enquire", n: layout.enquirePage });
  pages.push({ kind: "back" });
  return pages;
}
