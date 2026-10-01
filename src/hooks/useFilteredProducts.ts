import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Product } from "../types";
import {
  FILTER_GROUPS,
  FilterGroupDef,
  FilterSurface,
  PRICE_STEPS,
} from "../config/filters";

export type SortValue = "recommended" | "price-asc" | "price-desc" | "discount" | "newest";

/**
 * Does this surface render the group? Mirrors the default in
 * `resolveFilterGroups`, so validation and rendering can never disagree about
 * which groups exist.
 */
export function surfaceIncludes(def: FilterGroupDef, surface: FilterSurface): boolean {
  const surfaces: FilterSurface[] = def.surfaces ?? ["plp", "collection"];
  return surfaces.includes(surface);
}

/**
 * The sort whitelist lives here rather than in the registry because sort is not
 * a filter dimension — it has no product attribute, no facet counts and no
 * visibility rule. `SHOP_CONFIG.plp.sortOptions` is the label source; this is
 * the authority on which values the URL parser will accept.
 */
const VALID_SORTS: SortValue[] = ["recommended", "price-asc", "price-desc", "discount", "newest"];

/**
 * A hand-edited or crawled URL can carry an arbitrarily long comma list. This
 * ceiling keeps one param from turning a filter click into a 3000-term scan.
 * Well past any real selection (Bags alone has 7 brands).
 */
const MAX_VALUES_PER_PARAM = 24;

/** Longer than any real facet value; a runaway param is dropped, not truncated. */
const MAX_VALUE_LENGTH = 120;

/**
 * The URL delimiter for a multi-value param.
 *
 * `serializeGroupValue()` joins a selection with `,`, so this is its exact
 * inverse and the two must stay in step.
 *
 * It is deliberately NOT the group's `split`. `split` answers "how does ONE
 * SHEET CELL hold several values" (`"Red;Black"`) — a data-shape question. The
 * delimiter answers "how does ONE QUERY PARAM hold several values" — an
 * encoding question. Reading the encoding off the data shape meant every `set`
 * group with no `split` — type, brand, collection — discarded its second and
 * later values: the comma list survived parsing as one literal string
 * (`"tote-bag,crossbody-bag"`), failed the `allowedValues` check, and was then
 * stripped from the URL by `healSearchParams`. The drawer showed no selection at
 * all, which read to the user as radio behaviour.
 *
 * INVARIANT: a registered `split` must also match this delimiter. All three
 * registered regexes are `/[;,]/`, which do. `split` is still what normalises a
 * product CELL in `readFacetValues()` and `buildSetOptions()` — untouched here.
 *
 * Applying it to `range` groups too is what `healSearchParams` already claimed
 * to do: a hand-written `?priceMax=5000,1000` is now healed to the tightest
 * bucket (1,000) instead of parsing to nothing and silently disabling the price
 * filter.
 */
const URL_VALUE_DELIMITER = /,/;

export interface FilterParams {
  sort?: string;
  priceMax?: string;
}

/**
 * Filter state is a record keyed by the registry group's `param`, NOT a fixed
 * set of named fields. Adding a dimension to `FILTER_GROUPS` therefore needs no
 * edit here: the parser, the matcher and the URL codec all walk the registry.
 */
export interface FilterState {
  sort: SortValue;
  /** `param` -> selected values. Absent param means "not filtered". */
  filters: Record<string, string[]>;
  /**
   * Convenience mirror of `filters.priceMax`, kept because the price facet is
   * the one numeric selection in the UI. Derived, never authoritative.
   */
  priceMax: number | null;
  /** Number of selected facet values across all groups. Sort does not count. */
  activeCount: number;
}

/** Registry lookup by the query param a group owns. */
export const GROUP_BY_PARAM: Map<string, FilterGroupDef> = new Map(
  FILTER_GROUPS.map((group) => [group.param ?? group.key, group]),
);

/**
 * Normalise one raw cell into comparable values. Mirrors the private
 * `readValues()` in `config/filters.ts`: a cell is either an array, a packed
 * string, or absent. The split regex comes from the group definition, so a
 * multi-valued column and its URL param decode identically.
 */
