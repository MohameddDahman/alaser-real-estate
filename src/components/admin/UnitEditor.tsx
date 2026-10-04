"use client";

import Image from "next/image";
import { useActionState, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useLocale, useMessages, useTranslations } from "next-intl";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Plus,
  Trash2,
  Undo2,
} from "lucide-react";

import { deleteUnit, restoreUnit, saveUnit, type SaveState } from "@/app/actions/admin";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { areas, propertyTypes, tenures } from "@/content/client-facts";
import { BLUR } from "@/content/photos";
import type { ListingType, Property, PropertyStatus } from "@/lib/data/types";
import { missingForSite, type SiteRequirement } from "@/lib/data/validation";
import { isOptimisable } from "@/lib/images";
import { cn, formatPrice } from "@/lib/utils";
import { Select } from "@/components/ui/Select";
import { Card } from "./ui";
import { ChipChoice, Field, NumberInput, Segmented, Stepper, Toggle } from "./form-controls";
import { PhotoSection, type PhotoDraft } from "./PhotoSection";
import { Dot, StatusBadge, UNIT_STATUS_CHOICES, UNIT_TONE } from "./status";

/**
 * The unit editor - adding a unit and changing one are the same screen.
 *
 * Everything about a unit is on it, in the order the client thinks about a
 * flat: is it on the market, what and where, the price, the photographs,
 * the size, the words, the details. Rarely used fields fold away.
 *
 * One Save button, pinned to the bottom of the screen, saves all of it -
 * photographs included - and says at all times whether anything is unsaved.
 * Leaving with unsaved changes asks first. A status visitors can see needs
 * both languages and a price; the checklist under the status says what is
 * still missing while the client types, and each item jumps to its field.
 */

type Draft = {
  status: PropertyStatus;
  listingType: ListingType;
  propertyType: string;
  area: string;
  tenure: string;
  price: string;
  currency: "EGP" | "USD";
  period: "month" | "year";
  onRequest: boolean;
  downPaymentPct: string;
  years: string;
  monthlyInstallment: string;
  builtUpArea: string;
  bedrooms: number;
  bathrooms: number;
  landArea: string;
  gardenArea: string;
  floor: string;
  totalFloors: string;
  finishing: string;
  orientation: string;
  furnished: boolean;
  hasElevator: boolean;
  deliveryDate: string;
  yearBuilt: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  highlights: Array<{ en: string; ar: string }>;
  streetEn: string;
  streetAr: string;
  hideExactLocation: boolean;
  amenities: string[];
  featured: boolean;
  photos: PhotoDraft[];
};

const VISIBLE: PropertyStatus[] = ["available", "reserved", "sold", "rented"];
const FINISHINGS = ["core-shell", "semi", "full", "super-lux"] as const;
const ORIENTATIONS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

/** Where each requirement is typed, so the checklist can jump there. */
const FIELD_ID: Record<SiteRequirement, string> = {
  titleEn: "title-en",
  titleAr: "title-ar",
  descriptionEn: "description-en",
  descriptionAr: "description-ar",
  price: "price",
};

const text = (n?: number) => (n === undefined || n === null ? "" : String(n));

