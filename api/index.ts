import express from 'express';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Inlined from src/utils/typeSlug.ts and src/utils/productSlug.ts: this file
// must stay self-contained (no imports outside api/) or the Vercel serverless
// bundle breaks and every /api/* route dies with FUNCTION_INVOCATION_FAILED.
// The 301 middleware, the slug parser, and productPath() below all come from
// these two modules — keep them byte-for-byte equivalent to the originals.
// ---------------------------------------------------------------------------
function toTypeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Longest slug we are willing to invent from a product name. Applied to
// computed slugs only — a `Slug` cell in the sheet is frozen, so truncating it
// would serve a URL that disagrees with the value the operator typed.
const MAX_SLUG_LENGTH = 60;

// Normalisation for product slugs. Deliberately layered on top of
// toTypeSlug() rather than reimplementing it, so a type slug and a product slug
// can never drift apart: the diacritic strip and the `&` -> `and` mapping run
// first, then the shared lowercase/collapse/trim pass, then the length cap.
//
// Stopwords are intentionally NOT removed. A slug that drops `for`/`with`/`the`
// can no longer be recomputed from the name, so the sheet-to-URL mapping stops
// being verifiable, and the length saving is negligible.
function normaliseProductSlug(
  raw: string,
  options: { maxLength?: number | null } = {}
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
function computeSlugFromName(
  name: string,
  id: string,
  options: { maxLength?: number | null } = {}
): string {
  return normaliseProductSlug(name, options) || normaliseProductSlug(id, options);
}

interface SlugProductLike {
  id: string;
  name: string;
  category: string;
  typeSlug?: string;
  slug?: string;
}

/**
 * The one and only product URL shape:
 *   `/product/:category[/:typeSlug]/:slug`
 *
 * 4 segments when the product has a type, 3 when it does not — the same split
 * the previous id-based builder used, so the 6 typeless bags keep their URL
 * depth. Falls back to `id` so a product that somehow arrives without a slug
 * still links somewhere that resolves.
 */
function productPath(product: SlugProductLike): string {
  const typeSegment = product.typeSlug ? `/${product.typeSlug}` : "";
  return `/product/${product.category}${typeSegment}/${product.slug || product.id}`;
}

interface SlugIndex<T extends SlugProductLike> {
  bySlug: Map<string, T>;
  byId: Map<string, T>;
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

function buildSlugIndex<T extends SlugProductLike>(products: T[]): SlugIndex<T> {
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

type ProductSegmentKind = "product" | "legacy-id" | "type" | "unknown";

interface ProductSegmentResolution<T extends SlugProductLike> {
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
 * numeric restriction lives in resolveProductRedirect instead, so tightening
 * what we redirect at never tightens what we can render.
 */
function resolveProductSegment<T extends SlugProductLike>(
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
function resolveProductRedirect<T extends SlugProductLike>(
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

interface SlugAuditEntry {
  id: string;
  name: string;
  slug: string;
}

interface SlugNormalisationEntry extends SlugAuditEntry {
  raw: string;
}

interface SlugCollision {
  slug: string;
  entries: SlugAuditEntry[];
}

interface SlugAudit {
  computed: SlugAuditEntry[];
  normalised: SlugNormalisationEntry[];
  overLength: SlugAuditEntry[];
  blankCells: number;
  collisions: SlugCollision[];
}

function createSlugAudit(): SlugAudit {
  return { computed: [], normalised: [], overLength: [], blankCells: 0, collisions: [] };
}

/**
 * Read the `Slug` sheet cell and return the slug to serve.
 *
 * A non-empty cell is normalised for characters but never truncated: the
 * column is the frozen source of truth, so silently shortening a value the
 * operator typed would serve a URL that disagrees with the sheet forever. The
 * length cap applies only to slugs we invent via `computeSlugFromName`.
 */
function readProductSlug({ raw, name, id, audit }: { raw: string; name: string; id: string; audit?: SlugAudit }): string {
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
function detectSlugCollisions<T extends SlugProductLike>(products: T[]): SlugCollision[] {
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
function describeSlugAudit(audit: SlugAudit): string[] {
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


// ---------------------------------------------------------------------------
// Inlined copy of src/server/seo.ts plus src/utils/seoText.ts and the
// formatTypeLabel half of src/utils/typeSlug.ts. api/index.ts must stay
// self-contained, so the SHOP_CONFIG-derived registries below are frozen to
// literals that mirror src/config/shop.ts. When the SEO logic changes there,
// regenerate this block.
// ---------------------------------------------------------------------------

const SITE_NAME = "The Avenue Thirty";
const DEFAULT_SITE_TITLE = `${SITE_NAME} | Curated Fashion & Skincare`;

// Typographic dashes are banned in every head tag, Open Graph tag, and JSON-LD
// string this site emits. `pageTitle`/`sanitizeSeoText` normalize them to a
// plain hyphen so no code path — including text pulled from the product sheet —
// can leak one into a rendered document.
const BANNED_DASHES = /[\u2014\u2013\u2012\u2015\u2212\u2011\u00AD\uFE63\uFF0D]/g;

function sanitizeSeoText(value: string): string {
  if (!value) return value;
  // Only the banned characters are rewritten. Existing ASCII hyphens are left
  // alone so titles like "Must-Have Styles" survive untouched.
  return value.replace(BANNED_DASHES, "-").replace(/[ \t]{2,}/g, " ").trim();
}

function pageTitle(...parts: Array<string | undefined | null>): string {
  const kept = parts.filter((part): part is string => !!part && part.trim().length > 0);
  return sanitizeSeoText(kept.join(" | "));
}

function formatTypeLabel(raw: string): string {
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

const SCHEMA_CONTEXT = "https://schema.org/";
const MAX_META_DESCRIPTION = 158;
const MAX_ITEM_LIST = 50;

const SITE_DOMAIN = "theavenuethirty.com";
const DEFAULT_OG_IMAGE = "https://i.postimg.cc/5tJ5zYT3/herobg-01.webp";
const CURRENCY_CODE = "PKR";
const SOCIAL_LINKS = [
  "https://instagram.com/theavenuethirty",
  "https://tiktok.com/@theavenuethirty",
  "https://x.com/theavenuethirty",
  "https://snapchat.com/add/theavenuethirty",
];
const DEFAULT_DESCRIPTION =
  "Shop curated fashion, skincare, accessories, and lifestyle products at The Avenue Thirty. Fast cash-on-delivery shipping across Pakistan.";

const GA4_SNIPPET = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-60DT6QKVL6"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-60DT6QKVL6');
</script>`;

interface ProductLike extends SlugProductLike {
  tagline?: string;
  priceMonthly?: number;
  originalPrice?: number;
  imageUrl?: string;
  imageUrl2?: string;
  imageUrl3?: string;
  availability?: string;
  description?: string;
  collections?: string[];
}

interface SEOMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  ogImage?: string;
  ogType?: "website" | "product";
  schema?: Record<string, unknown> | Array<Record<string, unknown>>;
  robots?: string;
}

interface SEOCategory {
  slug: string;
  label: string;
  image?: string;
}

interface CollectionMatch {
  collection?: string;
  category?: string;
  type?: string;
  minDiscountPct?: number;
  priceMin?: number;
  priceMax?: number;
}

interface SEOCollection {
  slug: string;
  title: string;
  subtitle?: string;
  image?: string;
  match: CollectionMatch;
}

interface SEOStaticPage {
  path: string;
  title: string;
  description: string;
}

const SEO_CATEGORIES: SEOCategory[] = [
  { slug: "skincare", label: "Skincare", image: "https://i.postimg.cc/Rh0rgYH1/skincare.webp" },
  { slug: "bags", label: "Bags", image: "https://i.postimg.cc/Xq92cc2G/bags.webp" },
  { slug: "jewellery", label: "Jewellery", image: "https://i.postimg.cc/vZGQn0Ph/jewellery.webp" },
  { slug: "toys", label: "Kids", image: "https://i.postimg.cc/90z9cW9T/toys.webp" },
  { slug: "premium", label: "Premium", image: "https://i.postimg.cc/90z9cW9T/toys.webp" },
];

const SEO_COLLECTIONS: SEOCollection[] = [
  { slug: "must-have", title: "Must-Have Styles", match: { collection: "Must-Have Styles" } },
  { slug: "best-sellers", title: "Best Sellers", match: { collection: "Best Seller" } },
  { slug: "on-sale", title: "On Sale", match: { collection: "Sale" } },
  { slug: "new-in", title: "New Arrivals", match: { collection: "New Arrival" } },
  { slug: "trending", title: "Trending", match: { collection: "Trending" } },
  { slug: "featured", title: "Featured", match: { collection: "Featured" } },
  { slug: "budget-buys", title: "Budget Buys", subtitle: "Affordable picks under Rs. 1,000", match: { priceMin: 0, priceMax: 1000 } },
  { slug: "budget-skincare", title: "Skincare Under Rs. 1,000", subtitle: "Gentle care without the splurge", match: { category: "skincare", priceMin: 0, priceMax: 1000 } },
  { slug: "bags-under-1500", title: "Handbags Under Rs. 1,500", subtitle: "Statement bags at a steal", match: { category: "bags", priceMin: 0, priceMax: 1500 } },
  { slug: "bags-clearance", title: "Bags 50%+ Off", subtitle: "Deep discounts on our best bags", match: { category: "bags", minDiscountPct: 50 } },
];

// Mirrors matchCollection() in src/utils/collections.ts so collection pages can
// emit an ItemList of the products they actually render. Keep the two in sync.
function matchCollectionProducts(products: ProductLike[], match: CollectionMatch): ProductLike[] {
  return products.filter((product) => {
    if (
      match.collection &&
      !product.collections?.some(
        (tag) => tag.toLowerCase() === match.collection!.toLowerCase()
      )
    ) {
      return false;
    }
    if (match.category && product.category !== match.category) return false;
    if (match.type && product.typeSlug !== match.type) return false;
    if (match.minDiscountPct !== undefined) {
      if (!product.originalPrice || product.originalPrice <= (product.priceMonthly ?? 0)) return false;
      const pct = ((product.originalPrice - (product.priceMonthly ?? 0)) / product.originalPrice) * 100;
      if (pct < match.minDiscountPct) return false;
    }
    if (match.priceMin !== undefined && (product.priceMonthly ?? 0) < match.priceMin) return false;
    if (match.priceMax !== undefined && (product.priceMonthly ?? 0) > match.priceMax) return false;
    return true;
  });
}

const SEO_STATIC_PAGES: SEOStaticPage[] = [
  {
    path: "/about",
    title: "About Us",
    description:
      "Learn about The Avenue Thirty, our curated store for fashion, skincare, accessories, and lifestyle finds delivered across Pakistan.",
  },
  {
    path: "/contact",
    title: "Contact Us",
    description:
      "Get in touch with The Avenue Thirty for order help, product questions, and seller enquiries. Cash on delivery available nationwide.",
  },
  {
    path: "/faq",
    title: "Frequently Asked Questions",
    description:
      "Answers to common questions about The Avenue Thirty ordering, cash-on-delivery payment, delivery times, returns, and exchanges in Pakistan.",
  },
  {
    path: "/privacy",
    title: "Privacy Policy",
    description:
      "How The Avenue Thirty collects, uses, and protects your personal information when you browse, chat, or place a cash-on-delivery order.",
  },
  {
    path: "/return-policy",
    title: "Return & Exchange Policy",
    description:
      "Our return and exchange policy: eligibility, timelines, and how to start a return or exchange for your The Avenue Thirty order.",
  },
  {
    path: "/sell",
    title: "Sell With Us",
    description:
      "Sell your products with The Avenue Thirty. Submit your brand and catalogue details and our team will get back to you about partnership.",
  },
  {
    path: "/ai-shopping",
    title: "AI Shopping Assistant",
    description:
      "Shop faster with the The Avenue Thirty AI assistant. Ask for product recommendations by category, type, or budget.",
  },
];

function getCategoryMeta(slug: string): SEOCategory | undefined {
  return SEO_CATEGORIES.find((category) => category.slug === slug);
}

function getCategoryLabelForSlug(slug: string): string {
  return getCategoryMeta(slug)?.label || slug;
}

function getCollectionMeta(slug: string): SEOCollection | undefined {
  return SEO_COLLECTIONS.find((collection) => collection.slug === slug);
}

function getStaticPageMeta(path: string): SEOStaticPage | undefined {
  return SEO_STATIC_PAGES.find((page) => page.path === path);
}

function normalizePath(rawPath: string): string {
  const withLeading = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  const collapsed = withLeading.replace(/\/{2,}/g, "/");
  if (collapsed.length > 1 && collapsed.endsWith("/")) {
    return collapsed.replace(/\/+$/, "");
  }
  return collapsed;
}

function categoryPath(slug: string): string {
  return `/product/${slug}`;
}

function typePath(slug: string, typeSlug: string): string {
  return `/product/${slug}/${typeSlug}`;
}

function collectionPath(slug: string): string {
  return `/${slug}`;
}

/**
 * Collections that used to exist and whose URLs may already be indexed.
 *
 * Deleting a collection from the collections registry removes it from the
 * sitemap and makes its URL fall through to the noindex path — which still
 * answers HTTP 200 with "Collection not found". For an indexed URL that is a
 * soft-404: the page is gone but reports success, so crawlers keep it in the
 * index and the equity it held is dropped rather than handed on.
 *
 * Retiring a collection therefore has to be a two-part edit: remove it from the
 * collections registry, then add it here pointing at the surviving page with the
 * closest intent. resolveRetiredCollectionRedirect() turns it into a real 301.
 *
 * Do NOT point these at `/`. A 301 to the homepage is usually worse than a
 * 410, because it says "this content moved to the top of the site" rather
 * than admitting it no longer exists.
 */
const RETIRED_COLLECTIONS: Record<string, string> = {
  // "Top Rated" was driven by a rating facet that no longer has data behind it
  // (the sheet carries no rating column). Best Sellers is the surviving
  // customer-favourite view, which is the closest equivalent intent.
  "top-rated": collectionPath("best-sellers"),
};

/** The path a retired collection slug should 301 to, or null. */
function resolveRetiredCollectionRedirect(rawPath: string): string | null {
  const segments = normalizePath(rawPath).split("/").filter((segment) => segment.length > 0);
  if (segments.length !== 1) return null;
  return RETIRED_COLLECTIONS[segments[0]] ?? null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function clampText(value: string, max: number): string {
  const collapsed = value.replace(/\s+/g, " ").trim();
  if (collapsed.length <= max) return collapsed;
  const cut = collapsed.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return base.replace(/[\s,;:.!?\-–—]+$/, "");
}

function truncateAtSentence(value: string, max: number): string {
  const collapsed = value.replace(/\s+/g, " ").trim();
  if (collapsed.length <= max) return collapsed;
  const clamped = clampText(collapsed, max);
  const lastStop = Math.max(
    clamped.lastIndexOf(". "),
    clamped.lastIndexOf("! "),
    clamped.lastIndexOf("? ")
  );
  if (lastStop > max * 0.4) return clamped.slice(0, lastStop + 1).trim();
  return clamped;
}

function replaceAll(haystack: string, needle: string, replacement: string): string {
  if (!needle) return haystack;
  return haystack.split(needle).join(replacement);
}

function serializeJsonLd(schema: unknown): string {
  return JSON.stringify(schema)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function sanitizeSchemaStrings(value: unknown): unknown {
  if (typeof value === "string") return sanitizeSeoText(value);
  if (Array.isArray(value)) return value.map(sanitizeSchemaStrings);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      out[key] = sanitizeSchemaStrings(entry);
    }
    return out;
  }
  return value;
}

function breadcrumbList(origin: string, trail: Array<{ name: string; path: string }>): Record<string, unknown> {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${origin}${crumb.path === "/" ? "/" : crumb.path}`,
    })),
  };
}

function itemList(products: ProductLike[], origin: string): Record<string, unknown> {
  return {
    "@type": "ItemList",
    numberOfItems: products.length,
    itemListElement: products.slice(0, MAX_ITEM_LIST).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${origin}${productPath(product)}`,
      name: product.name,
    })),
  };
}

function graph(nodes: Array<Record<string, unknown>>): Record<string, unknown> {
  return { "@context": SCHEMA_CONTEXT, "@graph": nodes };
}

function productImages(product: ProductLike): string[] {
  return [product.imageUrl, product.imageUrl2, product.imageUrl3].filter(
    (image): image is string => typeof image === "string" && image.length > 0
  );
}

function availabilityUrl(value: string | undefined): string {
  const normalized = (value || "").trim().toLowerCase();
  if (normalized === "preorder") return "https://schema.org/PreOrder";
  if (normalized === "backorder") return "https://schema.org/BackOrder";
  if (normalized === "out_of_stock" || normalized === "sold_out") return "https://schema.org/OutOfStock";
  return "https://schema.org/InStock";
}

function generateProductSEO(product: ProductLike, origin: string, canonicalPath?: string): SEOMetadata {
  const description = truncateAtSentence(
    product.description || `${product.name} at ${SITE_NAME}. Cash on delivery across Pakistan.`,
    MAX_META_DESCRIPTION
  );
  // Always canonicalise to the product's own /product/:category/:typeSlug/:slug
  // form so alternate URL shapes (legacy /product/:category/:sku, a 3-segment
  // path, a wrong category or type in the path) consolidate onto one
  // indexable URL.
  const canonicalUrl = `${origin}${canonicalPath || productPath(product)}`;
  const images = productImages(product);
  const price = typeof product.priceMonthly === "number" && Number.isFinite(product.priceMonthly)
    ? product.priceMonthly.toFixed(2)
    : "0.00";
  const categoryLabel = getCategoryLabelForSlug(product.category);
  const typeLabel = product.tagline ? formatTypeLabel(product.tagline) : "";

  return {
    title: `${product.name} | ${SITE_NAME}`,
    description,
    canonicalUrl,
    ogImage: images[0],
    ogType: "product",
    schema: {
      "@context": SCHEMA_CONTEXT,
      "@type": "Product",
      "@id": `${canonicalUrl}#product`,
      name: product.name,
      description: product.description || product.name,
      sku: product.id,
      category: typeLabel ? `${categoryLabel} > ${typeLabel}` : categoryLabel,
      image: images,
      brand: { "@type": "Brand", name: SITE_NAME },
      offers: {
        "@type": "Offer",
        url: canonicalUrl,
        price,
        priceCurrency: CURRENCY_CODE,
        availability: availabilityUrl(product.availability),
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@type": "Organization", name: SITE_NAME },
      },
    },
  };
}

interface CategorySEOOptions {
  typeSlug?: string;
  typeLabel?: string;
  products?: ProductLike[];
}

function generateCategorySEO(
  slug: string,
  label: string,
  origin: string,
  options: CategorySEOOptions = {}
): SEOMetadata {
  const { typeSlug, typeLabel, products = [] } = options;
  const heading = typeLabel ? `${typeLabel} ${label}` : label;
  const canonicalUrl = `${origin}${typeSlug ? typePath(slug, typeSlug) : categoryPath(slug)}`;
  const ogImage = getCategoryMeta(slug)?.image;

  const subject = typeLabel || label;
  const countSuffix = products.length
    ? ` Browse ${products.length} ${products.length === 1 ? "pick" : "picks"}`
    : " Browse the latest arrivals";
  const description = clampText(
    `${subject} at ${SITE_NAME}.${countSuffix} with cash-on-delivery shipping across Pakistan.`,
    MAX_META_DESCRIPTION
  );

  const trail = [
    { name: "Home", path: "/" },
    { name: label, path: categoryPath(slug) },
  ];
  if (typeLabel && typeSlug) {
    trail.push({ name: typeLabel, path: typePath(slug, typeSlug) });
  }

  const nodes: Array<Record<string, unknown>> = [breadcrumbList(origin, trail)];
  if (products.length) {
    nodes.push(itemList(products, origin));
  }

  return {
    title: typeLabel ? pageTitle(typeLabel, label, SITE_NAME) : pageTitle(label, SITE_NAME),
    description,
    canonicalUrl,
    ogImage,
    ogType: "website",
    schema: graph(nodes),
  };
}

function generateHomeSEO(origin: string): SEOMetadata {
  return {
    title: DEFAULT_SITE_TITLE,
    description: DEFAULT_DESCRIPTION,
    canonicalUrl: `${origin}/`,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: "website",
    schema: graph([
      {
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        name: SITE_NAME,
        url: `${origin}/`,
        description: DEFAULT_DESCRIPTION,
        sameAs: SOCIAL_LINKS,
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        url: `${origin}/`,
        name: SITE_NAME,
        publisher: { "@id": `${origin}/#organization` },
        inLanguage: "en-PK",
      },
    ]),
  };
}

interface CollectionSEOOptions {
  subtitle?: string;
  image?: string;
  products?: ProductLike[];
}

function generateCollectionSEO(
  slug: string,
  title: string,
  origin: string,
  options: CollectionSEOOptions = {}
): SEOMetadata {
  const { subtitle, image, products = [] } = options;
  const canonicalUrl = `${origin}${collectionPath(slug)}`;
  const countSuffix = products.length ? ` ${products.length} curated ${products.length === 1 ? "pick" : "picks"}.` : "";
  const description = clampText(
    `Shop ${title} at ${SITE_NAME}.${countSuffix}${subtitle ? ` ${subtitle}.` : ""} Cash on delivery across Pakistan.`,
    MAX_META_DESCRIPTION
  );

  const nodes: Array<Record<string, unknown>> = [
    breadcrumbList(origin, [
      { name: "Home", path: "/" },
      { name: title, path: collectionPath(slug) },
    ]),
  ];
  if (products.length) {
    nodes.push(itemList(products, origin));
  }

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    canonicalUrl,
    ogImage: image || DEFAULT_OG_IMAGE,
    ogType: "website",
    schema: graph(nodes),
  };
}

function generateStaticPageSEO(page: SEOStaticPage, origin: string): SEOMetadata {
  const canonicalUrl = `${origin}${page.path}`;
  return {
    title: `${page.title} | ${SITE_NAME}`,
    description: page.description,
    canonicalUrl,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: "website",
    schema: graph([
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: `${page.title} | ${SITE_NAME}`,
        description: page.description,
        isPartOf: { "@id": `${origin}/#website` },
        about: { "@id": `${origin}/#organization` },
        inLanguage: "en-PK",
      },
      breadcrumbList(origin, [
        { name: "Home", path: "/" },
        { name: page.title, path: page.path },
      ]),
    ]),
  };
}

function generateNoindexSEO(origin: string, canonicalPath: string): SEOMetadata {
  return {
    title: `Page not found | ${SITE_NAME}`,
    description: DEFAULT_DESCRIPTION,
    canonicalUrl: `${origin}${canonicalPath}`,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: "website",
    robots: "noindex, follow",
  };
}

function findProduct(index: SlugIndex<ProductLike>, segment: string | undefined): ProductLike | undefined {
  return resolveProductSegment(index, undefined, segment).product;
}

function typeLabelFor(products: ProductLike[], slug: string, typeSlug: string): string | undefined {
  const match = products.find(
    (product) => product.category === slug && product.typeSlug === typeSlug && !!product.tagline
  );
  return match?.tagline ? formatTypeLabel(match.tagline) : undefined;
}

function categoryProductsFor(products: ProductLike[], slug: string, typeSlug?: string): ProductLike[] {
  return products.filter(
    (product) => product.category === slug && (!typeSlug || product.typeSlug === typeSlug)
  );
}

function resolveSEOMetadata(
  rawPath: string,
  products: ProductLike[],
  origin: string
): SEOMetadata {
  return sanitizeMetadata(resolveSEOMetadataRaw(rawPath, products, origin));
}

// Typographic dashes are banned site-wide in head tags, Open Graph tags, and
// JSON-LD strings. Sanitizing here means the metadata object itself is safe for
// any consumer, not just the HTML renderer; renderSEOTags() re-applies the same
// normalization as a backstop.
function sanitizeMetadata(meta: SEOMetadata): SEOMetadata {
  return {
    ...meta,
    title: sanitizeSeoText(meta.title),
    description: sanitizeSeoText(meta.description),
    schema: meta.schema ? (sanitizeSchemaStrings(meta.schema) as SEOMetadata["schema"]) : meta.schema,
  };
}

function resolveSEOMetadataRaw(
  rawPath: string,
  products: ProductLike[],
  origin: string
): SEOMetadata {
  const cleanPath = normalizePath(rawPath);
  const segments = cleanPath.split("/").filter((segment) => segment.length > 0);

  if (segments.length === 0) {
    return generateHomeSEO(origin);
  }

  if (segments[0] === "product") {
    const slug = segments[1] || "";
    // One index, one resolution order, shared with the 301 middleware: slug
    // before id before type. A product slug that happens to equal a live type
    // slug still resolves to the product.
    const index = buildSlugIndex(products);

    if (segments.length === 2) {
      const scopedProducts = categoryProductsFor(products, slug);
      if (!getCategoryMeta(slug) && scopedProducts.length === 0) {
        // Not a registered category and nothing in the catalogue: empty PLP.
        return generateNoindexSEO(origin, cleanPath);
      }
      const label = getCategoryLabelForSlug(slug);
      return generateCategorySEO(slug, label, origin, { products: scopedProducts });
    }

    if (segments.length === 3) {
      const resolution = resolveProductSegment(index, slug, segments[2]);
      if (resolution.product) {
        return generateProductSEO(resolution.product, origin);
      }
      const typeSlug = segments[2];
      const label = getCategoryLabelForSlug(slug);
      const typeLabel = resolution.kind === "type" ? typeLabelFor(products, slug, typeSlug) : undefined;
      if (!typeLabel) {
        // Neither a product ref nor a live type slug: stale or mistyped URL.
        return generateNoindexSEO(origin, cleanPath);
      }
      return generateCategorySEO(slug, label, origin, {
        typeSlug,
        typeLabel,
        products: categoryProductsFor(products, slug, typeSlug),
      });
    }

    if (segments.length === 4) {
      // A stale type segment in the middle does not disqualify the product:
      // the canonical below rewrites the path to the product's real category
      // and type. A stale *last* segment is not a product at all and falls
      // through to noindex, which is where a mistyped type URL belongs.
      const product = findProduct(index, segments[3]);
      if (product) {
        return generateProductSEO(product, origin);
      }
    }

    return generateNoindexSEO(origin, cleanPath);
  }

  const staticPage = getStaticPageMeta(cleanPath);
  if (staticPage) {
    return generateStaticPageSEO(staticPage, origin);
  }

  if (segments.length === 1) {
    const collection = getCollectionMeta(segments[0]);
    if (collection) {
      return generateCollectionSEO(collection.slug, collection.title, origin, {
        subtitle: collection.subtitle,
        image: collection.image,
        products: matchCollectionProducts(products, collection.match),
      });
    }
  }

  return generateNoindexSEO(origin, cleanPath);
}

function renderSEOTags(meta: SEOMetadata): Record<string, string> {
  // Single choke point for every head tag this site renders. Sanitizing here
  // means no title, description, Open Graph value, or JSON-LD string can carry
  // a typographic dash — including text sourced from the product sheet.
  const title = escapeHtml(sanitizeSeoText(meta.title));
  const description = escapeHtml(sanitizeSeoText(meta.description));
  const canonical = escapeHtml(meta.canonicalUrl);
  const robots = escapeHtml(meta.robots || "index, follow");
  const ogImage = meta.ogImage ? escapeHtml(meta.ogImage) : "";
  const cardType = ogImage ? "summary_large_image" : "summary";

  const ogLines = [
    `<meta property="og:site_name" content="${escapeHtml(sanitizeSeoText(SITE_NAME))}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:type" content="${meta.ogType || "website"}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    ogImage ? `<meta property="og:image" content="${ogImage}" />` : "",
    `<meta name="twitter:card" content="${cardType}" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    ogImage ? `<meta name="twitter:image" content="${ogImage}" />` : "",
  ].filter(Boolean);

  const tags: Record<string, string> = {
    "<!--seo-title-->": `<title>${title}</title>`,
    "<!--seo-meta-->": `<meta name="description" content="${description}" />`,
    "<!--seo-canonical-->": `<link rel="canonical" href="${canonical}" />`,
    "<!--seo-robots-->": `<meta name="robots" content="${robots}" />`,
    "<!--seo-og-->": ogLines.join("\n    "),
    "<!--seo-ga-->": GA4_SNIPPET,
  };

  if (meta.schema) {
    tags["<!--seo-schema-->"] = `<script type="application/ld+json">${serializeJsonLd(sanitizeSchemaStrings(meta.schema))}</script>`;
  }

  return tags;
}

function injectSEO(html: string, meta: SEOMetadata): string {
  const tags = renderSEOTags(meta);

  // index.html ships static defaults so local dev and `vite preview` still have a
  // valid document. Strip them first so a rendered route never ships two titles,
  // two descriptions, or a canonical pointing at the homepage.
  let output = html
    .replace(/<title>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta[^>]+name=["']description["'][^>]*>/gi, "")
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi, "");

  for (const [placeholder, tagHtml] of Object.entries(tags)) {
    output = replaceAll(output, placeholder, tagHtml);
  }

  if (!/<title[\s>]/i.test(output)) {
    output = replaceAll(output, "</head>", `${tags["<!--seo-title-->"]}\n</head>`);
  }

  // Drop any placeholder a route did not fill (e.g. seo-schema on noindex pages).
  output = output.replace(/<!--\s*seo-[a-z]+\s*-->/gi, "");

  return output;
}

// Canonical URLs and sitemap entries must use the public origin. Behind Vercel's
// TLS termination the request origin is only correct when `trust proxy` is on, so
// SITE_URL is the authoritative override when set.
function resolveOrigin(requestOrigin: string): string {
  const configured = (process.env.SITE_URL || "").trim().replace(/\/+$/, "");
  return configured || requestOrigin;
}

interface SitemapEntry {
  path: string;
  priority: string;
  changeFreq: string;
}

function buildSitemapEntries(products: ProductLike[]): SitemapEntry[] {
  const entries: SitemapEntry[] = [{ path: "/", priority: "1.0", changeFreq: "daily" }];

  for (const category of SEO_CATEGORIES) {
    entries.push({ path: categoryPath(category.slug), priority: "0.8", changeFreq: "weekly" });
  }

  const seenTypePaths = new Set<string>();
  for (const product of products) {
    if (!product.category || !product.typeSlug) continue;
    const path = typePath(product.category, product.typeSlug);
    if (seenTypePaths.has(path)) continue;
    seenTypePaths.add(path);
    entries.push({ path, priority: "0.7", changeFreq: "weekly" });
  }

  for (const collection of SEO_COLLECTIONS) {
    entries.push({ path: collectionPath(collection.slug), priority: "0.8", changeFreq: "weekly" });
  }

  for (const page of SEO_STATIC_PAGES) {
    entries.push({ path: page.path, priority: "0.5", changeFreq: "monthly" });
  }

  for (const product of products) {
    if (!product.category || !product.id) continue;
    entries.push({ path: productPath(product), priority: "0.7", changeFreq: "weekly" });
  }

  return entries;
}

function buildSitemapXml(origin: string, products: ProductLike[]): string {
  const lastmod = new Date().toISOString().slice(0, 10);
  const seen = new Set<string>();
  const urls: string[] = [];

  for (const entry of buildSitemapEntries(products)) {
    if (seen.has(entry.path)) continue;
    seen.add(entry.path);
    urls.push(
      [
        "  <url>",
        `    <loc>${escapeXml(`${origin}${entry.path === "/" ? "/" : entry.path}`)}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <changefreq>${entry.changeFreq}</changefreq>`,
        `    <priority>${entry.priority}</priority>`,
        "  </url>",
      ].join("\n")
    );
  }

  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...urls, "</urlset>", ""].join("\n");
}

function buildRobotsTxt(origin: string): string {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    "",
  ].join("\n");
}

const GROQ_MODEL = "openai/gpt-oss-20b";

const GOOGLE_SHEET_CSV_URL = process.env.GOOGLE_SHEET_CSV_URL || 'https://docs.google.com/spreadsheets/d/1LkSL5CL0c80b_6iqVd8FH_uAnm3PwjZv4_Wh_R6xETo/export?format=csv';

const CATEGORY_SLUG_MAP: Record<string, string> = {
  'skincare & beauty': 'skincare_beauty',
  'accessories & jewellery': 'accessories',
  'bags & backpacks': 'bags_backpacks',
  'toys & kids': 'toys_kids',
};

const CATEGORY_LABEL_MAP: Record<string, string> = {
  'skincare_beauty': 'Skincare',
  'accessories': 'Accessories',
  'bags_backpacks': 'Bags',
  'toys_kids': 'Toys',
};

let catalogueCache: { products: any[]; index: SlugIndex<any>; audit: SlugAudit; expiresAt: number } | null = null;
const CATALOGUE_TTL_MS = 10 * 60 * 1000;

function slugifyCategory(raw: string): string {
  const key = raw.toLowerCase().trim();
  if (CATEGORY_SLUG_MAP[key]) return CATEGORY_SLUG_MAP[key];
  return key.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      row.push(current.trim());
      if (row.length > 1 || row[0] !== '') {
        rows.push(row);
      }
      row = [];
      current = '';
      if (char === '\r' && text[i + 1] === '\n') {
        i++;
      }
    } else {
      current += char;
    }
  }

  if (current || row.length > 0) {
    row.push(current.trim());
    if (row.length > 1 || row[0] !== '') {
      rows.push(row);
    }
  }

  return rows;
}

