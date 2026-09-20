# Collection Pages + Config-Driven Homepage Rails (v3)

## Goal
Replace the hardcoded homepage product rails with a config-driven sequence, introduce declarative **collection pages** at flat URLs with filter-based `CollectionMatch` registry, add creative collection cards (Budget Buys, Bags Under Rs. 1,500, etc.), remove two static homepage sections, reorder the homepage layout, extract `Image2`/`Image3` columns from the Google Sheet for product-card hover swaps, and keep `shop.ts` organized by sections.

## Confirmed Decisions (from brainstorm)

- Homepage rail set/order becomes config; default keeps four distinct-intent rails: **Must-Have, Best Seller, On Sale, New Arrival**. Trending / Featured stay nav-hidden (reachable by URL, not in sequence).
- Collection URLs are **flat** (`/:slug`), resolved via a config registry; unknown slugs render a NotFound EmptyState.
- Collections are **declarative match objects** — "Budget Buys" and "New Arrivals" use the same `matchCollection` mechanism. Any combination of `collection`, `category`, `type`, `minDiscountPct`, `priceMin`, `priceMax`, `ratingMin` is valid.
- Rails get **View All** buttons linking to their collection page.
- **Category banners removed** from homepage sequence (duplicate the existing `CategoryCardsSection`). `CategoryBanner.tsx` retained for future use but NOT in `homepage.sequence`.
- **Global EmptyState** component with dynamic titles.
- Below-fold homepage sections **lazy-mount** (IntersectionObserver).
- **Brands page (`/brands`) deferred** to a separate phase.
- **`shop.ts` reorganized** into clearly labeled sections.
- **`Image2 Url` and `Image3 Url`** extracted from the Google Sheet in `server.ts` and added to the `Product` type. `Image2` used for hover-swap on product cards (card shows primary image, swaps to `imageUrl2` on hover). `Image3` reserved for PDP gallery (future). Both auto-fallback to `imageUrl` when absent.

## Verified Context

- `src/pages/HomePage.tsx` hardcodes 7 `ProductRail`s via `byStatus()`, interleaved with 3 `TypeSection`s, SystemApproach, AboutUs, HowItWorks, TikTok, CTA.
- `src/App.tsx` — static routes only; scroll-reset on `pathname + ?page` at `App.tsx:69-75`.
- `src/components/PLPGrid.tsx` — URL-driven pagination, skeleton loading, FilterBar, no-match message.
- `src/components/CategoryPage.tsx` — handles `/product/:slug(/:typeSlug)`, passes `loading` to PLPGrid.
- `src/hooks/useFilteredProducts.ts` — discount pct math exists.
- `src/utils/discount.ts` — `getDiscountBadge`.
- `src/components/SkeletonCard.tsx` — existing skeleton.
- `src/components/SystemApproachSection.tsx` — "CURATED WITH CARE" static block (2-column image cards).
- `src/components/AboutUsSection.tsx` — "Shopping well comes down to three simple pillars" static block (scroll-animated circles).
- Google Sheet CSV has `Image2 Url` and `Image3 Url` columns — currently NOT extracted in `server.ts`.

## Architecture

### 1. Config schema (`src/config/shop.ts`)

Reorganized into sections. Types:

```ts
export interface CollectionMatch {
  collection?: string;
  category?: string;
  type?: string;
  minDiscountPct?: number;
  priceMin?: number;
  priceMax?: number;
  ratingMin?: number;
}

export interface CollectionConfig {
  slug: string;
  title: string;
  subtitle?: string;
  match: CollectionMatch;
  image?: string;        // card cover; falls back to first matched product image
  grid?: { mobile: number; tablet: number; desktop: number };
  itemsPerPage?: number;
  card?: { hidden?: boolean; order?: number };
}
```

### 2. Collections registry — default data

```ts
collections: [
  // Status-based
  { slug: "must-have", title: "Must-Have Styles", match: { collection: "Must-Have Styles" } },
  { slug: "best-sellers", title: "Best Sellers", match: { collection: "Best Seller" } },
  { slug: "on-sale", title: "On Sale", match: { collection: "Sale" } },
  { slug: "new-in", title: "New Arrivals", match: { collection: "New Arrival" } },
  // Nav-hidden
  { slug: "trending", title: "Trending", match: { collection: "Trending" }, card: { hidden: true } },
  { slug: "featured", title: "Featured", match: { collection: "Featured" }, card: { hidden: true } },
  // Creative / filter-based
  { slug: "budget-buys", title: "Budget Buys", subtitle: "Affordable picks under Rs. 1,000", match: { priceMin: 0, priceMax: 1000 } },
  { slug: "budget-skincare", title: "Skincare Under Rs. 1,000", subtitle: "Gentle care without the splurge", match: { category: "skincare", priceMin: 0, priceMax: 1000 } },
  { slug: "bags-under-1500", title: "Handbags Under Rs. 1,500", subtitle: "Statement bags at a steal", match: { category: "bags", priceMin: 0, priceMax: 1500 } },
  { slug: "bags-clearance", title: "Bags 50%+ Off", subtitle: "Deep discounts on our best bags", match: { category: "bags", minDiscountPct: 50 } },
  { slug: "top-rated", title: "Top Rated", subtitle: "Our highest-rated picks", match: { ratingMin: 4 } },
]
```

### 3. Homepage sequence — no banners, no collectionCards

`collectionCards` removed from the sequence because it's now rendered directly in `HomePage` (after Categories, before the sequence starts).

