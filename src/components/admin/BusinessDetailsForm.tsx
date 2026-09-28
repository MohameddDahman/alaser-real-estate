"use client";

import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2, ExternalLink, Plus, Trash2 } from "lucide-react";

import { saveDetails, type DetailsState } from "@/app/actions/admin";
import { linkName, type BusinessDetails } from "@/lib/contact";
import type { DetailField } from "@/lib/data/details-form";
import { localMobile } from "@/lib/utils";
import { Field } from "./form-controls";

/**
 * The business details, edited in place: what is saved here is what every
 * page of the site shows - header, footer, contact page, unit pages, the
 * portfolio and the WhatsApp buttons.
 */
export function BusinessDetailsForm({ details }: { details: BusinessDetails }) {
  const t = useTranslations("admin");
  const [state, action, saving] = useActionState<DetailsState, FormData>(saveDetails, {});

  const initial = {
    phone: details.phone,
    whatsapp: localMobile(details.whatsapp),
    email: details.email ?? "",
    addressEn: details.address.en,
    addressAr: details.address.ar,
    mapUrl: details.mapUrl ?? "",
    links: details.links.map((link) => ({ url: link.url, label: link.label ?? "" })),
    yearsActive: details.yearsActive ? String(details.yearsActive) : "",
    unitsSold: details.unitsSold ? String(details.unitsSold) : "",
  };
  const [form, setForm] = useState(initial);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  // What was sent with the last save, to know when the form is back in step.
  const [submitted, setSubmitted] = useState<string | null>(null);
  const snapshot = JSON.stringify(form);
  const dirty = snapshot !== baseline;

  useEffect(() => {
    if (state.ok && submitted) setBaseline(submitted);
    // Only a new answer from the server moves the baseline.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const set = (key: Exclude<keyof typeof form, "links">) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: event.target.value }));
  const setLink = (index: number, patch: Partial<{ url: string; label: string }>) =>
    setForm((f) => ({ ...f, links: f.links.map((link, i) => (i === index ? { ...link, ...patch } : link)) }));
  // What a link will be called if no name is typed: "instagram.com/x" is Instagram.
  const previewName = (url: string) =>
    linkName({ url: /^[a-z][a-z\d+.-]*:/i.test(url) ? url : `https://${url.trim()}` });
  // Problems from the last save stay marked until that field is typed in again.
  const showErrors = !!state.errors && submitted === snapshot;
  const bad = (field: DetailField) => showErrors && state.errors!.includes(field);

  return (
    <form
      action={action}
      onSubmit={() => setSubmitted(snapshot)}
      // The server checks every field and says what is wrong in the page's own words;
      // the browser's checks would refuse a link typed without "https://".
      noValidate
      className="space-y-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("detailPhone")} htmlFor="d-phone" hint={t("detailPhoneHint")}>
          <input
            id="d-phone"
            name="phone"
            type="tel"
            dir="ltr"
            autoComplete="off"
            value={form.phone}
            onChange={set("phone")}
            aria-invalid={bad("phone") || undefined}
            className="field tabular-nums"
          />
        </Field>
        <Field label={t("detailWhatsapp")} htmlFor="d-whatsapp" hint={t("detailWhatsappHint")}>
          <input
            id="d-whatsapp"
            name="whatsapp"
            type="tel"
            dir="ltr"
            autoComplete="off"
            value={form.whatsapp}
            onChange={set("whatsapp")}
            aria-invalid={bad("whatsapp") || undefined}
            className="field tabular-nums"
          />
        </Field>
      </div>

      <Field label={t("detailEmail")} htmlFor="d-email" hint={t("optional")}>
        <input
          id="d-email"
          name="email"
          type="email"
          dir="ltr"
          autoComplete="off"
          value={form.email}
          onChange={set("email")}
          aria-invalid={bad("email") || undefined}
          className="field"
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("detailAddressEn")} htmlFor="d-address-en">
          <input
            id="d-address-en"
            name="address.en"
            dir="ltr"
            lang="en"
            value={form.addressEn}
            onChange={set("addressEn")}
            aria-invalid={bad("address") || undefined}
            className="field"
          />
        </Field>
        <Field label={t("detailAddressAr")} htmlFor="d-address-ar">
          <input
            id="d-address-ar"
            name="address.ar"
            dir="rtl"
            lang="ar"
            value={form.addressAr}
            onChange={set("addressAr")}
            aria-invalid={bad("address") || undefined}
            className="field"
          />
        </Field>
      </div>

      <Field label={t("detailMap")} htmlFor="d-map" hint={t("detailMapHint")}>
        <input
          id="d-map"
          name="mapUrl"
          type="text"
          dir="ltr"
          inputMode="url"
          placeholder="https://maps.app.goo.gl/…"
          value={form.mapUrl}
          onChange={set("mapUrl")}
          aria-invalid={bad("mapUrl") || undefined}
          className="field"
        />
        {details.mapUrl && (
          <a href={details.mapUrl} target="_blank" rel="noreferrer" className="link mt-2 inline-flex items-center gap-1.5 text-sm">
            {t("detailMapCheck")}
            <ExternalLink className="size-3.5" strokeWidth={2} aria-hidden="true" />
          </a>
        )}
      </Field>

      {/* Any pages at all - Instagram, Facebook, TikTok, a listings profile.
          Known sites name themselves; anything else can be given a name. */}
      <fieldset className="min-w-0">
        <legend className="mb-1.5 text-sm font-medium text-fg">{t("detailLinks")}</legend>
        <p className="mb-3 text-xs leading-relaxed text-fg-muted">{t("detailLinksHint")}</p>
        <input type="hidden" name="links" value={JSON.stringify(form.links)} />
        {form.links.length > 0 && (
          <ul className="space-y-2">
            {form.links.map((link, i) => (
              <li
                key={i}
                className="grid gap-2 rounded-lg bg-surface p-2 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto]"
              >
                <input
                  aria-label={`${t("linkUrl")} ${i + 1}`}
                  placeholder="instagram.com/…"
                  dir="ltr"
                  inputMode="url"
                  autoComplete="off"
                  value={link.url}
                  onChange={(event) => setLink(i, { url: event.target.value })}
                  aria-invalid={bad("links") || undefined}
                  className="field"
                />
                {/* The name and the remove button share a line on a phone. */}
                <div className="flex gap-2 sm:contents">
                  <input
                    aria-label={`${t("linkName")} ${i + 1}`}
                    placeholder={link.url.trim() ? previewName(link.url) : t("linkName")}
                    dir="auto"
                    autoComplete="off"
                    maxLength={40}
                    value={link.label}
                    onChange={(event) => setLink(i, { label: event.target.value })}
                    className="field min-w-0 flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, links: f.links.filter((_, j) => j !== i) }))}
                    className="btn btn-quiet shrink-0 px-3.5"
                  >
                    <Trash2 className="size-4" strokeWidth={2} aria-hidden="true" />
                    <span className="sr-only">{t("removeLink")}</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {form.links.length < 12 && (
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, links: [...f.links, { url: "", label: "" }] }))}
            className="btn btn-quiet btn-sm mt-3"
          >
            <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
            {t("addLink")}
          </button>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("detailYears")} htmlFor="d-years" hint={t("detailNumbersHint")}>
          <input
            id="d-years"
            name="yearsActive"
            inputMode="numeric"
            dir="ltr"
            autoComplete="off"
            value={form.yearsActive}
            onChange={set("yearsActive")}
            aria-invalid={bad("yearsActive") || undefined}
            className="field tabular-nums"
          />
        </Field>
        <Field label={t("detailSold")} htmlFor="d-sold" hint={t("detailNumbersHint")}>
          <input
            id="d-sold"
            name="unitsSold"
            inputMode="numeric"
            dir="ltr"
            autoComplete="off"
            value={form.unitsSold}
            onChange={set("unitsSold")}
            aria-invalid={bad("unitsSold") || undefined}
            className="field tabular-nums"
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <button type="submit" disabled={saving || !dirty} className="btn btn-primary">
          {saving ? t("saving") : t("save")}
        </button>
        <p role="status" aria-live="polite" className="text-sm font-medium">
          {showErrors ? (
            <span className="inline-flex items-center gap-1.5 text-danger">
              <AlertTriangle className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
              {t("detailErrors", { fields: state.errors!.map((f) => t(`detailField.${f}`)).join(t("listJoin")) })}
            </span>
          ) : dirty ? (
            <span className="text-warning">{t("unsavedChanges")}</span>
          ) : state.ok ? (
            <span className="inline-flex items-center gap-1.5 text-success">
              <CheckCircle2 className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
              {t("detailSaved")}
            </span>
          ) : null}
        </p>
      </div>
    </form>
  );
}
