import { Product } from '../types';

export interface ScoredProduct {
  product: Product;
  score: number;
  reason: 'same-type' | 'same-category' | 'fallback';
}

export const RECOMMENDER_WEIGHTS = {
  typeMatch: 100,
  sameCategory: 40,
  familyMatch: 25,
  collectionTag: 15,
  collectionTagCap: 30,
} as const;

// Colours and materials. These dominate document frequency across the
// catalogue (black 40, brown 31, choco 18, beige 17), so they must be excluded
// before picking a family key -- otherwise "Grace Beige" keys on `beige` and
// every beige product becomes one family.
const COLOR_TOKENS = new Set([
  'black', 'brown', 'choco', 'chocolate', 'beige', 'green', 'maroon', 'red',
  'pink', 'white', 'blue', 'grey', 'gray', 'blackish', 'putty', 'gold', 'golden',
  'silver', 'lilac', 'purple', 'navy', 'khaki', 'tan', 'cream', 'ivory', 'peach',
  'yellow', 'orange', 'mustard', 'teal', 'cyan', 'burgundy', 'wine', 'coral',
  'pearl', 'gilded', 'metallic', 'bronze', 'copper', 'rose', 'off', 'dark',
  'light', 'multicolour', 'multicolor',
]);

// Product-noun and marketing words. Never a family key: they describe the
// category, not the specific product, so keying on them would merge
// unrelated products into one family.
const GENERIC_TOKENS = new Set([
  'bag', 'bags', 'pack', 'packs', 'pcs', 'pc', 'piece', 'pieces', 'set', 'sets',
  'of', 'and', 'the', 'for', 'with', 'in', 'a', 'an', 'new', 'fashion', 'style',
  'women', 'womens', 'men', 'mens', 'kids', 'children', 'toy', 'toys', 'ring',
  'rings', 'necklace', 'necklaces', 'bracelet', 'bracelets', 'earrings',
  'earring', 'bangle', 'bangles', 'anklet', 'anklets', 'pendant', 'chain',
  'chains', 'diy', 'game', 'games', 'diffuser', 'dinosaur', 'bow', 'ribbon',
  'heart', 'facewash', 'wash', 'face', 'skin', 'hair', 'makeup', 'brush', 'kit',
  'combo', 'mini', 'nova', 'chic', 'delicate', 'elegant', 'personalized',
  'personalised', 'classic', 'trendy', 'luxury', 'premium', 'quality',
  'fancy', 'cute', 'beautiful', 'gift', 'gifts', 'my', 'me', 'up', 'size',
  'tote', 'duffel', 'backpack', 'crossbody', 'shoulder', 'laptop', 'puffed',
]);

const PRICE_BANDS: Array<[number, number]> = [
  [0.1, 30],
  [0.2, 20],
  [0.4, 10],
];

const MAX_COLLECTION_TAG_SCORE = RECOMMENDER_WEIGHTS.collectionTagCap;
const MAX_NAME_OVERLAP_SCORE = 20;
const MAX_DISCOUNT_SCORE = 5;

function effectivePrice(product: Product): number {
  const price = product.priceMonthly;
  return Number.isFinite(price) && price > 0 ? price : 0;
}

function tokenizeName(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z ]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0 && !/^\d+$/.test(word));
}

function isUsableFamilyToken(token: string): boolean {
  return !COLOR_TOKENS.has(token) && !GENERIC_TOKENS.has(token) && token.length > 2;
}

/**
 * Variant-family key: the most catalogue-distinctive token in the product name.
 * Colour and generic product-noun tokens are never eligible, so "Alexa 3 Pcs
 * Lilac" resolves to `alexa` rather than `lilac`, and "Grace Beige" resolves to
 * `grace` rather than `beige`. Returns null when no distinctive token exists,
 * which disables the hard exclusion for that product.
 */
export function inferFamilyKey(product: Product, documentFrequency: Map<string, number>): string | null {
  let best: string | null = null;
  let bestFrequency = -1;

  for (const token of tokenizeName(product.name)) {
    if (!isUsableFamilyToken(token)) continue;
    const frequency = documentFrequency.get(token) ?? 0;
    if (frequency > bestFrequency) {
      best = token;
      bestFrequency = frequency;
    }
  }

  return best;
}

export function buildDocumentFrequency(products: Product[]): Map<string, number> {
  const frequency = new Map<string, number>();
  for (const product of products) {
    for (const token of new Set(tokenizeName(product.name))) {
      frequency.set(token, (frequency.get(token) ?? 0) + 1);
    }
  }
  return frequency;
}

function priceProximityScore(a: number, b: number): number {
  if (a <= 0 || b <= 0) return 0;
  const ratio = Math.abs(a - b) / Math.max(a, b);
  for (const [tolerance, points] of PRICE_BANDS) {
    if (ratio <= tolerance) return points;
  }
  return 0;
}

function nameOverlapScore(a: string, b: string): number {
  const tokensA = new Set(tokenizeName(a));
  const tokensB = new Set(tokenizeName(b));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection += 1;
  }

  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : (intersection / union) * MAX_NAME_OVERLAP_SCORE;
}

