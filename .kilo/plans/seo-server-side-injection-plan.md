# Plan: Server-Side SEO Injection for Vite + Express SPA

**Status: Complete (all four phases shipped).**

## Goal
Server-side metadata, JSON-LD, sitemap, and robots.txt for the Vite + Express + Vercel serverless stack, without migrating off it and without regressing the existing PDP work.

## Critical Constraint
Two server entrypoints must stay in sync:
- `server.ts` — local dev and long-running production hosts
- `api/index.ts` — Vercel serverless

`api/index.ts` must stay self-contained (no imports outside `api/`). The SEO module therefore lives in `src/server/seo.ts`, is imported by `server.ts`, and is **inlined verbatim** in `api/index.ts` behind a banner comment. The inlined copy freezes the `SHOP_CONFIG`-derived registries (categories, collections) as literals; keep them in sync with `src/config/shop.ts`.

## What Was Already Done Before This Plan
- `index.html` SEO placeholders: `<!--seo-title-->`, `<!--seo-meta-->`, `<!--seo-canonical-->`, `<!--seo-og-->`, `<!--seo-schema-->`, `<!--seo-ga-->`
- PDP (`src/pages/ProductPage.tsx`) with client-side title/meta/canonical/JSON-LD
- Product-only server-side injection for PDP URLs
- `/api/merchant-feed` GMC feed
- Breadcrumbs, product card navigation split

## What This Plan Added

### `src/server/seo.ts` (new, canonical)
- `SEOMetadata` interface and `ProductLike` shape
- `SEO_CATEGORIES` / `SEO_COLLECTIONS` / `SEO_STATIC_PAGES` registries derived from `SHOP_CONFIG`
- `generateHomeSEO`, `generateProductSEO`, `generateCategorySEO`, `generateCollectionSEO`, `generateStaticPageSEO`, plus a `noindex, follow` variant for unknown routes
- `resolveSEOMetadata(path, products, origin)` — single route resolver for `/`, `/product/:slug`, `/product/:slug/:typeSlug`, `/product/:slug/:typeSlug/:productId`, `/product/:slug/:productId`, static pages, `/:collectionSlug`, and unknowns
- `renderSEOTags` / `injectSEO` — HTML- and JSON-LD-escaped placeholder replacement
- `buildSitemapXml` / `buildRobotsTxt` / `buildSitemapEntries`
- `matchCollectionProducts` — mirrors `matchCollection()` in `src/utils/collections.ts` so collection pages can emit an `ItemList`
- `resolveOrigin` — `SITE_URL` override for the canonical/sitemap origin

### `server.ts` / `api/index.ts`
- Catch-all now covers every route type, not just PDP
- `GET /robots.txt` and `GET /sitemap.xml` (registered before the static/catch-all middleware)
- `app.set('trust proxy', true)` so `req.protocol` reflects Vercel's TLS termination
- `express.static(distPath, { index: false })` so `/` reaches the catch-all instead of serving the raw static `index.html`
- `isMain` now also matches `server.cjs`, so `npm start` actually listens

### `index.html`
- Added the `<!--seo-robots-->` placeholder

### `vercel.json`
- Added `/sitemap.xml` and `/robots.txt` rewrites to `/api/index.ts` (the catch-all rewrite otherwise sent them to `/index.html`)

### `src/utils/seoText.ts` (new)
- `SITE_NAME`, `DEFAULT_SITE_TITLE`, `sanitizeSeoText()`, `pageTitle()`
- Banned typographic dashes are normalized to a plain hyphen everywhere SEO output is produced; ASCII hyphens are preserved
- Applied in `resolveSEOMetadata()` and again in `renderSEOTags()`, including a deep walk of the JSON-LD object
- Client pages use `pageTitle()` for every `document.title` write

## Title Formats (pipe-separated, no em dashes)

| Route | Title |
|---|---|
| `/` | `The Avenue Thirty \| Curated Fashion & Skincare` |
| category | `Bags \| The Avenue Thirty` |
| type page | `Tote Bag \| Bags \| The Avenue Thirty` |
| product | `Flawless Glass skin Bundle \| The Avenue Thirty` |
| collection | `Best Sellers \| The Avenue Thirty` |
| static | `Frequently Asked Questions \| The Avenue Thirty` |
| unknown | `Page not found \| The Avenue Thirty` |

## Behaviour by Route

| Route | Title source | Canonical | JSON-LD | Robots |
|---|---|---|---|---|
| `/` | site name | `{origin}/` | `Organization` + `WebSite` | index |
| `/product/:slug` | category label | `{origin}/product/:slug` | `BreadcrumbList` + `ItemList` | index |
| `/product/:slug/:typeSlug` | type + category label | same path | `BreadcrumbList` + `ItemList` | index |
| `/product/.../:productId` | product name | `{origin}/product/:category/:typeSlug/:id` | `Product` | index |
| `/:collectionSlug` | collection title | `{origin}/:collectionSlug` | `BreadcrumbList` + `ItemList` | index |
| `/about`, `/contact`, `/faq`, `/privacy`, `/return-policy`, `/sell`, `/ai-shopping` | static registry | same path | `WebPage` + `BreadcrumbList` | index |
| unknown route / unknown category / unknown product id | "Page not found" | self | none | noindex, follow |

Product pages always canonicalise to their own `/product/:category/:typeSlug/:id` path, so short or mistyped category URLs consolidate onto one indexable URL.

## Validation Results
- `npm run lint` (tsc) — clean
- `npm run build` — clean
- Production Express (`NODE_ENV=production node dist/server.cjs`) and the `api/index.ts` serverless handler both verified across home, category, type, product, collection, static, unknown-category, unknown-product, robots, sitemap, and `/api/catalogue`
- Every rendered document has exactly one `<title>`, one `description` meta, one canonical, zero leftover `<!--seo-*-->` placeholders, and the GA4 snippet
- `sitemap.xml` — valid XML, 394 unique URLs (home, 5 categories, 52 type pages, 11 collections, 7 static pages, 311 products)
- `robots.txt` — `User-agent: *`, `Allow: /`, `Disallow: /api/`, `Sitemap: {origin}/sitemap.xml`
- `SITE_URL` override verified for canonical and sitemap origin

## Deployment Note
Set `SITE_URL=https://theavenuethirty.com` in the Vercel project environment variables. Without it the server falls back to the request origin, which is correct as long as `trust proxy` sees `x-forwarded-proto`.

## Out of Scope
- Next.js migration evaluation
- Client-side routing changes
- WebP/AVIF image pipeline
- Backlink/authority building
- `src/config/shop.ts` changes — do not touch unless explicitly asked
