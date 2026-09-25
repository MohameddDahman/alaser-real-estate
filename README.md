# Alaser — شركة الأسر للتسويق العقاري

Bilingual (AR/EN) marketing site and private dashboard for a real estate
marketing company in Giza, Egypt.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind v4 · Motion ·
next-intl · nuqs · Vercel Blob for storage *(no database account needed —
see [Storage](#storage))*

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

**A property marketplace, laid out the way people already know from the big
booking sites.** A light page; the client's own navy (`#13182c`, sampled from
their logo) for the brand bar and the hero; one blue for everything that can
be pressed; WhatsApp in its own green, because that is where the conversation
actually happens. The home page is a search first - sale or rent, area, type,
budget - then browse by area, by type, and the featured listings. Results are
wide rows with the facts in the middle and the price on the far side; a
listing has a photo grid, a sticky price box and the measured plan. Tokens,
buttons and fields live in `src/app/globals.css` (`.btn-*`, `.field`,
`shell`).

The first direction ("المساحة / The Survey", in
[`docs/design-plan.md`](docs/design-plan.md)) survives in the portfolio book
and in one rule: **nothing is shown that is not true.** Room areas on the plan
are computed from the rectangle, the north arrow points where north is for
that unit, and numbers and faces render only once the client confirms them.

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
    data/                 the read layer, and the Blob-backed store
    plan-geometry.ts      pure geometry, no React
  messages/{en,ar}.json   all copy
convex/schema.ts          the data model, kept for an optional move to Convex
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
- The site is set in Instrument Sans and IBM Plex Sans Arabic. The portfolio
  book keeps its own display faces: Archivo across its **width** axis, and
  **Noto Kufi Arabic**, the architectural script.
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
| `PlanPlate` | portfolio sheets, editor preview | static, no client JS |
| `PlanScroll` | unit page | draws on scroll |

### The portfolio (`/portfolio`)

Every available or reserved unit bound as a book on a desk: photograph on one
page, measured sheet facing it. It builds itself from the listings, so there
is nothing to maintain.

- **Pages turn like a magazine's, by the corner** (`components/portfolio/engine/book.ts`,
  our own, no library). Carry a corner across and the sheet folds along the
  line halfway between where the corner was and where it is now: the part
  past the fold lies turned over on top, showing the back of the sheet, with
  a gloss where coated stock curls and a soft shadow on the page it
  uncovers. It is two page copies under one clip, moved with transforms
  only - no strips, no repainting, and type stays sharp. Resting pages are
  plain flat copies.
- The motion is eased, not simulated: the corner follows the pointer, a
  button or a tap turns the page on a curve from its bottom corner, and a
  released page finishes its turn - or falls back - without bounce. Let go
  past the spine (on a phone, past the middle of the page) or flick it and
  the page goes over. Under a mouse, a corner peels up to meet it.
- The paper is coated magazine stock (`.pbook-paper`): bright and smooth,
  with only a sheen of light across it.
- Pages turn in order, as in a real book: forward always takes the first
  unturned page, back the last turned one - catching it mid-air if it is
  still moving - so the stacks can never be shuffled by fast input.
- `components/portfolio/layout.ts` decides which page goes where. Photographs
  always land on a left-hand page and the back cover always stands alone; the
  contents run to a page per eight units, and a plate is added when the page
  count needs one. Folios are computed, never typed.
- Arabic is bound on the right. The mirroring is done in the engine's
  arithmetic, never with a negative CSS scale, so no page is ever drawn
  reversed.
- Sizes are CSS (`.pbook-frame` in `globals.css`), so the server renders the
  book at its final size.
- On a phone the book is a stack of single pages: swipe toward the spine (or
  tap the outer side) and the page folds away to reveal the next; swipe the
  other way (or tap near the spine) and the last one comes back. The view
  never slides. Page text has minimum sizes so it stays legible
  at phone width; every page is checked clean for overflow from 272px up.
- The book is `aria-hidden`; the same volume follows it as a real list of links.
- In development, `window.__book.timeScale = 0.05` plays turns in slow motion.

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

## Storage

The dashboard keeps its data in the **Vercel Blob store the project already
uses for photographs** — no database, no extra account to create
(`src/lib/data/blob-store.ts`). It is durable across restarts and redeploys.

- **Edits made in admin** (status, copy, prices, photographs, new units) are
  one document of overrides merged over the seed. Every save is a new,
  immutable file; the newest is current and the last ten are kept as history.
  Nothing is overwritten in place, so no read can see a stale or half-written
  version.
- **Enquiries** are one file each, so two sent in the same second can never
  overwrite each other.
- **Everything is encrypted** (AES-256-GCM) before it is stored. The store is
  public — it serves the listing photographs — so a file's address alone must
  never reveal a customer's phone number. Files also sit under a folder name
  derived from the secret, and production and preview deployments each have
  their own, so a preview never touches real leads.
- The public pages read listings through Next's data cache; the store is only
  asked again after an edit (every write revalidates the `alaser-store` tag).

| Variable | Needed for |
|---|---|
| `BLOB_READ_WRITE_TOKEN` | The store. Set automatically when the Blob store is connected to the project. |
| `ADMIN_SESSION_SECRET` | Also derives the encryption key. **Changing it makes stored data unreadable** — to rotate sessions, first set `DATA_SECRET` to its current value. |
| `DATA_SECRET` *(optional)* | Takes over as the encryption key when set. |
| `ALASER_STORE=blob` *(optional, local)* | Development uses `.data/*.json` (gitignored — leads contain phone numbers) so it can never write to live data; set this to use the Blob store locally instead. |

A deployment with no Blob store connected falls back to the function's temp
directory, which does not survive a cold start; the Leads page says so in an
amber notice when that is the case.

**Later, if wanted:** a private Blob store (Storage → Create → Blob →
Private in the Vercel dashboard) needs only `access: "private"` in
`blob-store.ts`. Convex remains possible too — `convex/schema.ts` is the data
model — with `src/lib/data/store.ts` and `inquiries.ts` as the swap points.

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

- Animate `transform` / `opacity` only, and little of it: card hovers, the
  filter sheet, the photo viewer, the book. Nothing waits on a scroll
  animation before it can be read.
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
