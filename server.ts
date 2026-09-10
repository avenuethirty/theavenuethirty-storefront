import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import Groq from 'groq-sdk';
import { createHubspotDeal } from './src/server/hubspot';

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || '',
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const { complaint, chatHistory } = req.body;
      if (!complaint) {
        return res.status(400).json({ error: 'Skin complaint parameter is required' });
      }

      if (!process.env.GROQ_API_KEY) {
        return res.json({ fallback: true });
      }

      const systemPrompt = `You are The Avenue Thirty's Personal Shopping Assistant.
Your task is to analyze user messages and uploaded images, understand their intent, and recommend suitable products from The Avenue Thirty's catalog.

The Avenue Thirty Catalog (use these exact IDs in recommended_product_ids):
- av30-tea-tree-facewash | "Brighten Me Up Facewash" | $19.99 | Skincare | acne-prone, oily, dull skin
- av30-spf50 | "SPF 50+ Sunscreen" | $24.00 | Skincare | daily UV protection, sensitive skin, hyperpigmentation
- av30-glass-skin-bundle | "Flawless Glass Skin Bundle" | $45.00 | Skincare | all skin types, dullness, dehydration
- av30-dawn-link-bracelet | "Dawn Link Minimal Delicate Bracelet" | $32.00 | Jewellery | everyday wear, gifting, minimal style
- av30-luna-beige-bag | "Luna Beige Structured Bag" | $65.00 | Bag | work & weekend, minimal style, gifting
- av30-silky-hair-scrunchie | "Silky Hair Scrunchie Set" | $12.00 | Accessory | hair care, sleep, gifting

Rules:
- If the user uploads a skin or face photo, provide a skin assessment and recommend Skincare products.
- If the user uploads an outfit or accessory photo, analyze the colors and aesthetic and recommend matching Bags or Jewellery.
- Always answer in clear, professional English.
- Be helpful, empathetic, and concise.
- Explicitly mention which Avenue Thirty product(s) are recommended.
- Return ONLY valid JSON with these exact keys: reply (string), recommended_product_ids (array of product IDs from the catalog above).
- Include 1-3 product IDs in recommended_product_ids when relevant. Return [] if no product applies.
`;

      const response = await groq.chat.completions.create({
        model: 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: complaint },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1000,
      });

      const text = response.choices?.[0]?.message?.content || '{}';

      try {
        const parsed = JSON.parse(text);
        res.json({
          reply: parsed.reply || '',
          recommended_product_ids: parsed.recommended_product_ids || [],
          fallback: false,
        });
      } catch {
        res.json({ reply: text, recommended_product_ids: [], fallback: false });
      }
    } catch (err: any) {
      console.error('Groq Error:', err?.message, err?.response?.data || '');
      res.json({ fallback: true, error: err?.message });
    }
  });

  app.post('/api/checkout', async (req, res) => {
    try {
      const { name, phone, email, city, address, totalAmount, itemsSummary } = req.body;

      if (!name || !phone || !city || !address || totalAmount === undefined || !itemsSummary) {
        return res.status(400).json({ error: 'Missing required checkout fields' });
      }

      createHubspotDeal({
        name,
        phone,
        email,
        city,
        address,
        totalAmount,
        itemsSummary,
      }).catch((err) => {
        console.error('Background HubSpot sync error:', err);
      });

      res.json({ success: true });
    } catch (err: any) {
      console.error('Checkout endpoint error:', err);
      res.json({ success: true });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
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
