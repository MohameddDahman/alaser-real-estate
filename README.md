# Alaser — شركة الأسر للتسويق العقاري

Bilingual (AR/EN) marketing site and private dashboard for a real estate
marketing company in Giza, Egypt.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind v4 · Motion ·
next-intl · nuqs · Convex for storage — the data and the photographs
*(see [Storage](#storage))*

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
    data/                 the read layer, and the Convex-backed store
    plan-geometry.ts      pure geometry, no React
  messages/{en,ar}.json   all copy
convex/                   storage: schema.ts (tables) and store.ts (the functions)
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
- **No machine translation.** `<html translate="no">` and the `google:
  notranslate` meta keep Chrome from translating one language into the other
  (it turned "Haram" into "حرام", "forbidden"). The header's language button
  is the way across.
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

## The dashboard (`/admin`)

Built for daily use, mostly from a phone: a tab bar under the thumb (Home,
Units, Leads, Settings) with the number of unanswered enquiries on Leads, and
the same light look as the public site.

- **Home** - new leads, available, reserved and draft counts (each opens the
  matching list), the latest enquiries with Call and WhatsApp buttons, and
  what on the site needs fixing.
- **Units** - instant search by code, title or area (Arabic spelling
  variants and digits fold together), status filters with counts, and a
  status change on every row without opening the unit. "Add a unit" is
  always in reach.
- **The unit editor** (`components/admin/UnitEditor.tsx`) - adding and
  editing are one screen with every field: status, sale or rent, type,
  area, tenure, price and payment plan, photos, size and rooms, both
  languages, street, features, home-page feature. One Save button, pinned to
  the bottom, saves everything, photos included, and always says whether
  anything is unsaved; leaving with unsaved changes asks first. A status
  visitors can see needs both languages and a price - the checklist under
  the status says what is missing, and the server refuses it too. Numbers
  typed on an Arabic keyboard count. It only ever works on a unit's own
  photos; stand-ins are shown, never saved.
- **Leads** - opens on the enquiries nobody has answered. Each has Call,
  WhatsApp (the reply already names the unit, in the visitor's language) and
  a status: new, contacted, viewing booked, deal done, not interested.
- **Deleted items** (`/admin/deleted`) - a unit deleted from the editor
  comes off the site and out of the lists but keeps everything (it is the
  `archived` status, with the date and the status to come back as). Photos
  taken off a unit wait here too. Restore is one tap; "Delete for good"
  asks first, deletes the photographs' files from storage, and keeps only
  the unit's reference code so it is never handed out again. The list
  offers Undo straight after a delete; the dashboard counts what is waiting.
- **Settings** - language, Deleted items, the site and signing out (the
  phone header has no room for them), then the **business details** the
  client edits: phone, WhatsApp, email, office address, the Google Maps
  link, any number of links (Instagram, Facebook, TikTok, a listings
  profile - known sites name themselves), years in business and units sold.
  One save updates every page: header, footer, contact page, unit pages,
  the portfolio, the WhatsApp buttons and the organisation data search
  engines read (`lib/data/site-settings.ts`, `lib/contact.ts`). The
  company's name, areas, types and tenures stay in `client-facts.ts`: they
  are the site's structure - pages, filters, photographs - not settings.

---

## Storage

Everything the client adds — edits, business details, enquiries and every
photograph — lives in the client's **Convex project, `alaser-realestate`**
(`convex/`, called through `src/lib/data/convex-store.ts`). Production uses
the `accurate-leopard-183` deployment; previews and local development use
`rightful-lyrebird-844`, so a preview never touches real leads. Nothing is
kept on Vercel storage. (It moved off Vercel Blob on 13 Oct 2026, every file
and every saved version checked byte for byte.)

- **Edits made in admin** (status, copy, prices, photographs, new units) are
  one document of overrides merged over the seed. Every save is a new
  version; the newest is current and ten older ones are kept as history. A
  field cleared over the seed is stored as `null`, so the seed's value
  cannot show through again. A version is split into chunks, so it can grow
  past Convex's 1 MiB per document.
- **Business details** are their own small document (`settings`), merged
  over the confirmed values in `client-facts.ts`.
- **Enquiries** are one row each, so two sent in the same second can never
  overwrite each other. An enquiry is never rewritten: where the client has
  got to with it (contacted, viewing booked, deal done, not interested) is a
  separate small document of statuses by enquiry id.
- **Photographs** are in Convex file storage; the listings hold their URLs.
  Deleting one for good from Deleted items deletes the file.
- **Only this server can call the functions.** Convex functions are
  reachable by anyone who knows the deployment's address, so every one
  checks `ALASER_SERVER_KEY`, which only the deployment and the site's
  server know. The browser is only ever handed a one-time upload address,
  after the admin session has been checked.
- The public pages read listings through Next's data cache; Convex is only
  asked again after an edit (every write revalidates the `alaser-store`
  tag). The dashboard reads enquiries and their statuses the same way
  (`alaser-leads`, `alaser-lead-status`).

| Variable | Needed for |
|---|---|
| `CONVEX_URL` | Which deployment. Set on Vercel: production → `accurate-leopard-183`, preview → `rightful-lyrebird-844`. |
| `ALASER_SERVER_KEY` | The key every function checks. The same value must be set on the deployment: `npx convex env set ALASER_SERVER_KEY …` (`--prod` for live). |
| `ALASER_STORE=convex` *(optional, local)* | Development uses `.data/*.json` (gitignored — leads contain phone numbers) so it can never write to live data; set this to use the dev deployment locally instead. |

**Changing the functions or the schema** (`convex/`): `npx convex dev --once`
pushes to the dev deployment, `npx convex deploy` to production. Vercel
does not deploy Convex code, only the site.

A deployment with no Convex configured falls back to the function's temp
directory, which does not survive a cold start; the Leads page says so in an
amber notice when that is the case.

---

## Before launch

Everything outstanding is tracked in one place: `OPEN_QUESTIONS` in
`src/content/client-facts.ts`, rendered on `/admin/settings`.

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

Uploads go **straight from the browser to Convex storage**, to a one-time
address handed out by the `startPhotoUpload` action (which checks the admin
session first). The bytes never pass through a server action, so ten
photographs upload in parallel with real progress and a 4MB file is not a
problem. Convex refuses anything that is not an image under 8MB.

Before anything is sent, `src/lib/resize-image.ts` does the work the brief
asks for, in the browser:

- resizes to a 2560px long edge and re-encodes as WebP
- records the real pixel dimensions, so nothing guesses an aspect ratio
- generates a `blurDataURL` from the photograph itself, not a flat chip
- respects EXIF orientation, which `<img>` decoding does not

The client will be uploading 6MB photos from a phone on Egyptian mobile data;
this sends roughly a tenth of that.

**The cover is the first frame.** The star lifts a photo to the front rather
than setting a separate flag — one concept to explain instead of two. Photos
are saved with the rest of the unit by the editor's one Save button.

**Alt text is never empty.** The server writes it from the room and the unit
in both languages. Change the room and an auto-written alt is rewritten to
match; one written by hand earlier is left alone.

Images from hosts that are not in `next.config` render unoptimised rather than
as a broken box — see `src/lib/images.ts`. Opening the optimiser to `**` would
turn it into an image proxy anyone could bill us for.
