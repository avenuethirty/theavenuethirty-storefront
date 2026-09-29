import { Product } from "../types";
import { SHOP_CONFIG } from "../config/shop";

export function getCollectionBySlug(slug: string) {
  return SHOP_CONFIG.collections.find((c) => c.slug === slug) || null;
}

export function matchCollection(products: Product[], match: {
  collection?: string;
  category?: string;
  type?: string;
  minDiscountPct?: number;
  priceMin?: number;
  priceMax?: number;
  ratingMin?: number;
}) {
  return products.filter((p) => {
    if (match.collection && !p.collections?.some((c) => c.toLowerCase() === match.collection!.toLowerCase())) {
      return false;
    }
    if (match.category && p.category !== match.category) {
      return false;
    }
    if (match.type && p.typeSlug !== match.type) {
      return false;
    }
    if (match.minDiscountPct !== undefined) {
      if (!p.originalPrice || p.originalPrice <= p.priceMonthly) return false;
      const pct = ((p.originalPrice - p.priceMonthly) / p.originalPrice) * 100;
      if (pct < match.minDiscountPct) return false;
    }
    if (match.priceMin !== undefined && p.priceMonthly < match.priceMin) {
      return false;
    }
    if (match.priceMax !== undefined && p.priceMonthly > match.priceMax) {
      return false;
    }
        return true;
  });
}