function readFacetValues(raw: unknown, split?: RegExp): string[] {
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
 * The values a `set` group can actually match in the given scope: every value
 * carried by at least one in-scope product for the group's own attribute.
 *
 * Built from the SCOPED CATALOGUE, never from the filtered set. A selected
 * value is excluded from its own facet's counts by design (see
 * `matchesFilterFacets`), so validating against counts would delete exactly the
 * values the operator picked, and a zero-count option — deliberately kept
 * visible-but-disabled — would delete a legitimate selection too.
 *
 * Built with `readFacetValues()`, the same cell normalisation
 * `matchesFilterFacets()` matches with and `buildSetOptions()` counts with, so
 * "the URL may select this", "the matcher accepts this" and "the drawer offers
 * this" decode a cell identically and can never disagree.
 */
function allowedValuesFor(
  def: FilterGroupDef,
  products: Array<Record<string, any>>,
): ReadonlySet<string> {
  const allowed = new Set<string>();
  for (const product of products) {
    for (const value of readFacetValues(product?.[def.attribute], def.split)) {
      allowed.add(value);
    }
  }
  return allowed;
}

/**
 * Read and validate one registry-owned query param.
 *
 * Validation is registry-driven, not `isNaN`-driven:
 *   - the param must belong to a group, so `?nonsense=1` is ignored;
 *   - a `range` value must be one of the registry's own `PRICE_STEPS`, so
 *     `?priceMax=999999` — which the old `Number()` check happily accepted and
 *     which silently disables the price filter — is dropped;
 *   - values are trimmed, de-duplicated, length-capped and count-capped;
 *   - a `set` value must exist in `allowedValues`, so `?type=does-not-exist`
 *     and `?sizes=m` are dropped instead of narrowing the grid to nothing.
 *
 * `allowedValues` is optional so the function stays usable as a pure reader;
 * `parseFilterParams` always supplies it, and the range branch ignores it
 * entirely because a bucket is defined by `PRICE_STEPS`, not by the data.
 *
 * A `range` group keeps only its lowest valid step, because the buckets are
 * cumulative: "Under Rs. 500" and "Under Rs. 1,000" together can only mean the
 * tighter one.
 *
 * EVERY occurrence is read, not just the first. `URLSearchParams.get()` returns
 * the first match only, which made the cumulative rule above depend on the
 * order the operator (or a crawler) happened to type the params in:
 * `?priceMax=1000&priceMax=5000` meant 1,000 while `?priceMax=5000&priceMax=1000`
 * meant 5,000. `getAll()` plus a union makes both orderings resolve to the same
 * tightest bucket, which is what the rule says and what a user re-ordering a
 * copied URL expects. Duplicated `set` params are the same hazard with the
 * opposite failure mode: the second value used to be dropped silently.
 *
 * A single occurrence is also split on the delimiter the encoder joins with, so
 * both forms the encoder can produce — `?type=a,b` and `?type=a&type=b` —
 * decode to the same selection.
 */
export function readGroupSelection(
  searchParams: URLSearchParams,
  def: FilterGroupDef,
  allowedValues?: ReadonlySet<string>,
): string[] {
  const occurrences = searchParams.getAll(def.param ?? def.key);
  if (occurrences.length === 0) return [];

  const parts = occurrences
    // A registered `split` already matches the delimiter (see the invariant on
    // `URL_VALUE_DELIMITER`); without one, the comma the encoder wrote is the
    // only separator, so the param has to be decoded here or a multi-value
    // selection comes back as one bogus value and is discarded.
    .flatMap((raw) => raw.split(def.split ?? URL_VALUE_DELIMITER))
    .map((value) => value.trim())
    .filter((value) => value.length > 0 && value.length <= MAX_VALUE_LENGTH);

  const unique = Array.from(new Set(parts)).slice(0, MAX_VALUES_PER_PARAM);

  if (def.compare === "range") {
    const steps = unique
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && PRICE_STEPS.includes(value));
    return steps.length > 0 ? [String(Math.min(...steps))] : [];
  }

  if (!allowedValues) return unique;
  return unique.filter((value) => allowedValues.has(value));
}

