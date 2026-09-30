# AGENTS.md

## Repo

- Google AI Studio applet: **The Avenue Thirty** (multi-category store: skincare, bags, jewellery, accessories, toys).
- Vite 6 + React 19 + TypeScript 5.8 SPA served by an Express dev server (`server.ts` at repo root, port 3000). **Not** plain `vite`.
- Product data comes from a Google Sheets CSV at runtime (`GOOGLE_SHEET_CSV_URL`). `src/data/mockData.ts` has **empty arrays** — no products are hardcoded.
## Commands

| Command | What it actually does |
|---|---|
| `npm run dev` | `tsx server.ts` — Express server + Vite middleware, port 3000 |
| `npm run build` | `vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs` |
| `npm run start` | `node dist/server.cjs` — run bundled server (production) |
| `npm run preview` | `vite preview` — preview production build |
| `npm run clean` | `rm -rf dist server.js` |
| `npm run lint` | `tsc --noEmit` only. No ESLint/Prettier configured. |

No test runner, no test files, no CI config (no `.github/` workflows).

## Entry points & architecture

- **Client**: `src/main.tsx` → `src/App.tsx`. `App.tsx` holds all global state (cart, modals, chat, catalogue).
- **Server**: `server.ts` (repo root) — Express app with `/api/catalogue`, `/api/chat`, `/api/checkout`, `/api/sell`. `src/server/hubspot.ts` is only the HubSpot API module called by `server.ts`.
- **Routing** (BrowserRouter): `/`, `/product/:slug`, `/product/:slug/:productId`, `/product/:slug/:typeSlug/:productId` (4-segment product), `/product/:slug/:typeSlug` was **removed** and folded into the 3-segment route, see below. Type slugs derive from the sheet's Type column via `src/utils/typeSlug.ts`. Also `/about`, `/contact`, `/faq`, `/privacy`, `/return-policy`, `/sell`, `/ai-shopping`, and `/:collectionSlug`. No `/category/*` route. No accounts/auth — the Sign Up flow was removed; `/sell` is a seller lead landing page (header "Sell" link).
- **Product URLs are `/product/[category]/[typeSlug]/[slug]`** — 4 segments when the product has a `Type`, 3 when it does not (6 products have none, and their shallower URLs are already indexed). The `slug` is the sheet's frozen `Slug` column, read in `mapCsvRowToProduct` (`server.ts:150`, `api/index.ts`). `Product.id` is still the SKU (`String(sku || name)`) and is what cart identity, `/api/product/:id`, and the merchant feed `id` column use.
- **Never assemble a product URL by hand.** Use `productPath(product)` from `src/utils/productSlug.ts` (re-exported from `src/server/seo.ts`). There are exactly two copies of that function: the module and the hand-maintained inlined copy in `api/index.ts`. All client emitters (`ProductPage` canonical + JSON-LD + related links, `App.handleNavigateToProduct`, `server.ts` merchant feed) already go through it. Verify with `grep -rn 'product/\${'` — only `categoryPath`/`typePath` literals and the two `productPath` copies should match.
- **`/product/:slug/:productId` is ambiguous** and resolved at runtime by `src/components/ProductOrCategoryPage.tsx`, which renders `ProductPage` or `CategoryPage` after checking the catalogue. A static route order cannot work: `/product/:slug/:typeSlug` and `/product/:slug/:productId` score identically in react-router, so declaration order only decides which shape wins every 3-segment URL.
- **Resolution order is slug -> id -> live type -> unknown**, shared by the client (`findProductByRef`) and both servers (`resolveProductSegment`). A numeric last segment that matches an `id` is the only redirect candidate; non-numeric (a mistyped type slug) stays noindex. Both servers run `app.get('/product/*')` **before** the Vite middleware / `express.static`, so the 301 to the slug URL is a real HTTP status in dev and prod.
- **Product Detail Page (PDP)**: `src/pages/ProductPage.tsx` renders individual product pages. Uses `Breadcrumbs` for nav. Product cards now navigate to PDP on image/title click; Quick Add button still opens cart via `e.stopPropagation()`. PDP includes image gallery, price, description, related products, client-side JSON-LD Product schema, and SEO meta updates. It resolves the product by slug then id, and derives its canonical tag, JSON-LD `@id`/`offers.url`, and any client-side URL rewrite from `productPath(product)` so the three can never disagree.
- **Slug pipeline**: `normaliseProductSlug` / `computeSlugFromName` in `src/utils/typeSlug.ts`; `readProductSlug` applies them to the sheet's `Slug` cell. A non-empty cell is normalised for characters but **never truncated** (`maxLength: null`) — the column is frozen, so shortening an operator's value would serve a URL that disagrees with the sheet forever. The 60-char word-boundary cap applies only to slugs computed from a name. `GET /api/slug-audit` reports blank cells, normalisation rewrites, over-length slugs, and duplicate slugs (lowest numeric SKU wins, and `compareCandidates` is the single ordering primitive shared by the map and the report).
- **Components**: `src/components/` | **Pages**: `src/pages/` | **Types**: `src/types.ts` | **Config**: `src/config/shop.ts` | **Data**: `src/data/mockData.ts` | **Server modules**: `src/server/`