function collectionTagScore(a: Product, b: Product): number {
  const tagsA = a.collections ?? [];
  const tagsB = b.collections ?? [];
  if (tagsA.length === 0 || tagsB.length === 0) return 0;

  let shared = 0;
  for (const tag of tagsA) {
    if (tagsB.includes(tag)) shared += 1;
  }

  return Math.min(shared * RECOMMENDER_WEIGHTS.collectionTag, MAX_COLLECTION_TAG_SCORE);
}

function discountDepthScore(candidate: Product): number {
  if (!candidate.originalPrice || candidate.originalPrice <= 0) return 0;
  if (candidate.priceMonthly >= candidate.originalPrice) return 0;
  const depth = (candidate.originalPrice - candidate.priceMonthly) / candidate.originalPrice;
  return Math.min(Math.max(depth, 0), 1) * MAX_DISCOUNT_SCORE;
}

/**
 * Stable, render-independent hash used to seed the rotation. Must never be
 * Math.random(): the recommended set has to be identical across re-renders and
 * between server and client render.
 */
function hashId(id: string): number {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function scoreCandidate(
  viewed: Product,
  candidate: Product,
  familyKey: string | null,
  documentFrequency: Map<string, number>
): number {
  let score = 0;

  if (
    viewed.typeSlug &&
    candidate.typeSlug &&
    viewed.typeSlug === candidate.typeSlug
  ) {
    score += RECOMMENDER_WEIGHTS.typeMatch;
  }

  if (candidate.category === viewed.category) {
    score += RECOMMENDER_WEIGHTS.sameCategory;
  }

  if (familyKey && inferFamilyKey(candidate, documentFrequency) === familyKey) {
    score += RECOMMENDER_WEIGHTS.familyMatch;
  }

  score += priceProximityScore(effectivePrice(viewed), effectivePrice(candidate));
  score += nameOverlapScore(viewed.name, candidate.name);
  score += collectionTagScore(viewed, candidate);
  score += discountDepthScore(candidate);

  return score;
}

const TIER_ORDER: Array<ScoredProduct['reason']> = ['same-type', 'same-category', 'fallback'];

/**
 * Rotate within each relevance tier rather than across the whole list.
 * Rotating the flat list would let a rotation offset push a same-category item
 * above a same-type one, which reintroduces exactly the "recommend a handbag
 * while viewing a crossbody" failure the type weight exists to prevent. Within
 * a tier every candidate is already equivalent on the primary signal, so the
 * rotation still varies the row per product without weakening the ordering.
 */
function rotateAcrossTiers(items: ScoredProduct[], seed: number): ScoredProduct[] {
  const result: ScoredProduct[] = [];
  let remaining = seed;

  for (const tier of TIER_ORDER) {
    const tierItems = items.filter((entry) => entry.reason === tier);
    if (tierItems.length === 0) continue;
    result.push(...rotate(tierItems, remaining % tierItems.length));
    remaining = Math.floor(remaining / Math.max(tierItems.length, 1));
  }

  return result;
}

function rotate<T>(items: T[], seed: number): T[] {
  if (items.length < 2) return items;
  const offset = seed % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

/**
 * Content-based related products. Same sub-category first, never the same
 * product in a different colour, and always a full row via a widening cascade.
 * Relevance-based, not personalised: the catalogue has no behavioural data.
 */
export function getRelatedProducts(
  product: Product,
  products: Product[],
  limit: number = 4
): ScoredProduct[] {
  if (!product || limit <= 0) return [];

  const documentFrequency = buildDocumentFrequency(products);
  const familyKey = inferFamilyKey(product, documentFrequency);

  const scored: ScoredProduct[] = [];
  for (const candidate of products) {
    if (candidate.id === product.id) continue;

    // Hard exclusion: never recommend the same product family, which in this
    // catalogue is how a different colourway of the same item is identified
    // (Alexa 3 Pcs appears 13 times in different colours, no Parent SKU set).
    if (familyKey && inferFamilyKey(candidate, documentFrequency) === familyKey) continue;

    const sameType = Boolean(
      product.typeSlug && candidate.typeSlug && product.typeSlug === candidate.typeSlug
    );
    const sameCategory = candidate.category === product.category;

    if (!sameType && !sameCategory) continue;

    scored.push({
      product: candidate,
      score: scoreCandidate(product, candidate, familyKey, documentFrequency),
      reason: sameType ? 'same-type' : 'same-category',
    });
  }

  scored.sort((a, b) => (b.score - a.score) || a.product.id.localeCompare(b.product.id));

  if (scored.length < limit) {
    const seen = new Set(scored.map((entry) => entry.product.id));
    const fallback: ScoredProduct[] = [];
    for (const candidate of products) {
      if (candidate.id === product.id) continue;
      if (seen.has(candidate.id)) continue;
      if (familyKey && inferFamilyKey(candidate, documentFrequency) === familyKey) continue;

      fallback.push({
        product: candidate,
        score: scoreCandidate(product, candidate, familyKey, documentFrequency),
        reason: 'fallback',
      });
    }
    fallback.sort((a, b) => (b.score - a.score) || a.product.id.localeCompare(b.product.id));
    scored.push(...fallback);
  }

  return rotateAcrossTiers(scored, hashId(product.id)).slice(0, limit);
}
