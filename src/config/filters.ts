/**
 * Filter & Sort — declarative group registry.
 *
 * ---------------------------------------------------------------------------
 * GROUPS ARE DECLARED HERE. VALUES ARE ALWAYS DERIVED AT RUNTIME.
 * ---------------------------------------------------------------------------
 *
 * This file answers exactly one question: *which filter dimensions exist?* It
 * never answers *which values exist?* Every option, every count, and the
 * visibility of the group itself is computed by `resolveFilterGroups()` from
 * whatever product rows are in scope at the moment the modal opens.
 *
 * THE REASON VISIBILITY MUST BE DATA-DERIVED
 *
 * The live product sheet has columns that are registered but effectively
 * empty: `Sizes` is 0 / 310 populated, and `Colors` is 1 / 310 populated. A
 * registry that hardcoded "this category gets a size filter" would render a
 * dead section — an empty accordion, or one option that every product
 * filters to zero results for. Neither is shippable, and neither can be
 * fixed by a code change: the data has to arrive first.
 *
 * So the `sizes` and `colors` groups below are registered exactly like any
 * other dimension, and the resolver drops them automatically the moment there
 * is nothing to show. The day an operator fills the `Sizes` column, the size
 * filter appears on the PLP with correct counts and zero code changes. The
 * registry does not need to know, care, or be told.
 *
 * THE CONSEQUENCE
 *
 * Adding a new filter dimension is a registry entry, not a data migration.
 * Add one object to `FILTER_GROUPS`, point `attribute` at the product field,
 * and the UI gains the group the first time the data supports it — and
 * quietly stays absent until then. There is no feature flag to remember to
 * switch on, and no list of categories to keep in sync with the sheet.
 *
 * ---------------------------------------------------------------------------
 * INVARIANTS
 * ---------------------------------------------------------------------------
 *
 * 1. A group renders IFF at least one in-scope product carries at least one
 *    distinct value for that group's `attribute`. No exceptions, no
 *    hardcoded category lists, no "always show price".
 * 2. Options with a count of 0 are NOT hidden. They are returned with
 *    `count: 0` and the UI layer renders them disabled — dropping them
 *    mid-interaction would make a selected value vanish while the operator is
 *    still changing another facet.
 * 3. `price` is the mandatory group. It is the only attribute that
 *    discriminates on every product, so it is the one group that can never be
 *    dropped, and it carries no `scopes` because it applies everywhere.
 *
 * PURE MODULE — no React, no imports from `src/config/shop.ts`, no side
 * effects. Importable from client components and from either server without
 * divergence.
 */

import { formatTypeLabel, toTypeSlug } from "../utils/typeSlug";

/** Where a filter set is being rendered. Governs `surfaces` membership. */
export type FilterSurface = "plp" | "collection";

/**
 * Narrowing already applied by the caller. A registry entry with `scopes`
 * narrower than this is filtered out; an entry with no `scopes` always passes.
 */
export interface FilterScope {
  category?: string;
  typeSlug?: string;
}

export interface FilterGroupDef {
  key: string;
  label: string;
  /** Field read off the product row. THE FACET VALUE lives here. */
  attribute: string;
  /**
   * Field the DISPLAY LABEL is read from, when `attribute` holds a derived
   * identifier rather than the operator's own text. The value stays
   * `attribute`; only the label is taken from here and passed through
   * `formatTypeLabel`, so the drawer reads exactly what the h1 and the
   * breadcrumbs read for the same thing. Data-driven by construction: a new
   * Type needs no registry edit, and no value ever reaches a slug-labelling
   * fallback because the two fields are populated together on every row.
   */
  labelFrom?: string;
  /** Regex to split a packed string cell into multiple values. */
  split?: RegExp;
  /** Restrict the group to specific scopes. Absent means "everywhere". */
  scopes?: FilterScope[];
  /** Explicit value -> label overrides, for values that are not self-labelling. */
  options?: Array<{ value: string; label: string }>;
  /** Drop the group when fewer than this many distinct values survive. */
  minDistinct?: number;
  /** Surfaces this group appears on. Defaults to `["plp", "collection"]`. */
  surfaces?: FilterSurface[];
  /** `set` = multi-select facets. `range` = cumulative price buckets. */
  compare?: "set" | "range";
  /** URL query param the group owns. */
  param?: string;
}

export interface FilterContext extends FilterScope {}

export interface ResolvedOption {
  value: string;
  label: string;
  count: number;
}