// Splits a packed multi-value sheet cell into a trimmed, non-empty list.
// Mirrors the existing Collections parser. Undefined when the cell is empty
// so absent data stays absent on the wire instead of becoming an empty array.
function parseList(raw: string): string[] | undefined {
  const values = raw.split(/[;,]/).map((v) => v.trim()).filter(Boolean);
  return values.length > 0 ? values : undefined;
}

function mapCsvRowToProduct(row: string[], header: string[], audit: SlugAudit): any | null {
  const get = (name: string) => {
    const idx = header.indexOf(name);
    return idx >= 0 ? row[idx] || '' : '';
  };

  const name = get('Name');
  const sku = get('SKU');
  const category = get('Category');
  const type = get('Type');
  const unitPrice = get('Unit price');
  const discountedPrice = get('Discounted Price');
  const imageUrl = get('Image Url');
  const imageUrl2 = get('Image2 Url');
  const imageUrl3 = get('Image3 Url');
  const description = get('Product description');
  const collections = get('Collections');
  // `Brand` is a single value; `Colors`/`Sizes` are packed cells, so they go
  // through parseList() like `Collections` does. `Type` is NEVER split on
  // commas: values such as "Handbag Set, 3 Pcs Bag Set" contain one.
  const brand = get('Brand').trim();
  const colors = parseList(get('Colors'));
  const sizes = parseList(get('Sizes'));
  const parentSku = get('Parent SKU').trim();
  const status = get('Availability');
  const availability = get('Availability');
  // Header match is exact, same as every other column read here.
  const rawSlug = get('Slug');

  if (!name) return null;

  const normalizedStatus = status.trim().toLowerCase();
  if (normalizedStatus !== 'in_stock' && normalizedStatus !== 'preorder' && normalizedStatus !== 'backorder') return null;

  const parsePrice = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : 0;
  };

  const parsedUnitPrice = parsePrice(unitPrice);
  const parsedDiscountedPrice = parsePrice(discountedPrice);

  const priceMonthly = parsedDiscountedPrice > 0 ? parsedDiscountedPrice : parsedUnitPrice;
  const originalPrice = (parsedDiscountedPrice > 0 && parsedDiscountedPrice < parsedUnitPrice) ? parsedUnitPrice : undefined;

  const collectionList = collections
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  const tagline = type.trim();

  // `id` is deliberately untouched: the SKU fallback and /api/product/:id both
  // depend on it. Only the URL segment changes.
  const id = String(sku || name);

  return {
    id,
    name,
    slug: readProductSlug({ raw: rawSlug, name, id, audit }),
    category: slugifyCategory(category) as any,
    tagline,
    typeSlug: tagline ? toTypeSlug(tagline) : undefined,
    brand: brand || undefined,
    colors,
    sizes,
    parentSku: parentSku || undefined,
    priceMonthly,
    originalPrice,
    imageUrl: imageUrl || '',
    imageUrl2: imageUrl2 || undefined,
    imageUrl3: imageUrl3 || undefined,
    availability,
    description: description || name,
    collections: collectionList.length > 0 ? collectionList : undefined,
  };
}

