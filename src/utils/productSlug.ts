// Slug resolution, lookup, and the one product-path builder.
//
// Pure functions only — no React, no SHOP_CONFIG — so `api/index.ts` can inline
// an equivalent copy (the Vercel serverless bundle cannot import from `src/`)
// without freezing any config into it.
//
// This module resolves slugs. It does not own route ordering or redirect
// policy; `resolveProductSegment` and `resolveProductRedirect` return a verdict
// and let the caller decide what HTTP status that verdict becomes.

import {
  MAX_SLUG_LENGTH,
  computeSlugFromName,
  normaliseProductSlug,
  toTypeSlug,
} from "./typeSlug";

export { MAX_SLUG_LENGTH, computeSlugFromName, normaliseProductSlug, toTypeSlug };

/** Minimum shape the slug helpers need. Kept structural so callers can pass
 *  the full `Product` or the looser `ProductLike` from src/server/seo.ts. */
export interface SlugProductLike {
  id: string;
  name: string;
  category: string;
  typeSlug?: string;
  slug?: string;
}

// ---------------------------------------------------------------------------
// Path builder
// ---------------------------------------------------------------------------

/**
 * The one and only product URL shape:
 *   `/product/:category[/:typeSlug]/:slug`
 *
 * 4 segments when the product has a type, 3 when it does not — the same split
 * the previous id-based builder used, so the 6 typeless bags keep their URL
 * depth. Falls back to `id` so a product that somehow arrives without a slug
 * (e.g. a cached catalogue response from before the slug column was parsed)
 * still links somewhere that resolves.
 */
export function productPath(product: SlugProductLike): string {
  const typeSegment = product.typeSlug ? `/${product.typeSlug}` : "";
  return `/product/${product.category}${typeSegment}/${product.slug || product.id}`;
}

/**
 * The two listing-route shapes, beside `productPath` for the same reason.
 *
 * The PLP's pill row links to types, and AGENTS.md's rule is that no route
 * assembles `/product/...` by hand — yet `typePath` used to live only in
 * `src/server/seo.ts`, which a client component cannot import without dragging
 * the whole server SEO module (and `SHOP_CONFIG` with it) into the browser
 * bundle. One definition here, re-exported by `seo.ts`, keeps the public SEO
 * surface unchanged and the copies in `server.ts` / `api/index.ts` in step.
 */
export function categoryPath(slug: string): string {
  return `/product/${slug}`;
}

export function typePath(slug: string, typeSlug: string): string {
  return `/product/${slug}/${typeSlug}`;
}

// ---------------------------------------------------------------------------
// Index
// ---------------------------------------------------------------------------

export interface SlugIndex<T extends SlugProductLike = SlugProductLike> {
  bySlug: Map<string, T>;
  byId: Map<string, T>;
  /** category slug -> the type slugs that actually exist inside it. */
  typesByCategory: Map<string, Set<string>>;
}

/**
 * Deterministic ordering for duplicate keys. Sheet row order is arbitrary and
 * changes on insert, so "first row wins" would silently reassign a slug; the
 * lowest numeric SKU wins instead, with a string compare as the final
 * tie-break so non-numeric ids are ordered too.
 *
 * Returns <0 when `a` should win, >0 when `b` should win. Single source of
 * truth for both the map writes and the collision report, so the "keeping
 * SKU N" line can never disagree with the map it describes.
 */
function compareCandidates(a: SlugProductLike, b: SlugProductLike): number {
  const aId = (a.id || "").trim();
  const bId = (b.id || "").trim();
  const aNum = /^\d+$/.test(aId) ? Number(aId) : Number.POSITIVE_INFINITY;
  const bNum = /^\d+$/.test(bId) ? Number(bId) : Number.POSITIVE_INFINITY;
  if (aNum !== bNum) return aNum - bNum;
  if (aId < bId) return -1;
  if (aId > bId) return 1;
  return 0;
}

function put<T extends SlugProductLike>(map: Map<string, T>, key: string, value: T): void {
  const existing = map.get(key);
  map.set(key, existing && compareCandidates(existing, value) <= 0 ? existing : value);
}

