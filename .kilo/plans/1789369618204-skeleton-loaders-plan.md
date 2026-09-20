# Skeleton Loaders for Product Grids

## Goal

Replace blank/empty states during the ~1–2s Google Sheets API fetch with animated gray placeholder cards (skeleton UI) that match the exact dimensions of real product cards. Zero layout shift on swap.

## Affected Surfaces

| Surface | Component | Current loading state | Skeleton behavior |
|---|---|---|---|
| PLP (category pages) | `PLPGrid` | `"Loading products…"` text, then grid | 12 skeleton cards in PLP grid |
| Homepage rails | `ProductRail` (Featured, Best Seller, etc.) | Returns `null` → empty gap | N skeleton cards in rail grid |

**Out of scope:** `TypeSection` cards (config-driven, not product-derived — already vanish cleanly when catalogue is empty).

## Config Values (from `shop.ts`)

```
plp.itemsPerPage: 12
plp.gridColumns: { mobile: 2, tablet: 3, desktop: 4 }

carouselGrid[id].columns: varies per section, default { mobile: 1, tablet: 2, desktop: 4 }
carouselGrid[id].rows: 1
```

## Decisions

1. **Skeleton dimensions derive from the same grid classes as real cards.** No separate sizing config needed — the skeleton card lives inside the same `<div className="grid grid-cols-* ...">` container with identical Tailwind classes.

2. **Card structure mirrors the real card markup:**
   - `aspect-square w-full bg-[#EFEFEF] mb-4` — image placeholder (matches PLPGrid and ProductRail)
   - Two `h-3 bg-neutral-200 rounded` blocks below — name + price line placeholders
   - `animate-pulse` on the card wrapper — Tailwind's built-in shimmer

3. **PLPGrid gets a `loading` prop** (not derived from empty products) so it can distinguish "API still fetching" from "filters matched nothing". `CategoryPage` passes `loading={!catalogueReady}`.

4. **ProductRail gets a `catalogueReady` prop.** When `!catalogueReady`, render skeleton count = `columns * rows` (from `SHOP_CONFIG.carouselGrid[id]`) in the same grid. When ready with products → real cards. When ready with zero products → return `null` as before.

5. **Count of skeleton cards:**
   - PLPGrid: `SHOP_CONFIG.plp.itemsPerPage` = 12
   - ProductRail: `columns.mobile * rows` (conservative count that works at all breakpoints; desktop shows more columns but same row count, extra skeletons simply wrap)

## Files to Change

### 1. `src/components/SkeletonCard.tsx` (new)

Single reusable skeleton card. Two variants:
- **`product`** (default): `aspect-square` image block + two text-line placeholders
- Used by both PLPGrid and ProductRail (identical card structure)

```tsx
// SkeletonCard — pure CSS, no runtime logic
// <div className="flex flex-col animate-pulse">
//   <div className="aspect-square w-full bg-[#EFEFEF] rounded-none mb-4" />
//   <div className="flex flex-col gap-1.5">
//     <div className="h-3 w-3/4 bg-neutral-200 rounded" />
//     <div className="h-3 w-1/2 bg-neutral-200 rounded mt-1" />
//   </div>
// </div>
```

### 2. `src/components/PLPGrid.tsx`

- Add `loading?: boolean` prop.
- When `loading === true`:
  - Render `SHOP_CONFIG.plp.itemsPerPage` (12) `<SkeletonCard />`s inside the existing grid `<div>`.
  - Do NOT render pagination controls (they depend on product count).
- When `loading === false` and `products.length === 0`:
  - Show existing "No products match your filters" message.
- When `loading === false` and `products.length > 0`:
  - Show real product cards (unchanged behavior).
- Remove the `Loading products…` text path from `CategoryPage` — PLPGrid handles it now.

### 3. `src/components/CategoryPage.tsx`

- Remove the `isLoading` conditional (lines 85–131 area) that shows `"Loading products…"` text.
- Pass `loading={!catalogueReady}` to `<PLPGrid />`.
- The `showProductCount` FilterBar condition can stay gated on `!isLoading` (don't show "0 Products" during load).

### 4. `src/components/ProductRail.tsx`

- Add `catalogueReady?: boolean` prop.
- When `!catalogueReady && products.length === 0`:
  - Compute skeleton count from grid config: `const grid = SHOP_CONFIG.carouselGrid[id] || DEFAULT_GRID; const skelCount = grid.columns.mobile * (grid.rows || 1);`
  - Render section header (h2) + skeleton cards in the same grid container.
  - Do NOT render navigation controls (prev/next).
- Existing `if (!products || products.length === 0) return null` stays — only fires when `catalogueReady === true` with genuinely empty data.

### 5. `src/pages/HomePage.tsx`

- Pass `catalogueReady={catalogueReady}` to each `<ProductRail />` instance.

## Validation

1. **tsc passes** (`npm run lint`)
2. **Visual test:** hard-refresh localhost — skeletons appear immediately, then swap to real cards without layout jump
3. **No-results test:** filter to something with zero matches → shows "No products match" (not skeletons)
4. **Navigation test:** skeletons don't appear on page 2+ (catalogue already loaded)
5. **Rails test:** each homepage section shows skeleton cards during initial load, real cards after fetch
6. **CLS:** skeleton and real card containers share identical grid classes and aspect-ratio → zero layout shift

## Notes

- `animate-pulse` is a Tailwind v4 built-in — no new dependencies, no JS animation code.
- Skeleton cards are pure markup — no state, no props beyond optional className. Zero runtime cost.
- The `catalogueReady` prop on ProductRail is optional with a default of `true` — existing call sites that don't pass it continue to work unchanged.
