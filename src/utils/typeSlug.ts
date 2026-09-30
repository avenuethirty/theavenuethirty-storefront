export function toTypeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Longest slug we are willing to invent from a product name. Applied to
// computed slugs only — a `Slug` cell in the sheet is frozen, so truncating it
// would serve a URL that disagrees with the value the operator typed.
export const MAX_SLUG_LENGTH = 60;

export interface SlugNormaliseOptions {
  // null disables the length cap entirely (used for sheet-supplied slugs).
  maxLength?: number | null;
}

// Normalisation for product slugs. Deliberately layered on top of
// toTypeSlug() rather than reimplementing it, so a type slug and a product slug
// can never drift apart: the diacritic strip and the `&` -> `and` mapping run
// first, then the shared lowercase/collapse/trim pass, then the length cap.
//
// Stopwords are intentionally NOT removed. A slug that drops `for`/`with`/`the`
// can no longer be recomputed from the name, so the sheet-to-URL mapping stops
// being verifiable, and the length saving is negligible.
export function normaliseProductSlug(
  raw: string,
  options: SlugNormaliseOptions = {}
): string {
  if (!raw) return "";
  const { maxLength = MAX_SLUG_LENGTH } = options;

  const deaccented = raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    // `&` becomes a word rather than disappearing, so "Salt & Pepper" and
    // "Salt and Pepper" cannot collapse onto the same URL.
    .replace(/&/g, " and ");

  const slug = toTypeSlug(deaccented);
  if (!slug) return "";
  if (maxLength === null || slug.length <= maxLength) return slug;

  // Truncate at a word boundary, never mid-word.
  const cut = slug.slice(0, maxLength);
  const lastHyphen = cut.lastIndexOf("-");
  const base = lastHyphen > maxLength * 0.6 ? cut.slice(0, lastHyphen) : cut;
  return base.replace(/-+$/g, "");
}

// Fallback slug for a row whose `Slug` cell is blank. Returns "" when neither
// the name nor the id yields anything, so the caller can decide what to do.
export function computeSlugFromName(
  name: string,
  id: string,
  options: SlugNormaliseOptions = {}
): string {
  return normaliseProductSlug(name, options) || normaliseProductSlug(id, options);
}

// Display label for a raw sheet tagline. Mixed-case values ("Necklace Sets")
// are kept verbatim; all-caps / all-lowercase values ("MATHA PATI", "chains")
// are title-cased so pills, h1s, and chips read consistently.
export function formatTypeLabel(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  const isPlainCase =
    trimmed === trimmed.toLowerCase() || trimmed === trimmed.toUpperCase();
  if (!isPlainCase) return trimmed;
  return trimmed
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
