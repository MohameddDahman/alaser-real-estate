import Image from "next/image";

import { Mark } from "@/components/brand/Mark";
import { PlanPlate } from "@/components/plan/PlanPlate";
import { BLUR } from "@/content/photos";
import { isOptimisable } from "@/lib/images";
import type { FloorPlan } from "@/lib/data/types";
import { cn } from "@/lib/utils";

/**
 * The pages of the portfolio.
 *
 * Pure markup, deliberately: the flip engine is handed CLONES of these nodes,
 * so no React handler inside a page would survive. Nothing here is focusable
 * either - the book is presented aria-hidden, and the accessible equivalent
 * (a real list of units, with links) sits beside it on the page.
 *
 * Set like a printed brochure: photographs bleed off the page, text pages
 * keep wide margins and no drawn frames, and a running foot carries the page
 * number on the outer corner. Every size is in container-query units (`cqw`),
 * so a page scales as one object, the way a printed sheet does; text has a
 * floor in pixels so it stays legible when the page is phone-sized.
 */

export type BookUnit = {
  refCode: string;
  title: string;
  areaName: string;
  tenure: string;
  statusLabel: string;
  isReserved: boolean;
  price: string;
  period: string | null;
  perMeter: string | null;
  area: string;
  floor: string;
  facing: string;
  facingName: string;
  bedsBaths: string;
  finishing: string | null;
  highlight: string | null;
  photo: { src: string; room: string | null } | null;
  plan: FloorPlan | null;
  photoNo: number;
  sheetNo: number;
};

export type BookText = {
  brand: string;
  arabicBrand: string;
  coverTitle: string;
  coverSub: string;
  volume: string;
  date: string;
  areasLine: string;
  colophonTitle: string;
  colophonBody: string;
  keys: { ref: string; area: string; floor: string; facing: string };
  keyLabels: { ref: string; area: string; floor: string; facing: string };
  contentsTitle: string;
  contentsContinued: string;
  plate: { src: string; label: string; caption: string };
  sheet: string;
  areasTitle: string;
  areas: Array<{ name: string; character: string; count: string }>;
  enquireTitle: string;
  enquireBody: string;
  whatsapp: string;
  phone: string;
  address: string;
  backNote: string;
};

/* ------------------------------------------------------------------ */