function toDraft(unit: Property | null): Draft {
  return {
    status: unit?.status ?? "draft",
    listingType: unit?.listingType ?? "sale",
    propertyType: unit?.propertyType ?? "apartment",
    area: unit?.location.area ?? areas[0].slug,
    tenure: unit?.tenure ?? "tamleek",
    price: text(unit?.price.amount),
    currency: unit?.price.currency ?? "EGP",
    period: unit?.price.period ?? "month",
    onRequest: unit?.price.onRequest ?? false,
    downPaymentPct: text(unit?.paymentPlan?.downPaymentPct),
    years: text(unit?.paymentPlan?.years),
    monthlyInstallment: text(unit?.paymentPlan?.monthlyInstallment),
    builtUpArea: unit?.specs.builtUpArea ? String(unit.specs.builtUpArea) : "",
    bedrooms: unit?.specs.bedrooms ?? 0,
    bathrooms: unit?.specs.bathrooms ?? 0,
    landArea: text(unit?.specs.landArea),
    gardenArea: text(unit?.specs.gardenArea),
    floor: unit?.specs.floor ?? "",
    totalFloors: text(unit?.specs.totalFloors),
    finishing: unit?.specs.finishing ?? "",
    orientation: unit?.specs.orientation ?? "",
    furnished: unit?.specs.furnished ?? false,
    hasElevator: unit?.specs.hasElevator ?? false,
    deliveryDate: unit?.specs.deliveryDate ?? "",
    yearBuilt: text(unit?.specs.yearBuilt),
    titleEn: unit?.title.en ?? "",
    titleAr: unit?.title.ar ?? "",
    descEn: unit?.description.en ?? "",
    descAr: unit?.description.ar ?? "",
    highlights: unit?.highlights ?? [],
    streetEn: unit?.location.street?.en ?? "",
    streetAr: unit?.location.street?.ar ?? "",
    hideExactLocation: unit?.location.hideExactLocation ?? false,
    amenities: unit?.amenities ?? [],
    featured: unit?.featured ?? false,
    photos: (unit?.gallery ?? []).map((image) => ({
      id: image.src,
      src: image.src,
      altEn: image.alt.en,
      altAr: image.alt.ar,
      room: image.room ?? "",
      width: image.width,
      height: image.height,
      blurDataURL: image.blurDataURL,
    })),
  };
}

/**
 * Asks before throwing away unsaved work: on closing or reloading the tab,
 * and on any link inside the dashboard.
 */
