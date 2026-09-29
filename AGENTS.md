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
- **Routing** (BrowserRouter): `/`, `/product/:slug`, `/product/:slug/:typeSlug` (type deep link, e.g. `/product/jewellery/earrings`; type slugs derive from the sheet's Type column via `src/utils/typeSlug.ts`), `/product/:slug/:typeSlug/:productId`, `/product/:slug/:productId` (product detail pages), `/about`, `/contact`, `/faq`, `/privacy`, `/sell`. No `/category/*` route. No accounts/auth — the Sign Up flow was removed; `/sell` is a seller lead landing page (header "Sell" link).
- **Product Detail Page (PDP)**: `src/pages/ProductPage.tsx` renders individual product pages. Uses `Breadcrumbs` for nav. Product cards now navigate to PDP on image/title click; Quick Add button still opens cart via `e.stopPropagation()`. PDP includes image gallery, price, description, related products, client-side JSON-LD Product schema, and SEO meta updates.
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
- `server.ts` imports it. `api/index.ts` carries a **verbatim inlined copy** behind a banner comment — the serverless bundle cannot import from `src/`. The inlined copy freezes the category/collection registries as literals; keep them in sync with `src/config/shop.ts`.
- `index.html` holds `<!--seo-*-->` placeholders plus static defaults for dev. `injectSEO()` strips the static `<title>`, description meta, and canonical first so a rendered route never ships duplicates.
- Both servers register `/robots.txt` and `/sitemap.xml` before the static/catch-all middleware, and set `app.set('trust proxy', true)`. `vercel.json` rewrites both paths to `api/index.ts` — without that they fall through to the SPA rewrite.
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