export function buildSlugIndex<T extends SlugProductLike>(products: T[]): SlugIndex<T> {
  const bySlug = new Map<string, T>();
  const byId = new Map<string, T>();
  const typesByCategory = new Map<string, Set<string>>();

  for (const product of products) {
    if (!product) continue;
    if (product.slug) put(bySlug, product.slug, product);
    if (product.id) put(byId, product.id, product);
    if (product.typeSlug && product.category) {
      let types = typesByCategory.get(product.category);
      if (!types) {
        types = new Set<string>();
        typesByCategory.set(product.category, types);
      }
      types.add(product.typeSlug);
    }
  }

  return { bySlug, byId, typesByCategory };
}

/** Convenience for callers that hold the whole array rather than an index.
 *  Used by the client, where a single PDP lookup does not justify an index. */
export function findProductByRef<T extends SlugProductLike>(
  products: T[],
  ref: string | undefined
): T | undefined {
  if (!ref) return undefined;
  const needle = ref.trim();
  if (!needle) return undefined;
  return resolveProductSegment(buildSlugIndex(products), undefined, needle).product;
}

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

export type ProductSegmentKind =
  /** Last segment is a live product slug. */
  | "product"
  /** Last segment is a numeric legacy id: serve a 301 to the slug URL. */
  | "legacy-id"
  /** Last segment is a live type slug in this category: type listing. */
  | "type"
  /** Stale, mistyped, or unknown: noindex, never a redirect. */
  | "unknown";

export interface ProductSegmentResolution<T extends SlugProductLike = SlugProductLike> {
  kind: ProductSegmentKind;
  product?: T;
}

/**
 * Product-before-type, in the order that keeps every existing URL working:
 *   1. slug match                -> product
 *   2. id match                  -> legacy SKU URL (renderable, redirect
 *                                   candidate for numeric SKUs)
 *   3. live type slug in scope   -> type listing
 *   4. anything else             -> unknown (noindex, never a redirect)
 *
 * Resolution is total: anything that resolves today keeps resolving. The
 * numeric restriction lives in `resolveProductRedirect` instead, so tightening
 * what we redirect at never tightens what we can render.
 */
export function resolveProductSegment<T extends SlugProductLike>(
  index: SlugIndex<T>,
  categorySlug: string | undefined,
  segment: string | undefined
): ProductSegmentResolution<T> {
  const needle = (segment || "").trim();
  if (!needle) return { kind: "unknown" };

  const bySlug = index.bySlug.get(needle);
  if (bySlug) return { kind: "product", product: bySlug };

  const byId = index.byId.get(needle);
  if (byId) return { kind: "legacy-id", product: byId };

  if (categorySlug && index.typesByCategory.get(categorySlug)?.has(needle)) {
    return { kind: "type" };
  }

  return { kind: "unknown" };
}

function joinSegments(segments: string[]): string {
  return `/${segments.filter((segment) => segment.length > 0).join("/")}`;
}

/**
 * The path a legacy SKU URL should 301 to, or null when there is nothing to
 * redirect. Returns null for:
 *   - non-product paths
 *   - a segment that resolves to a slug (already canonical) or to a type
 *   - a non-numeric segment, so a mistyped type URL is never a redirect
 *     candidate: it is not a legacy SKU URL and must stay noindex
 *   - a numeric id that is already the product's own canonical path (the loop
 *     guard: a redirect to itself would be a 301 cycle)
 */
export function resolveProductRedirect<T extends SlugProductLike>(
  index: SlugIndex<T>,
  segments: string[]
): string | null {
  if (segments.length !== 3 && segments.length !== 4) return null;
  if (segments[0] !== "product") return null;

  const last = (segments[segments.length - 1] || "").trim();
  if (!/^\d+$/.test(last)) return null;

  const resolution = resolveProductSegment(index, segments[1], last);
  if (resolution.kind !== "legacy-id" || !resolution.product) return null;

  const target = productPath(resolution.product);
  return target === joinSegments(segments) ? null : target;
}