function useUnsavedGuard(active: boolean, question: string) {
  useEffect(() => {
    if (!active) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!link || link.getAttribute("target") === "_blank" || link.getAttribute("href")?.startsWith("#")) return;
      if (!window.confirm(question)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [active, question]);
}

export function UnitEditor({
  unit,
  refCode,
  standInCover,
  created,
}: {
  /** The stored unit - its own photographs only - or null for a new one. */
  unit: Property | null;
  refCode: string;
  /** The stand-in photograph visitors see while the unit has none of its own. */
  standInCover?: string;
  created?: boolean;
}) {
  const t = useTranslations("admin");
  const ts = useTranslations("property.status");
  const tp = useTranslations("property");
  const tam = useTranslations("amenities");
  const messages = useMessages() as { amenities: Record<string, string> };
  const locale = useLocale() as Locale;

  const [draft, setDraft] = useState(() => toDraft(unit));
  const [baseline, setBaseline] = useState(() => JSON.stringify(toDraft(unit)));
  const [busy, setBusy] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const [state, formAction, saving] = useActionState<SaveState, FormData>(saveUnit, {});
  const submitted = useRef<string | null>(null);

  const snapshot = JSON.stringify(draft);
  const dirty = snapshot !== baseline;
  const isNew = !unit;
  const isDeleted = unit?.status === "archived";
  const [trashPending, startTrash] = useTransition();

  // A save that went through makes what was sent the new "saved".
  useEffect(() => {
    if (state.ok && submitted.current) setBaseline(submitted.current);
  }, [state]);

  // "Unit created" is said once; a reload should not say it again.
  useEffect(() => {
    if (created) window.history.replaceState(null, "", window.location.pathname);
  }, [created]);

  useUnsavedGuard(dirty && !saving, t("leaveUnsaved"));

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const setPhotos = useCallback(
    (update: (photos: PhotoDraft[]) => PhotoDraft[]) => setDraft((d) => ({ ...d, photos: update(d.photos) })),
    [],
  );

  const visible = VISIBLE.includes(draft.status);
  const missing = missingForSite({
    title: { en: draft.titleEn, ar: draft.titleAr },
    description: { en: draft.descEn, ar: draft.descAr },
    price: { onRequest: draft.onRequest, amount: Number(draft.price) || undefined, currency: draft.currency },
  });
  const blocked = visible && missing.length > 0;
  const flag = (req: SiteRequirement) => showMissing && visible && missing.includes(req);

  const Back = locale === "ar" ? ArrowRight : ArrowLeft;
  const name = (locale === "ar" ? draft.titleAr : draft.titleEn) || draft.titleEn || draft.titleAr;
  const cover = draft.photos[0]?.src ?? standInCover;
  const options = <T extends { slug: string; name: { en: string; ar: string } }>(list: readonly T[]) =>
    list.map((item) => ({ value: item.slug, label: item.name[locale] }));

  /* ------------------------------------------------------------ */

  let message: React.ReactNode = isNew ? t("newUnitHint") : t("noChanges");
  let tone = "text-fg-muted";
  if (busy) message = t("uploadingPhotos");
  else if (saving) message = t("saving");
  else if (state.error) [message, tone] = [t("saveFailed"), "text-danger"];
  else if (showMissing && blocked) [message, tone] = [t("fixBeforeSaving"), "text-danger"];
  else if (dirty) [message, tone] = [t("unsavedChanges"), "text-warning"];
  else if (state.ok) [message, tone] = [t("allSaved"), "text-success"];
  else if (created) [message, tone] = [t("unitCreated"), "text-success"];

  return (
    <div>
      <Link
        href="/admin/properties"
        className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-fg-muted transition-colors hover:text-fg"
      >
        <Back className="size-4" strokeWidth={2} aria-hidden="true" />
        {t("propertiesTitle")}
      </Link>

      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[1.375rem] font-bold leading-tight text-fg sm:text-[1.625rem]">
            {isNew ? t("editorNew") : name || t("untitled")}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
            <span dir="ltr" className="tabular-nums">
              {refCode}
            </span>
            {unit && <StatusBadge tone={UNIT_TONE[unit.status]}>{ts(unit.status)}</StatusBadge>}
          </p>
        </div>
        {unit && VISIBLE.includes(unit.status) && (
          <Link href={`/properties/${unit.slug}`} target="_blank" className="btn btn-quiet btn-sm">
            {t("open")}
            <ExternalLink className="size-3.5" strokeWidth={2} aria-hidden="true" />
          </Link>
        )}
      </div>

      {isDeleted && (
        <div role="status" className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-warning/40 bg-warning-soft p-4 text-sm">
          <Trash2 className="size-4 shrink-0 text-warning" strokeWidth={2} aria-hidden="true" />
          <p className="min-w-0 flex-1 font-medium text-fg">{t("unitIsDeleted")}</p>
          <button
            type="button"
            disabled={trashPending}
            onClick={() => {
              const data = new FormData();
              data.set("id", unit!._id);
              startTrash(async () => {
                await restoreUnit(data);
              });
            }}
            className="btn btn-primary btn-sm"
          >
            <Undo2 className="size-4 rtl:-scale-x-100" strokeWidth={2} aria-hidden="true" />
            {t("restore")}
          </button>
        </div>
      )}

      <form
        action={formAction}
        // "Go" on a phone keyboard must not save half a form.
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.target as HTMLElement).tagName === "INPUT") event.preventDefault();
        }}
        className="mt-5 lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-6"
      >
        <input type="hidden" name="id" value={unit?._id ?? ""} />
        <input type="hidden" name="refCode" value={refCode} />
        <input type="hidden" name="locale" value={locale} />
        <input
          type="hidden"
          name="gallery"
          value={JSON.stringify(
            draft.photos.map(({ src, altEn, altAr, room, width, height, blurDataURL }) => ({
              src,
              altEn,
              altAr,
              room,
              width,
              height,
              blurDataURL,
            })),
          )}
        />
        <input type="hidden" name="highlights" value={JSON.stringify(draft.highlights)} />

        <div className="min-w-0 space-y-4 sm:space-y-5">
          {/* Status ---------------------------------------------------- */}
          <Card id="status" title={t("secStatus")} description={t("statusHelp")}>
            <fieldset>
              <legend className="sr-only">{t("fieldStatus")}</legend>
              <div className="flex flex-wrap gap-2">
                {UNIT_STATUS_CHOICES.map((status) => (
                  <ChipChoice
                    key={status}
                    type="radio"
                    name="status"
                    value={status}
                    checked={draft.status === status}
                    onChange={() => set("status", status)}
                  >
                    <Dot className={UNIT_TONE[status]} />
                    {ts(status)}
                  </ChipChoice>
                ))}
              </div>
            </fieldset>

            {missing.length === 0 ? (
              <p className="mt-4 flex items-center gap-2 text-sm font-medium text-success">
                <CheckCircle2 className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
                {t("readyForSite")}
              </p>
            ) : (
              <div
                className={cn(
                  "mt-4 rounded-lg border p-3 text-sm",
                  blocked ? "border-warning/40 bg-warning-soft" : "border-line bg-surface",
                )}
              >
                <p className="flex items-center gap-2 font-semibold text-fg">
                  {blocked && <AlertTriangle className="size-4 shrink-0 text-warning" strokeWidth={2} aria-hidden="true" />}
                  {blocked ? t("cantShowYet") : t("toPublish")}
                </p>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {missing.map((req) => (
                    <li key={req}>
                      <a href={`#${FIELD_ID[req]}`} className="link">
                        {t(`req.${req}`)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Where it shows, together: on the site at all, and on the home page. */}
            <div className="mt-5 border-t border-line pt-4">
              <Toggle
                name="featured"
                label={t("fieldFeatured")}
                hint={t("fieldFeaturedHint")}
                checked={draft.featured}
                onChange={(value) => set("featured", value)}
              />
            </div>
          </Card>

          {/* The basics ------------------------------------------------ */}
          <Card title={t("secBasics")}>
            <Segmented<ListingType>
              name="listingType"
              label={t("fieldListingType")}
              value={draft.listingType}
              onChange={(value) => set("listingType", value)}
              options={[
                { value: "sale", label: t("forSale") },
                { value: "rent", label: t("forRent") },
              ]}
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Select
                variant="form"
                name="propertyType"
                label={t("fieldType")}
                value={draft.propertyType}
                onChange={(value) => set("propertyType", value)}
                options={options(propertyTypes)}
              />
              <Select
                variant="form"
                name="area"
                label={t("fieldAreaName")}
                value={draft.area}
                onChange={(value) => set("area", value)}
                options={options(areas)}
              />
              <Select
                variant="form"
                name="tenure"
                label={t("fieldTenure")}
                value={draft.tenure}
                onChange={(value) => set("tenure", value)}
                options={options(tenures)}
              />
            </div>
          </Card>

          {/* Price ----------------------------------------------------- */}
          <Card title={t("secPrice")}>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
              <Field
                label={draft.listingType === "rent" ? t("fieldRent") : t("fieldPrice")}
                htmlFor="price"
                hint={
                  draft.price
                    ? formatPrice(Number(draft.price), locale, draft.currency) +
                      (draft.listingType === "rent"
                        ? ` ${draft.period === "year" ? tp("perYear") : tp("perMonth")}`
                        : "")
                    : t("priceHint")
                }
              >
                <NumberInput
                  id="price"
                  name="price"
                  value={draft.price}
                  onChange={(value) => set("price", value)}
                  suffix={draft.currency}
                  invalid={flag("price")}
                />
              </Field>
              <Segmented<"EGP" | "USD">
                name="currency"
                label={t("fieldCurrency")}
                value={draft.currency}
                onChange={(value) => set("currency", value)}
                options={[
                  { value: "EGP", label: t("currencyEGP") },
                  { value: "USD", label: t("currencyUSD") },
                ]}
              />
            </div>

            {draft.listingType === "rent" && (
              <div className="mt-4 sm:max-w-xs">
                <Segmented<"month" | "year">
                  name="period"
                  label={t("fieldPeriod")}
                  value={draft.period}
                  onChange={(value) => set("period", value)}
                  options={[
                    { value: "month", label: tp("perMonth") },
                    { value: "year", label: tp("perYear") },
                  ]}
                />
              </div>
            )}

            <div className="mt-5">
              <Toggle
                name="priceOnRequest"
                label={t("fieldOnRequest")}
                hint={t("fieldOnRequestHint")}
                checked={draft.onRequest}
                onChange={(value) => set("onRequest", value)}
              />
            </div>

            {draft.listingType === "sale" && (
              <Fold title={t("paymentPlan")} hint={t("paymentPlanHint")} open={Boolean(unit?.paymentPlan)}>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label={t("fieldDown")} htmlFor="downPaymentPct">
                    <NumberInput
                      id="downPaymentPct"
                      name="downPaymentPct"
                      value={draft.downPaymentPct}
                      onChange={(value) => set("downPaymentPct", value)}
                      suffix="%"
                    />
                  </Field>
                  <Field label={t("fieldYears")} htmlFor="years">
                    <NumberInput
                      id="years"
                      name="years"
                      value={draft.years}
                      onChange={(value) => set("years", value)}
                      suffix={t("yearsShort")}
                    />
                  </Field>
                  <Field label={t("fieldMonthly")} htmlFor="monthlyInstallment">
                    <NumberInput
                      id="monthlyInstallment"
                      name="monthlyInstallment"
                      value={draft.monthlyInstallment}
                      onChange={(value) => set("monthlyInstallment", value)}
                      suffix={draft.currency}
                    />
                  </Field>
                </div>
              </Fold>
            )}
          </Card>

          {/* Photographs ----------------------------------------------- */}
          <Card title={t("photosTitle")} description={t("photosIntro")}>
            <PhotoSection
              refCode={refCode}
              titleEn={draft.titleEn}
              titleAr={draft.titleAr}
              photos={draft.photos}
              onChange={setPhotos}
              onBusyChange={setBusy}
              standIn={Boolean(standInCover)}
            />
          </Card>

          {/* Size and rooms -------------------------------------------- */}
          <Card title={t("secSize")}>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t("fieldArea")} htmlFor="builtUpArea">
                <NumberInput
                  id="builtUpArea"
                  name="builtUpArea"
                  value={draft.builtUpArea}
                  onChange={(value) => set("builtUpArea", value)}
                  suffix="m²"
                />
              </Field>
              <Stepper
                id="bedrooms"
                name="bedrooms"
                label={t("fieldBeds")}
                value={draft.bedrooms}
                onChange={(value) => set("bedrooms", value)}
              />
              <Stepper
                id="bathrooms"
                name="bathrooms"
                label={t("fieldBaths")}
                value={draft.bathrooms}
                onChange={(value) => set("bathrooms", value)}
              />
            </div>

            <Fold title={t("moreDetails")} hint={t("moreDetailsHint")}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("fieldLandArea")} htmlFor="landArea">
                  <NumberInput id="landArea" name="landArea" value={draft.landArea} onChange={(v) => set("landArea", v)} suffix="m²" />
                </Field>
                <Field label={t("fieldGardenArea")} htmlFor="gardenArea">
                  <NumberInput id="gardenArea" name="gardenArea" value={draft.gardenArea} onChange={(v) => set("gardenArea", v)} suffix="m²" />
                </Field>
                <Field label={t("fieldFloor")} htmlFor="floor" hint={t("floorHint")}>
                  <input
                    id="floor"
                    name="floor"
                    value={draft.floor}
                    onChange={(event) => set("floor", event.target.value)}
                    autoComplete="off"
                    className="field"
                  />
                </Field>
                <Field label={t("fieldTotalFloors")} htmlFor="totalFloors">
                  <NumberInput id="totalFloors" name="totalFloors" value={draft.totalFloors} onChange={(v) => set("totalFloors", v)} />
                </Field>
                <Select
                  variant="form"
                  name="finishing"
                  label={t("fieldFinishing")}
                  value={draft.finishing}
                  onChange={(value) => set("finishing", value)}
                  options={[
                    { value: "", label: t("notSet") },
                    ...FINISHINGS.map((value) => ({ value, label: tp(`finishingLevel.${value}`) })),
                  ]}
                />
                <Select
                  variant="form"
                  name="orientation"
                  label={t("fieldOrientation")}
                  value={draft.orientation}
                  onChange={(value) => set("orientation", value)}
                  options={[
                    { value: "", label: t("notSet") },
                    ...ORIENTATIONS.map((value) => ({ value, label: tp(`orientationName.${value}`) })),
                  ]}
                />
                <Field label={t("fieldDelivery")} htmlFor="deliveryDate" hint={t("deliveryHint")}>
                  <input
                    id="deliveryDate"
                    name="deliveryDate"
                    type="month"
                    value={draft.deliveryDate}
                    onChange={(event) => set("deliveryDate", event.target.value)}
                    className="field"
                  />
                </Field>
                <Field label={t("fieldYearBuilt")} htmlFor="yearBuilt">
                  <NumberInput id="yearBuilt" name="yearBuilt" value={draft.yearBuilt} onChange={(v) => set("yearBuilt", v)} />
                </Field>
                <div className="space-y-4 sm:col-span-2">
                  <Toggle name="furnished" label={t("fieldFurnished")} checked={draft.furnished} onChange={(v) => set("furnished", v)} />
                  <Toggle name="hasElevator" label={t("fieldElevator")} checked={draft.hasElevator} onChange={(v) => set("hasElevator", v)} />
                </div>
              </div>
            </Fold>
          </Card>

          {/* Title and description ------------------------------------- */}
          <Card title={t("secText")} description={t("secTextHelp")}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t("fieldTitleEn")} htmlFor="title-en">
                <input
                  id="title-en"
                  name="title.en"
                  dir="ltr"
                  lang="en"
                  value={draft.titleEn}
                  onChange={(event) => set("titleEn", event.target.value)}
                  aria-invalid={flag("titleEn") || undefined}
                  className="field scroll-mt-24"
                />
              </Field>
              <Field label={t("fieldTitleAr")} htmlFor="title-ar">
                <input
                  id="title-ar"
                  name="title.ar"
                  dir="rtl"
                  lang="ar"
                  value={draft.titleAr}
                  onChange={(event) => set("titleAr", event.target.value)}
                  aria-invalid={flag("titleAr") || undefined}
                  className="field scroll-mt-24"
                />
              </Field>
              <Field label={t("fieldDescriptionEn")} htmlFor="description-en">
                <textarea
                  id="description-en"
                  name="description.en"
                  dir="ltr"
                  lang="en"
                  rows={6}
                  value={draft.descEn}
                  onChange={(event) => set("descEn", event.target.value)}
                  aria-invalid={flag("descriptionEn") || undefined}
                  className="field scroll-mt-24"
                />
              </Field>
              <Field label={t("fieldDescriptionAr")} htmlFor="description-ar">
                <textarea
                  id="description-ar"
                  name="description.ar"
                  dir="rtl"
                  lang="ar"
                  rows={6}
                  value={draft.descAr}
                  onChange={(event) => set("descAr", event.target.value)}
                  aria-invalid={flag("descriptionAr") || undefined}
                  className="field scroll-mt-24"
                />
              </Field>
            </div>

            <Fold
              title={`${t("fieldHighlights")}${draft.highlights.length ? ` (${draft.highlights.length})` : ""}`}
              hint={t("highlightsHint")}
            >
              <div className="space-y-3">
                {draft.highlights.map((point, i) => (
                  <div key={i} className="grid gap-2 rounded-lg bg-surface p-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <input
                      aria-label={`${t("fieldHighlights")} ${i + 1} · ${t("fieldsEnglish")}`}
                      placeholder={t("fieldsEnglish")}
                      dir="ltr"
                      lang="en"
                      value={point.en}
                      onChange={(event) =>
                        set("highlights", draft.highlights.map((h, j) => (j === i ? { ...h, en: event.target.value } : h)))
                      }
                      className="field"
                    />
                    <input
                      aria-label={`${t("fieldHighlights")} ${i + 1} · ${t("fieldsArabic")}`}
                      placeholder={t("fieldsArabic")}
                      dir="rtl"
                      lang="ar"
                      value={point.ar}
                      onChange={(event) =>
                        set("highlights", draft.highlights.map((h, j) => (j === i ? { ...h, ar: event.target.value } : h)))
                      }
                      className="field"
                    />
                    <button
                      type="button"
                      onClick={() => set("highlights", draft.highlights.filter((_, j) => j !== i))}
                      className="btn btn-quiet"
                    >
                      <Trash2 className="size-4" strokeWidth={2} aria-hidden="true" />
                      <span className="sm:sr-only">{t("removePoint")}</span>
                    </button>
                  </div>
                ))}
                {draft.highlights.length < 6 && (
                  <button
                    type="button"
                    onClick={() => set("highlights", [...draft.highlights, { en: "", ar: "" }])}
                    className="btn btn-quiet btn-sm"
                  >
                    <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
                    {t("addPoint")}
                  </button>
                )}
              </div>
            </Fold>
          </Card>

          {/* Location -------------------------------------------------- */}
          <Card title={t("secLocation")}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t("fieldStreetEn")} htmlFor="street-en">
                <input
                  id="street-en"
                  name="street.en"
                  dir="ltr"
                  lang="en"
                  value={draft.streetEn}
                  onChange={(event) => set("streetEn", event.target.value)}
                  className="field"
                />
              </Field>
              <Field label={t("fieldStreetAr")} htmlFor="street-ar">
                <input
                  id="street-ar"
                  name="street.ar"
                  dir="rtl"
                  lang="ar"
                  value={draft.streetAr}
                  onChange={(event) => set("streetAr", event.target.value)}
                  className="field"
                />
              </Field>
            </div>
            <div className="mt-5">
              <Toggle
                name="hideExactLocation"
                label={t("hideStreet")}
                hint={t("hideStreetHint")}
                checked={draft.hideExactLocation}
                onChange={(value) => set("hideExactLocation", value)}
              />
            </div>
          </Card>

          {/* Features -------------------------------------------------- */}
          <Card title={t("secFeatures")} description={t("secFeaturesHelp")}>
            <fieldset>
              <legend className="sr-only">{t("secFeatures")}</legend>
              <div className="flex flex-wrap gap-2">
                {Object.keys(messages.amenities).map((key) => (
                  <ChipChoice
                    key={key}
                    type="checkbox"
                    name="amenities"
                    value={key}
                    checked={draft.amenities.includes(key)}
                    onChange={(on) =>
                      set("amenities", on ? [...draft.amenities, key] : draft.amenities.filter((a) => a !== key))
                    }
                  >
                    {tam(key)}
                  </ChipChoice>
                ))}
              </div>
            </fieldset>
          </Card>


          {/* Delete - to Deleted items, where it can be restored. -------- */}
          {unit && !isDeleted && (
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[0.9375rem] font-semibold text-fg">{t("deleteUnitTitle")}</p>
                  <p className="mt-0.5 text-sm text-fg-muted">{t("deleteUnitHint")}</p>
                </div>
                <button
                  type="button"
                  disabled={trashPending}
                  onClick={() => {
                    if (!window.confirm(t("confirmDeleteUnit", { ref: refCode }))) return;
                    const data = new FormData();
                    data.set("id", unit._id);
                    data.set("locale", locale);
                    startTrash(async () => {
                      await deleteUnit(data);
                    });
                  }}
                  className="btn btn-quiet btn-sm shrink-0 text-danger hover:border-danger hover:bg-danger/5"
                >
                  <Trash2 className="size-4" strokeWidth={2} aria-hidden="true" />
                  {t("deleteUnit")}
                </button>
              </div>
            </Card>
          )}

          {/* Save ------------------------------------------------------ */}
          <div
            className="sticky bottom-0 z-20 -mx-4 border-t border-line bg-canvas/95 px-4 pt-3 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-xl lg:border lg:px-4 lg:shadow-raised"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-center gap-3">
              <p role="status" aria-live="polite" className={cn("min-w-0 flex-1 text-sm font-medium", tone)}>
                {state.ok && !dirty && (
                  <CheckCircle2 className="me-1.5 inline size-4 align-[-3px]" strokeWidth={2} aria-hidden="true" />
                )}
                {message}
              </p>
              <button
                type="submit"
                disabled={saving || busy || (!dirty && !isNew)}
                onClick={(event) => {
                  if (blocked) {
                    event.preventDefault();
                    setShowMissing(true);
                    document.getElementById("status")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    return;
                  }
                  setShowMissing(false);
                  submitted.current = snapshot;
                }}
                className="btn btn-primary btn-lg shrink-0 px-7"
              >
                {saving ? t("saving") : isNew ? t("createUnit") : t("save")}
              </button>
            </div>
          </div>
        </div>

        {/* What visitors will see - beside the form on a laptop. -------- */}
        <aside className="sticky top-22 hidden lg:block">
          <p className="mb-2 text-sm font-medium text-fg-muted">{t("previewTitle")}</p>
          <div className="overflow-hidden rounded-xl border border-line bg-canvas shadow-card">
            <div className="relative aspect-[4/3] bg-surface-2">
              {cover && (
                <Image
                  src={cover}
                  alt=""
                  fill
                  sizes="18rem"
                  placeholder="blur"
                  blurDataURL={draft.photos[0]?.blurDataURL || BLUR}
                  unoptimized={!isOptimisable(cover)}
                  className="graded object-cover"
                />
              )}
              <span className="absolute end-3 top-3 rounded-md bg-white/95 px-2 py-1 text-xs font-semibold text-fg shadow-card tabular-nums" dir="ltr">
                {refCode}
              </span>
            </div>
            <div className="p-4">
              <p className="font-semibold leading-snug text-fg">{name || <span className="text-fg-subtle">{t("untitled")}</span>}</p>
              <p className="mt-1 text-sm text-fg-muted">
                {[
                  draft.bedrooms ? tp("bedrooms", { count: draft.bedrooms }) : null,
                  draft.builtUpArea ? `${draft.builtUpArea} m²` : null,
                  areas.find((a) => a.slug === draft.area)?.name[locale],
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="mt-2 text-lg font-bold text-fg tabular-nums">
                {draft.onRequest
                  ? tp("priceOnRequest")
                  : draft.price
                    ? formatPrice(Number(draft.price), locale, draft.currency)
                    : "—"}
              </p>
            </div>
          </div>
          {standInCover && draft.photos.length === 0 && (
            <p className="mt-2 text-xs text-fg-muted">{t("previewStandIn")}</p>
          )}
        </aside>
      </form>
    </div>
  );
}

/** A group of fields that stays folded until it is wanted. */
function Fold({
  title,
  hint,
  open,
  children,
}: {
  title: string;
  hint?: string;
  open?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={open} className="group mt-5 rounded-lg border border-line">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-2 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block text-[0.9375rem] font-semibold text-fg">{title}</span>
          {hint && <span className="block text-xs text-fg-muted">{hint}</span>}
        </span>
        <ChevronDown
          className="size-4 shrink-0 text-fg-muted transition-transform group-open:rotate-180"
          strokeWidth={2}
          aria-hidden="true"
        />
      </summary>
      <div className="border-t border-line p-3.5">{children}</div>
    </details>
  );
}