async function fetchCatalogueFromSheet(): Promise<{ products: any[]; index: SlugIndex<any>; audit: SlugAudit }> {
  const res = await fetch(GOOGLE_SHEET_CSV_URL);
  if (!res.ok) {
    throw new Error(`Google Sheets CSV fetch failed: ${res.status}`);
  }
  const text = await res.text();
  const rows = parseCsv(text);

  const audit = createSlugAudit();
  const products: any[] = [];

  if (rows.length >= 2) {
    const header = rows[0];
    // The availability filter lives inside mapCsvRowToProduct, so the audit
    // only ever sees products that are actually servable. Running it earlier
    // would report slugs for rows that never reach a URL.
    for (let i = 1; i < rows.length; i++) {
      const product = mapCsvRowToProduct(rows[i], header, audit);
      if (product) products.push(product);
    }
  }

  audit.collisions = detectSlugCollisions(products);
  for (const line of describeSlugAudit(audit)) {
    console.warn(line);
  }

  return { products, index: buildSlugIndex(products), audit };
}

async function getCatalogue(): Promise<any[]> {
  const now = Date.now();
  if (catalogueCache && catalogueCache.expiresAt > now) {
    return catalogueCache.products;
  }

  try {
    const { products, index, audit } = await fetchCatalogueFromSheet();
    catalogueCache = {
      products,
      index,
      audit,
      expiresAt: now + CATALOGUE_TTL_MS,
    };

    const refreshTimer = setTimeout(() => {
      catalogueCache = null;
      getCatalogue().catch(() => {});
    }, CATALOGUE_TTL_MS);

    return products;
  } catch (err) {
    console.error('Catalogue fetch failed, using stale cache if available:', err);
    if (catalogueCache) {
      return catalogueCache.products;
    }
    return [];
  }
}

