import { Product } from "../types";

export type SortValue = "recommended" | "price-asc" | "price-desc" | "discount" | "newest";

export interface FilterParams {
  sort?: string;
  priceMax?: string;
  ratingMin?: string;
}

export interface FilterState {
  sort: SortValue;
  priceMax: number | null;
  ratingMin: number | null;
}

export function parseFilterParams(searchParams: URLSearchParams): FilterState {
  const sortParam = searchParams.get("sort") || "";
  const validSorts: SortValue[] = ["recommended", "price-asc", "price-desc", "discount", "newest"];
  const sort = validSorts.includes(sortParam as SortValue)
    ? (sortParam as SortValue)
    : "recommended";

  const priceMaxParam = searchParams.get("priceMax");
  const priceMax = priceMaxParam ? Number(priceMaxParam) : null;
  if (isNaN(priceMax as number)) {
    return { sort, priceMax: null, ratingMin: null };
  }

  const ratingMinParam = searchParams.get("ratingMin");
  const ratingMin = ratingMinParam ? Number(ratingMinParam) : null;
  if (isNaN(ratingMin as number)) {
    return { sort, priceMax, ratingMin: null };
  }

  return { sort, priceMax, ratingMin };
}

export function useFilteredProducts(products: Product[], params: FilterState) {
  const { sort, priceMax, ratingMin } = params;

  const filtered = products.filter((p) => {
    if (priceMax !== null && typeof priceMax === "number" && p.priceMonthly > priceMax) {
      return false;
    }
        return true;
  });

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
