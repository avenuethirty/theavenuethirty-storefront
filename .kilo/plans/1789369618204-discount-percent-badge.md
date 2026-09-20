# Discount badge on all product surfaces (% or OFF amount)

## Goal
When a product has a real discount, show a red badge everywhere its price appears:
- `pct >= 10` → `-20% off`
- `pct < 10` → `-250 OFF` (saved amount, rounded)
Badge text size inherits the surrounding price text size. Red = `text-red-600` (existing site red).

## Context (verified)
- Sheet `Discounted Price` → `api/index.ts` (~L111-130): `priceMonthly` = discounted (fallback unit), `originalPrice` = unit **only when** `0 < discounted < unit` — its presence is the "is discounted" flag.
- Discount math exists inline in `src/hooks/useFilteredProducts.ts:58-67` (leave it; don't refactor).
- Price surfaces (all 5 now in scope):
  - `src/components/ProductRail.tsx:183-192` — strikethrough + sale (home rails)
  - `src/components/PLPGrid.tsx:135-153` — strikethrough + sale (PLP)
  - `src/components/ProductGrid.tsx:125-131` — strikethrough + sale
  - `src/components/AiChatPage.tsx:716-718` — sale price ONLY, no strikethrough (gap confirmed: full `Product` flows there, `originalPrice` available) → add strikethrough + sale + badge to match item cards
  - `src/components/CartDrawer.tsx:267-269` — per-line total `priceMonthly × qty` → add badge after price only, NO strikethrough (user decision)

## Tasks
1. **Create `src/utils/discount.ts`** — single shared helper:
   ```ts
   import { Product } from "../types";

   export function getDiscountBadge(product: Product): string | null {
     if (!product.originalPrice) return null;
     const saved = product.originalPrice - product.priceMonthly;
     if (saved < 1) return null;
     const pct = Math.round((saved / product.originalPrice) * 100);
     return pct >= 10 ? `-${pct}% off` : `-${Math.round(saved)} OFF`;
   }
   ```
   - `saved < 1` guard kills `-0% off` / `-0 OFF` noise. Exactly 10% → `-10% off`.

2. **Rails/PLP/ProductGrid** — in each discounted branch, after the sale-price span:
   ```tsx
   {getDiscountBadge(product) && (
     <span className="ml-2 font-semibold text-red-600">{getDiscountBadge(product)}</span>
   )}
   ```
   Compute badge once into a local const per card to avoid double call. Inherits `text-xs` from wrapper span.

3. **AiChatPage.tsx:716-718** — replace the single price `<p>` with the 3-part pattern (strikethrough original → sale → badge), keeping its existing `text-[11px] font-bold text-[#18181B]` sizing so the badge matches:
   - `<span className="line-through opacity-70 font-normal">…original…</span>` + sale + `<span className="ml-1.5 text-red-600">badge</span>`

4. **CartDrawer.tsx:267-269** — after the line-total span, same badge markup (no strikethrough). Badge reflects unit-level discount once per line regardless of qty. If the row wraps at narrow drawer width, drop the badge below the total right-aligned instead of wrapping mid-value.

5. Long/badged values must stay on one line — verify the worst case on rails: `Rs 24,000.00` + strikethrough + `-20% off` inside fixed-width rail cards; if wrap occurs add `whitespace-nowrap` to the price span (decide during visual check).

## Validation
1. `npm run lint` (tsc --noEmit) + `npm run build` clean.
2. `npm run dev`, full reload required (DISABLE_HMR):
   - Home rails + PLP: discounted cards show ~~Rs~~ sale + red badge; non-discounted show plain price, no badge.
   - Spot-check a live sheet product: unit 1200 / disc 960 → `-20% off`; find one with <10% → `-N OFF`; equal/missing discounted price → no strikethrough, no badge.
   - AI chat: trigger a product recommendation, confirm strikethrough + badge appear on chat cards.
   - Cart: add a discounted product, badge appears after line total; qty 2+ still shows one badge.
3. Optional Playwright sweep for card surfaces (chat/cart: manual).

## Edge cases / risks
- `originalPrice` set but `saved < 1` → strikethrough shows without badge (acceptable, near-impossible with whole-PKR sheet prices).
- OFF amounts unformatted (e.g. `-2395 OFF`) to match user example style `-250 OFF`; no thousands separators.
- Cart subtotal math untouched — badge is display-only, never re-computes prices.