/**
 * Encode a group's values back into its query param. Empty means "no param".
 *
 * The `,` below is the write half of `URL_VALUE_DELIMITER`, which the read half
 * in `readGroupSelection()` must mirror. They are documented separately but
 * coupled on purpose: when the two disagreed, every `set` group without a
 * `split` lost its second value.
 */
export function serializeGroupValue(def: FilterGroupDef, values: string[]): string {
  return def.compare === "range" ? (values[0] ?? "") : values.join(",");
}

/**
 * Parse the URL into filter state.
 *
 * Every known key is validated against the registry AND against the products in
 * scope, and invalid values are dropped rather than trusted, so a hand-typed
 * or stale URL cannot put the grid into a state the UI has no control for.
 *
 * `products` is REQUIRED, not optional. Without it a `set` value cannot be
 * checked against anything, which is exactly the hole that let
 * `/product/bags?type=does-not-exist` render a confident 0-result dead end.
 * Pass the page's own scoped, pre-query-filter set — the same array the modal
 * resolves its groups from — so the parser and the UI can never disagree about
 * which values exist.
 *
 * Dropped values are dropped HERE rather than at the render boundary, so every
 * consumer (grid, badge, pills, facet counts) sees one already-valid state and
 * a value the parser rejected cannot count toward the badge or invent a pill.
 */
export function parseFilterParams(
  searchParams: URLSearchParams,
  products: Product[],
  surface: FilterSurface = "plp",
): FilterState {
  const sortParam = searchParams.get("sort") || "";
  const sort = VALID_SORTS.includes(sortParam as SortValue)
    ? (sortParam as SortValue)
    : "recommended";

  const filters: Record<string, string[]> = {};
  let activeCount = 0;

  for (const def of FILTER_GROUPS) {
    // A group the surface does not render cannot be selected from the UI, so a
    // value for it in the URL is unreachable state. Honouring it would show a
    // badge and a pill for a filter with no visible control — on a collection
    // page, `?collection=Must-Have+Styles` is a real tag on the products but
    // the Collection facet is `surfaces: ["plp"]`, so the operator could never
    // clear it except by hand-editing the URL.
    if (!surfaceIncludes(def, surface)) continue;

    const allowed =
      def.compare === "range" ? undefined : allowedValuesFor(def, products);
    const values = readGroupSelection(searchParams, def, allowed);
    if (values.length === 0) continue;
    filters[def.param ?? def.key] = values;
    activeCount += values.length;
  }

  const priceValues = filters.priceMax ?? [];

  return {
    sort,
    filters,
    priceMax: priceValues.length > 0 ? Number(priceValues[0]) : null,
    activeCount,
  };
}

/**
 * Rewrite the URL so every registry-owned param carries exactly the values the
 * parser kept, and return `null` when the URL is already canonical.
 *
 * `null` is the caller's "nothing to do" signal, so no caller has to compare
 * param strings by hand. This is the same contract `PLPGrid` uses for `page`:
 * drop the stale value, `replace: true`, and let the address bar match what the
 * grid is actually showing.
 */
export function healSearchParams(
  searchParams: URLSearchParams,
  state: FilterState,
): URLSearchParams | null {
  let changed = false;
  const next = new URLSearchParams(searchParams);

  for (const def of FILTER_GROUPS) {
    const param = def.param ?? def.key;
    // Count occurrences, not the first value: a param written twice
    // (`?priceMax=1000&priceMax=5000`) parses to ONE selection, so the URL
    // holding two is not canonical even when the first one happens to be the
    // one the parser kept. `set` collapses them to a single occurrence and
    // `delete` removes them all.
    const occurrences = searchParams.getAll(param);
    if (occurrences.length === 0) continue;

    const kept = state.filters[param] ?? [];
    // Canonical encoding, which also normalises a non-canonical but legal URL
    // such as `?priceMax=5000,1000` down to the single step the parser kept.
    const canonical = kept.length > 0 ? serializeGroupValue(def, kept) : "";
    if (occurrences.length === 1 && occurrences[0] === canonical) continue;

    if (canonical) next.set(param, canonical);
    else next.delete(param);
    changed = true;
  }

  return changed ? next : null;
}

