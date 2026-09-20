# Design plan — Alaser

Written before the code, per the two-pass rule. The self-critique at the end is
the second pass, and it changed the plan in two places.

---

## The client, actually

Read off their own Facebook page rather than assumed:

| | |
|---|---|
| Name | شركة الأسر للتسويق العقاري / ALASER Real Estate Marketing |
| Where | Kaabish, El-Tawabeq, **Faisal, Giza** |
| Areas | فيصل · الهرم · حدائق الأهرام · أكتوبر · زايد — five, all Giza |
| Sells | شقق · فيلات · محلات · كافيهات |
| Tenure | **للتمليك والقانون الجديد** |
| Reach | 878 followers, 292 posts, page live since Jan 2023, **0 reviews** |
| Photography | none |

Two things in that table do not exist on any international property template
and both became first-class features:

- **تمليك vs القانون الجديد** — freehold versus a new-rent-law lease. It is the
  first question an Egyptian buyer asks. It is a top-level filter and a field
  in the Convex schema.
- **حدائق الأهرام and أكتوبر are surveyed grid subdivisions** — numbered zones,
  numbered plots. Units there carry a `plotRef`, and buyers search by it.

This is a **mid-market Giza brokerage**, not a New Cairo luxury outfit. Every
decision below follows from that.

---

## What I rejected first

`ui-ux-pro-max --design-system "luxury real estate"` returned: **Glassmorphism,
`#0F766E` teal, Cinzel + Josefin Sans.** Glassmorphism and Cinzel are both on
the brief's banned list, and that combination is the stock answer for the
phrase "luxury real estate" regardless of who the client is. Discarded.

The reference site (`iconic-architecture.vercel.app`) was studied for **craft
density only**. Its technique — GSAP ScrollTrigger, inline SVG
`stroke-dashoffset`, CSS `perspective: 1800px` on layered planes, no WebGL — is
the ambition level to match. Its look is not: cream `#F1EDE6`, Instrument
Serif, `(01) THE STUDIO` eyebrows. All three are exactly what the brief bans.

---

## Direction: المساحة / The Survey

The native document of this business is the **measured drawing**. Dimension
strings, a north arrow, a scale bar, and a **title block** in the corner
carrying reference number, area, scale and date.

A listing genuinely *is* a drawing sheet: it has a ref code, an area, a floor,
a delivery date. So the title block replaces the `(01)/(02)/(03)` eyebrow with
a device that encodes something true, and the **dimension string** becomes the
site's only divider, stat display and price treatment.

**The governing rule:** a structural device only appears if it measures
something real. Room areas are computed from the rectangle. The north arrow
points where north actually is for that unit. No quantity → whitespace.

## Palette

Photographs carry all the colour; the frame stays neutral so a mixed library
still reads as one agency's work.

| Token | Hex | Justification |
|---|---|---|
| navy | `#13182c` | **Sampled from their own logo** (33,267 pixel samples). Equity they already own. |
| navy-lift | `#1e2440` | Raised surface on navy |
| navy-edge | `#2b3255` | Hairlines |
| ink | `#0a0d18` | Footer, heaviest drawn line |
| sheet | `#edeae2` | Drafting paper — greyer and less yellow than the `#F4F1EA` cream every generated site defaults to |
| giza | `#c9bba0` | Giza plateau limestone — the literal stone of الهرم and حدائق الأهرام, two of the five areas in their own strapline |
| survey | `#7fa3cc` / `#2e5580` | Survey ink. Reads as documentation, not marketing. 6.9:1 on navy, 6.3:1 on sheet |
| available / reserved | `#4e8f6d` / `#b08442` | Annotation colours — status is data, never colour alone |

## Type

| Role | Face | Why this one |
|---|---|---|
| Latin display | **Archivo**, variable **width** axis | Architectural stencil lettering is condensed sans, never a serif. Headlines set expanded (`wdth` 112) read as drafted. |
| Latin body | **Instrument Sans** | Humanist grotesque with enough character not to read as Inter |
| Data | **IBM Plex Mono** | Tabular figures for prices, areas, ref codes, dimension strings |
| Arabic display | **Noto Kufi Arabic** | **Kufic is the architectural script** — squared, built from the same right angles as a floor plan, and it originates in carved building inscription. Both scripts share one logic. |
| Arabic body | **IBM Plex Sans Arabic** | Plex Mono's sibling, so the two scripts share a designer |

