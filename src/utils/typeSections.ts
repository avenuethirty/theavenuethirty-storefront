/**
 * Type derivation — one pure function behind every "shop by type" surface.
 *
 * Extracted verbatim from the derivation that used to live inline inside
 * `TypeSection`, so the homepage section and the new PLP pill row cannot drift
 * apart: they call the same function with the same arguments.
 *
 * ---------------------------------------------------------------------------
 * WHY THE CONFIG IS A PARAMETER AND NOT AN IMPORT
 * ---------------------------------------------------------------------------
 *
 * `src/config/filters.ts` is the precedent: it is a declarative registry that
 * says *which* dimensions exist while every value, label and count is derived at
 * runtime from whatever rows are in scope. This module is the same idea applied
 * to types, so it follows the same rule — it never reads `SHOP_CONFIG` itself.
 *
 * The reason is coverage. `typeSections` only has entries for `bags`,
 * `jewellery` and `toys`, so a module that looked the config up for itself
 * could only ever serve three categories; `skincare`, `premium`, `accessories`
 * and anything the sheet adds later would silently get no type row at all. The
 * caller passes the config when one exists and omits it when none does, and the
 * fallback path derives every type in the category from the products alone.
 * That is what lets the PLP show pills for every category without a single edit
 * to `src/config/shop.ts`, which is user-owned.
 *
 * `ensureSlug` obeys the same discipline for the same reason. `limit` is a
 * merchandising statement about how many cards the homepage teases ("Find your
 * bag" gets six), not a statement about how a visitor navigates: a capped row
 * that omits the type you are standing on tells the visitor the current scope is
 * not in the list and leaves no pill to move on from. The caller therefore names
 * the type it needs present and this function guarantees it. That is a fact
 * about the current request, not about the shop, so it arrives as an argument
 * rather than being read out of the config — `TypeSection` omits it and the
 * homepage keeps exactly the curated six and eight it has always shown.
 *
 * The config shape is declared structurally below rather than imported as a
 * `TypeSectionConfig` from `src/config/shop.ts`. The two agree on every field
 * this function reads, so a caller can hand over the real config entry
 * untouched, and this module keeps zero dependency on shop.ts — not even an
 * erased-at-compile-time type import.
 *
 * ---------------------------------------------------------------------------
 * DERIVATION RULES (unchanged from the original inline implementation)
 * ---------------------------------------------------------------------------
 *
 * 1. Products outside `category` are ignored, as are products with a blank
 *    tagline: the tagline IS the type, so no tagline means no type.
 * 2. The type key is the sheet's own `typeSlug` when present, otherwise the
 *    tagline slugified — the same key the PDP and the router resolve against,
 *    so a pill link lands on the route the operator's URL actually uses.
 * 3. Label is the config override when there is one, else the sheet tagline
 *    formatted for display. Image is the config override, else the type's
 *    first product image (pills ignore it; the cards format uses it).
 * 4. Order is config-pinned first (`order` ascending) and count-descending for
 *    the rest, then truncated to `limit` (default 8).
 * 5. `ensureSlug`, when given, is appended after that truncation — through the
 *    same mapping as every other entry, so a config `label` override still
 *    applies — and only if the catalogue actually has that type.
 */

import type { Product } from "../types";
import { formatTypeLabel, toTypeSlug } from "./typeSlug";

/** A single type in the row, in the order it should be rendered. */
export interface TypeEntry {
  slug: string;
  label: string;
  count: number;
  image?: string;
}

/** Per-type overrides, keyed by type slug. Structural copy of the shape in
 *  `SHOP_CONFIG.typeSections[].types` — see the module docblock. */
export interface TypeEntryOverride {
  image?: string;
  label?: string;
  order?: number;
}

/** The only part of a `typeSections` config entry this module reads. */
export interface TypeSectionOptions {
  limit?: number;
  types?: Record<string, TypeEntryOverride>;
}

/** What the sheet says about a type, before labels and images are resolved. */
interface TypeDraft {
  label: string;
  count: number;
  image?: string;
}

/** Cap applied when no config supplies one. Mirrors the original default. */
const DEFAULT_LIMIT = 8;

/**
 * Derive one category's type row: slug, display label, product count and a
 * fallback image, ordered and truncated by `config` when one is supplied.
 * Returns `[]` when the category has no product with a tagline — callers render
 * nothing rather than an empty row.
 *
 * `ensureSlug` names a type the row must contain regardless of `limit`, for
 * callers rendering navigation inside a type's own scope. It is appended, not
 * substituted, so the configured order survives; and it is honoured only when it
 * resolves to a type the products really contain, so a stale or renamed slug
 * adds nothing instead of a link to an empty listing.
 */
export function buildTypeEntries(
  products: Product[],
  category: string,
  config?: TypeSectionOptions,
  ensureSlug?: string
): TypeEntry[] {
  // Group the category's products by type slug, collecting counts and the
  // first available product image per type as the fallback card image.
  const bySlug = new Map<string, TypeDraft>();

  for (const product of products) {
    if (product.category !== category) continue;
    const tagline = product.tagline?.trim();
    if (!tagline) continue;

    const slug = product.typeSlug || toTypeSlug(tagline);
    const entry =
      bySlug.get(slug) || { label: tagline, count: 0, image: undefined };
    if (!entry.image && product.imageUrl) entry.image = product.imageUrl;
    entry.count += 1;
    bySlug.set(slug, entry);
  }

  if (bySlug.size === 0) return [];

  // No config entry (the common case for the PLP) means no overrides at all,
  // which is exactly what every type already falls back to.
  const overrides = config?.types || {};

  // The one place an entry is shaped, so an appended one is indistinguishable
  // from the rest: same label override, same image resolution, same count.
  const toEntry = (slug: string, draft: TypeDraft): TypeEntry => ({
    slug,
    label: overrides[slug]?.label || formatTypeLabel(draft.label),
    count: draft.count,
    // Config image wins; fall back to the type's first product image.
    image: overrides[slug]?.image || draft.image || "",
  });

  const entries: TypeEntry[] = Array.from(bySlug.entries()).map(([slug, draft]) =>
    toEntry(slug, draft)
  );

  // Pinned order first (by order asc), then count desc for the rest.
  const pinned = entries
    .filter((t) => overrides[t.slug]?.order !== undefined)
    .sort(
      (a, b) =>
        (overrides[a.slug]!.order ?? 0) - (overrides[b.slug]!.order ?? 0)
    );
  const rest = entries
    .filter((t) => overrides[t.slug]?.order === undefined)
    .sort((a, b) => b.count - a.count);

  const limited = [...pinned, ...rest].slice(0, config?.limit ?? DEFAULT_LIMIT);

  // A pill row that drops the type you are on fails at the one job it has here:
  // the row is how you move between types, and its absence makes the page say
  // "Backpack" above a row with no Backpack in it. Appending rather than
  // promoting keeps the merchandiser's curated head of the row intact.
  //
  // The test is against `bySlug` — the types the products really contain — not
  // against the config and not against what got rendered. A slug that was
  // renamed or dropped in the sheet resolves to nothing, and a pill linking to a
  // listing with no products on it is a worse defect than the truncation this
  // exists to repair, so that case deliberately appends nothing.
  if (!ensureSlug) return limited;
  if (limited.some((t) => t.slug === ensureSlug)) return limited;

  const draft = bySlug.get(ensureSlug);
  if (!draft) return limited;

  return [...limited, toEntry(ensureSlug, draft)];
}