// Populates the slug index alongside the catalogue so the 301 below resolves in
// one pass. Rebuilt on every cache refresh rather than held as a module-level
// constant, so it can never drift from the products it indexes.
async function getSlugIndex(): Promise<SlugIndex<any>> {
  await getCatalogue();
  if (catalogueCache) return catalogueCache.index;
  return buildSlugIndex([]);
}

function buildCatalogSnippet(products: any[], limitPerCategory = 10): string {
  const grouped: Record<string, any[]> = {};

  for (const product of products) {
    const category = product.category || 'other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(product);
  }

  const lines: string[] = [];

  for (const [category, items] of Object.entries(grouped)) {
    const label = CATEGORY_LABEL_MAP[category] || category;
    const sorted = items
      .slice(0, limitPerCategory)
      .sort((a, b) => a.name.localeCompare(b.name));

    const names = sorted.map((p) => p.name).filter(Boolean);
    if (names.length > 0) {
      lines.push(`${label}: ${names.join(', ')}`);
    }
  }

  return lines.join('\n');
}

function extractChatJson(text: string): { reply: string; recommended_product_ids: string[] } {
  const trimmed = text.trim();

  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { reply: trimmed, recommended_product_ids: [] };
  }

  const jsonStr = jsonMatch[0];
  try {
    const parsed = JSON.parse(jsonStr);
    const reply = typeof parsed.reply === 'string' ? parsed.reply : trimmed;
    const ids = Array.isArray(parsed.recommended_product_ids) ? parsed.recommended_product_ids : [];
    return { reply, recommended_product_ids: ids };
  } catch {
    return { reply: trimmed, recommended_product_ids: [] };
  }
}

