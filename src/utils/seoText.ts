import { SHOP_CONFIG } from "../config/shop";

export const SITE_NAME = SHOP_CONFIG.name;
export const DEFAULT_SITE_TITLE = `${SITE_NAME} | Curated Fashion & Skincare`;

// Typographic dashes are banned in every head tag, Open Graph tag, and JSON-LD
// string this site emits. `pageTitle`/`sanitizeSeoText` normalize them to a
// plain hyphen so no code path — including text pulled from the product sheet —
// can leak one into a rendered document.
const BANNED_DASHES = /[\u2014\u2013\u2012\u2015\u2212\u2011\u00AD\uFE63\uFF0D]/g;

export function sanitizeSeoText(value: string): string {
  if (!value) return value;
  // Only the banned characters are rewritten. Existing ASCII hyphens are left
  // alone so titles like "Must-Have Styles" survive untouched.
  return value.replace(BANNED_DASHES, "-").replace(/[ \t]{2,}/g, " ").trim();
}

export function pageTitle(...parts: Array<string | undefined | null>): string {
  const kept = parts.filter((part): part is string => !!part && part.trim().length > 0);
  return sanitizeSeoText(kept.join(" | "));
}
