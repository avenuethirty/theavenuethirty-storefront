import express from 'express';
import { createServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createHubspotDeal, createSellerLead } from './src/server/hubspot';
import {
  buildRobotsTxt,
  buildSitemapXml,
  injectSEO,
  productPath,
  resolveOrigin,
  resolveRetiredCollectionRedirect,
  resolveSEOMetadata,
  type ProductLike,
} from './src/server/seo';
import { SHOP_CONFIG } from './src/config/shop';
import { toTypeSlug } from './src/utils/typeSlug';
import {
  buildSlugIndex,
  createSlugAudit,
  describeSlugAudit,
  detectSlugCollisions,
  readProductSlug,
  resolveProductRedirect,
  type SlugAudit,
} from './src/utils/productSlug';

dotenv.config();

const hubspotToken = process.env.HUBSPOT_ACCESS_TOKEN || '';
if (!hubspotToken) {
  console.warn('Missing HUBSPOT_ACCESS_TOKEN in environment');
} else {
  const masked = hubspotToken.length > 8 ? `${hubspotToken.slice(0, 4)}...${hubspotToken.slice(-4)}` : '***';
  console.log(`HubSpot token loaded: ${masked}`);
}

const GROQ_MODEL = SHOP_CONFIG.ai.model;
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

let catalogueCache: { products: any[]; index: ReturnType<typeof buildSlugIndex>; audit: SlugAudit; expiresAt: number } | null = null;
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

  // `id` is deliberately untouched: the SKU fallback, cart identity, and
  // /api/product/:id all depend on it. Only the URL segment changes.
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

async function fetchCatalogueFromSheet(): Promise<{ products: any[]; index: ReturnType<typeof buildSlugIndex>; audit: SlugAudit }> {
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
async function getSlugIndex(): Promise<ReturnType<typeof buildSlugIndex>> {
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

    const names = sorted
      .filter((p) => p.name)
      .map((p) => (p.priceMonthly ? `${p.name} (Rs. ${p.priceMonthly})` : p.name));
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

async function createApp() {
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
      const product = products.find((p: any) => p.id === req.params.id);
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
      const audit = catalogueCache ? catalogueCache.audit : { ...createSlugAudit(), collisions: detectSlugCollisions(products) };

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
- If the user gives a budget (e.g. "under Rs 2,000"), only recommend products at or below that price using the prices in the catalog.
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
  // A collection removed from SHOP_CONFIG.collections would otherwise still
  // answer 200 with "Collection not found", which is a soft-404: an indexed URL
  // that reports success while carrying nothing. This runs before the product
  // redirect because it needs no catalogue, so it cannot be delayed by a slow
  // or failing Google Sheets fetch.
  app.get('/:retiredSlug', (req, res, next) => {
    const target = resolveRetiredCollectionRedirect(req.path);
    if (!target) return next();
    return res.redirect(301, target);
  });

  // Legacy SKU product URLs -> the slug URL, as a real 301.
  //
  // Registered ahead of both the Vite middleware (dev) and express.static
  // (prod) so the redirect is an HTTP status a crawler and a cold load see,
  // not a client-side navigate(). Only a numeric id is a redirect candidate,
  // and never a path that already equals the product's own canonical URL, so
  // there is no loop and a mistyped type URL is left to stay noindex.
  app.get('/product/*', async (req, res, next) => {
    try {
      const index = await getSlugIndex();
      const segments = req.path.split('/').filter((segment) => segment.length > 0);
      const target = resolveProductRedirect(index, segments);
      if (!target) return next();
      return res.redirect(301, target);
    } catch (err: any) {
      console.error('Product redirect error:', err?.message || err);
      return next();
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // index:false so `/` reaches the catch-all and gets SEO tags instead of the
    // raw static index.html.
    app.use(express.static(distPath, { index: false }));

    app.get('*', async (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
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
  }

  return app;
}

// dist/server.cjs is the `npm run build` + `npm start` entrypoint, so it has to
// pass this check too or the production bundle exits without listening.
const entryScript = process.argv[1] || '';
const isMain = ['server.ts', 'server.js', 'server.cjs'].some((suffix) => entryScript.endsWith(suffix));

if (isMain) {
  createApp().then((app) => {
    const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}

export { createApp };