Arabic gets **its own type scale and leading**, not the Latin scale at a
different size. It is never letterspaced (tracking breaks the cursive joins)
and never uppercased.

## Layout

```
HOME
┌──────────────────────────────────────────────┐
│  [survey grid draws behind]                  │
│                                              │
│  REAL ESTATE MARKETING · GIZA                │
│  Faisal. Haram. Hadayek.                     │  ← five area names,
│  October. Zayed.                             │    arriving one at a time
│  ────────────────────────────────  [CTA]     │
│  ┌AREAS─┬LISTED┬GOVERNORATE┬TENURE┐          │  ← title block
│  │  05  │  12  │   Giza    │ …    │          │
└──────────────────────────────────────────────┘
│  [ area | type | budget ] [SHOW UNITS]       │  ← thumb's reach
├──────────────────────────────────────────────┤
│  Four units worth a look   ▸ card ▸ ▸ ▸      │
├────── on sheet (light) ──────────────────────┤
│  Three things you can check us on            │  ← 3 proofs, NOT numbered
├──────────────────────────────────────────────┤
│  AREA SCHEDULE (the table every drawing set  │
│  carries): name | character | count          │
├──────────────────────────────────────────────┤
│  THE SIGNATURE — plan draws, then lifts      │
└──────────────────────────────────────────────┘

UNIT
┌───────────────────────┬──────────────────────┐
│ plate (plan / photo)  │ price  (sticky rail) │
│ highlights            │ WhatsApp ALS-0412    │
│ description           │ ┌REF┬AREA┬FLR┬FACING┐│
├───────────────────────┴──────────────────────┤
│ MEASURED — schedule of quantities            │
│ THE PLAN — draws on scroll, north, scale bar │
│ WHAT IT HAS · WHERE IT IS                    │
│ ask + instalment calculator                  │
└──────────────────────────────────────────────┘
        [ALS-0412 · 2,650,000 · WhatsApp]  ← mobile sticky
```

## Signature

**The floor plan that draws itself**, then tilts into isometric with the floors
above and below rising away from it. CSS `perspective` + `rotateX` on layered
planes — no WebGL. It appears **once**, on the home page. Unit pages get the
flat drawing only.

It is not an effect looking for a reason: an apartment *is* one slab in a
stack, and "third floor of nine" is the first thing a buyer asks after the
price.

## The risk

Everything at display size is uppercase Archivo expanded on hairline rules, and
**zero border-radius anywhere except photographs**, which get 2px. Combined
with a hero that is a *drawing* rather than a photograph, the site risks
reading cold for a market used to warm, busy, sticker-covered property ads.

Justified because: they have no photographs, so warmth would have to come from
stock — the single loudest "templated" signal there is. Drawing is the client's
own material class, and it says "we know this ground at plot level" before it
says anything else.

---

## Self-critique — second pass

Checked against the banned list. Two things failed and were changed.

1. **The hero was going to be a photograph with a masterplan drawn over it.**
   The client has no photographs. Rather than fake one, the hero became the
   **survey grid** — which is what Hadayek El-Ahram and 6 October literally
   are. This turned the project's biggest constraint into its direction.

2. **I had planned `/compounds` per the brief's IA.** Wrong for this client.
   Their own strapline lists *areas*, not compounds, and Faisal and Haram have
   no compounds at all. Became `/areas`, driven by the five names they
   themselves use.

Still-standing checks:

- [x] Could this palette belong to another agency? No — the navy is sampled
      from their logo and the limestone is named for districts in their own
      strapline.
- [x] Any adjective that could be a fact? The three proofs are all checkable
      claims, and one of them ("we leave sold units up, with their price") is
      **demonstrably true on the site** — ALS-0340 is listed sold at 13,500,000.
- [x] Generic section headers? "How we list", "The five areas", "Read the
      plan", "Ask about a unit". No "Our Services", no "Why Choose Us".
- [x] Do the structural devices encode something true? The title block carries
      real ref/area/floor/orientation. Room areas are computed from the
      drawing. The north arrow is derived from the unit's orientation. The
      three proofs are deliberately **unnumbered**, because three claims are
      not a sequence.
- [x] One memorable thing or eight forgettable effects? One: the plan. The 3D
      lift happens once on the whole site.
- [x] Is every photograph the client's own? There are none, and none are faked.
