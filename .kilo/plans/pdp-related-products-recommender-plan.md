# Plan: PDP Related Products ("You may also like") Recommender

## Current State

**The section is a category filter, not a recommender.** `src/pages/ProductPage.tsx:62-67`:

```tsx
const relatedProducts = useMemo(() => {
  if (!product) return [];
  return products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);
}, [products, product]);
```

`products` is Google Sheets row order — `fetchCatalogue` (`src/utils/catalogue.ts`) is a pure passthrough, and `fetchCatalogueFromSheet` (`server.ts:158-176`) only does `products.push(...)` in row order. Nothing sorts. So every PDP in a category shows the identical four products: the top four rows of that category's block.

Measured on the live sheet (310 products after the `in_stock` filter):

| Category | n | Shown on every PDP in that category |
|---|---|---|
| `bags` | 137 | Vintage Laptop Bag (Laptop Bag), Trinity Choco (Tote Bag), Alexa 3 Pcs Lilac (Crossbody Bag), Mylene Beige (Tote Bag) |
| `jewellery` | 100 | Royal Perpetual Gemstone Sheeshatti (MATHA PATI), Vector Earrings (Earrings), Aquata's Ring (Rings), Royal Pearl Malla Necklace Set (Necklace Sets) |

The bags list does contain one crossbody, but only because `Alexa 3 Pcs Lilac` happens to sit at row 170. It is coincidental, not signal: the output is arbitrary with respect to relevance, and it does not change when the viewed product changes. Viewing any other crossbody bag yields the same four.

**The signal needed already exists but is unused.** The `Type` sheet column is parsed into `Product.tagline` and `Product.typeSlug`. Live distribution:

| Category | distinct types | largest group |
|---|---|---|
| `bags` | 17 (16 non-blank + 6 blank) | Crossbody Bag = 34 (24.8%) |
| `jewellery` | 12 | five-way tie at 12 (Anklets, Bracelet, Earrings, Finger Ring, Necklace Sets) |
| `toys` | 22 | 7 (Building Blocks, Clay & Dough) |
| `skincare` | 8 | 2 (Wax) |
| `premium` | 1 | 8 (Air Freshness) |

**Price distribution** (effective price = Discounted Price when > 0 and < Unit price, else Unit price). Overall: min 399, p25 1299, median 2199, p75 2999, p95 6365, max 105000; 100 distinct price points across 310 products.

| Window (same category) | products with **< 4** neighbours | with **0** |
|---|---|---|
| ±10% | 64 / 310 (20.6%) | 18 |
| ±20% | 23 / 310 (7.4%) | 8 |
| ±1000 | 18 / 310 (5.8%) | 12 |

Conclusion: a ±10% price band is too tight to be a hard filter. Price must be a soft score, or the cascade must widen.

**There is no behavioural data.** No accounts, no auth, no order history, no click tracking, no cookies, no visitor ID, no `gtag('event')` call anywhere in the repo. GA4 (`G-60DT6QKVL6`) is injected but only fires pageviews. `localStorage` holds exactly two keys (delivery city + timestamp). The cart is `useState` only and is lost on reload. Any ranking can therefore be **content-based relevance**; anything called "personalised" would be unfounded until instrumentation exists.

## Goal

Make the section genuinely relevant, at zero new infrastructure cost:

1. Recommend same-sub-category products first, not first-in-row-order.
2. Never show the same four items on every PDP of a type.
3. Never show the same product in a different colour.
4. Always return a full row, on every product, without a special case.
5. Move the section out of the right-hand column into a full-width block below the product, with cards at parity with `PLPGrid`.

## Explicitly Out of Scope

Three pre-existing bugs were found during research and are **not** in this plan. They get their own plan:

- `ratingMin` is declared but never applied in `src/utils/collections.ts`, so the `top-rated` collection returns all 310 products.
- `useFilteredProducts.ts` sort options `"recommended"` and `"newest"` both return `0` and are no-ops, yet `FilterBar` renders them as working controls.
- `CATEGORY_SYNONYMS` in `AiChatPage.tsx:34-39` targets legacy slugs (`accessories`, `bags_backpacks`, `skincare_beauty`) that no live product carries, so AI-chat product matching returns `[]` for jewellery, skincare and bags.

Also out of scope: behavioural personalisation (Future Work below), and deleting the dead `src/components/ProductGrid.tsx`.

## Implementation Phases

### Phase 0: Establish the baseline — RESOLVED

**Status: measured on 2026-09-30. Baseline is clean. No source change required.**

`npm run lint` (`tsc --noEmit`) exits **0** at HEAD `a383ad9`.

