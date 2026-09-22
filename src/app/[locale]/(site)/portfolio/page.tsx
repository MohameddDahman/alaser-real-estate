import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MessageCircle } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Portfolio, type SpreadMeta } from "@/components/portfolio/Portfolio";
import type { BookText, BookUnit } from "@/components/portfolio/BookPages";
import { bookPages, layoutBook, type BookPage } from "@/components/portfolio/layout";
import { Reveal } from "@/components/ui/Reveal";
import { RevealText } from "@/components/motion/primitives";
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
          ? pricePerMeter(property.price.amount, specs.builtUpArea, locale)
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

  const requestLink = waHref(t("requestTemplate"), locale);
  const external = requestLink.startsWith("http");

  return (
    <div className="pb-24 pt-32 lg:pb-32 lg:pt-40">
      <div className="mx-auto w-full max-w-[92rem] px-4 sm:px-6 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Reveal>
              <p className="label text-survey">{t("eyebrow")}</p>
            </Reveal>
            <RevealText as="h1" lines={[t("title")]} className="mt-3 max-w-3xl text-d2 text-sheet" />
            <Reveal delay={0.1}>
              <p className="measure mt-6 text-lead text-giza">{t("lead")}</p>
            </Reveal>
          </div>
          <Reveal delay={0.15}>
            <p className="label text-giza-dim">
              {t("unitsCount", { count: units.length, pages: pageCount })}
            </p>
          </Reveal>
        </div>

        <p className="label mt-10 text-giza-dim">{t("howTo")}</p>
      </div>

      {/* The book, on its desk ------------------------------------------ */}
      <div className="mt-12">
        <Portfolio units={units} text={text} spreads={spreads} rtl={locale === "ar"} />
      </div>

      {/* The same volume as a list: the accessible path through it, and a
          faster index for anyone who knows which unit they want. -------- */}
      <div className="mx-auto mt-24 w-full max-w-[92rem] px-4 sm:px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
          <section>
            <h2 className="label text-giza-dim">{t("contentsTitle")}</h2>
            <ol className="mt-5 border-t border-navy-edge">
              {listed.map((property, i) => (
                <li key={property._id}>
                  <Link
                    href={`/properties/${property.slug}`}
                    className="group grid grid-cols-[3.5rem_1fr_auto] items-baseline gap-4 border-b border-navy-edge py-4 transition-colors hover:bg-navy-lift/40"
                  >
                    <span className="font-data text-data text-survey tabular-nums" dir="ltr">
                      {String(units[i].photoNo).padStart(3, "0")}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sheet transition-colors group-hover:text-survey">
                        {property.title[locale]}
                      </span>
                      <span className="label mt-1 block text-giza-dim">
                        <span dir="ltr">{property.refCode}</span> ·{" "}
                        {areas.find((a) => a.slug === property.location.area)?.name[locale]}
                      </span>
                    </span>
                    <span className="font-data text-data text-giza tabular-nums" dir="ltr">
                      {units[i].price}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <aside className="lg:pt-10">
            <div className="border border-navy-edge p-6">
              <h2 className="text-d3 text-sheet">{t("requestCopy")}</h2>
              <p className="mt-3 text-giza-dim">{t("requestCopyNote")}</p>
              <a
                href={requestLink}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                className="label mt-6 inline-flex min-h-12 items-center gap-2.5 bg-survey-deep px-6 text-sheet transition-colors duration-200 hover:bg-survey hover:text-navy"
              >
                <MessageCircle className="size-4" strokeWidth={1.75} aria-hidden="true" />
                {t("requestCopy")}
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