export interface ResolvedGroup {
  key: string;
  label: string;
  attribute: string;
  param: string;
  options: ResolvedOption[];
  total: number;
}

/**
 * Upper bounds for the cumulative price buckets.
 *
 * Each bucket counts rows where `priceMonthly <= step`, so the counts are
 * monotonically NON-DECREASING as the steps ascend. That is the point of an
 * "Under Rs. X" label: the wider the ceiling, the more products fall inside
 * it, so the sequence only ever grows.
 *
 * DO NOT "FIX" THIS TOWARD `>=`. Flipping the comparison to match a mental
 * model of decreasing counts would make the label "Under Rs. 100" describe
 * every product priced at 100 and above — the exact opposite of what the
 * label says, and wrong in the direction users notice immediately.
 * `buildRangeOptions()` is the single place this comparison lives; the
 * `Number.isFinite` guard there is deliberate, so rows without a usable price
 * are counted in no bucket at all.
 */
export const PRICE_STEPS = [100, 500, 1000, 2000, 5000];

/**
 * Display order here IS display order in the UI. Do not sort the resolved
 * output; `resolveFilterGroups()` preserves this order.
 */
export const FILTER_GROUPS: FilterGroupDef[] = [
  {
    key: "price",
    label: "Price",
    attribute: "priceMonthly",
    compare: "range",
    param: "priceMax",
    // No `scopes`: price is the one attribute that discriminates on every
    // product, so it is the mandatory group and must never be scoped out.
    minDistinct: 1,
  },
  {
    key: "type",
    label: "Product Type",
    // The VALUE is the slug, so the URL stays `/product/<cat>/<typeSlug>`.
    attribute: "typeSlug",
    // The LABEL is the sheet's `Type` cell. `formatTypeLabel(typeSlug)` cannot
    // recover it: it splits on whitespace only, so `tote-bag` came back as
    // "Tote-bag" and `handbag-set-3-pcs-bag-set` lost its comma entirely.
    labelFrom: "tagline",
    compare: "set",
    param: "type",
  },
  {
    key: "brand",
    label: "Brand",
    attribute: "brand",
    compare: "set",
    param: "brand",
  },
  {
    // Registered even though the sheet is effectively empty (1 / 310 cells
    // populated). It stays in the registry so the group auto-appears the day
    // the column is filled — no code change, no flag to flip.
    key: "colors",
    label: "Color",
    attribute: "colors",
    compare: "set",
    param: "colors",
    split: /[;,]/,
  },
  {
    // Same reasoning as `colors` — 0 / 310 cells populated today.
    key: "sizes",
    label: "Size",
    attribute: "sizes",
    compare: "set",
    param: "sizes",
    split: /[;,]/,
  },
  {
    key: "collection",
    label: "Collection",
    attribute: "collections",
    compare: "set",
    param: "collection",
    // Collections are a PLP-only concept; a curated collection page is
    // already a single collection and would render a one-option facet.
    surfaces: ["plp"],
  },
];

/**
 * A registry scope is a whitelist, not a blacklist. An entry that names only
 * `category` matches on category alone; only `typeSlug` on type alone; both
 * require both; neither matches everything.
 */
export function matchesScope(scope: FilterScope, ctx: FilterContext): boolean {
  if (scope.category !== undefined && scope.category !== ctx.category) return false;
  if (scope.typeSlug !== undefined && scope.typeSlug !== ctx.typeSlug) return false;
  return true;
}

/**
 * Normalise one raw cell into zero or more comparable values. Handles the
 * three shapes the sheet produces: a packed string, an already-split array,
 * or nothing at all.
 */