Research had flagged `src/pages/ProductPage.tsx:53` as a possible TS2339, because it reads `product.imageUrl3` while `src/types.ts:1-23` declares only `imageUrl` and `imageUrl2`. That concern is **not** an error. Probes run against the real compiler:

| Probe | Result |
|---|---|
| Appended `const __probe: number = "not a number";` to `ProductPage.tsx` | `error TS2322` reported at line 271 — the file **is** in the program and is checked |
| Replaced line 53 with `product.thisFieldDefinitelyDoesNotExist` | **No error at all** |

So `tsc` does check this file, but **property access on `product` is not being checked at all** — an invented property name passes. The most likely cause is that `products.find(...)` inside `useMemo` (line 35) widens to `any` under the repo's non-strict `tsconfig.json` (`strict` is absent, so `strictNullChecks` and `noImplicitAny` are both off).

**Consequences for this plan:**

1. **Do not add `imageUrl3` to the `Product` interface.** The type currently under-describes the runtime shape, but the compiler is not enforcing it either way, and adding the field would imply a fix to a problem that does not exist. Leave `src/types.ts` untouched.
2. **`npm run lint` is a weaker gate than assumed in this file.** It catches type mismatches but silently accepts misspelled or non-existent property names. Treat the manual validation steps below as the primary check, not lint.
3. If the non-strict config is ever tightened, line 53 will surface as a genuine error. Worth a follow-up, but out of scope here.

### Phase 1: Recommender module

**Files:** `src/utils/recommendations.ts` (new)

Pure, dependency-free functions. No React, no `SHOP_CONFIG` import (so it can be inlined into the serverless bundle later without freezing config). All weights live in one exported `RECOMMENDER_WEIGHTS` constant.

```ts
export interface ScoredProduct {
  product: Product;
  score: number;
  reason: 'same-type' | 'same-category' | 'fallback';
}

export function getRelatedProducts(
  product: Product,
  products: Product[],
  limit?: number
): ScoredProduct[];
```

**Scoring.** Score every candidate in the same category, then rank:

| Signal | Weight | Notes |
|---|---|---|
| `typeSlug` match | +100 | Strongest signal. Only when both are non-empty. |
| Same category | +40 | Base tier; cross-category candidates get 0. |
| Variant-family match | +25 | Same inferred product family, e.g. two "Alexa 3 Pcs" bags. |
| Price proximity | 0 to +30 | Scaled bands: within 10% = 30, within 20% = 20, within 40% = 10, else 0. Computed against `product.priceMonthly`, guarding against zero. |
| Name token overlap | 0 to +20 | Jaccard similarity of name tokens, scaled to 20. |
| Shared collection tag | +15 each, capped at +30 | Effectively inert today — only 5 of 310 rows have a `Collections` value. Free once the sheet is populated. |
| Discount depth | 0 to +5 | Small tie-breaker. |

**Hard exclusion.** Any candidate inferred to be the same product family as the viewed product is removed before ranking. This is the difference between a relevant and an embarrassing result: `Alexa 3 Pcs` appears 10+ times in different colours with no `Parent SKU` set, so a naive type match would recommend the green one while the user is looking at the lilac one.

**Cascade.** Guarantees a full row for every product:

1. Score all same-category candidates. Exclude self and same-family variants.
2. Take same-`typeSlug` matches by score.
3. If fewer than `limit`, append the remaining same-category candidates by score.
4. If still fewer, append cross-category candidates by score, so thin categories (`premium` has 8 products in a single type; `skincare` has 8 spread across 7 types) still fill the row.

**Deterministic rotation.** After sorting, rotate the ordered list by `hash(product.id) % list.length`. Without this, all 34 crossbody PDPs show the same four items — the exact bug being fixed, one level down. It must be seeded from the product id, never `Math.random()`, so the set is stable across re-renders and identical between server and client render.