async function runGroqChat(message: string, history: Array<{ role: string; content: string }>, apiKey: string): Promise<{ reply: string; recommended_product_ids: string[]; fallback: boolean }> {
  const products = await getCatalogue();
  const catalog = buildCatalogSnippet(products, 10);

  const systemPrompt = `You are The Avenue Thirty shopping assistant. Use the catalog below to answer shopping questions.

Catalog:
${catalog}

Rules:
- Keep replies short: 1-2 sentences max. No long paragraphs or tables.
- If the user asks about a category, only recommend products from that category.
- If the user asks "What jewellery you've got?", reply with 1 sentence and recommend 1-3 matching products.
- If the user asks about skincare, only recommend skincare products.
- Never mix categories in one answer.
- Do NOT mention products that are not in the catalog.
- Return JSON with these keys: reply (string), recommended_product_ids (array of exact product names from the catalog).
- If unsure, return recommended_product_ids: [].

Examples:
User: "What jewellery you've got?"
Assistant: {"reply": "Here are a few pieces from our jewellery collection:", "recommended_product_ids": ["Vector Earrings", "Chic Gold Tone Heart Bracelet", "Personalized Name Necklace - Golden"]}

User: "Show me skincare"
Assistant: {"reply": "Here are our skincare picks:", "recommended_product_ids": ["Brighten Me Up Facewash", "SPF 50+ Sunscreen"]}`;

  const body = {
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message },
    ],
    temperature: 0.7,
    max_tokens: 256,
  };

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq API error: ${response.status} ${text}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content || !content.trim()) {
    const retryResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!retryResponse.ok) {
      const text = await retryResponse.text();
      throw new Error(`Groq API error: ${retryResponse.status} ${text}`);
    }

    const retryData = await retryResponse.json();
    const retryContent = retryData?.choices?.[0]?.message?.content;

    if (!retryContent || !retryContent.trim()) {
      throw new Error('Empty Groq response');
    }

    const { reply, recommended_product_ids } = extractChatJson(retryContent);
    return {
      reply: reply || '',
      recommended_product_ids,
      fallback: false,
    };
  }

  const { reply, recommended_product_ids } = extractChatJson(content);
  return {
    reply: reply || '',
    recommended_product_ids,
    fallback: false,
  };
}