```ts
homepage: {
  sequence: [
    { type: "rail", collection: "must-have" },
    { type: "rail", collection: "best-sellers" },
    { type: "types", category: "bags" },
    { type: "rail", collection: "on-sale" },
    { type: "types", category: "jewellery" },
    { type: "rail", collection: "new-in" },
    { type: "types", category: "toys" },
  ]
}
```

### 4. Carousel grid (keyed by collection slug, only for rails)

```ts
carouselGrid: {
  "must-have":     { mobile: 2, tablet: 2, desktop: 3, rows: 1 },
  "best-sellers":  { mobile: 2, tablet: 2, desktop: 4, rows: 2 },
  "on-sale":       { mobile: 2, tablet: 2, desktop: 8, rows: 2 },
  "new-in":        { mobile: 2, tablet: 2, desktop: 4, rows: 2 },
}
```

### 5. Collection card grid config

```ts
collectionCardGrid: {
  columns: { mobile: 2, tablet: 3, desktop: 4 },
}
```

### 6. Product type — add image variants

```ts
export interface Product {
  // ... existing fields ...
  imageUrl: string;
  imageUrl2?: string;   // Image2 Url from sheet
  imageUrl3?: string;   // Image3 Url from sheet
  // ...
}
```

## Tasks (ordered)

1. **`src/types.ts`** — Add `imageUrl2?: string` and `imageUrl3?: string` to the `Product` interface.

2. **`server.ts`** — In `mapCsvRowToProduct`, extract `Image2 Url` and `Image3 Url` columns into the product object as `imageUrl2` and `imageUrl3`. Keep fallback to `imageUrl` when absent (empty string → undefined).

3. **`src/components/ProductRail.tsx`** — Add hover-swap behavior: primary card image shows `imageUrl`; on hover, swap to `imageUrl2` if present; on mouse leave, revert to `imageUrl`. When `imageUrl2` is absent, no swap occurs (static primary image).

4. **`src/config/shop.ts`** — Add `budget-skincare`, `bags-under-1500`, `bags-clearance`, `top-rated` to the `collections` registry (with `subtitle` and filter `match`). Add `collectionCardGrid` config. Remove `collectionCards` from `homepage.sequence` (it will be rendered directly in `HomePage`). Remove `{ type: "collectionCards" }` from the sequence union type. Reorganize file by sections.

5. **`src/pages/HomePage.tsx`** — Remove `SystemApproachSection` and `AboutUsSection` imports. Remove `CategoryBanner` import. Render `CollectionCardsSection` directly after `CategoryCardsSection` (before the sequence starts). The page order becomes:
   - `HeroSection`
   - `CategoryCardsSection`
   - `CollectionCardsSection` (Curated picks, directly rendered, not in sequence)
   - `SHOP_CONFIG.homepage.sequence` items (four rails + three TypeSections)
   - `HowItWorks`
   - `TikTokTestimonials`
   - `CtaSection`

   Remove `collectionCards` handling from the sequence renderer. Remove `HomepageSequenceItem.collectionCards` variant.

6. **`src/components/CollectionCardsSection.tsx`** — Use `SHOP_CONFIG.collectionCardGrid` for column layout instead of `categoryGrid`. Keep subtitle rendering, auto-hide zero-match, image fallback, sort by `card.order`.

## Validation

1. `npm run lint` + `npm run build` clean.
2. `npm run dev`:
   - Direct URLs `/must-have`, `/best-sellers`, `/on-sale`, `/new-in`, `/budget-buys`, `/budget-skincare`, `/bags-under-1500`, `/bags-clearance`, `/top-rated` render correct filtered grids.
   - `/trending`, `/featured` render pages (nav-hidden but reachable by URL).
   - `/nonexistent-slug` renders NotFound EmptyState with "Collection not found" + Continue Shopping link.
   - Static routes unaffected (`/about`, `/sell`, `/product/skincare`, `/product/bags/handbag`).
   - Homepage order: Hero → Categories → Curated picks cards → must-have rail → bags types → on-sale rail → jewellery types → new-in rail → toys types → HowItWorks → TikTok → CTA.
   - SystemApproachSection and AboutUsSection are NOT rendered on the homepage.
   - Collection cards show subtitle where configured (e.g. "Budget Buys" shows "Affordable picks under Rs. 1,000").
   - Product cards on rails and PLP: primary image shows `imageUrl`; on hover, swaps to `imageUrl2` if available; reverts on mouse leave. Products without `imageUrl2` show static primary image.
   - Pagination `?page=N` works on collection pages; scroll resets on page change.
   - FilterBar narrows within a collection (sort by discount, price, rating compose with base filter).
   - Below-fold homepage sequence items lazy-mount.
3. Spot-check `document.title` per collection page.

## Risks / Edge Cases

- **Route shadowing**: `/:collectionSlug` catches every unknown single-segment path — mitigated by registry validation + NotFound; registered after all static routes.
- **Empty collections**: combination filters can match zero — double protection (card auto-hidden + CollectionPage EmptyState).
- **Tag↔slug drift**: sheet tag vs slug mapping lives only in `shop.ts` collections registry.
- **Case sensitivity**: collection-tag matching stays case-insensitive.
- **LazyMount + Lenis**: verify scroll anchors still work with late-mounted sections.
- **Image2 fallback**: hover-swap must not break if `imageUrl2` is empty/missing; fallback to static `imageUrl`.
- **`collectionCardGrid` keys**: currently only needs mobile/tablet/desktop column counts. No rows config — section renders all matching cards in a single grid.

## Out of Scope

- PDP / cart-drawer recommendations.
- Server-side filtering or new API endpoints.
- Header/nav changes for collections.
- Brands page (`/brands`) — deferred to a separate phase.
- Category banners on the homepage (removed).
- `Image3` usage beyond extraction — reserved for PDP gallery.