function readValues(raw: unknown, split?: RegExp): string[] {
  if (raw === null || raw === undefined) return [];

  if (Array.isArray(raw)) {
    return raw
      .filter((entry) => entry !== null && entry !== undefined)
      .map((entry) => String(entry).trim())
      .filter(Boolean);
  }

  const text = String(raw).trim();
  if (!text) return [];
  if (!split) return [text];

  return text
    .split(split)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * A value is "slug-shaped" when it round-trips through `toTypeSlug()`
 * unchanged — i.e. it is already canonical lowercase-hyphenated text such as
 * `cross-body-bags`. Such values are title-cased for display. Anything else
 * is a human-entered label ("Deep Burgundy") and is shown verbatim.
 *
 * This is for cells that ARE the display text (brand, color, size, collection)
 * and just happen to look like a slug. A group whose value is a slug *derived*
 * from the operator's text must declare `labelFrom` instead, so the label is
 * read from the source text rather than reverse-engineered from the slug.
 */
function looksLikeSlug(value: string): boolean {
  return value === toTypeSlug(value);
}

/**
 * `displaySource` is the operator's own text for `value`, read off the group's
 * `labelFrom` field by `buildSetOptions()`. When it is present it is the ONLY
 * label source: the slug never gets title-cased into "Tote-bag" as a fallback,
 * because the text that produced the slug is on the same row.
 */
function optionLabel(group: FilterGroupDef, value: string, displaySource?: string): string {
  const override = group.options?.find((entry) => entry.value === value);
  if (override) return override.label;
  if (displaySource) return formatTypeLabel(displaySource);
  return looksLikeSlug(value) ? formatTypeLabel(value) : value;
}

function buildSetOptions(
  group: FilterGroupDef,
  products: Array<Record<string, any>>,
): ResolvedOption[] {
  const counts = new Map<string, number>();
  // value -> the operator's own text for it, for groups whose value is a slug.
  // First row in scope wins: `Type` is a 1:1 partner of `typeSlug` in the sheet,
  // and for a hypothetical mismatch the majority reading of the facet is the
  // one the catalogue is already sorted into.
  const displaySources = group.labelFrom ? new Map<string, string>() : null;

  for (const product of products) {
    for (const value of readValues(product?.[group.attribute], group.split)) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
      if (displaySources && !displaySources.has(value)) {
        const source = readValues(product?.[group.labelFrom!])[0];
        if (source) displaySources.set(value, source);
      }
    }
  }

  const options: ResolvedOption[] = Array.from(counts, ([value, count]) => ({
    value,
    label: optionLabel(group, value, displaySources?.get(value)),
    count,
  }));

  // Most common first; label ascending is a stable, deterministic tie-break so
  // the same catalogue always renders the same order.
  options.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "en"));

  return options;
}

function buildRangeOptions(
  group: FilterGroupDef,
  products: Array<Record<string, any>>,
): ResolvedOption[] {
  return PRICE_STEPS.map((step) => {
    const count = products.reduce((total, product) => {
      const price = Number(product?.[group.attribute]);
      // NaN comparisons are false, so rows without a usable price are simply
      // not counted in any bucket.
      return Number.isFinite(price) && price <= step ? total + 1 : total;
    }, 0);

    return {
      value: String(step),
      label: `Under Rs. ${step.toLocaleString("en-PK")}`,
      count,
    };
  });
}

/**
 * Resolve the registry against real data.
 *
 * A group is returned only if at least one in-scope product carries at least
 * one distinct value for its attribute. Groups with nothing to show are
 * dropped entirely, so the UI never renders an empty section — and a group
 * whose attribute is currently empty in the sheet (see the header) drops
 * itself without anyone maintaining a list of "live" filters.
 */
export function resolveFilterGroups(
  products: Array<Record<string, any>>,
  ctx: FilterContext,
  surface: FilterSurface,
): ResolvedGroup[] {
  const rows = Array.isArray(products) ? products : [];
  const resolved: ResolvedGroup[] = [];

  for (const group of FILTER_GROUPS) {
    // 1. Surface gate. Absent `surfaces` means every surface.
    const surfaces: FilterSurface[] = group.surfaces ?? ["plp", "collection"];
    if (!surfaces.includes(surface)) continue;

    // 2. Scope gate. Absent `scopes` always passes.
    if (group.scopes && !group.scopes.some((scope) => matchesScope(scope, ctx))) continue;

    // 3. Build the option list from the data actually in scope.
    const options =
      group.compare === "range" ? buildRangeOptions(group, rows) : buildSetOptions(group, rows);

    // 4. The key behaviour: a group with nothing to offer is removed. `price`
    //    is unaffected because its cumulative buckets always survive.
    if (options.length < (group.minDistinct ?? 1)) continue;

    // 5. Preserve registry order — no sorting of the output.
    resolved.push({
      key: group.key,
      label: group.label,
      attribute: group.attribute,
      param: group.param ?? group.key,
      options,
      // A range group's `total` is how many rows were scanned; a set group's
      // is the sum of its option counts.
      total:
        group.compare === "range"
          ? rows.length
          : options.reduce((sum, option) => sum + option.count, 0),
    });
  }

  return resolved;
}