async function createHubspotDeal(guestData: { name: string; phone: string; email?: string; city: string; address: string; totalAmount: number; itemsSummary: string }) {
  try {
    const token = process.env.HUBSPOT_ACCESS_TOKEN || '';
    if (!token) {
      console.error('HubSpot token missing');
      return { success: false, error: 'Missing HubSpot access token' };
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const nameParts = guestData.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    const contactResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        properties: {
          firstname: firstName,
          lastname: lastName,
          phone: guestData.phone,
          email: guestData.email || '',
          city: guestData.city,
          address: guestData.address,
          lifecyclestage: 'customer',
        },
      }),
    });

    if (!contactResponse.ok) {
      const text = await contactResponse.text();
      throw new Error(`HubSpot contact create failed: ${contactResponse.status} ${text}`);
    }

    const contactData = await contactResponse.json();
    const contactId = contactData.id;

    const dealResponse = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        properties: {
          dealname: `Deal - ${guestData.name} (${guestData.city})`,
          amount: guestData.totalAmount.toString(),
          dealstage: 'qualifiedtobuy',
          pipeline: 'default',
        },
      }),
    });

    if (!dealResponse.ok) {
      const text = await dealResponse.text();
      throw new Error(`HubSpot deal create failed: ${dealResponse.status} ${text}`);
    }

    const dealData = await dealResponse.json();
    const dealId = dealData.id;

    const associationResponse = await fetch(
      `https://api.hubapi.com/crm/v4/objects/deals/${dealId}/associations/default/contacts/${contactId}`,
      {
        method: 'PUT',
        headers,
      }
    );

    if (!associationResponse.ok) {
      const text = await associationResponse.text();
      throw new Error(`HubSpot association failed: ${associationResponse.status} ${text}`);
    }

    return { success: true, contactId, dealId };
  } catch (error: any) {
    console.error('HubSpot Sync Error:', error);
    return { success: false, error: error?.message || 'Unknown HubSpot error' };
  }
}

