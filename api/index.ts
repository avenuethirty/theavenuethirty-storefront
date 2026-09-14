import express from 'express';

// Inlined from src/utils/typeSlug.ts: this file must stay self-contained
// (no imports outside api/) or the Vercel serverless bundle breaks.
function toTypeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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
  const status = get('Status');

  if (!name) return null;

  if (status.toLowerCase() !== 'active') return null;

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

  return {
    id: String(sku || name),
    name,
    category: slugifyCategory(category) as any,
    tagline,
    typeSlug: tagline ? toTypeSlug(tagline) : undefined,
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

export default async (req: any, res: any) => {
  app(req, res);
};
