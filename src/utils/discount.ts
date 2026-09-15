import { Product } from "../types";

export function getDiscountBadge(product: Product): string | null {
  if (!product.originalPrice) return null;
  const saved = product.originalPrice - product.priceMonthly;
  if (saved < 1) return null;
  const pct = Math.round((saved / product.originalPrice) * 100);
  return pct >= 10 ? `-${pct}% off` : `-${Math.round(saved)} OFF`;
}
