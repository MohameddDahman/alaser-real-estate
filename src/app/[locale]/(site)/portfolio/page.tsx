import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookOpen, MessageCircle } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Portfolio, type SpreadMeta } from "@/components/portfolio/Portfolio";
import type { BookText, BookUnit } from "@/components/portfolio/BookPages";
import { bookPages, layoutBook, type BookPage } from "@/components/portfolio/layout";
import { PageIntro } from "@/components/ui/PageIntro";
import { Photo } from "@/components/ui/Photo";
import { getAreaCounts, getProperties, planForProperty } from "@/lib/data";
import { areas, brand, contact, office } from "@/content/client-facts";
import { HERO_PHOTOS, photo } from "@/content/photos";
import { waHref } from "@/lib/contact";
import { formatNumber, formatPrice, pricePerMeter } from "@/lib/utils";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "portfolio" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function PortfolioPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations("portfolio");
  const tp = await getTranslations("property");
  const th = await getTranslations("home");
  const tn = await getTranslations("nav");

  // A sales portfolio carries what can be bought: available and reserved.
  // Sold units stay on the site for price transparency, but not in the book.
  const [all, counts] = await Promise.all([getProperties(), getAreaCounts()]);
  const listed = all.filter((p) => p.status === "available" || p.status === "reserved");

  const layout = layoutBook(listed.length);
  const dateLabel = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", {
    month: "long",
    year: "numeric",
  }).format(new Date());

  const units: BookUnit[] = listed.map((property, i) => {
    const cover = property.coverImage ?? property.gallery[0];
    const { specs } = property;

    const floor =
      specs.floor === "G"
        ? "GF"
        : specs.floor && specs.totalFloors
          ? `${specs.floor} / ${specs.totalFloors}`
          : (specs.floor ?? "—");

    const beds =
      specs.bedrooms > 0 ? tp("bedrooms", { count: specs.bedrooms }) : tp("bedrooms", { count: 0 });

    return {
      refCode: property.refCode,
      title: property.title[locale],
      areaName: areas.find((a) => a.slug === property.location.area)?.name[locale] ?? "",
      tenure: tp(`tenure.${property.tenure}` as "tenure.tamleek"),
      statusLabel: tp(`status.${property.status}` as "status.available"),
      isReserved: property.status === "reserved",
      price: property.price.onRequest
        ? tp("priceOnRequest")
        : formatPrice(property.price.amount!, locale, property.price.currency),
      period:
        property.price.period === "month"
          ? tp("perMonth")
          : property.price.period === "year"
            ? tp("perYear")
            : null,
      perMeter:
        !property.price.onRequest && property.price.amount && property.listingType === "sale"
          ? tp("pricePerMeter", {
              value: pricePerMeter(property.price.amount, specs.builtUpArea, locale) ?? "",
            })
          : null,
      area: `${formatNumber(specs.builtUpArea, locale)} m²`,
      floor,
      facing: specs.orientation ?? "—",
      facingName: specs.orientation
        ? tp(`orientationName.${specs.orientation}` as "orientationName.N")
        : "",
      bedsBaths: `${beds} · ${tp("bathrooms", { count: specs.bathrooms })}`,
      finishing: specs.finishing
        ? tp(`finishingLevel.${specs.finishing}` as "finishingLevel.full")
        : null,
      highlight: property.highlights[0]?.[locale] ?? null,
      photo: cover
        ? {
            src: cover.src,
            room: cover.room ? tp(`room.${cover.room}` as "room.reception") : null,
          }
        : null,
      plan: planForProperty(property),
      // Two pages per unit, photograph first. Where the run starts depends on
      // how many pages the contents need - see layout.ts.
      photoNo: layout.firstUnitPage + i * 2,
      sheetNo: layout.firstUnitPage + i * 2 + 1,
    };
  });

  const text: BookText = {
    brand: brand.latin,
    arabicBrand: brand.legalName.ar,
    coverTitle: t("coverTitle"),
    coverSub: t("coverSub"),
    volume: t("volume"),
    date: dateLabel,
    areasLine: areas.map((a) => a.name[locale]).join("  ·  "),
    colophonTitle: t("colophonTitle"),
    colophonBody: t("colophonBody"),
    keys: {
      ref: t("keyRef"),
      area: t("keyArea"),
      floor: t("keyFloor"),
      facing: t("keyFacing"),
    },
    keyLabels: {
      ref: tp("ref"),
      area: tp("builtUpArea"),
      floor: tp("floor"),
      facing: tp("orientation"),
    },
    contentsTitle: t("contentsTitle"),
    contentsContinued: t("contentsContinued"),
    plate: {
      src: photo(HERO_PHOTOS[0], 1600),
      label: t("plateLabel"),
      caption: t("plateCaption"),
    },
    sheet: t("sheet"),
    areasTitle: t("areasTitle"),
    areas: areas.map((a) => ({
      name: a.name[locale],
      character: a.character[locale],
      count: th("areasUnits", { count: counts[a.slug] }),
    })),
    enquireTitle: t("enquireTitle"),
    enquireBody: t("enquireBody"),
    whatsapp: locale === "ar" ? "واتساب" : "WhatsApp",
    phone: contact.phone,
    address: office.address[locale],
    backNote: t("backNote", { date: dateLabel }),
  };

  const pageCount = layout.pageCount;

  // One entry per spread - closed front, every opening, closed back - for
  // the label under the book and the strip of thumbnails.
  const pages = bookPages(units.length);
  const folio = (n: number) => String(n).padStart(3, "0");
  const titleOf = (page: BookPage): string => {
    switch (page.kind) {
      case "photo":
      case "sheet":
        return units[page.unit].title;
      case "colophon":
      case "plate":
        return text.colophonTitle;
      case "contents":
        return text.contentsTitle;
      case "areas":
        return text.areasTitle;
      case "enquire":
        return text.enquireTitle;
      default:
        return "";
    }
  };
  const spreads: SpreadMeta[] = [];
  const leaves = pages.length / 2;
  for (let s = 0; s <= leaves; s++) {
    if (s === 0 || s === leaves) {
      const label = s === 0 ? t("cover") : t("backCover");
      spreads.push({ label, short: label, thumb: null, tone: "cover" });
      continue;
    }
    const first = pages[s * 2 - 1];
    const second = pages[s * 2];
    const unitPage = [first, second].find(
      (p): p is Extract<BookPage, { unit: number }> => p.kind === "photo" || p.kind === "sheet",
    );
    const thumb = unitPage ? (units[unitPage.unit].photo?.src ?? null) : null;
    spreads.push({
      label: t("spreadLabel", {
        from: folio(s * 2 - 1),
        to: folio(s * 2),
        title: unitPage ? units[unitPage.unit].title : titleOf(first),
      }),
      short: folio(s * 2 - 1),
      thumb,
      tone: thumb ? "photo" : "paper",
    });
  }

  // And one per page, for reading a page at a time on a phone.
  const pageLabels = pages.map((page, p) => {
    if (page.kind === "cover") return t("cover");
    if (page.kind === "back") return t("backCover");
    const title = page.kind === "photo" || page.kind === "sheet" ? units[page.unit].title : titleOf(page);
    return t("pageLabel", { n: folio(p), title });
  });

  const requestLink = waHref(t("requestTemplate"), locale);
  const external = requestLink.startsWith("http");

  return (
    <>
      <PageIntro
        rtl={locale === "ar"}
        crumbs={[{ label: tn("home"), href: "/" }, { label: t("eyebrow") }]}
        title={t("title")}
        lead={t("lead")}
      >
        <p className="mt-4 flex items-center gap-2 text-sm font-medium text-fg">
          <BookOpen className="size-4 shrink-0 text-primary" strokeWidth={2} aria-hidden="true" />
          {t("unitsCount", { count: units.length, pages: pageCount })}
        </p>
        <p className="mt-1 text-sm text-fg-subtle">{t("howTo")}</p>
      </PageIntro>

      {/* The book, on its desk ------------------------------------------ */}
      <Portfolio units={units} text={text} spreads={spreads} pageLabels={pageLabels} rtl={locale === "ar"} />

      {/* The same volume as a list: the accessible path through it, and a
          faster index for anyone who knows which unit they want. -------- */}
      <div className="shell grid gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12 lg:py-16">
        <section aria-labelledby="contents-title" className="min-w-0">
          <h2 id="contents-title" className="text-heading font-bold text-fg">
            {t("contentsTitle")}
          </h2>
          <ol className="mt-4 divide-y divide-line overflow-hidden rounded-lg border border-line">
            {listed.map((property, i) => {
              const cover = property.coverImage ?? property.gallery[0];
              return (
                <li key={property._id}>
                  <Link
                    href={`/properties/${property.slug}`}
                    className="group flex items-center gap-4 p-3 transition-colors hover:bg-surface sm:p-4"
                  >
                    <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-surface-2">
                      {cover && <Photo src={cover.src} alt="" sizes="5rem" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-fg group-hover:text-primary">
                        {property.title[locale]}
                      </span>
                      <span className="mt-0.5 block text-sm text-fg-muted">
                        {units[i].areaName} · <span dir="ltr">{property.refCode}</span> ·{" "}
                        {t("sheet")} <span className="tabular-nums">{String(units[i].photoNo).padStart(3, "0")}</span>
                      </span>
                    </span>
                    <span className="hidden shrink-0 text-end font-bold text-fg tabular-nums sm:block">
                      {units[i].price}
                      {units[i].period && (
                        <span className="block text-xs font-normal text-fg-subtle">{units[i].period}</span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>

        <aside className="lg:pt-12">
          <div className="rounded-lg border border-line bg-canvas p-6 shadow-card">
            <h2 className="text-lg font-bold text-fg">{t("requestCopy")}</h2>
            <p className="mt-2 text-sm text-fg-muted">{t("requestCopyNote")}</p>
            <a
              href={requestLink}
              target={external ? "_blank" : undefined}
              rel={external ? "noreferrer" : undefined}
              className="btn btn-whatsapp mt-5 w-full"
            >
              <MessageCircle className="size-4" strokeWidth={2} aria-hidden="true" />
              {t("requestCopy")}
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}
