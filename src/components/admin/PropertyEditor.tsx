"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Check } from "lucide-react";

import { saveProperty, type SaveState } from "@/app/actions/admin";
import { PlanPlate } from "@/components/plan/PlanPlate";
import type { FloorPlan, Property } from "@/lib/data/types";
import type { Locale } from "@/i18n/routing";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * The property editor.
 *
 * Two columns: fields on the left, a live preview of what visitors will
 * actually see on the right. The client sees what they are publishing before
 * they publish it, which is the single biggest reason this dashboard will not
 * generate support calls.
 *
 * English and Arabic sit side by side on every text field - not behind a
 * language tab - because a tab is how half-translated listings happen.
 * Publishing is blocked until both are filled, and the reason is named.
 */
export function PropertyEditor({
  property,
  plan,
  locale,
}: {
  property: Property;
  plan: FloorPlan | null;
  locale: Locale;
}) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState<SaveState, FormData>(saveProperty, {});

  const [draft, setDraft] = useState({
    titleEn: property.title.en,
    titleAr: property.title.ar,
    descEn: property.description.en,
    descAr: property.description.ar,
    price: property.price.amount ?? 0,
    builtUpArea: property.specs.builtUpArea,
    bedrooms: property.specs.bedrooms,
    bathrooms: property.specs.bathrooms,
  });

  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const previewTitle = locale === "ar" ? draft.titleAr : draft.titleEn;
  const previewDesc = locale === "ar" ? draft.descAr : draft.descEn;

  return (
    <form action={action} className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-12">
      <input type="hidden" name="id" value={property._id} />

      <div className="min-w-0">
        {state.blocked && (
          <p
            role="alert"
            className="mb-6 flex items-start gap-2.5 border border-danger/50 bg-danger/10 px-4 py-3 text-danger"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            {t("publishBlocked", { fields: state.blocked.join(", ") })}
          </p>
        )}
        {state.ok && (
          <p role="status" className="mb-6 flex items-center gap-2 text-available">
            <Check className="size-4" strokeWidth={2} aria-hidden="true" />
            {t("saved")}
          </p>
        )}

        <BilingualField
          label={t("fieldTitle")}
          nameEn="title.en"
          nameAr="title.ar"
          valueEn={draft.titleEn}
          valueAr={draft.titleAr}
          onEn={(v) => set("titleEn", v)}
          onAr={(v) => set("titleAr", v)}
        />

        <BilingualField
          label={t("fieldDescription")}
          nameEn="description.en"
          nameAr="description.ar"
          valueEn={draft.descEn}
          valueAr={draft.descAr}
          onEn={(v) => set("descEn", v)}
          onAr={(v) => set("descAr", v)}
          textarea
        />

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <NumberField
            label={t("fieldPrice")}
            name="price"
            value={draft.price}
            onChange={(v) => set("price", v)}
          />
          <NumberField
            label={t("fieldArea")}
            name="builtUpArea"
            value={draft.builtUpArea}
            onChange={(v) => set("builtUpArea", v)}
          />
          <NumberField
            label={t("fieldBeds")}
            name="bedrooms"
            value={draft.bedrooms}
            onChange={(v) => set("bedrooms", v)}
          />
          <NumberField
            label={t("fieldBaths")}
            name="bathrooms"
            value={draft.bathrooms}
            onChange={(v) => set("bathrooms", v)}
          />
        </div>

        {/* No hard delete anywhere in this dashboard. Archive only. */}
        <div className="mt-10 flex flex-wrap gap-3 border-t border-sheet-edge pt-6">
          <Action name="intent" value="save" primary pending={pending}>
            {pending ? t("saving") : t("save")}
          </Action>
          {property.status !== "available" && (
            <Action name="intent" value="publish" pending={pending}>
              {t("publish")}
            </Action>
          )}
          {property.status === "available" && (
            <Action name="intent" value="unpublish" pending={pending}>
              {t("unpublish")}
            </Action>
          )}
          <Action name="intent" value="archive" pending={pending} muted>
            {t("archive")}
          </Action>
        </div>
      </div>

      {/* Live preview ------------------------------------------------- */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <h2 className="label text-ink/55">{t("previewTitle")}</h2>

        <div className="mt-3 border border-sheet-edge bg-navy p-4">
          <p className="label mb-3 text-giza-dim">{t("previewCard")}</p>

          <div className="relative aspect-[4/3] border border-navy-edge bg-navy-lift">
            {plan && (
              <div className="absolute inset-0 p-5 text-survey/80">
                <PlanPlate plan={plan} />
              </div>
            )}
            <span className="label absolute end-3 top-3 bg-navy/70 px-2 py-1 text-giza" dir="ltr">
              {property.refCode}
            </span>
          </div>

          <h3
            className="mt-4 font-display text-[1.15rem] leading-tight text-sheet"
            lang={locale}
            dir={locale === "ar" ? "rtl" : "ltr"}
          >
            {previewTitle || <span className="text-danger">— {t("fieldTitle")} —</span>}
          </h3>

          <p className="mt-2 text-[0.85rem] text-giza-dim">
            {draft.bedrooms > 0 && `${draft.bedrooms} · `}
            <span className="font-data tabular-nums">{draft.builtUpArea}</span> m²
          </p>

          <p className="mt-3 border-t border-navy-edge pt-3 font-data text-[0.9rem] text-sheet tabular-nums" dir="ltr">
            {draft.price ? formatPrice(draft.price, locale, property.price.currency) : "—"}
          </p>

          <p
            className="mt-4 line-clamp-4 border-t border-navy-edge pt-3 text-[0.82rem] leading-relaxed text-giza-dim"
            lang={locale}
            dir={locale === "ar" ? "rtl" : "ltr"}
          >
            {previewDesc || "—"}
          </p>
        </div>
      </aside>
    </form>
  );
}

