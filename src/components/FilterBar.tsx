import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import { Product } from "../types";
import { FilterSurface } from "../config/filters";
import { parseFilterParams } from "../hooks/useFilteredProducts";

interface FilterBarProps {
  totalProducts: number;
  /**
   * The page's scoped product set, BEFORE query filters — the same array the
   * modal resolves its groups from.
   */
  products: Product[];
  /** Which facet set this page renders. Must match the modal's `surface`. */
  surface?: FilterSurface;
  /** Type crumb currently scoping the page. Links back to the category route. */
  typeLabel?: string;
  category?: string;
  /** Opens the Filter & Sort drawer. */
  onOpenFilters?: () => void;
}

/**
 * Trigger only. The sort/price `<select>`s, the active-filter chip row and
 * Clear All all moved into `FilterSortModal`, which owns every filter write to
 * the URL; this component reads the active count for the badge and nothing
 * else, so the two can never disagree about what is selected.
 *
 * The badge therefore needs `products` AND `surface`, not just the URL. A value
 * the parser dropped — a stale `?type=`, a `?sizes=` the sheet has no cell for,
 * or a `?collection=` on a collection page where that facet is not rendered — is
 * not an applied filter, so it must not sit in the badge either. It is parsed
 * here through the SAME call the modal makes, with the SAME products and the
 * SAME surface, so the count is the count rather than a second opinion.
 */
export const FilterBar: React.FC<FilterBarProps> = ({
  totalProducts,
  products,
  // Explicit annotation: with no @types/react the destructure loses its declared
  // prop types, so the literal default would widen to `string`.
  surface = "plp" as FilterSurface,
  typeLabel,
  category,
  onOpenFilters,
}) => {
  const [searchParams] = useSearchParams();
  const { activeCount } = parseFilterParams(searchParams, products, surface);

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#1A1A1A]/70 font-sans">
            {totalProducts} Products
          </span>

          {/* The category route is the way out of a type-scoped listing, so the
              crumb keeps its link now that the modal owns the removable type
              pill. */}
          {typeLabel && category && (
            <Link
              to={`/product/${category}`}
              className="text-xs font-sans text-[#1A1A1A]/60 hover:text-[#1A1A1A] uppercase tracking-widest transition-colors"
            >
              Shop by {typeLabel}
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => onOpenFilters?.()}
          className="inline-flex items-center gap-2 text-xs font-sans text-[#1A1A1A] bg-white border border-[#1A1A1A]/10 rounded-xl pl-3 pr-2 py-1.5 hover:border-[#1A1A1A]/30 transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#1A1A1A]/70" />
          <span className="uppercase tracking-widest text-[10px] font-semibold">
            Filter &amp; Sort
          </span>
          {activeCount > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#1A1A1A] text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
              {activeCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
