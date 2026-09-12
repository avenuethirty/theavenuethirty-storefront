import React from "react";
import { useSearchParams } from "react-router-dom";
import { X, Filter } from "lucide-react";
import { SHOP_CONFIG } from "../config/shop";

const { plp } = SHOP_CONFIG;

const SORT_LABELS: Record<string, string> = {
  recommended: "Recommended",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  newest: "Newest",
};

const PRICE_LABELS: Record<number, string> = {
  100: "Under Rs. 100",
  500: "Under Rs. 500",
  1000: "Under Rs. 1,000",
  2000: "Under Rs. 2,000",
  5000: "Under Rs. 5,000",
};

const RATING_LABELS: Record<number, string> = {
  4: "4+ Stars",
  3: "3+ Stars",
  2: "2+ Stars",
  1: "1+ Star",
};

interface FilterBarProps {
  totalProducts: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({ totalProducts }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentSort = searchParams.get("sort") || plp.defaultSort;
  const currentPriceMax = searchParams.get("priceMax") || "";
  const currentRatingMin = searchParams.get("ratingMin") || "";

  const activeFilters = [
    ...(currentSort && currentSort !== "recommended"
      ? [{ key: "sort", value: SORT_LABELS[currentSort] || currentSort }]
      : []),
    ...(currentPriceMax
      ? [{
          key: "priceMax",
          value:
            PRICE_LABELS[Number(currentPriceMax)] ||
            `Under Rs. ${Number(currentPriceMax).toLocaleString()}`,
        }]
      : []),
    ...(currentRatingMin
      ? [{
          key: "ratingMin",
          value:
            RATING_LABELS[Number(currentRatingMin)] ||
            `${Number(currentRatingMin)}+ Stars`,
        }]
      : []),
  ];

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams, { replace: true });
  };

  const removeFilter = (key: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete(key);
    setSearchParams(newParams, { replace: true });
  };

  const clearAll = () => {
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <span className="text-sm text-[#1A1A1A]/70 font-sans">
          {totalProducts} Products
        </span>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#1A1A1A]/70" />
            <label className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/60 font-sans">
              Sort:
            </label>
            <select
              value={currentSort}
              onChange={(e) => updateParam("sort", e.target.value)}
              className="text-xs font-sans text-[#1A1A1A] bg-white border border-[#1A1A1A]/10 rounded-xl px-3 py-1.5 hover:border-[#1A1A1A]/30 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]/20"
            >
              {plp.sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/60 font-sans">
              Price:
            </label>
            <select
              value={currentPriceMax}
              onChange={(e) => updateParam("priceMax", e.target.value)}
              className="text-xs font-sans text-[#1A1A1A] bg-white border border-[#1A1A1A]/10 rounded-xl px-3 py-1.5 hover:border-[#1A1A1A]/30 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]/20"
            >
              <option value="">All Prices</option>
              {plp.filters.priceRangeSteps.map((step) => (
                <option key={step} value={step}>
                  {PRICE_LABELS[step]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/60 font-sans">
              Rating:
            </label>
            <select
              value={currentRatingMin}
              onChange={(e) => updateParam("ratingMin", e.target.value)}
              className="text-xs font-sans text-[#1A1A1A] bg-white border border-[#1A1A1A]/10 rounded-xl px-3 py-1.5 hover:border-[#1A1A1A]/30 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]/20"
            >
              <option value="">All Ratings</option>
              {plp.filters.ratingOptions.map((rating) => (
                <option key={rating} value={rating}>
                  {RATING_LABELS[rating]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {activeFilters.map((filter) => (
            <div
              key={filter.key}
              className="inline-flex items-center gap-1.5 text-xs font-sans text-[#1A1A1A] bg-[#EFEFEF] rounded-full px-3 py-1"
            >
              <span>{filter.value}</span>
              <button
                type="button"
                onClick={() => removeFilter(filter.key)}
                className="hover:text-[#1A1A1A]/50 transition-colors"
                aria-label={`Remove ${filter.key} filter`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-sans text-[#1A1A1A]/70 hover:text-[#1A1A1A] underline transition-colors cursor-pointer"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};