async function createSellerLead(lead: { brandName: string; contactName: string; phone: string; email?: string; category: string; message?: string }) {
  try {
    const token = process.env.HUBSPOT_ACCESS_TOKEN || '';
    if (!token) {
      console.error('HubSpot token missing');
      return { success: false, error: 'Missing HubSpot access token' };
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const nameParts = lead.contactName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    const contactResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        properties: {
          firstname: firstName,
          lastname: lastName,
          phone: lead.phone,
          email: lead.email || '',
          lifecyclestage: 'lead',
        },
      }),
    });

    if (!contactResponse.ok) {
      const text = await contactResponse.text();
      throw new Error(`HubSpot contact create failed: ${contactResponse.status} ${text}`);
    }

    const contactData = await contactResponse.json();
    const contactId = contactData.id;

    const dealResponse = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        properties: {
          dealname: `Seller Lead - ${lead.brandName} (${lead.category})`,
          amount: '0',
          dealstage: 'qualifiedtobuy',
          pipeline: 'default',
          description: lead.message || '',
        },
      }),
    });

    if (!dealResponse.ok) {
      const text = await dealResponse.text();
      throw new Error(`HubSpot deal create failed: ${dealResponse.status} ${text}`);
    }

    const dealData = await dealResponse.json();
    const dealId = dealData.id;

    const associationResponse = await fetch(
      `https://api.hubapi.com/crm/v4/objects/deals/${dealId}/associations/default/contacts/${contactId}`,
      {
        method: 'PUT',
        headers,
      }
    );

    if (!associationResponse.ok) {
      const text = await associationResponse.text();
      throw new Error(`HubSpot association failed: ${associationResponse.status} ${text}`);
    }

    return { success: true, contactId, dealId };
  } catch (error: any) {
    console.error('HubSpot Seller Lead Error:', error);
    return { success: false, error: error?.message || 'Unknown HubSpot error' };
  }
}

const app = express();

app.set('trust proxy', true);
app.use(express.json());

app.get('/api/catalogue', async (req, res) => {
  try {
    const products = await getCatalogue();
    res.json({ products, source: 'google-sheets' });
  } catch (err: any) {
    console.error('Catalogue endpoint error:', err?.message || err);
    res.status(500).json({ products: [], error: err?.message || 'Unknown error' });
  }
});

  app.get('/api/product/:id', async (req, res) => {
    try {
      const products = await getCatalogue();
      const product = products.find((p) => p.id === req.params.id);
      if (!product) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }
      res.json({ success: true, product });
    } catch (err: any) {
      console.error('Product endpoint error:', err?.message || err);
      res.status(500).json({ success: false, error: err?.message || 'Unknown error' });
    }
  });

  // Lets the sheet be fixed without a redeploy: blank Slug cells, cells that
  // were rewritten by normalisation, over-length cells, and duplicate slugs
  // with the winning SKU. Computed from live data, so it reflects exactly the
  // products the parser kept.
  app.get('/api/slug-audit', async (req, res) => {
    try {
      const products = (await getCatalogue()) as ProductLike[];
      const index = catalogueCache ? catalogueCache.index : buildSlugIndex(products);
      const audit = catalogueCache
        ? catalogueCache.audit
        : { ...createSlugAudit(), collisions: detectSlugCollisions(products) };

      res.json({
        totalProducts: products.length,
        uniqueSlugs: index.bySlug.size,
        blankSlugCells: audit.blankCells,
        computed: audit.computed,
        normalised: audit.normalised,
        overLength: audit.overLength,
        collisions: audit.collisions,
        warnings: describeSlugAudit(audit),
      });
    } catch (err: any) {
      console.error('slug-audit error:', err?.message || err);
      res.status(500).json({ success: false, error: err?.message || 'Unknown slug-audit error' });
    }
  });

  app.get('/api/merchant-feed', async (req, res) => {
    try {
      const products = await getCatalogue();
      const origin = resolveOrigin(`${req.protocol}://${req.get('host')}`);

      const escapeXml = (value: string) =>
        value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

      const rows = products.map((p: any) => {
        const availability =
          p.availability === 'in_stock' ||
          p.availability === 'preorder' ||
          p.availability === 'backorder'
            ? p.availability
            : 'out_of_stock';

        return [
          // The feed `id` column stays the SKU: a feed identifier should not
          // churn when the URL slug changes.
          escapeXml(p.id || p.name),
          escapeXml(p.name),
          escapeXml(p.description || ''),
          escapeXml(`${origin}${productPath(p)}`),
          escapeXml(p.imageUrl || ''),
          availability,
          `${p.priceMonthly} PKR`,
          'new',
          escapeXml((p.collections || []).join(';')),
        ].join('\t');
      });

      const header = 'id\ttitle\tdescription\tlink\timage_link\tavailability\tprice\tcondition\tbrand';
      const xml = [header, ...rows].join('\n');

      res.status(200).set({ 'Content-Type': 'text/tab-separated-values; charset=utf-8' }).send(xml);
    } catch (err: any) {
      console.error('Merchant feed error:', err?.message || err);
      res.status(500).json({ success: false, error: err?.message || 'Unknown merchant feed error' });
    }
  });

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body as { message?: string; history?: Array<{ role: string; content: string }> };

    if (!message || !message.trim()) {
      return res.status(400).json({ fallback: true, error: 'Empty message' });
    }

    const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ fallback: true, error: 'Missing GROQ_API_KEY' });
    }

    const result = await runGroqChat(message, history || [], apiKey);

    res.json(result);
  } catch (err: any) {
    console.error('Chat endpoint error:', err?.message || err);
    res.status(500).json({ fallback: true, error: err?.message || 'Unknown error' });
  }
});