**Variant-family inference.** Tokenise the product name, drop pure-numeric tokens, and take the token with the highest catalogue document frequency as the family key. "Alexa 3 Pcs Lilac" resolves to `alexa`; "Grace Beige / Choco" resolves to `grace`. This avoids hardcoding a colour-word list (the sheet's `Colors` column is empty in all 311 rows). It is a heuristic and must be reviewed against real output in the validation step.

**Why not `Parent SKU`:** it is populated on only 2 of 311 rows, and the recurring colour-variant families (Alexa, Grace, Aura, Quest, Ash, Capri) have no parent link set at all. Map it later if the sheet gains real variant data; do not depend on it now.

### Phase 2: Wire into the PDP

**Files:** `src/pages/ProductPage.tsx`

Replace the body of the existing `relatedProducts` memo with a call to `getRelatedProducts`. Change `.slice(0, 4)` only if the row count changes.

**Constraint:** every new hook must be declared **above** the `if (!catalogueReady)` (line 129) and `if (!product)` (line 148) early returns. A hook below a conditional return changes the hook count between renders and React 19 unmounts the whole tree — this was the blank-PDP bug fixed in commit `a383ad9`, and the explanatory comment at lines 57-61 must stay. Phase 3 adds two `useState` hooks; both go at the top.

### Phase 3: Full-width section and card parity

**Files:** `src/pages/ProductPage.tsx`

**Move.** The block currently sits inside the right column at lines 235-262. Move it to a sibling of the two-column grid — between the `</div>` closing `grid grid-cols-1 md:grid-cols-2 gap-10` (line 264) and the `</div>` closing `max-w-7xl mx-auto px-6 pb-24` (line 265). That placement keeps the container's `pb-24` as the page's bottom padding.

Do **not** make it edge-to-edge like the homepage `ProductRail` (`<section className="py-16 md:py-24">` + `w-full px-[10px]`). Mixing that idiom inside a `max-w-7xl px-6` container will look wrong; the PDP uses the `max-w-7xl` idiom throughout.

**Heading.** Current is `text-lg font-light tracking-tight mb-4` (line 237) — the smallest heading on the site. Inner pages under a `max-w-7xl` container use `text-2xl md:text-3xl font-light tracking-tight` (`AboutPage.tsx:70`, `SellPage.tsx:156`, `ContactPage.tsx:118`). Use that, plus a muted label above it following the eyebrow convention at `CollectionCardsSection.tsx:58` (`text-xs font-bold uppercase tracking-[0.3em] text-[#9A8C83]`), e.g. the type name.

**Grid.** Use the literal house pattern, which is already emitted by `LazyMount.tsx:32`:

```
grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[10px]
```

Do **not** build the class from a template literal. Tailwind v4 scans source for static strings; `PLPGrid.tsx:25` gets away with interpolation only because these exact strings appear elsewhere. A 6-item row would need `lg:grid-cols-6`, which appears in no literal class string in the repo today and would require adding a literal occurrence (or a lookup table, as in `TypeSection.tsx:24-49`) or Tailwind will not emit it. Default `limit` is therefore 4.

**Card.** Model it on `PLPGrid.tsx:98-170` verbatim and reuse its class strings: hover image swap (`imageUrl` to `imageUrl2` on `onMouseEnter`), the black scrim with the sliding-up Quick Add button, the `getDiscountBadge` price block, and the uppercase name typography. `ProductRail.tsx:153-219` is the same card — either is a valid model. Do not use `ProductGrid.tsx`: it is a third, unimported copy whose whole card adds to cart.

Two pieces of state, both declared above the early returns (see Phase 2):

```tsx
const [addedProductId, setAddedProductId] = useState<string | null>(null);
const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
```

Reuse the per-id form from `PLPGrid.tsx:81-88` (1500 ms reset) rather than the single boolean `ProductPage.tsx:32` uses, so only the clicked card flips. `Check` and `Plus` are already imported at `ProductPage.tsx:9` but currently unused — Phase 3 finally uses them.

**Navigation contract.** `PLPGrid.tsx:106` and `ProductRail.tsx:161` navigate via `onClick={() => onNavigateToProduct?.(product)}`, but `App.tsx:166-167` do **not** pass `onNavigateToProduct` to `ProductPage`. Keep the existing `<Link to={...}>` wrapper (currently line 240-242) rather than adding the prop — it preserves deep-link URLs and touches fewer files. The quick-add button **must** keep `e.stopPropagation()`, or clicking Quick Add will also trigger the card navigation.

### Phase 4: SEO consistency

**Files:** `src/pages/ProductPage.tsx`, `src/server/seo.ts` (and the inlined copy in `api/index.ts`)

Optional, and only if the JSON-LD stays truthful. Schema.org exposes `Product.isRelatedProduct`; adding it lets search engines understand the relationship. It must contain exactly the URLs actually rendered.

The risk is drift: `api/index.ts` cannot import from `src/`, so any shared logic must be inlined there too, and the two copies can silently diverge. `src/server/seo.ts` already contains a `matchCollectionProducts` duplication of `src/utils/collections.ts` for exactly this reason. Weigh whether one more duplicated helper is worth the structured-data gain; the section works fine without it.

Note that `generateProductSEO` in `src/server/seo.ts` currently emits `Product` schema only, with no related-item list, so nothing breaks if Phase 4 is dropped.

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Hook-order regression reintroduces the blank PDP | All new hooks go above the early returns; preserve the comment at lines 57-61; cold-load every PDP route in validation |
| Family heuristic misfires and hides good results | Cap the exclusion at same-category candidates; validate by eye on 20 sampled products before shipping; keep the raw scorer inspectable via the `reason` field |
| Tailwind does not emit a grid class | Use only class strings that already appear literally in the repo |
| Card click and Quick Add both firing | `e.stopPropagation()` on the quick-add button, as in `PLPGrid.tsx:120-123` |
| Recommendations change between renders | Seed the rotation from the product id; never `Math.random()` |
| Thin categories cannot fill a row | Step 4 of the cascade allows cross-category fill |
| `src/config/shop.ts` must not be edited | Reuse the literal class string above; do not add a config key. `shop.ts` ends with `} as const;` and is deeply readonly-typed |
| Type-string hygiene in source data | `Rings` (2) versus `Finger Ring` (12) and `Facewash` versus `Face Wash` produce different slugs; `Handbag` + `Handbags, Wallets and Cases` + `Handbag and Wallet Accessories` is one family across 3 labels; `RED` (a colour) and `Stock Clearance` (a tag) sit in the `Type` column; 6 bags have a blank `Type`. Do not attempt to merge slugs here — that would change indexed type URLs. Handle inside the recommender as a type-alias map, leaving slugs untouched |

## Files to Touch

| File | Action |
|---|---|
| `src/utils/recommendations.ts` | **Create** — scorer, cascade, rotation, family inference |
| `src/pages/ProductPage.tsx` | Replace the related-products selector; add 2 `useState` hooks; move the block full-width; rebuild the cards |
| `src/server/seo.ts`, `api/index.ts` | Optional, Phase 4 only |

`src/types.ts` is deliberately **not** in this list — see Phase 0.

## Files NOT to Touch

- `src/config/shop.ts` — do not modify without explicit permission (AGENTS.md). Never `git checkout` / `git restore` it.
- `src/components/ProductGrid.tsx` — dead code, but deleting it is a separate cleanup.
- `src/utils/collections.ts`, `src/hooks/useFilteredProducts.ts`, `src/components/AiChatPage.tsx` — the three pre-existing bugs are a separate plan.
- `.env`, `.env.local` — never commit.

## Validation

There is no test runner in this repo (`npm run lint` is `tsc --noEmit`; there is no ESLint and no CI). Validation is manual plus typecheck. Playwright is available in `node_modules` and was used to verify previous fixes.

1. `npm run lint` clean, and `npm run build` clean. Note from Phase 0: lint does **not** catch bad property names in `ProductPage.tsx`, so this confirms nothing about the new scorer's property access. Read the diff.
2. **Manual relevance review:** open a crossbody bag, a tote, a pair of earrings, a necklace, a toy, and a skincare item. For each, confirm the recommendations are the same type and that none is the viewed product in another colour. This is the gate — do not ship on typecheck alone.
3. **Rotation check:** open two different crossbody bags and confirm the two rows differ. Open the same one twice and confirm the row is identical.
4. **Cold-load sweep:** load every PDP route directly (both `/product/:slug/:typeSlug/:productId` and `/product/:slug/:productId`) and assert a non-empty `#root` and zero React console errors. Direct load is the path that previously blanked the page.
5. **Layout check** at 390px and 1280px: section is full-width, cards are not clipped, nothing overlaps the fixed header, and the grid does not collide with the `pb-24` container padding.
6. **Interaction check:** card click navigates to the right PDP; Quick Add adds to cart without navigating; the badge resets after 1500 ms.
7. Confirm the four items shown in the DOM match the four rendered.

## Future Work (not this plan)

Genuine personalisation requires building the data layer first, none of which exists today:

- A visitor identity — first-party cookie or surfaced GA client id. There is none.
- Event capture — `gtag('event')` for `product_view`, `add_to_cart`, `search`, and filter changes. Zero events fire today.
- A server-side event store and a co-occurrence model ("viewed X, then viewed Y"). This implies a new endpoint and a datastore, which the current stateless serverless setup does not have.
- Order history — HubSpot contact/deal records are created at checkout (`src/server/hubspot.ts:101-181`) but the response is discarded client-side and is not readable from the storefront.

Until those exist, the recommender is correctly described as relevance-based, not personalised.

The highest-leverage content fix, outside code: the `Product description` column is **empty in all 311 rows**, so `description` is a mirror of `name` for every product and text-based similarity degrades to name matching. Populating it would materially improve scoring. The `Colors` and `Sizes` columns are likewise present but entirely empty; filling them would replace the family heuristic with real variant data.