## Category taxonomy

Defined in `src/utils/category.ts` — 5 HubSpot-aligned keys: `clothing_apparel`, `skincare_beauty`, `bags_backpacks`, `accessories`, `toys_kids`.

**Important**: `clothing_apparel` is **commented out** in `SHOP_CONFIG.categories` (`src/config/shop.ts`) so it does not appear in nav, but it still exists in the `CategoryKey` type and `Product.category` type.

## Environment

- **Required**: `GROQ_API_KEY` — used by both `server.ts` (`process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY`) and the GROQ chat API.
- **Critical for catalogue**: `GOOGLE_SHEET_CSV_URL` — `server.ts` fetches product data from this Google Sheets CSV export. Missing → catalogue falls back to empty array or stale cache (10-min TTL). **Not listed in `.env.example`** but present in `.env`/`.env.local`.
- `HUBSPOT_ACCESS_TOKEN` — checkout sync (creates contact + deal + association via HubSpot CRM API).
- `DISABLE_HMR=true` — disables Vite HMR and file watching in `vite.config.ts`. **Do not remove** — prevents flickering during agent edits.
- `APP_URL` — optional, injected by AI Studio.
- `.env` and `.env.local` contain secrets (including a real GROQ key and HubSpot token) — do not expose these. `.env.example` is tracked in git.
- Non-sensitive store settings live in `src/config/shop.ts` (`SHOP_CONFIG`), including `typeSections` (per-category "Shop by type" homepage sections: format cards/pills, grid, limit, and per-type image/label/order overrides keyed by type slug; falls back to the type's first product image and count-desc order).
- **Do not edit `src/config/shop.ts` unless explicitly asked.** Treat user-made config edits in that file as owned content, even if they appear incomplete or inconsistent. If a requested change requires schema or typing adjustments in `shop.ts`, make only the minimum necessary edits and do not revert or normalize unrelated config changes. **Never run `git checkout -- src/config/shop.ts`, `git restore src/config/shop.ts`, or any equivalent revert command on this file unless the user explicitly asks to discard their own edits.**

## Toolchain quirksks

- **Tailwind v4** via `@tailwindcss/vite` plugin — no PostCSS config. CSS entry: `src/index.css` with `@import "tailwindcss"`.
- **No PostCSS** — `autoprefixer` is in `package.json` but unused.
- Path alias `@` → project root (in both `tsconfig.json` and `vite.config.ts`).
- Lenis smooth scroll initialized in `App.tsx` `useEffect` (duration 1.2, custom easing).
- `bun.lock` present but scripts are npm-compatible — use `npm`, not `bun`.
- TypeScript: `moduleResolution: "bundler"`, `isolatedModules: true`, `noEmit: true`, `allowImportingTsExtensions: true`.

## Checkout flow

- Guest checkout is COD-only. Completed via a pre-populated `wa.me` link generated in `CartDrawer.tsx`.
- `src/utils/whatsapp.ts` builds the WhatsApp URL from cart items + delivery details.
- On confirm, `CartDrawer` POSTs to `/api/checkout`, which calls `createHubspotDeal()` (`src/server/hubspot.ts`) → creates HubSpot contact, deal, and association.
- Shipping: `defaultFee: 240` PKR, `freeShippingThreshold: 5000` PKR (`src/config/shop.ts`).

## Build output

`dist/` contains: `index.html`, `assets/` (client bundles), `server.cjs` + `server.cjs.map` (bundled Express server).

## Server-side SEO

- `src/server/seo.ts` is the canonical SEO module: `resolveSEOMetadata()` routes any path to a title/description/canonical/robots/OG/JSON-LD set, plus `injectSEO()` (placeholder replacement, HTML- and JSON-LD-escaped) and `buildSitemapXml()` / `buildRobotsTxt()`.
- `server.ts` imports it. `api/index.ts` carries a **verbatim inlined copy** behind a banner comment — the serverless bundle cannot import from `src/`. The inlined copy also contains the whole slug module (`toTypeSlug`, `normaliseProductSlug`, `productPath`, `buildSlugIndex`, `resolveProductSegment`, `resolveProductRedirect`, the audit helpers) and freezes the category/collection registries as literals; keep them in sync with `src/config/shop.ts`. **Any edit to slug resolution, path building, or the resolver in one file must land in the other.** Because the drift is invisible to `tsc`, verify it by behaviour: mount `api/index.ts` as an Express app and diff it against `dist/server.cjs` over HTTP rather than by reading the two side by side.
- `index.html` holds `<!--seo-*-->` placeholders plus static defaults for dev. `injectSEO()` strips the static `<title>`, description meta, and canonical first so a rendered route never ships duplicates.
- Both servers register `/robots.txt` and `/sitemap.xml` before the static/catch-all middleware, and set `app.set('trust proxy', true)`. `vercel.json` rewrites both paths to `api/index.ts` — without that they fall through to the SPA rewrite.
- The sitemap carries slug PDP URLs only; assert zero entries whose last segment is purely numeric before shipping any URL change. The merchant feed `link` column is slug-based too, while its `id` column stays the SKU on purpose.
- `SITE_URL` (optional) overrides the origin used for canonicals, OG tags, and the sitemap. Fallback is the request origin.
- Production `server.ts` uses `express.static(distPath, { index: false })` so `/` reaches the catch-all instead of serving raw static HTML.

### Hard rule: no typographic dashes in SEO output

Em dashes (and en dashes, minus signs, figure/non-breaking hyphens) are **banned** from every `<title>`, meta description, Open Graph/Twitter tag, and JSON-LD string this site renders. Separate title segments with `|` instead — `Tote Bag | Bags | The Avenue Thirty`, not `Tote Bag — Bags | The Avenue Thirty`.

- `src/utils/seoText.ts` owns `SITE_NAME`, `DEFAULT_SITE_TITLE`, `sanitizeSeoText()`, and `pageTitle()`. Build every title with `pageTitle(...parts)` rather than a template literal, so the rule holds automatically.
- `sanitizeSeoText()` normalizes banned dashes to a plain `-` and leaves existing ASCII hyphens alone (`Must-Have Styles` stays intact). It is applied in `resolveSEOMetadata()` (title, description, and deep through the schema object) and again in `renderSEOTags()` as a backstop, so even sheet-supplied product names and descriptions cannot leak one.
- Client pages (`ProductPage`, `CategoryPage`, `CollectionPage`) route their `document.title` and meta-description writes through the same helpers.
- The em dashes that remain in the repo are in code comments and in the truncation character class inside `clampText()` — both must stay as they are; only rendered output is governed by this rule.

## Vercel deployment

- Vercel does not support a long-running Express process. Instead, `server.ts` is wrapped as a single serverless function via `api/index.ts`.
- `vercel.json` rewrites `/api/*`, `/sitemap.xml`, and `/robots.txt` to `api/index.ts`, and all other routes to `/index.html` (SPA entry). `api/index.ts` is a self-contained Express app (all logic inlined — no imports from root `server.ts`, **and no relative imports outside `api/` at all**, e.g. `../src/...` — the traced lambda bundle will not include those files and every `/api/*` route dies with `FUNCTION_INVOCATION_FAILED`) to ensure Vercel's `@vercel/node` builder includes all code in the function package.
- `server.ts` exports `createApp()` (returns the Express app). The `app.listen()` call is guarded by a main-module check matching `server.ts`, `server.js`, **and** `server.cjs` (so `npm start` listens) that does not fire when imported by Vercel's runtime. `server.ts` is used only for local development and non-Vercel production hosts.
- Local dev (`npm run dev`) is unaffected — it still runs `tsx server.ts` directly.
- Vercel Dashboard env vars must include: `GROQ_API_KEY`, `HUBSPOT_ACCESS_TOKEN`, `GOOGLE_SHEET_CSV_URL`, `BDC_API_KEY`. `SITE_URL` is optional but recommended for correct canonicals. Do not set removed `VITE_CIRCLE_*` vars.
- Trade-off: the in-memory catalogue cache is lost on serverless cold starts. First request after idle refetches the Google Sheet (~1–2s).

## Operational modes

The agent operates in one of three modes. Respect the current mode at all times:

- **Ask mode** — read-only. Answer questions, analyze, suggest plans. Do NOT write code, modify files, or run mutating commands (git push, commit, write, edit).
- **Plan mode** — analyze and draft plans. Write plan files when instructed. Do NOT write code, modify source files, or push.
- **Code mode** — full implementation. Write code, edit files, run commands, commit. **Only push to git when explicitly asked.**

If the user says "proceed" or "implement" while in Ask or Plan mode, switch to Code mode first, then act.
If the user says "stop coding" or "don't code", switch back to Ask or Plan mode immediately.
Never push to git (`git push`, `npm run deploy`, etc.) unless the user explicitly requests it. `git commit` is OK if the user asked for it; `git push` always requires explicit request.
