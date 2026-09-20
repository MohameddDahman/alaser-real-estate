import { ImageResponse } from "next/og";

import { getPropertyBySlug, planForProperty } from "@/lib/data";
import { planToSvgString } from "@/lib/plan-geometry";
import { areas } from "@/content/client-facts";
import type { Locale } from "@/i18n/routing";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Alaser listing";

/**
 * Per-listing OG image: the unit's own plan, its reference code and its
 * measured facts on the brand navy.
 *
 * Deliberately Latin-only. Satori needs an embedded font file for Arabic
 * glyphs, and a card that silently renders boxes on half the shares is worse
 * than one that shows numbers both audiences read the same way. Adding an
 * Arabic OG variant is a font file and a fetch - noted in the README.
 */
export default async function Image({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const property = await getPropertyBySlug(params.slug);
  if (!property) return new ImageResponse(<div style={{ background: "#13182c" }} />, size);

  const locale = params.locale as Locale;
  const plan = planForProperty(property);
  const area = areas.find((a) => a.slug === property.location.area);

  const planSrc = plan
    ? `data:image/svg+xml;base64,${Buffer.from(planToSvgString(plan)).toString("base64")}`
    : null;

  const price = property.price.onRequest
    ? "On request"
    : `${new Intl.NumberFormat("en-EG").format(property.price.amount!)} ${property.price.currency}`;

  const fields: Array<[string, string]> = [
    ["REF", property.refCode],
    ["AREA", `${property.specs.builtUpArea} m2`],
    ["BEDS", property.specs.bedrooms > 0 ? String(property.specs.bedrooms) : "OPEN"],
    ["PRICE", price],
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#13182c",
          color: "#edeae2",
          padding: 56,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingRight: 40 }}>
          <div style={{ display: "flex", fontSize: 20, letterSpacing: 6, color: "#7fa3cc" }}>
            ALASER
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 8,
              fontSize: 18,
              letterSpacing: 3,
              color: "#8a8271",
              textTransform: "uppercase",
            }}
          >
            {area?.name.en} · {locale === "ar" ? "Giza" : "Giza"}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 56,
              lineHeight: 1.1,
              fontWeight: 600,
              maxWidth: 560,
            }}
          >
            {property.title.en}
          </div>

          <div style={{ flex: 1 }} />

          {/* The title block, same device as the site */}
          <div style={{ display: "flex", borderTop: "1px solid #2b3255" }}>
            {fields.map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  borderRight: "1px solid #2b3255",
                  padding: "16px 14px",
                }}
              >
                <div style={{ display: "flex", fontSize: 14, letterSpacing: 2, color: "#8a8271" }}>
                  {label}
                </div>
                <div style={{ display: "flex", marginTop: 8, fontSize: 24 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            width: 460,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #2b3255",
            background: "#1e2440",
            padding: 30,
          }}
        >
          {planSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={planSrc} width={400} height={400} alt="" style={{ objectFit: "contain" }} />
          )}
        </div>
      </div>
    ),
    size,
  );
}