function Page({
  children,
  hard = false,
  dark = false,
  className,
}: {
  children: React.ReactNode;
  hard?: boolean;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div data-book-page data-density={hard ? "hard" : "soft"} className="h-full w-full">
      <div
        className={cn(
          "@container relative h-full w-full overflow-hidden",
          dark ? "bg-navy text-white" : "pbook-paper text-ink",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** The text area of a paper page: the margins, and room left for the foot. */
function Body({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("absolute inset-x-[7cqw] top-[7.5cqw] bottom-[10cqw] flex flex-col", className)}>
      {children}
    </div>
  );
}

/**
 * The running foot: page number on the outer corner, the name beside it.
 *
 * Odd folios open a spread and even ones close it, so the number always sits
 * away from the gutter. `start` and `end` follow the reading direction on
 * purpose: the page that is a verso in English is a recto in Arabic, and the
 * same rule puts its number on the right side.
 */
function Folio({ n, brand, onPhoto = false }: { n: number; brand: string; onPhoto?: boolean }) {
  const outerStart = n % 2 === 1;
  return (
    <p
      className={cn(
        "pbook-label absolute bottom-[4cqw] flex items-center gap-[1.6cqw] text-[length:max(7.5px,1.7cqw)]",
        outerStart ? "start-[7cqw]" : "end-[7cqw] flex-row-reverse",
        onPhoto ? "text-white/85" : "text-ink/45",
      )}
    >
      <span className="tabular-nums">{String(n).padStart(3, "0")}</span>
      <span aria-hidden="true" className="block h-[1em] w-px bg-current opacity-40" />
      <span dir="ltr">{brand}</span>
    </p>
  );
}

function Heading({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn("font-display text-[6.6cqw] leading-[1.04] text-navy", className)}>{children}</h2>
  );
}

/* ------------------------------------------------------------------ */

export function CoverPage({ text }: { text: BookText }) {
  return (
    <Page hard dark>
      {/* Light falling on the board from above. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(95%_65%_at_50%_0%,rgba(226,167,46,0.14),transparent_70%)]"
      />

      <div className="absolute inset-x-[8cqw] top-[16cqw] flex flex-col items-center text-center">
        <Mark className="h-[11cqw] w-auto text-giza" />
        {/* Tracking leaves a space after the last letter; the matching indent
            keeps the word optically centred. */}
        <p
          dir="ltr"
          className="pbook-foil mt-[4cqw] ps-[0.42em] font-display text-[4.4cqw] leading-none tracking-[0.42em] [font-variation-settings:'wdth'_100,'wght'_500]"
        >
          {text.brand}
        </p>
        <p lang="ar" dir="rtl" className="mt-[2.2cqw] font-body text-[3.4cqw] text-giza">
          {text.arabicBrand}
        </p>
      </div>

      <div className="absolute inset-x-[8cqw] top-[58%] -translate-y-1/2 text-center">
        <span aria-hidden="true" className="mx-auto mb-[6cqw] block h-px w-[14cqw] bg-gold/70" />
        <p className="font-display text-[10.5cqw] leading-[0.95]">{text.coverTitle}</p>
        <p className="mt-[3cqw] text-[length:max(10.5px,3cqw)] text-white/75">{text.coverSub}</p>
      </div>

      <div className="absolute inset-x-[8cqw] bottom-[9cqw] flex items-end justify-between gap-[3cqw] border-t border-white/15 pt-[3cqw]">
        <p className="pbook-label text-[length:max(8.5px,2cqw)] text-giza">{text.volume}</p>
        <p className="pbook-label text-end text-[length:max(8.5px,2cqw)] text-white/70">{text.date}</p>
      </div>

      <p className="pbook-label absolute inset-x-[4cqw] bottom-[3.6cqw] text-center text-[1.7cqw] text-white/45">
        {text.areasLine}
      </p>
    </Page>
  );
}

export function ColophonPage({ text, n }: { text: BookText; n: number }) {
  const rows: Array<[string, string, string]> = [
    [text.keyLabels.ref, "ALS-0412", text.keys.ref],
    [text.keyLabels.area, "142 m²", text.keys.area],
    [text.keyLabels.floor, "3 / 9", text.keys.floor],
    [text.keyLabels.facing, "N", text.keys.facing],
  ];

  return (
    <Page>
      <Body>
        <p className="pbook-label text-[length:max(8.5px,1.9cqw)] text-gold-deep">{text.volume}</p>
        <Heading className="mt-[2.4cqw]">{text.colophonTitle}</Heading>
        <p className="mt-[3.6cqw] text-[length:max(9.5px,2.9cqw)] leading-[1.55] text-ink/70">
          {text.colophonBody}
        </p>

        {/* The legend for the facts that run along the foot of every unit page. */}
        <dl className="mt-[4cqw] divide-y divide-ink/10 border-y border-ink/10">
          {rows.map(([label, sample, gloss]) => (
            <div key={label} className="grid grid-cols-[28%_1fr] gap-[3cqw] py-[2.2cqw]">
              <div>
                <dt className="pbook-label text-[length:max(7.5px,1.7cqw)] text-ink/50">{label}</dt>
                <dd className="mt-[0.6cqw] text-[length:max(9px,2.8cqw)] font-semibold tabular-nums text-navy">
                  <span dir="ltr">{sample}</span>
                </dd>
              </div>
              <dd className="text-[length:max(8px,2.4cqw)] leading-[1.45] text-ink/70">{gloss}</dd>
            </div>
          ))}
        </dl>
      </Body>
      <Folio n={n} brand={text.brand} />
    </Page>
  );
}

/**
 * The frontispiece. It appears only when the imposition needs one more page
 * ahead of the contents (see layout.ts), and faces the colophon.
 */
export function PlatePage({ text, n }: { text: BookText; n: number }) {
  return (
    <Page>
      <Image
        src={text.plate.src}
        alt=""
        fill
        sizes="(max-width: 768px) 90vw, 42vw"
        placeholder="blur"
        blurDataURL={BLUR}
        unoptimized={!isOptimisable(text.plate.src)}
        className="graded object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 via-ink/40 to-transparent px-[7cqw] pb-[11cqw] pt-[18cqw] text-white">
        <p className="pbook-label text-[length:max(8px,1.9cqw)] text-gold">{text.plate.label}</p>
        <p className="mt-[1.2cqw] text-[length:max(9.5px,2.6cqw)] leading-[1.45] text-white/90">{text.plate.caption}</p>
      </div>
      <Folio n={n} brand={text.brand} onPhoto />
    </Page>
  );
}

export function ContentsPage({
  text,
  units,
  n,
  continued = false,
}: {
  text: BookText;
  units: BookUnit[];
  n: number;
  continued?: boolean;
}) {
  return (
    <Page>
      <Body>
        <Heading>{continued ? text.contentsContinued : text.contentsTitle}</Heading>

        {/* Real page numbers, computed from the imposition, with leaders. */}
        <ol className="mt-[4.5cqw] flex-1 border-t border-ink/10">
          {units.map((unit) => (
            <li key={unit.refCode} className="border-b border-ink/10 py-[1.5cqw]">
              <div className="flex items-baseline gap-[1.5cqw]">
                <span className="min-w-0 truncate text-[length:max(10px,2.55cqw)] font-medium text-ink">
                  {unit.title}
                </span>
                <span
                  aria-hidden="true"
                  className="min-w-[3cqw] flex-1 border-b border-dotted border-ink/30"
                />
                <span className="shrink-0 text-[length:max(9px,2.3cqw)] font-semibold tabular-nums text-navy" dir="ltr">
                  {String(unit.photoNo).padStart(3, "0")}
                </span>
              </div>
              <span className="pbook-label mt-[0.3cqw] block text-[length:max(7.5px,1.7cqw)] text-ink/50">
                <span dir="ltr">{unit.refCode}</span> · {unit.areaName}
              </span>
            </li>
          ))}
        </ol>
      </Body>
      <Folio n={n} brand={text.brand} />
    </Page>
  );
}

/** The photograph: the left-hand page of each spread, to the trim. */
export function UnitPhotoPage({ unit, text }: { unit: BookUnit; text: BookText }) {
  return (
    <Page className="bg-navy">
      {unit.photo && (
        <Image
          src={unit.photo.src}
          alt=""
          fill
          sizes="(max-width: 768px) 90vw, 42vw"
          placeholder="blur"
          blurDataURL={BLUR}
          unoptimized={!isOptimisable(unit.photo.src)}
          className="graded object-cover"
        />
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-[2cqw] bg-gradient-to-t from-ink/80 via-ink/35 to-transparent px-[7cqw] pb-[11cqw] pt-[16cqw] text-white">
        {unit.photo?.room && (
          <span className="pbook-label text-[length:max(8px,1.9cqw)] text-white/90">{unit.photo.room}</span>
        )}
        <span className="text-[length:max(8.5px,2.1cqw)] font-semibold tracking-[0.08em] tabular-nums" dir="ltr">
          {unit.refCode}
        </span>
      </div>
      <Folio n={unit.photoNo} brand={text.brand} onPhoto />
    </Page>
  );
}

/** What we measured: the right-hand page of each spread. */
export function UnitSheetPage({ unit, text }: { unit: BookUnit; text: BookText }) {
  return (
    <Page>
      <Body>
        <div className="flex items-center justify-between gap-[2cqw]">
          <p className="pbook-label min-w-0 truncate text-[length:max(7.5px,1.8cqw)] text-ink/55">
            {unit.areaName} · {unit.tenure}
          </p>
          <p
            className={cn(
              "shrink-0 rounded-full px-[1.8cqw] py-[0.5cqw] text-[length:max(7.5px,1.75cqw)] font-semibold",
              unit.isReserved ? "bg-warning-soft text-warning" : "bg-success-soft text-success",
            )}
          >
            {unit.statusLabel}
          </p>
        </div>

        <h3 className="mt-[2.2cqw] font-display text-[5.6cqw] leading-[1.06] text-navy">{unit.title}</h3>
        <p className="mt-[1.4cqw] text-[length:max(9.5px,2.35cqw)] text-ink/65">
          {unit.bedsBaths}
          {unit.finishing ? ` · ${unit.finishing}` : ""}
        </p>

        {/* The plan, the unit's own geometry, on a lighter panel. */}
        <div className="mt-[3cqw] flex min-h-0 flex-1 items-center justify-center rounded-[1.4cqw] bg-white/55 p-[2.6cqw] text-navy/80">
          {unit.plan && <PlanPlate plan={unit.plan} className="max-h-full" withLabels />}
        </div>

        {unit.highlight && (
          <p className="mt-[2.6cqw] border-s-[0.5cqw] border-gold ps-[2cqw] text-[length:max(9.5px,2.35cqw)] leading-[1.4]">
            {unit.highlight}
          </p>
        )}

        <div className="mt-[2.6cqw] flex items-baseline justify-between gap-[2cqw]">
          {/* The space before the period is a real one: without it an Arabic
              currency and an Arabic period would shape into a single word. */}
          <p className="text-[4.6cqw] font-bold leading-none tabular-nums text-navy">
            {unit.price}
            {unit.period && (
              <span className="text-[length:max(8.5px,2cqw)] font-normal text-ink/55"> {unit.period}</span>
            )}
          </p>
          {unit.perMeter && (
            <p className="text-[length:max(8px,1.9cqw)] text-ink/55 tabular-nums">{unit.perMeter}</p>
          )}
        </div>

        {/* The same four facts in the same order on every unit page, exactly
            as the colophon promises. */}
        <dl className="mt-[2.6cqw] grid grid-cols-4 border-t border-ink/15 pt-[1.8cqw]">
          {(
            [
              [text.keyLabels.ref, unit.refCode],
              [text.keyLabels.area, unit.area],
              [text.keyLabels.floor, unit.floor],
              [text.keyLabels.facing, unit.facing],
            ] as const
          ).map(([label, value], i) => (
            <div key={label} className={cn("min-w-0 px-[1.4cqw]", i > 0 && "border-s border-ink/10", i === 0 && "ps-0")}>
              <dt className="pbook-label truncate text-[length:max(7px,1.5cqw)] text-ink/45">{label}</dt>
              <dd className="mt-[0.5cqw] truncate text-[length:max(8.5px,2.15cqw)] font-semibold tabular-nums">
                <span dir="ltr">{value}</span>
              </dd>
            </div>
          ))}
        </dl>
      </Body>
      <Folio n={unit.sheetNo} brand={text.brand} />
    </Page>
  );
}

export function AreasPage({ text, n }: { text: BookText; n: number }) {
  return (
    <Page>
      <Body>
        <Heading>{text.areasTitle}</Heading>
        <ul className="mt-[4cqw] divide-y divide-ink/10 border-y border-ink/10">
          {text.areas.map((area) => (
            <li key={area.name} className="py-[1.9cqw]">
              <div className="flex items-baseline justify-between gap-[2cqw]">
                <span className="font-display text-[3.6cqw] text-navy">{area.name}</span>
                <span className="pbook-label shrink-0 text-[length:max(7.5px,1.75cqw)] text-gold-deep">{area.count}</span>
              </div>
              <p className="mt-[0.6cqw] text-[length:max(8.5px,2.3cqw)] leading-[1.45] text-ink/60">{area.character}</p>
            </li>
          ))}
        </ul>
      </Body>
      <Folio n={n} brand={text.brand} />
    </Page>
  );
}

export function EnquirePage({ text, n }: { text: BookText; n: number }) {
  return (
    <Page>
      <Body className="justify-center">
        <span aria-hidden="true" className="block h-[0.6cqw] w-[10cqw] bg-gold" />
        <Heading className="mt-[4cqw] text-[7.4cqw]">{text.enquireTitle}</Heading>
        <p className="mt-[3.6cqw] text-[length:max(11px,3cqw)] leading-[1.55] text-ink/70">{text.enquireBody}</p>

        <div className="mt-[6cqw] rounded-[1.4cqw] bg-white/55 p-[4cqw]">
          <p className="pbook-label text-[length:max(8px,1.9cqw)] text-ink/50">{text.whatsapp}</p>
          <p className="mt-[1cqw] text-[5.2cqw] font-bold tabular-nums text-navy">
            <span dir="ltr">{text.phone}</span>
          </p>
          <p className="mt-[2.4cqw] text-[length:max(9.5px,2.5cqw)] text-ink/60">{text.address}</p>
        </div>
      </Body>
      <Folio n={n} brand={text.brand} />
    </Page>
  );
}

export function BackCoverPage({ text }: { text: BookText }) {
  return (
    <Page hard dark>
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(95%_65%_at_50%_100%,rgba(226,167,46,0.1),transparent_70%)]"
      />
      <div className="absolute inset-x-[8cqw] top-1/2 flex -translate-y-1/2 flex-col items-center text-center">
        <Mark className="h-[8cqw] w-auto text-giza/85" />
        <p className="mt-[5cqw] text-[4.4cqw] font-semibold tabular-nums">
          <span dir="ltr">{text.phone}</span>
        </p>
        <p className="mt-[2cqw] text-[length:max(9.5px,2.6cqw)] text-white/70">{text.address}</p>
      </div>
      <p className="absolute inset-x-[8cqw] bottom-[8cqw] border-t border-white/15 pt-[3cqw] text-center text-[length:max(8px,1.95cqw)] leading-[1.5] text-white/55">
        {text.backNote}
      </p>
    </Page>
  );
}
