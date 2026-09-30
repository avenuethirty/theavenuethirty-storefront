import { SHOP_CONFIG } from "../config/shop";
import { formatTypeLabel } from "../utils/typeSlug";
import { DEFAULT_SITE_TITLE, pageTitle, sanitizeSeoText, SITE_NAME } from "../utils/seoText";
import {
  buildSlugIndex,
  productPath,
  resolveProductSegment,
  type SlugIndex,
} from "../utils/productSlug";

const SCHEMA_CONTEXT = "https://schema.org/";
const MAX_META_DESCRIPTION = 158;
const MAX_ITEM_LIST = 50;

const SITE_DOMAIN = SHOP_CONFIG.domain;
export const DEFAULT_OG_IMAGE = SHOP_CONFIG.hero.image;
export const DEFAULT_DESCRIPTION =
  "Shop curated fashion, skincare, accessories, and lifestyle products at The Avenue Thirty. Fast cash-on-delivery shipping across Pakistan.";

export const GA4_SNIPPET = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-60DT6QKVL6"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-60DT6QKVL6');
</script>`;

export interface ProductLike {
  id: string;
  name: string;
  category: string;
  slug?: string;
  tagline?: string;
  typeSlug?: string;
  priceMonthly?: number;
  originalPrice?: number;
  imageUrl?: string;
  imageUrl2?: string;
  imageUrl3?: string;
  availability?: string;
  description?: string;
  collections?: string[];
}

export interface SEOMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  ogImage?: string;
  ogType?: "website" | "product";
  schema?: Record<string, unknown> | Array<Record<string, unknown>>;
  robots?: string;
}

export interface SEOCategory {
  slug: string;
  label: string;
  image?: string;
}

export interface CollectionMatch {
  collection?: string;
  category?: string;
  type?: string;
  minDiscountPct?: number;
  priceMin?: number;
  priceMax?: number;
  ratingMin?: number;
}

export interface SEOCollection {
  slug: string;
  title: string;
  subtitle?: string;
  image?: string;
  match: CollectionMatch;
}

export interface SEOStaticPage {
  path: string;
  title: string;
  description: string;
}

export const SEO_CATEGORIES: SEOCategory[] = SHOP_CONFIG.categories.map((category) => ({
  slug: category.slug,
  label: category.name,
  image: category.image,
}));

export const SEO_COLLECTIONS: SEOCollection[] = SHOP_CONFIG.collections.map((collection) => ({
  slug: collection.slug,
  title: collection.title,
  subtitle: collection.subtitle,
  image: collection.image,
  match: collection.match,
}));

// Mirrors matchCollection() in src/utils/collections.ts so collection pages can
// emit an ItemList of the products they actually render. Keep the two in sync.
export function matchCollectionProducts(products: ProductLike[], match: CollectionMatch): ProductLike[] {
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

export const SEO_STATIC_PAGES: SEOStaticPage[] = [
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

export function getCategoryMeta(slug: string): SEOCategory | undefined {
  return SEO_CATEGORIES.find((category) => category.slug === slug);
}

export function getCategoryLabelForSlug(slug: string): string {
  return getCategoryMeta(slug)?.label || slug;
}

export function getCollectionMeta(slug: string): SEOCollection | undefined {
  return SEO_COLLECTIONS.find((collection) => collection.slug === slug);
}

export function getStaticPageMeta(path: string): SEOStaticPage | undefined {
  return SEO_STATIC_PAGES.find((page) => page.path === path);
}

export function normalizePath(rawPath: string): string {
  const withLeading = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  const collapsed = withLeading.replace(/\/{2,}/g, "/");
  if (collapsed.length > 1 && collapsed.endsWith("/")) {
    return collapsed.replace(/\/+$/, "");
  }
  return collapsed;
}

// Re-exported so callers that already import the SEO module keep one import
// site for product URLs. The builder itself lives in src/utils/productSlug.ts
// because the client, the server, and the serverless mirror all need it and
// none of them can agree on a second copy.
export { productPath };

export function categoryPath(slug: string): string {
  return `/product/${slug}`;
}

export function typePath(slug: string, typeSlug: string): string {
  return `/product/${slug}/${typeSlug}`;
}

export function collectionPath(slug: string): string {
  return `/${slug}`;
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

export function generateProductSEO(product: ProductLike, origin: string, canonicalPath?: string): SEOMetadata {
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
        priceCurrency: SHOP_CONFIG.localization.currencyCode,
        availability: availabilityUrl(product.availability),
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@type": "Organization", name: SITE_NAME },
      },
    },
  };
}

export interface CategorySEOOptions {
  typeSlug?: string;
  typeLabel?: string;
  products?: ProductLike[];
}

export function generateCategorySEO(
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

export function generateHomeSEO(origin: string): SEOMetadata {
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
        sameAs: (Object.values(SHOP_CONFIG.social) as string[]).filter((value) => typeof value === "string"),
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

export interface CollectionSEOOptions {
  subtitle?: string;
  image?: string;
  products?: ProductLike[];
}

export function generateCollectionSEO(
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

export function generateStaticPageSEO(page: SEOStaticPage, origin: string): SEOMetadata {
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

export function resolveSEOMetadata(
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

export function renderSEOTags(meta: SEOMetadata): Record<string, string> {
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

export function injectSEO(html: string, meta: SEOMetadata): string {
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
export function resolveOrigin(requestOrigin: string): string {
  const configured = (process.env.SITE_URL || "").trim().replace(/\/+$/, "");
  return configured || requestOrigin;
}

interface SitemapEntry {
  path: string;
  priority: string;
  changeFreq: string;
}

export function buildSitemapEntries(products: ProductLike[]): SitemapEntry[] {
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

export function buildSitemapXml(origin: string, products: ProductLike[]): string {
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

export function buildRobotsTxt(origin: string): string {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "",
    `Sitemap: ${origin}/sitemap.xml`,
  ].join("\n");
}
