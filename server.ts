import express from 'express';
import { createServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { createHubspotDeal } from './src/server/hubspot';

dotenv.config();

const hubspotToken = process.env.HUBSPOT_ACCESS_TOKEN || '';
if (!hubspotToken) {
  console.warn('Missing HUBSPOT_ACCESS_TOKEN in environment');
} else {
  const masked = hubspotToken.length > 8 ? `${hubspotToken.slice(0, 4)}...${hubspotToken.slice(-4)}` : '***';
  console.log(`HubSpot token loaded: ${masked}`);
}

const GOOGLE_SHEET_CSV_URL = process.env.GOOGLE_SHEET_CSV_URL || 'https://docs.google.com/spreadsheets/d/1LkSL5CL0c80b_6iqVd8FH_uAnm3PwjZv4_Wh_R6xETo/export?format=csv';

const CATEGORY_SLUG_MAP: Record<string, string> = {
  'skincare & beauty': 'skincare_beauty',
  'accessories & jewellery': 'accessories',
  'bags & backpacks': 'bags_backpacks',
  'toys & kids': 'toys_kids',
};

let catalogueCache: { products: any[]; expiresAt: number } | null = null;
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

function mapCsvRowToProduct(row: string[], header: string[]): any | null {
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
  const description = get('Product description');
  const collections = get('Collections');

  if (!name) return null;

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

  return {
    id: String(sku || name),
    name,
    category: slugifyCategory(category) as any,
    tagline: type,
    priceMonthly,
    originalPrice,
    imageUrl: imageUrl || '',
    description: description || name,
    collections: collectionList.length > 0 ? collectionList : undefined,
  };
}

async function fetchCatalogueFromSheet(): Promise<any[]> {
  const res = await fetch(GOOGLE_SHEET_CSV_URL);
  if (!res.ok) {
    throw new Error(`Google Sheets CSV fetch failed: ${res.status}`);
  }
  const text = await res.text();
  const rows = parseCsv(text);
  if (rows.length < 2) return [];

  const header = rows[0];
  const products: any[] = [];

  for (let i = 1; i < rows.length; i++) {
    const product = mapCsvRowToProduct(rows[i], header);
    if (product) products.push(product);
  }

  return products;
}

async function getCatalogue(): Promise<any[]> {
  const now = Date.now();
  if (catalogueCache && catalogueCache.expiresAt > now) {
    return catalogueCache.products;
  }

  try {
    const sheetProducts = await fetchCatalogueFromSheet();
    catalogueCache = {
      products: sheetProducts,
      expiresAt: now + CATALOGUE_TTL_MS,
    };

    const refreshTimer = setTimeout(() => {
      catalogueCache = null;
      getCatalogue().catch(() => {});
    }, CATALOGUE_TTL_MS);

    return sheetProducts;
  } catch (err) {
    console.error('Catalogue fetch failed, using stale cache if available:', err);
    if (catalogueCache) {
      return catalogueCache.products;
    }
    return [];
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

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
    const catalog = buildCatalog();
    const systemPrompt = `You are The Avenue Thirty shopping assistant. You ONLY recommend from the catalog below.

Catalog:
${catalog}

Rules:
- Keep replies short: 1-2 sentences max. No long paragraphs or tables.
- If the user asks about a category, only show products from that category.
- If the user asks "What jewellery you've got?", reply with 1 sentence and recommend 1-3 matching products.
- If the user asks about skincare, only recommend skincare products.
- Never mix categories in one answer.
- Do NOT mention products that are not in the catalog.
- Return ONLY valid JSON with these exact keys: reply (string), recommended_product_ids (array of exact product names from the catalog).
- If unsure, return recommended_product_ids: [].

Examples:
User: "What jewellery you've got?"
Assistant: {"reply": "Here are a few pieces from our jewellery collection:", "recommended_product_ids": ["Vector Earrings", "Chic Gold Tone Heart Bracelet", "Personalized Name Necklace - Golden"]}

User: "Show me skincare"
Assistant: {"reply": "Here are our skincare picks:", "recommended_product_ids": ["Brighten Me Up Facewash", "SPF 50+ Sunscreen"]}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 256,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Groq API error: ${response.status} ${text}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty Groq response');

    try {
      const parsed = JSON.parse(content);
      return {
        reply: parsed.reply || '',
        recommended_product_ids: Array.isArray(parsed.recommended_product_ids) ? parsed.recommended_product_ids : [],
        fallback: false,
      };
    } catch {
      return { reply: content, recommended_product_ids: [], fallback: false };
    }
  }

  async function buildCatalog(): Promise<string> {
    try {
      const products = await getCatalogue();
      return products.map((p) => `- ${p.name}`).join('\n');
    } catch {
      return '';
    }
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

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