/* ------------------------------------------------------------------ */

function BilingualField({
  label,
  nameEn,
  nameAr,
  valueEn,
  valueAr,
  onEn,
  onAr,
  textarea,
}: {
  label: string;
  nameEn: string;
  nameAr: string;
  valueEn: string;
  valueAr: string;
  onEn: (v: string) => void;
  onAr: (v: string) => void;
  textarea?: boolean;
}) {
  const t = useTranslations("admin");
  const base =
    "mt-2 w-full border bg-sheet px-3 py-2.5 text-[1rem] outline-none transition-colors focus:border-ink";

  return (
    <div className="mt-8 first:mt-0">
      <p className="label text-ink/55">{label}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={nameEn} className="label mt-3 block text-ink/45">
            {t("fieldsEnglish")}
          </label>
          {textarea ? (
            <textarea
              id={nameEn}
              name={nameEn}
              rows={7}
              dir="ltr"
              value={valueEn}
              onChange={(e) => onEn(e.target.value)}
              className={cn(base, "min-h-12", valueEn.trim() ? "border-sheet-edge" : "border-danger/60")}
            />
          ) : (
            <input
              id={nameEn}
              name={nameEn}
              dir="ltr"
              value={valueEn}
              onChange={(e) => onEn(e.target.value)}
              className={cn(base, "min-h-12", valueEn.trim() ? "border-sheet-edge" : "border-danger/60")}
            />
          )}
        </div>

        <div>
          <label htmlFor={nameAr} className="label mt-3 block text-ink/45" lang="ar">
            {t("fieldsArabic")}
          </label>
          {textarea ? (
            <textarea
              id={nameAr}
              name={nameAr}
              rows={7}
              dir="rtl"
              lang="ar"
              value={valueAr}
              onChange={(e) => onAr(e.target.value)}
              className={cn(base, "min-h-12", valueAr.trim() ? "border-sheet-edge" : "border-danger/60")}
            />
          ) : (
            <input
              id={nameAr}
              name={nameAr}
              dir="rtl"
              lang="ar"
              value={valueAr}
              onChange={(e) => onAr(e.target.value)}
              className={cn(base, "min-h-12", valueAr.trim() ? "border-sheet-edge" : "border-danger/60")}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function NumberField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label htmlFor={name} className="label block text-ink/55">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        inputMode="numeric"
        dir="ltr"
        value={value}
        onChange={(e) => onChange(Number(e.target.value.replace(/[^\d]/g, "")) || 0)}
        className="mt-2 min-h-12 w-full border border-sheet-edge bg-sheet px-3 font-data text-[1rem] tabular-nums outline-none transition-colors focus:border-ink"
      />
    </div>
  );
}

function Action({
  children,
  name,
  value,
  primary,
  muted,
  pending,
}: {
  children: React.ReactNode;
  name: string;
  value: string;
  primary?: boolean;
  muted?: boolean;
  pending: boolean;
}) {
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className={cn(
        "label min-h-12 cursor-pointer px-5 transition-colors disabled:opacity-60",
        primary && "bg-ink text-sheet hover:bg-survey-deep",
        !primary && !muted && "border border-sheet-edge text-ink hover:border-ink",
        muted && "border border-sheet-edge text-ink/50 hover:border-danger hover:text-danger",
      )}
    >
      {children}
    </button>
  );
}
