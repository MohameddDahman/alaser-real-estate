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
 * Every size is in container-query units (`cqw`), so a page scales as one
 * object, the way a printed sheet does, from a phone to a wide desk.
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
          dark ? "bg-navy text-sheet" : "pbook-paper text-ink",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** The drawing-sheet frame: a margin rule inset from the trim edge. */
function SheetFrame({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div
      className={cn(
        "absolute inset-[4.5cqw] flex flex-col border",
        dark ? "border-navy-edge" : "border-sheet-edge",
      )}
    >
      {children}
    </div>
  );
}

/**
 * Page number, set in the corner where a drawing's sheet number lives.
 *
 * Odd folios open a spread and even ones close it, so the number always sits
 * on the outer corner, away from the gutter. `start` and `end` follow the
 * reading direction on purpose: the page that is a verso in English is a
 * recto in Arabic, and the same rule puts its number on the right side.
 */
function Folio({ n, label }: { n: number; label: string }) {
  return (
    <p
      className={cn(
        "label absolute bottom-[1.6cqw] text-[1.9cqw] text-ink/45",
        n % 2 === 1 ? "start-[4.5cqw]" : "end-[4.5cqw]",
      )}
    >
      {label} <span className="font-data tabular-nums">{String(n).padStart(3, "0")}</span>
    </p>
  );
}

/* ------------------------------------------------------------------ */