/**
 * Parse the URL into filter state and self-heal it when a value does not exist
 * in the current scope.
 *
 * `ready` is a guard, not an optimisation. A cold catalogue is an empty array,
 * and healing against it would strip a legitimate deep link
 * (`/product/bags?type=crossbody-bag`) before the products arrive — and never
 * restore it, because the URL rewrite is what the grid is then reading. Callers
 * that hold a loading flag must pass it.
 */
export function useFilterParams(
  products: Product[],
  ready = true,
  surface: FilterSurface = "plp",
): FilterState {
  const [searchParams, setSearchParams] = useSearchParams();

  const state = useMemo(
    () => parseFilterParams(searchParams, products, surface),
    [searchParams, products, surface],
  );

  const healed = useMemo(() => {
    const next = ready ? healSearchParams(searchParams, state) : null;
    // Pagination is invalidated by a filter change, same rule as the modal's
    // applyFilters. Reached only when a param was actually rewritten.
    next?.delete("page");
    return next;
  }, [ready, searchParams, state]);

  useEffect(() => {
    if (!healed) return;
    setSearchParams(healed, { replace: true });
  }, [healed, setSearchParams]);

  return state;
}

/**
 * Does one product satisfy the selected facets?
 *
 * OR inside a group (any one selected value is enough), AND across groups.
 * `exceptParam` skips one group entirely: the standard facet-count rule. The
 * counts shown for a group must not be narrowed by that group's own selection,
 * or a selected option's count collapses to just its own value and the user
 * cannot see how many rows unselecting would return.
 */
export function matchesFilterFacets(
  product: Product,
  filters: Record<string, string[]>,
  exceptParam?: string,
): boolean {
  const row = product as unknown as Record<string, unknown>;

  for (const def of FILTER_GROUPS) {
    const param = def.param ?? def.key;
    if (param === exceptParam) continue;

    const selected = filters[param];
    if (!selected || selected.length === 0) continue;

    if (def.compare === "range") {
      const ceiling = Math.min(...selected.map(Number).filter(Number.isFinite));
      const price = Number(row[def.attribute]);
      // Unchanged from the pre-registry comparison: a row with an unusable
      // price is not excluded (`NaN > x` is false).
      if (Number.isFinite(ceiling) && price > ceiling) return false;
      continue;
    }

    const chosen = new Set(selected);
    if (!readFacetValues(row[def.attribute], def.split).some((value) => chosen.has(value))) {
      return false;
    }
  }

  return true;
}

/** Narrow a product set by every active facet except one. */
export function applyFacetFilters(
  products: Product[],
  filters: Record<string, string[]>,
  exceptParam?: string,
): Product[] {
  return products.filter((product) => matchesFilterFacets(product, filters, exceptParam));
}

export function useFilteredProducts(products: Product[], params: FilterState) {
  const { sort, filters } = params;

  const filtered = applyFacetFilters(products, filters);

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case "price-asc":
        return a.priceMonthly - b.priceMonthly;
      case "price-desc":
        return b.priceMonthly - a.priceMonthly;
      case "discount": {
        const aDiscount =
          a.originalPrice && a.originalPrice > a.priceMonthly
            ? (a.originalPrice - a.priceMonthly) / a.originalPrice
            : 0;
        const bDiscount =
          b.originalPrice && b.originalPrice > b.priceMonthly
            ? (b.originalPrice - b.priceMonthly) / b.originalPrice
            : 0;
        return bDiscount - aDiscount;
      }
      case "newest":
      case "recommended":
      default:
        return 0;
    }
  });

  return { filtered: sorted, total: filtered.length };
}
