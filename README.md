# Alaser — شركة الأسر للتسويق العقاري

Bilingual (AR/EN) marketing site and private dashboard for a real estate
marketing company in Giza, Egypt.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind v4 · Motion ·
next-intl · nuqs · Convex *(schema written, not yet wired — see
[Wiring Convex](#wiring-convex))*

---

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in the two ADMIN_ vars
npm run dev
```

Generate the admin session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

| URL | What it is |
|---|---|
| `/en`, `/ar` | Public site |
| `/en/admin` | Dashboard (redirects to `/en/admin/login`) |

---

## The design direction, in one paragraph

**"المساحة / The Survey."** The native document of this business is the
measured drawing, so the site is built out of that material: dimension strings
instead of decorative dividers, a drawing **title block** (ref code, area,
floor, orientation) instead of the `(01)/(02)/(03)` eyebrow every generated
site reaches for, and a floor plan that draws itself on scroll. The navy
`#13182c` is sampled from the client's own logo. The full plan and its
self-critique are in [`docs/design-plan.md`](docs/design-plan.md).

The one rule that governs everything: **a structural device only appears if it
measures something true.** Room areas on the plan are computed from the
rectangle, not typed. The north arrow points where north actually is for that
unit. If there is no quantity, the site uses whitespace.

---

## Architecture

```
src/
  app/
    [locale]/
      layout.tsx          owns <html lang dir> — RTL is correct in byte one
      (site)/             public pages + header/footer
      admin/
        login/
        (app)/            gated dashboard, its own shell
    api/admin/leads/      CSV export (auth checked server-side)
    actions/              server actions: inquiry, admin
  components/
    plan/                 THE SIGNATURE — see below
    property/  home/  portfolio/  layout/  admin/  ui/  brand/
  content/client-facts.ts SINGLE SOURCE OF TRUTH for everything about the business
  lib/
    data/                 the Convex swap points
    plan-geometry.ts      pure geometry, no React
  messages/{en,ar}.json   all copy
convex/schema.ts          the real data model, ready to deploy
```

### Bilingual + RTL

Built in from the first commit; it is not a retrofit.

- `next-intl` with `[locale]` routing. Flip the default in
  `src/i18n/routing.ts` — one word.
- **Arabic has its own type scale**, not the Latin one at a different size.
  See the `[lang="ar"]` block in `globals.css`.
- **Arabic is never letterspaced and never uppercased.** Tracking breaks the
  cursive joins. The `.label` class does caps + tracking for Latin and switches
  to weight for Arabic — one class, two correct behaviours.
- Latin display is Archivo used across its **width** axis; Arabic display is
  **Noto Kufi Arabic**, because kufic is the architectural script and shares
  its right angles with a floor plan.
- Use logical properties only in shared components: `ps-*`, `pe-*`, `ms-*`,
  `me-*`, `start-*`, `end-*`, `text-start`. Never `pl-`/`pr-`/`left-`/`right-`.
- **A floor plan never mirrors under RTL.** It is a physical object. Plan door
  edges are named `left`/`right`, not `start`/`end`, to make that impossible to
  get wrong by accident.

### The signature: the plan that draws itself

Floor plans are stored as **rectangles in centimetres**, not SVG path strings
(`src/lib/data/plans.ts`). Three reasons:

1. Room areas are *derived* from the rectangle, so the number printed on the
   drawing can never disagree with the drawing.
2. The renderer can stage the draw — envelope, partitions, doors, dimension
   strings, then labels — because it knows what each primitive is.
3. The client edits numbers in admin. Nobody hand-authors SVG.

| Component | Where | What it does |
|---|---|---|
| `PlanPlate` | cards, editor preview | static, no client JS |
| `PlanScroll` | unit page | draws on scroll |
| `PlanStack` | home page, **once** | draws, then tilts to isometric with the floors above and below |

`PlanStack` is the only 3D on the site: CSS `perspective` + `rotateX` on
layered planes. No WebGL, no canvas. An apartment *is* one slab in a stack, and
"third floor of nine" is the first thing a buyer asks after the price.

### The portfolio (`/portfolio`)

Every available or reserved unit bound as a page-turning book: photograph on
one page, measured sheet facing it. It builds itself from the listings, so
there is nothing to maintain.

- `components/portfolio/layout.ts` decides which page goes where. Photographs
  always land on a left-hand page and the back cover always stands alone; the
  contents run to a page per eight units, and a plate is added when the page
  count needs one. Folios are computed, never typed.
- `page-flip` does the turning. It gets **clones** of React-rendered pages in a
  root React never touches, so the two never fight over the DOM.
- Arabic is bound on the right by reversing the page order and opening on the
  last page. The book is not mirrored with CSS, which would break dragging.
- Pages are sized in container units (`cqw`), so a sheet scales as one object.
  On a phone it turns one page at a time.
- The book is `aria-hidden`; the same volume follows it as a real list of links.

### Photography — currently PLACEHOLDER

The client has no shoots yet, so every unit is showing licence-free stand-in
photographs from `src/content/photos.ts`. **`PHOTOS_ARE_PLACEHOLDERS` is
`true`**, which drives an amber badge on every unit page and a nag on the
dashboard. Flip it to `false` once real photography is in use — that also
makes an empty gallery mean "no photographs" again rather than handing the
stand-ins back, at which point a unit falls back to its own plan.

Stock on a listing for a specific flat at a specific price implies it *is*
that flat, so this has to go before launch. Replacing it is mechanical: upload
in admin, or swap `src`. Shot list: [`docs/shot-list.md`](docs/shot-list.md).

---

## Wiring Convex

Deliberately deferred — the client's account does not exist yet. Three files
are the entire swap:

| File | Becomes |
|---|---|
| `src/lib/data/index.ts` | `fetchQuery` / `preloadQuery` calls. Return types already match. |
| `src/lib/data/store.ts` | mutations; **delete the file** |
| `src/lib/data/inquiries.ts` | one mutation + one query; **delete the file** |
| `src/app/api/admin/upload/route.ts` | Convex upload URLs in place of Blob tokens |

```bash
npx convex dev          # generates convex/_generated from the committed schema
```

Then, in order:

1. Move the authorisation checks in `src/app/actions/admin.ts` **inside** the
   Convex mutations. Middleware protects routes; server functions protect data.
2. Replace `src/lib/admin-auth.ts` with Better Auth + the Convex adapter and
   the `owner` / `agent` / `viewer` roles. **This file is an interim gate** —
   one shared password, signed cookie. It is documented as such at the top of
   the file and is the first thing the Convex step removes.
3. Move the in-memory rate limiter in `src/app/actions/inquiry.ts` into Convex.
4. Seed: `SEED_PROPERTIES` in `src/lib/data/seed.ts` maps 1:1 onto the
   `properties` table.

Until then, admin edits and leads persist to a JSON store (`src/lib/data/data-dir.ts`):

- **locally** → `.data/*.json`, gitignored because leads contain phone numbers
- **on Vercel** → `os.tmpdir()`, because a serverless filesystem is read-only
  everywhere else. Writes succeed and the deployed preview is fully usable, but
  the data is per-instance and **does not survive a cold start or a redeploy.**

That is why **WhatsApp, not the form, is the primary CTA on every listing** —
and why wiring Convex is the next task, not a nice-to-have.

---

## Before launch

Everything outstanding is tracked in one place: `OPEN_QUESTIONS` in
`src/content/client-facts.ts`, rendered on `/admin` and `/admin/settings`.

**Blocking:**

- [x] ~~WhatsApp number~~ — `01095115184`, confirmed, deep-linking live.
- [x] ~~Facebook page~~ — confirmed, stored as the canonical profile URL.
- [ ] **Photography.** Every unit is on placeholders. Upload the real shoots in
      admin, then set `PHOTOS_ARE_PLACEHOLDERS = false`.
- [ ] Vector logo. `components/brand/Mark.tsx` is redrawn from a screenshot.
- [ ] Confirm whether they list rentals: their description says
      *"للبيع والشراء"* but the cover banner says *"القانون الجديد"*.

**Not blocking:** year founded, units sold, team photos, exact social URLs,
testimonials.

Numbers and faces render **only when `verified` is true.** An unverified
"500+ happy clients" is precisely the tell this project is paid to avoid.

---

## Quality notes

- Animate `transform` / `opacity` only. One reveal vocabulary site-wide
  (`components/ui/Reveal.tsx`) — a different reveal per section is the classic
  generated-page giveaway.
- `prefers-reduced-motion`: all decorative motion off, content still arrives,
  plans render fully drawn rather than frozen mid-draw.
- No horizontal scroll at 320px (verified).
- Tabular figures on every price, area and reference code.
- Filter state lives in the URL, so a result set is shareable and the back
  button restores it.
- The enquiry form has a honeypot, a timing check and a rate limit — **no
  visible captcha**, which costs more real leads than the spam it stops.

### Known follow-ups

- **Shared-element transition** (card → unit page). Waiting on React's
  `<ViewTransition>` stabilising; not worth an experimental flag in a client
  deliverable.
- **Arabic OG images.** `opengraph-image.tsx` is Latin-only: Satori needs an
  embedded font file for Arabic glyphs, and a card that renders boxes on half
  the shares is worse than one showing numbers both audiences read the same.

---

## Scripts

```bash
npm run dev     # dev server
npm run build   # production build
npm run start   # serve the build
npm run lint    # eslint
npx tsc --noEmit
```

---

## Photographs

Uploads go **straight from the browser to Vercel Blob**, using a short-lived
token minted by `/api/admin/upload` (which checks the admin session before
minting). The bytes never pass through a server action, so ten photographs
upload in parallel with real progress and a 4MB file is not a problem.

Before anything is sent, `src/lib/resize-image.ts` does the work the brief
asks for, in the browser:

- resizes to a 2560px long edge and re-encodes as WebP
- records the real pixel dimensions, so nothing guesses an aspect ratio
- generates a `blurDataURL` from the photograph itself, not a flat chip
- respects EXIF orientation, which `<img>` decoding does not

The client will be uploading 6MB photos from a phone on Egyptian mobile data;
this sends roughly a tenth of that.

**The cover is the first frame.** "Set as cover" lifts a photo to the top
rather than setting a separate flag — one concept to explain instead of two.

**Alt text is never empty.** Leave it blank and the server writes it from the
room and the unit in both languages. Change the room and an auto-written alt
is rewritten to match; one the client typed themselves is left alone.

Images from hosts that are not in `next.config` render unoptimised rather than
as a broken box — see `src/lib/images.ts`. Opening the optimiser to `**` would
turn it into an image proxy anyone could bill us for.