export function CoverPage({ text }: { text: BookText }) {
  return (
    <Page hard dark>
      {/* A faint survey grid pressed into the board, like a blind emboss. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
          backgroundSize: "9cqw 9cqw",
        }}
      />
      {/* Light falling on the board from above. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(90%_60%_at_50%_0%,rgba(201,187,160,0.16),transparent_70%)]"
      />
      <SheetFrame dark>
        <div className="flex flex-1 flex-col items-center justify-center px-[6cqw] text-center">
          <Mark className="h-[11cqw] w-auto text-giza" />
          {/* Tracking leaves a space after the last letter; the matching
              indent keeps the word optically centred. */}
          <p
            dir="ltr"
            className="pbook-foil mt-[4cqw] ps-[0.42em] font-display text-[4.2cqw] leading-none tracking-[0.42em] [font-variation-settings:'wdth'_100,'wght'_500]"
          >
            {text.brand}
          </p>
          <p lang="ar" dir="rtl" className="mt-[2.2cqw] font-body text-[3.4cqw] text-giza">
            {text.arabicBrand}
          </p>

          <span aria-hidden="true" className="my-[7cqw] block h-px w-[18cqw] bg-giza/50" />

          <p className="font-display text-[10cqw] leading-[0.95]">{text.coverTitle}</p>
          <p className="mt-[3cqw] text-[2.9cqw] text-giza">{text.coverSub}</p>
        </div>

        <div className="flex items-end justify-between gap-[3cqw] border-t border-navy-edge px-[4cqw] py-[3cqw]">
          <p className="label text-[2cqw] text-giza">{text.volume}</p>
          <p className="label text-end text-[2cqw] text-giza/80">{text.date}</p>
        </div>
      </SheetFrame>

      <p className="label absolute inset-x-0 bottom-[1.2cqw] text-center text-[1.7cqw] text-giza/60">
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
      <SheetFrame>
        <div className="flex flex-1 flex-col px-[6cqw] py-[7cqw]">
          <p className="label text-[2cqw] text-survey-deep">{text.volume}</p>
          <h2 className="mt-[2.5cqw] font-display text-[7cqw] leading-[1.02]">
            {text.colophonTitle}
          </h2>
          <p className="mt-[4cqw] text-[3cqw] leading-[1.55] text-ink/70">{text.colophonBody}</p>

          {/* The title block, as a legend: the same device every sheet uses. */}
          <dl className="mt-[5cqw] border-s border-t border-sheet-edge">
            {rows.map(([label, sample, gloss]) => (
              <div key={label} className="grid grid-cols-[30%_1fr] border-b border-e border-sheet-edge">
                <div className="border-e border-sheet-edge px-[2.4cqw] py-[2cqw]">
                  <dt className="label text-[1.8cqw] text-ink/50">{label}</dt>
                  <dd className="mt-[0.8cqw] font-data text-[2.8cqw] tabular-nums" dir="ltr">
                    {sample}
                  </dd>
                </div>
                <dd className="px-[2.4cqw] py-[2cqw] text-[2.5cqw] leading-[1.45] text-ink/70">
                  {gloss}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </SheetFrame>
      <Folio n={n} label={text.sheet} />
    </Page>
  );
}

/**
 * The frontispiece. It appears only when the imposition needs one more page
 * ahead of the schedule (see layout.ts), and faces the colophon.
 */
export function PlatePage({ text, n }: { text: BookText; n: number }) {
  return (
    <Page>
      <SheetFrame>
        <div className="relative flex-1 overflow-hidden bg-navy">
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
        </div>
        <div className="flex items-baseline gap-[3cqw] border-t border-sheet-edge px-[3.5cqw] py-[2.6cqw]">
          <p className="label shrink-0 text-[1.9cqw] text-survey-deep">{text.plate.label}</p>
          <p className="text-[2.35cqw] leading-[1.45] text-ink/70">{text.plate.caption}</p>
        </div>
      </SheetFrame>
      <Folio n={n} label={text.sheet} />
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
      <SheetFrame>
        <div className="flex flex-1 flex-col px-[6cqw] py-[7cqw]">
          <h2 className="font-display text-[7cqw] leading-[1.02]">
            {continued ? text.contentsContinued : text.contentsTitle}
          </h2>

          {/* A schedule - the table every drawing set carries - with the
              sheet each unit starts on. Real page numbers, computed. */}
          <ol className="mt-[5cqw] flex-1 border-t border-sheet-edge">
            {units.map((unit) => (
              <li
                key={unit.refCode}
                className="grid grid-cols-[1fr_auto] items-baseline gap-[2cqw] border-b border-sheet-edge py-[1.55cqw]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[2.55cqw] font-medium">{unit.title}</span>
                  <span className="label block text-[1.8cqw] text-ink/50">
                    <span className="font-data" dir="ltr">
                      {unit.refCode}
                    </span>{" "}
                    · {unit.areaName}
                  </span>
                </span>
                <span className="font-data text-[2.3cqw] text-survey-deep tabular-nums" dir="ltr">
                  {String(unit.photoNo).padStart(3, "0")}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </SheetFrame>
      <Folio n={n} label={text.sheet} />
    </Page>
  );
}

/** The photograph, left-hand page of each spread. */
export function UnitPhotoPage({ unit, text }: { unit: BookUnit; text: BookText }) {
  return (
    <Page>
      <SheetFrame>
        <div className="relative flex-1 overflow-hidden bg-navy">
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
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-[2cqw] bg-gradient-to-t from-navy/85 to-transparent px-[3.5cqw] pb-[3cqw] pt-[12cqw] text-sheet">
            {unit.photo?.room && (
              <span className="label text-[1.9cqw] text-giza">{unit.photo.room}</span>
            )}
            <span className="font-data text-[2.1cqw] tracking-[0.12em]" dir="ltr">
              {unit.refCode}
            </span>
          </div>
        </div>
      </SheetFrame>
      <Folio n={unit.photoNo} label={text.sheet} />
    </Page>
  );
}

/** The measured sheet, right-hand page of each spread. */
export function UnitSheetPage({ unit, text }: { unit: BookUnit; text: BookText }) {
  return (
    <Page>
      <SheetFrame>
        <div className="flex flex-1 flex-col px-[5cqw] pt-[5cqw]">
          <div className="flex items-baseline justify-between gap-[2cqw]">
            <p className="label text-[1.85cqw] text-ink/55">
              {unit.areaName} · {unit.tenure}
            </p>
            <p
              className={cn(
                "label text-[1.85cqw]",
                unit.isReserved ? "text-reserved" : "text-available",
              )}
            >
              {unit.statusLabel}
            </p>
          </div>

          <h3 className="mt-[2cqw] font-display text-[5.2cqw] leading-[1.06]">{unit.title}</h3>

          {/* The plan, drawn in survey ink - the unit's own geometry. */}
          <div className="mt-[3cqw] flex flex-1 items-center justify-center text-survey-deep/85">
            {unit.plan && <PlanPlate plan={unit.plan} className="max-h-[42cqw]" withLabels />}
          </div>

          <p className="mt-[2.5cqw] text-[2.35cqw] text-ink/65">
            {unit.bedsBaths}
            {unit.finishing ? ` · ${unit.finishing}` : ""}
          </p>

          {unit.highlight && (
            <p className="mt-[1cqw] border-s-2 border-survey-deep ps-[2cqw] text-[2.35cqw] leading-[1.4]">
              {unit.highlight}
            </p>
          )}

          <div className="mt-[2.5cqw] flex items-baseline justify-between gap-[2cqw] border-t border-sheet-edge pt-[2.4cqw]">
            {/* The figure is isolated left-to-right; the period sits beside it
                in the reading direction. Set as one run, an Arabic currency
                and an Arabic period would join into a single word. */}
            <p className="font-data text-[3.9cqw] leading-none tabular-nums">
              <span dir="ltr">{unit.price}</span>
              {unit.period && (
                <span className="ms-[1.2cqw] font-body text-[2cqw] text-ink/50">{unit.period}</span>
              )}
            </p>
            {unit.perMeter && (
              <p className="font-data text-[1.9cqw] text-ink/50 tabular-nums" dir="ltr">
                {unit.perMeter} /m²
              </p>
            )}
          </div>
        </div>

        {/* The title block: the same four facts in the same place on every
            sheet, exactly as the colophon promises. */}
        <dl className="mt-[3cqw] grid grid-cols-4 border-t border-sheet-edge">
          {(
            [
              [text.keyLabels.ref, unit.refCode],
              [text.keyLabels.area, unit.area],
              [text.keyLabels.floor, unit.floor],
              [text.keyLabels.facing, unit.facing],
            ] as const
          ).map(([label, value], i) => (
            <div
              key={label}
              className={cn("px-[2cqw] py-[1.8cqw]", i < 3 && "border-e border-sheet-edge")}
            >
              <dt className="label text-[1.55cqw] text-ink/45">{label}</dt>
              <dd className="mt-[0.6cqw] truncate font-data text-[2.15cqw] tabular-nums" dir="ltr">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </SheetFrame>
      <Folio n={unit.sheetNo} label={text.sheet} />
    </Page>
  );
}

export function AreasPage({ text, n }: { text: BookText; n: number }) {
  return (
    <Page>
      <SheetFrame>
        <div className="flex flex-1 flex-col px-[6cqw] py-[7cqw]">
          <h2 className="font-display text-[7cqw] leading-[1.02]">{text.areasTitle}</h2>
          <ul className="mt-[5cqw] border-t border-sheet-edge">
            {text.areas.map((area) => (
              <li key={area.name} className="border-b border-sheet-edge py-[2.2cqw]">
                <div className="flex items-baseline justify-between gap-[2cqw]">
                  <span className="font-display text-[3.6cqw]">{area.name}</span>
                  <span className="label text-[1.8cqw] text-survey-deep">{area.count}</span>
                </div>
                <p className="mt-[0.8cqw] text-[2.3cqw] leading-[1.45] text-ink/60">
                  {area.character}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </SheetFrame>
      <Folio n={n} label={text.sheet} />
    </Page>
  );
}

export function EnquirePage({ text, n }: { text: BookText; n: number }) {
  return (
    <Page>
      <SheetFrame>
        <div className="flex flex-1 flex-col justify-center px-[7cqw]">
          <h2 className="font-display text-[7.5cqw] leading-[1.02]">{text.enquireTitle}</h2>
          <p className="mt-[4cqw] text-[3.1cqw] leading-[1.55] text-ink/70">{text.enquireBody}</p>

          <div className="mt-[7cqw] border-t border-sheet-edge pt-[4cqw]">
            <p className="label text-[1.9cqw] text-ink/50">{text.whatsapp}</p>
            <p className="mt-[1cqw] font-data text-[5cqw] tabular-nums text-survey-deep" dir="ltr">
              {text.phone}
            </p>
            <p className="mt-[3.5cqw] text-[2.5cqw] text-ink/60">{text.address}</p>
          </div>
        </div>
      </SheetFrame>
      <Folio n={n} label={text.sheet} />
    </Page>
  );
}

export function BackCoverPage({ text }: { text: BookText }) {
  return (
    <Page hard dark>
      <SheetFrame dark>
        <div className="flex flex-1 flex-col items-center justify-center px-[8cqw] text-center">
          <Mark className="h-[8cqw] w-auto text-giza/80" />
          <p className="mt-[5cqw] font-data text-[4.2cqw] tabular-nums" dir="ltr">
            {text.phone}
          </p>
          <p className="mt-[2cqw] text-[2.6cqw] text-giza">{text.address}</p>
        </div>
        <p className="border-t border-navy-edge px-[5cqw] py-[3cqw] text-center text-[1.95cqw] leading-[1.5] text-giza/70">
          {text.backNote}
        </p>
      </SheetFrame>
    </Page>
  );
}