// ---------------------------------------------------------------------------
// Sheet audit
// ---------------------------------------------------------------------------

export interface SlugAuditEntry {
  id: string;
  name: string;
  slug: string;
}

export interface SlugNormalisationEntry extends SlugAuditEntry {
  raw: string;
}

export interface SlugCollision {
  slug: string;
  entries: SlugAuditEntry[];
}

export interface SlugAudit {
  /** `Slug` cell was blank and the slug was derived from the name. */
  computed: SlugAuditEntry[];
  /** Cell was non-empty but not already in normalised form. */
  normalised: SlugNormalisationEntry[];
  /** Served slug is longer than MAX_SLUG_LENGTH. Informational only. */
  overLength: SlugAuditEntry[];
  blankCells: number;
  collisions: SlugCollision[];
}

export function createSlugAudit(): SlugAudit {
  return { computed: [], normalised: [], overLength: [], blankCells: 0, collisions: [] };
}

export interface ReadProductSlugInput {
  raw: string;
  name: string;
  id: string;
  audit?: SlugAudit;
}

/**
 * Read the `Slug` sheet cell and return the slug to serve.
 *
 * A non-empty cell is normalised for characters but never truncated: the
 * column is the frozen source of truth, so silently shortening a value the
 * operator typed would serve a URL that disagrees with the sheet forever. The
 * length cap applies only to slugs we invent via `computeSlugFromName`.
 */
export function readProductSlug({ raw, name, id, audit }: ReadProductSlugInput): string {
  const cell = (raw || "").trim();

  if (!cell) {
    const slug = computeSlugFromName(name, id);
    if (audit) {
      audit.blankCells += 1;
      audit.computed.push({ id, name, slug });
    }
    return slug;
  }

  const slug = normaliseProductSlug(cell, { maxLength: null });
  if (audit) {
    if (slug !== cell) audit.normalised.push({ id, name, raw: cell, slug });
    if (slug.length > MAX_SLUG_LENGTH) audit.overLength.push({ id, name, slug });
  }
  return slug;
}

/** Duplicate slugs, lowest-SKU-wins ordering, so the report is stable. */
export function detectSlugCollisions<T extends SlugProductLike>(
  products: T[]
): SlugCollision[] {
  const groups = new Map<string, T[]>();
  for (const product of products) {
    if (!product?.slug) continue;
    const group = groups.get(product.slug);
    if (group) group.push(product);
    else groups.set(product.slug, [product]);
  }

  const collisions: SlugCollision[] = [];
  for (const [slug, group] of groups) {
    if (group.length < 2) continue;
    collisions.push({
      slug,
      entries: [...group]
        .sort(compareCandidates)
        .map((product) => ({ id: product.id, name: product.name, slug })),
    });
  }
  collisions.sort((a, b) => a.slug.localeCompare(b.slug));
  return collisions;
}

/** Human-readable warnings. Both servers log exactly these lines so a drift
 *  shows up identically in local dev and in the Vercel function logs. */
export function describeSlugAudit(audit: SlugAudit): string[] {
  const lines: string[] = [];

  for (const collision of audit.collisions) {
    lines.push(
      `[slug-audit] duplicate slug "${collision.slug}" on ${collision.entries
        .map((entry) => `${entry.id} (${entry.name})`)
        .join(", ")} — keeping ${collision.entries[0]?.id ?? "?"}`
    );
  }
  for (const entry of audit.computed) {
    lines.push(
      `[slug-audit] blank Slug cell for ${entry.id} (${entry.name}) — computed "${entry.slug}"; paste it into the sheet`
    );
  }
  for (const entry of audit.normalised) {
    lines.push(
      `[slug-audit] Slug cell "${entry.raw}" for ${entry.id} (${entry.name}) normalised to "${entry.slug}"`
    );
  }
  for (const entry of audit.overLength) {
    lines.push(
      `[slug-audit] slug "${entry.slug}" for ${entry.id} is ${entry.slug.length} chars (cap is ${MAX_SLUG_LENGTH}); served as-is because the sheet column is frozen`
    );
  }

  return lines;
}
