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

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

  app.use(express.json());

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

  function buildCatalog(): string {
    const fs = require('fs');
    const csvPath = path.join(process.cwd(), 'src/assets/catalogue_csv/accessories_jewellery_100_products.csv');
    const text = fs.readFileSync(csvPath, 'utf8');

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

    const header = rows[0];
    const nameIdx = header.indexOf('Name');

    const lines: string[] = [];
    for (let i = 1; i < rows.length; i++) {
      const name = rows[i][nameIdx] || '';
      if (name) lines.push(`- ${name}`);
    }

    return lines.join('\n');
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