app.post('/api/checkout', async (req, res) => {
  try {
    const { name, phone, email, city, address, totalAmount, itemsSummary } = req.body;

    if (!name || !phone || !city || !address || totalAmount === undefined || !itemsSummary) {
      return res.status(400).json({ success: false, error: 'Missing required checkout fields' });
    }

    const result = await createHubspotDeal({
      name,
      phone,
      email: email || '',
      city,
      address,
      totalAmount,
      itemsSummary,
    });

    res.json(result);
  } catch (err: any) {
    console.error('Checkout endpoint error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Unknown checkout error' });
  }
});

app.post('/api/sell', async (req, res) => {
  try {
    const { brandName, contactName, phone, email, category, message } = req.body;

    if (!brandName || !contactName || !phone || !category) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const result = await createSellerLead({
      brandName,
      contactName,
      phone,
      email: email || '',
      category,
      message: message || '',
    });

    res.json(result);
  } catch (err: any) {
    console.error('Sell endpoint error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Unknown sell error' });
  }
});

app.get('/api/location/detect', async (req, res) => {
  try {
    const apiKey = process.env.BDC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, error: 'Missing BDC_API_KEY' });
    }

    const response = await fetch(`https://api.bigdatacloud.net/data/ip-geolocation?key=${encodeURIComponent(apiKey)}`);
    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ success: false, error: `BigDataCloud API error: ${response.status}` });
    }

    const data = await response.json();
    const countryCode = (data?.countryCode || '').trim().toUpperCase();
    if (countryCode && countryCode !== 'PK') {
      return res.status(200).json({
        success: false,
        error: `Detected country is ${countryCode}. Please select your Pakistan city manually.`,
        city: '',
        postalCode: '',
        countryCode,
      });
    }

    res.json({
      success: true,
      city: data?.location?.city || data?.city || '',
      postalCode: data?.location?.postalCode || data?.postalCode || '',
      countryCode,
    });
  } catch (err: any) {
    console.error('Location detection error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Unknown location detection error' });
  }
});

app.get('/api/location/reverse-geocode', async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    const apiKey = process.env.BDC_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ success: false, error: 'Missing BDC_API_KEY' });
    }

    const lat = typeof latitude === 'string' ? latitude.trim() : '';
    const lng = typeof longitude === 'string' ? longitude.trim() : '';

    if (!lat || !lng) {
      return res.status(400).json({ success: false, error: 'Missing latitude or longitude' });
    }

    const response = await fetch(
      `https://api-bdc.net/data/reverse-geocode?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&localityLanguage=en&key=${encodeURIComponent(apiKey)}`
    );

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ success: false, error: `Reverse geocode failed: ${response.status}` });
    }

    const data = await response.json();
    const countryCode = (data?.countryCode || '').trim().toUpperCase();
    if (countryCode && countryCode !== 'PK') {
      return res.status(200).json({
        success: false,
        error: `Detected country is ${countryCode}. Please select your Pakistan city manually.`,
        city: data?.city || data?.locality || '',
        postalCode: data?.postalCode || '',
        countryCode,
      });
    }

    res.json({
      success: true,
      city: data?.city || data?.locality || '',
      postalCode: data?.postalCode || '',
      countryCode,
    });
  } catch (err: any) {
    console.error('Reverse geocode error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Unknown reverse geocode error' });
  }
});

app.get('/robots.txt', async (req, res) => {
  try {
    const origin = resolveOrigin(`${req.protocol}://${req.get('host')}`);
    res
      .status(200)
      .set({ 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' })
      .send(buildRobotsTxt(origin));
  } catch (err: any) {
    console.error('robots.txt error:', err?.message || err);
    res.status(500).set({ 'Content-Type': 'text/plain; charset=utf-8' }).send('User-agent: *\nAllow: /\n');
  }
});

app.get('/sitemap.xml', async (req, res) => {
  try {
    const origin = resolveOrigin(`${req.protocol}://${req.get('host')}`);
    const products = (await getCatalogue()) as ProductLike[];
    res
      .status(200)
      .set({ 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' })
      .send(buildSitemapXml(origin, products));
  } catch (err: any) {
    console.error('sitemap.xml error:', err?.message || err);
    res
      .status(500)
      .set({ 'Content-Type': 'application/xml; charset=utf-8' })
      .send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
});

// Retired collection slugs -> their surviving replacement.
//
// A collection removed from the registry would otherwise still answer 200 with
// "Collection not found", which is a soft-404: an indexed URL that reports
// success while carrying nothing. This runs before the product redirect because
// it needs no catalogue, so it cannot be delayed by a slow or failing Google
// Sheets fetch.
app.get('/:retiredSlug', (req: any, res: any, next: any) => {
  const target = resolveRetiredCollectionRedirect(req.path);
  if (!target) return next();
  return res.redirect(301, target);
});

// Legacy SKU product URLs -> the slug URL, as a real 301.
//
// Registered ahead of the SPA fallback so the redirect is an HTTP status a
// crawler and a cold load see, not a client-side navigate(). Only a numeric id
// is a redirect candidate, and never a path that already equals the product's
// own canonical URL, so there is no loop and a mistyped type URL is left to
// stay noindex.
app.get('/product/*', async (req: any, res: any, next: any) => {
  try {
    const index = await getSlugIndex();
    const segments = req.path.split('/').filter((segment: string) => segment.length > 0);
    const target = resolveProductRedirect(index, segments);
    if (!target) return next();
    return res.redirect(301, target);
  } catch (err: any) {
    console.error('Product redirect error:', err?.message || err);
    return next();
  }
});

// SPA fallback. Renders index.html with route-specific title, description,
// canonical, robots, Open Graph, JSON-LD, and the GA4 snippet injected.
app.get('*', async (req, res) => {
  const indexPath = path.join(process.cwd(), 'dist', 'index.html');
  try {
    const origin = resolveOrigin(`${req.protocol}://${req.get('host')}`);
    const html = fs.readFileSync(indexPath, 'utf-8');
    const products = (await getCatalogue()) as ProductLike[];
    const meta = resolveSEOMetadata(req.path, products, origin);

    res.status(200).set({ 'Content-Type': 'text/html' }).send(injectSEO(html, meta));
  } catch (err) {
    console.error('SEO injection failed, serving plain index.html', err);
    res.sendFile(indexPath);
  }
});

export default async (req: any, res: any) => {
  app(req, res);
};
